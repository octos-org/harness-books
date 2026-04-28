# 1. LLM 的工作区间：为什么控制系统必不可少

核心工程目标不是“孤立地让模型更聪明”。  
真正的实践目标，是让 LLM 在尽可能长的任务周期里停留在它最擅长的上下文和工作区间内。

有两个类比很有用：

- CPU 缓存/RAM 局部性：工作集保持局部且一致时，吞吐是可预测的；一旦局部性丢失，性能会坍塌，方差会升高。
- 半导体放大器的线性区：在线性区里，输出能以可接受的失真跟随输入；离开这个区间后，削顶和饱和会让输出失控。

LLM 在实践中也呈现类似行为。它存在一个可用的确定性/高质量区间，其中：

- 任务约束明确且足够新
- 工具接口没有歧义
- 反馈回路短且可验证
- 跨轮次的状态迁移保持一致

离开这个区间后，质量会变得不稳定：

- 幻觉状态和陈旧假设增加
- 工具调用质量漂移
- 长周期一致性断裂
- 自信语言和真实正确性分离

## 1.1 从 LLM 工作机理到 Agentic AI：为什么必须有外层工作环境

这本书的开端不能直接跳到“harness 很重要”。那样会让读者误以为 harness 是某种新框架、新中间件，或者更精致的 prompt 工程。真正的起点应该更低一层：LLM 是什么样的机器，它天然缺什么；agent 这个概念怎样从 AI 理论里的自治系统，演化成今天围绕 LLM 的工具执行体；如果把 LLM 当成一个需要工作集管理的 cache system，或者一个高增益但会漂移的放大器系统，外层到底要补什么机制。

答案会自然落到 agentic AI。所谓 agentic AI，不是“让模型自己想办法”的浪漫说法，而是给 LLM 搭一个能感知、行动、记忆、验证、恢复和被人类监督的工作环境。这个环境提供的负反馈循环，才是 LLM 能稳定高效工作的前提。

### 1.1.1 LLM 的能力来自条件生成，不来自内置状态机

LLM 的核心能力，是在给定上下文条件下生成下一段高概率、高相关性的文本或结构化动作。这个能力非常强：它可以吸收大量语言模式、代码模式、工具调用模式和领域知识，在短时间内给出候选解释、候选计划、候选代码和候选产物。但从系统角度看，它仍然不是状态机、操作系统、数据库或验证器。

这一区分很关键。一个 LLM 可以在当前上下文里“看起来记得”某个约束，但它并不天然拥有持久事实；它可以生成一个 shell 命令，但它不会天然知道这个命令是否越权、是否破坏工作区、是否影响另一个会话；它可以说“完成了”，但这句话本身不等于产物存在、测试通过、引用完整或用户目标达成。

因此，LLM 的强项和弱项来自同一件事：它是高能力的条件生成器。只要上下文切片合适、目标明确、反馈短且可验证，它会表现得非常聪明；一旦上下文过长、目标漂移、工具副作用复杂、反馈延迟拉长，它就会开始把概率上的连贯性误当成运行时事实。后文所谓“最佳工作区间”，首先就是这个条件生成器能稳定工作的区间。

### 1.1.2 单轮智能面对长任务时会遇到五类系统挑战

把 LLM 放进真实工作流后，问题很快就不再是“模型能不能回答”。真正的问题会变成下面五类：

1. `目标保持`：用户目标会被拆成多个子目标，子目标之间会有依赖、冲突和优先级。模型可以复述目标，但不天然拥有跨小时、跨会话的目标保持机制。
2. `上下文选择`：真实任务材料远大于上下文窗口。哪些内容常驻、哪些按需加载、哪些压缩成摘要、哪些必须写回事实流，不能靠模型临场自觉。
3. `工具副作用`：shell、文件系统、浏览器、MCP、外部 API 都会改变环境。模型提出动作，不能等于动作就应该被执行。
4. `结果验证`：生成器会倾向于给出连贯结论，但连贯不等于正确。产物是否存在、是否新鲜、是否属于当前任务、是否满足业务约束，需要独立判断。
5. `人类控制`：用户需要授权、打断、恢复、审计和接管。一个不能被看懂、不能被暂停、不能复盘的 agent，即使短期能完成任务，也很难进入生产。

这些挑战都不是单个 prompt 能彻底解决的。prompt 可以提高局部成功率，却不能提供持久状态、权限边界、工具隔离、回放证据和终态裁决。它们必须进入运行时。

### 1.1.3 Agent 概念的演化：从自治系统到 LLM 工具执行体

早期 agent 理论并不是从 LLM 开始的。Franklin 和 Graesser 对 autonomous agent 的定义，直到今天都非常适合拿来做起点：agent 不是一次性运行的程序，而是会 `"senses that environment and acts on it, over time"` 的系统；他们甚至故意举了一个有点刺耳的例子，说 thermostat 也满足这个定义。[^agent-theory-ch1]

这句话初看很“降格”，因为现代人一说 agent，脑海里往往先出现一个会说话、会规划、会调工具的复杂体。但 Franklin / Graesser 的用意恰好相反：他们是想提醒我们，不要把 agent 的本体误认成语言表面。只要一个系统会感知环境、根据当前状态调整行为、并把自己的行动回写到下一轮感知条件里，它就已经进入了 agent 的问题域。

Wooldridge / Jennings 那条经典线进一步把 agent 的弱定义压成几项可工程化特征：自主性、反应性、主动性和社会性。[^agent-theory-ch1] 到了 LLM 时代，ReAct 把这条线重新接到语言模型上：模型不只是一次性回答，而是在 reasoning 和 acting 之间循环，让观察结果进入下一步推理。[^llm-agent-evolution-ch1] Claude Code 论文也把现代 coding agent 的演化路径说得很清楚：从 autocomplete，到 IDE assistant，再到可以计划多步修改、执行 shell、读写文件、迭代自己输出的 agentic system。[^claude-code-design-space-ch1]

把这些概念翻成工程语言，一个现代 LLM agent 至少包含下面这个循环：

```text
用户目标 / 环境 / 工具 / 运行时事实
  -> 感知（读取上下文、工具回执、session 状态）
  -> 判断（识别约束、估计状态、更新计划）
  -> 决策（选择下一步、选择工具、选择角色/路径）
  -> 行动（调用工具、修改产物、派工、回写事实）
  -> 新环境 / 新事实
```

这也是为什么 agent 和普通聊天程序在工程上完全不是一回事。普通程序的输入和输出常常是一锤子买卖；agent 的当前行动会改变它下一次能感知到什么，所以它天然是闭环系统，而不是单轮映射函数。语言模型在这里只是判断器或策略生成器的一部分，不是整个系统。

### 1.1.4 Agentic AI 做的事：给 LLM 建一个稳定工作环境

如果把上一节的闭环拆开，agentic AI 的工作就很清楚了：它不是替代 LLM，而是为 LLM 建工作环境。

- `感知层` 负责把用户目标、文件、日志、网页、MCP 资源、历史事实和工具回执组织成当前可用上下文。
- `行动层` 负责把模型提出的动作转成受权限、沙箱、schema 和并发规则约束的工具调用。
- `记忆层` 负责把重要事实写回 session、docs、skills、memory 和 artifact，而不是让它们只漂在 prompt 里。
- `验证层` 负责把“看起来完成”改成“证据证明完成”。
- `控制层` 负责压缩、恢复、打断、升级、分派子 agent，并把错误反馈回下一轮。

Claude Code 论文对这一点的概括非常有价值：核心 agent loop 可以简单到只是一个“call model, run tools, repeat”的 while-loop，但绝大多数代码并不在这个 loop 里，而在 loop 周围的系统：权限、compaction、MCP / plugins / skills / hooks、subagent delegation 和 append-oriented session storage。[^claude-code-design-space-ch1] 这正好说明，agentic AI 的本体不是“模型多聪明”，而是模型周围那套让它能持续工作的控制系统。

如果把这一节写成一句抽象口号，比如“LLM 需要反馈控制”，读者很容易把它听成事后拔高的比喻。更准确的写法是：今天我们在 agent 上遇到的问题，本来就是三段老工程史在新的计算介质里重演。第一段是 Wiener 与控制论，讨论的是系统如何在噪声、延迟和不完全观测下继续对准目标；第二段是主存与 cache 的演化，讨论的是为什么系统必须主动管理工作集，而不能把全部材料都塞到最快层；第三段是 Bell System 的负反馈放大器，讨论的是为什么想要稳定，往往必须主动牺牲一部分裸增益与自由度。把这三段历史叠起来，现代 harness engineering 的轮廓才会变得立体。[^cybernetics-foundation-ch1][^cybernetics-history-ch1][^cache-history-ch1][^feedback-history-ch1]

对 LLM agent 来说，这个框架几乎是直接可用的：

- 用户目标、工具回执、session 事实、validator 证据，都是闭环里的消息；
- 幻觉、陈旧上下文、跨会话污染、错误 UI 状态、自由格式日志，都是噪声；
- 所谓“最佳工作区间”，本质上就是让系统维持在一个高信噪比、低漂移、可纠偏的稳定区间。

所以后文的 harness，不应被理解成一层外挂脚手架，而应被理解成 agent 的外层反馈控制系统。它的任务不是让模型显得更聪明，而是持续感知偏差、校正偏差，并把系统重新拉回可用区间。

### 1.1.5 Wiener 与控制论：从战时问题到战后范式

Norbert Wiener 之所以重要，不只是因为他写了一本题目里带 `Cybernetics` 的书，更因为他把一个后来会深刻影响计算机、认知科学和自动化的工程问题，第一次讲成了一种统一语言。Britannica 对这段历史的概括很关键：Wiener 在二战期间处理“如何瞄准移动目标”这类控制问题，他在预测、滤波和目标保持上的思考，后来直接通向了 cybernetics。[^cybernetics-history-ch1]

很多人第一次接触 Wiener，会先记住“神童”“MIT 数学家”这些标签；但对本书更重要的，是他的问题意识不是“机器会不会像人一样思考”，而是“一个系统怎样在持续变化的环境里保持方向”。MIT Press 对《Cybernetics》的概括很简洁：控制论研究的是带有 `"feedback loops"` 的系统中信息如何被控制，噪声会破坏系统的 `homeostasis`。[^cybernetics-foundation-ch1]

这件事在战后迅速从军工问题外溢成更广的智识运动。MIT Press 对 Macy Conferences 的介绍提到，1946 到 1953 年间，一群风格迥异的人定期开会，试图把 war years 里长出来的 cybernetics、information theory、computer theory 变成跨学科联盟的共同语言；Wiener、von Neumann、Margaret Mead、Gregory Bateson、Warren McCulloch 都在这张桌子上。[^cybernetics-history-ch1] 这段故事值得记住，因为它说明控制论从一开始就不是单一学科里的局部技巧，而是一种关于复杂系统的工作语言。

把这段历史翻回今天的 LLM agent，会得到一个非常直接的结论：真正困难的问题，不是让模型偶尔答出一个漂亮答案，而是让系统在任务持续推进、外界不断反馈、约束持续变化时仍然不丢目标。换句话说，控制论关心的“目标保持”，恰好就是 agent 产品在真实环境里最缺的能力。

### 1.1.6 Harness 为什么是外层反馈控制器

一旦承认 agent 是闭环系统，harness 的角色也就清楚了。模型本身只负责生成下一步候选动作；真正把闭环关上的，是 harness：

- 它通过 session、tool 回执、validator、dashboard 与 replay 感知系统状态；
- 它通过 compaction、检索、角色路由、权限边界、重试与升级来调节系统；
- 它通过 artifact 契约、终态裁决和人工介入把错误行动拦在用户可见表面之前。

2026 年 Thoughtworks 这一波关于 harness engineering 的讨论，很值得作为现代实践的起点来读。Birgitta Böckeler 在正式文章里公开致谢 Kief Morris，说是他把 cybernetics 带进了这场讨论；这不是花絮，而是一个信号：今天的软件团队重新谈 harness，本质上是在重新发现一个老控制问题。[^harness-story-ch1]

Böckeler 对 coding agent 的判断很准确：工程团队对 AI 生成代码有一种 `"natural trust barrier"`。她给出的翻译不是玄学，而是非常控制论：前馈的 guides 负责在行动前提高成功概率，反馈的 sensors 负责在行动后帮助系统自纠。[^harness-story-ch1] Kief Morris 在另一篇文章里则把人的位置重新定义成 `"on the loop"`：人的工作不是盯住每一行生成代码，而是设计和改进那个会持续产生代码、测试、文档和验证结果的工作回路。[^harness-story-ch1]

换句话说，harness 的控制目标不是“让每一步都最聪明”，而是“让整个循环长期稳定”。它要控制的量，至少包括：

- 上下文里的相关证据密度；
- 当前任务状态的一致性；
- 工具动作与权限边界；
- 产物和终态的真实性；
- 成本、时延和失败重试半径。

这也是本书后文所有机制的统一解释：`AGENTS.md`、skills、memory、hooks、validators、dashboard、swarm 协作，其实都是反馈控制器上的不同传感器、执行器和约束器件。

### 1.1.7 从 delay line 到 cache：为什么系统必须管理工作集

缓存层级之所以是一个好类比，不只是因为它“快”，而是因为它背后有一整段非常具体的失败史。Computer History Museum 对早期主存的描述很形象：第一代很多内存技术是 serial 的，bit 在环路里循环，机器想读写某个数据，只能等那一串 bit 转回到可访问的位置；直到随机访问内存出现，才真正 `"eliminated the wait"`。[^cache-history-ch1]

这段历史比今天很多人想象得更物理。Maurice Wilkes 的 EDSAC 用过 mercury delay line，数据不是“放在那里等你读”，而是在管子里流动。Jay Forrester 在 MIT Whirlwind 推进 magnetic core memory，核心问题也不是更优雅，而是原来的 memory 太慢、太不稳定、太不适合持续运行。CHM 对主存史的总结很到位：计算机设计者很早就知道需要 fast, reliable main memory，真正困难的是找出在速度、可靠性和成本之间能工作的技术路线。[^cache-history-ch1]

后来分层这件事越来越清楚。IBM 对 System/370 的回顾写得很直白：1970 年推出的 System/370 Model 145 把 IBM 带进了 silicon age，更快、更紧凑，而 CHM 进一步指出它所用的 64-bit bipolar RAM 就是用作 cache memory。[^cache-history-ch1] 这段演进说明，cache 不是“聪明人爱抽象”的产物，而是单层存储无法同时满足速度、容量和成本时，被现实逼出来的体系结构选择。

Chris Terman 在 *Computation Structures* 里把缓存成功的前提总结为 `"locality of reference"`：系统不需要把全部数据都放进最快层，而要把当前工作集放进最快层，并通过 associativity、block size、replacement policy、write policy 等策略自动管理层间流动。[^memory-hierarchy-ch1]

这和 agent 的上下文控制几乎同构：

- prompt / 当前 turn 上下文，相当于最靠近“CPU”的 L1；
- `AGENTS.md`、skills、短期 memory，相当于次一级的可快速调入层；
- session 事实流、artifact、docs、wiki、外部检索结果，相当于更慢但更大的下层存储。

在这个类比下，harness 做的就是“认知层级缓存控制”：

- admission：什么信息允许进入当前 prompt；
- eviction：什么旧信息应从 prompt 退到 session / memory；
- block size：一次喂给模型的是整块原文，还是经过压缩的证据切片；
- write policy：哪些中间状态只留在临时上下文，哪些必须立刻写回持久事实流。

如果没有这层控制，系统就会像一个没有 cache policy 的 CPU：不是把高速层塞爆，就是让热点数据来不及进来，最后把大部分时间浪费在低效搬运上。所谓“最佳工作区间”，其实就是 agent 版本的工作集管理。

### 1.1.8 从 Harold Black 到半导体反馈：为什么稳定要靠限幅与锁存

半导体与电路系统又给了另一组更底层的直觉，而且这里的故事感非常强。Harold S. Black 在 Western Electric / Bell System 遇到的问题，并不神秘：长距离电话链路上，信号经过一串又一串放大器，增益是有了，但失真、噪声和漂移也一路叠上去。National Inventors Hall of Fame 对这段历史的概括抓住了关键：Black 为消除失真坚持了六年，最终在通勤 ferry 上想清楚了负反馈放大器的原理。[^feedback-history-ch1]

这件事为什么重要？因为它揭示了一个非常反直觉的工程事实：成熟系统追求的往往不是最大裸增益，而是更可控的整体行为。Black 的做法，本质上是把一部分输出送回输入端，通过主动牺牲增益，换取更高线性、更低失真和更可预测的整体表现。Bell Labs 保存下来的那篇 1934 年文章，今天读仍然很像现代控制系统的序曲。[^feedback-circuits-ch1]

半导体世界里还有一个与之互补的画面。Terman 在讲 SRAM bit cell 时说得非常直接：它本质上是 `"positive feedback loop"`，用来形成可稳定保存状态的双稳态存储。[^memory-hierarchy-ch1] 也就是说，电子系统里同时存在两种看似相反、实际互补的反馈思想：

- 正反馈用来锁存状态，让一个 bit 不至于自己滑掉；
- 负反馈用来抑制放大链条里的漂移与失真，让整体仍在稳定区工作。

这对 harness 特别有启发，因为一个长期运行的 agent 同样需要这两类机制：

- session 事实流、validator 通过的 artifact、role / scope / worktree 边界，是它的“锁存器”；
- validator、replay、dashboard、人工升级、角色重分配和恢复逻辑，是它的“负反馈环”。

长任务 agent 最容易犯的错，恰好就是把这两类机制都省掉：既没有东西把关键事实锁住，又没有东西把错误输出重新送回系统做纠偏。结果就是短期看速度很快，长期看状态漂移、工具误用、上下文污染和错误自信一起累积。工程上真正成熟的系统，必须像好电路那样，知道什么时候该放大，什么时候该锁住，什么时候该限幅。

### 1.1.9 回到现代 agent：控制论如何变成 harness engineering

到这里，控制论、cache 和负反馈就不再是三个孤立的类比，而是能落到现代 agent 实践上的三条约束：

1. 系统必须能持续感知偏差，而不是只在失败后回看聊天记录；
2. 系统必须主动管理工作集，而不是把所有原始材料都塞进一个大窗口；
3. 系统必须愿意牺牲一部分自由度，换取更低漂移和更强可恢复性。

第 2 章会展开 Claude Code、Codex 和 OpenAI 1M LOC 案例。这里先只保留理论结论：当 agent 离开 demo，进入跨文件、跨工具、跨角色、跨时段的工作场景时，系统瓶颈会从“模型够不够聪明”转向“控制环够不够好”。这时，prompt 工程仍然重要，但它只是局部优化；真正决定系统上限的是下面这层控制栈：

```text
Prompt 工程
  -> 改善局部单轮行为
上下文工程
  -> 稳定多轮行为（AGENTS.md、skills、memory、策略上下文）
Harness 工程
  -> 用持久运行时契约稳定长周期自治行为
```

单靠 prompt 工程无法提供持久的状态事实。上下文工程能改善多轮输入质量，但仍依赖概率性的遵守。Harness 工程增加运行时级别的护栏和证据，使系统可以从模型漂移中恢复，而不是假装漂移不存在。

## 1.2 上下文工程是 harness 的前置纪律

在 harness 成熟之前，上下文工程承担大部分控制重量：

- `AGENTS.md` 和角色指令约束规划风格
- skills 编码可复用的领域流程
- memory 记录用户/项目事实，减少重复漂移
- 有边界的工具策略减少不安全探索

这一层是必要的，但对长任务、并发和后台工作并不充分。

## 1.3 Harness 工程是外层确定性循环

Harness 在概率模型输出外增加确定性控制循环：

- 可恢复、可追踪的工作区状态
- 工具调用生命周期 hook 和事件 sink，用于可观测性
- 终态成功前的输出验证/确认
- 持久任务生命周期和回放语义
- 面向修复和操作员行动的显式失败类别

Harness 不替代模型智能。它约束模型智能。

## 1.4 能力上限不等于有效工作区间

“支持 1M token context”首先是能力上限，不是工程上可以无脑塞满的建议值。长上下文最容易误导团队的地方，在于大家把“能放进去”误当成“同样擅长用好”。

这件事在事实层面已经很清楚：

- Google 在 2024 年发布 Gemini 1.5 时，报告它在单 needle 的 Needle-in-a-Haystack 测试里，在 1M token 下仍能达到 99% 命中率。[^gemini15]
- 但 Google 自己后续的 long context 开发文档也明确提醒：一旦从“单 needle”变成多个待检索信息点，表现就不会维持同样精度，而且会随上下文内容而大幅波动。[^google-long-context]
- Anthropic 的长上下文 prompting 文档则给出很务实的经验：长文档放前面、query 放最后面，复杂多文档输入里响应质量可提高到 30% 左右。[^anthropic-long]

这说明同一个“1M context”里，不同位置、不同信息密度、不同任务形式的可用性并不均匀。上下文窗口更像一块可寻址的大内存，不像一条任何位置都等价的理想传送带。

所以工程上应把 context window 分成两个概念：

- 容量上限：模型最多能接收多少 token。
- 有效工作区间：在当前任务形态下，模型还能稳定检索、遵循指令、维持推理链的那一段上下文工作区。

后者才是 harness 关心的对象。

## 1.5 为什么会出现“最佳工作区间”

所谓“最佳工作区间”，不是说所有模型都存在一个固定 magic number，比如“128K 最好、256K 开始变差”。它更像一个随任务结构变化的工作带宽：在多大范围内，模型还能稳定检索、遵循指令、保持多步推理、避免位置偏置，并让系统在成本和时延上可接受。

长上下文研究已经给出足够清楚的理论信号。*Lost in the Middle* 说明相关信息在开头或结尾时更容易被利用，放在中间时表现会下降；*Found in the Middle* 进一步把这种现象概括为 `"U-shaped attention bias"`。[^ltm][^fitm] Anthropic 的长上下文文档也给出很工程化的建议：长文档放前面，query 放最后面，在测试中可显著改善复杂多文档任务质量。[^anthropic-long]

这说明上下文窗口不是一块平坦空间，而是有位置、密度和任务形态差异的工作区。Google 在 Gemini 1.5 发布时报告过 1M token 下很高的 needle 命中率，但它自己的 long context 文档也提醒，多信息点检索的表现会随上下文大幅波动。[^gemini15][^google-long-context] NoLiMa 和 LongCodeBench 又把问题推到更接近真实工作的场景：去掉字面匹配线索，或者进入代码理解和修复任务后，长上下文能力会明显变脆。[^nolima][^longcodebench]

所以第 1 章只给出一个理论结论：最大 context 是容量上限，最佳工作区间才是设计目标。Agent 系统不能默认“把更多材料塞进窗口”就会更可靠，而应当反过来设计任务：让模型看到更短、更密、更靠近当前决策的证据切片，把状态、历史、产物和验证证据移到运行时事实流里，再按需调回 prompt。

## 1.6 从理论转入实践：后文怎样穿插展开

到这里，第 1 章只需要完成一件事：说明 harness 不是可选的产品装饰，而是让 LLM 长任务留在有效工作区间内的控制系统。

后文不再把所有理论一次性堆在开头，而采用交替推进：

1. 第 2 章先看成熟样本：Claude Code 和 Codex 把哪些控制器、传感器、执行器、记忆和权限边界做成了产品结构。
2. 第 3 章再看失败样本：当系统把聊天输出误当成运行时事实时，会怎样出现进度漂移、会话污染、产物错交和验证失效。
3. 第 4 章把理论和样本压成统一架构：事实流、生命周期、能力平面、产物验证、回放、隔离恢复、协作、知识分层和操作员面。
4. 第 5 到第 8 章逐个专题展开：每章都先给理论约束，再接 Claude Code / Codex 的实现例证和失败案例的反证。

这能避免“第一章把所有结论讲完，后面只剩展开”的头重脚轻。理论负责给读者建立判断坐标，实践负责不断校正这套坐标。

[^ltm]: Nelson F. Liu et al., *Lost in the Middle: How Language Models Use Long Contexts.* 本章在此处使用其关于长上下文位置偏置与中段退化的结果；对应第 19 章参考文献 11。
[^fitm]: Cheng-Yu Hsieh et al., *Found in the Middle: Calibrating Positional Attention Bias Improves Long Context Utilization.* 本章在此处使用其关于 `"U-shaped attention bias"` 的分析；对应第 19 章参考文献 12。
[^anthropic-long]: Anthropic, *Prompting best practices: Long context prompting.* 本章在此处使用其关于长文档前置、query 后置与约 30% 质量提升的建议；对应第 19 章参考文献 13。
[^gemini15]: Google, *Introducing Gemini 1.5, Google's next-generation AI model.* 本章在此处使用其关于 NIAH 命中率、1M context pricing tier 与时延预期的表述；对应第 19 章参考文献 14。
[^google-long-context]: Google AI for Developers, *Long context.* 本章在此处使用其关于 performance variability、retrieval-cost tradeoff 与 caching 的说明；对应第 19 章参考文献 15。
[^nolima]: Ali Modarressi et al., *NoLiMa: Long-Context Evaluation Beyond Literal Matching.* 本章在此处使用其关于 32K 条件下模型退化统计，以及 GPT-4o 从 99.3% 降至 69.7% 的结果；对应第 19 章参考文献 16。
[^longcodebench]: Stefano Rando et al., *LongCodeBench: Evaluating Coding LLMs at 1M Context Windows.* 本章在此处使用其关于代码任务长上下文退化的样例数据；对应第 19 章参考文献 17。
[^cybernetics-foundation-ch1]: Norbert Wiener, *Cybernetics or Control and Communication in the Animal and the Machine.* 本章在此处使用 MIT Press 对 cybernetics、feedback loops、noise 与 homeostasis 的概括，来建立控制论视角；对应第 19 章参考文献 25。
[^cybernetics-history-ch1]: 本章在此处综合 Britannica 对 Wiener 战时目标跟踪与预测问题的概述，以及 MIT Press 对 Macy Conferences、Wiener、von Neumann、Margaret Mead、Gregory Bateson 等人的描述，用来补足控制论的人物与历史脉络；对应第 19 章参考文献 30、31。
[^agent-theory-ch1]: 本章在此处综合 Franklin / Graesser 对 autonomous agent 的定义，以及 Wooldridge / Jennings 关于 autonomy、reactivity、pro-activeness 与 social ability 的经典描述；对应第 19 章参考文献 26、27。
[^llm-agent-evolution-ch1]: 本章在此处综合 ReAct 关于 reasoning / acting 循环的经典框架，以及 *Dive into Claude Code* 对 coding assistant 演化到 agentic system 的描述，用来说明 LLM agent 如何从单轮回答走向工具闭环；对应第 19 章参考文献 41、42。
[^claude-code-design-space-ch1]: Jiacheng Liu 等，*Dive into Claude Code: The Design Space of Today's and Future AI Agent Systems.* 本章在此处使用其关于 Claude Code agentic loop、系统边界与源码分析结论，用来把 agentic AI 从概念落到具体产品架构；对应第 19 章参考文献 41。
[^memory-hierarchy-ch1]: Chris Terman, *Computation Structures* 的 *The Memory Hierarchy* 与 *Virtual Memory* 讲义。 本章在此处使用 locality of reference、associativity、block / replacement / write policy，以及 SRAM 中 positive feedback loop 的解释，来建立 memory hierarchy 与稳定存储的类比；对应第 19 章参考文献 28。
[^feedback-circuits-ch1]: H. S. Black, *Stabilized Feedback Amplifiers.* 本章在此处使用其关于多级放大器稳定性、负反馈与非线性抑制的讨论，来类比长任务 agent 的漂移控制；对应第 19 章参考文献 29。
[^cache-history-ch1]: 本章在此处综合 Computer History Museum 关于 delay line、main memory、magnetic core 与 bipolar RAM/cache 的材料，以及 IBM 对 System/370 向硅与高速 cache 迁移的回顾，用来解释 memory hierarchy 不只是抽象理论，而是现实成本、速度与容量冲突逼出来的分层工程；对应第 19 章参考文献 32、33、34。
[^feedback-history-ch1]: 本章在此处综合 National Inventors Hall of Fame 与 Bell Labs 对 Harold S. Black 负反馈放大器的历史描述，用来补足 Bell System 长距离电话失真、六年坚持与 ferry 灵感的故事线；对应第 19 章参考文献 29、35。
[^harness-story-ch1]: 本章在此处综合 Birgitta Böckeler 关于 guides / sensors 的 harness 抽象、Kief Morris 关于 humans “on the loop” 的论述、OpenAI Ryan Lopopolo 的 harness 实践，以及 Anthropic 对 Claude Code 组织采用的公开描述，用来说明今天的 harness engineering 是一条带有人物、组织与实践演进的技术线，而不是新造术语；对应第 19 章参考文献 1、2、36、37、38。
