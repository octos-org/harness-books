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

2026 年 4 月的论文 *Dive into Claude Code* 给这条判断提供了一个更公开、可审计的版本。论文基于公开可获得的 TypeScript 源码分析，把 Claude Code 拆成五类价值目标：human decision authority、safety and security、reliable execution、capability amplification、contextual adaptability；再把它们落到十三条设计原则上。最重要的是，论文也得出同一个结构性结论：核心 agent loop 可以很简单，真正庞大的部分是 loop 周围的权限系统、上下文压缩、扩展机制、subagent 编排和 append-oriented session storage。[^claude-code-paper-ch2] 这正好把本书前面的 cache / 负反馈类比落成了具体系统：Claude Code 不是把 LLM 当作孤立智能体，而是把它放进一套持续限制、补偿、恢复和放大的控制环境里。

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

这也能和 *Dive into Claude Code* 的五层分解对上：surface layer 负责入口和渲染，core layer 负责 agent loop 与 compaction，safety/action layer 负责权限、hooks、工具、sandbox 和 subagent，state layer 负责 context assembly、session persistence、memory 和 sidechain transcripts，backend layer 负责 shell、MCP、remote execution 和外部资源。[^claude-code-paper-ch2] 也就是说，第 4 章后面总结出的“事实流、生命周期、能力平面、产物与验证、回放、隔离与恢复、协作、知识分层、操作员面”，不是本书凭空造出来的分类，而是可以在一个成熟产品的公开源码分析中看到对应物。

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

如果把 Codex 只看成一个开源 CLI，读法会偏得很厉害。官方产品线自己已经把问题说得很清楚。2025 年 5 月 OpenAI 首次公开 Codex 时，把它定义成 `"a cloud-based software engineering agent that can work on many tasks in parallel"`；每个任务都在独立、隔离、预装仓库的环境里运行。到了 2026 年 2 月发布 Codex app 时，OpenAI 又把同一条线往前推了一步：真正的挑战已经从“agent 能做什么”转向“人怎样在规模上去指挥、监督、协作多个 agent”，于是 app 被直接定义成 `"a command center for agents"`。[^codex-story-ch2]

这条演进线对本书很重要，因为它说明 Codex 的本体从来不是“终端里更聪明的补全工具”，而是一套跨云端、桌面、本地 CLI、IDE 和 rich interface 的 agent runtime。也正因为这样，开源仓库最值得读的不是某个 prompt，而是 OpenAI 愿意公开暴露出来的那些边界：线程、回合、事件、工具、存储、sandbox、approval、app-server、skills、agent control。这些不是实现细节，而是产品形态倒逼出来的内核语法。[^codex-story-ch2]

如果说 Claude Code 展示的是一个重产品化 agent runtime 的内部器官，那么 Codex 公开仓库展示的是另一条路线：把同类能力拆成显式的模块和协议。只看 `codex-rs/cli/src/main.rs` 就知道，它面对的绝不只是一个交互式 coding CLI；同一个入口同时暴露 `exec`、`review`、`mcp`、`plugin`、`mcp-server`、`app-server`、`sandbox`、`resume`、`fork`、`cloud`、`exec-server`、`features` 等子命令。问题定义已经从“给命令行加一个写码助手”上升到“如何把 agent runtime 复用到多种运行面”。[^codex-oss-ch2]

### 2.2.1 从代码反推，Codex 在解决什么问题

Codex 在解决的是一个更偏平台层的问题：怎样让同一个 agent 内核同时服务 CLI、IDE、桌面端、Web、非交互执行、云任务和插件生态，而不让每个表面各自发明一套状态机。OpenAI 在 GitHub README 里对 CLI 的一句定义就已经很说明问题：`"Codex CLI is a coding agent from OpenAI that runs locally on your computer."` 这句话的价值不在“本地”，而在“agent”。它暗示这不是 shell 包装器，而是一个可以带着工具、状态、权限和恢复语义运行在本机上的执行体。[^codex-story-ch2]

再往上接产品线，Codex cloud、Codex app、CLI、IDE extension 并不是彼此独立的四样东西，而是同一运行时在不同表面的展开：云端强调异步委派和隔离环境，本地强调与真实工作区、真实工具链和真实权限体系的贴身集成，桌面 app 则强调如何同时管理多个 agent、多个线程和更长时间的工作。Claude Code 更像把运行时做深，Codex 则更像先把边界讲清楚。它公开暴露的不是某个神秘 prompt，而是 thread、turn、tool、sandbox、approval、MCP、storage 这些可命名、可替换的部件。[^codex-oss-ch2][^codex-story-ch2]

这也是为什么 Codex 对本书很重要。Claude Code 告诉我们，一套通用 agent 产品最后会长出哪些器官；Codex 则告诉我们，这些器官怎样被抽象成一套更清楚的内核接口。前者偏“运行得起来”，后者偏“边界讲得清楚”。

### 2.2.2 为什么说 Codex 更像 agent 内核，而不是单一 CLI

`codex app-server` 的 README 写得非常直白：它是 Codex 用来 `"power rich interfaces"` 的接口，并且把整个系统抽象成三个核心原语：`Thread`、`Turn`、`Item`。`Thread` 是对话级持久单元，`Turn` 是一次交互的执行单元，`Item` 是会被保存并进入未来上下文的输入输出与副作用。这个抽象一旦成立，CLI 就只是众多客户端之一，而不是系统本体。[^codex-oss-ch2]

这和 OpenAI 在 Codex app 里讲的产品现实是完全对得上的。官方写得很直白：agents 在 separate threads 里按 project 组织，开发者要能在多个任务之间无缝切换而不丢上下文；app 内置 worktrees，让多个 agent 能在同一 repo 上并行工作而不互相踩状态。[^codex-story-ch2] 这实际上就是把 `Thread` / `Turn` / `Item` 这种协议对象，落实成多 agent 编排、项目切换和长任务监督的用户界面。

更关键的是，Codex 没有把这些对象留在内部实现里，而是通过 `thread/start`、`thread/resume`、`thread/fork`、`turn/start`、`turn/steer`、`turn/interrupt` 等接口公开出来。也就是说，它把“开始任务、继续任务、分叉任务、插话、打断”这些 agent 行为显式变成了协议能力。用户口中的“通过 CLI 调 API”，在 Codex 视角里只是一个前端；底下真正稳定的对象模型是 thread/turn/item。[^codex-oss-ch2]

### 2.2.3 这种广度能力在 Codex 里是如何实现的

Codex 的广度，首先来自它把能力面协议化。`app-server` README 的 API 概览里，除了 thread/turn 管理，还有 `command/exec`、`fs/readFile`、`fs/writeFile`、`fs/watch`、`skills/list`、`plugin/list`、`plugin/install`、`app/list`、`mcpServer/resource/read`、`mcpServer/tool/call`、`tool/requestUserInput` 等接口。换句话说，文件系统、命令执行、技能、插件、外部应用、MCP、人工输入都不是附会功能，而是与对话本身并列的协议面。[^codex-oss-ch2]

如果把这件事和 2026 年的 Codex app 产品叙事合起来看，意图就更明显了。OpenAI 已经明确说 Codex 正在从“写代码的 agent”变成“用代码把工作做完的 agent”：skills 不只是补充件，而是让它能去做信息收集、问题求解、写作、部署、文档、自动化等更广义知识工作的桥。[^codex-story-ch2] 这正是为什么开源仓库里会同时出现 `plugin`、`mcp-server`、`skills`、`app-server`、`spawn_agent` 这类看起来比“写代码”更大的部件。

`codex-rs/tools/src/lib.rs` 则把这些能力进一步落成统一工具注册面：本地 shell、`apply_patch`、code mode、MCP 资源与工具、`request_user_input`、`spawn_agent`、`send_input`、`wait_agent`、`resume_agent`、`close_agent`、图像查看、计划更新，都通过一个清晰的工具层暴露出来。这意味着 Codex 不是把“多 agent”“MCP”“人类确认”当特殊 case 处理，而是把它们纳入同一工具经济里。对一个广义 agent 来说，这比“把更多知识塞进 prompt”更接近真正的可扩展性。[^codex-oss-ch2]

也正因为这样，Codex 可以自然承担从 coding 到 review，再到研究、批处理和外部系统编排的多种角色。只要任务能被表达为 thread/turn/item 上的历史，加上一组工具调用和少量人工干预，它就可以挂到同一个 runtime 里。广度不是来自模型知道所有领域，而是来自平台允许不同领域工作共用同一套控制栈。

### 2.2.4 这种深度能力在 Codex 里是如何模块化的

如果说 Claude Code 倾向于把深度能力沉到一个大而完整的产品里，Codex 的做法是把它们拆散为更清楚的模块。`thread-store` 在文件头直接把自己定义为 `"Storage-neutral thread persistence interfaces"`；`rollout` 则是 `"Rollout persistence and discovery for Codex session files"`。这两个短句很关键，因为它们清楚表明：持久化不是聊天 UI 的附属，而是 agent runtime 的独立层；并且这层不应该被绑死在某一种本地文件实现上。[^codex-oss-ch2]

这种模块化不是学院式洁癖，而是被真实产品约束逼出来的。OpenAI 在 Codex app 文章里把要求列得很直：默认 secure by default，多个 agent 要能并行，worktree 要能隔离，线程要能跨 CLI / app / IDE 继承历史和配置，技能要能跨这些表面复用。[^codex-story-ch2] 一旦这些要求同时成立，系统就不可能继续靠一个会话对象加一堆隐式状态往前堆，而必须把持久化、通知总线、sandbox、approval、tooling、线程历史都拆成可审计、可替换的独立层。

同样的思路也体现在其他模块边界上。仓库单独拆出 `app-server`、`app-server-protocol`、`tools`、`thread-store`、`rollout`、`exec-server`、`sandboxing`、`process-hardening`、`mcp-server` 等 crate；根目录 `AGENTS.md` 又反复强调 crate 边界、sandbox 约束、MCP connection manager 和文档同步。它真正回答的是：当 agent 既广又深时，哪些责任必须成为清晰的所有权边界，才能避免整个系统退化成一个巨大且难以维护的核心包。[^codex-oss-ch2]

`docs/agents_md.md` 也说明了另一件事：连 `AGENTS.md` 这种“给 agent 的操作说明”都被当作正式能力层来设计，还考虑分层作用域与优先级。这和普通项目里把所有指令糊进一个系统提示完全不同。Codex 的选择是把文档注入、权限、持久化、工具注册、UI 连接协议全部做成可审计的显式结构，从而让 agent 行为更容易被不同客户端复用。[^codex-oss-ch2]

### 2.2.5 Claude Code 与 Codex 合起来说明了什么

从代码反推，Claude Code 和 Codex 实际上在回答同一类需求，只是切入点不同。Claude Code 证明：如果你真想让 agent 做长任务、带副作用、可恢复、可协作，你最后一定会长出 compaction、resume、disk output、mailbox、worktree、角色模板这些器官。Codex 证明：这些器官可以进一步抽象成 thread/turn/item、tool registry、thread store、rollout、sandbox、approvals、app-server 这样的边界，从而形成一个更清楚的 agent kernel。[^codex-oss-ch2]

如果再把产品演进线补进来，这个结论会更完整：Codex 不是“先有一个 CLI，后来加了 app”，而是先遇到多任务并行、异步委派、隔离环境、跨表面会话延续这些真实问题，然后才不得不长出今天这套开放出来的对象模型。也就是说，Codex 开源仓库最值得学的，不是某一版目录结构，而是它如何把产品压力压缩成一组长期稳定的 runtime 边界。[^codex-story-ch2]

因此，本书把 Claude Code 和 Codex 放在一起看，不是为了比较谁更强，而是为了看清同一条工程定律的两个侧面：一个侧面是产品化后的丰满器官，一个侧面是模块化后的清晰骨架。两者都在说明，harness 不是附属层，而是 agent 软件本体。

## 2.3 OpenClaw 与 Hermes：更广义 agent product 也在重复同一规律

OpenClaw 和 Hermes 不以 coding agent 为中心，但恰好证明 harness 不是 coding-only 现象。OpenClaw 把 Gateway 明确称为 control plane，核心围绕 sessions、channels、skills、routing、web surfaces 和安全边界展开；Hermes 则把 gateway、SQLite session store、FTS5 memory、skills、delegate tool、cron、MCP 与多种 terminal backend 放到同一运行面。二者共同点都不是“提示词写得更会”，而是把 session、memory、skills、gateway、cron、sub-agent 当作系统事实。[^openclaw-hermes-ch2]

对本书而言，OpenClaw 和 Hermes 只需要简单分析，因为它们不是最贴近“AI 软件工厂”的主样本；但它们非常有价值，因为它们说明一旦 agent 要跨渠道、跨时段、跨环境连续行动，control plane 一定会长出来。也就是说，harness 不是 coding agent 的偶然补丁，而是 agent product 普遍会演化出来的外层系统。[^openclaw-hermes-ch2]

## 2.4 OpenAI 1M LOC 案例真正说明了什么

相比 Claude Code 和 Codex 主要展示产品或仓库层面的运行时结构，OpenAI 的 1M LOC 案例展示的是组织生产层发生了什么变化：从 2025 年 8 月第一次提交到 2026 年 2 月，约五个月时间，三位工程师驱动 Codex 产出约 1M LOC、1500+ 个已合并 PR，平均每位工程师每天 3.5 个 PR，并宣称人类不直接写应用代码。[^openai-factory-ch2] 这个故事的重点不是“模型终于可以替代工程师”，而是工程师的工作对象上移了。

### 2.4.1 这不是炫耀案例，而是一场强制约束实验

Ryan Lopopolo 在文章开头给出的设定非常有信息量：这支团队从一开始就刻意施加了 `0 lines of manually-written code` 的强约束，并用一句很像组织原则的话把它钉死了：`"Humans steer. Agents execute."`[^openai-factory-story-ch2] 这不是营销 stunt，而是一种 forcing function。它逼团队承认一件很多组织还不愿正视的事：如果 agent 真要成为主生产力，你就不能在关键时刻偷偷靠人工把洞补上，否则你永远不知道系统到底缺了什么。

正因为有这个约束，文章里的很多结论才可信。第一份 commit 是空仓库上的 late August 2025；初始 scaffold、CI、格式规则、包管理、应用框架，甚至最早那份 `AGENTS.md` 都是 Codex 自己写的。[^openai-factory-story-ch2] 换句话说，这不是“人类写好骨架、agent 负责填肉”，而是连骨架本身都在 agent 驱动下长出来。对本书来说，最关键的启发是：只有当人类不能直接接管实现时，组织才会被迫去建设真正的 harness。

### 2.4.2 工程师角色为什么会上移

这篇文章最该反复读的，不是 1M LOC 这个数字，而是 OpenAI 对工程师新角色的定义。Lopopolo 写得很直接：早期进展慢，不是因为 Codex 不行，而是因为 environment was underspecified；真正缺的是 tools、abstractions 和 internal structure。于是工程师的主要工作，不再是亲手写每一行代码，而是不断追问：“缺了什么能力，怎样把它做得既 legible 又 enforceable for the agent？”[^openai-factory-story-ch2]

这和传统工程管理的差异非常大。过去一个 senior engineer 遇到问题，常见反应是自己下场把关键路径写掉；在这个实验里，那条路被刻意封死了。于是团队被迫做 depth-first 的 enablement：先让 agent 会设计、会测试、会 review、会操作环境，再用这些中间能力解锁更复杂的任务。换句话说，工程师从“代码作者”转成了“能力供给者”“环境设计者”“反馈环建筑师”。这正是 harness engineering 的组织学含义。

### 2.4.3 为什么 legibility 会先于 intelligence

OpenAI 在这篇文章里反复强调的一个词是 legibility。这里的意思不是“代码写得漂亮”，而是 agent 能不能看懂、验证、继续沿着现有结构工作。文章给出的做法几乎是一套控制面样板：

- app 必须 bootable per git worktree，这样每个变更都有自己隔离的运行实例；
- Chrome DevTools Protocol 直接接进 agent runtime，让它能自己看 DOM snapshot、截图、导航和 UI 行为；
- 日志、指标、trace 通过本地 observability stack 暴露给 agent；
- 长任务可以持续数小时，文章里明确说经常看到单次 Codex run 工作六小时以上。[^openai-factory-story-ch2]

这组做法的共同点是：它们都在把系统状态从“人类肉眼可见”转成“agent 也可直接读取并利用”。这正是为什么文章会把一节标题直接写成 `Agent legibility is the goal`。[^openai-factory-story-ch2] 只有当 UI、日志、指标、线程状态、执行历史都变成 agent 可读事实，反馈环才真正闭合；否则系统再强，也只是把人类换成了一个更快但更盲的执行者。

### 2.4.4 为什么文档、架构约束和 merge 哲学都变了

这篇文章真正成熟的地方，在于它没有把问题收缩成“多写点提示词”。OpenAI 团队很早就试过“one big AGENTS.md”，结论是 predictable 地失败：上下文挤占、重点失焦、快速腐烂、不可验证。最后他们把 `AGENTS.md` 降回目录，把 `docs/` 提升成 system of record。[^openai-factory-story-ch2] 这和本书前文关于 `AGENTS.md` 的判断完全一致：它必须短、稳定、常驻，上下文里只放地图，不放百科全书。

更重要的是，OpenAI 没把“好架构”停留在文档层。他们明确写到：documentation alone 不足以维持 agent-generated codebase 的 coherent；真正有效的是 enforcing invariants, not micromanaging implementations。[^openai-factory-story-ch2] 于是 business domain 分层、依赖方向、可允许边、数据 shape 边界、知识库 freshness、文档 cross-link、甚至“golden principles” 都被做成机器可检查的规则。

这会直接改变 merge 哲学。文章里有一段非常值得抄在团队墙上：随着 Codex throughput 上升，很多传统工程规范会变得 counterproductive；仓库采用 minimal blocking merge gates，PR 生命周期变短，test flake 更常通过 follow-up run 解决，因为在“agent throughput far exceeds human attention”的系统里，corrections are cheap，而 waiting is expensive。[^openai-factory-story-ch2] 这不是鼓吹降低质量，而是在说明：当产能模型变了，质量控制点也必须重排。

### 2.4.5 1M LOC 真正说明了什么

如果把这篇文章只读成“OpenAI 用 AI 写了 1M LOC”，结论会非常浅。它真正说明的是，AI 软件工厂并不是把人拿掉，而是把人的位置往外推：人不再主要承担逐行实现，而是负责搭环境、写约束、造反馈、设计知识系统、定义架构边界、安排 merge 节奏、持续做 garbage collection。

文章最后一段几乎已经把本书主线说完了：他们最难的问题，现在都集中在 designing environments, feedback loops, and control systems 上。[^openai-factory-story-ch2] 这正是为什么 1M LOC 案例对本书有决定性意义。它不是在证明“模型自己会造软件”，而是在证明：当 agent 进入真实生产，真正稀缺的能力不是生成代码，而是构造一个让代码生成、验证、回放、纠偏和治理都能持续运转的 harness。

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
[^claude-code-paper-ch2]: Jiacheng Liu 等，*Dive into Claude Code: The Design Space of Today's and Future AI Agent Systems.* 本章在此处使用其基于公开 TypeScript 源码的 Claude Code 分析，包括五类价值目标、十三条设计原则、七个高层组件、五层子系统结构、权限系统、五层 compaction、MCP / plugins / skills / hooks、subagent delegation 与 append-oriented session storage；对应第 19 章参考文献 41。
[^codex-oss-ch2]: OpenAI, *openai/codex* 开源仓库。 本章在此处使用其 `codex-rs/cli/src/main.rs`、`codex-rs/app-server/README.md`、`codex-rs/app-server-protocol/src/protocol/v2.rs`、`codex-rs/tools/src/lib.rs`、`codex-rs/thread-store/src/lib.rs`、`codex-rs/rollout/src/lib.rs`、仓库根 `AGENTS.md` 与 `docs/agents_md.md` 中关于 CLI surfaces、Thread/Turn/Item、tool registry、thread persistence、rollout、sandbox、approvals 与 `AGENTS.md` 的公开结构；对应第 19 章参考文献 21。
[^codex-story-ch2]: 本章在此处综合 OpenAI 关于 *Introducing Codex* 与 *Introducing the Codex app* 的产品叙事，以及 Codex 开源 README / app-server README 对本地 CLI、rich interfaces、多线程、多 agent 与 worktree 的公开描述，用来补足 Codex 从云端并行 agent 到本地 runtime kernel 的演进故事；对应第 19 章参考文献 21、39、40。
[^openclaw-hermes-ch2]: 本章在此处综合 OpenClaw README 中关于 Gateway control plane、sessions、channels、skills 与 routing 的描述，以及 Hermes README/AGENTS 中关于 gateway、SQLite session store、memory、skills、delegate tool、cron 与 MCP 的结构；对应第 19 章参考文献 22、23。
[^openai-factory-ch2]: OpenAI, *Harness Engineering: Leveraging Codex in an Agent-First World.* 本章在此处使用其关于 1M LOC、1500+ merged PR、三位工程师与低人工写码比例的案例数字；对应第 19 章参考文献 2。
[^openai-factory-story-ch2]: 本章在此处使用 Ryan Lopopolo 文章中关于 “Humans steer. Agents execute.”、无手写代码、worktree、repository knowledge 作为 system of record、minimal merge gates 与 garbage collection 的叙述，用来补足 1M LOC 案例的组织与控制系统视角；对应第 19 章参考文献 2。
[^agents-catalog-ch2]: 本章在此处综合 Fowler、OpenAI 与 Codex 开源文档关于 `AGENTS.md` 作为短目录、细节下沉到 `docs/` 的做法；对应第 19 章参考文献 1、2、21。
[^review-boundary-ch2]: 本章在此处前半使用 OpenAI 关于极端自动化案例边界的表述；后半关于医疗、金融、隐私与客户数据路径的要求属于本文的工程外推；对应第 19 章参考文献 2。

---
