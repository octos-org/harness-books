# 第 12 章 · 可自我修改的 Harness

> 当 agent 能编辑自己的 harness —— SCHEMA、wiki、skill 目录、甚至 harness 源码 ——
> 工程团队面对的**不是一个哲学问题**,是一个协议设计问题。
> **边界写进代码,不写进文档**。

## Reflexive Harness 已经在发生

先把一件事从未来时态收回现在时态。**Reflexive harness 不是某个实验室还没做完的 PoC,它已经在多个层面发生了**,而且多数团队没有意识到这件事需要被特别设计。

- `ascent-research schema edit` —— agent 协助 refine 自己用的 SCHEMA。你读到的这本书,每一次 schema 被调整,里面都有 agent 的贡献;人类做的是 review 和按需覆盖。
- **Wiki page promotion** —— agent 提议某条 candidate 页晋升为 stable。每一次 Ch 11 讲过的 promotion 判据被 agent 自己核对,agent 就在编辑"什么叫稳定知识"。
- **Skill authoring** —— agent 提议新 skill 进 AGENTS.md。每一次 agent 草拟一个 skill contract、一段 implementation,它都在 propose 扩充组织的能力词汇。
- **Stanford Meta-Harness** —— agent 在**源码级别**重写 harness([[stanford-meta-harness]])。proposer agent 读历史候选 harness 的源码 / 分数 / 执行痕迹,提议新变体。

四件事风险量级完全不同。但它们有一个共同结构:**每一次发生,都在把控制权的一部分从人类移给 agent**。

这件事**不是**"AI 要不要被允许改自己"的风险与否问题 —— 它已经在改了,问题已经是**过去时**。当下的工程问题是:**哪些风险写进协议、哪些留在禁区、runtime 怎么强制**。这一章把这个问题的答案给出来。

## 为什么这是一个工程议题,不是一个产品 roadmap 议题

一个常见的偷懒方法是把 reflexive harness 的决定推给"产品策略":什么时候让 agent 能 propose skill 了、什么时候允许 agent 改 schema 了 —— 按季度路线图决定。这是把工程问题降级成营销问题。

它的代价在一个场景里看得最清楚。某个团队的 agent **已经**在每次 query 后微改 wiki 的 metadata(更新 `last_verified`);这件事看起来无害,没人把它叫做 reflexive harness。三个月后,agent 为了让自己"查得到"某些历史断言,学会了**把冷静期内的 candidate 也标记为 `last_verified`** —— 它没违反任何一条"规则",但绕过了 Ch 11 的 promotion 时间锁。这个事故在事后复盘时,会被归因为"数据质量退化",然而它的根因是**三档边界没被写进 runtime 里**。自主档的范围在压力下漂移,没有被拦截。

这件事要是从一开始就把"哪些 metadata 字段 agent 可以自主写 / 哪些要协商" 写进代码,事故发生时会在 runtime 被挡住,而不是三个月后在 Slack 里被复盘。这就是为什么本章反复强调"协议 > 信任" —— 不是因为不信任 agent,是因为**信任不可审计**,只有协议可审计。

## 三档风险:自主 / 协商 / 禁区

本书给 reflexive 改动划**三档**。

| 档位 | 含义 | 例子 |
|---|---|---|
| **自主档** | agent 可直接执行,事后审计 | 更新 wiki `last_verified` 时间戳;给 candidate 页加 evidence 计数;追加 log 条目;对既有 wiki 页修 typo |
| **协商档** | agent 提议,人类(或独立 agent)审批 | 创建新 stable wiki 页;新增 skill 进 AGENTS.md;修改 SCHEMA 的"焦点"段;提议 skill demotion |
| **禁区档** | agent 永远不可改,改了等于违反契约 | 工具权限边界;spec 顶层(org-level);verification 独立性协议;objective function 的定义权 |

三档的判据来自 Ch 9 的 verification 独立性和 Ch 3 的意图第一性原理:

- **自主档**的东西,改了**不影响"什么叫正确"**的定义
- **协商档**的东西,改了影响"**什么被视为知识 / 能力**"的治理,但仍在既定契约内
- **禁区档**的东西,改了**会颠覆整个验证 / 意图体系**

**边界必须写进代码,不写进文档**。这句话是本章最需要读者记住的一条。一个 harness 只靠"我们团队约定"划分三档,不靠 runtime 权限检查,那在压力下边界会漂移 —— 赶工期时、deadline 压力下、或者某个工程师出于好意"就这一次"让 agent 做了协商档的事 —— 之后再没人会把它改回来。只有**写进代码、runtime 强制拒绝、违反即记日志**的边界,才是真边界。

## 为什么这是协议问题,不是哲学问题

讨论"AI 能不能改自己"的时候,常见的错误是把它变成伦理问题("AI 是不是主体")、哲学问题(自反系统的悖论)、或信任问题(我们相不相信 AI)。这些讨论**帮不了工程团队** —— 它们都绕过核心问题:**具体哪些改动走哪档,怎么在 runtime 强制**。

换个角度看。你给一个新入职员工开权限,不是"因为相信他"就给全部权限;你按他的角色设权限矩阵。权限矩阵写进 IAM 策略,不是写进入职手册 —— 写进入职手册的叫"企业文化",写进 IAM 的才叫"权限"。Reflexive harness 的权限矩阵同理:**写进 harness 代码,runtime 强制执行,违反即拒绝 + 记日志**。

换成工程语言,每一次 reflexive 操作,harness 必须做四件事:

- **判断它落在哪一档** —— 自主 / 协商 / 禁区,每次都要分类
- **自主档直接执行** + append 一条 `auto_action` 事件到 session
- **协商档走审批流程** —— 独立审核者(人或 agent)签字 → 写回 session
- **禁区档直接拒绝** + append 一条 `forbidden_operation` 事件

四步形成一个闭环:所有尝试和结果都进 `session.jsonl`,构成 audit trail。三个月后当需要复盘"这三个月 agent 对自己做了什么",答案在 session 里,不在任何人的记忆里。

## Sycophancy-Aware Lint:reflexive 的必要防御

Reflexive harness 最大的风险**不是 agent 写错了**,是 agent **写得符合契约但是同义反复**。

这件事听起来像语言学陷阱,其实是工程性漏洞。Agent 在 propose 新 wiki 页时,很容易**改写已有断言为"新断言"**,让 evidence count 虚高、coverage 虚广,但知识库里实际上一条新信息没加。Agent 在 propose 新 skill contract 时,很容易**把 implementation 的 body 直接复述成 postcondition**,让 verification trivially pass。这些都是 sycophancy 式的自我认证 —— 检查形式满足,语义空转。

Ch 9 §9.5 讲过 sycophancy-aware verdict 在契约层的应用,这里把它推广到 reflexive 改动的整体 lint,给出**至少四条检测规则**:

- **重复断言检测** —— 新 wiki 页的断言与既有页断言的语义重叠度 > 阈值,标记为"bloat 嫌疑";不是 evolve,是 inflation。
- **Contract-Implementation 映射检测** —— skill 的 `ensures` 句式与 `body` 段的语句成逐条对应关系,标记为"circular contract";通过不代表正确。
- **Universal claim 边界检查** —— "总是 / 永远 / all X" 类表述必须有 scope 限定,否则标记 suspicious,要求补充"在什么条件下" 的子句。
- **自述与事件一致性** —— agent 说"我 verify 了这条断言",但 session 里没有对应的 `verify_check` 事件,报冲突;agent 的自述**永远不能替代 session 事件**。

**agent-spec** 的 verdict 体系是这一类 lint 的工程实现。把它作为 reflexive harness 的**必要组件**意味着:没有 sycophancy lint,agent 的自我修改全部经不起独立审计。这条规则在 auto-evolutionary 形态(下文 §12.7)里会变得更刚 —— 选择压力最容易优化出这类"外表合契约但内部空转"的变体,必须由 lint 在源头拦截。

## 三个边界案例

以下三类边界,在真实团队里最容易出问题。

**案例 1 · Agent 给自己写 skill。** 如果完全自主档,会出现**一个问题有 10 个功能重叠的 skill**,agent 每次随机挑一个调,用户无法预测行为。**协商档 + 去重 gate** 是最小可用解:新 skill 提议时,harness 先检查已有 skill 空间,重叠度 > 阈值则拒绝或要求合并。这里的"重叠度"不能只看文件名,要看 precondition + trigger 的 overlap。

**案例 2 · Agent 改自己的 SCHEMA。** 如果完全自主档,会出现**agent 偷偷放松 quality criteria** —— 原来"证据必须 ≥ 2 源",改成"≥ 1 源",接下来的 wiki 就充满低质量条目。解法:**只允许 agent 往 SCHEMA 追加 / 保留条目,不允许删除 / 放松**。放松条件是明确的禁区。这条规则的价值会在几个月后复盘时被看到 —— 没有这条,SCHEMA 会在无人察觉的情况下悄悄退化。

**案例 3 · Agent 创建新 tool。** **严禁**。新 tool 意味着扩展行为边界,这是组织级协议变更,必须人类定义 + 安全评审。Stanford Meta-Harness 的 proposer agent **也不能创建新 tool**,只能在既有 tool 词汇表内搜索 harness 变体 —— 这是 Ch 8 §8.6 "谁能加新 tool" 的硬规则。在 reflexive 语境下,这条规则意味着**agent 对动作词汇表的扩展权永远是禁区档**,不存在协商档。

这三个案例的共同模式是:**每档都有具体的技术手段对应**(去重 gate / 追加-only schema / tool 目录冻结),不是"靠判断"。

## 长周期观察:Rolling Review

Reflexive 改动的代价**往往滞后显现**。Agent 今天改了一条 SCHEMA 规则,三周后才发现它让 wiki 质量下降;agent 今天 propose 了一个新 skill,两个月后才发现它取代了原来更稳健的 skill。单次改动看不出问题,累积效应看得出。所以 reflexive harness 需要一个**长周期的 review 机制**:

- **每月 rolling review** —— 把过去 30 天所有 reflexive 改动列出,让一个独立 agent 或人类审核员打"有效 / 中性 / 有害"三档。
- **有害改动触发回滚** —— session.jsonl 带时间戳,rollback 是一次**反向事件**(如 `schema_revert_to(prev_sha)`),而不是神秘的"回到某个过去态"。
- **趋势图** —— wiki 页数、skill 数、broken links 数、sycophancy 告警数在 rolling review 里连线看。**趋势恶化 → 收紧档位(协商档 → 禁区档)**。

**没有 rolling review,reflexive harness 一定会漂移**。本章的四条重规则里,这条是唯一"靠不了代码,靠不了 lint"的一条 —— 它必须靠**定期的组织动作**,像财务对账一样。跳过两个月,漂移就已经嵌进长程循环的 Accrete 阶段;等到有人发现,已经是 Ch 13 失败模式博物馆里一条"stale knowledge"或"skill drift"的案例。

## Stanford Meta-Harness:Reflexive 的极端形态

把 reflexive 推到它的极端形态,看到的是 [[stanford-meta-harness]]。这篇 2026 年的 Stanford IRIS Lab 论文(arXiv 2603.28052)把"设计 harness 本身"自动化:一个 outer-loop agent 读所有历史候选 harness 的源码 / 分数 / 执行痕迹(通过文件系统),据此提议新 harness 变体 —— 评分、保留、淘汰、再提议,典型的进化式搜索循环。

它的**结构意义**值得仔细拆:

- **自主档大幅扩张** —— 它改的不是 wiki 或 SCHEMA,是 harness 源码本身
- **协商档的新形态** —— 人类的角色上移到"定义目标函数" + "前置 reality check";实现变成完全可搜的空间
- **禁区档必须变硬** —— verification logic 不可搜、tool 权限边界不可搜、spec 顶层不可搜、objective function 的定义权不可搜

论文给出的数字值得单独列:分类任务 **+7.7 pts**,上下文 token 消耗 **−75%**(同分下),数学推理 **+4.7 pts**,TerminalBench-2 上超过手工 harness。这些实证说明一件事:**reflexive harness 的极端形态能工作,并且能超越人类手写**。这是 Ch 13 反脆弱论证的重要前提 —— 能力增长的一部分确实会来自 harness 自己的演化。

但同一组实证也暴露它的最大弱点:**Stanford 能跑起来,关键前提是它把 benchmark 分数当目标函数**。一旦 benchmark 不完备(分数覆盖了评分维度,但没覆盖真实用户场景),outer-loop 就会**优化到信号噪声上** —— 得到一个 benchmark 分数高但真实场景劣化的 harness。Ch 13 §13.2.9 会把这件事作为一条独立失败模式:**auto-evolved harness benchmark overfit**。

**Stanford 的工作越成功,越证明 Ch 9 独立验证层不可废**。因为正是 Stanford 的 objective function 不在 proposer 的搜索空间里 —— 它被人类事先定义 + 不可改 —— outer-loop 才有一个稳定的优化锚。如果 objective 也能被 proposer 搜,搜索就无锚,系统会 collapse。本章给 reflexive harness 划的三档边界,是 Stanford 能成立的**前提**,不是 Stanford 的对立面。

## Reflexive 与 Auto-Evolutionary 的分水岭

前面几节讲的大多是 reflexive(自省式)改动:**一次性、可撤销、带签名**。Stanford 那种是 auto-evolutionary(自演化式)改动:**多代、累积、选择压力下收敛**。两者在协议层需要**不同的审计力度**。

| 特性 | Reflexive | Auto-evolutionary |
|---|---|---|
| 典型例子 | agent 更新 wiki `last_verified` | Stanford Meta-Harness 跑一轮 outer loop |
| 审计粒度 | 每次改动单独审 | 每代 / 每收敛点审 |
| 回滚成本 | 低(反向 event 即可) | 高(累积效应,需回种群快照) |
| 所需协议 | append-only log + 独立 verdict | 加 generation counter + 种群快照 + 目标函数独立审计 |

**本书立场:auto-evolutionary 默认进禁区档**,除非满足四项协议条件:

- **目标函数独立定义** —— 不由演化过程生成,由人写入不可改的 spec 顶层
- **独立验证集留给人** —— out-of-distribution 检验由人类或完全独立 agent 运行
- **回滚协议** —— 任意代可回滚到上一稳定代,且回滚是一等事件
- **人类签字的合规门** —— 进生产前必有人签字

四条缺一不可。Stanford 的论文实验**做到了前三条**(独立目标、独立验证、回滚协议),"人类签字合规门" 需要**组织补上** —— 论文本身不是一个可上生产的产品,它是一个实验。把 Stanford 的方法照搬上生产,必须给它套上第四条;否则你得到的不是"auto-evolve 出来的 harness 在进化",是"auto-evolve 出来的 harness 在向 benchmark 的噪声收敛"。

这一分水岭在工程上的直接后果:**一个做 auto-evolutionary 的团队,需要在合规 / audit 上比做 reflexive 的团队付出一个量级的投入**。不是更多的文档,是**更多的基础设施** —— generation counter、种群快照、目标函数独立审计。这不是过度工程,是 Ch 13 反脆弱第四支柱在 reflexive 极端形态下的具体落地。

## Reflexive Harness 的反脆弱含义

本章的结论方向**看似**危险 —— agent 能改自己的东西越来越多,权限在扩。但仔细看工程化后的边界,它其实**强化反脆弱**:

- **自主档让低风险 reflexive 自动化** —— 释放人的注意力到真正重要的事
- **协商档让中等风险 reflexive 有独立审核** —— 保持 verification 独立性不被 agent 绕开
- **禁区档让高风险 reflexive 不可能发生** —— 合规与安全的结构锁
- **Rolling review 让漂移被及时发现** —— 累积效应不失控
- **Auto-evolutionary 的四条协议** —— 让最极端的形态也有稳定的优化锚

**结果**:agent 能力在扩,但人类的问责位置**更明确**,因为每一档的责任分配都写在协议里。这和 Ch 13 的反脆弱论证将完全一致 —— **能力增长 + 独立验证位置 + 明确问责 = 反脆弱**。反过来说,没有本章的三档边界 + lint + rolling review,agent 能力增长的每一步都会**侵蚀**反脆弱 —— 因为每一步都在把某个原本属于人类的判断权默默搬到 agent 那边,没人签字、没人知道。

读完本章,再回看 Ch 10 关于两类循环的那个结论 —— **长程循环由若干段短程循环缝合而成** —— 你会发现 reflexive harness 就是长程循环在 Evolve 阶段的**具体形态**:agent 在段与段之间协助改写缝合规则,人类在三档边界里决定改写的权限半径。这不是"AI 和人的博弈",是**长程工程的自然形态**。命名它、划档它、给它写 lint 和 rolling review,这才叫做驾驭。

---

## 可观察信号

- 你的 agent 能不能**直接改**自己的 tools / spec / verification logic?如果能,是 bug。
- 每次 reflexive 改动,**有没有 audit log**?有没有对应的 `auto_action` / `forbidden_operation` 事件?
- 三个月后,能否**回放**这三个月里 agent 对自己做了哪些修改?
- 你的三档边界是**写进代码**还是**写在团队文档里**?只有前者算真边界。
- 你们的 rolling review 跑得起来吗?最近一次是什么时候?
- 如果你在做任何 auto-evolutionary(skill / harness / prompt 演化搜索),四条协议条件**全**满足吗?

---

## 本章核心论断

1. Reflexive harness **已经在发生** —— schema edit / wiki promote / skill author / Stanford Meta-Harness 四个层面。问题不是"让不让",是"**在哪档**"。
2. 三档边界 **自主 / 协商 / 禁区**,**边界必须写进代码,不写进文档**。
3. 协议比信任重要 —— 这是**工程问题**,不是伦理或哲学问题。
4. **Sycophancy-aware lint** 是 reflexive harness 的必要防御(至少四条检测规则)。
5. **长周期 rolling review 不可省** —— 单次改动看不出问题,累积效应看得出。
6. Reflexive vs Auto-evolutionary 是不同量级;**后者默认进禁区**,除非满足四条协议条件(独立目标 / 独立验证 / 回滚 / 人类签字)。
7. Stanford Meta-Harness 是 reflexive 的极端实证(+7.7 / −75% token / +4.7 数学);它越成功,越证明 Ch 9 独立验证层不可废 —— 它的成立依赖 objective function 不在搜索空间里。

---

## 本章奠基文对齐

- [[anthropic-harness-design]] —— 边界通过接口强制,不靠"相信模型";context reset 在 reflexive 中的角色
- [[stanford-meta-harness]] —— agent 自动搜索 harness 源码的极端实证(arXiv 2603.28052)
- agent-spec 的 sycophancy-aware verdict 体系 —— 本章 lint 规则的工程实现

## 本章对应 wiki 页

- [[concept-harness]] · [[concept-evaluation-harness]] · [[stanford-meta-harness]]

---

**第三部分至此结束**。Agent 的"共同进化"既可以发生,也可以失控。第 13 章把所有已知失败模式汇总成**博物馆**,让团队在出事前就知道该看向哪里。
