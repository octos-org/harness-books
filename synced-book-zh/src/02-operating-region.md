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

## 1.1 自主系统中的控制栈演化

Octos 的工程实践演化出一组外层控制，用来让长任务尽量留在这个质量区间内：

```text
Prompt engineering
  -> 改善局部单轮行为
Context engineering
  -> 稳定多轮行为（AGENTS.md、skills、memory、policy context）
Harness engineering
  -> 用持久运行时契约稳定长周期自治行为
```

单靠 prompt engineering 无法提供持久的状态事实。  
Context engineering 能改善这一点，但仍依赖概率性的遵守。  
Harness engineering 增加运行时级别的护栏和证据，使系统可以从模型漂移中恢复，而不是假装漂移不存在。

## 1.2 Context engineering 是 harness 前置纪律

在 harness 成熟之前，上下文工程承担大部分控制重量：

- `AGENTS.md` 和角色指令约束规划风格
- skills 编码可复用的领域流程
- memory 记录用户/项目事实，减少重复漂移
- 有边界的工具策略减少不安全探索

这一层是必要的，但对长任务、并发和后台工作并不充分。

## 1.3 Harness engineering 是外层确定性循环

Harness 在概率模型输出外增加确定性控制循环：

- 可恢复、可追踪的工作区状态
- 工具调用生命周期 hook 和事件 sink，用于可观测性
- 终态成功前的输出验证/确认
- 持久任务生命周期和回放语义
- 面向修复和操作员行动的显式失败类别

Harness 不替代模型智能。它约束模型智能。

## 1.4 让系统保持在区间内的关键机制

1. 可恢复、可追踪的工作区契约
2. 工具调用事件 hook（`before_*`、`after_*`、spawn hooks）用于可见性
3. 产物和验证器契约，用来确认输出事实
4. 从失败中更新 memory/skills 的自修复循环
5. 可回放状态 API，保证 UI/操作员表面保持一致

这就是“偶尔输出好结果”变成“压力下稳定输出”的方式。

## 1.5 工作流约束与自由探索的取舍

受工作流约束的执行能提供更强保证：

- 更好的阶段单调性
- 更好的产物可预测性
- 更容易回放和操作员诊断

自由探索在新颖问题解决上有更高上限，但方差更高。

实践策略是混合式：

- 对长时间/高成本/高风险片段使用工作流轨道
- 在明确预算和检查内允许有边界的自由探索

## 1.6 多 agent 编排与自治等级

当系统从 L2 走向 L3/L4 自治时，长周期稳定性比单轮聪明更重要。

- L2 式辅助行为可以容忍更多人工恢复。
- L3/L4 式委托执行需要自监控、修复和有边界的自治。

多 agent 编排通过行为分解提供帮助：

- planner/coordinator agent 管理阶段意图
- specialist agent 执行狭窄工具领域
- verifier/operator agent 执行契约和升级

Harness 是让这种分解长期可靠的底座。

因此本书后续会在理论和 Octos 事故之间来回切换。事故展示控制平面在哪里断裂；理论解释为什么如果不把 session、tool、verification 和 replay 当作一个系统，同样的断裂会反复出现。

---

### 扩展源材料


#### 来自 `01-two-layers.md`：第 1 章 · 两种驾驭工程

_源材料角色：Layer 1 / Layer 2 边界。_


#### 第 1 章 · 两种驾驭工程

> 你在读的这本书,**同时在讲两件事**。
> 如果你把它们当成一件,后面十三章每一页都会让你有地方对不上。
> 但它们本来就不是一件。

##### 一个读者在第三章会遇到的困惑

翻到这本书第三章的时候,你大概会卡在一个地方。那章里,OpenAI 的工程师讲他们**1M LOC / 1500 PR / 0 human code** 的故事,说他们做的工作是 "designing environments, specifying intent" —— 然后下一节立刻转到 Anthropic Managed Agents 的三抽象 `session / harness / sandbox`。这一跳是怎么跳的?

这两件事确实都叫 "harness engineering"。它们都在 2026 年的同一季度被命名。它们用的词互相引用。但如果你是那位 OpenAI 工程师,你每天想的问题和做 Managed Agents 的 Lance Martin 团队每天想的问题 —— **根本不是同一件事**。

- OpenAI 工程师想的是:**怎么让 Codex 写的代码能合规上线,让我们三个人干三十个人的活**。
- Managed Agents 团队想的是:**怎么让我们的 agent 产品在客户的 VPC 里跑,崩了能 resume,出事能审计,合规能签字**。

两件事都是工程。都很难。但它们在**对象、客户、产出、合规要求、技术栈、甚至时间尺度**上都不一样。把它们放在同一本书里讲可以,把它们当成同一件事讲就错了。

本书的一件基础动作,是先把这两层**钉开**。

##### Layer 1:AI Coding 过程的驾驭工程

把视线放在第一层。你的团队是一家公司里的软件团队。你们要交付一个产品或服务。**AI(Codex / Claude Code / Cursor)是你们的生产工具**,像 IDE、像 CI、像 code review bot 的升级版。它写代码,你们审查、集成、上线。

这一层的"驾驭工程"问一个**单一的问题**:**在 AI 大量生成代码的时代,怎么确保交付的工程质量**?

具体落到地面,这变成若干子问题:

- AI 写的代码怎么通过 review?是每行都人看一遍,还是用 test infra + CI 自动拦截?
- 组织的隐性知识怎么让 AI 读得到?是塞进 system prompt,还是分层(AGENTS.md 是目录,docs/ 是系统记录)?
- 意图怎么从口头变成 spec,从 spec 变成 property test,从 property test 变成 audit trail?
- "0% human review"这件事在哪些场景成立,在哪些场景不成立?

这些问题加起来,就是 Martin Fowler 在 *Harness engineering for coding agent users* 里说的那个学科,也是 OpenAI 那组数字的真实内容。**它是软件工程这门老学科,面向 AI 时代的又一次进化** —— 像十年前从瀑布到敏捷、从单体到微服务、从人肉部署到 CI/CD。基础问题没变("怎么交付可靠的软件"),工具变了,工作层也随之移动。

这一层里,**"agent" 是人的工具**。它可能很聪明、可能有记忆,但它不是产品本身。产品是它帮你产出的那 1M LOC。

##### Layer 2:AI Agent 自身的 Harness 工程

把视线放在第二层。你的团队要做一个 **agent 产品** —— 可能是一个编程助手、一个研究助手、一个客服 agent、一个合规审计 agent。你要卖的不是代码,是**agent 的行为本身**。用户打开你的产品,它帮他们完成任务。

这一层的"驾驭工程"问**另一个完全不同的问题**:**怎么把一个 LLM 套进一个可恢复、可审计、可替换、可合规的运行时基础里,让它能跑几小时、跑几天、能被放进医疗/金融/基础设施的真实场景**?

具体落到地面,这变成:

- Session 是不是场外的、append-only 的事实流?还是 context window 的镜像?
- Harness 是不是无状态的、可 `wake()` 重启的?还是一挂掉就全丢?
- Tool vocabulary 是正交的吗?credentials 物理上进不进 sandbox?
- Verification 层的 actor 和 generator 是不同的吗?agent 自己打自己分算不算?

这一层里,**"agent" 不是工具,是产品本身**。你的合规压力是 EU AI Act、FDA SaMD、SEC AI disclosure 那一档的;你的运维压力不是"让团队更高效",是"让 agent 七乘二十四小时不出事"。

Anthropic Managed Agents、AIOS Foundation、Neo4j 的 context engineering、Milvus 的 execution layer、Karpathy 的 LLM wiki —— 这五份文献讲的是**同一层的事情**,这一层。

##### 两层的关系:正交,不是嵌套

这件事重要到要在本章第一次展开的地方讲透:**Layer 1 和 Layer 2 不是父子关系,它们正交**。

一家公司可以**只在 Layer 1**:他们用 Codex 写自己的 SaaS 产品,但他们的产品里没有任何 agent —— 卖的是传统 web 应用。AI 在幕后,用户看不到。对他们而言,Layer 2 不存在。

一家公司可以**只在 Layer 2**:他们做一个 agent 产品,但他们自己的开发过程很传统 —— 工程师手写代码,AI 只帮他们查 API。对他们而言,Layer 1 不是核心工作。

一家公司也可以**两层都在**:他们既用 AI 写自己的代码(Layer 1),做出来的产品又是一个 agent(Layer 2)。这种公司最容易把两层混起来,因为同一个词("harness engineering")同时在两层使用。

更深的一件事是:**两层的工程纪律高度相似,但解决的问题不同**。两层都讲 session、都讲 tool、都讲 verification、都讲 spec → test → audit trail。但 Layer 1 的 session 是"你的工程团队和 Codex 之间的对话历史",Layer 2 的 session 是"你的 agent 和终端用户之间的事实流"。两层的 tool 都是"动作词汇表",但 Layer 1 的词汇表是 `git diff / run tests / open PR`,Layer 2 的词汇表是 `read_file / search_web / call_payment_api`。

**同样的 engineering primitives,在两层上以不同的粒度和治理节奏出现**。你得先知道自己站在哪一层,才能判断哪段文献直接适用、哪段需要翻译。

##### 三个问题帮你定位自己在哪一层

接下来的十三章,有的关于 Layer 1,有的关于 Layer 2,有的两层都适用。**读之前先给自己三个问题自测**:

**问题一:你卖给用户的东西里,agent 是可见的还是不可见的?**

可见 —— 用户知道他们在跟一个 agent 交互、依赖这个 agent 的判断 —— 你在 Layer 2。
不可见 —— 用户看到的是一个传统产品(web、移动 app、API),agent 只在你们的开发过程中 —— 你在 Layer 1。
两者都有 —— 你两层都在,但**本书建议先分清楚再读**,不要把两层的问题混到同一次讨论里。

**问题二:你的合规压力来自哪里?**

"确保交付的软件不泄露数据、不被攻破、符合业界标准" —— Layer 1,传统软件工程合规。
"确保 agent 的行为符合 FDA / SEC / EU AI Act / GDPR 对 AI 系统的要求" —— Layer 2,AI 专属合规。
两种都有 —— 你两层都在。

**问题三:模型升级一代,你团队的工作量怎么变?**

Layer 1 的典型答案:**工作量变少**。新一代 Codex 写的代码更符合你的 spec,你们人审的负担下降,但 CI / spec / AGENTS.md 这些 harness 投资**累积价值不变**。
Layer 2 的典型答案:**工作量变多**。新一代模型让 agent 能做更多关键任务,所以你们需要处理更复杂的 verification、更精细的 tool 权限、更严格的 session 协议。**反脆弱的含义在两层上稍不相同**。

##### 本书两层的分工:你现在翻到哪一章在讲哪一层

这本书总共十四章,按下面的分工组织:

- **Part 0(Ch 1–4)** —— **两层共享** 的坐标系、第一性原理、历史定位。不管你站在哪一层,这四章都读。
- **Part A(Ch 5)** —— **专讲 Layer 1**。OpenAI / Fowler / MindStudio / AGENTS.md 这几条线合在一章,压缩成一章的原因是:这一层的几位奠基者观点互相印证得很紧,不需要四章展开。
- **Part B(Ch 6–9)** —— **专讲 Layer 2**。四根支柱 session / harness / tools / verification 逐章展开。这是本书字数密度最高的一部分,因为 Layer 2 的工程纪律没有现成的教科书。
- **Part C(Ch 10–12)** —— **两层共享** 的跨时间维度:两类循环、知识治理、reflexive harness。两层都要用,但实现细节略不同。
- **Part D(Ch 13–14)** —— **两层共享** 的落地、反脆弱、终局愿景。反脆弱四支柱在两层上都成立,但触发机制不同。

一条捷径:**如果你完全在 Layer 1**(你的产品不是 agent),你读完 Part 0 + Ch 5 + Part C(只读循环、知识层)+ Ch 13–14 就够了,Part B 可以跳。**如果你完全在 Layer 2**(你的产品是 agent),Ch 5 是背景知识,Part B 是你的主场。**如果你两层都在**,线性读,中间在 Part 切换处停一下想清楚。

附录 D 有按角色的阅读路径,可以作为补充。

##### 为什么这本书把两层放进同一本

最后一个该问的问题:**既然两层正交,为什么不拆成两本书?**

三个理由,由轻到重:

- **共享的坐标系** —— Prompt / Context / Harness 三把尺、面向意图第一性原理、Oldest New Idea 历史定位,这些东西不区分层。读者在哪一层都先需要它们。
- **共享的反脆弱论证** —— 模型越强、驾驭工程越值钱,这件事在两层上都成立,而且理由结构几乎一样。只讲一层,反脆弱论证显得孤证;两层合讲,论证力度放大。
- **真实工程师经常两层都在** —— 一个做 agent 产品的公司,自己的开发过程也在用 Codex / Claude Code。一本书合讲可以帮他们在**同一个概念框架里**处理两层的问题,不用在两套术语之间翻译。

但本书**拒绝把这当成单一学科**。两层有共享的工程原则,但**它们不是同一件工作**。这是第一章要钉下的第一根桩子。

---

##### 可观察信号

- 你的团队白板上,"harness" 这个词一天之内被用来指两种不同的东西吗?(如果是,你们已经在两层之间滑)
- 招聘 JD 里,"AI coding harness" 和 "agent runtime" 两个岗位职责是分开写的,还是混成"AI 工程师" 一个岗位?
- 合规 review 时,是按 "软件产品" 套流程,还是按 "AI 系统" 套流程?

---

##### 本章核心论断

1. **"驾驭工程" 实际上横跨两层**:Layer 1 AI Coding 过程 · Layer 2 AI Agent 自身。
2. 两层**正交**,不是嵌套。一家公司可能只在 Layer 1、只在 Layer 2、或两层都在。
3. 两层共享 engineering primitives(session / tool / verification / spec),但**粒度、客户、合规、产出**都不同。
4. **读任何 harness 相关文献前先判断它讲的是哪一层**;最常见的阅读错误,是把一层的洞察直接移植到另一层。
5. 本书 14 章按层分工:Part 0(共享坐标)/ Part A(Layer 1 专属)/ Part B(Layer 2 四柱)/ Part C + D(共享跨时间 + 落地 + 终局)。

---

##### 本章奠基文对齐

- [[fowler-on-harness]] —— Layer 1 的学科命名者
- [[openai-harness-engineering]] —— Layer 1 最清晰的工程实证(1M LOC)
- [[anthropic-managed-agents]] —— Layer 2 的 meta-harness 立场
- [[anthropic-harness-design]] —— Layer 2 的 long-running 实证
- [[mindstudio-harness]] —— Layer 1 的入门级分类(五柱)
- [[aios-foundation]] —— Layer 2 的学术侧独立证据

##### 本章对应 wiki 页

- [[concept-harness]] · [[concept-prompt-vs-context-vs-harness]]

---

**第 2 章**进入两层共享的第一块基石:**三把嵌套的尺**,重新安置你对"我在哪个尺度上工作" 的判断。


#### 来自 `02-from-prompt-to-harness.md`：第 1 章 · 从 Prompt 到 Harness —— 一次视角的位移

_源材料角色：prompt -> context -> harness 的演进。_


#### 第 1 章 · 从 Prompt 到 Harness —— 一次视角的位移

> 如果你觉得你的 agent "最近有点蠢",**先别改 prompt**。
> 很可能你在错的尺度上解一个更大的问题。

##### 一个半夜两点的故事

凌晨两点,一位工程师盯着屏幕上第四十轮的对话。agent 在两小时前已经想出了正确的解;他记得清清楚楚 —— 第十七轮,那个建议闪过一下,然后被下一个问题盖过去了。

他试着让 agent 回忆。

> "你刚才提过一个方案,用 OAuth2 device code flow 的。"
> "是的,您说得对。" agent 客气地接话,"我们可以采用 OAuth2 device code flow。" 然后它开始**从零**描述 OAuth2 是什么。

这位工程师那一刻没有修改 prompt 的想法。他关掉电脑,打开一个文本编辑器,写了一行字:**"问题不在这里。"**

这本书,就是从那一行字开始的。

##### 三个名字,三把尺

你过去三年大概听过这三个词:

- 2023 年:**prompt engineering**
- 2025 年:**context engineering**
- 2026 年:**harness engineering**

最容易的误读,是把它们当成时髦词的更替 —— 去年流行 A,今年流行 B,明年流行 C,就像时装季。**这个读法会让你一辈子错过真正在发生的事**。

另一个误读是把它们当成三个竞争流派,逼自己站队 —— "我们团队是 context 派的"、"他们搞 harness 搞过了头"。这个读法会让你写一堆意识形态式的内部文档,但解决不了任何工程问题。

真正的读法是:**它们不是三个流派,是三把尺**。每一把测量的对象都比上一把大一圈。

- **Prompt 尺** 测**一次调用**的形状。你写给模型那 800 个字,它怎么组织、怎么措辞、怎么少样本。**Prompt engineering = 精修一次调用**。
- **Context 尺** 测**这一次调用能看到什么**。retrieval 给的片段、memory injection、tool descriptions、knowledge graph 切片。**Context engineering = 管理一次调用的视野**。
- **Harness 尺** 测**这个 agent 活着的全部行为**。跨多次调用、跨 session、跨 agent、跨时间。工具、状态、持久性、恢复、观测、评估、权限、人类 checkpoint。**Harness engineering = 管理一整条 agent 生命**。

三把尺嵌套。短尺量不了的东西,长尺能量;但长尺里**仍然有短尺**。一个 harness 工程师不会停止写 prompt —— 他每天都在写,只是 prompt 只是他工作的**一片叶子**,不是整棵树。

##### 为什么那位工程师没改 prompt

回到凌晨两点。Agent 忘了第十七轮的方案 —— 这是 prompt 问题吗?

想象你改 prompt。你加一行:"请记住我们讨论过 OAuth2。" 下次 agent 确实"记得"了 —— 但它记得的是你**刚刚告诉它** 的那句话,不是第十七轮发生过的事实。你做的不是让 agent 拥有记忆,是**每次都重新告诉它它应该有记忆**。这件事扩展到一百个话题、一千次对话,你就是在全职给一个失忆症患者写备忘录。

这是 **prompt 尺** 能做的一切 —— 它只看一次调用。第十七轮的事实对一次调用而言,要么在 context 里(能看到),要么不在(看不见)。**它不会因为你措辞再好而自动进入**。

再想象你改 context。你搞一个 RAG 管线,把对话历史向量化,下一轮 agent 提问时把相关片段检索回来塞进 context。现在它"看起来"能回忆了。但你有没有注意到一件事?**retrieval 本身** 不是一次调用里的操作。什么时候检索、检索什么、怎么重排、检索不到怎么办 —— 这些决定都发生在**两次调用之间**,在 harness 层。**你已经越过 context 尺了,只是自己还没意识到**。

**这就是尺度错位的典型症状:你以为自己在第一把尺上工作,实际上你要解的问题只有在第三把尺上才有形式化的落点**。你在第一把尺上做再多,都只是在掩盖问题的真正位置。

##### 三把尺,一个嵌套的同心圆

![Prompt ⊂ Context ⊂ Harness 的三层嵌套同心圆](taxonomy-concentric.svg)

这张图不是比喻。它是**严格的集合包含关系**。Prompt 是一个点,context 是围着这个点的一个盘,harness 是围着这个盘的一个更大的盘。任何 context 问题都可以改写为"某次 prompt 调用看到的信息",任何 harness 问题都可以展开为"多次 prompt+context 调用之间的协调"—— 反之不成立。

这个不对称是这本书从头到尾的工程根据。它意味着:

- 一个号称"超越了 prompt engineering"的团队,**没有真的超越**。他们只是把 prompt 这一层外包给了别人写的框架。谁写的呢?LangChain、LangGraph、他们用的某个 agent SDK。他们仍然在用 prompt,只是不亲自写而已。
- 一个"我们只做 prompt,不搞那些花哨的"的团队,**做不了 agent**。Prompt 尺能做的最大的东西就是一次漂亮的完成,到此为止。
- 一个"我们已经做了 agent"的团队,只要工程上能长期跑下来,**事实上都在做 harness engineering**,不管他们叫它什么名字。Ariely 2013 年那句话,在这里以第一次的形式投下了阴影 —— 你以为大家都在做的事,真正做到的人比谁都少。

这三件事在同一张图里,是同一个结论的三个切面。

##### 三个症状 —— 你在哪一把尺上

讲到这里,抽象层面已经说清楚。但读者最想问的往往是一件很务实的事:**我怎么知道我现在是在哪一把尺上?**

用三个场景自测。这不是测验,是**临床症状**。

**症状一**:你的 agent 第三十轮对话还记得第三轮说过的话吗?

如果不记得,这不是 prompt 问题 —— **再精修的 prompt 也装不下三十轮的事实**。它不是 context 问题 —— **再聪明的 retrieval 也要有东西可查**。它是**session 层** 的问题。你需要一个场外的、append-only 的事实流,在 agent 进程之外持续存在,**随时可以被新一次 prompt 调用按需加载**。这个场外存在,就是 harness 尺的第一层承诺。

Anthropic 在 2026 年 4 月给这个症状起了个名字:**context anxiety**。Agent 在感觉到 context window 快满的时候,会开始表现得像一个**被催赶着收尾的学生** —— 草草下结论、跳步骤、放弃本来能做的子目标。他们试过"更聪明的 summarization",失败;真正有效的修法是**硬重置 + 结构化移交**:把 agent 进程杀掉,起一个新的,通过 session 里的事实流告诉它"前面做过什么"。关键动作全部发生在 prompt 之外,在 harness 层。

**症状二**:你的 agent 执行完一次 tool call,**你** 知道它改变了什么吗?

注意问句的主语是"你",不是"agent"。agent 当然会说自己做了什么,但 agent 的自述不是证据 —— 如果它撒谎、记错、或只是措辞不精确,你怎么知道?你需要的是**独立于 agent 自述的观察**:每次 tool call 的 input 哈希、output 哈希、副作用清单、actor 归属、时间戳 —— 全部写进一条事件。这是**observability 层** 的问题,仍然不在 prompt 尺上。

上个月你们做事故复盘的时候,有没有一条事故的根因归到"agent 声称做过的事其实没做"?如果有,那次事故的修法,写进 prompt 里都解决不了。

**症状三**:今天你手上调通的一段 prompt + context,下周你的同事能**一键还原** 吗?

不是"能复述你的操作",是"一个命令让 agent 的起点和你此刻的起点完全一致"。这要求你们的 session、spec、tool 权限、模型版本、知识库状态都可以被**序列化、持久化、重放**。这是**state durability 层** 的问题 —— 和 prompt 尺之间隔着两层。

一个团队如果三个症状都答"做不到",它面对的不是"agent 不稳定"的问题,是**它一直在错的尺度上工作**。

##### "模型变强了,不就不需要这些了?"

本章最难驳的一个诱惑是这个问题:既然模型每半年变强一轮,那我现在投入的 harness 是不是会在下一次模型升级时就变成负担?

答案需要分两半。

**一半是"会"**。Ch 3 会给出具体证据:从 Sonnet 4.5 升级到 Opus 4.6,Anthropic 的 harness 里大约 **40% 的代码被拆掉** —— 因为新模型不需要那些补丁。**赌模型不够好** 的那一半 harness 确实会变成负担。这是我们在这本书反复会强调的区分:**补模型缺陷**的代码是技术债,模型变强就要清算。

**另一半是"不会"**,而且这一半更重要。Session 协议、tool 权限边界、verification 独立性、spec 顶层 —— 这些是**协议层** 的投资,**不随模型能力波动**。Anthropic 讲 meta-harness 的时候反复强调:**只承诺接口长期稳定,不承诺任何具体实现**。接口是 Unix syscall 式的稳定,实现是可以每个模型换代都重写的。你押对了接口,你的工程每次模型升级都**更值钱**;你押错了层(押了具体实现、押了 prompt 技巧、押了某家框架),你的工程每次模型升级都要重来。

**"模型变强了我就不需要驾驭工程" 是一个范畴错误**。它把两层的事情搅在了一起。模型变强会让"补模型缺陷"的 harness 变薄,但会让"稳定接口上的 harness" 更有价值 —— 因为现在同一个稳定接口上,能跑更多、更复杂、更关键的 agent。

##### 为什么这件事是"视角位移",不是"学新词"

从 prompt 尺走到 harness 尺,不是学一套"更高明的 prompt 技巧"。这是这本书第一个锋利的断言。

Fisher Zhang 在 *Harness Engineering: The Oldest New Idea in AI* 里给了一个比喻,这本书从这里开始反复借用:

- **Elden Ring** ≈ prompt 尺。每一次攻击、每一次闪避,玩家亲自按键。一对一,极致精雕。
- **Clash of Clans** ≈ context 尺。战前布阵决定一切;开打之后基本观战。
- **StarCraft II** ≈ harness 尺。指挥几百个自治单位,靠规则、优先级、阵形。**粒度变粗,责任变大**。

从 Elden Ring 到 StarCraft II,玩家不是变被动,是**在做一件根本不同的事**。Prompt 工程师对每次 inference 精雕细琢,满足感来自"这次对话漂亮";harness 工程师设计的是"让成千上万次 inference 在我不盯着的时候**仍然能行**" 的那套规则,满足感来自"这个系统半年没我也能跑"。

翻译到日常工作:

- Prompt 尺的一天,你数 diff 行数、数 prompt 效果提升几个点。
- Context 尺的一天,你数 retrieval 召回率、context 长度怎么压缩。
- Harness 尺的一天,你写的是 session schema、verification 协议、tool 权限矩阵、skill 晋升规则。**这些东西单看每一件都不像"AI 能力",但正是它们让你的 agent 系统在明天、下周、下个季度都以可预期的方式运行**。

从外面看,harness 工程师每天并不在"用 AI" 做什么。从里面看,他做的每件事都在决定 AI 能以什么方式被用。这种落差本身,就是本章要命名的那次"视角位移"。

##### 这本书从这里开始

所以当你合上本章,希望带走的不是一条记忆 —— "prompt / context / harness 是三层"—— 而是一次**判断的升级**。

下次你看到一篇 AI 工程文章、听到一场 agent 团队汇报、开始一个新的内部技术讨论,第一件事不是记住谁用了什么框架,是问自己三个问题:

- 这件事,**能装进一次调用的边界** 里吗?能 → prompt 尺度。
- 不能,但**组织好一次调用的信息视野后** 能吗?能 → context 尺度。
- 都不行 —— 跨调用、跨时间、跨 agent、要求持久化 —— 这是 harness 尺度。

能不能答得准,是有差别的。**答不准,你在做的工程永远用错了力**。

第 2 章,会在这个坐标系里放下第一块基石:**面向意图**。那位凌晨两点的工程师后来关掉电脑之后,做的第一件事不是加班写代码 —— 是重新写了那个 feature 的 spec。第 2 章的主题就是这件事。

---

##### 可观察信号(自测三问)

- 杀掉你的 agent 进程,**重启后它能从最后一个事件继续**吗?
- 一次 tool call 三天后出问题,你**还能追回是哪条输入导致的**吗?
- 上周你手上调通的那段 prompt,**今天在另一个同事手里能一键还原**吗?

任何一问回答"做不到",你撞上的不是 prompt 问题,是 harness 尺度的问题。

---

##### 本章核心论断

1. Prompt / Context / Harness 是**三把嵌套的尺**,不是三个流派。**harness ⊃ context ⊃ prompt**,严格包含。
2. "超越了 prompt 工程"的团队,大多只是把 prompt 外包了。"只做 prompt 的团队"做不了 agent。**真做长期 agent 的人,不管叫什么名字,事实上都在做 harness engineering**。
3. 位移到 harness 的三个不可回避理由:**多调用状态 / 调用外动作 / 跨会话沉淀** —— 每一个都在 prompt 和 context 尺上没有形式化落点。
4. "模型变强了就不需要 harness"是范畴错误。**补模型缺陷的 harness 会变薄,稳定接口的 harness 会更值钱**。
5. 位移的本质不是"学新词",是**视角的升级** —— 从精雕一次调用,到设计规则让千万次调用自治。

---

##### 本章奠基文对齐

- [[fowler-on-harness]] —— *Agent = Model + Harness* 等式的公开出处
- [[medium-oldest-new-idea]] —— 三段论 + 游戏尺度比喻的原论述
- [[neo4j-context-vs-prompt]] —— context 层立场的代表文本
- [[mindstudio-harness]] —— superset 论证的独立印证
- [[anthropic-harness-design]] —— "context anxiety" 命名、session ≠ context window 原句

##### 本章对应 wiki 页

- [[concept-harness]] · [[concept-prompt-vs-context-vs-harness]] · [[ariely-big-data-quote]]

---

**第 1 章做完了一件事 —— 重新安置你的坐标系。** 坐标系有了,下一步是方法论第一性原理 —— **为什么代码是 AI 的输出,意图才是工程师的上游对象**。那位凌晨两点的工程师下一步做了什么?他重新写了那个 feature 的 spec。第 2 章从那个动作开始。


#### 来自 `04-oldest-new-idea.md`：第 4 章 · The Oldest New Idea —— 稳定抽象的历史

_源材料角色：稳定抽象与控制系统谱系。_


#### 第 4 章 · The Oldest New Idea —— 稳定抽象的历史

> "围绕一个昂贵核心搭稳定抽象层",是每一次技术飞跃都重复出现的结构。
> LLM 只是新的昂贵核心;驾驭工程只是这一结构的最新一环。
> **模型越强,harness 越薄;但接口不会薄**。

##### 1974 年的那份七页纸

1974 年 7 月,Ken Thompson 和 Dennis Ritchie 在 *CACM* 发表了一篇七页纸的文章:*The UNIX Time-Sharing System*。文章里的附录列了一份系统调用清单,在后世被叫做 Unix syscall。那一份单子上包括:`read`、`write`、`open`、`close`、`fork`、`exec`、`wait`、`pipe`。

如果今天你在一个 2025 年出的 Linux 盒子上 `man 2 read`,读到的语义和那份七页纸里写的语义**几乎一致**。五十年。CPU 从 PDP-11 换到 x86、x86-64、ARM、RISC-V;内核从原始 Unix 到 BSD 到 Linux 到 macOS Darwin;进程模型从单 CPU 单线程到几百核心 NUMA —— `read` 的语义没动。

Ken Thompson 这辈子最值钱的工作,**不是写 Unix 的实现**。是钉下了那份单子上的接口语义。接口下面的东西,后来被换了不知道多少轮;接口本身,活到了他自己退休之后。

这件事放在今天讲有什么用?你翻开 2026 年 4 月 Anthropic 的 *Scaling Managed Agents*,Lance Martin 那个团队做的事情,**结构上跟 Ken Thompson 完全一样**。他们画出三条接口:session / harness / sandbox。他们明确说不承诺任何具体实现,只承诺接口长期稳定。他们在押的赌注,和 Thompson 一样 —— **押接口,不押实现**。

这不是巧合。这是同一种工程模式的第 N 次重现。本章讲的就是这个模式,以及它为什么让"驾驭工程会不会三年后又被换成另一个时髦词" 这个问题**从一开始就是错问**。

##### §4.1 四十年,同一个剧本

抽象层的故事,从来不是"谁发明了 LLM" 这种叙事。它是 "谁在强核心之外搭了一层**接口稳定、实现可换** 的薄壳"。过去四十年,这个模式至少清晰地出现过四次。

**编译器**。CPU 是昂贵核心,指令集每年都在进化。但编译器前端语言不知道换了多少种 —— C、C++、Rust、Go、Swift、Kotlin,每种语言都有自己的编译器前端。而 **LLVM IR** 这种中间表示,基本稳定了二十年。你今天给一门新语言写编译器,不会从头想 "怎么生成 x86 代码";你生成 LLVM IR,后端替你做完剩下的事。LLVM IR 不是最优的中间表示,但它是**稳定**的中间表示。写 LLVM 后端的人,不需要重学 Rust 语法;写 Rust 的人,也不需要关心 CPU 换代。抽象层的价值,不是实现最优,是**接口稳定**。

**操作系统**。硬件是昂贵核心,每年出新架构。但 Unix 的 syscall —— `read / write / open / close / fork / exec` —— 如开篇所说,四十年没变。硬件是变化的,syscall 是稳定的 —— 1974 年那份七页纸里定下的东西,今天还在你的手机里跑。

**中间件 / 数据库**。数据库是昂贵核心,SQL 是稳定抽象。ORM 换了一代又一代:Hibernate → SQLAlchemy → Prisma → Drizzle,每一代作者都以为自己终于把前一代的错误修掉了。但 **SQL 本身**从 1986 年 ISO 标准化至今,核心语义几乎没动。这件事让"换一个数据库后端"成了一项工程性任务,而不是重写项目。你换引擎,不换语言。

**分布式系统**。网络是昂贵核心,RPC 是稳定抽象。从 CORBA 到 gRPC,实现路径变了无数次:Java RMI、SOAP、Thrift、Protocol Buffers + gRPC。但"远程方法调用"这个抽象,稳定得像一条公理。k8s / Istio 的 service mesh 只是把它再往上抽一层,本质仍是"给网络这个昂贵核心套一层稳定接口"。

四次都是同一个剧本。**昂贵核心 + 稳定抽象 = 工程学的稳定飞轮**。接口一旦稳定,整个生态就能在它上面增长数十年。

这里有一句可以直接钉在墙上的话:**接口不稳的层,永远成不了学科,只是配置**。

##### §4.2 从火到蒸汽机 —— 不是文学修辞

Fisher Zhang 2026 年 4 月在 Medium 上那篇 *Harness Engineering: The Oldest New Idea in AI*([[medium-oldest-new-idea]])把这个模式推到比软件史更久的尺度上。

他的类比是**火 → 炉子 → 蒸汽机**。

火,是能量源。人类第一次学会用火,用的是"直接控制":把一根柴放在哪、吹多大风。这是对能量的**单点调度**。

炉子,是环境控制。把火围进一个可控边界,限制它能往哪里跑、多烫、多久烧完。这不是更聪明地烧火,是**给同一个火建一层壳**。

蒸汽机,是系统化的驾驭。把火的能量**翻译成可调度的做功** —— 气压、活塞、曲轴、转速。蒸汽机里 99% 的工程不是关于火,是关于**把火这件强而难控的事变成可编程的** work。没有蒸汽机,工业革命不发生。

Zhang 这段类比不是文学修辞,它是严格的结构性类比。每一步,都是人类面对同一个强而难控的核心,把利用方式**越来越系统化**。

LLM 是本时代的"火"。Prompt engineering 是把它**围在一个炉膛里** —— 一次调用的边界。Context engineering 是把这个炉膛**接上风门、燃料管、排烟管** —— 信息视野的管理。Harness engineering 是**造蒸汽机** —— 把强核心变成可调度的做功引擎,跨调用、跨 session、跨 agent。**辔头是新的,结构是古老的**。

这就是为什么本书的主标题叫"驾驭工程"而不是"AI 工程",副标题叫"面向意图的工程学"而不是"prompt 大全"。这两个命名都在暗示一件事:**你今天看到的不是一场新革命,是一台老机器在新核心上再造一遍**。

##### §4.3 Lance Martin 的团队那个春天在做什么

2026 年 4 月,Anthropic 的 Lance Martin、Gabe Cemaj、Michael Cohen 发布了 *Scaling Managed Agents*([[anthropic-managed-agents]])。这篇文章公开了一件事:他们把 agent 基础设施**拆成了三块**。

之前一整年,他们维护的是一个**巨型容器**。客户调一个 agent,系统给它开一个 container,里面一起跑 session 日志 + harness 调度逻辑 + sandbox 执行环境。三件事绑在一起,结果是:container 崩一下,session 全丢;要 debug,工程师必须 shell 进客户数据容器(合规危险);客户在自己 VPC 里用,就必须自己跑一整套 harness。

那年春天,他们用四个月把三件事拆开。

- **Session** —— 一条 append-only 的事件日志,明确放在 Claude 的 context window 之外。你通过 `getEvents()` 拿事件,可以在进入 context 之前做任何变换。
- **Harness** —— 无状态的大脑,不和 container 绑定。宕了可以 `wake(sessionId)` 复活,通过 `emitEvent(id, event)` 持久化。因为它不持有状态,可以**整体替换** —— 每次模型升级都能换一版,不动底下的 session 协议。
- **Sandbox** —— 执行环境,cattle 不 pets。失败不影响 session,也不影响 harness。像调一个工具:`execute(name, input) → string`。credentials 物理上根本进不去 sandbox。

这三样东西分别对应到 Unix syscall 的哲学:session ≈ 文件系统(持久化事实),harness ≈ process(无状态计算),sandbox ≈ capability 隔离。不是 Anthropic 故意借用 Unix,是**同一类工程问题在同一类解法上收敛**。他们把这件事命名为 **meta-harness** —— 不在 harness 这一层做主张,在 **harness 之上** 做主张:**哪些接口值得四十年稳定**。

实证数字也亮出来:TTFT 在 p50 上降了约 60%、p95 上降了 90% 以上,因为 container 按需开;sandbox 懒加载,session resume 立刻能推理。credentials 从根上进不去 Claude 生成的代码能 touch 到的地方。

回到那句话:Lance Martin 的团队那年春天做的事,和 Ken Thompson 1974 年做的事,**形状一样**。钉接口。把下面的实现让出去。押稳定性赌下一代人会在这个接口上跑几十年的东西。

这不是巧合,是**同一种工程纪律**。

##### §4.4 AIOS —— 学术侧的独立证据

如果 Anthropic 是产业侧的证据,那么 **AIOS Foundation**([[aios-foundation]],arxiv:2403.16971,COLM 2025)就是学术侧的独立证据。它用一句话总结就是:**LLM as OS, Agents as Apps**。

Agent 发起 "syscall";AIOS kernel 负责五类经典 OS 问题:resource management、scheduling、context switching、memory management、access control。注意这件事的独立性 —— AIOS 的作者不是 Anthropic 员工,发表渠道不是工程 blog 而是 COLM 这种 peer-reviewed 学术会议。但**他们得出的结构** —— 围绕 LLM 这个昂贵核心,应该搭一层 OS 样的稳定接口 —— 和 Anthropic Managed Agents 的判断几乎一字不差。

两个独立来源在同一时间独立给出同一个结构性判断,这不是孤证,是**同一范式的两次实例化**。

AIOS 的价值不在于它今天的实现最优(事实上它在 verification 这一维度是空的,这是 [[anthropic-harness-design]] 的三 agent 架构弥补的部分)。它的价值在于它给 "LLM 时代的工程中心 = harness 层" 这个判断提供了**产业 + 学术的双重证据**。当两个完全不同的社群、完全不同的优化目标、完全不同的发表渠道,独立收敛到同一个结构时,这个结构就不是 hype,是真的在发生的事。

##### §4.5 定律:模型越强,harness 越薄,但接口不会薄

接下来是本章最重要的一条推论。它不是预测,它是一条已经发生过一次的事。

2026 年 1 月,Anthropic 把他们的模型从 Sonnet 4.5 升级到 Opus 4.6。Prithvi Rajasekaran 在 *Harness Design for Long-Running Apps* 里记录了他们的 harness 在这次升级中发生的事情 —— **大约 40% 的零件被陆续拆掉**。

不是这些零件设计得不好。是**新模型本来就会做那些事**,不再需要外部补丁。

- Sonnet 4.5 时代的 "sprint planner 代劳" —— 因为模型自己不会规划长任务,所以外接一个 planner agent。Opus 4.6 会自己规划,planner 的 70% 功能变成冗余。
- Sonnet 4.5 时代的 "手工 context 压缩 hack" —— 因为模型在 context 快满时会 "context anxiety",草草收尾。Opus 4.6 对窗口压力有了自己的对策,压缩 hack 变成负担。
- Sonnet 4.5 时代的 5 轮 external reflection loop —— 因为模型自我反思不够深。Opus 4.6 一轮就能达到之前三轮的效果,多出来的两轮是纯延迟。

但在这次升级过程中,**session / harness / sandbox 三抽象没变**。变化的是三抽象**内部**的实现细节;稳定的是它们**之间**的接口契约。你可以把这次升级看作一次**接口稳定性的真实应力测试** —— 模型能力跨了一大步,上层接口没破。

| 变化方向 | 会消失的东西 | 不会消失的东西 |
|---|---|---|
| 模型变强 | 补模型缺陷的零件:规划代劳、context 压缩 hack、重试循环、硬编码 planner | 稳定接口:session 格式、sandbox 边界、verification 独立性、权限协议 |

一条可以随身带的判据:遇到 harness 里的一段代码,问自己一句话 —— **"这段代码如果模型变强一代还需要吗?"**

答"不需要",它补的是模型缺陷,是技术债,迟早要拆。
答"需要",它补的是协议或接口,是稳定投资,值得投入。

这条判据的厉害之处,是它把一个看似主观的"架构评审"问题变成了一个**可预测式**的判断。稳定接口投资的价值只增不减;补模型缺陷的部分在升级时会从"有用"变成"多余",再变成"碍事"。团队越早识别出两类的分野,升级周期里的重构代价就越低。Ch 13 会把这件事命名为**反脆弱第一支柱 Verification ≠ Generation**。

##### §4.6 反面教材:harness 补丁是最可靠的技术债生产工厂

反过来说这条定律:如果一个团队把"临时性的模型缺陷"固化为"永久性的系统结构",它就在**高效地生产技术债**。

几个常见的形态。**固定 DAG 的 agent 框架** —— 假设"模型不会自己规划",所以写死每个 step,模型一变强整张 DAG 一半节点变成 noise,又因为 hard-code 了没人敢动。**硬编码 retry** —— 写死 3 次 retry + 特定 fallback,模型一变强第一次就成功了,剩下的 2 次是纯浪费的代码和 token。**完整的 planner 子系统** —— 单独造一个 planner agent 做任务拆分,模型一变强 70% 冗余、30% 又跟不上新模型的风格,一边冗余一边掣肘。**手写的 context 压缩 hack** —— 新模型有了 context anxiety 的内置对策,这整套 hack 既多余又可能反向放大问题。

这些都是**赌"模型不会变强"的技术债**。与之相反,稳定接口投资的东西 —— session 持久化协议、权限隔离边界、独立 verification 信号 —— 无论模型变强多少,它们的价值只会增,不会减。

读到这里,你可以停下来在自己的仓库里做一次走查。任选三段和"AI" 相关的代码,每段都用那句话过一遍 —— "模型变强一代还需要吗?"。这件事不需要会议室,不需要架构评审,半小时能做完。但做完这半小时,你会知道自己团队里 harness 层的真实技术债水位在哪。

##### §4.7 变薄之后:harness 自身可被自动搜索

"模型越强,harness 越薄"的下一步推论,2026 年 Stanford IRIS Lab 用实验给出了([[stanford-meta-harness]],arxiv:2603.28052)。

既然 harness 越来越少、越来越像**稳定接口后面的普通代码**,那么它就可以被当作**搜索对象**。

Stanford Meta-Harness 系统做的就是这件事。一个 outer-loop agent 读取所有历史候选 harness 的源码、分数、执行痕迹(通过文件系统存放,像 Karpathy 的自研系统一样),基于这些信息提议新 harness 变体。评分、保留、淘汰、再提议 —— 典型的进化式搜索循环,只是被搜索的空间不再是 prompt 措辞,也不再是 model weights,而是 **harness 本身的代码**。

实证收益非常惊人。文本分类任务 **+7.7 分** 的同时 context token 消耗 **减少 75%**;数学推理任务 **+4.7 分**,跨 5 个 held-out 模型;agentic coding 的 TerminalBench-2 上超过手工 harness。数字来自 arxiv:2603.28052 原文。

人手调的 harness 被自动搜的 harness 碾压,说明人类在 harness 设计上确实有偏差 —— 偏向过度规划、过度防御、过度压缩。Stanford 的结果证明:**把 harness 变成代码之后,agent 自己能找到人类 reviewer 发现不了的优化**。

但这件事**不推翻**本章主论点,反而**加强**它。为什么?因为 Stanford 能做到这一步,正是因为 harness 已经**变薄成稳定接口内的代码**。接口 —— Anthropic 的 session / harness / sandbox 三抽象 —— 依然稳定;只是接口**内部**的具体实现,现在可以让 agent 去搜。

这一区分非常重要:

> **稳定接口由人定** · **接口内部的实现可由 agent 演化**

这两件事正交。前者属于 Anthropic 那种 meta-harness(钉接口),后者属于 Stanford 那种 meta-harness(搜实现)。同一个词 "meta" 在两个完全不同的层上。[[concept-harness-as-platform]] 里专门列过这件事,要点就三件:Anthropic 那种 meta 问的是 "哪些接口值得四十年稳定",设计者是人类平台工程师,产出是一份接口契约,它的失败模式是 "接口腐烂 / 过早承诺";Stanford 那种 meta 问的是 "稳定接口内部的实现如何自动搜",设计者是 agent proposer,产出是一段具体的 harness 代码,它的失败模式是 "优化器过拟合到 eval set"。

它们组合干净:**Anthropic 挑槽位,Stanford 填槽位**。不是非此即彼。

当然 Stanford 这种 meta 带来新的失败模式 —— 自动搜出的 harness 可能**过拟合到 benchmark**。Ch 12 会把它单列为失败模式;Ch 13 会把它作为反脆弱第四支柱 "Objective ≠ Optimizer" 的实证来源。本章此处只需确认一件事:**自动搜 harness ≠ 推翻 harness 工程**,而是在稳定接口内做了一层新的自动化。

这件事又一次和开篇的 Ken Thompson 对上了。1974 年那份七页纸定下的 `read / write / open / close`,五十年内部实现被重写了无数版,但接口稳定。今天的 session / harness / sandbox 是同一种东西在新核心上的重演。Stanford Meta-Harness 只是用 AI 的方式重写其中一层,就像 1980 年代优化编译器用算法重写一个 `read` 的实现一样 —— **接口没动**。

##### §4.8 给从业者的一张判断表

把前七节合成一张决策表。遇到一段 harness 代码或一条架构设计,用这张表问三次:

| 问题 | 答"是"的含义 | 答"否"的含义 |
|---|---|---|
| 它补的是**模型缺陷**吗? | 是技术债 · 模型一升级就要重写 | 是接口 / 协议 / 权限层 · 是稳定价值 |
| 它在 **Anthropic 三抽象**(session/harness/sandbox)里吗? | 属 meta-harness 范畴 · 长期稳定投资 | 属具体实现层 · 允许被 agent 搜索优化 |
| 它的**目标函数定义权**在人还是 agent? | 在人 · 反脆弱第四支柱不可动 | 在 agent · 属"可自动化"一侧 |

这张表不能告诉你"怎么写 harness",但它能告诉你"这段 harness 代码属于哪一类"。分类对,后续的投入和放弃决策才不会错。

一个具体走查示例。假设你团队的 agent 框架里有以下三段代码:

- **(A)** 一个 150 行的 `PlannerAgent`,专门负责把用户请求拆成 5–10 个 sub-task,然后派给 ExecutorAgent 一个个做。
- **(B)** 一个 40 行的 `SessionStore`,用 JSONL 文件持久化每一次工具调用的 input / output / timestamp / actor。
- **(C)** 一个 30 行的 `ToolPermissionGate`,按"工具名 + 调用者身份 + 参数模式"决定一次调用是否放行。

用三问走一遍。

**(A)** 补的是"模型不会规划"这个模型缺陷,不在 Anthropic 三抽象里,目标函数定义权不稳定 —— **三问全错位,这段代码是技术债**,模型升级一代就要拆。

**(B)** 补的是"agent 需要跨调用可恢复事实流"这个协议,在三抽象的 session 层里,目标函数(什么叫"有效的事实")由人定义 —— **三问全对齐,这段代码是稳定价值**,值得继续投入。

**(C)** 类似 (B),补的是 tools 层的权限协议,目标函数(哪些组合被允许)由人定义 —— **稳定价值**。

这个走查的价值不是"结论"本身(你可能走一遍就心里有数),而是**走查过程强制你面对每段代码的真实分类**。很多团队的技术债是在"我们觉得它有用" 这种模糊判断下攒起来的;三问式走查给你一个**硬判据**,把讨论从偏好变成分类。

##### §4.9 两层上都成立的同一模式,粒度不同

最后把这件事放回 Ch 1 的两层坐标系。

在 **Layer 1**(AI Coding 过程),稳定接口是 `AGENTS.md` 的格式、CI gating 的语义、spec 文件的位置约定、PR 模板。这些东西一旦钉下来,模型从 Codex A 换到 Codex B 再换到 Claude Code,不需要重写开发流程 —— 接口没动。在 **Layer 2**(AI Agent 自身),稳定接口是 Anthropic 三抽象、Tool Manifest 的 schema、Verification 信号格式、Sandbox 的 capability 边界。它们一旦钉下来,agent 模型升一代、换一家,不需要改客户的 VPC 部署,不需要重新走合规。

两层上都有稳定接口,接口的形状不同;两层上都有技术债,技术债的形状不同;两层上都在押同一种赌注 —— **押接口,不押实现**。驾驭工程作为一门学科,成立的条件就这一件:**你能分清什么是接口、什么是实现**。

##### 回到 1974 年那份七页纸

再回到 Ken Thompson 和 Dennis Ritchie 那份七页纸上。他们写那篇文章的时候,没有人告诉他们 "你们正在钉下一个五十年后还在用的接口"。他们只是一边面对 PDP-11 这个当时的昂贵核心,一边把自己认为值得长期稳定的一组语义挑出来,用最少的字写清楚。五十年后,你手机里跑的 iOS、公司后端跑的 Linux、同事 MacBook 上跑的 Darwin,底下都有一份和 1974 年那份单子血脉相通的 syscall 表。

Lance Martin 的团队 2026 年春天做的事,只是同一种工程纪律在新核心上的又一次重演。Session / harness / sandbox 三抽象能不能跑五十年,今天没人知道。但我们知道,**这样做事的团队赢过,不这样做事的团队被一代代重置过**。

驾驭工程不是一个名词被发明出来;它是**一类工程习惯被一代代人反复证明有效**。你今天押的不是一个概念,你押的是一种早在 1974 年就被人示范过的工作方式。

---

##### 可观察信号

- 你的 harness 里**硬编码**了多少"模型现在还不会做"的假设?数一数,这是技术债的存量。
- 如果明天 GPT-6 / Claude 5 发布,你的 harness 里**哪些组件会自然消失**?哪些会变得**更重要**?
- 你的抽象接口**像 Unix 的 syscall** 一样稳定,还是**像某个框架的 v0.3 API** 一样一升级就破?

---

##### 本章核心论断

1. "**围绕昂贵核心搭稳定抽象层**" 是四十年来不断重复的工程结构,编译器(LLVM IR)/ OS(syscall)/ 中间件(SQL)/ 分布式系统(gRPC)都是它的具体实例。
2. Medium《Oldest New Idea》与 Anthropic Managed Agents 是**同一判断的历史版与当下版**;AIOS 是学术侧的独立证据,三者互相印证。
3. **模型越强,harness 越薄,但接口不会薄** —— Sonnet 4.5 → Opus 4.6 升级时 40% 零件消失、三抽象不变,是这条定律的实证。
4. 会消失的是"补模型缺陷的零件",不会消失的是"稳定接口"。**判据:这段代码模型变强一代还需要吗?**
5. Harness 补丁(固定 DAG / 硬编码 retry / planner 代劳 / context 压缩 hack)是最可靠的技术债生产工厂。
6. Harness 变薄之后,**成为自动搜索的合法对象**(Stanford Meta-Harness);但**稳定接口仍由人定、目标函数定义权仍由人保留**。Anthropic 的 meta 和 Stanford 的 meta 是两层正交的事。

---

##### 本章奠基文对齐

- [[medium-oldest-new-idea]] —— 历史类比主论文,火 → 炉子 → 蒸汽机的起源
- [[anthropic-managed-agents]] —— meta-harness 立场的当代陈述,session / harness / sandbox 三抽象
- [[anthropic-harness-design]] —— 4.5 → 4.6 升级时 harness 自然变薄 40% 的实证
- [[aios-foundation]] —— "LLM as OS, Agents as Apps" 的学术侧独立背书(COLM 2025)
- [[stanford-meta-harness]] —— harness 变薄之后可被自动搜索(arxiv:2603.28052,Lee et al. 2026)

##### 本章对应 wiki 页

- [[concept-harness-as-platform]] · [[concept-harness]]

---

**Part 0 到这一章结束**。你已经拿到本书的四样东西:两层坐标系(Ch 1)、三把嵌套的尺(Ch 2)、面向意图的第一性原理(Ch 3)、稳定抽象的历史定位(Ch 4)。四件东西合起来,就是读后续每一章必须先握在手里的坐标。

下一章进入 **Part A · Layer 1 · AI Coding 过程的驾驭工程**。那里你会再遇到那位凌晨两点的工程师 —— 他的团队在接下来的半年里,怎么把 `AGENTS.md` 从一份目录、到一套 CI gating、到一整条 review pipeline 长出来;怎么在一个月之内从 "每个 PR 都人审" 走到 "看指标放行"。1M LOC 的故事,从 Ch 5 开始。
