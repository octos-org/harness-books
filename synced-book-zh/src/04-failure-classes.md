# 3. Octos 遇到的失败类别，以及代价为何高

## 3.1 Background task progress bugs

Observed class:

- child task running correctly
- parent session only shows initial status or stale status
- users assume hang or retry, creating duplicate work and confusion

Root causes:

- progress emitted as freeform stderr text
- no typed event sink contract
- no durable bridge from child progress into parent task state

Cost:

- false support escalations
- duplicate child sessions
- “it works locally” but not in live canary confidence collapse

## 3.2 `run_pipeline` / `deep-search` status drift

Observed class:

- deep research run is active, but status bubble and task API diverge
- API may say running while bubble appears frozen or mismatched phase

Root causes:

- multiple status channels with weak reconciliation
- no single canonical phase ladder enforced across UI/API/replay

Fix direction (M4.1A contract):

- `octos.harness.event.v1` progress schema
- runtime sink -> `TaskStatusChanged` -> `/api/sessions/:id/tasks` + SSE
- UI replay consumes same backend event truth

## 3.3 Session switching / status bubble contamination

Observed class:

- switch to sibling session and see progress/status from another session
- user cannot trust what belongs to current conversation

Root causes:

- topic/session scoping not enforced end-to-end
- replay and active stream mixed without strict session ownership checks

Fix direction:

- hard session/topic scoping in task status events
- replay filters + bleed checks in live gates
- explicit “no cross-session progress bleed” acceptance criteria

## 3.4 Artifact contract enforcement gaps

Observed class:

- background job completes but wrong file is delivered
- task marked done with missing/invalid primary artifact

Root causes:

- filename heuristics instead of declared artifact truth
- completion not blocked by validator failure

Fix direction:

- policy-owned `primary` artifact
- `BeforeSpawnVerify` blocking contract
- completion gating tied to validator outcomes

## 3.5 Validator runner incompleteness

Observed class:

- validators exist but outputs are too coarse for operators/devs
- insufficient typed evidence for debugging and replay

Required posture:

- typed per-validator outcome
- duration, reason category, replayable evidence path
- clear timeout and failure taxonomy

## 3.6 Operator blind spots

Observed class:

- counters exist but no compact operator narrative
- hard to answer “why this task failed” quickly

Fix direction:

- operator summary and dashboard fed by canonical task/harness state
- no dashboard-only hidden logic

Taken together, these failures are not six separate bugs. They are one pattern expressed through different surfaces: Octos treated chat-like output as if it were runtime truth. The next chapter turns that pattern into a concrete architecture for state, events, validation, and replay.

---

### 扩展源材料


#### 来自 `13-failure-and-antifragility.md`：第 13 章 · 失败模式博物馆与反脆弱四支柱

_源材料角色：failure museum, root-cause taxonomy, antifragile repair._


#### 第 13 章 · 失败模式博物馆与反脆弱四支柱

> 一条事故复盘单,往后推到头是四柱中的哪一柱失效。
> 反过来看,押在哪一柱上,**明年模型再强一代也不会塌**。
> 这一章把微观证据和宏观结论,放在同一页上对账。

##### 凌晨三点的那张复盘单

凌晨三点,on-call 群里蹦出第三条告警。一个做医疗影像辅助的 agent,连续两次给值班医生推了"请复核",每次都附一段它自己写的总结:"根据 session 3 的结论,本片左肺门淋巴结疑似肿大。"值班医生点开 session 3,逐条翻事件流,翻到天亮,**没找到任何一条事件提到过这件事**。

写复盘单的工程师这一刻没有改 prompt 的念头。他打开事故模板,第一栏"症状"填了一句:"agent 在后续 session 引用了前置 session 中从未发生的事实。" 第二栏"根因" 他卡住了 —— 过去几个月他们遇到过四种长得差不多的事故,每一次都被当作"孤立偶发" 处理。第三栏"修法" 他也卡住了 —— 上次的修法是"prompt 里加一条 '请仔细核对 session'",这次他不想再写这种话。

他翻出团队的 oncall playbook,点进一条他从来没认真对照过的链接:**失败模式博物馆**。九条事故的症状、根因、修法并列排着。第三条"Dropped References(引用丢失)" 的症状栏,**一字不差就是他今晚遇到的事**。根因栏写着三个词:**Session 柱不完整**。修法栏两行:`session.jsonl` 追加写,禁止 destructive compaction;summarization 只能写派生事件,原始事件不可丢。

那天做完的最后一件事,他在事故单底下加了一行:"**这不是孤立事件,这是博物馆第三号。**" 第二天团队站会,这句话变成了本章要讲的东西。

##### §13.1 为什么叫博物馆,不叫文档库

"失败模式集" 可以叫 registry、catalog、taxonomy、wiki —— 我们早期每一个都用过。它们最后都腐烂成了同一件事:**一页陈列"曾经出过什么事",却没有人回去看**。真实成本是,同一条失败换着名字发生第三次、第四次,每次都被当作新事故处理。"凌晨两点的工程师" 在 Ch 2 那本笔记本里写过一句 —— "问题不在这里";博物馆的第一条纪律是另一句同族的话 —— **"这不是新事"**。

博物馆这个词本身带着三个工程含义。**命名** —— 每条失败模式有唯一标识和一句话描述,复盘会上能指着它说话,编号和名字不能换。**分类** —— 每条归因到四柱中的某一柱,归不进的要么博物馆漏收,要么四柱本身需要扩展,两种情况都比"杂项" 更有信息量。**演化** —— 每次新事故要么落进既有条目,要么触发新增条目;半年博物馆没动过的团队,要么半年没出事(几乎不可能),要么半年没学到东西(很可能)。

你读到这里可以先做一件事:找出你团队过去三个月的三次事故,它们分别被写进 Jira、Slack、Notion —— 还是统一收进了某个三个月后的自己找得到的结构?找不到,就已经不是博物馆,是**日记本**。

##### §13.2 博物馆的三栏:症状 / 根因 / 修法

每一条博物馆条目,严格三栏。缺一栏不合规。

**症状(Symptom)**。你看到了什么。"agent 偶尔犯错" 不是症状;"agent 声称引用了 session 3 的结论,但 `session.jsonl` 里无此事件" 才是症状。要能让一个没参与这次事故的同事**在三天之内识别出"我遇到的也是这条"**。

**根因(Root cause)**。四柱中哪一柱的缺失或失效。归因不清,修法会失焦。常见误区是把"模型不够好" 当根因 —— 这不是根因,是推卸;四柱中任何一柱都不以"模型不够好" 为借口。

**修法(Remedy)**。协议级或代码级的具体修复,必须能落到 diff 里,必须能写成一条 spec。**"加强培训" 不算修法,"提醒大家注意" 不算修法,"下次多 review" 不算修法** —— 它们不改变事实流。博物馆的修法栏是一条硬规矩:**不可执行的修法,等于没修**。

有了这三栏的规矩,下面九条失败模式逐条摆出来。九条都在真实生产系统里至少出现过一次,都有公开可引用的出处,都对应到四柱中的某一柱。

##### §13.3 九条失败模式逐条陈列

**§13.3.1 · Dropped References(引用丢失)—— Session 柱**

- **症状** —— Agent 在后续 session 引用了某个结论,但原始事件流里从未出现过;或总结"之前确认了 X",`session.jsonl` 里找不到任何 `X confirmed`。
- **根因** —— Session 柱不完整。典型是 summarization 覆盖了原始 event,或 agent 的"记忆" 实际是自己说过的话,不是真实事件。
- **修法** —— `session.jsonl` append-only,禁止 destructive compaction;summarization 写入的一定是派生事件;重启时**事实从场外重建,不从上一条 summary 重建**。

**§13.3.2 · Hallucinated Sources(虚构引用)—— Tools 柱**

- **症状** —— Agent 说"根据论文 X / 根据文档 Y",但论文 X 不存在或文档 Y 的 URL 返回 404。
- **根因** —— Tools 柱的 observability 缺失,harness 无法核验 agent 自称 fetch 过的东西,口头自述被直接信任。
- **修法** —— 所有 fetch 走**可审计的 tool**,每次 fetch 留 URL + sha256 事件;口头声称不算证据,只有 tool 事件算数。

**§13.3.3 · Context Collapse(上下文坍塌)—— Harness 柱**

- **症状** —— 长对话到中段开始胡言乱语、自相矛盾、丢失早期约束,像"换了一个人"。
- **根因** —— Harness 柱的 compaction 策略丢失了关键事实 —— 比如某条 system reminder 在某一轮被滑出 window。
- **修法** —— compaction 只是 context 层的操作,**session 层必须保留原始事件**,下一轮可重组回来;trace 对比精确定位"丢失约束的那一步"。

**§13.3.4 · Divergence(发散循环)—— Harness 柱**

- **症状** —— Agent 反复做同一件事、做相反的事、推翻自己的上一条结论,没有进展,token 一直烧。
- **根因** —— Harness 柱的停机判据缺失或太粗。没有 coverage signature、没有 no-progress detection,循环无节制。
- **修法** —— coverage signature:N 轮相同状态即停机;配以步数上限 + 无进展检测双重护栏;必要时独立 watchdog agent 按 spec 判"卡住了"。

**§13.3.5 · Sycophantic Verification(自我奉承的验证)—— Verification 柱**

- **症状** —— Agent 给自己的 output 打高分,人类 review 发现质量堪忧;或同一 agent 写的 contract 和 implementation 互相"证明对方正确"。
- **根因** —— Verification 柱的独立性缺失。AI 验 AI、两者 actor 相同、训练数据相同;[[anthropic-harness-design]] 命名的 sycophancy 陷阱。
- **修法** —— evaluator 与 generator 不同 agent、理想情况下不同模型;sycophancy-aware lint;高风险动作保留 human-in-the-loop checkpoint。

**§13.3.6 · Harness-Bound Model Bug(硬编码模型缺陷)—— Harness 柱**

- **症状** —— 模型升级后原 harness 行为变差、部分功能失效,团队最初反应是"新模型不好用"。
- **根因** —— Harness 里写死了"补模型缺陷" 的 workaround(planner 代劳、retry 循环、context 压缩 hack);新模型不需要这些补丁。
- **修法** —— 模型换代时执行 **assumption sweep** —— 审计所有 harness 代码,逐段回答"这段还需要吗";sweep 在 release 前做,不是出事后补。

**§13.3.7 · Tool Escape(工具逃逸)—— Tools 柱**

- **症状** —— Agent 通过合法工具的非预期组合绕过权限边界。经典例子:`read_file` + `send_email` 各自合规,组合起来 = "把 /etc/passwd 发到外部"。
- **根因** —— Tools 柱的正交性不够,或调用序列缺监控。单调用合规,不代表调用序列合规。
- **修法** —— 不只检查单次调用,还检查**调用序列模式**;observability 层检测异常 tool 序列;credentials 物理上不进 sandbox([[anthropic-managed-agents]] 的结构性防御)。

**§13.3.8 · Context Anxiety(上下文焦虑)—— Session ↔ Harness 协同**

- **症状** —— Agent 在感知到 context 快满时提前草草收尾,跳步骤、放弃子目标、下断论;像"被催着交卷的学生"。
- **根因** —— Session 与 harness 的协同不足,agent 把 context 当 session,以为 context 满了 = 事实没了。
- **修法** —— **context reset with structured handoff**:硬杀 agent 进程,起新的,通过 session 里的事实流告诉它"前面做过什么";[[anthropic-harness-design]] 原始命名、原始解法。

**§13.3.9 · Benchmark-Overfit Auto-Harness —— Verification 柱**

- **症状** —— Auto-evolved harness 在训练 benchmark 上分数惊人,换真实场景崩盘;线下一百分,线上不及格。
- **根因** —— Verification 柱的独立性不足 —— 自动搜索的目标函数就是 benchmark 本身,proposer 会学到 benchmark-specific hack 而非通用能力。[[stanford-meta-harness]] 2026 年显式命名了这个风险。
- **修法** —— 目标函数必须由 **held-out 任务 + 独立审计**组成;保留永不对 proposer 开放的 verification 信号;定期对 top-k 候选做 OOD spot check。Stanford 原始工作在 200 道 IMO 级题上跨 5 个 held-out 模型验证 —— 这一步复制时**最容易被省掉**。

看完九条,你会发现一件事:**每一条的症状都具体,根因都锋利,修法都能写进 diff**。这是博物馆和"失败日志" 的硬分界线 —— 日志记录过去,博物馆指挥未来。

##### §13.4 九类的归因分布,暗示了什么

把九条拉成归因矩阵,看分布。

| 失败模式 | 所属柱 | 表现层 |
|---|---|---|
| §13.3.1 Dropped References | Session | 事实级不一致 |
| §13.3.3 Context Collapse | Harness | 事实级不一致 |
| §13.3.2 Hallucinated Sources | Tools | 工具行为不对 |
| §13.3.7 Tool Escape | Tools | 工具行为不对 |
| §13.3.4 Divergence | Harness | 循环 / 停不下来 |
| §13.3.6 Harness-Bound Model Bug | Harness | 行为随模型变差 |
| §13.3.8 Context Anxiety | Session ↔ Harness | 早收尾 |
| §13.3.5 Sycophantic Verification | Verification | 评估不可信 |
| §13.3.9 Benchmark-Overfit Auto-Harness | Verification | 评估不可信 |

九条里 Harness 独占三条、Verification 两条、Tools 两条、Session 一条加一条协同。这不是偶然:**Harness 是最大的技术债产出点**([[fowler-on-harness]] 讲的 guides + sensors 两侧都在 harness),**Verification 是最容易被省略的柱**([[concept-evaluation-harness]] 讲的独立性成本最大)。大部分团队的博物馆最后都是"**Harness-Verification 半边天**"的博物馆。

反过来可以自测:**若你脑子里能想出的团队事故超过一半归不到 Harness / Verification,很可能你的归因还没做到位** —— 不是这两柱不重要,是你团队目前还没有辨认它们失效的语言。

##### §13.5 六十秒归柱 playbook

回到凌晨三点那位工程师的处境。他下次再接到告警,想在六十秒内把事故归到四柱之一,五问按顺序问下来。

- **问一:这是事实级不一致吗?** Agent 引用的事在事件流里找不到;不同轮次对"同一件事" 的描述互相矛盾。答"是",归 **Session 柱**(§13.3.1、§13.3.3)。
- **问二:这是工具行为不对吗?** 工具声称做了某件事,实际没做、做错了、或被组合出了权限外的行为。答"是",归 **Tools 柱**(§13.3.2、§13.3.7)。
- **问三:这是循环停不下来或行为随模型变差吗?** Agent 转圈、反复推翻自己、或模型升级后表现骤降。答"是",归 **Harness 柱**(§13.3.4、§13.3.6)。
- **问四:这是 agent 草草收尾吗?** 任务远未完成 agent 已经在总结;或用户能看到明显的"跳步骤"。答"是",归 **Session ↔ Harness 协同**(§13.3.8)。
- **问五:这是评估不可信吗?** Agent 自评高分、benchmark 百分、线上崩盘。答"是",归 **Verification 柱**(§13.3.5、§13.3.9)。

五问走完,九条事故归到四柱之一。这一串可以直接贴到团队 wiki 作为 oncall playbook 的顶层 —— 它把事故复盘从"写一份总结"变成"先对照第几号"。对照不上的那种,触发博物馆新增,这才是组织学习的入口。**先归柱,再查因**;归柱做对了,后面的每一步都省力。

##### §13.6 从博物馆到反脆弱:一条没人显式写出来的桥

这一节是本章的合并轴心,也是两个原本分立主题放进同一章的**唯一非巧合的理由**。

九条失败模式看似只是事故台账,其实在暗中回答一个更大的问题:**如果把团队一年内所有事故都摆出来,它们会归到哪几类?** 博物馆的归因分布告诉你的答案,从来不是"某个具体模型不够好",而是四根柱子之一的某种缺失。**失败模式的归因语言,和反脆弱支柱的结构语言,是同一套词汇表**。

再推一步。问:"明年模型变强一代,上面九条有几条会自动消失?" 逐条过一遍,答案很尴尬:**九条里没有一条会因为模型变强而消失**。Session 柱的事故 —— 事件流是 harness 外部状态,不在 model context 里。Tools 柱的事故 —— 权限组合是结构问题,不是推理能力问题。Harness-Bound Model Bug 反而**会随模型变强而加剧**,因为新模型不需要老 workaround。Verification 柱的事故 —— 更聪明的 generator 自评分只会更漂亮。Context Anxiety 的解法是硬重置 + session 重建,与模型强度无关。

换句话说,**九条失败模式指向的那些结构性修法 —— session 协议、tool 权限边界、verification 独立性、明确的停机判据 —— 都是"模型再强也不会自动解决"的东西**。它们不会自动解决,**因为它们不是能力问题,是位置问题**。谁来定义事实流?人。谁来定义 tool 的边界?人。谁来当独立验证者?一个与 generator 不同的 actor,通常还要有人签字。谁来定义"什么叫任务完成"?人。这些东西不随模型升级变化,因为**它们不在模型这一层**。

博物馆里每一条修法,其实都是在往同一件事上押注:**押在不会随模型变化的那些层上**。押对了,模型越强,那一层的价值越大;押错了,模型每变强一代你就要重写一次。**这就是反脆弱** —— 不是"抗风险",是"风险下反而变强"。而且它不是口号,是可以**在四根具体支柱上展开**的技术主张。下面四节,把这件事讲穿。

##### §13.7 Harness Maturity Model —— 先把"做到什么水位" 可测量化

讲反脆弱四柱之前,先把"驾驭工程做到什么水位" 变成可测量的五级。我们把这套分级称为 **Harness Maturity Model**。

| 级 | 描述 | 判别标志 | 典型表现 |
|---|---|---|---|
| **L0** | 只有 prompt | 所有交互在一次对话内,无外部状态 | 失忆;无 audit;demo-only |
| **L1** | 有 session,但没协议 | 会话存储存在但不可恢复、不可查询 | "聊天记录都存 DB 了" |
| **L2** | Session 协议 + 可替换 harness | Agent 可 resume;harness 本身无状态 | 生产级 agent 框架最低线 |
| **L3** | L2 + 独立验证层 | Spec → property tests → audit trail 完整 | 合规场景可上线 |
| **L4** | L3 + 共同进化 | 跨会话 knowledge + skill 治理;reflexive harness 有边界 | 前沿实验室 / 本书作者级 |

每升一级,**新能力** 与 **新治理负担** 成对出现。L0 → L1 能追查事故,但要承担数据审计责任 —— 用户隐私、日志保留、可遗忘权,合规账单同时开出。L1 → L2 能 resume,但要处理并发 session 的隔离、session 之间的污染、"同一 agent 两个 session 打架" 的仲裁。L2 → L3 有独立验证,但 generator 和 evaluator 给出不一致结论时要有仲裁协议 —— 谁赢、为什么赢、事件流怎么写;展开后复杂度不亚于重写一套 harness。L3 → L4 启用跨会话 skill 治理、允许 reflexive harness 动,但必须设计 reflexive 边界 —— agent 可以改什么、不能改什么、改错了怎么回滚([[stanford-meta-harness]] 给了开源参照,但 verification 信号独立性够不够,各家自己判断)。

升级不是"只赚不亏"的。每一次升级都是一次**协议新增**,带来新治理负担。本书的立场一句话:**关键场景必须到 L3;合规要求高的场景(医疗 / 金融 / 基础设施)必须到 L4;没到 L2 的团队不要谈 harness,没到 L3 的团队不要谈反脆弱**。

还记得章首那位凌晨三点的工程师吗?他们团队那时候坐在 L1 —— 会话记在 DB,但没协议;事实流和 summary 混着;独立验证没有。那一晚之后,他们花两个季度推到 L2 下沿,再用一年推到 L3。代价是 token 和工程成本,收益是那本笔记本上再没出现过"博物馆第三号" —— 因为 dropped references 在 L2 下结构性不成立了。

##### §13.8 反脆弱的四根支柱

Ch 9 已经做过核心论证,这里以完整形态重述,关键是**加上第四支柱**。

**第一柱 · Verification ≠ Generation —— 位置独立性**。生成和验证的复杂度不对称(Ch 9 §9.1)。独立性是**位置属性**,不是能力属性。一个 agent 再强,也不能让同一 actor 既是生成者又是唯一验证者 —— 不因为它算不过来,而是"它自己" 在监管意义上不构成独立。[[concept-evaluation-harness]] 把这件事讲到了工艺层。

**第二柱 · Intent ≠ Code —— 意图锚点**。代码是 AI 的输出,意图才是工程师的上游对象(Ch 3)。AI 不知道它不知道什么;组织的隐性知识必须 spec 化,否则 agent 只能从公开数据里平均出一个"大家都这么做" 的实现。模型再强,**意图仍由人写** —— 只有 intent-holder 能对目标本身负责。

**第三柱 · Accountability ≠ Capability —— 问责节点**。社会-监管需要**可问责的人类节点**。飞行员在座、医师在片、会计师在账 —— 不是因为他们算得更准,是因为**出事时必须有人签字**。能力可以外包,问责不能。这是 [[fowler-on-harness]] 那句"guides and sensors" 背后没说出来的社会学假设。

**第四柱 · Objective ≠ Optimizer —— 目标函数的定义权**(本书新增支柱)。[[stanford-meta-harness]] 证明了 harness 设计本身可被 agent 自动搜索 —— 他们的 outer-loop proposer 在分类任务上 +7.7 pts、同分下 context token -75%、数学推理 +4.7 pts、TerminalBench-2 上超过手工 harness。这些数据说明:**优化手段可以自动化,优化目标不能**。"更好的 harness" 指"更准"还是"更稳"还是"更省",选择权永远在更高的定义层。当 agent 能优化手段,人的工作就被迫上移到定义目的。

四条支柱的共性,是它们**都不是技术问题** —— 第一柱是计算理论结构(P vs NP 级不对称),第二柱是认识论结构(意图只能由 intent-holder 表达),第三柱是社会学结构(问责必须找到人),第四柱是元层级结构(优化目标永远来自更高的定义层)。技术进步动不了这四层结构,**因为技术本身在这四层结构之内**。这是"反脆弱" 在本书里最锋利的陈述:不是塔勒布式口号,是**在四层具体结构上的押注**。

##### §13.9 压力测试五问:每一问都有对答

把四柱放进五个压力测试,看反脆弱能否经得起。每一问给出**错答**(诱惑你选的)和**对答**(结构性回应)。

**问题 1:完美 GPT-6 明天发布,你的产品还有人买吗?**
错答:"不买了,AI 不够好的假设不成立,团队白做了。"
对答:**买的人更多**。AI 此时被部署到更关键场景,独立验证 + 问责节点成了合规硬要求,驾驭工程从"锦上添花" 变成"入场券"。模型越强,底座上能跑的高风险 agent 越多,底座的单位价值越高。

**问题 2:Self-verifying AGI 出现,独立验证层失效吗?**
错答:"失效,它能自我验证了。"
对答:**不失效**。独立性是位置属性,不是能力属性。哪怕 AI 能自我验证,它和它自己的 verdict 仍然是同一 actor,不构成监管意义上的独立验证。FDA、SEC、EU AI Act 里"谁在签字" 是结构性约束;self-verifying 不改变结构。

**问题 3:Formal-verification AGI 出现,契约还需要吗?**
错答:"不需要了,它能证明一切。"
对答:**需要**。契约的锚是**人类意图**,不是证明。formal verifier 只能证明"实现满足契约",不能证明"契约反映了人类想要什么"。意图永远由人写 —— 这是第二柱的结构要求,跟证明能力多强无关。

**问题 4:有没有单一技术突破能让你业务归零?**
错答:"模型足够强,驾驭工程就没意义了。"
对答:**没有**。四柱结构性独立;任何单一技术突破都不能同时摧毁四根支柱。能摧毁所有四柱的"突破" 不在技术层 —— 只能在监管层(社会不再要求问责)或哲学层(放弃"人对目标负责"),这两件事在可见的二十年都不会发生。

**问题 5(新):Auto-harness AGI 出现,人还需要做什么?**
错答:"不需要做什么了,连 harness 设计都自动化了。"
对答:**定义目标函数,运行独立验证**。[[stanford-meta-harness]] 证明了 harness 设计本身可自动化,但那篇论文自己的 evaluation 设计是**人写的**:目标函数、held-out 任务、OOD spot check 策略。自动化的永远是手段,不是目的。第四支柱对应的正是这种分工:agent 自动搜出更好的 loop 变体,人定义"更好"的意思。

五问的一致回答:**驾驭工程不是补丁,是模型再好也绕不开的结构要求**。错答共享同一种形式 —— "AI 足够强就不需要这一层";对答共享另一种形式 —— "这一层不是关于 AI 有多强,是关于结构里必须有谁"。

##### §13.10 监管顺风:反脆弱的社会实现

反脆弱在技术结构上有四支柱,在社会结构上有五套监管框架作为**具体的落地强制** —— 没有社会层的落地,四支柱只是理论。

| 监管框架 | 核心要求 | 对应反脆弱支柱 |
|---|---|---|
| **EU AI Act**(2024) | 风险分级 + governance + human oversight | 强制 L3+;第三柱 + 第一柱 |
| **SEC AI Disclosure** | 对外 attestation,披露 AI 使用与材料性风险 | 第二柱(意图 spec 化) |
| **FDA SaMD** | Software as Medical Device 审计 | 第一柱(独立验证)+ 第三柱(人签字) |
| **GDPR DPIA** | 数据保护影响评估,DPO 签字 | 第三柱(DPO 是明确的问责节点) |
| **金融业 Model Risk Management(SR 11-7)** | 独立 model validation function | 第一柱(位置独立的 validator) |

每一条都在要求同一件事:**有一个可问责的人,持有独立证据**。这正是驾驭工程的落点。监管越严,驾驭工程越值钱。实际结果是,**你可以用监管清单倒推自己应该先堆哪根支柱**:医疗 agent 看 FDA SaMD,第一柱和第三柱是生死线;金融 advisor 看 SR 11-7,独立 validation 必须在组织上向 CRO 汇报,不是向 CTO 汇报 —— 汇报线本身就是位置独立性的载体。**监管不是反脆弱的敌人,是反脆弱的盟友**。押错方向的团队把监管当敌人,押对方向的团队把监管当护城河。

##### §13.11 三类商业反模式 —— 它们都在赌第五问的错答

讲完反脆弱的四柱 + 五问 + 监管映射,再回头看**哪类商业立场会在 2026–2028 年被清算**。三类反模式一张表对齐:每一类都对应反脆弱某根支柱的结构性缺位,每一类的清算触发条件都可明确写出。

| 反模式 | 押注在 | 缺位的支柱 | 清算触发 |
|---|---|---|---|
| **All-Prompt 派** | "某段漂亮的 prompt / 某种模板" 是 moat | 第二柱(Intent ≠ Code)—— 意图没有下沉到 spec / property test / audit trail | 每次模型升级 prompt 最优形式重写;约每六个月归零一次 |
| **All-Model 派** | "AGI 来了不需要这些工程" | 第三柱(Accountability ≠ Capability)—— 能力涨但问责找不到人 | 任何高风险场景合规门前被挡;保险不承保、医院不放行、法院不免责 |
| **All-Framework 派** | "我们押在 LangChain / AutoGen / 某个 framework 上" | 第一柱与第四柱之间的地基 —— 把"驾驭工程" 错当成"框架用得好" | 框架被吸收(API 改名 / 收费)或淘汰(维护者走人),三年一轮 |

三种反模式在 2024–2025 年还看似可行 —— 市场对 agent 产品的要求还不到合规门槛,框架的 breaking change 速度还没到让人疼的程度。到 2026 年已经开始露出破绽;**2026–2028 年会有一波显著的"AI 创业公司清算",其中一大半属于上述三类之一**。两年后翻回来看,可以直接对账。

那位凌晨三点的工程师,他们团队当时的商业立场是 all-framework 派的轻量版:session 管理外包给了他们用的 agent 框架,dropped references 事故的根因最后追到了框架 summarization 实现里的一条 destructive compaction bug。修 bug 要等框架方下个季度的 release。他们的选择是**自己把 session 协议从框架里抽出来,改成独立组件**。六个月后,他们的 moat 不再是"我们用得好某个框架",而是"我们的 session 协议能跨框架运行" —— 一步跨进 L2 以上。

##### §13.12 反脆弱三问自测

章末留三问给你的团队,把反脆弱从抽象概念落到可答的具体题目。

**问题一:明天模型升级一代,你团队的工作量会变多还是变少?** 变少 —— 你赌的是"AI 还不够好",模型变强让你的工作自动消失(脆弱侧)。变多 —— 你在做意图 / 验证 / 问责 / 目标函数层,模型越强,这些层承载的任务越复杂(反脆弱侧)。

**问题二:监管变严(EU AI Act 下一次修订 / FDA 下一轮 SaMD 细则 / SEC 下一条 AI disclosure 规则),你们是受益还是受害?** 受害 —— 你可能在绕过合规要求,或产品无法提供监管需要的独立证据(脆弱侧)。受益 —— 你的产品恰好是合规要求的答案,监管把对手拦在门外(反脆弱侧)。

**问题三:如果某个开源协议(session schema / tool vocabulary 标准 / verification interface 规范)下两年成为业界标准,你是担心还是拥抱?** 担心 —— 你在赌一家公司或一个框架(脆弱侧)。拥抱 —— 你的 moat 在协议**之上** 的具体工程资产(session 事实流里的业务知识、skill 晋升 pipeline 里的组织经验),标准化只会让它更容易迁移、更难被模仿(反脆弱侧)。

三问中回答反脆弱侧越多,你团队在 2030 年存活的概率越高。答"脆弱侧"的每一问,都可以回到博物馆那九条去找对应的修法 —— 因为失败模式和反脆弱支柱,说到底是同一套语言的两种投影:事故是损失视角,支柱是资产视角,指向同一笔账。

---

##### 可观察信号

- 团队里有失败模式注册表吗?每次事故能不能在二十分钟内归到博物馆某条?
- 事故复盘模板要求回答"这是哪一柱的失效" 吗?还是只要求"写总结"?
- 复盘后,博物馆**新增**了条目吗?没新增等于没学到。
- 每条博物馆条目的修法是协议级 / 代码级的吗?还是"提醒大家注意" 类空话?
- 你的 harness 在 L 几?要升到下一级需要加什么?
- 如果 GPT-6 明天发布,你团队哪些工作会变多?(变少的不算反脆弱)
- 你的商业逻辑绑在"AI 不够好" 上吗?不绑才是反脆弱。
- 五套监管框架里,哪一条是你当前业务的顺风而不是逆风?

---

##### 本章核心论断

1. **失败模式可以穷举** —— 九条失败模式每条归到四柱之一;没有条目叫"杂项"。
2. 故障诊断应**先归类、再修复** —— 归柱做对了后面每一步都省力,归柱做错了每一步都打在棉花上。
3. **博物馆的修法必须是协议级 / 代码级** —— "加强培训" 类空话一次都不能写进博物馆。
4. Harness Maturity Model 五级(L0–L4)每升一级带来新能力 + 新治理负担,**关键场景必须 L3+,高合规必须 L4**。
5. 反脆弱**四支柱**:**Verification ≠ Generation / Intent ≠ Code / Accountability ≠ Capability / Objective ≠ Optimizer** —— 都不是技术问题,所以模型变强不能摧毁它们。
6. **模型越强,驾驭工程越值钱** —— 自动化范围越大,人的工作越聚焦到"定义目的";第四支柱是 Stanford Meta-Harness 论文之后的必要补充。
7. 监管顺风(EU AI Act / SEC / FDA SaMD / GDPR / 金融 MRM)是反脆弱的**社会实现**,把技术结构锁进社会契约。
8. **All-prompt / all-model / all-framework** 三类商业立场将在 2026–2028 年被清算,每一类都对应某根支柱的结构性缺位。

---

##### 本章奠基文对齐

- [[anthropic-harness-design]] —— context anxiety 原始命名、三-agent 解法、sycophancy 的原出处
- [[anthropic-managed-agents]] —— credentials 不进 sandbox 的 tool escape 结构性防御、brain-hand 解耦的商业价值
- [[fowler-on-harness]] —— silent sensor 问题、computational guides vs inferential controls
- [[stanford-meta-harness]] —— 第四支柱 Objective ≠ Optimizer 的实证来源、benchmark overfit 源头命名
- EU AI Act (2024) / SEC AI Disclosure / FDA SaMD / GDPR DPIA / 金融业 Model Risk Management —— 五套监管框架

##### 本章对应 wiki 页

- [[concept-observability]] · [[concept-evaluation-harness]] · [[concept-harness-as-platform]]

---

**第 14 章** 把视野拉到未来十年 —— 网络协议栈属于公共标准而不属于任何一家公司;驾驭工程的终点是同样的协议层,**many brains, many hands** 的具体形态。
