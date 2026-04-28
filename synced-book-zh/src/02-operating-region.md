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

这也正是今天几条最有代表性的 harness 实践线在做的事。OpenAI 的 Ryan Lopopolo 在讲 Codex 驱动的 1M LOC 实验时，最有信息量的一句话其实不是“零手写代码”，而是：`"When something failed, the fix was almost never 'try harder.'"` 团队真正做的，是不断补环境、补抽象、补反馈环，让 agent 变得既 legible 又 enforceable。[^harness-story-ch1]

Anthropic 这边给出的公开故事也很说明问题。产品页上写得很直接：公司里 `"majority of code is now written by Claude Code"`，工程师的重心转向 architecture、product thinking 与 continuous orchestration。另一篇内部案例更能说明“agent 能力为何会从 coding 扩到更广义工作”：律师拿它做电话树系统，设计师直接改大块 state management，数据科学家在“不太会 JavaScript/TypeScript”的情况下，用它写出 5000 行级别的前端可视化应用。[^harness-story-ch1]

这些故事之所以重要，不是因为它们很像宣传材料，而是因为它们提供了一个组织层面的证据：当 agent 真正离开 demo，进入跨文件、跨工具、跨角色、跨时段的工作场景时，系统瓶颈就会迅速从“模型够不够聪明”转到“控制环够不够好”。这时，prompt 工程仍然重要，但它已经退居为局部优化；真正决定系统上限的，是能不能把运行时做成下面这层控制栈：

```text
Prompt 工程
  -> 改善局部单轮行为
上下文工程
  -> 稳定多轮行为（AGENTS.md、skills、memory、策略上下文）
Harness 工程
  -> 用持久运行时契约稳定长周期自治行为
```

单靠 prompt 工程无法提供持久的状态事实。  
上下文工程能改善这一点，但仍依赖概率性的遵守。  
Harness 工程增加运行时级别的护栏和证据，使系统可以从模型漂移中恢复，而不是假装漂移不存在。

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

这里先明确一个概念：所谓“最佳工作区间”，不是说所有模型都存在一个固定的 magic number，比如“128K 最好、256K 开始变差”。真实情况更像一个随任务结构变化的工作带宽。它描述的是：在多大范围内，模型还能稳定完成检索、遵循指令、保持多步推理、避免位置偏置，并且让系统在成本和时延上可接受。

换句话说，最佳工作区间不是模型 brochure 上的容量数字，而是模型、任务、提示布局、信息密度和服务成本共同决定的工程区间。

### 1.5.1 位置偏置不是错觉，而是长上下文的基本病灶

长上下文退化最经典的证据来自 *Lost in the Middle*。这项工作讨论的不是“模型能不能读到很长的输入”，而是“模型是否均匀地用好了整段输入”。它的核心发现可以概括为：相关信息放在开头或结尾时表现更好，放在中间时明显更差。[^ltm]

后续 *Found in the Middle* 进一步把这个现象与注意力机制联系起来，直接给出短语级结论：模型存在 `"U-shaped attention bias"`。[^fitm] 也就是说，序列两端会天然吃到更多注意力，即便它们并不是最相关的信息。

这件事很关键，因为它说明：

- 上下文窗口不是平的，而是有地形的；
- token 不是“放进去就等价可用”；
- 中间位置的信息天然更容易掉权；
- 指令布局不是文案问题，而是推理成功率问题。

这也是为什么 Anthropic 的官方长上下文文档会给出非常操作性的建议：[^anthropic-long]

> "Put longform data at the top"

> "Queries at the end can improve response quality by up to 30% in tests."

如果上下文窗口内部真的没有位置效应，那么这种布局建议就不该对质量产生这么大影响。恰恰因为位置偏置真实存在，所以 prompt 的空间编排本身已经成为性能变量。

### 1.5.2 “1M 命中 needle”不等于“1M 适合真实任务”

长上下文宣传里最容易让人误判的一点，是把单 needle 检索成绩外推到真实 agent 工作流。Google 在 Gemini 1.5 的发布文中报告：在 NIAH 测试里，1.5 Pro 在 1M token 下能把嵌入文本找到 `"99% of the time"`。[^gemini15] 这个结果当然重要，因为它证明超长上下文不是纯噱头。

但同一套官方资料其实也给出了边界条件。Google 的 long context 开发文档明确说：一旦问题从单一 needle 变成多个信息点，性能就不会保持同样精度；文档原话是：[^google-long-context]

> "performance can vary to a wide degree depending on the context"

这正是工程上最需要听懂的地方。单 needle 成绩回答的是“有没有基础寻址能力”；真实任务关心的是：

- 多个候选证据之间能否稳定区分；
- 相关信息跨越多段时能否稳定整合；
- query 自身是否被后续噪声稀释；
- 指令、示例、工作记忆和正文之间是否互相竞争注意力。

所以，“1M token 可用”与“1M token 最适合当前任务”之间，中间差了整整一层工作负载分析。

### 1.5.3 一旦去掉字面匹配，真实长上下文理解会明显退化

如果说 *Lost in the Middle* 和 *Found in the Middle* 提供了理论上的位置偏置，那么更晚近的评测已经把问题推到更接近工程实战的地方。

*NoLiMa* 的设计很有价值，因为它专门去掉了传统 NIAH 里容易靠字面重合取巧的部分，逼模型做“没有明显表面线索的定位与关联”。结果是：在 32K 上下文时，13 个声称支持至少 128K 的模型里，有 11 个已经跌到各自短上下文强基线的一半以下；其中 GPT-4o 从 99.3% 掉到 69.7%。[^nolima] 论文给出的解释也很直白：上下文一长、字面线索一弱，attention 更难把相关信息拉出来。

这对 agent 场景几乎是一记正中靶心的提醒。因为 agent 的真实任务，恰恰很少是“把一句完全相同的话从大文档里找出来”。更常见的是：

- 从代码、日志、配置、文档之间建立隐含关联；
- 在不同证据之间做多跳推理；
- 区分“当前有效事实”与“旧状态残留”；
- 把系统提示、项目约束和任务目标同时保持在可执行状态。

这些都更像 NoLiMa，而不是单 needle NIAH。

### 1.5.4 到代码任务里，窗口越大也不代表理解越稳

如果用户任务是写代码、修 bug、跨仓库理解依赖关系，那么长上下文的真实挑战还要再上一个台阶。*LongCodeBench* 直接把问题放到了代码理解和修复上，而且评测的是 up to 1M context 的真实编码场景。作者的结论并不乐观：long-context 对所有模型仍是弱项；样例中，Claude 3.5 Sonnet 从 29% 降到 3%，Qwen2.5 从 70.2% 降到 40%。[^longcodebench]

这说明一个非常实际的事实：代码不是长文档摘要。代码任务通常要求：

- 精确定位局部符号与跨文件调用关系；
- 保持严格语义，而不是大意相近；
- 同时读取规范、测试、实现和错误信息；
- 在修改时避免把不相关上下文带进来污染决策。

这类任务对“相关 token 密度”和“局部因果链可见性”的要求更高，因此更容易在超长窗口里掉出最佳工作区间。

### 1.5.5 为什么 agent 比聊天更容易掉出最佳工作区间

普通聊天应用的上下文通常比较单一：对话历史 + 当前用户问题。agent 不一样。agent 的上下文往往同时掺着六类东西：

1. 用户目标与验收标准；
2. 系统/开发者约束；
3. 计划和中间状态；
4. 工具调用回执与观察结果；
5. 原始工作材料，如代码、文档、日志、网页；
6. 失败后的修复线索与历史尝试。

一旦把这些异质信息都堆进同一个窗口，模型面临的就不再只是“我有没有看过这段文字”，而是：

- 哪些 token 属于当前任务的真约束；
- 哪些只是历史痕迹；
- 哪些应该进入当前推理链；
- 哪些只该保存在外部状态里。

这也是本书一直强调 session、tool、verification 和 replay 的原因：不是所有信息都应该留在 prompt 里。很多信息应该变成结构化外部状态，再按需投喂。

### 1.5.6 工程结论：最佳工作区间是一个设计目标，不是自然礼物

综合前述研究与厂商文档，已经可以得出一个足够强的工程判断：[^ltm][^fitm][^anthropic-long][^gemini15][^google-long-context][^nolima][^longcodebench]

- 上下文窗口内部存在位置偏置；
- 指令和 query 的相对位置会显著影响结果；
- 单 needle 成绩不能代表真实任务鲁棒性；
- 随着任务从字面检索转向多证据整合、代码理解和多跳推理，长上下文退化会迅速放大。

因此，“最佳工作区间”不是学术修辞，而是 agent 设计的第一原则。它要求我们反过来设计任务，而不是默认把任务适配到最大窗口：

- 把 query、验收标准和当前约束放在高权重位置；
- 不把原始语料、状态事实、失败记录和 UI 表面混成一锅 prompt；
- 让模型看到尽可能高密度的相关证据，而不是最大体积的原始材料；
- 当任务天然可拆时，优先分解成多个局部问题，而不是强迫单个大窗口承担所有工作。

一句话总结：最佳工作区间不是“少喂一点 token”这么简单，而是“让每一段被喂进去的 token 都更接近当前决策所需的最小充分上下文”。

## 1.6 成本、时延和吞吐也不是线性的

讨论长上下文成本时，最常见的误区是只看 token 账单。账单当然重要，但真正把系统压垮的，常常不是“单次请求又贵了几毛钱”，而是 prefill 变慢、首 token 延迟上升、KV cache 撑大、并发吞吐下降、重试变贵、以及任务调度越来越难。

所以这一节要把“成本”拆成三本账：

1. API 计费账；
2. 模型推理账；
3. 系统调度账。

### 1.6.1 计费视角常常近似线性，但官方价格表本身也在提醒边界

以 OpenAI 2026 年 4 月 23 日公开价格页为例，GPT-5.4 标准输入价是 `$2.50 / 1M tokens`，缓存输入是 `$0.25 / 1M tokens`，GPT-5.4 mini 标准输入价是 `$0.75 / 1M tokens`。[^openai-pricing] 这说明在常规上下文范围内，账单通常可以先按“每百万 token 单价”来估。

但同一页也有一句很值得工程团队注意的限定：

> "Pricing above reflects standard processing rates for context lengths under 270K."

这句话的含义不是“270K 以上一定贵多少”，而是：连公开价格页都把超长上下文视为另一类服务条件。换句话说，提供方自己也承认，超长上下文不只是简单地把 token 数乘上单价那么朴素。

Google 在 Gemini 1.5 发布时也表达了同样的信号。它一方面宣布会提供 `"pricing tiers that start at the standard 128,000 context window and scale up to 1 million tokens"`，另一方面又提醒早期测试者应预期 `"longer latency times"`。[^gemini15] 这说明在提供方视角里，长上下文从一开始就是“性能与成本要单独优化”的模式，而不是对普通请求做线性外推。

### 1.6.2 真正的 killer 常常是 prefill，而不是 output token

从系统视角看，长上下文的核心痛点通常不在 decode，而在 prefill。原因很简单：在进入自回归生成前，模型先要把整段输入转成 KV cache 并完成注意力计算。输入越长，这一步越重。

*MInference* 的摘要给了一个足够刺眼的工程数字：[^minference]

> "30 minutes for an 8B LLM to process a prompt of 1M tokens"

而且同一句里明确点出了根因：这是由 attention 的二次复杂度驱动的。只要你还是在用 dense attention 的基本形态，序列长度翻上去，prefill 代价就不会跟着“温柔地线性增长”。

这也是为什么很多 long-context 优化论文其实都在打 prefill：不是大家都特别喜欢底层系统，而是因为这里是最直接的瓶颈。

### 1.6.3 长上下文的真实代价是“高计算成本 + 性能退化 + 位置偏置”联动

*LongLLMLingua* 的摘要把长上下文的三大问题总结得很准确：`"higher computational cost, performance reduction, and position bias"`。[^longllmlingua] 这句话很值钱，因为它把工程上常被拆开讨论的三个问题重新捆回了一起。

也就是说，长上下文不是只会带来一种坏处，而是三个坏处经常同时发生：

- token 更多，prefill 更重；
- 位置偏置更明显，中间信息更难被利用；
- 在噪声增多后，任务表现本身也开始下滑。

*LongLLMLingua* 还给出一个非常有启发性的结果：在 NaturalQuestions 上，压缩后可以用 `"4x fewer tokens"` 取得更高表现；在 LooGLE 上，成本降幅达到 94.0%。[^longllmlingua] 这组结果的意义不是“所有项目都该先做 prompt compression”，而是它再次证明：更多 token 并不天然等于更好结果。很多时候，更短、更密、更有结构的上下文，反而同时赢下质量和成本。

### 1.6.4 Google 官方文档其实已经把经济学结论说得很直白

Google 的 long context 文档在“限制”和“优化”部分给了两句很值得直接记进架构设计的提醒。[^google-long-context]

第一句是：

> "there is an inherent tradeoff between getting the right information retrieved and cost"

第二句是它后面的例子：如果你要取 100 条信息，并希望维持极高准确率，那往往意味着要发出很多次查询；文档给出的意思是，这时 caching 会显著影响总成本。[^google-long-context]

这段话可以翻成工程语言：长上下文不是“单次把大资料包交给模型”就万事大吉。真正花钱的往往是：

- 你要问多少轮；
- 每一轮是不是都把大上下文重新 prefill 一遍；
- 公共部分是否可缓存；
- 局部问题是否值得拆到局部上下文里处理。

这就是为什么 sub-agent 体系通常比单脑长上下文更省：它减少的是“重复把同一堆背景材料送进模型”的浪费，而不只是减少一次请求里的 token 数。

### 1.6.5 1M 和 5 个 200K，不能只比“总 token 一样多”

书里可以把这个比较讲得更严一点。

如果你做一个极端理想化假设：一个 1M 请求，和五个各 200K 的请求，总输入 token 恰好一样，而且没有任何重复背景、没有额外协调 token、也没有缓存，那么从“按 token 计费”的账单角度看，它们确实可能接近。

但这个假设在真实 agent 系统里往往不成立。因为 5 个 200K agent 很少真的会做成“5 个完整副本的大 prompt”。更常见的结构是：

- coordinator 持有目标、计划、约束和最终验收；
- 每个子 agent 只持有一个 shard 的原始材料；
- 公共制度性上下文通过缓存或固定 system prompt 复用；
- 向上汇报的是摘要、证据、diff、引用和中间产物，而不是整份原始语料。

这时候 `5 x 200K` 的真实总 token 常常小于 `1 x 1M`，而不是等于它。

更重要的是，就算总 token 恰好一样，prefill 计算量也不一样。若按 dense attention 做一阶量级估算：

- 单次 1M 上下文的 attention 规模约为 `1,000,000^2 = 10^12`
- 五次 200K 的总 attention 规模约为 `5 * 200,000^2 = 2 * 10^11`

也就是说，在“总 token 相同”的理想化条件下，`1 x 1M` 的 attention 量级仍然大约是 `5 x 200K` 的 5 倍。这不是某家 API 的具体计费规则，而是由 dense attention 的长度平方项直接决定的。

所以 1M 和 5 个 200K 的比较，至少要同时看三件事：

1. **账单**：是否真按总 token 近似线性结算。
2. **时延**：prefill 和 TTFT 是否被超长窗口拖垮。
3. **可调度性**：这些工作是否能拆成局部任务并行推进。

如果只看第一件事，很容易得出“总 token 一样，所以没区别”的假结论。

### 1.6.6 sub-agent 的经济学，不只是省钱，而是更容易拿到可接受的质量

很多团队把 sub-agent/swarm 只当成吞吐工具，这是低估了它。它真正带来的，是质量曲线和成本曲线的同时改善。

单个超长上下文的失败模式往往是：

- 原始材料过多，相关证据密度下降；
- 中间状态和历史痕迹污染当前任务；
- query 位置不稳定，重要约束被长正文淹没；
- 一次失败就要重做整段大 prefill。

而分解成 sub-agent 之后，你得到的是：

- 每个 agent 看到的上下文更短、更局部，位置偏置更可控；
- 每个 agent 的输入类型更单纯，更接近单一任务；
- 错误只需在局部 shard 重试，不必重灌整段全局上下文；
- coordinator 处理的是“证据摘要和冲突”，不是整个原始语料海洋。

换句话说，sub-agent 不是为了炫耀架构复杂，而是为了把每个 agent 压回它更容易成功的工作区间，再把跨 shard 协调交给 harness、session 和 verification。

### 1.6.7 什么时候仍然该用单个超长上下文

说到这里，也要把边界说清楚。不是所有任务都该拆成 swarm。以下几类任务，单个超长上下文仍然可能是合理选择：

- 必须对全局原文做一次统一排序、比对或证据归并；
- 任务主要是全局摘要，不涉及局部修改和重复迭代；
- 原始材料高度相关，拆分后反而破坏语义连续性；
- 上下文可以一次缓存，多轮查询主要复用同一大语料；
- 你更在意一次性全局理解，而不是并行吞吐。

但这些前提只要稍微动摇，sub-agent 方案往往就开始占优。尤其当任务同时满足以下三条时，几乎总该优先考虑分解：

1. 材料天然可分 shard；
2. 子问题之间可以先局部求解，再做全局汇总；
3. 每轮失败重试的代价很高。

### 1.6.8 工程结论：swarm 是长上下文经济学的自然产物

综合前述事实链，可以得出一个比“多 agent 更高级”更扎实的结论：[^gemini15][^google-long-context][^longllmlingua][^minference][^openai-pricing]

- API 账单有时近似线性，但公开定价本身已把超长上下文单独对待；
- prefill 的计算和时延并不线性；
- 长上下文还会叠加位置偏置和性能退化；
- 压缩、缓存、分块、分工往往能同时改进成本和质量。

因此，sub-agent 和 swarm 在很多工程系统里不是可选装饰，而是长上下文时代的一种自然经济形态。它们存在的原因并不是“让系统显得更聪明”，而是为了减少无效 prefill、提高证据密度、降低失败重试半径，并把每个 agent 留在更容易成功的上下文工作区间内。

[^ltm]: Nelson F. Liu et al., *Lost in the Middle: How Language Models Use Long Contexts.* 本章在此处使用其关于长上下文位置偏置与中段退化的结果；对应第 19 章参考文献 11。
[^fitm]: Cheng-Yu Hsieh et al., *Found in the Middle: Calibrating Positional Attention Bias Improves Long Context Utilization.* 本章在此处使用其关于 `"U-shaped attention bias"` 的分析；对应第 19 章参考文献 12。
[^anthropic-long]: Anthropic, *Prompting best practices: Long context prompting.* 本章在此处使用其关于长文档前置、query 后置与约 30% 质量提升的建议；对应第 19 章参考文献 13。
[^gemini15]: Google, *Introducing Gemini 1.5, Google's next-generation AI model.* 本章在此处使用其关于 NIAH 命中率、1M context pricing tier 与时延预期的表述；对应第 19 章参考文献 14。
[^google-long-context]: Google AI for Developers, *Long context.* 本章在此处使用其关于 performance variability、retrieval-cost tradeoff 与 caching 的说明；对应第 19 章参考文献 15。
[^nolima]: Ali Modarressi et al., *NoLiMa: Long-Context Evaluation Beyond Literal Matching.* 本章在此处使用其关于 32K 条件下模型退化统计，以及 GPT-4o 从 99.3% 降至 69.7% 的结果；对应第 19 章参考文献 16。
[^longcodebench]: Stefano Rando et al., *LongCodeBench: Evaluating Coding LLMs at 1M Context Windows.* 本章在此处使用其关于代码任务长上下文退化的样例数据；对应第 19 章参考文献 17。
[^longllmlingua]: Huiqiang Jiang et al., *LongLLMLingua: Accelerating and Enhancing LLMs in Long Context Scenarios via Prompt Compression.* 本章在此处使用其关于长上下文三类问题与压缩收益的结果；对应第 19 章参考文献 18。
[^minference]: Huiqiang Jiang et al., *MInference: Accelerating Pre-filling for Long-Context LLMs via Dynamic Sparse Attention.* 本章在此处使用其关于 8B 模型处理 1M tokens 需 30 分钟的摘要数字；对应第 19 章参考文献 19。
[^openai-pricing]: OpenAI, *API Pricing.* 本章在此处使用 2026-04-23 价格页中的 GPT-5.4 / GPT-5.4 mini 输入价格与 `under 270K` 限定；对应第 19 章参考文献 20。
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

## 1.7 让系统保持在区间内的关键机制

1. 可恢复、可追踪的工作区契约
2. 工具调用事件 hook（`before_*`、`after_*`、spawn hooks）用于可见性
3. 产物和验证器契约，用来确认输出事实
4. 从失败中更新 memory/skills 的自修复循环
5. 可回放状态 API，保证 UI/操作员表面保持一致

这就是“偶尔输出好结果”变成“压力下稳定输出”的方式。

## 1.8 工作流约束与自由探索的取舍

受工作流约束的执行能提供更强保证：

- 更好的阶段单调性
- 更好的产物可预测性
- 更容易回放和操作员诊断

自由探索在新颖问题解决上有更高上限，但方差更高。

实践策略是混合式：

- 对长时间/高成本/高风险片段使用工作流轨道
- 在明确预算和检查内允许有边界的自由探索

## 1.9 多 agent 编排与自治等级

当系统从 L2 走向 L3/L4 自治时，长周期稳定性比单轮聪明更重要。

- L2 式辅助行为可以容忍更多人工恢复。
- L3/L4 式委托执行需要自监控、修复和有边界的自治。

多 agent 编排通过行为分解提供帮助：

- 规划/协调 agent 管理阶段意图
- 专项 agent 执行狭窄工具领域
- 验证/操作员 agent 执行契约和升级

Harness 是让这种分解长期可靠的底座。

因此本书后续会在理论、成熟样本和一组内部失败案例之间来回切换。失败样本展示控制平面在哪里断裂；成熟样本展示哪些机制已经被工程化；理论解释为什么如果不把 session、tool、verification 和 replay 当作一个系统，同样的断裂会反复出现。

## 1.10 根因：LLM 不是状态机，也不是操作系统

LLM 擅长在给定上下文中补全、推理和生成，但它本身不负责维护外部世界的真实状态。上下文窗口不是数据库，聊天历史不是事务日志，模型的自信也不是验证证据。只要任务跨越多个工具、多次重试、多个页面状态或多个 agent，系统就必须回答几个模型无法单独承担的问题：

- 哪个任务是真正的当前任务？
- 哪个产物是声明过、验证过、可交付的产物？
- 哪个阶段已经完成，哪个阶段只是模型说“看起来完成”？
- 失败时应该把哪类证据反馈给 agent、开发者和操作员？

这就是 harness 的根因。它不是为了弥补某个模型“不够聪明”，而是为了给概率生成系统补上确定性的运行时边界。模型越强，能做的事越多，外部状态和副作用越复杂，harness 反而越重要。

## 1.11 两层驾驭工程：先把对象分清

这里先把一个容易混淆的点拆开：驾驭工程至少有两层。

第 1 层是 AI 编码过程的驾驭工程。这里 agent 是工程团队的生产工具，最终产品仍然是代码、服务、应用或基础设施。OpenAI Codex 团队的 1M LOC 案例、Fowler 的代码 agent harness、Codex 开源仓库里对 sandbox、approval、MCP、rollout 和 `AGENTS.md` 的显式边界，都属于这一层。[^layer1-harness-ch1]

第 2 层是 AI agent 自身的 harness 工程。这里产品本身就是 agent，用户直接把任务交给它。系统要处理 session 恢复、sandbox 权限、工具调用审计、长任务重启、客户环境隔离、gateway 路由和合规签字。Anthropic 的 session / harness / sandbox 三抽象、Claude Code 源码里对 compaction、resume、worktree、sub-agent 的拆分，以及 OpenClaw/Hermes 在 gateway、memory、skills、cron 和多会话上的控制面，都更接近这一层。[^layer2-harness-ch1]

Claude Code 和 Codex 站在这两层的分界线附近：它们既是编码生产工具，也体现出长任务 harness 产品的形态。OpenClaw 和 Hermes 更明显属于 Layer 2：产品本身就是会话、记忆、gateway、skills、cron 和 sub-agent 的控制面。本文掌握的那组内部失败案例只承担一个角色：反证样本。它有价值，不是因为它代表行业，而是因为它把同一种结构性问题暴露得很具体。

## 1.12 把控制论抽象落到 Claude Code / Codex 的运行时结构

如果前面的控制论讨论只停留在“agent 是反馈系统”这个抽象层，那还不足以指导实现。真正有用的地方，在于把控制论里的几类角色，直接对照到成熟 agent runtime 里能看见的部件。一个能长期工作的 agent 系统，最终都要把下面五件事做成显式结构：

1. 受控对象：当前正在推进的 task / session / thread，而不是一段模糊聊天历史。
2. 目标与约束：用户目标、验收标准、artifact 契约、权限边界、预算边界。
3. 传感器：tool 回执、文件变化、validator 结果、child summary、turn/item 事件。
4. 控制器：负责决定继续、压缩、重试、派工、升级、打断、恢复的主循环。
5. 执行器：shell、文件系统、MCP、子 agent、worktree、外部 API、artifact 写入。

按这个框架回看 Claude Code，它的运行时结构就很好读了。`ToolUseContext` 和 `query.ts` 在扮演控制器入口：它们握着当前任务线程可见的工具、权限、记忆、MCP 连接、agent 定义与状态。`StreamingToolExecutor.ts` 是执行器调度面，负责让并发安全工具并行，让非并发安全工具串行；`sessionStorage.ts`、`fileStateCache.ts`、`agentSummary.ts`、`diskOutput.ts` 则构成传感器与状态保持层，让系统持续知道“现在做到哪了、产物在哪、子 agent 在忙什么、哪些事实应该外置存储”。而 `microCompact` / `compact.ts` / `apiMicrocompact`、`resumeAgent.ts`、`worktree.ts` 做的事情，本质上都是稳定性控制：上下文快失真时压缩，任务被打断时恢复，副作用可能互相污染时隔离。[^runtime-bridge-ch1]

Codex 则把同一套逻辑拆得更显式。`Thread` / `Turn` / `Item` 先把受控对象建模清楚：什么属于长期历史，什么属于一次执行，什么属于需要进入未来上下文的输入、输出与副作用。`thread-store` 与 `rollout` 负责持久层；`app-server` 协议和通知流负责把观测总线公开出来；`tools` registry、`command/exec`、`fs/*`、`mcpServer/tool/call`、`spawn_agent` 等接口则组成执行器平面。再往外一层，`sandboxing`、approval、`thread/resume`、`thread/fork`、`turn/interrupt` 这些边界，扮演的正是控制论里“限制增益、抑制失稳、允许系统在偏离后重新收敛”的控制机制。[^runtime-bridge-ch1]

把这两套系统放在一起看，就能得到一个很实用的判断：所谓“Claude Code 为什么能成为万用 agent 工具”，并不是因为它找到了某个覆盖万事万物的 prompt；所谓“Codex 为什么像 agent 内核”，也不是因为它只是把 CLI 写得更模块化。真正的原因是，它们都把感知、决策、执行、状态保持、纠偏和恢复做成了 runtime 的一等对象。正因为这些对象存在，系统才有能力同时处理写代码、写文档、写 slides、调用 CLI / API、通过 MCP 接入外部能力、再进一步 orchestrate 多个 agent 共同完成任务。

因此，下一章不该被当成产品介绍，而应被当成运行时解剖：Claude Code 让我们看到一套成熟 agent runtime 会长出哪些器官，Codex 让我们看到这些器官如何被压成更清楚的骨架和协议。第 2 章展开的是这套结构如何支撑“既广又深”的 agent 能力；第 3 章再用一组匿名失败链说明，一旦这些部件缺位，系统会怎样重新退化成不可靠的聊天壳。

到这里，第 1 章只做了一件事：说明 harness 不是可选的产品装饰，而是让 LLM 长任务留在有效工作区间内的控制系统。第 1.12 节进一步把这个控制论抽象压到了运行时骨架上。接下来的第 2 到第 4 章会依次回答三个问题：成熟系统究竟在建设什么；当这些机制缺位时系统会怎样坏；这些问题最后应当落成什么样的运行时架构。

[^layer1-harness-ch1]: 本章在此处综合 Fowler 关于 coding agent harness 的框架，以及 OpenAI 与 Codex 开源仓库关于 1M LOC、`AGENTS.md`、sandbox、approval、MCP 与 rollout 的工程边界；对应第 19 章参考文献 1、2、21。
[^layer2-harness-ch1]: 本章在此处综合 Anthropic 关于 managed agents 与 long-running harness 的接口抽象、Claude Code 本地源码镜像所体现的 session/compaction/sub-agent 机制，以及 OpenClaw/Hermes 在 gateway、memory、skills 与 sub-agent 上的产品形态；对应第 19 章参考文献 3、4、6、7、22、23、24。
[^runtime-bridge-ch1]: 本章在此处综合 Claude Code 本地源码镜像、*Dive into Claude Code* 对 Claude Code 五层架构的公开分析，以及 Codex 开源仓库中 `app-server`、`app-server-protocol`、`tools`、`thread-store`、`rollout`、`sandboxing` 与 thread/turn/item 相关接口，用来把控制论中的受控对象、传感器、控制器、执行器与稳定性边界，映射到现代 agent runtime 的具体器官；对应第 19 章参考文献 21、24、41。

---
