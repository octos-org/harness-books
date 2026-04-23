# Preface: Why this book exists

Octos already proved a hard truth: a powerful model plus prompt tricks can look brilliant for demos, then fail under real traffic, long-running jobs, reloads, and multi-session concurrency.

This book captures the harness engineering lessons that turned that pattern into a factory posture:

- deterministic task lifecycle
- durable contract state
- typed progress/event ABI
- validator-gated completion
- replayable UI truth
- operator-visible failure causes

Those lessons are not abstract. They were forced out of Octos by background-task progress drift, `run_pipeline` / `deep-search` status mismatch, session contamination, artifact contract gaps, validator incompleteness, and operator blind spots. The book keeps returning to those incidents because they show the same pattern from different angles: the model was not the bottleneck, the control system was.

The goal is not architecture purity. The goal is reliable outcomes when the model, network, plugins, browser tabs, and user behavior are all messy.

---

### Expanded Source Material


#### From `00-frontmatter.md`: 驾驭工程

_Source role: book positioning, audience, and frontmatter._


#### 驾驭工程

##### 面向意图的工程学 —— 人与 AI 如何共同进化

---

**ZhangHanDong** · 著

---

##### 内容简介

当 2023 年"prompt engineering"成为新的热词,2025 年"context engineering"接棒,2026 年业界几乎同时涌现出一组关于 **harness engineering** 的奠基文——Martin Fowler、OpenAI、Anthropic、MindStudio、Neo4j、Milvus、Karpathy、AIOS Foundation、Stanford IRIS Lab 从不同的入口给出了各自的回答。

**但这些文本加在一起,仍然没有告诉一个工程团队:真正做驾驭工程时,每天要决定的是什么?**

本书尝试给出答案。第一件要做的事,是把"驾驭工程" 这个词**横跨的两层划清**:

- **Layer 1 · AI Coding 过程的驾驭工程** —— 软件工程这门老学科面向 AI 时代的进化;agent(Codex / Claude Code)是你的生产工具,**产品仍是代码本身**。Fowler 的《Harness engineering for coding agent users》、OpenAI 的 1M LOC 实证、MindStudio 的五柱分类,都在这一层。
- **Layer 2 · AI Agent 自身的 Harness 工程** —— agent 系统的运行时基础;**产品就是 agent**。Anthropic Managed Agents 的三抽象(session / harness / sandbox)、AIOS 的 LLM-as-OS、Neo4j 的 memory layer、Milvus 的 execution layer,都在这一层。

两层**正交**(同一家公司可能只做其中一层、也可能两层都做),但共享一组工程原则 —— 面向意图、稳定抽象、验证独立。基于十篇奠基文的精读、三十余项一线工程实践,以及作者本人在 `octos`、`dora-rs`、`ascent-research`、`agent-spec`、`mempal` 等开源项目中的实操经验,本书将驾驭工程归纳为四根**不随模型能力变化的稳定支柱**:可恢复的 session、可替换的 harness、可问责的 tools、独立于生成的 verification。

然后,本书进一步追问:当模型越来越强,这些支柱会消失吗?作者的论证是 —— 恰恰相反,**AI 越强,驾驭工程越值钱**。这是一门反脆弱的学科。它的命题不是"AI 有缺陷所以需要兜底",而是:**任何足够重要的 AI 系统,都需要一个独立于该系统自身的验证层,并且这个独立性是结构性的,不是能力性的**。

##### 适合谁读

- **工程团队 lead** —— 你们用 AI 写代码,想要把"临时流程" 升级成"可复制的工程学科"(Layer 1 的主要读者群)
- **Agent 产品团队** —— 你们做的产品**本身就是** agent,合规、运维、长任务可靠性是生死线(Layer 2 的主要读者群)
- **做三年尺度架构选型的技术决策者** —— 你想知道什么会被模型升级清算、什么会更值钱
- **研究 agent systems 的学术工作者、关注 AI 治理与合规的技术管理者** —— 反脆弱四支柱对应的四套监管框架(EU AI Act / SEC / FDA / GDPR)是本书最直接的合规工具

第 1 章会用三问帮你判断自己站在哪一层。

##### 不适合谁读

- 寻找"最好用 prompt 模板" 的初学者 —— 本书假设你已跨过 prompt engineering 阶段
- 相信 AGI 会在明天到来从此不需要任何工程 —— 请直接读结语里的压力测试

##### 致谢

本书的写作本身是一次驾驭工程的实验 —— 所有研究都在 `ascent-research` 会话中进行,二十余个 wiki 页面 + 多张 hand-drawn SVG 作为本书的知识底库持续演化。感谢 Andrej Karpathy 的 autoresearch 原型、pi-autoresearch 的开源社区、Anthropic Managed Agents 团队、OpenAI Codex / Frontier 团队、Stanford IRIS Lab Meta-Harness 作者组,以及 Martin Fowler 持续不懈地命名这个学科的工作。

特别感谢 Dan Ariely —— 他 2013 年那句关于 big data 的俏皮话,给了这本书一条贯穿始终的黑色幽默线索,它在楔子、第 10 章、结语三次回响。

---

*本书使用 [ascent-research](https://github.com/ZhangHanDong/ascent-research) 进行素材调研,使用 [mdbook](https://rust-lang.github.io/mdBook/) 进行组织与渲染。书写过程的 session 目录完整公开于 `~/.actionbook/research/harness-engineering/`,读者可 fork 该 session 作为自己的调研起点 —— 这本身是驾驭工程长程循环的一次公开演示。*


#### From `00-prologue.md`: 楔子 · 十年前的 Big Data,今天的驾驭工程

_Source role: larger-book opening argument and two-layer framing._


#### 楔子 · 十年前的 Big Data,今天的驾驭工程

> *"Big data is like teenage sex: everyone talks about it, nobody really knows how to do it, everyone thinks everyone else is doing it, so everyone claims they are doing it."*
>
> —— Dan Ariely,杜克大学,2013 年 1 月[^1]

十三年过去了。

把那句话里的 big data 换成 harness engineering,你今天仍然能发一条让所有人转发的推文。

2026 年 4 月,Martin Fowler 的个人网站上出现了一篇题为《Harness engineering for coding agent users》的长文[^2]。OpenAI 在两个月前发布了《Harness Engineering: Leveraging Codex in an Agent-First World》[^3],讲述三个工程师用五个月时间让 Codex 写出一百万行代码、一千五百个合并 PR、人类一行代码都没有写。Anthropic 几乎同一时间发布了两篇文章:一篇叫《Harness Design for Long-Running Application Development》[^4],一篇叫《Scaling Managed Agents: Decoupling the brain from the hands》[^5]。Medium 上 Fisher Zhang 的一篇短文给这一系列爆发贴了个绝妙的标签 ——《Harness Engineering: The Oldest New Idea in AI》[^6]。Neo4j、Milvus、MindStudio、Stanford IRIS Lab、甚至 AIOS Foundation 下面的学术社区都在同一个季节里发出了自己关于 harness 的论述[^7]、[^8]、[^9]、[^10]。

如果你关心 LLM 应用工程,你已经无法不注意到这个词。如果你关心更深一层的事情,你大概已经开始困惑:harness 到底是**一个新工具**、**一个新学科**,还是**只是一组我们本来就应该知道、只是现在终于有了名字**的事情?

##### 先划清:两种完全不同的"驾驭工程"

最快让这个困惑消解的办法,不是争"harness 是什么",是先**看看这些文本讲的到底是同一件事吗**。

翻开 Fowler 和 OpenAI 两篇。他们讲的,是一种**软件工程师的日常** —— 团队三个人,用 Codex 写自己的 SaaS 产品,用 AGENTS.md 作知识目录,用 CI 做架构约束,用 property test 做质量门。agent 是**他们的工具**,产出是**他们的代码**。没有用户知道背后有 AI。

翻开 Anthropic 的两篇、AIOS 那一篇、Neo4j、Milvus、Karpathy。他们讲的是**另一件完全不同的事** —— 他们的**产品本身就是 agent**。用户打开应用,和 agent 对话,让它帮自己完成任务。工程关注点是:session 怎么在客户 VPC 里跑、崩了怎么 resume、出事怎么审计、合规怎么签字。

**这两件事不是同一件事**。它们有共同的词汇 —— harness、tool、session、verification。但客户、产出、合规、时间尺度**全不同**。Fowler 的文章对着一家用 Codex 的团队有效,对着做 agent 产品的团队只是部分有用;Anthropic Managed Agents 讲的 session 三抽象,用在手工用 Codex 写代码的团队身上是 overkill。

本书的第一件基础动作,是把这两层**钉开**。

- **Layer 1 · AI Coding 过程的驾驭工程** —— 软件工程面向 AI 时代的进化
- **Layer 2 · AI Agent 自身的 Harness 工程** —— agent 系统的运行时基础

两层**正交**。同一家公司可以只在 Layer 1、只在 Layer 2、或两层都在;但不管哪种情况,**先搞清楚自己站在哪层**,是读任何 harness 文献的前置条件。第 1 章会用三问帮你定位。

##### 三个常见回答,都不完整

困惑的根源,其实在于业界已有的三种"harness 是什么"的回答,每一种都**绕开了最难的问题**。

**第一个回答是"新工具"。** 打开任何一篇介绍性文章,你会看到 harness 被描述成 agent 运行时环境里的那些具体东西:memory、tools、state、context、execution、evaluation。这种描述没错,但它不解释**为什么这些东西突然一起变重要了**。它们都不新。memory 是数据库的事,tools 是 RPC 的事,sandbox 是虚拟化的事。为什么 2023 年我们不这么写,2026 年我们必须这么写了?

**第二个回答是"新学科"。** Fisher Zhang 的三段论干净利落:2023 年叫 prompt engineering,2025 年叫 context engineering,2026 年叫 harness engineering[^6]。每一代都不是替代,是**超集**。这个框架让 harness engineering 变成 prompt engineering 的自然延伸,但回避了一个更硬的问题:**这个学科到底稳不稳?** 如果下一代模型把现在 harness 里一半组件都做没了,它算学科吗?

**第三个回答是"本来就应该知道的事"。** Medium 那篇《oldest new idea》把 harness 放进人类技术史的长序列里 —— 火、炉子、蒸汽机,每次围绕一个"昂贵核心" 搭脚手架的历史。LLM 只是新核心,脚手架本质重复我们四十年做编译器、操作系统、中间件、分布式时的所有套路。这个回答对到几乎不再是回答 —— 如果一切都是旧的,为什么今天还要再写一本书?

**三个回答都不完整**,因为它们都在描述"harness engineering 是什么"。本书关心的是一个更难的问题:**harness engineering 到底要**驾驭**什么?**

##### 驾驭,而不是构建

"Harness"这个词在英文里的第一义不是"框架",是"驾驭" —— 给马套上辔头和缰绳,让它的力量变成可以驱动的方向。MindStudio 的那篇介绍文章特意把词源说得明白:马需要辔头和缰绳,才能把自己的力量用在正确的地方[^8]。

这是一个**人机关系** 的比喻,不是一个**工具清单**。没有驾驭者,辔头和缰绳是死物。你可以有世界上最精致的马具,把一匹已经放归草原的野马追到累死,什么成果都不会有。反过来,一个老练的驭手哪怕只有一根缰绳,也能让马拉车走上千里。

这个词被挑中来命名 2026 年 LLM 工程的核心学科,不是偶然。它暗示的一件事,这个时代的工程师反复忽略 —— **模型能力不等于系统能力**。让模型"更强" 是一件事,让一个包含模型的系统"更可靠、更可续、更可问责" 是完全不同的另一件事。而后者,才是这本书的主题。

##### 这本书的中心论点,三句话

**第一**,**驾驭工程是面向意图的工程学**,不是围绕 LLM 搭工具。代码是 AI 的输出,**意图**才是工程师的上游对象。AI 越强,意图误差越被放大到整个 codebase;spec-driven development、Design by Contract、可验证的意图表达,不是选择,是生存条件。

**第二**,**驾驭工程押的是稳定抽象,不是当下实现**。Anthropic Managed Agents 的那句 "The session is not Claude's context window"[^5] 是这个赌注最清晰的表达 —— 把 session、harness、sandbox 三件事解耦,承诺的是接口,不是内部。模型会变,harness 里很多零件都会被模型自己吃掉,但**接口不会** —— 就像 40 年里 Unix 的 read/write/open/close 没怎么变,尽管底层硬件、文件系统、网络协议翻天覆地。

**第三**,**驾驭工程是反脆弱的**。它的价值不绑在"AI 还不够好" 上,恰恰相反 —— AI 越强,被部署到越深的地方,**独立验证层、意图锚定、问责证据链、目标函数定义权** 这四件事就越刚需。这不是技术问题,是结构性问题。

三件事合起来,是一个位置:**驾驭工程不是帮模型写得更好,是帮人在模型面前做出可问责的判断**。

##### 什么算"真正在做"驾驭工程

Ariely 那句俏皮话,今天换皮就是每一场关于 agent 的会议里的氛围。每个人都在谈 harness,大多数人不知道自己在做什么,大家都以为别人在做,于是都说自己在做。

要让这句话不再适用你,你需要具体能回答以下这些问题。**两层各有几个**:

**Layer 1 读者**(用 AI 写代码的工程团队):
- 你们的 AGENTS.md 是目录(短)还是百科(长到塞爆 context)?
- 你们用 CI-enforced 约束把 AI 代码的质量门从 PR 级挪到了机器级了吗?
- "0% human review" 在你们团队成立吗?不成立的场景里(医疗/金融/隐私)替代机制是什么?

**Layer 2 读者**(做 agent 产品的团队):
- 我的 session 长什么样?它是 Claude 的 context window 的镜像,还是可查询、可回放、可恢复、可重组的事件流?[^5]
- 我的 harness 是假设了什么模型缺陷?这些假设里有哪几条随着模型变强会变成技术债?[^4]
- 我的工具词汇表谁定义、谁审计、谁能撤销?一个 `run_any_bash(cmd)` 是不是已经把"harness" 的边界让渡给了模型?[^8]
- 我的验证是**谁** 在验?是被验对象自己,还是一个位置上独立的东西?当监管者问"你怎么知道这是对的" 时,我能拿出什么证据?

凡是能具体回答这些问题的团队,都在**真正做**驾驭工程。凡是被问到这些问题开始讲"我们用了什么框架" —— 抱歉,不是。

##### 本书的走法

接下来的十四章,分五个部分:

- **Part 0 · 定位与共享坐标(Ch 1–4)** —— 先把两层钉开(Ch 1),建立三把尺的坐标系(Ch 2)、面向意图的第一性原理(Ch 3)、Oldest New Idea 的历史定位(Ch 4)。
- **Part A · AI Coding 过程的驾驭工程(Ch 5)** —— Layer 1 专章。OpenAI 1M LOC / Fowler / MindStudio 的工程谱系合成一章。
- **Part B · AI Agent 自身的 Harness 工程(Ch 6–9)** —— Layer 2 四柱:session / harness / tools / verification。本书字数密度最高的一部分。
- **Part C · 跨时间的驾驭(Ch 10–12)** —— 两类循环(短程 vs 长程)、知识沉淀与 skills 晋升、reflexive harness 的三档边界。
- **Part D · 落地与未来(Ch 13–14)** —— 失败模式博物馆 + 反脆弱四支柱、Many Brains Many Hands 的终局愿景。

Ariely 的俏皮话在本书**完整出现三次**:楔子(现在)、第 10 章(mid-book callback)、结语。其他地方以意象回响,不重复引用。

全书结尾处,我们会回到 Ariely。到那时,我希望你能具体说出 **你的** harness 是什么(Layer 1 的 AGENTS.md?还是 Layer 2 的 session 协议?还是两层都有?),并且知道,十年之后再回头看这句俏皮话,**它讲的不是你**。

---

[^1]: Dan Ariely, Twitter, Jan 2013. 此后被无数次引用,本书以它作为贯穿楔子、第 10 章、结语的隐线索。
[^2]: Birgitta Böckeler, *Harness engineering for coding agent users*, martinfowler.com, 2026-04-02. 见 [[fowler-on-harness]]。
[^3]: OpenAI, *Harness Engineering: Leveraging Codex in an Agent-First World*, Feb 2026. 见 [[openai-harness-engineering]]。
[^4]: Prithvi Rajasekaran (Anthropic Labs), *Harness Design for Long-Running Application Development*, 2026-03-24. 见 [[anthropic-harness-design]]。
[^5]: Lance Martin, Gabe Cemaj, Michael Cohen (Anthropic), *Scaling Managed Agents: Decoupling the brain from the hands*, Apr 2026. 见 [[anthropic-managed-agents]]。
[^6]: Fisher Zhang, *Harness Engineering: The Oldest New Idea in AI*, Medium, Apr 2026. 见 [[medium-oldest-new-idea]]。
[^7]: Nyah Macklin (Neo4j), *Context Engineering for AI Agents*, 2026-03-09. 见 [[neo4j-context-vs-prompt]]。
[^8]: NxCode, *What Is Harness Engineering? Complete Guide for AI Agent Development*, March 2026. 见 [[mindstudio-harness]]。
[^9]: Milvus, *Harness Engineering: The Execution Layer AI Agents Actually Need*, 2026. 见 [[milvus-execution-layer]]。
[^10]: AIOS Foundation / Mei et al., *AIOS: LLM Agent Operating System*, COLM 2025;以及 Stanford IRIS Lab, *Meta-Harness: End-to-End Optimization of Model Harnesses*, arxiv:2603.28052, 2026. 见 [[aios-foundation]] 和 [[stanford-meta-harness]]。
