# 8. Agent 群体编排：Harness 如何扩展团队而不只是代码

Harness 也是一个用于多 agent、多 owner 交付的协调系统。

## 8.1 工作分解模式

```text
Program Manager
  -> defines milestone contract + acceptance invariants
Runtime/Harness Owner
  -> owns ABI + sink + supervisor durability
Skill Owner (e.g., deep-search)
  -> owns event emission + workflow mapping
UI/API Owner
  -> owns replay parity + scoped projection
Release/Operator Owner
  -> owns live gate + diagnostics + rollback policy
```

没有这种拆分，团队会合并通过本地测试、但破坏系统事实的局部真相。

## 8.2 反混乱规则

门禁激活后，任何工作流都不得单方面重定义契约语义。  
任何 schema、生命周期语义或 replay 行为的变更，都必须在同一个 PR slice 中更新：

- fixture
- 脚本门禁
- e2e spec
- docs

---

### 扩展源材料


#### 来自 `14-many-brains-many-hands.md`：第 14 章 · Many Brains, Many Hands —— 终局愿景

_源材料角色：多 agent 编排与终局愿景。_


#### 第 14 章 · Many Brains, Many Hands —— 终局愿景

> 互联网不属于任何一家公司。
> 十年后的 agent 基础设施,也不会属于任何一家公司。
> 这本书最后一章要讲的,是你现在每一行代码、每一份 spec,
> 究竟是在协议层押注,还是在应用层消耗。

##### 网络协议栈的那一个早上

1989 年的某个早上,蒂姆·伯纳斯-李在 CERN 的办公室写下一份提案,标题叫《Information Management: A Proposal》。那份提案后来变成了 World Wide Web。但那天早上他没有发明的东西,比他发明的更重要:**TCP/IP 不是他发明的,DNS 不是他发明的,Ethernet 不是他发明的**。他能写出 WWW,**唯一的前提**是 —— 在他之下已经有一整叠稳定的协议:TCP/IP 管数据包、DNS 管名字、HTTP 管请求语义、TLS 管安全、Ethernet 管物理层。这些协议不属于任何一家公司。它们是标准。

几十年后,今天的互联网上跑着 Google、Meta、亚马逊、Netflix,跑着无数 SaaS 产品、视频平台、即时通讯、金融系统。看起来竞争激烈、你死我活。但你如果把镜头拉远,**没有任何一家公司拥有它下面的协议栈**。TCP 不归 Google 所有,DNS 不归 Meta 所有,HTTP 标准每隔几年由 IETF 开会推进。**协议是平台,应用是商业** —— 这句话就是整个现代互联网的立地方式。

如果你同意"driving engineering" 是 2026 年刚刚被命名的学科,那么我们正站在 1989 年那个早上的对应位置。今天的 agent 产品看起来竞争激烈:Anthropic 在做 Managed Agents,OpenAI 在推 Codex,几十家 startup 在做垂直领域的 agent,每家都想做"下一个杀手级应用"。但如果你听得够仔细,你会发现一件事:**真正长期有价值的不是任何一家的 agent 产品,是底下正在浮现的那一叠协议** —— session 事实流协议、tool vocabulary 标准、verification 接口规范、skill 传递格式。这一叠东西还没有名字,还没有对应的 IETF,但 2026 年的第一根桩子已经在地里。

这一章要讲的是:**如果你认真押这件事,你十年后的位置在哪里**。

##### §14.1 Anthropic 的"many brains, many hands"

给这个愿景贡献了当代表述的,是 [[anthropic-managed-agents]]。2026 年 4 月那篇 Scaling Managed Agents 的工程博客里,三位作者用一句话总结了他们五年的架构演进:**decouple the brain from the hands → many brains, many hands**。Agent 不再绑定某一个 shell、某一个容器、某一个模型;它绑定的是**可恢复状态** 与**可调用能力**。

拆成三条具体含义:

- **Brain**(harness + model)随时可替换 —— 升级、换 vendor、换 loop 变体,对业务透明。
- **Hand**(sandbox / tool)随时可替换 —— 升级 runtime、迁移部署环境、扩展能力边界,对上层透明。
- **Session** 是**不变的 anchor** —— 所有历史、所有事实、所有进度,活在 agent 进程之外。

Anthropic 把这套抽象部署上线后给出的数据,很能说明"解耦" 本身的商业价值:容器按需 provision,TTFT(time-to-first-token)在 p50 降了约 60%,在 p95 降了超过 90%。credentials 不进 sandbox,用 MCP proxy 中转,让 Claude-generated code 物理上看不到 token —— 这个设计同时对可恢复性、合规、安全三个要求作答,不是凭借某一项技术强,是凭借**结构位置正确**。

这件事之所以匹配章首的 TCP/IP 类比,是因为它**本质上就是在做分层**:Anthropic 没有承诺任何一个具体 harness 实现会长期存在,只承诺 session/harness/sandbox 这**三层接口** 的边界会长期存在。这是 Unix syscall 式的稳定承诺,不是某个 API 的稳定承诺。**做分层的公司,就是在为将来的协议层添砖**。

##### §14.2 Brain 内部也可以自动化 —— Stanford 的证据

如果说 Anthropic Managed Agents 是"哪些接口值得长期稳定" 的回答,那么 [[stanford-meta-harness]] 是另一半的回答:**稳定接口内部的实现,如何自动优化?**

这篇 2026 年的论文做了一件让人想回味的事:他们让一个 **outer-loop proposer agent** 读取所有历史候选 harness 的源码、分数、执行痕迹,然后**自己提议新的 harness 变体**。prompt-tuning 优化 prompt,RLHF 优化 weights,这篇论文优化 **harness 本身的代码**。实测结果也已经落在纸面上:分类任务上 +7.7 pts、同分下 context token 消耗 -75%、数学推理 +4.7 pts、TerminalBench-2 上超过手工 harness。

这些数字重要不是因为它们刷新了什么 SOTA,而是因为它们**证明了一件结构性的事**:brain 内部的实现,可以自动化;harness 代码本身可以成为 agent 的优化对象。这在反脆弱的意义上是一个"第五问" 级别的证据 —— 连 harness 设计本身都自动化了,人还需要做什么?Ch 13 §13.8 已经给了答案:**定义目标函数 + 运行独立验证**。Stanford 的论文自己完整演示了这个分工:outer loop 自动搜出更好的 harness,但 outer loop 的 evaluation 设计是**人写的**;目标函数、held-out 任务、OOD spot check 策略全部由人定。

这正是 Anthropic 和 Stanford 这两个"meta-harness" 派别**如何分工** 的答案:

| "meta" 的含义 | Anthropic Managed Agents | Stanford Meta-Harness |
|---|---|---|
| 回答的问题 | 哪些接口值得 40 年稳定? | 稳定接口内部如何自动搜索实现? |
| 谁设计 | 人类平台工程师 | agent proposer(outer loop) |
| 产出 | 一份契约 | 一段 harness 代码 |
| 失败模式 | 接口腐烂 / 早期承诺过度 | 优化器过拟合评测集 |

它们是**正交的两层**,不是竞争。Anthropic 选 slot,Stanford 填 slot。放在一起,就是十年后 agent 基础设施的完整雏形。

##### §14.3 闭环四节点

十年后的运行闭环,有四个节点。缺一个都不是反脆弱,任何一个被 agent 吞并,验证独立性崩溃。

**节点一 · 人定义稳定接口**。session 格式、tool vocabulary、verify 协议、spec 顶层。这些是 TCP/IP 式的稳定东西 —— 不是字面意义上的 40 年不变,而是**agent 不动这一层**。agent 可以在接口内部实现上随意优化,但接口的边界由人划。这一节点是 Anthropic Managed Agents 回答的问题。

**节点二 · Agent 在接口内自动优化实现**。具体代码、loop 变体、context packing 策略、retry 逻辑、prompt 措辞、tool 调度顺序。这些东西的变化频率比接口快一到两个数量级 —— 每次模型升级、每次 benchmark 更新、每次业务需求变动都可能让最优实现重写。Stanford Meta-Harness 证明了这一节点**可以被自动化**,甚至它被自动化以后往往比手工实现更好。

**节点三 · 独立验证层检查优化结果**。property test + golden trace + OOD spot check + sycophancy lint。必须由一个位置独立的 actor 运行 —— 不同 agent、不同模型、不同训练数据。这一节点不是"验证结果对不对",是"验证结果**能不能被信任**"。一旦这一节点被 generator agent 吞并,整个闭环塌成单 agent 自我奉承的循环,Ch 13 §13.3.5 里的 sycophantic verification 会在系统层大规模发作。

**节点四 · 人签字**。合规要求的问责节点;没有这一步,上线不合法 —— 不是技术意义上不合法,是社会结构意义上不合法。FDA、SEC、EU AI Act、GDPR 四套框架的共同要求,就是"出事时必须有一个人站出来承担"。能力可以外包,问责不能(Ch 13 §13.8 的第三柱)。

四个节点串成一个闭环:人定的接口和目标函数**下行**给 agent,agent 优化的实现**上行**给独立验证层,验证层的判决**交给**人签字,签字完成之后循环进入下一轮。这个闭环是反脆弱的**运行学载体**:四支柱的"位置独立性" 在这里变成了**事件流上的次序要求**,不再是抽象原则。

##### §14.4 多脑多手的三种具体形态

"Many brains, many hands" 在工程上不是一个比喻,它有三种可见的具体形态。

**形态一 · 多脑协作**。一个工程任务由多个专用 brain 分工:**Planner** 读 session 提出 sprint 目标;**Generator** 实现代码;**Evaluator** 独立验收。[[anthropic-harness-design]] 的三-agent 架构已经是雏形 —— 在 Retro game maker benchmark 上,solo Claude 20 分钟花 9 美元出浅尝辄止的结果;三-agent harness 跑 4 小时、花 80 美元,产出 solo run 在任何 token 预算下都到不了的生产级质量。这个结构未来会再加 **Reviewer**、**Auditor**、**Security-Checker** 等角色,每一个都是独立 brain,共享一条 session。

**形态二 · 多手编排**。工具不在 agent 里,在 **substrate** 里,跨 session 跨 agent 共享。你在某个 session 里加的 MCP tool,另一个完全不同的 agent 下次启动时依然可用。**工具是组织资产,不是 agent 的私有属性**。这让 skill 可以跨组织传递,也让"写一个工具" 这件事从"给某个 agent 加能力" 变成"给所有 agent 加能力"。Ch 8 里讲的 tool vocabulary 正交性,在这里落成了**组织层**的可复用资产。

**形态三 · 跨环境执行**。Brain 在云端,hand 在本机 / 手机 / 边缘设备。Agent 的"部分能力" 跑在不同物理位置,brain 统一调度。一个现实的例子:用户在手机上发起一个长任务,brain 在云端协调,一部分 tool 在用户本机跑(读本地文件、用本地打印机),一部分在远端 sandbox 跑(做计算密集任务 / 调付费 API),结果通过 session 统一整合。**agent 不再是一个进程,是一个跨物理位置、跨身份的分布式系统**;session 是这个系统的 single source of truth。

三种形态合起来,多脑多手不再是一种比喻,是一种**具体的系统架构**。它刚好解释了为什么 Anthropic 会在 2026 年执着于 session 抽象 —— session 是这种分布式系统唯一的 anchor。把 session 放对位置,三种形态都可以组合出来;session 放错了,三种形态一个都立不住。

##### §14.5 工程师的工作上移

有了上面的图景,回到那个每次模型升级都会被重新问起的问题:**工程师今天该怎么做?**

一句话回答:**从"写实现" 上移到"定义意图 + 设计验证" + "设计协议"**。

拆成三条可操作建议,是我们这本书从第 1 章走到这里想交给你的最直接的一套押注。

**建议一 · 从"给 agent 写功能" → "给 agent 设计 session 协议"**。单个功能会被下一代模型吃掉。一个你今天手工实现的 retry loop、你精雕的一段 context packing,下个模型代可能自己就做对了。但**你定义的 session 协议不会过时** —— agent 的历史、事实、进度怎么组织,这件事 Anthropic 可以学你、OpenAI 可以学你,最终 IETF 可以学你;它是 40 年稳定的东西。把工时从"写一个功能" 迁到"写一条 session 协议",单位时间的产出寿命翻十倍。

**建议二 · 从"给 agent 找工具" → "给 agent 规范 tool vocabulary"**。具体工具几年后会变 —— Playwright 下面出 Next-thing、Slack API 下面出 Next-messaging。但**词汇表规范**(正交性、可问责性、权限绑定、组合边界)是长期价值。tool vocabulary 是 Ch 8 那一章整整花了两万字讲的东西,它的终点不是"我们家有 300 个 MCP tool",是"我们家的 tool 词汇表在任何模型、任何组织下都能扩展"。

**建议三 · 从"给 agent 写 verifier" → "给 agent 搭 verification substrate"**。单个 verifier 实现会过时,但 **verification 独立性的协议层**(actor 分离、spec-based gating、audit trail 格式、独立签字工作流)是反脆弱的长期护城河。Ch 9 里的四种 verification 形式 —— property test、golden trace、OOD spot check、sycophancy-aware lint —— 每一种都可以做成一份可共享的 substrate,而不是锁死在某个 harness 实现里。

每升一层,需求更小众,单位价值更高。这是下一个十年的 systems software 职业机会。

对决策者而言,三条变成同型的选择:

- **押协议,不押框架** —— 协议 40 年稳定,框架 3 年迭代。
- **押 verification 独立性,不押 verification 强度** —— 独立性是结构,强度会被模型追上。
- **押合规顺风,不押监管真空** —— 监管会越来越严,真空窗口会关闭。

三条都不是一时的商业机会,是**结构押注**。如果你还记得章首那个 TCP/IP 早上,你就会发现这三条其实是同一句话的三种说法:**替协议层添砖,不要替应用层送命**。

##### §14.6 开放的治理问题 —— 不回避

这本书到这里已经给了愿景,也给了押注方向,按理说可以收尾了。但这张图景远不是一副理想画面,它有**未解决的治理问题**,本书不假装没有。列三条最大的:

**治理问题一 · 谁来审计 auto-evolving harness?**

Stanford Meta-Harness 的 proposer agent 自动演化 harness 源码;当这成为常态,审计责任在谁?人类个体审不过来 —— 新 harness 代码量可能每天成千上万行;AI 审 AI 违反独立性 —— 又绕回到第一柱。可能的答案是**独立审计机构**(像会计行业的四大、像金融行业的独立风控),但这类机构的建立速度跟得上 AI 演化速度吗?这是一个**合规创新的赛跑题**,本书作者不假装有答案。

**治理问题二 · 协议制定者是谁?**

TCP/IP 由 IETF 制定,SQL 由 ANSI/ISO 制定,Web 标准由 W3C 制定。每一套公共协议的背后都有一个**中立的、跨厂商的标准组织**。session 协议、tool schema、verification 接口,谁来制定?Anthropic?OpenAI?开源社区?[[aios-foundation]] 作为学术侧的独立证据,在论文(COLM 2025)+ 开源代码两路并进 —— 这是一条相对中立的路径,但它能不能跑出真正意义上的"跨厂商标准",还在验证中。最坏情况是某一家公司的事实标准(de facto standard)胜出,把整个生态锁进它的商业节奏;最好情况是 IETF 级的中立标准浮现,agent 基础设施像互联网那样"不属于任何一家"。现在还在早期,两种情景都可能发生。

**治理问题三 · 反脆弱的边界在哪里?**

本书一直在论证模型越强反脆弱越成立,但这是**在当前监管框架下**。如果监管框架本身被某种 AI 能力绕过(比如用 AI 欺骗监管方、用 AI 大规模生成合规伪造证据),反脆弱的社会结构会不会崩?这个问题的学术名字叫 **AI safety beyond alignment**,答案比本书的范围大得多。本书的立场保守一点:**现在可见的十年里,反脆弱的社会层锚点不会塌** —— 监管再迟钝也比 AI 欺骗工具的演化快一个节拍,这个节拍差是安全的。但**十年之外**,这个节拍差还成立吗?没人知道。

这三条是**本书范围之外** 的开放问题。本书作者不假装有答案,但明确**它们是存在的**。你带着这三个开放问题合上这本书,比带着"一切都想通了" 合上更健康 —— 健康的工程判断,从来不是"我都懂了",是"我知道我不懂什么"。

##### §14.7 尾声:向结语过渡

还记得章首那个 1989 年的 CERN 早上吗?蒂姆·伯纳斯-李能发明 Web,是因为他脚下有一叠他没有发明的协议。他一个人改不动 TCP,但他能在 TCP 上面搭出改变世界的 HTTP。**2026 年的 agent 工程师也正站在这样一个早上** —— 脚下正在浮现的 session / tool / verification / spec 四层协议,不是哪一家的资产,是整个行业的协议层。

本书的主体论证到这里合拢。四柱、两类循环、反脆弱四支柱、终局愿景 —— 每一层都指向同一件事:**当大家都在谈 agent 时,驾驭工程的问题不是"谁的技术更新",是"谁把不随模型变化的那几层做对了"**。把它做起来的团队,在 2030 年回头看,会发现自己不再是"在 AI 大潮里抓机会",是**已经站在了 AI 大潮的基础设施上**。

这本书走到这里,讲完了"做" 那一面。"谈" 那一面的话 —— 关于这个行业有多少人在谈它、多少人真正在做它 —— 留给**结语**去把句号画完。

---

##### 可观察信号

- 你团队 6 个月内的招聘 JD 里,"harness" / "substrate" / "protocol" 的频率变化。
- 你们的竞争对手是"另一家做同类 agent 的公司",还是**某个开源协议标准**?
- 你们的产品 roadmap 有没有"让我们的 agent 可以跨厂商执行" 这一条?
- 你的工作**越来越接近应用,还是越来越接近协议**?
- 你们有没有在参与或推动任何跨厂商的 session / tool / verification 标准?

---

##### 本章核心论断

1. 终点是 **agent 基础设施层**,像网络协议栈那样"不属于任何一家" —— **协议是平台,应用是商业**。
2. 多脑多手三形态:**多脑协作 / 多手编排 / 跨环境执行**,session 是唯一的 single source of truth。
3. 闭环四节点:**人定接口 + 目标函数 → agent 优化实现 → 独立验证 → 人类签字**,缺一个都不是反脆弱;任何一个被 agent 吞并,独立性崩溃。
4. 工程师工作上移三建议:**session 协议 > 功能实现、tool vocabulary > 具体工具、verification substrate > 单个 verifier**。
5. 决策者押注三条:**押协议不押框架、押独立性不押强度、押合规顺风不押监管真空**。
6. 终局愿景不是一幅理想画面 —— **审计 auto-evolving harness / 协议制定者 / 反脆弱边界** 是未解决的治理开放问题,本书不假装有答案,但明确它们存在。

---

##### 本章奠基文对齐

- [[anthropic-managed-agents]] —— "many brains, many hands" 原出处、三抽象解耦、TTFT p50 -60% / p95 -90% 的实证
- [[anthropic-harness-design]] —— 三-agent 架构作为多脑协作雏形、Retro game maker benchmark 数据
- [[stanford-meta-harness]] —— 闭环节点二"agent 优化实现" 的实证来源
- [[aios-foundation]] —— 学术侧的开源对照,COLM 2025 同行评审锚点
- [[medium-oldest-new-idea]] —— 历史模式的最终投射(同构于 TCP/IP)

##### 本章对应 wiki 页

- [[concept-harness-as-platform]] —— "harness 即平台" 的长期立场

---

**至此,十四章正文结束**。结语回到 Ariely,让开篇的俏皮话在合上书之前再响一次 —— 也让读者带着"判断,而不是谈论" 的视角离开。
