# 第 1 章 · 两种驾驭工程

> 你在读的这本书,**同时在讲两件事**。
> 如果你把它们当成一件,后面十三章每一页都会让你有地方对不上。
> 但它们本来就不是一件。

## 一个读者在第三章会遇到的困惑

翻到这本书第三章的时候,你大概会卡在一个地方。那章里,OpenAI 的工程师讲他们**1M LOC / 1500 PR / 0 human code** 的故事,说他们做的工作是 "designing environments, specifying intent" —— 然后下一节立刻转到 Anthropic Managed Agents 的三抽象 `session / harness / sandbox`。这一跳是怎么跳的?

这两件事确实都叫 "harness engineering"。它们都在 2026 年的同一季度被命名。它们用的词互相引用。但如果你是那位 OpenAI 工程师,你每天想的问题和做 Managed Agents 的 Lance Martin 团队每天想的问题 —— **根本不是同一件事**。

- OpenAI 工程师想的是:**怎么让 Codex 写的代码能合规上线,让我们三个人干三十个人的活**。
- Managed Agents 团队想的是:**怎么让我们的 agent 产品在客户的 VPC 里跑,崩了能 resume,出事能审计,合规能签字**。

两件事都是工程。都很难。但它们在**对象、客户、产出、合规要求、技术栈、甚至时间尺度**上都不一样。把它们放在同一本书里讲可以,把它们当成同一件事讲就错了。

本书的一件基础动作,是先把这两层**钉开**。

## Layer 1:AI Coding 过程的驾驭工程

把视线放在第一层。你的团队是一家公司里的软件团队。你们要交付一个产品或服务。**AI(Codex / Claude Code / Cursor)是你们的生产工具**,像 IDE、像 CI、像 code review bot 的升级版。它写代码,你们审查、集成、上线。

这一层的"驾驭工程"问一个**单一的问题**:**在 AI 大量生成代码的时代,怎么确保交付的工程质量**?

具体落到地面,这变成若干子问题:

- AI 写的代码怎么通过 review?是每行都人看一遍,还是用 test infra + CI 自动拦截?
- 组织的隐性知识怎么让 AI 读得到?是塞进 system prompt,还是分层(AGENTS.md 是目录,docs/ 是系统记录)?
- 意图怎么从口头变成 spec,从 spec 变成 property test,从 property test 变成 audit trail?
- "0% human review"这件事在哪些场景成立,在哪些场景不成立?

这些问题加起来,就是 Martin Fowler 在 *Harness engineering for coding agent users* 里说的那个学科,也是 OpenAI 那组数字的真实内容。**它是软件工程这门老学科,面向 AI 时代的又一次进化** —— 像十年前从瀑布到敏捷、从单体到微服务、从人肉部署到 CI/CD。基础问题没变("怎么交付可靠的软件"),工具变了,工作层也随之移动。

这一层里,**"agent" 是人的工具**。它可能很聪明、可能有记忆,但它不是产品本身。产品是它帮你产出的那 1M LOC。

## Layer 2:AI Agent 自身的 Harness 工程

把视线放在第二层。你的团队要做一个 **agent 产品** —— 可能是一个编程助手、一个研究助手、一个客服 agent、一个合规审计 agent。你要卖的不是代码,是**agent 的行为本身**。用户打开你的产品,它帮他们完成任务。

这一层的"驾驭工程"问**另一个完全不同的问题**:**怎么把一个 LLM 套进一个可恢复、可审计、可替换、可合规的运行时基础里,让它能跑几小时、跑几天、能被放进医疗/金融/基础设施的真实场景**?

具体落到地面,这变成:

- Session 是不是场外的、append-only 的事实流?还是 context window 的镜像?
- Harness 是不是无状态的、可 `wake()` 重启的?还是一挂掉就全丢?
- Tool vocabulary 是正交的吗?credentials 物理上进不进 sandbox?
- Verification 层的 actor 和 generator 是不同的吗?agent 自己打自己分算不算?

这一层里,**"agent" 不是工具,是产品本身**。你的合规压力是 EU AI Act、FDA SaMD、SEC AI disclosure 那一档的;你的运维压力不是"让团队更高效",是"让 agent 七乘二十四小时不出事"。

Anthropic Managed Agents、AIOS Foundation、Neo4j 的 context engineering、Milvus 的 execution layer、Karpathy 的 LLM wiki —— 这五份文献讲的是**同一层的事情**,这一层。

## 两层的关系:正交,不是嵌套

这件事重要到要在本章第一次展开的地方讲透:**Layer 1 和 Layer 2 不是父子关系,它们正交**。

一家公司可以**只在 Layer 1**:他们用 Codex 写自己的 SaaS 产品,但他们的产品里没有任何 agent —— 卖的是传统 web 应用。AI 在幕后,用户看不到。对他们而言,Layer 2 不存在。

一家公司可以**只在 Layer 2**:他们做一个 agent 产品,但他们自己的开发过程很传统 —— 工程师手写代码,AI 只帮他们查 API。对他们而言,Layer 1 不是核心工作。

一家公司也可以**两层都在**:他们既用 AI 写自己的代码(Layer 1),做出来的产品又是一个 agent(Layer 2)。这种公司最容易把两层混起来,因为同一个词("harness engineering")同时在两层使用。

更深的一件事是:**两层的工程纪律高度相似,但解决的问题不同**。两层都讲 session、都讲 tool、都讲 verification、都讲 spec → test → audit trail。但 Layer 1 的 session 是"你的工程团队和 Codex 之间的对话历史",Layer 2 的 session 是"你的 agent 和终端用户之间的事实流"。两层的 tool 都是"动作词汇表",但 Layer 1 的词汇表是 `git diff / run tests / open PR`,Layer 2 的词汇表是 `read_file / search_web / call_payment_api`。

**同样的 engineering primitives,在两层上以不同的粒度和治理节奏出现**。你得先知道自己站在哪一层,才能判断哪段文献直接适用、哪段需要翻译。

## 三个问题帮你定位自己在哪一层

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

## 本书两层的分工:你现在翻到哪一章在讲哪一层

这本书总共十四章,按下面的分工组织:

- **Part 0(Ch 1–4)** —— **两层共享** 的坐标系、第一性原理、历史定位。不管你站在哪一层,这四章都读。
- **Part A(Ch 5)** —— **专讲 Layer 1**。OpenAI / Fowler / MindStudio / AGENTS.md 这几条线合在一章,压缩成一章的原因是:这一层的几位奠基者观点互相印证得很紧,不需要四章展开。
- **Part B(Ch 6–9)** —— **专讲 Layer 2**。四根支柱 session / harness / tools / verification 逐章展开。这是本书字数密度最高的一部分,因为 Layer 2 的工程纪律没有现成的教科书。
- **Part C(Ch 10–12)** —— **两层共享** 的跨时间维度:两类循环、知识治理、reflexive harness。两层都要用,但实现细节略不同。
- **Part D(Ch 13–14)** —— **两层共享** 的落地、反脆弱、终局愿景。反脆弱四支柱在两层上都成立,但触发机制不同。

一条捷径:**如果你完全在 Layer 1**(你的产品不是 agent),你读完 Part 0 + Ch 5 + Part C(只读循环、知识层)+ Ch 13–14 就够了,Part B 可以跳。**如果你完全在 Layer 2**(你的产品是 agent),Ch 5 是背景知识,Part B 是你的主场。**如果你两层都在**,线性读,中间在 Part 切换处停一下想清楚。

附录 D 有按角色的阅读路径,可以作为补充。

## 为什么这本书把两层放进同一本

最后一个该问的问题:**既然两层正交,为什么不拆成两本书?**

三个理由,由轻到重:

- **共享的坐标系** —— Prompt / Context / Harness 三把尺、面向意图第一性原理、Oldest New Idea 历史定位,这些东西不区分层。读者在哪一层都先需要它们。
- **共享的反脆弱论证** —— 模型越强、驾驭工程越值钱,这件事在两层上都成立,而且理由结构几乎一样。只讲一层,反脆弱论证显得孤证;两层合讲,论证力度放大。
- **真实工程师经常两层都在** —— 一个做 agent 产品的公司,自己的开发过程也在用 Codex / Claude Code。一本书合讲可以帮他们在**同一个概念框架里**处理两层的问题,不用在两套术语之间翻译。

但本书**拒绝把这当成单一学科**。两层有共享的工程原则,但**它们不是同一件工作**。这是第一章要钉下的第一根桩子。

---

## 可观察信号

- 你的团队白板上,"harness" 这个词一天之内被用来指两种不同的东西吗?(如果是,你们已经在两层之间滑)
- 招聘 JD 里,"AI coding harness" 和 "agent runtime" 两个岗位职责是分开写的,还是混成"AI 工程师" 一个岗位?
- 合规 review 时,是按 "软件产品" 套流程,还是按 "AI 系统" 套流程?

---

## 本章核心论断

1. **"驾驭工程" 实际上横跨两层**:Layer 1 AI Coding 过程 · Layer 2 AI Agent 自身。
2. 两层**正交**,不是嵌套。一家公司可能只在 Layer 1、只在 Layer 2、或两层都在。
3. 两层共享 engineering primitives(session / tool / verification / spec),但**粒度、客户、合规、产出**都不同。
4. **读任何 harness 相关文献前先判断它讲的是哪一层**;最常见的阅读错误,是把一层的洞察直接移植到另一层。
5. 本书 14 章按层分工:Part 0(共享坐标)/ Part A(Layer 1 专属)/ Part B(Layer 2 四柱)/ Part C + D(共享跨时间 + 落地 + 终局)。

---

## 本章奠基文对齐

- [[fowler-on-harness]] —— Layer 1 的学科命名者
- [[openai-harness-engineering]] —— Layer 1 最清晰的工程实证(1M LOC)
- [[anthropic-managed-agents]] —— Layer 2 的 meta-harness 立场
- [[anthropic-harness-design]] —— Layer 2 的 long-running 实证
- [[mindstudio-harness]] —— Layer 1 的入门级分类(五柱)
- [[aios-foundation]] —— Layer 2 的学术侧独立证据

## 本章对应 wiki 页

- [[concept-harness]] · [[concept-prompt-vs-context-vs-harness]]

---

**第 2 章**进入两层共享的第一块基石:**三把嵌套的尺**,重新安置你对"我在哪个尺度上工作" 的判断。
