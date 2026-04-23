# 第 10 章 · 两种协作循环 —— 短程与长程

> 一个每次从零开始的实习生,无论他那一天多聪明,对组织的价值都是**固定的**。
> agent 也一样。

## Ariely 再度敲门

楔子里引过一次的那句话,要在本章再出一次:

> *"Big data is like teenage sex: everyone talks about it, nobody really knows how to do it, everyone thinks everyone else is doing it, so everyone claims they are doing it."*
> —— Dan Ariely, 2013

这句话在 2013 年是对 "大数据" 的讽刺。2026 年把 "big data" 换成 "agent",句子原封不动照用。全书三次回响,楔子是第一次,本章是第二次,结语会是第三次 —— 三次出现的目的不同。楔子用它扣"问题意识":**概念先于实践,词先于事**。结语会用它提醒"命名不等于掌握"。本章用它做**临床诊断**:**几乎所有声称"我们在做 agent" 的团队,真正做到的其实是短程循环那一半;他们把短程循环当成长程循环在卖,而自己不知道**。

这一章的活,就是把两类循环的边界钉清楚,让读者下次看到一句 "我们的 agent 能学习"、"我们的 agent 越用越聪明",能先问一句:**你们做的是哪一类循环**?

## 短程循环:所有 agent 都有

先把读者熟悉的那一半放下来。

凡你听过的 agent 架构 —— ReAct、Reflexion、Plan-and-Execute、CodeAct、Deep Research、Computer Use Agent —— 内核都是同一个骨架:**Plan → Act → Observe → 判断是否继续**。这个骨架本书叫它**短程循环**。它的尺度是**一次 agent 执行**:短则几秒(回答一个问题),长则几小时(做完一次深度研究)。但无论多长,它都有明确的终点 —— 任务完成、预算耗尽,或触发一次人类 checkpoint。

短程循环已经被这个行业研究透了。ReAct 2022 年的论文、Reflexion 2023 年的论文、Plan-and-Execute 系列、各种 tool-use 基准,全部是在短程循环的尺度上在做优化。工程上你要关心的事情也成熟了:

- **终止条件** —— 模型有"再试一次"的漂移倾向,harness 必须有预算控制、冗余检测、进度度量。[[case-karpathy-autoresearch]] 里 Karpathy 就把显式步数上限 + 无进展检测当作**双重护栏**,一根都不能省。
- **Context packing** —— 每一轮把 session 里哪些事件塞进 context,是 harness 决定,不是模型决定。Ch 6 §6.1 讲过的 `getEvents()` 接口,就是让 packing 成为可编程对象。
- **Observability** —— 每一步的输入输出都写进 `session.jsonl`,作为事后 debug 与合规审计的唯一真相源。

**短程循环的工程正确性,本书 Part B(Ch 6–9)已经讲完。** 本章不重复那块地图。本章要讲的是被短程循环的完善性掩盖的另一件事:**你以为把短程循环做好 agent 就做好了。其实没有**。

## 长程循环:驾驭工程独有的那一半

再看第二张骨架:**Accrete → Resume → Evolve**。

它的尺度不再是一次执行,是 agent 的**全生命周期** —— 跨多次会话、多天、多周,甚至多月。三个阶段各自管一件事:

- **Accrete(积累)** —— 每次短程循环跑完,产出的不是"完成任务"这一件事,还有副产品:有效的事实、验证过的方法、踩过的坑。这些副产品要被**沉淀**进 session,并且在时机到了的时候**提升**到 wiki 层(Ch 11 会讲 promotion)。积累不是自动发生的,积累是工程动作。
- **Resume(恢复)** —— 下一次短程循环启动,不从零开始:它从 wiki + session 里加载**上次的稳定知识 + 未完成状态**,在已积累的高度上起跑。
- **Evolve(进化)** —— Schema、tool vocabulary、skill 目录随时间修订;失败教训变成新的 guide 或 sensor;整个 harness 在 verification 约束下持续演化。

**短程循环所有 agent 都有;长程循环是驾驭工程独有的。**

这句话要仔细念两遍。因为整个行业的一个最广泛的误读,就是把"短程循环做得很好"当成"我们有 agent"。这件事在 demo 阶段你感觉不到区别,在半年后你开始感觉痛。

## 长程循环从哪里来

长程循环不是本书发明的,它的雏形在 [[case-karpathy-autoresearch]] 的**两文件祖训**里就已经出现。Karpathy 的 `index.md` 是"rewritten-every-time 的内容目录",`log.md` 是"append-only 的时间线";两份文件合起来就是一次最小的 **Resume 协议** —— 下一次 ingest 启动,agent 读 index 知道有什么、读 log 知道发生过什么,不从零开始。**两文件是最小的长程循环**。

但 Karpathy 的两文件只做了 Accrete 的一小块和 Resume 的一部分,**没有 Evolve**。`pi-autoresearch`(Dave Copeland 的开源版本)把 Accrete 扩展到 benchmark-guided 的代码优化;[[case-ascent-research]] 把 Evolve 扩展到知识治理 —— wiki promotion、demotion、lint、schema 修订全部成为一等对象,而不是团队默契。

你手上这本书的写作过程,本身就是一次 ascent-research 式的长程循环在跑。每一章的草稿,都是某一次短程循环的产出;章与章之间,wiki 在生长、SCHEMA 在修订、奠基文从 10 条加到 11 条 —— 这些是**在单次短程循环之外**发生的事。如果本书只靠短程循环写,你现在读到的第 10 章会是一个**遗忘了前九章的草稿**。

## 没有长程循环的 agent,是每次从零开始的实习生

很多团队把"每次 session 里跑一个 ReAct"当成"我们的 agent 在学习"。这是本章最想命名的反模式:**短程循环冒充长程循环**。它的代价在三个维度上都看得见。

**对用户的体验代价。** "上次聊过的东西要重说一遍。" "这个 edge case 我们讨论过三次了。" "昨天调通的 prompt 今天不 work。" 每一句抱怨背后,都是同一件事:agent 不积累。用户在替你维护"agent 记不住但本来应该记住"的那一截记忆 —— 他每次对话都在给一个失忆症病人读病历。

**对组织的隐性成本。** 踩过的坑没有被 agent 系统吸收,新成员入职时仍然要靠口耳相传。所有的教训都活在某几个资深工程师的头脑里,随人员流动流失。agent 作为组织资产的复利**根本没有发生** —— 它是一个永远停在第一天的实习生,日薪不低,回报率零。

**对产品的可靠性代价。** agent 的能力边界不随时间扩展。这个月能做 100 类任务,半年后还是 100 类,因为没有 evolve 机制把"这次做对了的新方法" 升级成"组织能稳定调用的 skill"(Ch 11 会展开)。你花钱在 demo 上很漂亮,花钱在生产上很疲惫。

类比一下人类员工。一个永远不积累经验的实习生,无论他那一天多聪明、多努力,他对组织的价值都是**固定的**;一个能积累经验的员工,价值随时间**复利**。agent 也一样。

**Ariely 引用在这里第一次落地成工程判断**:所有人都在谈 agent,但谁家 agent 的能力曲线三个月后还在涨,谁家停在起点,看长程循环就知道。这个差别,从 demo 里看不出来。

## 两类循环在四柱上的不同侧重

两类循环共用 Part B 的四柱基础,但对每一柱的**演化节奏**要求不同。

| 柱 | 短程循环的侧重 | 长程循环的侧重 |
|---|---|---|
| **Session** | 本次执行的事实流;支持短程 resume,context 快满时触发 reset | 跨会话的事实仓库;支持长程 accrete,provenance 是一等公民 |
| **Harness** | 本次的 plan → act → observe 调度;稳定跑 | 跨会话的 schema 修订、loop 变体升级;可演化跑 |
| **Tools** | 本次能调哪些工具、每次 tool call 进 audit | 工具目录随时间扩展;新工具的 spec review + 权限边界审计 |
| **Verification** | 本次步骤的 unit + trace 验证;actor 与 generator 分离 | 跨会话 golden trace 回归 + spec 演化 verify + sycophancy-aware lint |

**一句话总结这张表**:短程循环要求四柱"稳定跑",长程循环要求四柱"**可演化跑**"。前者是工程正确性,后者是工程可持续性。很多团队只看前者,所以才会在第二年发现自己的 agent 系统被自己的积累堵死 —— tool 变量名冲突、skill 重复、wiki 腐烂。这些都是长程循环没有被工程化的症状。

## 两类循环的缝合点:Context Reset with Structured Handoff

短程循环和长程循环之间,最精妙的工程连接,是 [[anthropic-harness-design]] 给出的 **context reset with structured handoff**。

Anthropic Labs 在跑 4 小时 coding 任务(Retro Game Maker benchmark)时碰到一个现象:单个 agent 跑到 context 用到 ~70% 时,会出现 **context anxiety** —— 开始表现得像一个被催着交卷的学生,草草下结论、跳过子目标、把原本能做的事情做一半。Ch 2 §1.2.1 讲过这个命名。他们试过各种"更聪明的 summarization" —— 全失败。真正有效的修法,只有一种:

**硬重置 + 结构化移交。** 把当前 agent 进程整个杀掉,起一个全新的 agent,context window 清空;新 agent 通过 session 读到前 agent 的**关键产出 + 未完成事项 + 当前状态快照**。这里最关键的一个细节是:移交**不是通过 context 注入**,是**通过 session 事实流**。前 agent 不是把信息"塞到新 agent 的 prompt 里",而是前 agent 写入 session,新 agent 启动时从 session 读。

这个机制,本质上是**用"一次短程循环的结束 + 另一次短程循环的开始" 代替一次超长 context 的延续**。它只有在 session 独立于 context 的前提下才可行 —— Ch 6 的 session ≠ context window 分界,这里第一次结出果实。它的存在,让**长程循环可以由若干段短程循环缝合而成**,而不是被硬绷成"一个超长的短程循环"。

Anthropic 的实证非常直观:solo Claude 跑这个任务,20 分钟 9 美元,输出浅;三 agent harness(planner / generator / evaluator)+ context reset,4 小时 80 美元,产出是生产质量。**harness 解锁了模型本来就有、但被 context anxiety 锁住的能力**。这不是"模型变强",是短程与长程被工程正确地缝合。

这一手为什么非得是 context reset,不能是"把所有历史塞一个更大 context 里",值得用一张表钉一下 —— 两种做法在四个维度上的工程差异:

| 维度 | 长 context 延续 | Context reset + structured handoff |
|---|---|---|
| 状态载体 | context window 本身 | session.jsonl(与 context 解耦) |
| 失败边界 | 单个 agent 进程挂 = 全部丢 | 单个 agent 进程挂 = 重启新 agent resume |
| 上下文污染 | 前半段噪声会污染后半段推理 | 每次 reset 是一次清场 |
| 可审计性 | 事后要从 context 反推发生过什么 | session 是真相源,天然可 replay |

左列在短任务里没区别,在超过 context 40–60% 之后开始显著劣化;右列在短任务里是**过度工程**,在 4 小时以上的长任务里是**必要条件**。两栏的分界线就在"任务长度能否被一次短程循环装下"这一个判据上。

## 两类循环的一个组织诊断 —— 看你们在哪一类里

在把两类循环推到抽象层之前,先给一组**直接可用的组织诊断问题**。每一组问题,答"有"就说明你们在该类循环上已经进场;答"没有"就说明还没有进场 —— 进场的条件并不是"团队水平",是"**有没有把一件具体的事做成协议**"。

问题一(短程):**你的短程循环终止条件是**什么**,写在哪儿**?是"我们工程师感觉应该停了" 写在一张 Confluence 上,还是 `max_iters=20 | no_progress_for=3_rounds | human_checkpoint_triggered` 写在代码里?前者在压力下会变形,后者不会。

问题二(短程):**一次 tool call 失败,feedback 到下一次 plan 的路径是什么**?如果答"agent 自己会读 error 调整",那是 prompt 层解释,不是 harness 层。harness 层的回答应该能说清楚 error 的哪段字符进 next prompt、怎么截断、哪些 stack frame 保留、哪些丢弃。

问题三(长程):**新成员入职,三小时能摸清你们 agent 的能力边界吗**?如果能,你们有某种版本的 AGENTS.md + docs/skills/ 架构。如果不能,你们的长程循环没有 Accrete 层 —— 能力没被外化,只活在资深工程师的脑子里。

问题四(长程):**上线六个月的 agent,现在它比上线第一天多会做几类任务**?数得出来吗?数得出来,你们的 Evolve 在跑;数不出来,你们是短程循环冒充长程循环的典型形态。

问题五(两类之间):**context 用到 70% 会发生什么**?草草收尾、乱引用、结论跳步 —— 是 context anxiety。触发 structured handoff、起新 agent、从 session 读上一段状态继续 —— 是两类循环被缝合上了。

**这五个问题的价值不在"答对",在"答得出来"**。一个团队能用精确语言回答这五问,说明两类循环在他们的工程对象里都是一等公民;支支吾吾的,说明他们的 agent 系统里有一个**语焉不详的暗角** —— 这个暗角很可能就是他们产品不稳定的来源。

## 一个具体例子:本书写作本身

把前面几节具体化,用一个读者能检查的例子 —— **你现在读的这本书**,写作过程本身就是一次长程循环的活样本。

**Accrete**。每一次 `ascent-research loop` 跑完,产出新 wiki 页或更新既有 wiki 页;每一次 `add` 摄入新的 raw 源;每一次章节草稿由 `/tech-writer` skill 从 spec 生成。每一步都写进 `session.jsonl`,append-only,不改不删。这是积累的机械底座。

**Resume**。任一工程师接过这个 session,拿到 `SCHEMA.md` + `wiki/*.md` + `session.md` 三份文件,就能完整重建现场 —— 上次做到哪儿、下次从哪继续,不依赖任何一个人的记忆。你此刻读的这一段,是在第三位工作者接手之后写的;她不知道前两位私下聊过什么,但她**不需要知道** —— Resume 协议把所需的一切都放在文件里。

**Evolve**。Stanford Meta-Harness 作为第 11 个奠基文被加入后,SCHEMA 追加了一条 "Round 3 focus",wiki 新开 `stanford-meta-harness.md`,Ch 3、5、11、12、13 都被回头修订。这是一次完整的"**评估新证据 → 更新稳定知识 → 回修下游章节**"链条。evolve 不是哲学意义上的进化,它是具体的、可 grep 的、在 git log 里能看到的一串 commit。

这个例子值得细看的一个点是:**两类循环不是并列,而是嵌套**。长程循环的每一步,里面都有若干次短程循环(每一章的写作、每一次 wiki 的 ingest、每一次 schema 的 lint);长程循环的 evolve 阶段,会**回过来改短程循环的规则**(改了 schema,下次章节生成就按新 schema 来)。这和 Ch 3 讲的 feedforward / feedback 控制一致 —— 长程循环就是对短程循环的**外层 feedback**。

## 读完本章,第三部分剩下的章怎么看

本书 Part C(Ch 10–12)的三章,不是在讲三件相互独立的话题,是在展开**长程循环的三个维度**:

- **Ch 10(本章)** —— 长程 vs 短程的区分
- **Ch 11** —— 长程循环的 **Accrete** 阶段:知识如何沉淀、skill 如何从候选晋升为组织能力(两级结构同构,所以合并一章)
- **Ch 12** —— 长程循环的 **Evolve** 阶段:reflexive harness 的边界在哪,agent 改自己改到什么程度要叫停

下一章开始讲 Accrete 的时候,读者很容易把"knowledge distillation" 误读为"更好的 memory",把"skills" 误读为"prompt 库",把"reflexive harness" 误读为"AI 伦理"。**这三个误读都来自同一件事:没有把话题放在长程循环的维度上看**。请带着两类循环的区分读下去。

## 回到 Ariely

本章开头的 Ariely 引用,现在可以合上了。

"everyone talks about it" —— 所有人都谈 agent。
"nobody really knows how to do it" —— 真正把长程循环工程化的少得可怜。
"everyone thinks everyone else is doing it" —— 每家 demo 都看起来很 agent,所以每家都觉得"别人在做"。
"so everyone claims they are doing it" —— 招聘 JD 写"构建 agent 系统",内部汇报说"agent 已上线"。

**但短程循环做得再好,没有长程循环,agent 就还是那个每天从零开始的实习生**。

Ariely 的这句话在结语还会响一次。那一次的主题会是"命名不等于掌握"。而在本章,我们先让它落地成一个问题:**下一次有人告诉你他们的 agent 在"学习",请先问一句:它的 Accrete / Resume / Evolve 分别写在哪个文件、由谁审、用什么 verification 拦截漂移?** 三个问题都答得上,那是真在做驾驭工程。任何一个答不上,都是短程循环在冒充长程循环。

---

## 可观察信号

- 关掉你的 agent 一周再打开 —— 它**记得上次的进度**吗?记得的是"对话历史",还是"有效事实"?
- 你的 agent 用得越久,是**越来越好用**还是**越来越臃肿**?越好用 = evolve 机制在工作;越臃肿 = 只有 accrete 没有 demotion。
- 团队里那些"隐性调试经验",有没有被 agent 系统**吸收**到 wiki 里?还是仍然只活在某个同事的头脑里?
- 你的长任务跑到 context 70% 会怎样?agent 草草收尾(context anxiety),还是 harness 触发 structured handoff?

---

## 本章核心论断

1. **两类循环的尺度不同** —— 短程循环 = 一次执行(几秒到几小时),长程循环 = 全生命周期(跨多天、多周、多月)。
2. 短程循环所有 agent 都做,本书 Part B 已讲完;**长程循环是驾驭工程独有的**。
3. 没有长程循环的 agent = 每次从零开始的实习生;价值固定,**不复利**。
4. 长程循环三阶段 **Accrete → Resume → Evolve**,分别依赖四柱的不同侧重;四柱同一套,演化节奏不同。
5. **Context reset with structured handoff** 是两类循环的缝合点;它依赖 session ≠ context window 这个根本分界。
6. 两类循环**不是并列,是嵌套**:长程循环由若干段短程循环构成,长程循环的 evolve 会回过来改短程循环的规则。
7. Part C(Ch 10–12)三章分别展开长程循环的三个维度:本章是入口,Ch 11 讲 Accrete,Ch 12 讲 Evolve 的边界。

---

## 本章奠基文对齐

- [[case-karpathy-autoresearch]] —— 两文件 resume 祖训、长程循环原型
- [[anthropic-harness-design]] —— context reset with structured handoff、4-hour task 实证
- [[openai-harness-engineering]] —— 短程循环在 AGENTS.md + `docs/` 架构中的工程正确性

## 本章对应 wiki 页

- [[concept-agent-loop]] · [[concept-state-durability]] · [[case-ascent-research]] · [[ariely-big-data-quote]]

---

**有了两类循环的语言**,第 11 章进入长程循环的 Accrete 阶段:agent 在积累的两级资产 —— 事实(知识)与方法(skill)—— 各自怎么沉淀、晋升、降级。两级的治理原则同构,所以合并在同一章里对比着讲最清楚。
