# 2. 成熟度鸿沟：灵光一闪 vs 工厂化输出

上一章回答的是“为什么必须有 harness”；这一章回答的是“成熟系统究竟在建设什么，才能从 demo 式聪明跨到工厂化输出”。这里会按重要性看四类样本：Claude Code 作为主分析对象，Codex 作为公开的开源结构样本，OpenClaw/Hermes 作为更广义 agent product 对照，而 OpenAI 1M LOC 案例则提供组织生产层的极端样本。那组内部失败案例不在这一章里做主角，它在下一章只作为反证样本出现。

“灵光一闪的天才”模式有这些特征：

- 成功依赖 prompt，且不可重复
- 状态来自聊天文本，而不是持久运行时状态
- 产物靠文件名或启发式猜测
- 长任务可以静默失败，却看起来像“完成”
- 会话切换导致状态串扰和 UI 混乱

软件工厂模式具有相反特征：

- 由契约定义输出和验证器
- 生命周期持久化且单调（`queued -> running -> verifying -> ready|failed`）
- 进度是事件化、类型化、可回放、有作用域的
- UI 是后端事实的投影，而不是独立事实
- 每次事故都有操作员级证据

Harness 就是这两种模式之间的转换机制。

## 2.1 Claude Code：harness 已经产品化

如果只看 Anthropic 对外讲 Claude Code 的方式，很容易把它误判成一个更强的 coding CLI。但把两条官方叙事并起来看，事情就变了。产品页直接写着，公司里 `"majority of code is now written by Claude Code"`，工程师的工作重心转向 architecture、product thinking 和 continuous orchestration。另一篇内部案例更有画面感：律师拿它做电话树系统，设计师开始做原本不太会碰的大块 state management 变更，数据科学家在“几乎不会 JavaScript/TypeScript”的情况下，用它搭出生产级可视化应用。[^claudecode-story-ch2]

这些故事的意义不是“人人都能一键写软件”，而是 Claude Code 已经越过了传统 coding assistant 的边界，开始充当一个更通用的任务 runtime：只要工作能被还原成“收集上下文 -> 规划 -> 调工具 -> 生成产物 -> 跑检查 -> 继续迭代”这条链，它就不再局限于写代码。下面再回到源码去看，就更容易理解它为什么必须长出那么多看似“与写代码无关”的运行时器官。

如果只看表面，Claude Code 像一个终端里的模型壳；但沿着 `Tool.ts -> query.ts -> services/tools -> services/compact -> sessionStorage -> AgentTool -> worktree` 这条链读下来，它其实是一套通用 agent runtime。2026-04-23 对本地源码镜像的审读里，仅会话持久化 `sessionStorage.ts` 就约 5105 行，全量 compaction `compact.ts` 约 1705 行，worktree 管理 `worktree.ts` 约 1519 行，另有 `StreamingToolExecutor.ts`、`diskOutput.ts`、`agentSummary.ts`、`resumeAgent.ts`、`teammateMailbox.ts` 等专门模块。这个体量本身就在说明：Claude Code 解决的主问题不是“如何让模型回答得更像程序员”，而是“如何让一个模型驱动的执行体在真实工作流里连续工作、可恢复、可委派、可审计”。[^claudecode-ch2]

### 2.1.1 从代码反推，Claude Code 在解决什么问题

从源码反推，Claude Code 的目标并不是把 IDE 补全做得更聪明，而是把“长任务代理”做成可运行的软件。这里的长任务不是一句 prompt 换一段代码，而是持续几十分钟甚至更久的工作：读仓库、读文档、调用 shell、改多类文件、向外部系统取数、拆给子 agent、等结果回来、恢复中断、继续推进。只要任务进入这个尺度，真正的问题就不再是“模型会不会写代码”，而是“这个执行体怎样管理状态、工具、副作用和恢复语义”。

这也是为什么 Claude Code 可以从 coding agent 长成更广义的 agent 工具。它面对的对象并不局限于源代码，而是更一般的“有输入材料、有产物目标、有验证步骤的工作单元”。写代码只是其中一种；写文章、写 slide、整理研究摘要、本地批处理、调用外部 MCP 服务，本质上都落在同一个工作流里：收集上下文，组织任务，修改产物，运行检查，必要时继续委派。

### 2.1.2 为什么它可以成为万用的 agent 工具

`ToolUseContext` 已经把 Claude Code 的真实抽象暴露出来了：它同时持有 `commands`、`tools`、`thinkingConfig`、`mcpClients`、`mcpResources`、`agentDefinitions`、`AppState`、`notifications`、`FileStateCache`、权限上下文、file history、content replacement state 等对象。换句话说，它的核心单元不是“代码文件”，而是“一个会用工具、会恢复状态、会调用外部系统、会继续派工的任务线程”。[^claudecode-ch2]

这就是它为何能从“写代码”自然扩展到“写文章、写 slide、做研究、驱动外部 agent”。工具目录里同时存在 `FileReadTool`、`FileWriteTool`、`FileEditTool`、`NotebookEditTool`、`WebSearchTool`、`WebFetchTool`、`MCPTool`、`ReadMcpResourceTool`、`AgentTool`、`SendMessageTool`、`TeamCreateTool`、`CronCreateTool` 等模块。对于运行时来说，代码、Markdown 文稿、slide 源文件、notebook、甚至一份需要通过 shell 渲染出来的中间产物，并没有本质差别；差别只在于任务提示、工具组合和验证方式。[^claudecode-ch2]

因此，Claude Code 的“万能”并不是来自一个无所不能的大 prompt，而是来自一个更底层、与领域相对无关的动作底座：文件系统、shell、web、MCP、子 agent、权限、恢复、摘要、回放。只要某类工作能被还原成这套动作组合，它就可以被装进同一个 agent runtime。

### 2.1.3 这种广度能力提出了哪些系统要求

第一，入口不能只有一个聊天框。`main.tsx` 在启动期同时装配 CLI、会话恢复、skills、plugins、MCP、policy limits、remote managed settings、direct connect、assistant mode、worktree mode、sandbox manager 等部件。源码里甚至明确写着 `main.tsx` 只是入口；真正的运行面在后面的状态、工具与会话系统里。这说明 Claude Code 把终端当成外壳，而不是唯一产品。[^claudecode-ch2]

第二，角色不能写死在主 prompt 里。`AgentTool.tsx` 允许调用者为子 agent 指定 `name`、`team_name`、`mode`、`isolation`、`cwd`、`run_in_background`；`loadAgentsDir.ts` 则允许 agent 定义声明 `tools`、`disallowedTools`、`model`、`effort`、`permissionMode`、`mcpServers`、`hooks`、`maxTurns`、`skills`、`memory`、`background`、`isolation` 等属性。也就是说，Claude Code 不是只有“一个智能体”，而是已经具备了角色模板、权限边界、工具包和记忆范围这些编排原语。[^claudecode-ch2]

第三，外部系统必须成为一等公民，而不是临时插件。`ToolUseContext` 直接持有 `mcpClients` 和 `mcpResources`；工具层里既有 MCP 调用，也有资源读取。对 Claude Code 来说，MCP 不是给 demo 做一点扩展，而是把外部能力接入统一运行面的方法。用户说“通过 CLI 调 API”或者“通过 MCP 调外部 agent”，在这套架构里其实是同一件事：都只是让当前任务线程获得另一个可调度能力源。[^claudecode-ch2]

第四，多 agent 不是多开几个窗口，而是要有真正的协调平面。`teammateMailbox.ts` 的文件头直接把自己定义为 `"File-based messaging system for agent swarms"`；它给每个 teammate 建 inbox，并用锁保证并发写入安全。再往上看，`AgentTool.tsx` 支持后台运行与独立 worktree，`agentSummary.ts` 周期性生成进度摘要。也就是说，Claude Code 已经把“谁在做什么、怎样传递中间信息、怎样让操作者看懂分工状态”做成了系统功能，而不是靠人类手工记忆。[^claudecode-ch2]

### 2.1.4 这种深度能力提出了哪些可靠性要求

广度回答的是“能做多少种事”；深度回答的是“能不能把一件事连续做完”。Claude Code 之所以不像普通聊天壳，关键在于它把深度问题拆成了若干个独立子系统。

第一是调度问题。`StreamingToolExecutor.ts` 文件头明确写着，`"Concurrent-safe tools can execute in parallel"`，而非并发安全工具必须独占执行。这意味着工具调用不再是模型吐一个就跑一个，而是进入一个知道并发语义、能处理取消和错误传播的调度器。写代码、写文稿、做数据整理时都一样：一旦涉及 shell、文件编辑、外部请求并发，调度器就比 prompt 更接近真实问题。[^claudecode-ch2]

第二是上下文压力问题。Claude Code 不是只在窗口快满时做一次“摘要压缩”，而是分层处理：`microCompact` 清理旧 tool result，`apiMicrocompact` 利用 provider 原生 context management，`compact.ts` 做更重的全量压缩并在压缩后补回最近文件和 skills；`query.ts` 主循环还把 auto compact、reactive compact、context collapse、tool summary、token budget 都连在一起。这里真正表达的工程判断是：长任务的上下文维护必须是持续策略，而不是临门一脚的 emergency button。[^claudecode-ch2]

第三是持久化与恢复问题。`sessionStorage.ts` 不是简单日志文件帮助函数，而是整套 transcript、metadata、progress、history 的保存与读取层。`resumeAgent.ts` 恢复时会过滤 unresolved tool uses、清理 orphaned thinking、重建 content replacement state，并尽可能恢复 worktree 路径。这意味着 Claude Code 默认假定任务会中断、会切换、会稍后继续；resume 不是附属功能，而是核心语义。[^claudecode-ch2]

第四是产物外置问题。`diskOutput.ts` 给每个任务分配独立 output file，并设置 5GB 上限；`agentSummary.ts` 每约 30 秒从子 agent transcript 中生成一次简短进度摘要。前者解决“长输出不能都塞回聊天上下文”，后者解决“操作者和父 agent 不能盯着原始日志看”。一旦任务开始写大型文档、生成 slide、跑长时间命令、并行开多个 agent，这两件事就都变成硬需求。[^claudecode-ch2]

第五是副作用隔离问题。`worktree.ts` 负责隔离工作目录，`fileStateCache.ts` 负责把文件状态变成受控工作记忆。前者避免不同任务互相踩工作区，后者避免每轮都把大量文件重新塞回模型上下文。对通用 agent 来说，这两层分别对应“在哪里动手”和“脑子里记住什么”；两者都必须被 harness 显式管理。[^claudecode-ch2]

### 2.1.5 工程结论：Claude Code 为什么足以成为主样本

从代码反推，Claude Code 的代表性不在于“Anthropic 做了一个很大的 coding CLI”，而在于它证明了通用 agent 的真正内核是什么。它之所以既能写代码，也能写文章、写 slide、做研究、调用 MCP 服务、再进一步编排多个 agent，并不是因为这些场景有某个神奇共用 prompt，而是因为它们共享同一组运行时需求：可调度工具、可恢复会话、可外置产物、可隔离副作用、可委派协作、可让人类看懂当前状态。[^claudecode-ch2]

一旦把问题定义为这组需求，Claude Code 就不再只是“把 LLM 接到终端上”。它已经把 harness 做成了产品本体。模型很重要，但真正让它成为万用 agent 的，是这套围绕模型长出来的控制系统。

## 2.2 Codex：把 harness 边界显式模块化

如果说 Claude Code 展示的是一个重产品化 agent runtime 的内部器官，那么 Codex 公开仓库展示的是另一条路线：把同类能力拆成显式的模块和协议。只看 `codex-rs/cli/src/main.rs` 就知道，它面对的绝不只是一个交互式 coding CLI；同一个入口同时暴露 `exec`、`review`、`mcp`、`plugin`、`mcp-server`、`app-server`、`sandbox`、`resume`、`fork`、`cloud`、`exec-server`、`features` 等子命令。问题定义已经从“给命令行加一个写码助手”上升到“如何把 agent runtime 复用到多种运行面”。[^codex-oss-ch2]

### 2.2.1 从代码反推，Codex 在解决什么问题

Codex 在解决的是一个更偏平台层的问题：怎样让同一个 agent 内核同时服务 CLI、IDE、桌面端、Web、非交互执行、云任务和插件生态，而不让每个表面各自发明一套状态机。Claude Code 更像把运行时做深，Codex 则更像先把边界讲清楚。它公开暴露的不是某个神秘 prompt，而是 thread、turn、tool、sandbox、approval、MCP、storage 这些可命名、可替换的部件。[^codex-oss-ch2]

这也是为什么 Codex 对本书很重要。Claude Code 告诉我们，一套通用 agent 产品最后会长出哪些器官；Codex 则告诉我们，这些器官怎样被抽象成一套更清楚的内核接口。前者偏“运行得起来”，后者偏“边界讲得清楚”。

### 2.2.2 为什么说 Codex 更像 agent 内核，而不是单一 CLI

`codex app-server` 的 README 写得非常直白：它是 Codex 用来 `"power rich interfaces"` 的接口，并且把整个系统抽象成三个核心原语：`Thread`、`Turn`、`Item`。`Thread` 是对话级持久单元，`Turn` 是一次交互的执行单元，`Item` 是会被保存并进入未来上下文的输入输出与副作用。这个抽象一旦成立，CLI 就只是众多客户端之一，而不是系统本体。[^codex-oss-ch2]

更关键的是，Codex 没有把这些对象留在内部实现里，而是通过 `thread/start`、`thread/resume`、`thread/fork`、`turn/start`、`turn/steer`、`turn/interrupt` 等接口公开出来。也就是说，它把“开始任务、继续任务、分叉任务、插话、打断”这些 agent 行为显式变成了协议能力。用户口中的“通过 CLI 调 API”，在 Codex 视角里只是一个前端；底下真正稳定的对象模型是 thread/turn/item。[^codex-oss-ch2]

### 2.2.3 这种广度能力在 Codex 里是如何实现的

Codex 的广度，首先来自它把能力面协议化。`app-server` README 的 API 概览里，除了 thread/turn 管理，还有 `command/exec`、`fs/readFile`、`fs/writeFile`、`fs/watch`、`skills/list`、`plugin/list`、`plugin/install`、`app/list`、`mcpServer/resource/read`、`mcpServer/tool/call`、`tool/requestUserInput` 等接口。换句话说，文件系统、命令执行、技能、插件、外部应用、MCP、人工输入都不是附会功能，而是与对话本身并列的协议面。[^codex-oss-ch2]

`codex-rs/tools/src/lib.rs` 则把这些能力进一步落成统一工具注册面：本地 shell、`apply_patch`、code mode、MCP 资源与工具、`request_user_input`、`spawn_agent`、`send_input`、`wait_agent`、`resume_agent`、`close_agent`、图像查看、计划更新，都通过一个清晰的工具层暴露出来。这意味着 Codex 不是把“多 agent”“MCP”“人类确认”当特殊 case 处理，而是把它们纳入同一工具经济里。对一个广义 agent 来说，这比“把更多知识塞进 prompt”更接近真正的可扩展性。[^codex-oss-ch2]

也正因为这样，Codex 可以自然承担从 coding 到 review，再到研究、批处理和外部系统编排的多种角色。只要任务能被表达为 thread/turn/item 上的历史，加上一组工具调用和少量人工干预，它就可以挂到同一个 runtime 里。广度不是来自模型知道所有领域，而是来自平台允许不同领域工作共用同一套控制栈。

### 2.2.4 这种深度能力在 Codex 里是如何模块化的

如果说 Claude Code 倾向于把深度能力沉到一个大而完整的产品里，Codex 的做法是把它们拆散为更清楚的模块。`thread-store` 在文件头直接把自己定义为 `"Storage-neutral thread persistence interfaces"`；`rollout` 则是 `"Rollout persistence and discovery for Codex session files"`。这两个短句很关键，因为它们清楚表明：持久化不是聊天 UI 的附属，而是 agent runtime 的独立层；并且这层不应该被绑死在某一种本地文件实现上。[^codex-oss-ch2]

同样的思路也体现在其他模块边界上。仓库单独拆出 `app-server`、`app-server-protocol`、`tools`、`thread-store`、`rollout`、`exec-server`、`sandboxing`、`process-hardening`、`mcp-server` 等 crate；根目录 `AGENTS.md` 又反复强调 crate 边界、sandbox 约束、MCP connection manager 和文档同步。它真正回答的是：当 agent 既广又深时，哪些责任必须成为清晰的所有权边界，才能避免整个系统退化成一个巨大且难以维护的核心包。[^codex-oss-ch2]

`docs/agents_md.md` 也说明了另一件事：连 `AGENTS.md` 这种“给 agent 的操作说明”都被当作正式能力层来设计，还考虑分层作用域与优先级。这和普通项目里把所有指令糊进一个系统提示完全不同。Codex 的选择是把文档注入、权限、持久化、工具注册、UI 连接协议全部做成可审计的显式结构，从而让 agent 行为更容易被不同客户端复用。[^codex-oss-ch2]

### 2.2.5 Claude Code 与 Codex 合起来说明了什么

从代码反推，Claude Code 和 Codex 实际上在回答同一类需求，只是切入点不同。Claude Code 证明：如果你真想让 agent 做长任务、带副作用、可恢复、可协作，你最后一定会长出 compaction、resume、disk output、mailbox、worktree、角色模板这些器官。Codex 证明：这些器官可以进一步抽象成 thread/turn/item、tool registry、thread store、rollout、sandbox、approvals、app-server 这样的边界，从而形成一个更清楚的 agent kernel。[^codex-oss-ch2]

因此，本书把 Claude Code 和 Codex 放在一起看，不是为了比较谁更强，而是为了看清同一条工程定律的两个侧面：一个侧面是产品化后的丰满器官，一个侧面是模块化后的清晰骨架。两者都在说明，harness 不是附属层，而是 agent 软件本体。

## 2.3 OpenClaw 与 Hermes：更广义 agent product 也在重复同一规律

OpenClaw 和 Hermes 不以 coding agent 为中心，但恰好证明 harness 不是 coding-only 现象。OpenClaw 把 Gateway 明确称为 control plane，核心围绕 sessions、channels、skills、routing、web surfaces 和安全边界展开；Hermes 则把 gateway、SQLite session store、FTS5 memory、skills、delegate tool、cron、MCP 与多种 terminal backend 放到同一运行面。二者共同点都不是“提示词写得更会”，而是把 session、memory、skills、gateway、cron、sub-agent 当作系统事实。[^openclaw-hermes-ch2]

对本书而言，OpenClaw 和 Hermes 只需要简单分析，因为它们不是最贴近“AI 软件工厂”的主样本；但它们非常有价值，因为它们说明一旦 agent 要跨渠道、跨时段、跨环境连续行动，control plane 一定会长出来。也就是说，harness 不是 coding agent 的偶然补丁，而是 agent product 普遍会演化出来的外层系统。[^openclaw-hermes-ch2]

## 2.4 OpenAI 1M LOC 案例真正说明了什么

相比 Claude Code 和 Codex 主要展示产品或仓库层面的运行时结构，OpenAI 的 1M LOC 案例展示的是组织生产层发生了什么变化：从 2025 年 8 月第一次提交到 2026 年 2 月，约五个月时间，三位工程师驱动 Codex 产出约 1M LOC、1500+ 个已合并 PR，平均每位工程师每天 3.5 个 PR，并宣称人类不直接写应用代码。[^openai-factory-ch2] 这个故事的重点不是“模型终于可以替代工程师”，而是工程师的工作对象上移了。

他们不再把主要时间花在逐行写业务代码，而是在设计让 agent 能持续产出正确代码的条件：

- 可复现开发环境，让 agent 看到的失败信号稳定可信。
- CI 强制架构约束，把“不要跨层依赖”这类口头纪律变成机器会挡的墙。
- 快速、密闭、agent 可运行的测试基础设施，让反馈能进入内循环。
- 精心设计的失败反馈，把堆栈追踪、diff、截图和裁剪后的日志变成 agent 能收敛的信号。
- `AGENTS.md` 作为目录，`docs/` 作为系统记录，避免把几十 KB 文档硬塞进每次上下文。

这五件事合在一起，才是“工厂化输出”的骨架。没有这些条件，1M LOC 只会变成 1M 行没人敢合的文本。

## 2.5 AGENTS.md 应该是目录，不是百科全书

对 `AGENTS.md` 更稳妥的处理方式，是把它视为短目录、不是长百科。它应该短、稳定、可常驻上下文，只放仓库定位、工具链版本、工作区拓扑、高频红线和指向 `docs/` 的目录。真正细节放在 `docs/` 里，按任务需要加载。Codex 的公开文档也明确把 `AGENTS.md` 当成一个单独的能力层，而不是把所有知识都塞进系统提示。[^agents-catalog-ch2]

反模式是把全部风格指南、API 手册、架构文档、on-call 流程塞进一个大 prompt。这样不仅浪费 token，更严重的是教会 agent 一种错误的上下文哲学：以为“上下文 = 曾经写下的全集”，而不是“上下文 = 当前任务需要的切片”。

## 2.6 “0% 人工审查”的边界

OpenAI 的极端案例不能直接搬到所有场景。内部工具链、非合规关键路径、风险自吸收时，可以把大量人工审查下沉到 CI、性质测试、结构化验证和指标门禁。医疗、金融、隐私、客户数据路径则不同：实名人工 reviewer、审计记录、变更控制和合规签字是事实要求，不是工程偏好。[^review-boundary-ch2]

因此大多数团队的目标都不该是追求“没有人看”，而是把人类从重复、低信号的逐行审查中解放出来，转向审查契约、门禁、失败分类和高风险边界。

## 2.7 把成熟样本压成全书的架构索引

如果把 Claude Code 的“器官”与 Codex 的“骨架”叠在一起，再把 OpenClaw / Hermes 的 control plane 经验作为侧证，可以把全书后续章节统一压成九个架构维度：

1. 事实流维度：session / thread / transcript 必须是独立、可恢复、可回放的持久层。
2. 生命周期维度：任务必须有单调、公开、跨表面一致的状态阶梯。
3. 能力平面维度：工具、shell、MCP、外部应用、人工输入都必须进入统一调度面。
4. 产物与验证维度：主产物、验证器、失败证据和终态裁决必须显式绑定。
5. 回放维度：实时流、历史流、刷新恢复和 UI 投影必须共享同一事实模型。
6. 隔离与恢复维度：worktree、resume、background task、disk output 这类机制必须成为运行时能力，而不是异常补丁。
7. 协作维度：sub-agent / swarm 需要角色、通信、权限、汇总与验证，而不是“多开几个窗口”。
8. 知识分层维度：`AGENTS.md`、docs、skills、memory 需要按常驻层、按需层、晋升层治理。
9. 操作员维度：dashboard、门禁、回滚、故障归因必须建立在同一条运行时事实流上。

第 4 章会先给出这九个维度如何组成最小可用 harness；第 5 到第 8 章分别展开能力平面、回放、操作员控制面和多 agent 编排；第 9 章把这些维度再上升为设计原则；第 10 到第 14 章则把原则压成路线图、边界、清单和收束。

下一章不再继续看成熟样本，而改用一组真实失败案例来回答另一个问题：当这些维度缺位时，系统具体会怎么坏。

[^claudecode-ch2]: 本章在此处根据 2026-04-23 对 Claude Code 本地源码镜像的结构审读，使用其 `Tool.ts`、`query.ts`、`main.tsx`、`services/tools/StreamingToolExecutor.ts`、`services/compact/*`、`tools/AgentTool/{AgentTool.tsx,loadAgentsDir.ts,resumeAgent.ts}`、`utils/{sessionStorage.ts,fileStateCache.ts,worktree.ts,teammateMailbox.ts}`、`utils/task/diskOutput.ts` 与 `services/AgentSummary/agentSummary.ts` 所体现的 tool context、主循环、MCP、技能/插件、子 agent、swarm mailbox、分层 compaction、resume、disk-backed output 和 worktree 机制；对应第 19 章参考文献 24。
[^claudecode-story-ch2]: 本章在此处综合 Anthropic Claude Code 产品页关于 “majority of code is now written by Claude Code” 的表述，以及 Anthropic 内部团队案例中关于律师、设计师和数据科学家使用 Claude Code 的故事，用来说明 Claude Code 已经超出传统 coding assistant 的边界；对应第 19 章参考文献 36、37。
[^codex-oss-ch2]: OpenAI, *openai/codex* 开源仓库。 本章在此处使用其 `codex-rs/cli/src/main.rs`、`codex-rs/app-server/README.md`、`codex-rs/app-server-protocol/src/protocol/v2.rs`、`codex-rs/tools/src/lib.rs`、`codex-rs/thread-store/src/lib.rs`、`codex-rs/rollout/src/lib.rs`、仓库根 `AGENTS.md` 与 `docs/agents_md.md` 中关于 CLI surfaces、Thread/Turn/Item、tool registry、thread persistence、rollout、sandbox、approvals 与 `AGENTS.md` 的公开结构；对应第 19 章参考文献 21。
[^openclaw-hermes-ch2]: 本章在此处综合 OpenClaw README 中关于 Gateway control plane、sessions、channels、skills 与 routing 的描述，以及 Hermes README/AGENTS 中关于 gateway、SQLite session store、memory、skills、delegate tool、cron 与 MCP 的结构；对应第 19 章参考文献 22、23。
[^openai-factory-ch2]: OpenAI, *Harness Engineering: Leveraging Codex in an Agent-First World.* 本章在此处使用其关于 1M LOC、1500+ merged PR、三位工程师与低人工写码比例的案例数字；对应第 19 章参考文献 2。
[^agents-catalog-ch2]: 本章在此处综合 Fowler、OpenAI 与 Codex 开源文档关于 `AGENTS.md` 作为短目录、细节下沉到 `docs/` 的做法；对应第 19 章参考文献 1、2、21。
[^review-boundary-ch2]: 本章在此处前半使用 OpenAI 关于极端自动化案例边界的表述；后半关于医疗、金融、隐私与客户数据路径的要求属于本文的工程外推；对应第 19 章参考文献 2。

---
