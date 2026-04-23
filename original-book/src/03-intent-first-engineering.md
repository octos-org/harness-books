# 第 3 章 · 面向意图的工程学

> 代码是 AI 的输出;**意图**才是你的上游对象。
> 意图只活在对话里就是一次性、不可验证、不可演进;
> 意图写成 spec,它才活得比任何一次对话都长。

## 凌晨两点之后的那个空文档

上一章那位工程师关掉电脑之前,做了一个决定:**先不改 prompt**。但决定只是半步,他还欠自己一个动作。

第二天早上,他没有去 chat UI 里问下一个问题。他打开公司仓库,在 `specs/auth/` 下新建了一个文件,命名 `oauth2-device-flow.spec.md`。空的。光标在第一行闪。他盯了一会儿,写下第一段:

> **意图**:当用户在受限设备(TV、CLI、嵌入式客户端)上登录时,我们希望不把 access token 粘到剪贴板上、不要求用户输入长串字符。
> **非目标**:取代现有 web redirect 流程。
> **成功判据**:用户在 TV 上完成登录的中位时间 ≤ 60 秒;登录失败率 ≤ 现有 web flow 的 1.2 倍;不引入新的 PII 日志字段。

然后一件奇怪的事发生了。他**删掉了一行**。原来他写的是 "让用户愉悦"。这一行在他自己眼里可读,在一个 agent 眼里是空的 —— "愉悦" 没有判据。他换成了"中位时间 ≤ 60 秒"。**同一句话的前后两版,差别不是文采,是能不能被下一次 agent run 拿去验证**。

这个新文档不是给人类产品经理看的。它是给 agent 看的。它会被放进 `AGENTS.md` 指向的目录里,下一次有 agent 来改这段代码,它会被自动注入 context,每一次生成的代码都会被"成功判据"那三行做 gating。十轮对话之后,下个同事接手这段工作,他不用听昨晚两小时的口头讨论 —— **他只要 `git log` 这个 spec 文件**。

这位工程师没有写代码。他在做一件上游的事。这件事叫 **面向意图的工程**。

## §3.1 1M LOC 的真正工作

把镜头从他的办公桌推远到半个地球外。2026 年 2 月,OpenAI Frontier Team 的三位工程师在 Latent Space 披露了一个数字:过去五个月,他们和 Codex 合作交付了**约一百万行代码、约一千五百个 merged PR,人类没有写一行代码,甚至 0% human review** [[openai-harness-engineering]]。平均到人是 3.5 PR / 工程师 / 天。

大多数读者看到这组数字的第一反应是 "模型真的很强"。但 Ryan Lopopolo 在采访里说的下一句才是关键:

> *Designing environments, specifying intent, and building feedback loops —— that's where the work went.*

三位工程师用五个月做的事,**不是"写代码" 的替代品**。它是一件**从来就不是写代码**的事 —— 设计环境、**指定意图**、构建反馈闭环。再说一遍那位凌晨两点的工程师第二天早上做的事情:他没有写 200 行 OAuth2 代码,他写了一份 `specs/auth/oauth2-device-flow.spec.md`。动作在同一条轴线上,只是尺度不同。

如果你仍然觉得"写 spec 不算工程师的工作",请注意这件事在 OpenAI 那边对应的**不是理念,是 1M 行代码**。这是 Ch 2 那句话的另一种说法:**代码是 AI 的输出,意图才是工程师的上游对象**。

## §3.2 工程师的上游对象,一直在往上走

这件事放进四十年的时间线,就显出结构:

| 年代 | 工程师的上游对象 | 下游是什么 |
|---|---|---|
| 1980s | **算法** | 具体语言实现(汇编 / C / Pascal) |
| 1990s–2010s | **API / 框架** | 业务逻辑粘合(调 SDK、组合中间件) |
| 2023+ | **意图** | AI 生成的代码 |

每一次演化,上游都比下游更抽象,但同时**更接近"要做什么"这件事本身**。80 年代的工程师写算法描述,汇编是实现;2000 年代的工程师写 API 调用编排,业务代码是胶水;2026 年的工程师写**意图 spec**,AI 生成的源码是副产物。

这不是"职业消失",是**工作层在移动**。

一个把自己定位在"写代码"的工程师,会觉得 AI 把自己的位置占了。但那位凌晨两点的工程师并没有那样感觉 —— 他只是发现自己的关注点从 "这 200 行代码对不对" 换成了 "这段 spec 有没有漏洞"。而且他发现后者**更费神**:AI 会忠实放大你意图里的每一丝模糊。那一丝"愉悦"被模型理解成任何东西,它都会写出看起来像样的代码;你只有在用户超时离开 TV 的时候才会知道错在哪。**在 AI 时代,意图里的每一个模糊词,都是一张延时爆炸的支票。**

把这件事翻译成一天的工作节奏:原来看的是 diff 行数,现在看的是 **spec 变更数**、**契约新增数**、**验证通过率**。这些指标不直接等价于 LOC,但它们决定 LOC 的正确性。OpenAI 那个 3.5 PR/天 的数字,读法不是 "每人写得更多了",是**每个人都在更高的抽象层工作,于是下游的代码吞吐放大了一个量级**。

有一件事值得明说。从"写代码" 到 "定义正确" 这一步,不是所有组织都同时能跨过去。**面向意图工程的前提,是组织愿意让人的工作落点在一件既不能量化为行数、也不能量化为接口数的东西上**。如果管理层还在用"这周交付了多少行" 评价工程师,团队自然会把精力留在 L1 —— 这时技术方案再对,组织激励也会把它拉回去。Ch 13 会把这件事作为组织升级的指标之一。本章只先把这个前提亮出来,后面论到 spec 严密度的时候你会更清楚为什么。

## §3.3 意图不能只活在头脑里 —— 三个结构性缺陷

工程师习惯"边聊边改"。在 chat UI 里,意图的状态大概是这样:

> "我刚才说的那个,你知道我是什么意思吧?"
> "我想要做成这样,但不要那样。"
> "等等,再改一下 —— 那个参数要用 OAuth,不要 API key。"

这样**可能**一次做对。作为工程实践,它有三个不可回避的缺陷。

**一次性**。每次对话结束,意图消失。下次对话,从零开始。你昨晚两小时的讨论,今天早上 agent 读不到。你不得不**重新复述** —— 可是你也不记得原话,只记得"大概那个意思"。复述一遍,意图就磨损一次。一个月之内,意图会被你自己的记忆稀释成面目全非。

**不可验证**。你告诉 AI "我要 OAuth",它给你 200 行代码。对不对?不读完无法判断。读完一遍,又不保证下次 AI 生成的版本仍然符合同一意图 —— **同一条口头意图,两次生成可以得到两份不同的实现**,而你无法在不读代码的前提下知道哪一份真的对齐。

**不可演进**。上周的意图 vs 本周的修订,在哪里合并?没有 diff、没有 blame、没有 review。当你三周之后想回头看 "我们当初为什么决定走 device code flow 而不是 PKCE",你会发现证据只剩一个 Slack 频道和一串 thread —— 而且每一条后面没有时间戳。

这三个缺陷的**共同根因**只有一件事:意图没有**可持久化的形式**。它活在人的头脑里,活在对话的字节流里,活在 Slack 某条记录里 —— 但不活在一个**带版本、可 diff、可签字、可被 agent 每一步都读到**的地方。

解法只有一个:**把意图写成 spec**。Spec 是意图的可持久化形式;一旦写成 spec,它可以被 git diff、被 code review、被合规官签字,活得比任何一次对话都长。

这就是 OpenAI 工程师说的 *specifying intent* 真正的意思 —— 不是"把你想要的讲清楚",是**把你想要的写进一个持久化物件**。

## §3.4 Spec 的三个严密度层次 —— 嵌套而非替代

读者到这里通常会问一个现实问题:**写 spec 写到什么程度?** 写得过严,人力跟不上;写得过松,等于没写。

本书的回答是:spec 有**三层严密度,嵌套而非替代**。

| 层次 | 形式 | 人类可读 | 可机器验证 | 适用 |
|---|---|---|---|---|
| **L1 · 非结构化 prompt** | 自然语言 system / user prompt | 高 | 否 | 探索性、低风险、一次性 |
| **L2 · 半结构化 BDD scenario** | `Given / When / Then` (Gherkin / Cucumber) | 中 | **是**(可跑成 scenario 测试) | 业务流程、验收标准 |
| **L3 · 函数级契约(Design by Contract)** | `requires` / `ensures` / `old(…)` | 低(但精确) | **是**(property test 天然入口) | 核心业务规则、合规关键路径 |

三层的关系不是"三选一"。L1 人类读得懂、AI 能完成、但不可机器验证;L2 引入 Given/When/Then 语义,每条场景可以跑成自动测试,但仍允许自然语言描述行为;L3 是 Bertrand Meyer 1986 年 *Design by Contract* 的当代回归 —— 前置条件、后置条件、不变式,精确到可被 Creusot / Prusti / Kani 这类 Rust 形式化验证工具检查。

**不同 feature 应该停在不同层**。登录页的 CSS 色值,L1 就够;支付扣款的幂等性,必须走到 L3。判据很简单:**如果这个意图出错会造成不可逆损失,至少走到 L2;如果会造成合规事故,必须走到 L3**。那位凌晨两点的工程师的 oauth2-device-flow.spec.md,在"成功判据"那三行用的是一种轻量 L2 —— 不完全 Gherkin 语法,但每一行都是可跑成 scenario 测试的断言。他给 "登录按钮的文案" 只写了 L1 的一行备注:"跟现有 web flow 保持一致"。同一份 spec 里,不同条款在不同层,这是**正常**的。

一条 L2 BDD scenario 长什么样?以支付为例:

```gherkin
Scenario: 重复提交订单只扣一次款
  Given 用户 U 的余额为 ¥1000
  And 订单 O 的金额为 ¥100
  When 用户 U 同一 idempotency-key 重复提交订单 O 两次
  Then 用户 U 的余额为 ¥900
  And 扣款事件只被记录 1 次
```

这段 scenario 的价值不在于"更像英文",在于**每一行都能跑成自动测试**。`Given` 建立前置状态,`When` 触发动作,`Then` 是验证断言。人类 reviewer 看得懂,合规官看得懂,agent 也看得懂;CI 跑它的时候,agent 的代码只要违反"扣款事件只被记录 1 次"就会当场失败。L2 不像 L3 那样精确到每一种 off-by-one,但它把业务流程的成功/失败边界**用机器可执行的形式写下来** —— 这是 spec 进入 harness 的最务实的第一步。

### 一个被低估的组合:`#[contract] + property-based testing`

在 AI 生成代码成为主力的时代,**L3 契约 + property-based testing 是代码审计的结构性甜点**。

为什么甜?因为它把"验证"的负担从人类评审员**转嫁**给了机器 —— 契约定义"正确"的含义,property test 生成随机化的 128 / 256 / 1024 个用例去打;任何违反契约的 AI 代码会在测试阶段被自动抓住,不需要人读每一行。

用 Rust 形式化验证生态里最小化的一个例子:

```rust
// L3 · 契约:意图以 requires / ensures 显式声明
#[requires(amount > 0)]
#[requires(account.balance >= amount)]
#[ensures(result == old(account.balance) - amount)]
#[ensures(account.balance == result)]
fn withdraw(account: &mut Account, amount: u64) -> u64 {
    account.balance -= amount;
    account.balance
}

// property test:让机器生成 128 个随机输入,检验契约
#[quickcheck]
fn withdraw_preserves_invariants(mut acc: Account, amt: u64) -> bool {
    if amt == 0 || acc.balance < amt { return true; }  // 前置条件不满足,跳过
    let before = acc.balance;
    let after = withdraw(&mut acc, amt);
    after == before - amt && acc.balance == after
}
```

几件事值得注意。`requires` 是前置条件,`ensures` 是后置条件,`old(…)` 捕获调用前的状态 —— 这三件东西一起把"意图" 变成机器可验证的断言。property test 自动生成输入,不需要你列举 edge case。AI 生成的 `withdraw` 实现如果有偏差,这一对契约 + test 会在 CI 阶段抓到。

这不再是"人读代码"式的审查,这是**契约读代码**式的自动 gating。

换个角度看这件事就更清楚。手工写代码的时代,property testing 是个"值得用但经常不用"的工具 —— 写契约很烦,人类评审员粗看就能发现大部分问题。AI 生成代码的时代,情况翻转:生成速度上去了,**人类粗看跟不上**;契约写一次,可以挡住 AI 在同一函数上的一千次迭代。代价(写契约一次)和收益(挡一千次 AI 偏差)的比值彻底倒过来。这件事和 [[concept-evaluation-harness]] 衔接上了 —— evaluation harness 的三层评估(unit / trace / outcome)里,L3 契约属于 unit 评估的一部分,把"正确性" 从 vibes check 升级为可复现的机器断言。

## §3.5 AI 不知道它不知道什么

Spec 严密度讲完,还有一个最隐蔽的意图问题:**组织里的隐性知识,既不在模型的训练数据里,也不在任何一次 prompt 里**。模型不知道这些约束存在,也不知道自己不知道。

四类具体例子,这是那位凌晨两点的工程师第二天早上写 spec 时,必须一条条往里填的东西:

- **合规约束** —— GDPR 要求某类用户数据必须二次确认。模型不知道"必须",除非你写下来。
- **历史事故** —— 上周修过一次 SQL 注入,模式 X 被明确封掉。模型不知道有过这件事。
- **隐性依赖** —— 模块 A 必须在模块 B 初始化之后启动,因为历史上有过 race condition。模型不知道这个顺序是约束,会当作"一般情况"。
- **组织偏好** —— 团队决定不用某一类抽象(如过度 ORM 化),因为上季度被坑过。这是价值判断,不是通用共识。

这些隐性知识的共同特征:**它们是组织的历史积累,不是公共知识**。模型变强不会让它"猜出" 这些。唯一的解法是**spec 化** —— 把隐性知识变成可被 harness 读到、可被 agent 每一步都对齐的显性约束。[[fowler-on-harness]] 的 **guides(feedforward)+ sensors(feedback)** 两类控制,正是这种显性化的具体形态:guides 是"这是组织的历史约束,请一直遵守",sensors 是"如果你没遵守,这里有个 check 会告诉你"。

OpenAI 工程团队写的 **AGENTS.md** 模式([[openai-harness-engineering]])是最清晰的工具层落地。AGENTS.md 不是"写给 agent 看的大百科",它是**一张指向组织内深层知识库的目录**。它被注入 agent 的每一次调用里;agent 需要细节时,沿着目录去找 `docs/` 下的具体条目。这种 "principles always in scope, details pulled on demand" 的设计,把隐性约束和具体规则分开存:约束永远在场,细节按需检索。

反模式也值得一提:**把整个风格指南、架构文档、API 参考塞进 system prompt**。这个做法常见但糟糕 —— context 涨得飞快、token 烧得飞快,而且它教会 agent "context 是谁当年写过的东西,不是现在相关的东西"。Ch 7 讲 harness 调度时会把这件事讲得更细,这里只标一下方向。

至于"怎么发现团队有哪些隐性约束"—— 最有效的启发式只有一句:**把上一年所有的事故复盘翻出来,每一条的根因几乎都是没被 spec 化的隐性约束**。事故复盘是隐性知识最密集的矿脉。如果复盘完把教训挂回 spec,下一次 AI 生成代码就会被强制对齐;如果复盘只写成一份"吸取教训"的 doc 归档,下一次 AI 仍然会踩同一个坑。本书 Ch 13 会专门设 "失败模式博物馆"—— 博物馆化不是"显示我们多惨",是**把付过代价的教训变成 spec 层的永久资产**。

你此刻读到这里不妨停一下,问自己:上个季度你们团队复盘过的最深的那次事故,根因有没有进 spec?如果没有,今晚睡前的第一件事,就该是把它写进去。

## §3.6 意图 → Spec → Harness 的完整闭环

把前面五节合起来,就得到本书方法论的主轴:

> **意图**(我要什么)
> &nbsp;&nbsp;&nbsp;&nbsp;↓(通过 spec 化持久化)
> **Spec**(意图的可验证、可演进、可持久形式)
> &nbsp;&nbsp;&nbsp;&nbsp;↓(通过 harness 在 agent 生命周期里在场)
> **Harness**(让 spec 在 agent 每一步都被读到、被对齐、被审计的基础设施)

三者的关系是**依赖**,不是并列。没有明确意图,spec 就是样板文档;没有 spec,harness 只能用临时 prompt 做规训,不可持久;没有 harness,spec 写得再细也只活在文档库里不进 agent 的工作流。三者缺一不可。

这条闭环在两层上都成立,但**粒度不同**。

在 Layer 1(AI Coding 过程),spec 就是 `AGENTS.md` + `docs/` + BDD scenarios + 契约测试。那位凌晨两点的工程师写的 oauth2-device-flow.spec.md,走的就是这条路径。

在 Layer 2(AI Agent 自身),spec 是另一套东西:session schema、tool permission matrix、verification contract、sandbox boundary policy。agent 产品的合规官签的是这些,不是业务代码。但**它们在意图 → spec → harness 这条链上的位置,和 Layer 1 的 AGENTS.md 一样** —— 都是让 agent 的每一步都能对齐某一条"这件事必须这样做" 的约束。

本书 Part B 的**四根支柱** —— session / harness / tools / verification —— 每一根都是 Layer 2 上的"spec 在 agent 某个生命周期时刻真的在场"。第 6 章讲 session,就是让 spec 描述的 "之前发生过什么" 能被 agent 事后重读;第 7 章讲 harness,就是让 spec 描述的 "下一步该怎么做" 能被 agent 调度消费;第 8 章讲 tools,就是让 spec 描述的 "哪些动作被允许、哪些被审计" 能被具体 tool call 兑现;第 9 章讲 verification,就是让 spec 描述的 "什么叫正确" 被一个独立于生成者的验证层检查。

闭环里最容易被忽略的是 **agent 每一步都能读到 spec** 这一点。一个 spec 如果只在 feature 启动会议上被读过一次、之后存进了 wiki 永不回看,**它本质上没有进入 harness** —— 等同于不存在。

真正进入 harness 的 spec 必须满足一件事:**agent 每次要做决定时,harness 能自动把相关 spec 段落注入它的视野**。这是 harness 的职责,不是 agent 的职责 —— agent 不应该 "记得去查",harness 应该 "主动送到"。OpenAI 的 AGENTS.md + docs/ 模式是这种"主动送到" 的具体形态;你团队的版本可能是 retrieval 管线加结构化 context packer。形式可以不同,但**"spec 必须进 harness" 这件事不可商量**。

再补一刀:spec 到 harness 的自动送达,还要求 spec **本身是可检索的结构化形式**。一份 40 页 PDF 的合规文档,技术上是 spec,但它无法被 harness 在 "agent 要扣款时自动注入"。同一份文档如果拆成若干条带标签、带触发条件的小段(例如 "action=扣款 AND amount > ¥10,000 → 必须二次确认"),harness 就可以在对应时刻精准送达。spec 的**结构化程度直接决定它在 harness 里的可用性**;这也是为什么 §3.4 的 L2 和 L3 比 L1 更受偏好 —— 不是因为更"严谨",是因为**更可被结构化使用**。

## §3.7 一个反向判别:你是否真的在做面向意图

如果你想快速判断自己的团队是不是"假装在做 spec-driven development",用三问自测:

**你们的 spec 今天长什么样?能 git diff 上周的版本吗?** —— 答不出来,说明 spec 还只活在幻灯片里。

**spec 的改动,agent 的下一次执行能感知到吗?** —— 如果感知不到,spec 只是文档,不是 harness 的输入。

**不符合 spec 的 agent 输出,能被自动拒绝吗?** —— 如果不能,spec 没有强制力,L2/L3 写得再好也等于 L1。

这三问任何一个答"不能",你的"面向意图工程"就停留在口号。解法从 Part B 开始落地。

## §3.8 反模式图鉴(点到为止)

最后三类常见反模式,在本章结束前命名一下,以免后续章节反复回到同一个问题:

- **Spec 即 PPT** —— 意图写在一张幻灯片上,会议结束没人再读;下一次迭代 agent 仍然什么都不知道。Spec 必须 git 进仓库,且有 owner。
- **Spec 即 prompt 抽屉** —— 团队有一个 "我们都在用的 prompt 合集",但没有 schema、没有版本、没有更新时间。这是 L1 的档案,不是 spec;它能帮你省一次输入,不能帮你做面向意图工程。
- **Spec 即 agent 自己写** —— agent 写完代码顺便"帮你补个 spec"。这违反后面 Ch 9 的 verification 独立性原则 —— generator 不能同时是 specifier。spec 必须由人(或另一个独立的 specifier agent)写,由 generator agent 消费;自写自用等于什么都没做。

Ch 12 会把 "自写自用" 这个反模式放大到更深的讨论 —— 当 agent 可以修改自己的 spec 时,协议边界怎么画。这里先埋下伏笔。

## 回到那位工程师

再回到那位凌晨两点、第二天早上新建空文档的工程师。

他下班之前,`oauth2-device-flow.spec.md` 已经从一行标题长到了 80 行。其中 50 行是他在 wiki 里、事故复盘里、Slack 频道里翻出来的"那些 agent 训练数据里不会有的东西":上个季度 OAuth token 泄露的根因、合规对 device code 长度的硬性要求、iOS TV 客户端和 Samsung TV 客户端的不同限制。另外 30 行是 `Given / When / Then` 写成的三条核心场景,外加两条 property test 级别的不变式(`用同一 device code 两次换 token,只能成功一次`)。

他这天没有写一行可执行代码。但他做的事,下一次 agent 来改这段代码的时候会替他说话 —— **说一百遍、一千遍,每一次 agent 要做决定的时候都说一遍**。

这是"面向意图" 在一个工程师身上的具体样子。他把一个原本凌晨两点才想清楚的东西,变成了一份每一次 agent run 都会读到的文件。

---

## 可观察信号

- 你们团队的意图表达,目前主要在哪一层?(L1 prompt / L2 BDD / L3 DbC 契约)
- 意图被修订时,追溯成本高还是低?能找到是谁、什么时候、为什么改的吗?
- 新员工入职,能否从 spec 读出 agent 的约束,还是必须靠口耳相传?

---

## 本章核心论断

1. 面向意图工程的第一性原理是:**代码是 AI 的输出,意图才是工程师的上游对象**。
2. 意图只活在对话里就必然**一次性、不可验证、不可演进** —— 三个结构性缺陷。
3. **Spec 有三层严密度:L1 prompt / L2 BDD / L3 DbC 契约**,嵌套而非替代;不同 feature 停在不同层。
4. **L3 契约 + property-based testing 是 AI 代码审计的结构性甜点** —— 把验证负担从人脑转嫁到机器。
5. AI 不知道它不知道什么 —— **隐性知识必须 spec 化**,否则模型再强也会漏。
6. **意图 → spec → harness** 是本书方法论的完整闭环;闭环在 Layer 1 和 Layer 2 上都成立,但粒度不同。

---

## 本章奠基文对齐

- [[openai-harness-engineering]] —— *"designing environments, specifying intent, and building feedback loops"* 原句出处;1M LOC / 1,500 PR / 0 human code 实证。
- [[anthropic-harness-design]] —— planner 作为 intent formalizer 的具体工程形态(四小时 coding 任务的三 agent 架构)。
- [[fowler-on-harness]] —— computational vs inferential controls 的两分;guides + sensors 作为意图显性化的两种手段。
- Bertrand Meyer, *Object-Oriented Software Construction: Design by Contract* (Prentice-Hall, 1988)。
- Creusot / Prusti / Kani —— Rust 形式化验证谱系,L3 契约当代落地。

## 本章对应 wiki 页

- [[concept-harness]] · [[concept-tool-vocabulary]] · [[concept-evaluation-harness]]

---

**第 3 章建立了本书的第一性原理:面向意图**。坐标系是 Ch 1 + Ch 2 的事,方法论的主轴是 Ch 3 的事,剩下要做的是把这根主轴放进**更大的历史语境里**:为什么"围绕一个强核心搭稳定抽象层" 是每一次技术飞跃都反复出现的结构,LLM 时代的驾驭工程是这个结构的最新一环 —— 不是空降的新词。下一章的回答会从四十年前的一段 Unix 历史开始。
