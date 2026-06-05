# 6. 核心 Harness 架构：把样本反推成可复用总图

第 4 章给了正向样本，第 5 章给了反面叙事。把两者叠在一起看，会浮出一个比“某个仓库怎么写的”更稳的结论：成熟的 agent 系统，最终都会收敛到同一张运行时总图。Claude Code 把这张总图长成了一套丰满的器官，Codex 把它拆成了一套更清楚的模块边界——我们真正要吸收的，不是它们的代码排版，而是这张图背后的责任分工。[^claudecode-codex-spine-ch6]

把第 3 章那套控制论语言落到运行时，先看五个角色。受控对象是 task / session / thread；目标与约束是用户目标、验收标准、artifact 契约、权限和预算；传感器是 tool 回执、文件变化、validator 结果、child summary 和 turn/item 事件；控制器负责继续、压缩、重试、派工、升级、打断、恢复；执行器则是 shell、文件系统、MCP、子 agent、worktree、外部 API 和 artifact 写入。按这个框架回看第 4 章那两个样本：Claude Code 的 `ToolUseContext` 和 `query.ts` 是控制器入口，`StreamingToolExecutor.ts` 是执行器调度面，`sessionStorage.ts`、`fileStateCache.ts`、`agentSummary.ts`、`diskOutput.ts` 是传感器与状态保持层，`microCompact` / `compact.ts` / `resumeAgent.ts` / `worktree.ts` 负责稳定性控制；Codex 把同一套逻辑拆得更显式——`Thread` / `Turn` / `Item` 建模受控对象，`thread-store` 与 `rollout` 是持久层，`app-server` 与 notifications 是观测总线，`tools` registry、sandbox、approval、`thread/resume`、`thread/fork`、`turn/interrupt` 构成执行与稳定边界。[^claudecode-codex-spine-ch6]

```text
用户任务 / 外部触发
        |
        v
Session / Thread 事实流
        |
        +--> 调度循环（turn / tool / sub-agent / resume）
        |
        +--> 能力平面（shell / fs / web / MCP / human input）
        |
        +--> 产物与验证（artifact policy / validator / evidence）
        |
        +--> 回放与摘要（API / SSE / dashboard / operator summary）
        v
终态裁决（ready / failed）与可追责证据
```

关键规则只有一句：**任何用户可见的状态，都必须能沿着这张图，一路回溯到同一条事实流。**

为了不让后文一会儿讲 Claude Code 的产品器官、一会儿讲 Codex 的协议骨架、到第 11 章又突然换成抽象原则，这里先把一套贯穿全书的运行时词汇钉死。后面凡是提到 `sessionStorage.ts`、`StreamingToolExecutor.ts`、`agentSummary.ts`，或 `Thread` / `Turn` / `Item`、`tools`、`thread-store`、`app-server`，都只是在下面这张表里占一个不同的位置而已。[^claudecode-codex-spine-ch6]

| 统一术语 | 它回答的问题 | Claude Code 的落点 | Codex 的落点 |
|---|---|---|---|
| 事实流 | 什么真实发生过 | `sessionStorage.ts`、transcript、`resumeAgent.ts` | `Thread` / `Turn` / `Item`、`thread-store`、`rollout` |
| 生命周期 | 系统现在推进到哪一步 | `query.ts` 主循环、compaction、resume 迁移 | `turn/start`、`turn/interrupt`、thread / turn notifications |
| 能力平面 | 系统能调用什么动作 | `ToolUseContext`、`StreamingToolExecutor.ts`、MCP、shell | `tools` registry、`command/exec`、`fs/*`、`mcpServer/tool/call` |
| 产物与验证 | 什么才算完成 | `diskOutput.ts`、产物外置、policy / hooks | artifact item、approval、sandbox、review / gate |
| 回放 | 用户与系统如何看到同一事实 | transcript、`agentSummary.ts`、resume | `app-server` notifications、rich interfaces |
| 隔离与恢复 | 长任务怎样不失稳 | `worktree.ts`、background task、resume | `thread/fork`、`thread/resume`、sandboxing |
| 协作 | 多 agent 如何分工 | `AgentTool.tsx`、`loadAgentsDir.ts`、`teammateMailbox.ts` | `spawn_agent`、`send_input`、`wait_agent` |
| 知识分层 | 经验怎样沉成长期资产 | skills、hooks、memory scope | `AGENTS.md`、`docs/agents_md.md`、plugins / skills |
| 操作员面 | 人怎样监督系统 | summary、disk output、恢复入口 | app-server rich interfaces、thread / project 视图 |

## 6.1 从失败反推：最小可用 harness 至少要回答什么

第 5 章那六类事故，其实是在替我们追问六个更底层的问题：这条任务的事实到底写在哪？当前的生命周期由谁裁决？工具、副作用和外部系统由谁调度？哪个产物算交付、谁来验证？刷新页面或切换会话之后，用户还能不能看到同一套事实？出了事，操作员能不能在几十秒内拼出完整叙事？

把六类事故按这六问归位，会看到它们成对地逼出同一类承认。后台任务进度 bug、状态漂移、会话污染，逼我们承认“聊天文本”不是事实流；产物契约缺口和验证器不完整，逼我们承认“模型说完成”不是终态；操作员盲区则逼我们承认——没有摘要、回放和证据组织，系统哪怕内部做对了很多事，也照样运营不起来。所以第 4 章末尾那九个维度，不是分析框架的装饰，而是被一次次失败**倒逼**出来的最小系统边界。

## 6.2 生命周期与事实流：第一层骨架

公开的状态机要刻意保持简单——`queued`、`running`、`verifying`、`ready`、`failed`，五级足矣。内部当然可以有更细的状态，但产品表面绝不该依赖一长串不断变化的内部标签。原因第 5.2 节已经演过：一旦 UI、API、replay、dashboard 各自解释一遍阶段，系统就掉回那种“每一层都没说错、可每一层说的不是同一件事”的假一致里。

用那张词汇表重述，第 4 章里 Claude Code / Codex 的产品故事，首先都落在“事实流 + 生命周期”这两层。Codex 把它说得最直白：线程承载持久历史，turn 承载一次执行，item 承载输入、输出和副作用。Claude Code 没用同一套名词，但 `query.ts`、`sessionStorage.ts`、`resumeAgent.ts`、`agentSummary.ts` 做的是同一种切分——一轮交互是什么、后台动作是什么、恢复时哪些事实必须继续存在。成熟系统真正的共识，不在术语相同，而在**都不再把“一整段聊天记录”当成唯一的状态机**。[^claudecode-codex-spine-ch6]

## 6.3 能力平面、产物与验证：把能力、工作流和结果拆开

第 4 章里那些“Claude Code 为什么能既写代码又写文章、还能调 MCP 和多 agent”“Codex 为什么像一个 agent 内核”的故事，到了架构层其实只剩三件事：能力平面决定系统**能做什么**，工作流契约决定它**可以怎么做**，产物与验证决定它**何时算完成**。要把这套经验移植到别处，最要紧的不是照搬模块名，而是先把契约分成三层：

```text
第 A 层：能力契约
  系统能调用哪些动作：shell、fs、web、MCP、sub-agent、human input

第 B 层：工作流契约
  这类任务允许什么路径：产物位置、spawn 规则、权限边界、验证前置条件

第 C 层：结果契约
  生命周期、主产物、验证结果、失败证据、终态裁决
```

很多团队栽的不是“没有契约”，而是把这三层揉成了一团：工具描述写进 prompt，验证要求埋在脚本里，最终产物靠文件名去猜。这么干短期能跑，长期一定会在第 5.4、5.5 节那两类事故里翻车——因为揉在一起的契约，没有任何一层能被单独地守住或验证。

## 6.4 四支柱不是概念图，是所有权边界

把上面三层契约落进实现，最后会自然收敛到四根支柱，而它们真正的价值，不在“是四个概念”，而在**各自对应一条清晰的所有权边界**。`Session` 是那条可恢复、可回放、只追加的事实流，由它回答“什么是真实发生过的”；`Harness` 是读取事实、驱动循环、调度工具、处理失败与升级的脑干，由它回答“系统下一步怎么行动”；`Tools` 是那张带权限、带 schema、带审计边界的动作词汇表，由它回答“允许系统做哪些副作用”；`Verification` 是独立于生成器的判断层，由它回答“什么才算真的完成”。

换句话说，九个维度描述的是运行时**语义**，四支柱描述的是团队怎样**持有**这些语义——前者回答“系统必须有哪些真相边界”，后者回答“这些边界由谁实现、谁守、谁裁决”。Session 团队负责“什么真实发生过”，Harness 团队负责“下一步怎么动”，Tools 负责人决定“允许哪些副作用”，Verification 负责人决定“什么算完成”。一旦这四件事被混进同一个 prompt、同一个巨型 controller、或同一棵前端状态树，可维护性很快就会丢。Claude Code 在 `StreamingToolExecutor.ts`、`worktree.ts`、`sessionStorage.ts`、`diskOutput.ts`、`agentSummary.ts` 里把这四根支柱做成了产品器官，Codex 在 `tools`、`thread-store`、`rollout`、`app-server-protocol` 里把同一分工做成了协议化边界——前者证明这些能力在真实产品里必须存在，后者证明它们可以被更清楚地组织。第 11 章所谓“设计原则”，本质上就是把这套器官与边界，再翻译成团队能长期复用的规范语言。[^claudecode-codex-spine-ch6]

## 6.5 为什么朴素的事实流，比“聪明的状态”更可靠

Karpathy 的 autoresearch 经验点过一个朴素却要命的事实：长期知识系统最难的不是“让模型想起来”，而是 bookkeeping（记账）。他的做法是一对文件——`session.md` 给人读，提供叙事；`session.jsonl` 给机器读，提供可回放的事件。这组合一点都不花哨，却有个决定性的好处：**模型会换，UI 会换，工具会换，唯独事实流最好别跟着频繁换。**[^karpathy-bookkeeping-ch6]

很多系统一开始忍不住要更“聪明”的状态层——把前端状态当事实、把聊天 transcript 当事实、把临时日志解析当事实、把缓存快照当事实。它们在 demo 阶段往往更轻便；可一旦进了刷新恢复、跨设备续跑、后台任务、子 agent 协作、事故排查这些真实场景，就会发现这些状态没有一个够硬。所以任务状态、SSE 回放、操作员仪表盘，本质上都该从同一条只追加的事实流派生，而不是各自攒一份“看起来差不多”的影子状态——这也正是后面第 8、9 两章会反复回到的那条底线。

## 6.6 这张总图，怎样展开成后面的章节

从这里起，后面的章节不再往外并列地堆概念，而是沿着这张总图，把它的关键维度一个个掀开。能力平面与生态桥接掀开成第 7 章，讲万用 agent 为什么必然走向 MCP、外部应用和多语言工具；回放与用户事实掀开成第 8 章，讲 UI 为什么只能投影事实、不能自己发明生命周期；操作员控制面掀开成第 9 章，讲 dashboard、门禁和事故归因为什么必须共享同一条事实流；sub-agent 与 swarm 掀开成第 10 章，讲多 agent 的关键从来不是并行，而是角色、隔离、通信和验证；最后第 11 章再把同一套词汇表，改写成九条设计原则和九组反模式，让“产品故事 → 架构维度 → 设计法则”连成一条论证，而不是三套各说各话的语言。

[^claudecode-codex-spine-ch6]: 本章在此处综合 Claude Code 本地源码镜像、*Dive into Claude Code* 中七组件与五层子系统分析，以及 Codex 开源仓库中 `app-server-protocol`、`tools`、`thread-store`、`rollout` 所体现的模块边界，用来反推 agent harness 的通用总图；对应第 21 章参考文献 21、24、41。
[^karpathy-bookkeeping-ch6]: Andrej Karpathy, *LLM Wiki.* 本章在此处使用其关于 autoresearch 双文件与 bookkeeping 的思路，说明 `session.md` + `session.jsonl` 这类事实流设计的价值；对应第 21 章参考文献 9。

---
