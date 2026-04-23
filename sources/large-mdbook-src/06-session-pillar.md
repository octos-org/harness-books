# 第 6 章 · Session 是可恢复的事实流

> **如果你的 agent 能被 kill 掉又能无缝续上**,你在读的不是这本书,是一份你们团队早就走通的内部文档。
> 对其他所有人,本章是**Layer 2 四柱的第一根** —— 也是能把后面三根架起来的**那根**。

## 开场:两个 agent,一个 kill 命令

两位工程师在同一个时区各自开了一个 agent,跑同一个任务 —— "从上游仓库抓一段文档,合并进我们的 wiki,顺便改掉两个旧链接"。Agent 各自跑了大约四十分钟,两位工程师不约而同在第十七分钟左右接到一个要去开的会,于是各自做了同一个动作:**一个 `kill`,把 agent 进程按掉**,打算会议结束回来再继续。

会开完了。他们回到桌前,各自点了 "resume"。

工程师 A 的 agent **从第 37 轮的那一条 tool_result 接上**,下一轮就去做"合并 wiki" 那一步。它没有重新读一遍上游仓库的内容,因为那条 `tool_result` 的 sha256 已经 append 在场外事件流里,还在。两个旧链接的位置它也记得 —— 第 29 轮它写过一条 `fact_proposed`,标注了两个链接的位置和原文出处。

工程师 B 的 agent **从头开始**。它先打招呼,然后问:"请问你想做什么?"

这两个 agent 用的是同一家模型。模型能力不是区别所在。区别在**它们的 session 放在哪里**。

A 的 session 是一条活在场外的事件流:agent 进程被 kill 了,事件流没死。新进程起来,从事件流的最后一条之后继续写。事件流是 A 这只 agent 的**唯一真身**,进程只是附在上面的临时劳动力。

B 的 session 在 agent 的进程内存里:进程一挂,事件流跟着灰飞烟灭。B 起来的时候,它确实不知道自己刚才做过什么 —— 没有什么事"在它身上",因为它是一个新生。

在 2026 年 4 月 [[anthropic-managed-agents]] 那篇工程 blog 里,Lance Martin 的团队把这件事写成了本书反复要引的一句话:

> *The session is not Claude's context window.*

这句话读第一遍你可能以为是技术细节 —— "哦,session 比 context window 大一些"。**实际上它在钉一根桩子**。A 和 B 的差别,不是 context window 大小的差别,是"事实到底住在哪里" 的差别。Context window 是每次 inference 一张白纸抄进来、吐完就丢的短期工作台;session 是白纸上每次抄的那些东西的**原始档案**,活在进程之外、活在调用之外,活在 agent 自己之外。

**Layer 2 四柱的第一根,就是这个**:把事实放在正确的位置 —— 场外,append-only,随时可重组,随时可恢复。后面三根柱子(harness / tools / verification)都要站在这根上。session 没立稳,后三柱就悬在半空。

这一章的剩余篇幅,都在把这根柱子钉进地里。

## §6.1 从 Ch 2 接过来 —— context window 装不下的那一半

在 Ch 2 里,凌晨两点那位工程师遇到了一个症状:第十七轮说过的那句话,第四十轮 agent 不记得了。那一章给的诊断是:这不是 prompt 问题,是尺度错位 —— 他要解的问题只有在 harness 尺度上才有形式化落点。

Ch 2 把尺度的名字讲清楚了。**这一章要讲的是**:harness 尺度上,**事实具体住在哪**。

答案只有一个位置,就是 session。再精巧的 prompt、再聪明的 retrieval,都只是在一次 inference 内部解决"我此刻能读到什么"。但"我此刻能读到什么" 这件事本身,要求**某个场外的对象** 在那儿待着、能被读。没有这个对象,你再精巧的调度都是在空气里划圈。

你可以想象 session 是一条**河**,context window 是**从河里用桶舀出来的那一桶水**。桶的容量、桶里这一瞬间装的是什么,那是 prompt 和 context engineering 要关心的事。**河本身**是否一直在流、从哪里流到哪里、三天前它流过的那段河水有没有被记录下来 —— 这是 session engineering 关心的事。

**河和桶不是一回事。把河当成"一堆桶的拼接"**,你就在做一件可悲的事:你以为自己在管理长期记忆,其实你只是在管理桶里那点水的边角料。

这也是为什么 Anthropic 要专门用那句话把两件事切开。在没有这种切分的团队里,session 被悄悄等同于"最近 N 轮对话的拼接",或"context window 的一个滑动窗口"。听上去自然,但它**把一个长寿命对象退化成了一个短寿命对象**。河被削成了桶。

## §6.2 Session 的四条硬约束

要让 session 真的承担"事实的证据仓库 + agent 的长期记忆载体" 这件事,它必须同时满足四条硬约束。这四条约束**不是设计建议,是定义**。缺任何一条,你手里那个东西就不是 session,只是一份日志。

**第一条:append-only。** 写过的事件不覆盖、不修改、不删除。你发现某条事件错了,修法不是把那条改掉,而是**追加一条新事件** —— "前一条 event_id=123 标记为失效,因为 …"。

这一条非常反直觉,因为人的直觉是"写错了就改正"。但 session 的读者不是人,是**未来的 harness、未来的 evaluator、未来的审计员**。他们需要知道的不只是"正确答案是什么",是"agent 当时相信了什么、什么时候改的信、为什么改"。把错的那条改成对的,你丢掉的不是一条错信息,是 agent 的**判断路径** —— 这是 replay、audit、diff 这三件事的物理基础。路径删了,这三件事全部做不了。

一个具体的坏场景:第 12 轮 agent 调了 `web_fetch` 抓了一段文档,产出一条 `tool_result` 带 sha256=`a3f...89`。第 22 轮 agent 以"压缩对话历史" 的名义,跑了一次 summarization,把第 10–20 轮合并成一条"调研背景"的摘要,**原始的 sha256 被覆盖掉了**。到第 30 轮 verification 跑一条 `verify_check`,要回溯"agent 当时依据的原文究竟是哪一段",它在场外找不到 —— `source_sha` 指向的那条事件已经不存在。这种"回溯不到源头"的症状在 Ch 13 失败模式博物馆里有个专门的名字,叫 **dropped refs**。它几乎总是由一次看上去"很无害"的 compaction 引起的。

**第二条:可查询。** `getEvents(session_id)` 必须能按 append 顺序返回所有事件;最好还能按 event kind、按时间窗口、按 actor 做过滤。查询不是锦上添花,是 harness 重组 context 的基础。Ch 7 会讲,harness 本身无状态 —— 它每一轮要决定下一步做什么,都要先从 session 里读。**读不出来的 session,harness 等于盲人**。

**第三条:可重组。** harness 每一轮只把"这一轮相关" 的事件片段塞进 context window,而不是"把所有历史塞给模型"。重组是 session 和"滑动窗口截断" 的分水岭 —— 前者主动挑选,后者被动裁剪。被动裁剪的系统在 context window 满的时候会开始慌(Anthropic 在 [[anthropic-harness-design]] 里把这件事叫 **context anxiety**,Ch 2 §2.4 介绍过);主动挑选的系统在 context window 满的时候**不慌**,因为它知道不在窗里的那些事实**都还在场外**,任何一条之后都能被重新挑回来。

**第四条:可恢复。** 任意时刻 kill 掉整个 agent 进程,换一个新进程,`wake(session_id)` + `getEvents` **从上一个事件继续**。

可恢复性不是独立的一条,是前三条综合起作用的**可检验结果**。如果 kill 后不能 resume,至少有一条没做到 —— append-only 破了(有事件被覆盖)、可查询破了(没法按顺序读)、或者 session 根本就没活在场外(事件流和进程绑死了)。**§6.1 那个"A 能 resume、B 不能"的对照,就是这四条约束合起来能不能成立的最硬的考试**。

这四条合起来可以用一句话概括:**session 是场外事实流,不是场内缓存**。[[anthropic-harness-design]] 里三 agent 架构能跑四小时的长任务,不是模型变强了这么简单 —— 是因为它的 session 真正独立于任何一个 agent 进程存在。进程崩了事实不丢;换了新 agent,事实流仍然是同一条。四小时那个数字是**四条约束合格之后的自然产物**,不是被工程师熬夜堆出来的。

## §6.3 Karpathy 的两文件祖训

Session 协议的**最小充分表达**,不在任何一家大公司的架构白皮书里,在 Andrej Karpathy 的一篇 gist([[case-karpathy-autoresearch]])。Karpathy 没有用 "session" 这个词,他在写一个 autoresearch 的 pattern。但他给的那个最小 layout,就是本书后面所有 session 工程的**原型**。

两个文件。就这样。

- `autoresearch.md` —— **人类可读的 living document**。叙事层。记录 agent 当前在做什么、已经想到了什么、下一步打算怎么走。你可以在任何一个编辑器里打开它读。
- `autoresearch.jsonl` —— **append-only 事件日志**。机器层。每一次 ingest / query / decision 都 append 一条结构化 event。

Karpathy 的关键洞察只有一句:**这两个文件足够让一个 fresh agent 从死里复活**。

你可以把旧 agent 进程全部杀掉,删干净。起一个全新的 agent,把这两个文件递给它。它能从 `.jsonl` 里读完整事件流,从 `.md` 里读到人类给出的脉络,然后接着做下去。**不需要复杂的 state machine,不需要 in-memory buffer,不需要 DB schema**。两个文本文件,叙事层 + 事件层,是 session 协议的 minimum viable protocol。

下面这段就是 Karpathy 两文件模式的**同一个代码块里并列**的示意 —— 把 `.md` 当成 agent 写给未来同行的信,把 `.jsonl` 当成写给未来机器的档案:

```
# session.md (narrative · 人类可读的 living document)
## 现状
当前在研究 Stanford Meta-Harness,已完成原文阅读。下一步打算交叉
对照 Anthropic Managed Agents,找出"meta" 一词在两处的不同含义。

## 待验证的几件事
- Stanford 实测的 +7.7 分是在哪一个 benchmark 上
- 它的 proposer 具体读取哪些历史 trace 做决策

## 已放弃的路径
(暂无)

---

# session.jsonl (events · append-only,每行一件事)
{"ts":1734300100, "kind":"intent",       "actor":"user",   "text":"调研 Stanford Meta-Harness"}
{"ts":1734300102, "kind":"tool_call",    "actor":"agent",  "tool":"web_fetch", "url":"arxiv.org/abs/2603.28052"}
{"ts":1734300106, "kind":"tool_result",  "actor":"tool",   "bytes":58231, "sha256":"a3f...89"}
{"ts":1734300108, "kind":"fact_proposed","actor":"agent",  "claim":"文本分类 +7.7 分", "source_sha":"a3f...89"}
{"ts":1734300110, "kind":"wiki_write",   "actor":"agent",  "page":"stanford-meta-harness", "op":"append", "section":"实证"}
{"ts":1734300112, "kind":"verify_check", "actor":"harness","page":"stanford-meta-harness", "outcome":"ok"}
```

你注意到了吗?**两个文件里讲的是同一件事的两个面**。`.md` 是叙事 —— agent 此刻在思考什么、下一步打算做什么、哪些路已经放弃过。`.jsonl` 是档案 —— 从哪个 URL 抓到多少字节、hash 是多少、哪一条 fact 指向哪一个 sha256、哪一个 wiki 页被哪一只手改过。

一个朝人,一个朝机器。**缺哪边都不够**。只有 `.md`,新 agent 续上时没法精确引用某条 tool_result;只有 `.jsonl`,新 agent 读到一半会陷入"事件多到读不过来、不知道当前优先级在哪" 的症状。两文件并列,人和机器都有自己那一份可读性。

这份 gist 里还有一句被反复引用的话,值得把它印在这本书每一章的页眉上:

> *The tedious part of maintaining a knowledge base is not reading or thinking — it's bookkeeping.*

翻译过来大概是:"知识库里 tedious 的部分不是读、不是想,是记账"。这句话可以再推广一层 —— **LLM 应用里 tedious 的部分,也不是 prompt,也不是 reasoning,是 bookkeeping**。Session 就是 LLM 应用里 bookkeeping 层的最小形式。Karpathy 的两文件是它的最小协议,本书把这个 pattern 称为 **autoresearch 祖训**,后面每一章都会在某个位置引它。

## §6.4 ascent-research 的三层存储扩展

`ascent-research`([[case-ascent-research]])是本书作者维护的一个开源实现。它在 Karpathy 祖训的基础上做了一次**有控制的扩展** —— 不是推翻祖训,是在祖训上加两个维度。本书的写作过程本身就在用它,所以这是一份同时出现在**正文引用** 和**作者案例** 里的自我演示。

四层:

- `session.md` —— **叙事层**。对人。延续 Karpathy 的 `autoresearch.md`。
- `session.jsonl` —— **事件层**。对机器。延续 Karpathy 的 `autoresearch.jsonl`。
- `SCHEMA.md` —— **引导层**。这是 Karpathy 原版里没有的。用户在研究过程中经常会**改方向**:不是改过去做错的地方,是修订"下一步搜集的焦点"。改 SCHEMA 对应在 session 里 append 一条 `SchemaUpdated` 事件,随后的 harness 循环读新的 SCHEMA 做事,**但旧事件仍然留在场外**。这就是"方向可改、证据不改" 的具体落地。
- `wiki/*.md` —— **知识层**。跨会话的 durable 记忆,**不是对话历史**。每个 wiki 页有 `kind` / `sources` / `related` / `updated` 等 frontmatter,是**被提升过的 stable 事实**,不是临时存档。

**扩展没破坏祖训**:两文件 resume 依然成立 —— 只给任何新 agent `session.md` + `session.jsonl`,它依然能恢复到"刚才在做什么"。但新增了两件事:(1) **方向可修订而历史不动**;(2) **有效事实能被提升成跨会话的长期知识库**。

第二件事尤其关键。Ch 11 会把 wiki 层的 promotion/demotion 机制单独展开;这里只需要记住一句:**session 承担 resume,wiki 承担 knowledge**。两件不同的职责,不能塞在同一层。把它们塞在同一层的团队,最常见的症状是"越跑越慢" —— 因为 session 尺寸无限膨胀、每一次 getEvents 都要读过几百 MB 的历史、harness 每一轮都在重新 parse 几千条事件。**Knowledge 要被主动提升,不是被动堆积**。

## §6.5 一次事件流,一整条故事

前面讲事件流时给过一个片段。把它放在一个具体任务的语境里再看一次,你会感到这份颗粒度到底是在承载什么。

任务:"从网页抓一段素材、提取关键事实、更新 wiki 页"。agent 在四十秒内跑完这一轮。在这四十秒里,`session.jsonl` 里有这样几行事件被 append(已在 §6.3 的两文件代码块里给过,这里重述并解读):

- `intent · user · "调研 Stanford Meta-Harness"` —— 用户意图进入 session 的那一刻。所有的下游动作都要回指这个 intent,不回指的就是**越权执行**。
- `tool_call · agent · web_fetch · arxiv.org/abs/2603.28052` —— agent 发起的一次工具调用。参数本身被记录,以防重放时发现"当时用了错误的 URL"。
- `tool_result · tool · bytes=58231, sha256=a3f...89` —— 副作用**带 hash** 记录下来。这个 hash 会被下游所有依赖这段素材的事件引用。**上游内容变了,hash 对不上,下游验证层立刻就能知道**。
- `fact_proposed · agent · claim="文本分类 +7.7 分", source_sha=a3f...89` —— agent 从 tool 结果里提取出的断言。通常这种东西埋在 chain-of-thought 里看不见;session 把它拽出来当一等事件。`source_sha` 让这条 claim 可以**独立反向追溯到原文**。
- `wiki_write · agent · page="stanford-meta-harness", op=append, section="实证"` —— 断言被提升到知识层的那一刻。这是 session 和 wiki 之间的一条"提升通道",Ch 11 会把它展开。
- `verify_check · harness · page="stanford-meta-harness", outcome=ok` —— verification 是**独立的事件**,不是 agent 说自己"检查过了"。这是 Ch 9 讲 verification 独立性时的最直接落地。

这份颗粒度第一次见会让工程师心里发毛,觉得"太冗余了"。但只要发生过一次事故需要复盘,或者一次模型换代需要重新喂训练集,这份冗余就会立刻证明它的价值 —— 它让 agent 的每一步都可 replay、可 diff、可独立审计。

你可以把它想成:**session.jsonl 是 agent 生涯的 git log**。不是"我最近想做什么" 的笔记,是"我做过什么" 的不可篡改提交历史。一个不给自己打 git log 的工程师,team 里愿意和他合作的人会很少。一个不给自己记 session 的 agent,你愿意让它进生产的概率应该一样低。

## §6.6 原创坐标轴:Durability-Resume Axis

以上都是在 Karpathy、Anthropic 这两份奠基文上的**重述与延展**。到这里,本章要加入一条现有奠基文里**没有**的原创坐标轴 —— **durability-resume axis**。

Karpathy 给了**最小协议**(两文件),Anthropic 给了**接口契约**(`wake` / `getEvents` / `emitEvent`),但 **"session 持久化的成熟度分级"** 在 2026 年的奠基文里没有清晰坐标。这条坐标由本书作者在 `ascent-research` 的生产实战里提炼出来,是本书相对于七份参考文献的理论增量([[concept-state-durability]])。

| 等级 | 状态生命周期 | Resume 语义 | 代表实现 |
|---|---|---|---|
| **Ephemeral** | 进程级 | 无 —— crash = 从零重启 | 绝大多数 agent demo |
| **Checkpointed** | 定期写盘 | best-effort replay | [[case-karpathy-autoresearch]] |
| **Durable** | 状态本身**就是**系统记录 | kill-and-resume 是一等特性 | [[case-ascent-research]] |

三个等级,对应三种投资密度,也对应三种能做的任务复杂度。

**Ephemeral** 只够支撑单次对话的 demo。你给它讲了十分钟,它回答得很漂亮,你关掉窗口,下一次打开一切从零。今天市面上被叫作"AI 助手" 的大多数东西,都在这一级。**它没有 agent 生涯,它只有无数个独立的片刻**。

**Checkpointed** 够做个人 autoresearch 脚本 —— Karpathy 那份 gist 的使用场景。写盘是"best effort",意思是**大多数时候**可以 replay,**偶尔**会因为某次 crash 前没来得及写而丢一段。对个人探索够用,对生产场景是定时炸弹。

**Durable** 才能支撑几小时、几天、跨团队的长任务。它的核心翻转是一件思想上的事:**state 才是真身,agent 进程是附着在 state 上的临时劳动力**。这件事在现代操作系统里早就成立了 —— 内核态进程表就是这样对待用户态进程的;在 LLM agent 里,2026 年它才刚刚变成一等公民。

这条坐标轴和下一节 L0–L4 成熟度有重合但**角度不同**:L0–L4 是**能力分级**("你能做什么"),durability-resume axis 是**哲学分级**("你把 state 放在哪里")。生产 agent 系统必须同时满足 L3+ 和 Durable,否则在**跨进程** 或**跨团队** 交接时一定会出事故。这是从 "demo agent" 走向"生产 agent" 的分水岭 —— 也是本书 Part B 区别于其他 agent 教程**最硬的一条**。

## §6.7 L0–L4 成熟度 —— 判别自己到哪儿了

团队有 session 不等于做对了。本书给 session 层设五个成熟度等级,每一级都有**可检验的判别信号**:

| 等级 | 描述 | 判别信号 | 典型表现 |
|---|---|---|---|
| **L0** | 无 session | kill agent 进程,一切从零开始 | 多数 demo / chat 产品 |
| **L1** | 有日志,不可 replay | log 存在,但缺事件 schema | "聊天记录存进 DB" 型系统 |
| **L2** | 可 append、可查询 | getEvents 接口存在、事件有 type 区分 | 生产级 agent 框架的最低线 |
| **L3** | 可重组、可恢复 | wake + 选择性 context 注入 work | Anthropic Managed Agents 描述的水位 |
| **L4** | Session 可提升到 wiki | 有效事实能跨会话提升成 stable knowledge | ascent-research / 本书作者级别 |

每升一级,能做的事情都会跨过一个**质的台阶**:

- **L0 → L1** —— 让"事后排查" 成为可能。你终于有东西可以回头看了,哪怕还读不清楚。
- **L1 → L2** —— 让"agent 主动查自己做过什么" 成为可能。agent 不再是健忘的,它有一份可以自己读的档案。
- **L2 → L3** —— 让"换进程仍能继续" 成为可能。kill-and-resume 变成一等特性。生产场景的门槛就在这里。
- **L3 → L4** —— 让"agent 跨会话复用经验" 成为可能。它不再每次都从零学习同一件事。

反过来读这张表更有用:**没到 L2,就不要谈 harness**(harness 要读 session,session 读不出来,harness 没法无状态)。**没到 L3,就不要谈反脆弱**(反脆弱要求能从崩溃中学习,崩了就丢的系统学不到东西)。**没到 L4,就不要谈"共同进化"**(跨会话的经验积累没有物理载体)。

自测一下你自己的 agent 系统 —— 它在哪一级?升下一级需要改什么?大多数团队的答案是 L1 或 L2,并且他们以为自己在 L3。这种自我误判的来源很明确:**他们把"有日志" 当成了"能 resume"**。有日志不等于能 resume。两件事差了至少一根支柱。

## §6.8 五类反模式 —— 你们架构图里有哪一条

下面五类反模式在真实团队里极常见。任何一条如果在你们的架构图里能看到,就是 session 层没做对的硬证据:

**反模式一 · 把对话历史当 session。** 对话历史里的"assistant 说了什么、user 说了什么",**不是事件**。它没有 tool call 副作用、没有 env 变化、没有 decision trace、没有 source sha、没有 actor 归属。把对话历史当 session,agent 就只能 replay "说过的话",不能 replay "做过的事"。**说过的话是证据的零头,做过的事才是证据的全部**。

一个你可以立刻自检的场景:打开你们的 session 存储,随便找一条 `assistant: "我已经帮你把那两个链接改了"` 开头的记录。在这一条附近,有没有独立的 `tool_call` + `tool_result` 事件把"改了哪两个链接"具体写下来?如果没有,你们就在把 agent 的自述当成证据。Agent 的自述不是证据 —— Ch 9 会用一整章讲这件事。

**反模式二 · 把 vector DB 当 session。** 向量库擅长相似度检索,**但它丢掉了因果顺序**。session 的核心是顺序,顺序丢了就不能追溯因果。"第 29 轮的 fact_proposed 依据的是第 12 轮的 tool_result" 这种关系,在按相似度排序的向量库里是读不出来的 —— 它们不相似,但它们因果相连。

向量库可以作为 wiki 层的检索辅助(Ch 11 会讲),但**不能替代 session**。把它放在 session 位的团队最后都会遇到同一种症状:agent 能"想起" 某件相似的事,但说不清自己**为什么** 在当前这一刻会想起它。因果线丢了,只剩相似度的幻影。

**反模式三 · 用 summarization 代替原始事件。** 每隔 N 轮把前 N 轮总结压缩一次,**原始事件覆盖掉**。这是最致命的反模式,因为它销毁的是 provenance —— 每条 fact 指回哪一段原文、哪一个 hash、哪一只手做的。原始事件必须保留;summarization 是 harness 塞进 context 时的**派生操作**,不是 session 层的"修复"。

§6.2 给过的那个 dropped refs 例子,是这条反模式的具体下落。第 12 轮的 sha256 被第 22 轮的 summarization 盖掉后,第 30 轮的 verify_check 回溯失败 —— 这种事故在 Ch 13 失败模式博物馆里叫 **dropped refs**,它几乎都是这条反模式的直接后果。修法只有一个方向:**summarization 是派生视图,不是原始替代**。原始事件无论多长,都必须留在场外。

**反模式四 · Session 和 context window 同尺寸。** 如果 session 只存"能装进一次 context 的东西",那它本质上就是 context window 的一个镜像;崩了没法从更早之前恢复。Session 是场外的,**尺度应该远超任何一次 context**。同尺寸的 session 是河被削成桶的最直接的形式 —— §6.1 讲过那个比喻,这里是它的工程版。

**反模式五 · Session 可被 agent 自己写入任意内容。** agent 能 append 事件是好事,但应该由 harness 包一层**协议校验** —— event schema、actor 归属、副作用 hash。没有协议校验,agent 写进 session 的东西就不可信,下游所有 audit 失效。

这条反模式的严重性在于:agent 如果能往 session 写任意内容,它就可以**事后伪造"我之前做过 X"**,后续 verification 会被这条伪造事件骗到。Ch 12 会把"agent 能不能修改 session" 作为 reflexive harness 的**第一道边界** 展开讨论。这里只需要记住:**session 不是 agent 的私人笔记本,是它留在公共档案馆里的案卷**。案卷只能由一个有协议校验的手(harness)经手写入,不是 agent 想写什么就写什么。

这五条反模式里,前三条分别对应 Ch 13 §13.2.1(dropped refs)、§13.2.3(context collapse)、§13.2.2(hallucinated sources)三类失败模式。**session 层的反模式是下游失败模式的根因之一** —— 这一章和 Ch 13 一起读,闭环才完整。

## §6.9 Session 是其他三柱的物理载体

本章开头说 session 是 Layer 2 四柱的**第一根**。但实际上它有一个比"第一根"更准确的定位:它是**载体支柱**。后三根 —— harness / tools / verification —— 都在它上面跑。你把后三柱当成三栋楼,session 是它们共用的那块地。

**对 harness 来说,session 是它的调度对象。** Ch 7 会讲,harness 本身无状态 —— 它没有场内状态,它是 session 的**检索-重组器**。没有 session,harness 就没有东西可调度;它从 session 读事件、往 session 写事件,自身不记任何事。你可以把 harness 想成一个每次醒来先翻日历、再做今天那件事、然后关上日历睡觉的老工程师。**日历是 session。老工程师是 harness,他每次醒来都是失忆的,但日历不会失忆**。

**对 tools 来说,session 是它的审计链。** Ch 8 会讲,每次 tool call 的 input / output / actor / timestamp / parent event id 都要 append 一条事件。session 是 tool call 的完整档案;没有 session,tool 的副作用就是不可追溯的。你调了 100 次 tool,第 87 次做错了导致了 production 事故 —— 没有 session,你没法知道那一次的 input 是什么、调用者是谁、依据的是哪条 fact。

**对 verification 来说,session 是它的验证对象。** Ch 9 会讲,verification 的独立性依赖"能看到完整历史" 这件事。session 就是历史的物理载体。没有 session 就没有独立 audit —— 验证者没有可验证的对象,只能问 agent"你是不是做对了",这就变成 **sycophantic verification** 的反模式(agent 自己打自己分)。Ch 9 要排除的就是这种结构上就立不住的验证。

**这就是为什么本章必须放在 Part B 第一章**:session 不是一柱之中的普通一柱,它是其他三柱所需要的**物理载体**。一个团队想做 harness、tools、verification,但 session 还在 L0–L1,那后三柱无处安装。Session 做到 L3,是整条工程栈的先决条件。

你也可以反过来读这个论断:如果一个 agent 产品号称自己做了 harness、做了 tool permission、做了 verification,但被问到"你的 session 在哪一级" 时答不上来 —— **那它前面说的那些都是空中楼阁**。后三柱的存在价值,在 session 没立起来的前提下,等于零。

## §6.10 Session 之于 Layer 2:为什么这是第一章

回到本章开场那个"两个 agent,一个 kill 命令" 的场景。A 能 resume,B 不能。你现在应该能把这件事翻译成本章每一节的语言:

- A 的 session 满足四条硬约束(§6.2);B 的不满足。
- A 的 session 大概率走 Karpathy 两文件祖训或它的某个扩展(§6.3-§6.4);B 的 session 可能和 context window 同尺寸(反模式四)。
- A 的 session 在 durability-resume axis 上是 Durable 级(§6.6),L0–L4 里至少 L3(§6.7);B 的是 Ephemeral,L0 或 L1。
- A 系统的 harness / tools / verification 三柱都立得起来(§6.9);B 系统里,哪怕它号称"做了 agent 架构",后三柱其实都悬空。

把 A 和 B 的差别写到这个粒度,你会发现**这不是两个 agent 系统的差别,是两代工程哲学的差别**。B 那代哲学的名字,大约就是"做一个能聊天的 LLM 应用 + 一堆日志";A 那代哲学的名字,是**Layer 2 的 agent 产品工程**。后者承认一件事:agent 不是 LLM 的一个小伴侣,是一个**独立的、有生涯的、需要档案的**工程对象。档案就是 session。

所以本章是 Part B 的第一章 —— 不是因为 session 最重要、其他三柱不重要,是因为**其他三柱都在 session 这块地上盖房子**。地没有,房子连图纸都画不出来。

下一章,Ch 7,会把视角转过来问另一半问题:**session 立住了,谁去消费它?**

## 可观察信号

- Kill 你的 agent 进程,**重启后它能从最后一条事件继续**吗?(不能 = session 没立起来)
- Agent 运行到第 30 轮的时候,**它能 query 第 3 轮发生过什么事件**吗?(不能 = 没做 append-only 可查询)
- 你们做 summarization / compaction 的时候,**原始事件还在场外吗**?(被覆盖 = dropped refs 反模式)

三问任何一问答"做不到",你撞上的不是 prompt 问题、也不是 retrieval 问题,是 session 层没做对。

## 本章核心论断

1. **Session ≠ context window**。前者是场外 append-only 事实流,后者是场内一次 inference 的派生视图。河与桶的关系。
2. Session 必须同时满足四条硬约束:**append-only / 可查询 / 可重组 / 可恢复**。缺一条就不是 session,只是日志。
3. **Durability-resume axis**(Ephemeral / Checkpointed / Durable)是本书在既有奠基文之上的原创坐标;生产 agent 必须同时满足 L3+ 和 Durable。
4. Summarization / compaction 是 harness 的派生操作,**不能破坏 session 的完整性** —— 原始事件永不丢。
5. Session 是**载体支柱** —— harness / tools / verification 都在它上面跑;没到 L2 不要谈 harness,没到 L3 不要谈反脆弱。

## 本章奠基文对齐

- [[anthropic-managed-agents]] —— *"The session is not Claude's context window"* 原出处;wake/getSession/emitEvent 三接口
- [[case-karpathy-autoresearch]] —— 两文件 resume 祖训、bookkeeping 洞察
- [[anthropic-harness-design]] —— sprint 之间的 structured handoff、4-hour coding 任务的 session durability 实证
- [[case-ascent-research]] —— 本书作者级别的三层存储扩展 + durability-resume axis 原创坐标

## 本章对应 wiki 页

- [[concept-state-durability]] · [[concept-memory-layer]] · [[concept-agent-loop]]

---

**Session 立住了,第二个问题随之而来**:谁来消费这条场外事实流?它被读出来之后,谁在做"读哪一段、做哪件事、把结果写回去" 的决策?第 7 章把焦点转向**harness 本身** —— 作为 session 之上的检索-重组器,它必须无状态、可替换,不给自己攒任何私人记忆。
