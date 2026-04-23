# 第 4 章 · The Oldest New Idea —— 稳定抽象的历史

> "围绕一个昂贵核心搭稳定抽象层",是每一次技术飞跃都重复出现的结构。
> LLM 只是新的昂贵核心;驾驭工程只是这一结构的最新一环。
> **模型越强,harness 越薄;但接口不会薄**。

## 1974 年的那份七页纸

1974 年 7 月,Ken Thompson 和 Dennis Ritchie 在 *CACM* 发表了一篇七页纸的文章:*The UNIX Time-Sharing System*。文章里的附录列了一份系统调用清单,在后世被叫做 Unix syscall。那一份单子上包括:`read`、`write`、`open`、`close`、`fork`、`exec`、`wait`、`pipe`。

如果今天你在一个 2025 年出的 Linux 盒子上 `man 2 read`,读到的语义和那份七页纸里写的语义**几乎一致**。五十年。CPU 从 PDP-11 换到 x86、x86-64、ARM、RISC-V;内核从原始 Unix 到 BSD 到 Linux 到 macOS Darwin;进程模型从单 CPU 单线程到几百核心 NUMA —— `read` 的语义没动。

Ken Thompson 这辈子最值钱的工作,**不是写 Unix 的实现**。是钉下了那份单子上的接口语义。接口下面的东西,后来被换了不知道多少轮;接口本身,活到了他自己退休之后。

这件事放在今天讲有什么用?你翻开 2026 年 4 月 Anthropic 的 *Scaling Managed Agents*,Lance Martin 那个团队做的事情,**结构上跟 Ken Thompson 完全一样**。他们画出三条接口:session / harness / sandbox。他们明确说不承诺任何具体实现,只承诺接口长期稳定。他们在押的赌注,和 Thompson 一样 —— **押接口,不押实现**。

这不是巧合。这是同一种工程模式的第 N 次重现。本章讲的就是这个模式,以及它为什么让"驾驭工程会不会三年后又被换成另一个时髦词" 这个问题**从一开始就是错问**。

## §4.1 四十年,同一个剧本

抽象层的故事,从来不是"谁发明了 LLM" 这种叙事。它是 "谁在强核心之外搭了一层**接口稳定、实现可换** 的薄壳"。过去四十年,这个模式至少清晰地出现过四次。

**编译器**。CPU 是昂贵核心,指令集每年都在进化。但编译器前端语言不知道换了多少种 —— C、C++、Rust、Go、Swift、Kotlin,每种语言都有自己的编译器前端。而 **LLVM IR** 这种中间表示,基本稳定了二十年。你今天给一门新语言写编译器,不会从头想 "怎么生成 x86 代码";你生成 LLVM IR,后端替你做完剩下的事。LLVM IR 不是最优的中间表示,但它是**稳定**的中间表示。写 LLVM 后端的人,不需要重学 Rust 语法;写 Rust 的人,也不需要关心 CPU 换代。抽象层的价值,不是实现最优,是**接口稳定**。

**操作系统**。硬件是昂贵核心,每年出新架构。但 Unix 的 syscall —— `read / write / open / close / fork / exec` —— 如开篇所说,四十年没变。硬件是变化的,syscall 是稳定的 —— 1974 年那份七页纸里定下的东西,今天还在你的手机里跑。

**中间件 / 数据库**。数据库是昂贵核心,SQL 是稳定抽象。ORM 换了一代又一代:Hibernate → SQLAlchemy → Prisma → Drizzle,每一代作者都以为自己终于把前一代的错误修掉了。但 **SQL 本身**从 1986 年 ISO 标准化至今,核心语义几乎没动。这件事让"换一个数据库后端"成了一项工程性任务,而不是重写项目。你换引擎,不换语言。

**分布式系统**。网络是昂贵核心,RPC 是稳定抽象。从 CORBA 到 gRPC,实现路径变了无数次:Java RMI、SOAP、Thrift、Protocol Buffers + gRPC。但"远程方法调用"这个抽象,稳定得像一条公理。k8s / Istio 的 service mesh 只是把它再往上抽一层,本质仍是"给网络这个昂贵核心套一层稳定接口"。

四次都是同一个剧本。**昂贵核心 + 稳定抽象 = 工程学的稳定飞轮**。接口一旦稳定,整个生态就能在它上面增长数十年。

这里有一句可以直接钉在墙上的话:**接口不稳的层,永远成不了学科,只是配置**。

## §4.2 从火到蒸汽机 —— 不是文学修辞

Fisher Zhang 2026 年 4 月在 Medium 上那篇 *Harness Engineering: The Oldest New Idea in AI*([[medium-oldest-new-idea]])把这个模式推到比软件史更久的尺度上。

他的类比是**火 → 炉子 → 蒸汽机**。

火,是能量源。人类第一次学会用火,用的是"直接控制":把一根柴放在哪、吹多大风。这是对能量的**单点调度**。

炉子,是环境控制。把火围进一个可控边界,限制它能往哪里跑、多烫、多久烧完。这不是更聪明地烧火,是**给同一个火建一层壳**。

蒸汽机,是系统化的驾驭。把火的能量**翻译成可调度的做功** —— 气压、活塞、曲轴、转速。蒸汽机里 99% 的工程不是关于火,是关于**把火这件强而难控的事变成可编程的** work。没有蒸汽机,工业革命不发生。

Zhang 这段类比不是文学修辞,它是严格的结构性类比。每一步,都是人类面对同一个强而难控的核心,把利用方式**越来越系统化**。

LLM 是本时代的"火"。Prompt engineering 是把它**围在一个炉膛里** —— 一次调用的边界。Context engineering 是把这个炉膛**接上风门、燃料管、排烟管** —— 信息视野的管理。Harness engineering 是**造蒸汽机** —— 把强核心变成可调度的做功引擎,跨调用、跨 session、跨 agent。**辔头是新的,结构是古老的**。

这就是为什么本书的主标题叫"驾驭工程"而不是"AI 工程",副标题叫"面向意图的工程学"而不是"prompt 大全"。这两个命名都在暗示一件事:**你今天看到的不是一场新革命,是一台老机器在新核心上再造一遍**。

## §4.3 Lance Martin 的团队那个春天在做什么

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

## §4.4 AIOS —— 学术侧的独立证据

如果 Anthropic 是产业侧的证据,那么 **AIOS Foundation**([[aios-foundation]],arxiv:2403.16971,COLM 2025)就是学术侧的独立证据。它用一句话总结就是:**LLM as OS, Agents as Apps**。

Agent 发起 "syscall";AIOS kernel 负责五类经典 OS 问题:resource management、scheduling、context switching、memory management、access control。注意这件事的独立性 —— AIOS 的作者不是 Anthropic 员工,发表渠道不是工程 blog 而是 COLM 这种 peer-reviewed 学术会议。但**他们得出的结构** —— 围绕 LLM 这个昂贵核心,应该搭一层 OS 样的稳定接口 —— 和 Anthropic Managed Agents 的判断几乎一字不差。

两个独立来源在同一时间独立给出同一个结构性判断,这不是孤证,是**同一范式的两次实例化**。

AIOS 的价值不在于它今天的实现最优(事实上它在 verification 这一维度是空的,这是 [[anthropic-harness-design]] 的三 agent 架构弥补的部分)。它的价值在于它给 "LLM 时代的工程中心 = harness 层" 这个判断提供了**产业 + 学术的双重证据**。当两个完全不同的社群、完全不同的优化目标、完全不同的发表渠道,独立收敛到同一个结构时,这个结构就不是 hype,是真的在发生的事。

## §4.5 定律:模型越强,harness 越薄,但接口不会薄

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

## §4.6 反面教材:harness 补丁是最可靠的技术债生产工厂

反过来说这条定律:如果一个团队把"临时性的模型缺陷"固化为"永久性的系统结构",它就在**高效地生产技术债**。

几个常见的形态。**固定 DAG 的 agent 框架** —— 假设"模型不会自己规划",所以写死每个 step,模型一变强整张 DAG 一半节点变成 noise,又因为 hard-code 了没人敢动。**硬编码 retry** —— 写死 3 次 retry + 特定 fallback,模型一变强第一次就成功了,剩下的 2 次是纯浪费的代码和 token。**完整的 planner 子系统** —— 单独造一个 planner agent 做任务拆分,模型一变强 70% 冗余、30% 又跟不上新模型的风格,一边冗余一边掣肘。**手写的 context 压缩 hack** —— 新模型有了 context anxiety 的内置对策,这整套 hack 既多余又可能反向放大问题。

这些都是**赌"模型不会变强"的技术债**。与之相反,稳定接口投资的东西 —— session 持久化协议、权限隔离边界、独立 verification 信号 —— 无论模型变强多少,它们的价值只会增,不会减。

读到这里,你可以停下来在自己的仓库里做一次走查。任选三段和"AI" 相关的代码,每段都用那句话过一遍 —— "模型变强一代还需要吗?"。这件事不需要会议室,不需要架构评审,半小时能做完。但做完这半小时,你会知道自己团队里 harness 层的真实技术债水位在哪。

## §4.7 变薄之后:harness 自身可被自动搜索

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

## §4.8 给从业者的一张判断表

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

## §4.9 两层上都成立的同一模式,粒度不同

最后把这件事放回 Ch 1 的两层坐标系。

在 **Layer 1**(AI Coding 过程),稳定接口是 `AGENTS.md` 的格式、CI gating 的语义、spec 文件的位置约定、PR 模板。这些东西一旦钉下来,模型从 Codex A 换到 Codex B 再换到 Claude Code,不需要重写开发流程 —— 接口没动。在 **Layer 2**(AI Agent 自身),稳定接口是 Anthropic 三抽象、Tool Manifest 的 schema、Verification 信号格式、Sandbox 的 capability 边界。它们一旦钉下来,agent 模型升一代、换一家,不需要改客户的 VPC 部署,不需要重新走合规。

两层上都有稳定接口,接口的形状不同;两层上都有技术债,技术债的形状不同;两层上都在押同一种赌注 —— **押接口,不押实现**。驾驭工程作为一门学科,成立的条件就这一件:**你能分清什么是接口、什么是实现**。

## 回到 1974 年那份七页纸

再回到 Ken Thompson 和 Dennis Ritchie 那份七页纸上。他们写那篇文章的时候,没有人告诉他们 "你们正在钉下一个五十年后还在用的接口"。他们只是一边面对 PDP-11 这个当时的昂贵核心,一边把自己认为值得长期稳定的一组语义挑出来,用最少的字写清楚。五十年后,你手机里跑的 iOS、公司后端跑的 Linux、同事 MacBook 上跑的 Darwin,底下都有一份和 1974 年那份单子血脉相通的 syscall 表。

Lance Martin 的团队 2026 年春天做的事,只是同一种工程纪律在新核心上的又一次重演。Session / harness / sandbox 三抽象能不能跑五十年,今天没人知道。但我们知道,**这样做事的团队赢过,不这样做事的团队被一代代重置过**。

驾驭工程不是一个名词被发明出来;它是**一类工程习惯被一代代人反复证明有效**。你今天押的不是一个概念,你押的是一种早在 1974 年就被人示范过的工作方式。

---

## 可观察信号

- 你的 harness 里**硬编码**了多少"模型现在还不会做"的假设?数一数,这是技术债的存量。
- 如果明天 GPT-6 / Claude 5 发布,你的 harness 里**哪些组件会自然消失**?哪些会变得**更重要**?
- 你的抽象接口**像 Unix 的 syscall** 一样稳定,还是**像某个框架的 v0.3 API** 一样一升级就破?

---

## 本章核心论断

1. "**围绕昂贵核心搭稳定抽象层**" 是四十年来不断重复的工程结构,编译器(LLVM IR)/ OS(syscall)/ 中间件(SQL)/ 分布式系统(gRPC)都是它的具体实例。
2. Medium《Oldest New Idea》与 Anthropic Managed Agents 是**同一判断的历史版与当下版**;AIOS 是学术侧的独立证据,三者互相印证。
3. **模型越强,harness 越薄,但接口不会薄** —— Sonnet 4.5 → Opus 4.6 升级时 40% 零件消失、三抽象不变,是这条定律的实证。
4. 会消失的是"补模型缺陷的零件",不会消失的是"稳定接口"。**判据:这段代码模型变强一代还需要吗?**
5. Harness 补丁(固定 DAG / 硬编码 retry / planner 代劳 / context 压缩 hack)是最可靠的技术债生产工厂。
6. Harness 变薄之后,**成为自动搜索的合法对象**(Stanford Meta-Harness);但**稳定接口仍由人定、目标函数定义权仍由人保留**。Anthropic 的 meta 和 Stanford 的 meta 是两层正交的事。

---

## 本章奠基文对齐

- [[medium-oldest-new-idea]] —— 历史类比主论文,火 → 炉子 → 蒸汽机的起源
- [[anthropic-managed-agents]] —— meta-harness 立场的当代陈述,session / harness / sandbox 三抽象
- [[anthropic-harness-design]] —— 4.5 → 4.6 升级时 harness 自然变薄 40% 的实证
- [[aios-foundation]] —— "LLM as OS, Agents as Apps" 的学术侧独立背书(COLM 2025)
- [[stanford-meta-harness]] —— harness 变薄之后可被自动搜索(arxiv:2603.28052,Lee et al. 2026)

## 本章对应 wiki 页

- [[concept-harness-as-platform]] · [[concept-harness]]

---

**Part 0 到这一章结束**。你已经拿到本书的四样东西:两层坐标系(Ch 1)、三把嵌套的尺(Ch 2)、面向意图的第一性原理(Ch 3)、稳定抽象的历史定位(Ch 4)。四件东西合起来,就是读后续每一章必须先握在手里的坐标。

下一章进入 **Part A · Layer 1 · AI Coding 过程的驾驭工程**。那里你会再遇到那位凌晨两点的工程师 —— 他的团队在接下来的半年里,怎么把 `AGENTS.md` 从一份目录、到一套 CI gating、到一整条 review pipeline 长出来;怎么在一个月之内从 "每个 PR 都人审" 走到 "看指标放行"。1M LOC 的故事,从 Ch 5 开始。
