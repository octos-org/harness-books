# 2. The maturity gap: genius moments vs factory output

The “灵光一闪的天才” mode has these traits:

- success is prompt-dependent and non-repeatable
- status comes from chat text, not durable runtime state
- artifacts are guessed from file names or heuristics
- long jobs can silently fail but still look “done”
- session switching causes state bleed and UI confusion

A software factory mode has opposite traits:

- contract-defined outputs and validators
- lifecycle is persisted and monotonic (`queued -> running -> verifying -> ready|failed`)
- progress is evented, typed, replayable, and scoped
- UI is a projection of backend truth, not independent truth
- every incident has operator-grade evidence

Harness is the shift mechanism between those two modes.

---

### Expanded Source Material


#### From `03-intent-first-engineering.md`: 第 3 章 · 面向意图的工程学

_Source role: intent/spec/harness loop._


#### 第 3 章 · 面向意图的工程学

> 代码是 AI 的输出;**意图**才是你的上游对象。
> 意图只活在对话里就是一次性、不可验证、不可演进;
> 意图写成 spec,它才活得比任何一次对话都长。

##### 凌晨两点之后的那个空文档

上一章那位工程师关掉电脑之前,做了一个决定:**先不改 prompt**。但决定只是半步,他还欠自己一个动作。

第二天早上,他没有去 chat UI 里问下一个问题。他打开公司仓库,在 `specs/auth/` 下新建了一个文件,命名 `oauth2-device-flow.spec.md`。空的。光标在第一行闪。他盯了一会儿,写下第一段:

> **意图**:当用户在受限设备(TV、CLI、嵌入式客户端)上登录时,我们希望不把 access token 粘到剪贴板上、不要求用户输入长串字符。
> **非目标**:取代现有 web redirect 流程。
> **成功判据**:用户在 TV 上完成登录的中位时间 ≤ 60 秒;登录失败率 ≤ 现有 web flow 的 1.2 倍;不引入新的 PII 日志字段。

然后一件奇怪的事发生了。他**删掉了一行**。原来他写的是 "让用户愉悦"。这一行在他自己眼里可读,在一个 agent 眼里是空的 —— "愉悦" 没有判据。他换成了"中位时间 ≤ 60 秒"。**同一句话的前后两版,差别不是文采,是能不能被下一次 agent run 拿去验证**。

这个新文档不是给人类产品经理看的。它是给 agent 看的。它会被放进 `AGENTS.md` 指向的目录里,下一次有 agent 来改这段代码,它会被自动注入 context,每一次生成的代码都会被"成功判据"那三行做 gating。十轮对话之后,下个同事接手这段工作,他不用听昨晚两小时的口头讨论 —— **他只要 `git log` 这个 spec 文件**。

这位工程师没有写代码。他在做一件上游的事。这件事叫 **面向意图的工程**。

##### §3.1 1M LOC 的真正工作

把镜头从他的办公桌推远到半个地球外。2026 年 2 月,OpenAI Frontier Team 的三位工程师在 Latent Space 披露了一个数字:过去五个月,他们和 Codex 合作交付了**约一百万行代码、约一千五百个 merged PR,人类没有写一行代码,甚至 0% human review** [[openai-harness-engineering]]。平均到人是 3.5 PR / 工程师 / 天。

大多数读者看到这组数字的第一反应是 "模型真的很强"。但 Ryan Lopopolo 在采访里说的下一句才是关键:

> *Designing environments, specifying intent, and building feedback loops —— that's where the work went.*

三位工程师用五个月做的事,**不是"写代码" 的替代品**。它是一件**从来就不是写代码**的事 —— 设计环境、**指定意图**、构建反馈闭环。再说一遍那位凌晨两点的工程师第二天早上做的事情:他没有写 200 行 OAuth2 代码,他写了一份 `specs/auth/oauth2-device-flow.spec.md`。动作在同一条轴线上,只是尺度不同。

如果你仍然觉得"写 spec 不算工程师的工作",请注意这件事在 OpenAI 那边对应的**不是理念,是 1M 行代码**。这是 Ch 2 那句话的另一种说法:**代码是 AI 的输出,意图才是工程师的上游对象**。

##### §3.2 工程师的上游对象,一直在往上走

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

##### §3.3 意图不能只活在头脑里 —— 三个结构性缺陷

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

##### §3.4 Spec 的三个严密度层次 —— 嵌套而非替代

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

###### 一个被低估的组合:`#[contract] + property-based testing`

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

##### §3.5 AI 不知道它不知道什么

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

##### §3.6 意图 → Spec → Harness 的完整闭环

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

##### §3.7 一个反向判别:你是否真的在做面向意图

如果你想快速判断自己的团队是不是"假装在做 spec-driven development",用三问自测:

**你们的 spec 今天长什么样?能 git diff 上周的版本吗?** —— 答不出来,说明 spec 还只活在幻灯片里。

**spec 的改动,agent 的下一次执行能感知到吗?** —— 如果感知不到,spec 只是文档,不是 harness 的输入。

**不符合 spec 的 agent 输出,能被自动拒绝吗?** —— 如果不能,spec 没有强制力,L2/L3 写得再好也等于 L1。

这三问任何一个答"不能",你的"面向意图工程"就停留在口号。解法从 Part B 开始落地。

##### §3.8 反模式图鉴(点到为止)

最后三类常见反模式,在本章结束前命名一下,以免后续章节反复回到同一个问题:

- **Spec 即 PPT** —— 意图写在一张幻灯片上,会议结束没人再读;下一次迭代 agent 仍然什么都不知道。Spec 必须 git 进仓库,且有 owner。
- **Spec 即 prompt 抽屉** —— 团队有一个 "我们都在用的 prompt 合集",但没有 schema、没有版本、没有更新时间。这是 L1 的档案,不是 spec;它能帮你省一次输入,不能帮你做面向意图工程。
- **Spec 即 agent 自己写** —— agent 写完代码顺便"帮你补个 spec"。这违反后面 Ch 9 的 verification 独立性原则 —— generator 不能同时是 specifier。spec 必须由人(或另一个独立的 specifier agent)写,由 generator agent 消费;自写自用等于什么都没做。

Ch 12 会把 "自写自用" 这个反模式放大到更深的讨论 —— 当 agent 可以修改自己的 spec 时,协议边界怎么画。这里先埋下伏笔。

##### 回到那位工程师

再回到那位凌晨两点、第二天早上新建空文档的工程师。

他下班之前,`oauth2-device-flow.spec.md` 已经从一行标题长到了 80 行。其中 50 行是他在 wiki 里、事故复盘里、Slack 频道里翻出来的"那些 agent 训练数据里不会有的东西":上个季度 OAuth token 泄露的根因、合规对 device code 长度的硬性要求、iOS TV 客户端和 Samsung TV 客户端的不同限制。另外 30 行是 `Given / When / Then` 写成的三条核心场景,外加两条 property test 级别的不变式(`用同一 device code 两次换 token,只能成功一次`)。

他这天没有写一行可执行代码。但他做的事,下一次 agent 来改这段代码的时候会替他说话 —— **说一百遍、一千遍,每一次 agent 要做决定的时候都说一遍**。

这是"面向意图" 在一个工程师身上的具体样子。他把一个原本凌晨两点才想清楚的东西,变成了一份每一次 agent run 都会读到的文件。

---

##### 可观察信号

- 你们团队的意图表达,目前主要在哪一层?(L1 prompt / L2 BDD / L3 DbC 契约)
- 意图被修订时,追溯成本高还是低?能找到是谁、什么时候、为什么改的吗?
- 新员工入职,能否从 spec 读出 agent 的约束,还是必须靠口耳相传?

---

##### 本章核心论断

1. 面向意图工程的第一性原理是:**代码是 AI 的输出,意图才是工程师的上游对象**。
2. 意图只活在对话里就必然**一次性、不可验证、不可演进** —— 三个结构性缺陷。
3. **Spec 有三层严密度:L1 prompt / L2 BDD / L3 DbC 契约**,嵌套而非替代;不同 feature 停在不同层。
4. **L3 契约 + property-based testing 是 AI 代码审计的结构性甜点** —— 把验证负担从人脑转嫁到机器。
5. AI 不知道它不知道什么 —— **隐性知识必须 spec 化**,否则模型再强也会漏。
6. **意图 → spec → harness** 是本书方法论的完整闭环;闭环在 Layer 1 和 Layer 2 上都成立,但粒度不同。

---

##### 本章奠基文对齐

- [[openai-harness-engineering]] —— *"designing environments, specifying intent, and building feedback loops"* 原句出处;1M LOC / 1,500 PR / 0 human code 实证。
- [[anthropic-harness-design]] —— planner 作为 intent formalizer 的具体工程形态(四小时 coding 任务的三 agent 架构)。
- [[fowler-on-harness]] —— computational vs inferential controls 的两分;guides + sensors 作为意图显性化的两种手段。
- Bertrand Meyer, *Object-Oriented Software Construction: Design by Contract* (Prentice-Hall, 1988)。
- Creusot / Prusti / Kani —— Rust 形式化验证谱系,L3 契约当代落地。

##### 本章对应 wiki 页

- [[concept-harness]] · [[concept-tool-vocabulary]] · [[concept-evaluation-harness]]

---

**第 3 章建立了本书的第一性原理:面向意图**。坐标系是 Ch 1 + Ch 2 的事,方法论的主轴是 Ch 3 的事,剩下要做的是把这根主轴放进**更大的历史语境里**:为什么"围绕一个强核心搭稳定抽象层" 是每一次技术飞跃都反复出现的结构,LLM 时代的驾驭工程是这个结构的最新一环 —— 不是空降的新词。下一章的回答会从四十年前的一段 Unix 历史开始。


#### From `05-ai-coding-harness.md`: 第 5 章 · AI 生成代码的工程谱系

_Source role: OpenAI 1M LOC case and AI coding factory mechanics._


#### 第 5 章 · AI 生成代码的工程谱系

> 如果你读到这里,你大概率是 Layer 1 的读者 —— 你的产品不是 agent,**agent 是你们产线上的工具**。这一章是你的主场;接下来四章(Part B)是 Layer 2 专场,你可以当作背景略读,或读完本章直接跳到 Part C。

##### 凌晨两点的 merge 队列

凌晨两点,某基础设施团队的三位工程师面前是一块白板,白板上写着一个数字:**1,506**。这是过去 24 小时 Codex 在他们仓库开出来、还没合的 PR 数量。他们三人此刻都没在写应用代码 —— 更准确的说法是,他们的**整个岗位**已经不是"写应用代码"了。

他们在做三件事。第一位工程师盯着 CI 面板的红条 —— 架构约束 lint 失败:一批 PR 试图从 `payments/` 直接 import `audit-log/` 的内部类型,违反了三个月前"审计层只暴露 trait" 的约定。她在想是否把这条规则从 warning 提到 error;提上去,这 47 个 PR 下一轮 CI 会被一次性挡下,不需要任何人去看。第二位工程师在改 `AGENTS.md`:他刚发现一批 PR 都在重新发明日期解析,因为 `AGENTS.md` 里没有指向 `docs/datetime-conventions.md` 的那行链接。第三位工程师在和一个 property test 的失败记录较劲 —— Codex 写的一段去重逻辑在 256 个随机输入里有 3 个触发重复写入,他正把失败输入序列化进 `tests/regression/` 作为回归锚点。

三位工程师那晚没在写应用功能。但**应用功能正以每天 3.5 个 PR / 人的节奏合进 main**。他们做的工作的**对象**变了 —— 从"代码"变成了"让代码能自动被产出、自动被验证、自动被拒绝的那套条件"。

这一章讲的就是这套条件。它不是新学科,是软件工程这门老学科面对 AI 大量生成代码这个新输入的一次重校准。本章的单一问题 —— Ch 1 两层分界里 Layer 1 的那个问题 —— 是:**在 AI 大量生成代码的时代,怎么确保交付的工程质量**?答案的骨头,在一份 OpenAI 2026 年 2 月发表的工程博客里。

##### 1M LOC 背后的五件工程事实

OpenAI Codex 团队 2025 年 8 月第一次提交,到 2026 年 2 月,五个月的时间窗口里,**三位工程师 · 1500+ PR · 约 1M LOC · 人类写的代码 0 行 · 每天约 10 亿 token 的 agent loop 消耗**。Ryan Lopopolo 在 Latent Space 播客上把这四个数字打包讲出来,配了一句话比任何宣传文案都准确:*"Extreme Harness Engineering for Token Billionaires: 1M LOC, 1B toks/day, 0% human code, 0% human review."*(见 [[openai-harness-engineering]])

这句话容易被读成"模型终于变强了",那不是重点。重点是另一个:**在这个规模上,能让 agent 可靠产出代码的那套脚手架,已经和 agent 本身一样是工程对象**。拆开看,那套脚手架由五件具体的工程事实组成,每一件都不是 prompt 层能触达的。

**一、可复现的开发环境是地基**。Codex 在依赖锁到字节级、测试结果两次运行必须位等的环境里工作 —— 否则反馈信号就是噪声。人类遇到 flaky test 会凭经验忽略,agent 不会 —— 它把 flaky 当真实信号,沿着假信号走一整晚。复现性在这里不是"卫生指标",是 agent loop 能否工作的**前置条件**。

**二、架构约束必须被 CI 强制执行**。白板前第一位工程师做的就是这件。架构纪律 —— 哪个模块能依赖哪个、哪些函数签名稳定 —— 如果只活在 `ARCHITECTURE.md` 里靠人审,一千多 PR / 天的量级下无法 scaling。办法是翻译成 linter、import 拓扑检查、公共 API diff,接到 CI 上。**agent 不会"感觉"架构味道**,它只会撞墙、看反馈、再改。没有墙,它就不会停。

**三、测试基础设施要同时快、密闭、agent 可运行**。快,是因为 agent 要求分钟级反馈;密闭,是因为测试不该触及真实网络 / 数据库 / 副作用;agent 可运行,是指测试有稳定调用接口,agent 能自己起测试、读结果、定位失败行。三条都满足,agent 能在同一个 PR 里跑几十轮试错不打扰人。这件事与评估框架(见 [[concept-evaluation-harness]])结构同构 —— 都是"让机器替人做 gate"。

**四、反馈回路的设计本身是工程对象**。PR 失败时 agent 看到什么?裸 stack trace?裁剪后的关键片段?渲染好的 UI 截图?每一个选择都会改变 agent 下一轮的行为。OpenAI 会把 CI 失败信息**重新排版**再喂给 agent —— 裁剪后的版本让 agent 更容易收敛到真因。用 Fowler 的话说(见 [[fowler-on-harness]]):*operator 的工作不是审查 agent 的输出,是迭代 harness 本身*。

**五、AGENTS.md + docs/ 的分层,是 agent 知识注入的主模式**。这条在下一节展开,因为它有一个可直接抄的结构。

五件事加起来是一份岗位说明书,上面**没有一条在讲"怎么写更好的 prompt"**;每一条都在讲"怎么设计 agent 能正确产出代码的**条件**"。这就是 Ch 2 视角位移在 Layer 1 上的具体形态:工程师的工作层**从写代码上移到设计写代码的条件**。

##### AGENTS.md 作 ToC,不是 encyclopedia

第二位工程师改的那份 `AGENTS.md`,是 Layer 1 最具代表性也最容易写错的一件制品。典型反模式:把全部风格指南、架构文档、API 手册、数据字典、on-call 流程塞进一个 50KB 的 Markdown 每次整段注入。这种写法有两个问题:token 预算炸掉、agent 学到的上下文哲学错了 —— 它会把 "context = 某个早被写下的全集" 当世界观,而不会养成 "context = 此刻与任务相关的切片" 的习惯。

正确模式是把 `AGENTS.md` 当**目录**,不当百科全书 —— **原则长驻上下文,细节按需加载**。结构大致如下:

> **仓库根目录**
> · `AGENTS.md` —— 短文档(2–5KB)。列出:仓库定位一句话、语言与工具链版本锁、工作区拓扑、五条高频违规的红线、分层规则、指向 `docs/` 里各主题的目录表
> · `AGENTS.local.md` —— 本机 / 本工作区临时覆盖,`.gitignore`
> · **`docs/`** —— 系统记录层,每个主题一篇,agent 按需检索
>   · `docs/architecture.md` —— 模块拓扑与依赖方向
>   · `docs/datetime-conventions.md` —— 日期 / 时区 / ISO 格式惯例
>   · `docs/error-taxonomy.md` —— 错误分类与重试策略
>   · `docs/observability.md` —— 日志字段、trace id 传播规则
>   · `docs/security-boundaries.md` —— 哪些值不得进日志、哪些调用必须过 sandbox
>   · `docs/testing.md` —— 测试分层、fixtures、property test 规范
> · **`tests/`** —— 用例即规约
>   · `tests/property/` —— property-based 测试套,L3 契约的运行载体
>   · `tests/regression/` —— 失败输入的档案馆(agent 的负面教材)
> · **`.github/`(或等价 CI 目录)** —— 机器层 gate
>   · `workflows/architecture-lint.yml` —— 模块依赖方向检查
>   · `workflows/public-api-diff.yml` —— 公共接口变更门禁
>   · `CODEOWNERS` —— 高风险路径人审路由

这套结构的价值在三件事。**Principles always in scope** —— `AGENTS.md` 每轮注入,必须短到 token 不炸,又要覆盖通用约束。**Details pulled when needed** —— `docs/` 按需打开,写支付模块时打开 `error-taxonomy.md`,写观测模块时打开 `observability.md`,互不干扰。**tests/ 和 .github/ 是同一套意图的机器倒影** —— `docs/` 里写的文字约束,`tests/` 和 CI 里应有对应的可执行检查。这对应 [[concept-tool-vocabulary]] 反复说的:**agent 能做什么不是靠你劝它,是靠你给它的词表和检验器同时约束出来的**。

三类常见错误各有症状。**写成百科全书** —— 高频原则被细节稀释,"agent 读过也会违反"。**只写在 `AGENTS.md` 不在 CI 上落** —— 约束变建议,"说了不要 agent 还是做了"。**只在 CI 上拦不在 `AGENTS.md` 上写** —— "95% PR 能过,但每个都要走两轮"。三类错误对应三次修整动作,不用再多。

##### Fowler 的两类控制在代码场景的落地

把那套脚手架形式化切一刀,Fowler 在 *Harness Engineering for Coding Agent Users* 里给的刀最好用(见 [[fowler-on-harness]])。他把 harness 里的"控制" 分成两类:**computational controls**(可计算控制)和 **inferential controls**(推断控制)。这是分析脊柱。

**Computational controls 确定性、便宜、快** —— linter 拦风格、type-checker 拦类型、unit test 拦行为、structural analysis 拦依赖反向。每次改动都能跑,**直接接进 agent 的 inner loop**。**Inferential controls 非确定性、慢、贵** —— AI code review 判断"是不是过度工程"、语义去重判断"这件 utility 是不是已经存在"、架构评审判断"有没有违反领域边界"。得不出干净的 true/false,只能给出带置信度的意见,**作为 outer loop 的 gate** 在 PR 合并前或周会上跑。

这一刀在 AI 生成代码场景下价值放大,因为**"代码好不好" 的评价函数不是单一维度**。后者一部分能翻译成 computational(架构约束一旦形式化就是 computational),一部分永远是 inferential 的。下表是两类控制在代码场景下的对照:

| 待检验的性质 | Computational(自动、便宜、inner loop) | Inferential(非确定、贵、outer loop gate) |
|---|---|---|
| 语法与类型 | rustc / tsc / mypy / pyright | —— |
| 风格与细节一致 | clippy / eslint / ruff / gofmt | —— |
| 单元行为 | `cargo test` / `pytest` / `go test` | —— |
| 随机化反例 | property-based test(proptest / Hypothesis / QuickCheck) | —— |
| 架构依赖方向 | `cargo-deny` / `dep-cruiser` / 自制 import-graph linter | 架构评审(human 或 LLM-as-reviewer) |
| 公共接口变更 | `cargo-semver-checks` / API diff CI 门禁 | 向后兼容性判断 · breaking 影响面评估 |
| 代码重复度 | `jscpd` / `pmd-cpd` 的表层相似度 | 语义去重("这件事已经有 utility") |
| 过度工程 | —— | LLM-as-reviewer · CODEOWNERS 资深工程师 |
| 命名与语义 | —— | 代码评审里的"起名" 讨论 |
| 业务意图对齐 | —— | PRD 对照 · scenario 评审 |

两侧都有项的行是最容易做对的。**只有 inferential 对应物**的行,是每一次能把一项从右移到左的机会。**"把一条约束从 inferential 移到 computational"** 是 harness 工程师一天的最高价值动作 —— 移过去之后,agent 的 inner loop 自己撞墙,不再需要 reviewer 复述。Fowler 援引的 Ashby's Law(调节器的多样性必须不小于被调节系统)在这里翻译成一句:**把组织约束形式化成 computational 规则的速度,决定了你们能承受的 AI 生成代码吞吐上限**。

反过来 **inferential controls 永远消不掉但可以跑得少**。把 80% 的 computable 部分搬到 CI 上,inferential 只在剩下 20% 上跑 —— 这 20% 通常是**语义判断值得花时间** 的那些。**Agent 生成代码的时代,人的工作不是消失,是更精准地集中在 inferential gate 上**。

##### MindStudio 五柱的代码落地

Fowler 的切法是分析刀,MindStudio 入门指南(见 [[mindstudio-harness]])的切法是清单刀 —— 把 harness 切成 tool orchestration / guardrails / error recovery / observability / HITL 五柱。对 Layer 1 读者,这五柱的真实价值在**每一柱都能落到仓库里的具体文件夹或 CI 规则上**。MindStudio 反复引的 LangChain 实验是:同一个模型,**只改 harness**,benchmark 从 52.8% 走到 66.5%。+13.7pp 没有发生在 prompt 或模型里 —— 全在脚手架上。

下表把五柱逐一落到 Layer 1 的物理位置上:

| MindStudio 五柱 | Layer 1 里的物理位置 | 可观察信号 |
|---|---|---|
| Tool orchestration | `AGENTS.md` 里的工具白名单 · `docs/tools/` 单篇工具说明 · `package.json` / `Cargo.toml` 的依赖清单 | agent 可调用的 util / CLI / MCP tool 列表是否成文 |
| Guardrails & 安全约束 | CI 里的 architecture lint · `security-boundaries.md` · `CODEOWNERS` 上的敏感路径 · 硬编码值 lint(secrets / tokens) | 违规 PR 能在 CI 阶段被阻断,而不是在 review 里被记起 |
| Error recovery & feedback loops | CI 的失败信息格式化 · retry 策略文档 · `tests/regression/` 的失败档案馆 · merge queue 的 re-run 策略 | agent 第二轮修错的成功率 · flaky rate |
| Observability | 结构化日志字段规约 · trace id 贯穿要求 · `observability.md` · PR 模板里的"可观察性影响" 一栏 | 事故复盘时能从日志直接定位到 agent 的哪一次 tool call |
| Human-in-the-loop | `CODEOWNERS` 高风险路径必审 · PR 模板的合规 checklist · release gate | 每周 human review 的 PR 数量 / 总 PR 数的比例能不能被组织接受 |

两张表合起来看:**Fowler 的表是"控制怎么分类",MindStudio 的表是"控制放在哪"**。前者关心分析,后者关心落地。合在一起,就是 1M LOC 背后那套脚手架的结构。

一个诚实的警告:MindStudio 的五柱在学理上**没说清楚"为什么是五"**,它把 guardrails 和 tool orchestration 当成同级,而 Fowler 的语法里 guardrails 应当是 tool 层的一个**属性**。对 Layer 1 读者这个瑕疵不伤使用 —— 作为入门清单够用;想深一层的读者可以直接用 Fowler 的两类切法去整理。

##### Spec → Property Test → Audit Trail 作为 AI 代码审计的结构性甜点

五柱和两类控制都讲完了,剩下一件事最关键:**AI 生成的代码凭什么被信?** Layer 1 的答案不是"让另一个 AI 再审一遍",是让**契约读代码**,不是让人读代码。

Ch 3 已经把上游讲透 —— 意图分三层严密度(L1 prompt / L2 BDD / L3 DbC 函数契约),L3 的现代落地是 Bertrand Meyer 1986 *Design by Contract* 在 Rust 形式化验证生态(Creusot / Prusti / Kani)里的回归(见 [[concept-evaluation-harness]])。Ch 3 的工作是**把意图送上 L3**;Ch 5 的工作是**在 AI 大量生成代码的条件下,把 L3 契约接到审计链路的下游**。

连接点是:**spec → property test → audit trail**。契约定义"正确"是什么意思;property test 生成 128 / 256 组随机输入打穿实现;audit trail 把失败输入序列化归档,作为 AI 生成代码的负面教材。下面两段代码展示两端。选的例子是**审计日志追加** —— AI 生成代码里出错频率最高、代码评审里又最不容易看出问题的一类:看上去对,但时序 / 幂等 / 单调性搞错了。

```rust
// L3 · 函数契约:append-only audit log 的四条性质
// 用 Creusot / Prusti 形式化属性声明(语法示意,具体 crate 语法各有差异)
#[requires(event.seq == old(log.last_seq()) + 1)]          // 序号必须严格递增
#[requires(event.ts >= old(log.last_ts()))]                // 时间戳单调不减
#[ensures(log.len() == old(log.len()) + 1)]                // 追加且仅追加一条
#[ensures(*log.get(log.len() - 1) == event)]               // 最后一条等于刚写入
fn append(log: &mut AuditLog, event: AuditEvent) {
    log.entries.push(event);
    log.last_seq = event.seq;
    log.last_ts = event.ts;
}
```

四条性质不多,但合起来把"审计日志" 从 AI 眼里"大约能 work 的 push" 钉成了可机器验证的断言。`requires` 是前置条件,`ensures` 是后置条件,`old(…)` 捕获调用前状态 —— 任何违反这四条的 AI 实现都会被下一步的 property test 逮出来。

```rust
// property test:让机器生成随机输入序列,检验契约永不被违反
use proptest::prelude::*;

proptest! {
    #[test]
    fn audit_log_append_preserves_monotonicity(
        events in prop::collection::vec(any::<AuditEvent>(), 0..256)
    ) {
        let mut log = AuditLog::new();
        let mut last_seq = 0u64;
        let mut last_ts = 0i64;

        for ev in events {
            // 前置条件过滤:不合法的输入不参与检验
            prop_assume!(ev.seq == last_seq + 1);
            prop_assume!(ev.ts >= last_ts);

            let len_before = log.len();
            append(&mut log, ev.clone());

            // 四条不变式一次性验证
            prop_assert_eq!(log.len(), len_before + 1);
            prop_assert_eq!(log.get(log.len() - 1).cloned(), Some(ev.clone()));
            last_seq = ev.seq;
            last_ts = ev.ts;
        }
    }
}
```

proptest 每次 CI 跑时生成 256 条随机事件序列,任何让契约翻车的序列都会被自动缩小(shrink)成最小反例,序列化到 `proptest-regressions/` 文件夹里。**那个文件夹就是 audit trail 的起点** —— 失败输入的档案馆,AI 生成代码在这个函数上**所有翻过的车**的物证。下一次 CI 重跑时,proptest 先跑档案馆里的用例,再跑新随机输入;**任何历史上翻过的车永远不会再翻第二次**。

这条链路的意义不是"多一层检查",是**检查的语法变了**。手写时代 property test 是"值得用但经常不用" 的工具,因为人有直觉兜底;AI 生成代码时代它是必选项 —— AI 的"直觉" 是训练语料的统计偏好,不是你这个仓库的 invariants。**让契约读代码**把审查负担从人眼转嫁到机器,这就是 Layer 1 在 AI 时代的结构性甜点。

一个限制要明说:L3 契约不是 AI 代码的全部审计。它覆盖"单个函数行为正确吗",不直接覆盖"函数放在这个模块对吗"、"API 设计对吗"、"改动有没有违背产品意图"。后者仍需要 inferential controls —— 前一节 Fowler 表格的右列。**L3 + property test 是审计地基,inferential review 是审计屋顶**,两者都不可省。

##### "0% human review" 的真实边界

"0% human review" 是 1M LOC 故事里最煽动、也最容易被断章取义的一块。工程 lead 要问的第一件事不是"太厉害了",是:**它在什么条件下成立,在什么条件下不成立**?

条件成立的场景,是 OpenAI 自己内部的 Codex 工具链 —— 一个**内部仓库 · 非合规关键路径 · 风险自吸收**的环境。内部仓库意味着没有外部客户数据面、没有 SLA 合约;非合规关键路径意味着出错不触发监管事故;风险自吸收意味着 bug 的代价由 OpenAI 自己承担,没有第三方受害者向法律体系主张权利。三条都成立时,"computational + property test + inferential gate 构成完整 gating,省掉每条 PR 的 human review" 是可以做的工程选择,那次选择的产出(1M LOC, 3.5 PR / eng / day)是真实的。

**三条前提任何一条不成立,"0% human review" 立刻失效**。有三类场景必须明确列出 opt-out:

**第一类,医疗 SaMD(Software as a Medical Device)**。代码进入诊断、治疗、患者监护路径,FDA 21 CFR Part 820 与 IEC 62304 对变更控制、设计评审、可追溯性有具体要求 —— 关键路径代码变更必须有**签名的人类评审记录**。AI 生成的代码在 CI 上全绿,也不能省掉 named human reviewer 的签字。EU MDR 对 SaMD 的分级评审同理。这里"0% human review" 不是工程问题,是合规事实。

**第二类,金融与 SEC / 等价监管**。支付清算、风控决策、交易撮合、反洗钱路径,代码变更按 SOX 404 要求必须有双人评审与变更批准记录;SEC 新近的 AI 披露倾向还可能要求披露"AI 介入生成的代码比例"。可以让 AI 写测试、写 boilerplate,但**核心金融逻辑的变更评审权不能交给机器**。

**第三类,个人隐私与 GDPR / CCPA / 中国 PIPL**。处理个人身份信息、健康信息、金融信息的数据流代码,GDPR 下变更影响 Data Protection Impact Assessment(DPIA)时,必须经过 DPO 的 review 记录。**DPIA-affecting 的部分,merge 前人类签字不能省**。PIPL 对关键信息基础设施运营者要求更严。

三类加起来覆盖了大多数企业级仓库至少 20%–40% 的路径。结论要写进团队手册:**"0% human review" 是有边界条件的工程选择,不是普世目标**。

##### Stanford Meta-Harness 在 coding 侧的含义

Layer 1 的终极想象是"把手工 harness 也自动搜出来",证据在 Stanford IRIS Lab 2026 年的 *End-to-End Optimization of Model Harnesses*(见 [[stanford-meta-harness]])。它把"设计 harness" 交给 outer-loop agent 去搜 —— proposer 读历史候选 harness 的源码、分数、trace,提议新变体,评分、保留、淘汰、再提议。Paper 实测:分类任务 +7.7 pts、数学推理 +4.7 pts、同分下 context token −75%,**TerminalBench-2 超越手工构造 harness**(具体增量以原始论文为准)。TerminalBench-2 是 coding 侧最接近实务的 benchmark —— 自动搜出来的跑赢人手工调的,这是 Layer 1 自动化极限的一块实证。

Layer 1 读者会问一个锋利的问题:**既然自动搜出来的都能跑赢手工,那"工程师的工作上移到设计 harness" 还有意义吗**?

答案分两半。**第一半**:Stanford meta-harness 自动化的是**稳定接口之下**的实现 —— retry 策略、tool 选择启发式、memory 压缩规则、plan 分解模板。这些是代码,是 proposer 能读写的对象。但在它之上有一样东西不在自动化范围内:**目标函数是谁定的、评估语义是谁写的、哪个接口被认为是 load-bearing 的**。三件事都还是人的工作。Paper 也认了这件事 —— outer-loop 的前提是评估函数可信,否则优化会收敛到噪声上([[concept-evaluation-harness]] 里的原话:meta-harness 的前提是评估框架本身可信)。

**第二半在 Ch 13 展开**:反脆弱的第四支柱 —— "什么叫做好" 永远由人定 —— 在 coding 场景下的具体形态就是这个答案。Stanford meta-harness 把 Layer 1 工程师从"写 harness 的每一行代码" 里解放出来,但没有从"定义 objective、哪些接口值得长期稳定、哪些 invariants 不可让渡" 里解放出来。**工作层继续往上移,不是消失**。从"写代码" 到"写 harness" 到"定义 objective 与接口",每一次上移都把人类判断推向更低频率、更高杠杆的位置。

##### 回到那三位工程师

白板前那三位工程师,凌晨三点做完了当晚的工作。第一位把那条架构约束从 warning 提到 error,47 个 PR 在下一次 CI 时被一次性挡下,她当晚不再看它们。第二位在 `AGENTS.md` 里加上指向 `docs/datetime-conventions.md` 的那行链接 —— 下一批 Codex PR 的日期处理会自动收敛。第三位把 3 个 property test 失败输入序列化进 `tests/regression/proptest-regressions/audit-log.txt` —— 这个文件下周被 proptest 自动先跑,历史翻过的车永远不会再翻第二次。

他们那晚没审一条 PR。但他们完成的三件事每一件都**把未来几周几百条 PR 的审查**从 inferential controls 移到了 computational controls。这就是 Layer 1 harness 工程师的一天 —— 不是更高明的 prompt 技巧,是**把组织隐性知识 spec 化、把验证从 PR 级挪到 CI 级、把工作层从"写代码"上移到"设计 AI 能产出正确代码的条件"**。

下一章(Ch 6)翻进 Layer 2。如果你的产品不是 agent,Part B 可作为背景略读,读完可跳到 Part C;如果你的产品是 agent,Part B 四章(session / harness / tools / verification)是你的主场。两层工程纪律在名词上相似,在问题上不同 —— Ch 1 已钉过,这里重复是为了提醒:**Layer 1 做好了,不等于 Layer 2 就省了**。

---

##### 可观察信号(自测三问)

- 你们仓库里,**最近一条架构约束从 warning 提到 error** 是什么时候的事?如果答不上来,意味着 Fowler 意义上的 computational controls 没有在持续扩张 —— 你们的 inferential 负担在默默堆积。
- 打开 `AGENTS.md`,它是**不到 5KB 的目录**,还是**几十 KB 的百科全书**?如果是后者,token 预算在每次对话里被稀释,agent 在学习一种错误的 context 哲学。
- 上周你们仓库合进 main 的 PR 里,有多少条是 **agent 直接开出、人只在 CI gate 上把关、没有 line-by-line human read** 的?这个比例决定了你们在 Layer 1 harness 成熟度上站在哪。

---

##### 本章核心论断

1. **Layer 1 的驾驭工程 = 把软件工程的老学科,针对 AI 生成代码这个新输入重新校准**。核心动作是把组织隐性知识 spec 化、把验证从 PR 级挪到 CI 级、把工作层从写代码上移到设计写代码的条件。
2. **1M LOC 背后不是"模型变强",是五件具体工程事实**:可复现开发环境、CI 强制架构约束、密闭快测试基础设施、精细反馈回路、AGENTS.md + docs/ 分层注入。缺一不可。
3. **AGENTS.md 是 ToC,不是 encyclopedia**。principles always in scope,details pulled when needed;`docs/` 作系统记录,`tests/` 和 CI 是同一套意图的机器倒影。
4. **Fowler 两类控制(computational / inferential)是 harness 设计的分析脊柱**。工程师一天最高价值的动作,是把一条约束从 inferential 移到 computational,让 agent 自己撞到墙上。
5. **L3 契约 + property test 是 AI 代码审计的结构性甜点**(与 Ch 3 互为上下游):契约定义正确、property test 打穿实现、regression 文件是失败档案馆。审查的语法从"人读代码" 变成"契约读代码"。
6. **"0% human review" 有边界条件**。内部仓库 / 非合规关键路径 / 风险自吸收三条成立才能用。医疗(FDA SaMD / IEC 62304)、金融(SOX / SEC)、隐私(GDPR DPIA / PIPL)三类场景下,named human reviewer 签字是合规事实,不是可选项。
7. **Stanford Meta-Harness 在 TerminalBench-2 上超越手工 harness,是 Layer 1 自动化的极限证据,也是工作层继续上移的指向牌**。稳定接口之下可自动化,接口之上的 objective / verification semantics / 哪些 invariants 不可让渡 —— 仍然是人的工作。

---

##### 本章奠基文对齐

- [[openai-harness-engineering]] —— 1M LOC / 3.5 PR per engineer per day / AGENTS.md + docs 模式的一手出处
- [[fowler-on-harness]] —— computational vs inferential 两类控制的分析脊柱;steering loop 概念
- [[mindstudio-harness]] —— 五柱入门清单;LangChain 52.8→66.5 harness-not-model 的最可引用数据点
- [[stanford-meta-harness]] —— Layer 1 自动化极限证据;TerminalBench-2 超越手工 harness

##### 本章对应 wiki 页

- [[concept-harness]] · [[concept-tool-vocabulary]] · [[concept-evaluation-harness]]

---

**第 6 章进入 Part B 的第一柱:session**。Layer 1 读者可以把 Part B 四章当背景略读,或跳到 Part C(两类循环、知识治理、reflexive harness) —— 这些是两层共享的跨时间维度。Layer 2 读者,Ch 6 开始是你的主场。
