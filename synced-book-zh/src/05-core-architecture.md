# 4. 核心 Harness 架构：把样本反推成可复用总图

第 2 章给了正向样本，第 3 章给了失败叙事。把两者叠在一起看，可以得到一个比“某个仓库的实现细节”更稳定的结论：成熟 agent 系统最终都会收敛到一条共同的运行时总图。Claude Code 把这张总图长成了一套丰满器官；Codex 把它拆成了一套更清楚的模块边界。我们真正要吸收的不是它们的代码排版，而是这张总图背后的责任分工。[^claudecode-codex-spine-ch4]

把第 1 章的控制论语言落到运行时，可以先看五个角色：受控对象是 task / session / thread；目标与约束是用户目标、验收标准、artifact 契约、权限和预算；传感器是 tool 回执、文件变化、validator 结果、child summary 和 turn/item 事件；控制器负责继续、压缩、重试、派工、升级、打断、恢复；执行器则是 shell、文件系统、MCP、子 agent、worktree、外部 API 和 artifact 写入。

按这个框架回看 Claude Code，`ToolUseContext` 和 `query.ts` 是控制器入口，`StreamingToolExecutor.ts` 是执行器调度面，`sessionStorage.ts`、`fileStateCache.ts`、`agentSummary.ts`、`diskOutput.ts` 是传感器与状态保持层，`microCompact` / `compact.ts` / `resumeAgent.ts` / `worktree.ts` 则负责稳定性控制。Codex 把同一逻辑拆得更显式：`Thread` / `Turn` / `Item` 建模受控对象，`thread-store` 与 `rollout` 负责持久层，`app-server` 与 notifications 公开观测总线，`tools` registry、sandbox、approval、`thread/resume`、`thread/fork`、`turn/interrupt` 构成执行与稳定边界。[^claudecode-codex-spine-ch4]

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

关键规则只有一句：任何用户可见状态，都必须能沿着这张图一路回溯到同一条事实流。

为了避免后文一会儿讲 Claude Code 的产品器官，一会儿讲 Codex 的协议骨架，到第 9 章又突然换成抽象原则，这里先固定一套贯穿全书的运行时词汇。后面凡是提到 Claude Code 的 `sessionStorage.ts`、`StreamingToolExecutor.ts`、`agentSummary.ts`，或 Codex 的 `Thread` / `Turn` / `Item`、`tools`、`thread-store`、`app-server`，都只是在这张表里占不同位置。[^claudecode-codex-spine-ch4]

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

## 4.1 从失败反推，最小可用 harness 至少要回答什么问题

第 3 章那六类事故，其实只是在追问六个更底层的问题：

1. 这条任务事实到底写在哪？
2. 当前生命周期由谁裁决？
3. 工具、副作用和外部系统由谁调度？
4. 哪个产物算交付，谁来验证？
5. 刷新页面或切换会话后，用户还能不能看到同一套事实？
6. 出事时，操作员能不能在几十秒内拼出完整叙事？

后台任务进度 bug、状态漂移、会话污染，逼我们承认“聊天文本”不是事实流；产物契约缺口和验证器不完整，逼我们承认“模型说完成”不是终态；操作员盲区则逼我们承认，没有摘要、回放和证据组织，系统就算内部做对了很多事，也仍然无法运营。

因此，第 2 章末尾那九个维度并不是分析框架的装饰，而是从失败中被倒逼出来的最小系统边界。

## 4.2 生命周期与事实流是第一层骨架

公开状态机仍然应当保持简单：

- `queued`
- `running`
- `verifying`
- `ready`
- `failed`

内部当然可以存在更细粒度状态，但产品表面不应依赖一长串不断变化的内部标签。因为一旦 UI、API、replay、dashboard 各自解释一遍阶段，系统就会重新掉回第 3.2 节那种“每一层都没说错，但每一层说的不是同一件事”的状态。

如果用上面那张统一词汇表来重述，第 2 章里关于 Claude Code / Codex 的产品故事，首先都落在“事实流 + 生命周期”这两层。Codex 的 `Thread` / `Turn` / `Item` 把这件事表达得很清楚：线程承载持久历史，turn 承载一次执行，item 承载输入、输出和副作用。Claude Code 虽然没有用同一套名词，但 `query.ts`、`sessionStorage.ts`、`resumeAgent.ts`、`agentSummary.ts` 实际上也在做相同切分：一轮交互是什么、后台动作是什么、恢复时哪些事实要继续存在。成熟系统真正的共识不是术语相同，而是都不再把“一整段聊天记录”当成唯一状态机。[^claudecode-codex-spine-ch4]

## 4.3 能力平面、产物与验证：把能力、工作流和结果拆开

第 2 章里那些“Claude Code 为什么能既写代码又写文章、还能调 MCP 和多 agent”“Codex 为什么像 agent 内核”的故事，到了架构层其实只剩三件事：能力平面决定系统能做什么，工作流契约决定系统可以怎么做，产物与验证决定系统何时算完成。要把 Claude Code / Codex 的经验移植到别的系统，最重要的不是照搬模块名，而是先把契约分层：

```text
第 A 层：能力契约
  系统能调用哪些动作：shell、fs、web、MCP、sub-agent、human input

第 B 层：工作流契约
  这类任务允许什么路径：产物位置、spawn 规则、权限边界、验证前置条件

第 C 层：结果契约
  生命周期、主产物、验证结果、失败证据、终态裁决
```

很多团队的问题，不是“没有契约”，而是把三层揉成一团。比如把工具描述写进 prompt，把验证要求埋在脚本里，把最终产物靠文件名猜。这种做法短期能跑，长期一定会在第 3.4 和第 3.5 节那两类事故里出问题。

## 4.4 四支柱不是概念图，而是所有权边界

把上面三层契约落进系统实现，最后会自然收敛到四根支柱：

- Session：可恢复、可回放、append-only 的事实流。
- Harness：读取事实、驱动循环、调度工具、处理失败与升级的脑干。
- Tools：带权限、带 schema、带审计边界的动作词汇表。
- Verification：独立于生成器的判断层，负责裁决 ready / failed。

这四根支柱真正有价值的地方，在于它们对应了清晰的所有权边界。换句话说，九个维度描述的是运行时语义，四支柱描述的是团队如何持有这些语义。前者回答“系统必须有哪些真相边界”，后者回答“这些边界由谁实现、谁守住、谁裁决”。

Session 团队负责“什么是真实发生过的”；Harness 团队负责“系统下一步怎么行动”；Tools 负责人负责“允许系统做哪些副作用”；Verification 负责人负责“什么才算真的完成”。只要这四件事被混在一个 prompt、一个巨型 controller 或一个前端状态树里，团队很快就会失去可维护性。

Claude Code 在 `StreamingToolExecutor.ts`、`worktree.ts`、`sessionStorage.ts`、`diskOutput.ts`、`agentSummary.ts` 里，把这四根支柱做成产品器官；Codex 则在 `tools`、`thread-store`、`rollout`、`app-server-protocol` 里，把同一分工做成协议化边界。前者说明这些能力在真实产品里必须存在，后者说明这些能力可以被更清晰地组织。第 9 章所谓“设计原则”，本质上就是把这里这套器官与边界，再翻译成团队可长期复用的规范语言。[^claudecode-codex-spine-ch4]

## 4.5 朴素事实流为什么比“聪明状态”更可靠

Karpathy 的 autoresearch 经验提醒过一个很朴素但很重要的事实：长期知识系统最难的不是“让模型想起来”，而是 bookkeeping。`session.md` 提供人类可读叙事，`session.jsonl` 提供机器可回放事件。这个组合看起来不花哨，但它有一个决定性优势：模型会换，UI 会换，工具会换，事实流最好不要跟着频繁换。[^karpathy-bookkeeping-ch4]

很多系统一开始会尝试更“聪明”的状态层：把前端状态当事实、把聊天 transcript 当事实、把临时日志解析当事实、把缓存快照当事实。它们往往在 demo 阶段更轻，但一旦进入刷新恢复、跨设备继续、后台任务、子 agent 协作和事故排查，就会发现这些状态都不够硬。

因此，任务状态、SSE 回放、操作员仪表盘，本质上都应从同一条 append-only 事实流派生，而不是各自维护一份“看起来差不多”的影子状态。

## 4.6 这张总图怎样展开成后续章节

从这里开始，后面的章节不再新增一个个并列概念，而是沿着这张总图把关键维度展开：

- 第 5 章展开能力平面与生态桥接：为什么万用 agent 必然走向 MCP、外部应用和多语言工具。
- 第 6 章展开回放与用户事实：为什么 UI 只能投影事实，而不能自己发明生命周期。
- 第 7 章展开操作员控制面与发布真实性：为什么 dashboard、门禁和事故归因必须共享同一条事实流。
- 第 8 章展开 sub-agent / swarm：为什么多 agent 的关键不是并行，而是角色、隔离、通信和验证。
- 第 9 章再把同一套词汇表改写成九条设计原则和九组反模式，让“产品故事 -> 架构维度 -> 设计法则”成为一条连续论证，而不是三套散开的语言。

[^claudecode-codex-spine-ch4]: 本章在此处综合 Claude Code 本地源码镜像、*Dive into Claude Code* 中七组件与五层子系统分析，以及 Codex 开源仓库中 `app-server-protocol`、`tools`、`thread-store`、`rollout` 所体现的模块边界，用来反推 agent harness 的通用总图；对应第 19 章参考文献 21、24、41。
[^karpathy-bookkeeping-ch4]: Andrej Karpathy, *LLM Wiki.* 本章在此处使用其关于 autoresearch 双文件与 bookkeeping 的思路，说明 `session.md` + `session.jsonl` 这类事实流设计的价值；对应第 19 章参考文献 9。

---
