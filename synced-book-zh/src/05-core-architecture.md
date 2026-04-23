# 4. 核心 Harness 架构：当前实用模型

```text
Child tool/skill (Rust/Python/Node/shell)
        |
        | emits octos.harness.event.v1 (progress/error/info)
        v
Event sink (OCTOS_EVENT_SINK transport: file/socket/stdio)
        |
        v
Runtime consumer + validation
        |
        +--> Task supervisor durable state (task_status, lifecycle_state, detail)
        |
        +--> TaskStatusChanged events
        |
        +--> Session event stream replay
        v
API (/sessions/:id/tasks + /events/stream)
        |
        v
UI status bubble / header / reload replay
```

关键规则：UI 永远是下游，不是权威。

## 4.1 生命周期模型

公开状态机：

- `queued`
- `running`
- `verifying`
- `ready`
- `failed`

内部可以存在更细粒度状态，但产品表面不应依赖不稳定的内部标签。

## 4.2 契约层

```text
Layer A: Capability manifest  (app 能做什么)
Layer B: Workspace policy     (artifact + validator + spawn contract)
Layer C: Runtime result model (lifecycle + task state + delivery evidence)
```

## 4.3 为什么类型化事件重要

没有类型化事件，进度只是“类似聊天的提示”。  
有了类型化事件，进度就是可以验证、回放和审计的数据产品。

---

### 扩展源材料


#### 来自 `06-session-pillar.md`：第 6 章 · Session 是可恢复的事实流

_源材料角色：session 作为可恢复事实流。_


#### 第 6 章 · Session 是可恢复的事实流

> **如果你的 agent 能被 kill 掉又能无缝续上**,你在读的不是这本书,是一份你们团队早就走通的内部文档。
> 对其他所有人,本章是**Layer 2 四柱的第一根** —— 也是能把后面三根架起来的**那根**。

##### 开场:两个 agent,一个 kill 命令

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

##### §6.1 从 Ch 2 接过来 —— context window 装不下的那一半

在 Ch 2 里,凌晨两点那位工程师遇到了一个症状:第十七轮说过的那句话,第四十轮 agent 不记得了。那一章给的诊断是:这不是 prompt 问题,是尺度错位 —— 他要解的问题只有在 harness 尺度上才有形式化落点。

Ch 2 把尺度的名字讲清楚了。**这一章要讲的是**:harness 尺度上,**事实具体住在哪**。

答案只有一个位置,就是 session。再精巧的 prompt、再聪明的 retrieval,都只是在一次 inference 内部解决"我此刻能读到什么"。但"我此刻能读到什么" 这件事本身,要求**某个场外的对象** 在那儿待着、能被读。没有这个对象,你再精巧的调度都是在空气里划圈。

你可以想象 session 是一条**河**,context window 是**从河里用桶舀出来的那一桶水**。桶的容量、桶里这一瞬间装的是什么,那是 prompt 和 context engineering 要关心的事。**河本身**是否一直在流、从哪里流到哪里、三天前它流过的那段河水有没有被记录下来 —— 这是 session engineering 关心的事。

**河和桶不是一回事。把河当成"一堆桶的拼接"**,你就在做一件可悲的事:你以为自己在管理长期记忆,其实你只是在管理桶里那点水的边角料。

这也是为什么 Anthropic 要专门用那句话把两件事切开。在没有这种切分的团队里,session 被悄悄等同于"最近 N 轮对话的拼接",或"context window 的一个滑动窗口"。听上去自然,但它**把一个长寿命对象退化成了一个短寿命对象**。河被削成了桶。

##### §6.2 Session 的四条硬约束

要让 session 真的承担"事实的证据仓库 + agent 的长期记忆载体" 这件事,它必须同时满足四条硬约束。这四条约束**不是设计建议,是定义**。缺任何一条,你手里那个东西就不是 session,只是一份日志。

**第一条:append-only。** 写过的事件不覆盖、不修改、不删除。你发现某条事件错了,修法不是把那条改掉,而是**追加一条新事件** —— "前一条 event_id=123 标记为失效,因为 …"。

这一条非常反直觉,因为人的直觉是"写错了就改正"。但 session 的读者不是人,是**未来的 harness、未来的 evaluator、未来的审计员**。他们需要知道的不只是"正确答案是什么",是"agent 当时相信了什么、什么时候改的信、为什么改"。把错的那条改成对的,你丢掉的不是一条错信息,是 agent 的**判断路径** —— 这是 replay、audit、diff 这三件事的物理基础。路径删了,这三件事全部做不了。

一个具体的坏场景:第 12 轮 agent 调了 `web_fetch` 抓了一段文档,产出一条 `tool_result` 带 sha256=`a3f...89`。第 22 轮 agent 以"压缩对话历史" 的名义,跑了一次 summarization,把第 10–20 轮合并成一条"调研背景"的摘要,**原始的 sha256 被覆盖掉了**。到第 30 轮 verification 跑一条 `verify_check`,要回溯"agent 当时依据的原文究竟是哪一段",它在场外找不到 —— `source_sha` 指向的那条事件已经不存在。这种"回溯不到源头"的症状在 Ch 13 失败模式博物馆里有个专门的名字,叫 **dropped refs**。它几乎总是由一次看上去"很无害"的 compaction 引起的。

**第二条:可查询。** `getEvents(session_id)` 必须能按 append 顺序返回所有事件;最好还能按 event kind、按时间窗口、按 actor 做过滤。查询不是锦上添花,是 harness 重组 context 的基础。Ch 7 会讲,harness 本身无状态 —— 它每一轮要决定下一步做什么,都要先从 session 里读。**读不出来的 session,harness 等于盲人**。

**第三条:可重组。** harness 每一轮只把"这一轮相关" 的事件片段塞进 context window,而不是"把所有历史塞给模型"。重组是 session 和"滑动窗口截断" 的分水岭 —— 前者主动挑选,后者被动裁剪。被动裁剪的系统在 context window 满的时候会开始慌(Anthropic 在 [[anthropic-harness-design]] 里把这件事叫 **context anxiety**,Ch 2 §2.4 介绍过);主动挑选的系统在 context window 满的时候**不慌**,因为它知道不在窗里的那些事实**都还在场外**,任何一条之后都能被重新挑回来。

**第四条:可恢复。** 任意时刻 kill 掉整个 agent 进程,换一个新进程,`wake(session_id)` + `getEvents` **从上一个事件继续**。

可恢复性不是独立的一条,是前三条综合起作用的**可检验结果**。如果 kill 后不能 resume,至少有一条没做到 —— append-only 破了(有事件被覆盖)、可查询破了(没法按顺序读)、或者 session 根本就没活在场外(事件流和进程绑死了)。**§6.1 那个"A 能 resume、B 不能"的对照,就是这四条约束合起来能不能成立的最硬的考试**。

这四条合起来可以用一句话概括:**session 是场外事实流,不是场内缓存**。[[anthropic-harness-design]] 里三 agent 架构能跑四小时的长任务,不是模型变强了这么简单 —— 是因为它的 session 真正独立于任何一个 agent 进程存在。进程崩了事实不丢;换了新 agent,事实流仍然是同一条。四小时那个数字是**四条约束合格之后的自然产物**,不是被工程师熬夜堆出来的。

##### §6.3 Karpathy 的两文件祖训

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

##### §6.4 ascent-research 的三层存储扩展

`ascent-research`([[case-ascent-research]])是本书作者维护的一个开源实现。它在 Karpathy 祖训的基础上做了一次**有控制的扩展** —— 不是推翻祖训,是在祖训上加两个维度。本书的写作过程本身就在用它,所以这是一份同时出现在**正文引用** 和**作者案例** 里的自我演示。

四层:

- `session.md` —— **叙事层**。对人。延续 Karpathy 的 `autoresearch.md`。
- `session.jsonl` —— **事件层**。对机器。延续 Karpathy 的 `autoresearch.jsonl`。
- `SCHEMA.md` —— **引导层**。这是 Karpathy 原版里没有的。用户在研究过程中经常会**改方向**:不是改过去做错的地方,是修订"下一步搜集的焦点"。改 SCHEMA 对应在 session 里 append 一条 `SchemaUpdated` 事件,随后的 harness 循环读新的 SCHEMA 做事,**但旧事件仍然留在场外**。这就是"方向可改、证据不改" 的具体落地。
- `wiki/*.md` —— **知识层**。跨会话的 durable 记忆,**不是对话历史**。每个 wiki 页有 `kind` / `sources` / `related` / `updated` 等 frontmatter,是**被提升过的 stable 事实**,不是临时存档。

**扩展没破坏祖训**:两文件 resume 依然成立 —— 只给任何新 agent `session.md` + `session.jsonl`,它依然能恢复到"刚才在做什么"。但新增了两件事:(1) **方向可修订而历史不动**;(2) **有效事实能被提升成跨会话的长期知识库**。

第二件事尤其关键。Ch 11 会把 wiki 层的 promotion/demotion 机制单独展开;这里只需要记住一句:**session 承担 resume,wiki 承担 knowledge**。两件不同的职责,不能塞在同一层。把它们塞在同一层的团队,最常见的症状是"越跑越慢" —— 因为 session 尺寸无限膨胀、每一次 getEvents 都要读过几百 MB 的历史、harness 每一轮都在重新 parse 几千条事件。**Knowledge 要被主动提升,不是被动堆积**。

##### §6.5 一次事件流,一整条故事

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

##### §6.6 原创坐标轴:Durability-Resume Axis

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

##### §6.7 L0–L4 成熟度 —— 判别自己到哪儿了

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

##### §6.8 五类反模式 —— 你们架构图里有哪一条

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

##### §6.9 Session 是其他三柱的物理载体

本章开头说 session 是 Layer 2 四柱的**第一根**。但实际上它有一个比"第一根"更准确的定位:它是**载体支柱**。后三根 —— harness / tools / verification —— 都在它上面跑。你把后三柱当成三栋楼,session 是它们共用的那块地。

**对 harness 来说,session 是它的调度对象。** Ch 7 会讲,harness 本身无状态 —— 它没有场内状态,它是 session 的**检索-重组器**。没有 session,harness 就没有东西可调度;它从 session 读事件、往 session 写事件,自身不记任何事。你可以把 harness 想成一个每次醒来先翻日历、再做今天那件事、然后关上日历睡觉的老工程师。**日历是 session。老工程师是 harness,他每次醒来都是失忆的,但日历不会失忆**。

**对 tools 来说,session 是它的审计链。** Ch 8 会讲,每次 tool call 的 input / output / actor / timestamp / parent event id 都要 append 一条事件。session 是 tool call 的完整档案;没有 session,tool 的副作用就是不可追溯的。你调了 100 次 tool,第 87 次做错了导致了 production 事故 —— 没有 session,你没法知道那一次的 input 是什么、调用者是谁、依据的是哪条 fact。

**对 verification 来说,session 是它的验证对象。** Ch 9 会讲,verification 的独立性依赖"能看到完整历史" 这件事。session 就是历史的物理载体。没有 session 就没有独立 audit —— 验证者没有可验证的对象,只能问 agent"你是不是做对了",这就变成 **sycophantic verification** 的反模式(agent 自己打自己分)。Ch 9 要排除的就是这种结构上就立不住的验证。

**这就是为什么本章必须放在 Part B 第一章**:session 不是一柱之中的普通一柱,它是其他三柱所需要的**物理载体**。一个团队想做 harness、tools、verification,但 session 还在 L0–L1,那后三柱无处安装。Session 做到 L3,是整条工程栈的先决条件。

你也可以反过来读这个论断:如果一个 agent 产品号称自己做了 harness、做了 tool permission、做了 verification,但被问到"你的 session 在哪一级" 时答不上来 —— **那它前面说的那些都是空中楼阁**。后三柱的存在价值,在 session 没立起来的前提下,等于零。

##### §6.10 Session 之于 Layer 2:为什么这是第一章

回到本章开场那个"两个 agent,一个 kill 命令" 的场景。A 能 resume,B 不能。你现在应该能把这件事翻译成本章每一节的语言:

- A 的 session 满足四条硬约束(§6.2);B 的不满足。
- A 的 session 大概率走 Karpathy 两文件祖训或它的某个扩展(§6.3-§6.4);B 的 session 可能和 context window 同尺寸(反模式四)。
- A 的 session 在 durability-resume axis 上是 Durable 级(§6.6),L0–L4 里至少 L3(§6.7);B 的是 Ephemeral,L0 或 L1。
- A 系统的 harness / tools / verification 三柱都立得起来(§6.9);B 系统里,哪怕它号称"做了 agent 架构",后三柱其实都悬空。

把 A 和 B 的差别写到这个粒度,你会发现**这不是两个 agent 系统的差别,是两代工程哲学的差别**。B 那代哲学的名字,大约就是"做一个能聊天的 LLM 应用 + 一堆日志";A 那代哲学的名字,是**Layer 2 的 agent 产品工程**。后者承认一件事:agent 不是 LLM 的一个小伴侣,是一个**独立的、有生涯的、需要档案的**工程对象。档案就是 session。

所以本章是 Part B 的第一章 —— 不是因为 session 最重要、其他三柱不重要,是因为**其他三柱都在 session 这块地上盖房子**。地没有,房子连图纸都画不出来。

下一章,Ch 7,会把视角转过来问另一半问题:**session 立住了,谁去消费它?**

##### 可观察信号

- Kill 你的 agent 进程,**重启后它能从最后一条事件继续**吗?(不能 = session 没立起来)
- Agent 运行到第 30 轮的时候,**它能 query 第 3 轮发生过什么事件**吗?(不能 = 没做 append-only 可查询)
- 你们做 summarization / compaction 的时候,**原始事件还在场外吗**?(被覆盖 = dropped refs 反模式)

三问任何一问答"做不到",你撞上的不是 prompt 问题、也不是 retrieval 问题,是 session 层没做对。

##### 本章核心论断

1. **Session ≠ context window**。前者是场外 append-only 事实流,后者是场内一次 inference 的派生视图。河与桶的关系。
2. Session 必须同时满足四条硬约束:**append-only / 可查询 / 可重组 / 可恢复**。缺一条就不是 session,只是日志。
3. **Durability-resume axis**(Ephemeral / Checkpointed / Durable)是本书在既有奠基文之上的原创坐标;生产 agent 必须同时满足 L3+ 和 Durable。
4. Summarization / compaction 是 harness 的派生操作,**不能破坏 session 的完整性** —— 原始事件永不丢。
5. Session 是**载体支柱** —— harness / tools / verification 都在它上面跑;没到 L2 不要谈 harness,没到 L3 不要谈反脆弱。

##### 本章奠基文对齐

- [[anthropic-managed-agents]] —— *"The session is not Claude's context window"* 原出处;wake/getSession/emitEvent 三接口
- [[case-karpathy-autoresearch]] —— 两文件 resume 祖训、bookkeeping 洞察
- [[anthropic-harness-design]] —— sprint 之间的 structured handoff、4-hour coding 任务的 session durability 实证
- [[case-ascent-research]] —— 本书作者级别的三层存储扩展 + durability-resume axis 原创坐标

##### 本章对应 wiki 页

- [[concept-state-durability]] · [[concept-memory-layer]] · [[concept-agent-loop]]

---

**Session 立住了,第二个问题随之而来**:谁来消费这条场外事实流?它被读出来之后,谁在做"读哪一段、做哪件事、把结果写回去" 的决策?第 7 章把焦点转向**harness 本身** —— 作为 session 之上的检索-重组器,它必须无状态、可替换,不给自己攒任何私人记忆。


#### 来自 `07-harness-pillar.md`：第 7 章 · Harness 是可替换的调度脑干

_源材料角色：可替换 harness 调度器与运行时接口。_


#### 第 7 章 · Harness 是可替换的调度脑干

> **Session 立住了,谁去消费它?**
> 答案是 harness。但如果你把 harness 写成一个"会记事" 的东西,你就把上一章所有工作废掉了 —— 因为事实会悄悄漏回进程里,河又被削成了桶。

##### 开场:Lance Martin 那一次"shell 进容器"

2026 年春天的某一天,Anthropic Labs 的 Lance Martin 接到一条客户反馈:"我们在你们这里跑的一个 agent 昨天半夜卡住了,能不能帮我们看一下?"

Martin 翻了翻,这个 agent 跑在 Managed Agents 的早期版本上。所谓"早期版本",指的是当时 session / harness / sandbox **塞在同一个容器里**的那个版本。他想查卡住的原因,需要读 session 日志;session 日志不在外部存储,在容器的本地文件系统里;要读它,他**必须 shell 进那个容器**。

那是客户的数据容器。里面是客户 agent 跑过的所有事情 —— 它访问过的网页、它写过的文件、它在 scratch 里思考的半成品。

Martin 当时的动作很简单 —— 打开终端、`kubectl exec -it` 进去、`cat` 一下日志。从"修复 agent" 的视角看,他只是想帮客户查一个 bug。但从合规、隐私、安全审计的视角看,**那一次 `exec` 本身就是一次事故**。工程师不应该为了"帮客户查 bug" 这件事就有权 shell 进客户的数据容器,这是一条明显的权限越界。

客户没有责备他。事实上这件事在事后的复盘里才被认出来 —— 当时大家都觉得这是"合理的工程操作"。但复盘时 Martin 的团队问出了一个更根本的问题:**为什么修一个 agent bug,我们必须 `exec` 进去?**

答案只有一句:**因为 harness 和 session 绑在了同一个进程里**。harness 没有独立出来,session 没有独立出来,sandbox 也没有独立出来。它们三件事糊在同一个容器里,任何一件出问题,都只能从里面查。里面是客户数据。所以每一次 bug fix 都是一次合规事故。

那一次"shell 进容器" 的动作,变成了本书 Part B 第二柱的起点。Anthropic 团队后来把这个 hard-won lesson 写进了 [[anthropic-managed-agents]] 的那篇 blog,并给糊在一起的那种 harness 起了一个运维圈里的老名字 —— **pet**。

这一章剩下的全部篇幅,都是在讲**怎么不要再 shell 进去**。

##### §7.1 pet 问题的四个象限

运维圈里 pet 和 cattle 是一对老词。pet 是那种"每一台都有自己特殊性格、崩了要小心伺候" 的机器,cattle 是"可替换、可抛弃、有问题就换一头" 的机器。十五年前这对词用来讲服务器,现在它原封不动地用来讲 harness。

Anthropic 团队在复盘里把"pet harness" 的典型症状拆成了四个象限 —— 四件互相独立又互相加强的坏事。任何一个生产 agent 系统里,只要 harness 写成了 pet,这四件事里至少有三件会同时发生:

**象限一 · 崩了就丢。** 容器崩 → session 跟着丢。事实流没了,agent 从零重来。这是最显眼的一种症状 —— 用户在前面跑了两小时,back-end 一个 OOM 或者一次 pod restart,两小时灰飞烟灭。用户不理解"为什么我上次跟你讲了一小时的事情今天你完全不记得",你也没法解释 —— **解释不出来,因为这件事不应该发生**。

**象限二 · 不可接 VPC。** 客户要求在自己的私有 VPC 里跑,整个架构得重写。因为 harness 绑死了你们的基础设施 —— 它依赖你们的 k8s、你们的日志栈、你们的 secret manager、你们的监控 pipeline。客户那边没有这些东西,也不会为了一个 agent 产品专门去搭。结果是这类客户要么谈不下来,要么为他们做一个 fork,维护成本翻倍。

**象限三 · debug 要 `exec`。** 这一条就是本章开场那个故事。工程师要查 bug,必须 shell 进用户数据容器。**这本身就是合规事故** —— 它在医疗、金融、基础设施这些受监管的行业里根本过不了 security review。HIPAA / SOC 2 / ISO 27001 / EU AI Act,每一个都会在这个点上卡住。

**象限四 · 客户自管难。** 这一条是前三条的合并放大:客户即便愿意在自己的基础设施里跑,他们也维护不起来。harness 有本地状态 = 客户每次部署都要接管一整套运维:崩了怎么恢复、升级怎么做滚动替换、事故怎么复盘、两个实例怎么不互相踩。每一件事都是一次"pet 的护理"。客户不是你们的 DevOps 团队,他们没法也不应该为一个"产品 feature" 接下这么重的运维负担。

四件事放在一起看,你会发现它们有一个**共同根因** —— **harness 有状态**。因为有状态,所以崩了丢;因为状态绑在你们基础设施里,所以不能下放客户 VPC;因为状态绑在容器里,所以 debug 要 `exec` 进去;因为状态的运维 = harness 的运维,所以客户接不过去。

四象限的所有叶子,都开在**同一根有状态的根**上。

想象你是 Anthropic 当时的工程师。你看着这四件事,知道修每一件事单独都能修、但都治标不治本。你真正要做的动作是:**把 harness 的状态拔出去**。状态不住在 harness,住在 session。session 独立于 harness 存在,harness 只是一个"从 session 读事件、往 session 写事件" 的轻量级消费者。崩了起一个新的,读同一个 session,继续做。

四象限的所有症状,在"harness 无状态 + session 在场外" 这一拳下同时消解:崩了不丢(状态在场外)、可接 VPC(harness 是个 stateless binary,哪里都能跑)、debug 不用 `exec`(想看 session 直接读场外存储)、客户自管简单(harness 像 HTTP 服务器一样 cattle)。

**Anthropic 的修法不是修 harness,是把 harness 重新定义**。这是第 7 章剩下所有内容的起点。

##### §7.2 Harness 的最小接口:三个函数

把上面的 hard-won lesson 落地成代码,**harness 的最小接口只有三个函数**:

- `getEvents(session_id) -> [Event]` —— **从 session 拿历史**。harness 每一轮要做决定时,先读 session。
- `emitEvent(session_id, event) -> ()` —— **向 session 写事实**。agent 每做一步,以事件形式写回去。
- `execute(name, input) -> string` —— **调用某只手**。sandbox / tool / MCP server,在 harness 视角下都是同一个调用接口。

三个函数,不到 50 行签名。但它们同时做到了几件很硬的事:

1. **Harness 不假设工具在哪** —— `execute(name, input)` 的实现可能是本机进程、远程 MCP、k8s 里跑的 sandbox、云函数、别的团队提供的 RPC。harness 不关心,因为它不管。
2. **Harness 不假设设备、OS、模型版本** —— 所有"要做什么" 都是 `getEvents` 的函数结果,所有"结果放哪" 都是 `emitEvent` 的参数。模型变、OS 变、sandbox 变,这三个接口不变。
3. **Harness 崩了可以秒起** —— 因为没有 in-memory state,新进程直接从 session 里 fetch 历史。

你注意到了吗?**这和 Unix 的 `read / write / exec` 几乎一比一**。不是巧合。Ch 4 讲过"围绕昂贵核心搭稳定抽象层" 这个四十年反复出现的模式 —— 编译器、操作系统、中间件、分布式系统,每一代都是同一个套路:**内部可变,接口稳定**。Harness 在 session 层上的三个接口,就是这个模式在 LLM 时代的又一次实例化。四十年前 Ken Thompson 写 Unix 的时候用 `read / write / fork / exec` 四个 syscall 把一整代操作系统的 ABI 钉住;四十年后 Anthropic 用 `getEvents / emitEvent / execute` 三个 harness 接口想把一整代 agent 运行时的 ABI 钉住。两个时代的钉桩手法是一样的。

把这个接口落进一段伪代码,整个 harness 的主循环大概长这样:

```python
# Cattle harness · 无状态、可秒起、可并行消费同一 session
def run(session_id: str):
    while True:
        history = get_events(session_id)                 # 读 session · 场外事实
        decision = model.propose_next(history)           # 纯推理,无副作用
        if decision.kind == "halt":
            emit_event(session_id, Event("halt"))
            break
        result = execute(decision.tool, decision.input)  # 调某只手 · 可能在任何地方
        emit_event(session_id, Event("tool_result",
                                     tool=decision.tool,
                                     sha256=hash(result)))
```

十几行。它把 harness 的全部哲学表达完了。你可以从上往下读一遍,注意几件事:

**没有 `self.xxx = ...` 这样的局部状态**。 `history`、`decision`、`result` 都是函数内的临时变量,循环下一次就忘。这是 cattle 的物理定义:进程被干掉的那一刻,它没有任何"我记得" 的东西,因为它从来没有过。

**随时可以被 kill**。下一次 `run(session_id)` 新进程起来,自动接上 session 的最后一条事件。kill-and-resume 不是 feature,是**结构直接给出的副产品**。

**你可以同时起两个 worker 读同一个 session**。比如一个 worker 扮演 planner,一个扮演 evaluator。它们不会踩彼此,因为**状态全部在场外 —— session 本身是它们的同步点**,不需要额外的锁、不需要 RPC、不需要 message queue。

如果你现在的 harness 比这段代码短、但做的事更多,那你在用**隐式状态** 补模型缺陷(比如在进程里默默 cache 了什么);如果比这段长、做的事不多,那你在写 pet(把本该在 session 层的事悄悄搬进了 harness)。长度不是关键,**每一行属于哪一类** 才是。

下一节讲的就是**哪一类**。

##### §7.3 每写一行 harness 代码都要问:补缺陷 vs 守协议

Harness 无状态这件事立住之后,第二个问题立即来:**harness 内部到底该写什么东西?**

本书给出的硬判据只有一句:

> **每一行 harness 代码,都必须能回答 —— 这是在补模型缺陷,还是在守接口协议?**

两类代码表面上都是"让系统更可靠的辅助逻辑",长得像孪生兄弟。但它们的**寿命完全不同**。Ch 4 把这个区分讲过,这一节把它落到 harness 内部的具体案例。

| 一段 harness 代码 | 分类 | 寿命 |
|---|---|---|
| "模型不会规划,所以写死 5 步 DAG" | **补模型缺陷** | 下一代模型会规划 → 拆 |
| "模型会幻觉,所以加 retrieval 强制验证" | **补模型缺陷** | 模型更强 → 冗余 |
| "模型不会压 context,所以写手工 compressor" | **补模型缺陷** | 模型自带 context reset → 废弃 |
| "模型输出 JSON 会多引号/缺逗号,写修复器" | **补模型缺陷** | 下一代 JSON 模式稳了 → 删 |
| "工具权限边界必须守住,写 allowlist 检查" | **守协议** | 永远需要 |
| "session 必须可恢复,写事件持久化" | **守协议** | 永远需要 |
| "verification 必须独立,写 evaluator 隔离" | **守协议** | 永远需要 |
| "tool result 必须可审计,写 sha256 归档" | **守协议** | 永远需要 |

前四行是**赌"模型不会变强"**,后四行是**押"接口要长期稳定"**。前者在 4.5 → 4.6 这一轮升级里已经被证明要拆 —— Anthropic 的同一篇 blog 里提到,他们自己的 harness 在升级之后拆掉了大约 40% 的代码,全都是这一类补缺陷的东西。后者在同一轮里**只增不减**,每一条都活得比任何一次模型升级都长。

**在 harness 里攒技术债的团队,大多是把大量时间写了前四行**,还以为自己在做"健壮性工程"。本章的硬建议是 —— **把每一行上面那张表的分类**写在代码注释里。每一次 code review 都问这个分类问题。超过 40% 的行数落在"补缺陷" 列的 harness,它的**净资产等于零**,因为下一次模型升级你要把它们全部拆掉。

这条判据还有一种更锋利的问法:

> **"如果明天 GPT-6 / Claude 5 发布,这段代码还需要吗?"**

答"不需要" 的那些行,是 pet 式补丁。答"需要" 的那些行,才是接口层真正能复利的稳定投资。你可以把它想成一把钞票过火:补缺陷的那一半一烧就没,守协议的那一半烧完还在 —— 而且下一次同样的火势中,它的相对价值反而更高。

##### §7.4 Agent loop 的所有变体,都是 harness 的实例

从 2023 到 2026,几乎每隔几个月就会有一种新的"agent loop 变体" 冒出来:ReAct / Reflexion / Plan-and-Execute / Autoresearch / CodeAct / Deep-Research / Tree-of-Thoughts / 还会继续有。每一种都号称自己"更强" —— 更 general、更稳、更高效、更适合 X 类任务。读者因此被迫反复问同一个问题:**我应该选哪个**?

本章的答案是:**你问错了**。

Agent loop 的变体学,**都是 harness 的具体实例**。ReAct 的 "Thought → Action → Observation" 循环,是 harness 的一种排程方式;Reflexion 的 "Act → Reflect → Revise" 是另一种;Plan-and-Execute 是先 `planner.emit` 再 `executor.emit` 的两阶段;Autoresearch 是 ingest-driven 的长程 loop;Deep-Research 是多源搜索 + 合成的一族 loop。每一个都是对 `getEvents / emitEvent / execute` 三接口的**一种具体用法**。

变体**可替换**,稳定的是它们之间的**接口**:都要读 session、都要写 session、都要 execute 工具。换一个变体,harness 以外的部分(session 协议、tools、verification)**不用改**。

这件事再推一步就很关键了 —— 不仅**人**可以换变体,**agent 也可以**。Stanford IRIS Lab 的 Meta-Harness([[stanford-meta-harness]])用一个 outer-loop proposer 在**源码级别** 搜索 harness 变体:它读取所有历史候选 harness 的源码、分数、执行 trace,据此提议一个新变体,跑、打分、淘汰、再提议。这是一个典型的进化式搜索循环,只是被搜索的对象不是 prompt、不是 weight,是 **harness 的源码本身**。

实测收益:文本分类 +7.7 分、上下文 token 消耗 −75%(同分下)、数学推理 +4.7 分,TerminalBench-2 上超过手工 harness。

这把"可替换" 命题推到了极限。它同时有两层含义:

- **对人可替换** —— 换一个团队成员接手,他能把 ReAct 换成 Autoresearch,harness 以外的东西不动。
- **对 agent 可替换** —— 一个 proposer agent 在源码级别自动演化出新 harness 变体,**超过手工调版本**。

两层都成立的前提是**同一件事**:harness 必须无状态、必须在稳定接口后面。接口不稳,既换不了人、也换不了 agent —— 因为每换一次都要跟着改 session 协议、改 tools、改 verification,代价指数级上升。接口稳了,换谁都一样,换多少次都不痛。

这里要小心一个术语混淆:Stanford 和 Anthropic 都在用 "meta" 这个词,但他们指的不是同一件事。[[anthropic-managed-agents]] 的 meta-layer 是**稳定接口的 meta**,设计者是人类平台工程师,承诺的是"接口几十年不变";它的优化目标是可复用、可问责。[[stanford-meta-harness]] 的 meta-layer 是**自动搜索的 meta**,设计者是一个 proposer agent,每任务重新搜一遍;它的优化目标是单任务最优性能。

两者**正交**,不是互斥 —— Anthropic 钉住稳定接口,Stanford 在稳定接口的内部做自动搜索。前者是地基,后者是地基上的房子。地基不稳,你没法在上面盖房子;地基稳了,你甚至可以让房子自己长出新造型。

所以"我该选哪个 agent loop 变体" 这个问题,本质是问错了尺度。正确的问题是:**我的 harness 接口够不够稳,稳到换一种 loop 变体,我不需要改 session 协议、不需要改 tools、不需要改 verification?** 接口够稳 —— 换谁都行。接口不稳 —— 你选哪个 loop 都救不了。

##### §7.5 "Many brains, many hands" 的调度含义

[[anthropic-managed-agents]] 里有一句图景式的表述 —— **Many brains, many hands**。一个 brain 调度多只手;多个 brain 并行消费同一 session。这幅图景之所以成立,**完全依赖 harness 无状态** 这件事。

想象一个生产场景:一家工程团队让 agent 长周期地开发一个 web 应用。架构上长这样:

- 一个 **Planner brain** 读 session,提出下一个 sprint 的目标,emit 一条 `sprint_contract` 事件。
- 一个 **Generator brain** 拿 sprint 目标、读 session 里的相关代码事件,生成代码 diff,调用 sandbox (**hand 1**) 跑 build + test,emit 产出事件。
- 一个 **Evaluator brain** 独立读 session,拿 Generator 的产物,在一个隔离的 Playwright sandbox (**hand 2**) 里跑验收,emit `verify_check` 事件。

三个 brain 共享**同一条 session**,但各自无状态,可以独立重启,可以独立替换 —— 明天你把 Planner 换成 Claude 5,Generator 和 Evaluator 不用改一行。你甚至可以让两个 Evaluator 并行跑(一个跑功能、一个跑视觉),他们不会踩彼此,因为它们都只 append 事件,不修改已有事件。这是**场外事实流** 做为同步原语的天然好处。

[[anthropic-harness-design]] 里那个能跑四小时的三 agent 架构(planner / generator / evaluator),就是这个图景的一次工业级实证。retro game maker 的 benchmark 里,solo Claude 跑 20 分钟出 $9 的活,三 agent 架构跑 4 小时、花 $80、产出生产级的结果 —— 两者同一个模型,差的全是 harness。三 agent 能跑 4 小时的前提,**全在于 harness 无状态 + session 外置** 这个分层。没有这一层,协作成本会指数增长,必须加同步机制、加锁、加 RPC。

所以"多脑多手" 不是一个市场话术,是一个工程事实。它之所以成立,是因为 brain 和 hand 之间解耦了 —— 多个 brain 共享一条 session,每个 brain 调自己需要的 hand,各自没有历史、只看 session,谁崩了谁起。没有 session + stateless harness 这对组合,这件事做不起来。

Ch 14 会把"many brains, many hands" 讲成本书的终局愿景,整本书结构上要到最后一章才展开。但它的**工程前提**完全在这一章 —— **harness 无状态**。Ch 14 要做的只是把这个前提发挥到它应有的图景。没有这一章,Ch 14 的图景是空中楼阁。

##### §7.6 Harness 不是一个人写的,是多年积累的

再讲一件事,免得读者合上这一章后以为"harness 是一个人、一个季度能写完的东西"。**它不是**。

一个生产级的 harness,是团队**多年积累**的工程资产 —— 它不是代码仓库里几千行 Python,是包含 session 协议、tool 权限矩阵、verification 接口、observability 管线、failure mode 博物馆的 playbook 的一整套东西。每一项都有血的教训在后面。

**harness 的价值是复利的**。每一次踩坑、每一次事故、每一次模型升级后的清理,都把 harness 又稳住一点。一个写了三年的 harness 和一个写了三个月的 harness,看代码行数可能差不了多少,但**前者里每一行都是事故复盘的结晶,后者里每一行都还没被应力测试过**。这不是比喻 —— Ch 13 失败模式博物馆讲的就是"把事故变成 harness 资产" 的方法论。博物馆不是为了追溯旧痛,是为了让下一次事故不会再踩同一个坑 —— 而避免的方式,就是把教训写进 harness 代码、写进 spec、写进 verification 规则。

这也是为什么本章的判据非常重要:如果你在 harness 里大量攒了"补模型缺陷" 的代码,那你攒的不是复利,是**每一次模型升级都要归零的负利**。攒对了类 —— 守协议 —— 那 harness 在每一次模型升级后**变得更值钱**,因为同一个稳定接口上能跑更多、更复杂、更关键的 agent。

##### §7.7 Pet vs Cattle 对比表

本章到这里,可以把 pet 和 cattle 两种 harness 哲学放进同一张表做最后的对比:

| 维度 | Pet Harness | Cattle Harness |
|---|---|---|
| 状态位置 | in-memory 本地 | 外部 session |
| Crash 恢复 | 重启 = 重来 | `wake()` 秒起 |
| 并行性 | 多实例会冲突 | 多实例共享 session 无冲突 |
| 客户 VPC 部署 | 绑死你的基础设施 | 任意 VPC 都能跑 |
| 调试 | 需要 shell 进容器 | 读场外 session 即可 |
| 升级 | 停机窗口 | 滚动替换 |
| 对 agent 搜索开放 | 否(状态与代码耦合) | 是(Stanford Meta-Harness 的前提) |
| "补缺陷" 代码占比 | 通常过半 | 必须降到最低 |

如果你现在的 harness 在左列占了三项以上,那你在造 pet。造 pet 短期更快(因为不用设计接口),长期更慢(因为每一次变化都是重新手作)。本书的完整立场 —— 从 day 0 就把 harness 做成 cattle,即使开头看上去像过度工程 —— 因为它是 session 之后,agent 系统第二项能复利的工程资产。

**你愿不愿意从 day 0 就做成 cattle**,可能是 2026 年 Layer 2 团队之间最大的分水岭。做对的那些团队,两年后会有一个"在任何 VPC 里秒起、谁都能来 debug、谁都能接手、可以被 agent 自己改进" 的 harness,它的价值每一次模型升级都在膨胀。做错的那些,两年后会有一个"每次模型升级要重写一半、客户只能选你们的 cloud、debug 要 oncall 工程师 shell 进去" 的 harness,它的价值每一次模型升级都在流失。

两年累计下来,两边差的不是一倍。

##### §7.8 回到 Lance Martin 那一次 `exec`

本章开场那一次 `kubectl exec`,现在可以用一整章的语言重讲一遍。

那一次 `exec` 的成本不是"半小时的调试时间",是**一次合规事故 + 一次架构债务的利息**。合规事故是工程师有了不该有的权限,架构债务是 harness 和 session 糊在同一个容器里所以只能这么修。两件事的根都是**harness 有状态**。

Anthropic 的修法不是"以后别 exec 了",是**让 exec 变得没必要** —— 把 harness 无状态化,把 session 搬出去。之后的工程师再 debug,读的是场外 session 存储,不需要进任何客户数据容器;事实上,**他甚至不需要和客户的基础设施建立任何连接**。session 是纯数据,可以被导出、被 audit、被另一个 agent 作为输入,不涉及任何与客户容器的交互。

你读到这里,应该能把"harness 无状态" 从一句抽象原则翻译成一个具体的合规-运维-架构三重收益了:

- 合规:没人需要 shell 进客户容器 → HIPAA/SOC 2/EU AI Act 全部过关。
- 运维:harness 是 cattle,崩了起一个新的,客户不用接手运维负担 → 客户能在自己的 VPC 里跑。
- 架构:harness / session / sandbox 三件事解耦 → 每一件可以独立升级,可以独立替换。

这三重收益合起来,就是 Anthropic 2026 年之所以敢说"我们把 agent 卖进客户 VPC 了" 的**物理基础**。它不是市场话术,是 Martin 那一次 `exec` 之后的四个月里,团队在架构层做的一次硬拆分。

同样的拆分,每一个做 Layer 2 agent 产品的团队都要自己做一次。**做得越晚,`exec` 进过的次数越多,以后要付的合规利息越厚**。

##### 可观察信号

- **kill 掉 harness 进程再起一个新的,session 能不能从上一个事件继续**?能 = cattle;不能 = pet。
- 升级模型一代(比如 Sonnet → Opus),你的 harness 要改**多少行**?改的那些行里,有多少是"补缺陷"、多少是"守协议"?
- 把 agent loop 从 ReAct 换成 Plan-and-Execute,**harness 以外的部分要改多少**?改得越多,说明接口越不稳。

##### 本章核心论断

1. Harness 必须**无状态** —— 状态住在 session,harness 是 cattle,不是 pet。Pet 四象限(崩了丢 / 不可接 VPC / debug 要 exec / 客户自管难)共用同一根有状态的根。
2. Harness 的最小接口只有三个:**getEvents / emitEvent / execute**。类比 Unix 的 read/write/exec,不是巧合 —— 是"稳定抽象围昂贵核心" 模式的又一次实例化。
3. 每写一行 harness 代码都要问:**补模型缺陷 / 守协议**。前者是技术债,模型升级就要拆;后者是稳定投资,每一次升级都更值钱。
4. Agent loop 的所有变体(ReAct / Reflexion / Plan-and-Execute / Autoresearch / CodeAct)都是 harness 的具体实例,可替换。**"可替换"有两层含义:对人可替换(Anthropic),对 agent 也可替换(Stanford Meta-Harness 的源码级搜索)** —— 两层的前提是同一件事:harness 无状态 + 接口稳定。
5. Brain-hand 解耦是**many brains, many hands** 的工程前提 —— Ch 14 终局愿景的物理基础,全在这一章。做对这一章,你在 Ch 14 的任何一段都不用再操心架构成立性。

##### 本章奠基文对齐

- [[anthropic-managed-agents]] —— pet vs cattle、wake(sessionId)/emitEvent(id,e) 原接口、brain-hand 解耦
- [[openai-harness-engineering]] —— "harness 移上一层" 的立场声明
- [[fowler-on-harness]] —— harness 内部的 guides + sensors 治理、Agent = Model + Harness 等式
- [[stanford-meta-harness]] —— "可替换" 的极限:agent 自动搜索 harness 变体

##### 本章对应 wiki 页

- [[concept-agent-loop]] · [[concept-harness]]

---

**Harness 负责调度,自身不记事**。第 8 章把焦点转向 **harness 调度的那些"手"** —— 工具词汇表。工具是 agent 能作用于世界的全部边界,也是事故最常发生的地方。Harness 是脑干,session 是档案,tools 是**手**;三者合起来,agent 这个工程对象才真正有了肉身。


#### 来自 `08-tools-pillar.md`：第 8 章 · Tools 是可问责的动作词汇表

_源材料角色：tools 作为可问责动作词汇表。_


#### 第 8 章 · Tools 是可问责的动作词汇表

> **命题**:Tool **不是** 给 agent 的 API 集合,**是**动作词汇表;词汇表的三个硬要求是**正交、可问责、与权限绑定**。定义词汇表的人,就在定义 agent 的社会契约。

##### 开场:一个工程师盯着 47 行 JSON 看了很久

一位负责 agent 平台的工程师,被拉进一间会议室做 tool 清单的季度复查。投影仪上是一份 `tools.yaml`,47 个工具,从 `read_file` 到 `send_slack_message` 到 `cancel_subscription`,按加入顺序排列。安全团队的人问他第一个问题:

> "第 7 号这个 `invoke_workflow`,你能一句话说清楚它是做什么的吗?"

他看了几秒。然后他开始解释:这个工具是三年前加的,当时的需求是让 agent 能触发一条 Zapier 自动化流,但后来 Zapier 换了接口,于是内部又拿它包了一层 Slack 提醒,再后来某个客户要求接入他们的 CRM,于是它又加了一段"如果目标系统是 Salesforce 就走另一条分支"的逻辑……一句话解释不下来。

安全的人接着问第二个问题:"如果一个 agent 同时调用 `read_file` 和这个 `invoke_workflow`,能不能把任何一个文件的内容通过某条 workflow 路径发到你不信任的第三方?"

这位工程师第二个问题也答不上来。不是因为答案是"能",也不是因为答案是"不能",是因为他从来没有**以词汇表组合的视角**看过这份 tool 清单。在他的心智模型里,这 47 个工具是 47 个独立的 API,每个的安全性各自评估过。**他从没把它们当成"词" 来看,所以也没想过词与词能拼出什么句子**。

本章要讲的就是这件事:为什么 tool 不是 API 集合,为什么它是一份词汇表,以及,作为词汇表的设计者,你每次加一个词都在给 agent 的行为空间扩张一块新的语法区域 —— **哪怕你自己没意识到**。

Ch 6 讲过 session 是事实的载体,Ch 7 讲过 harness 是调度的脑干。两根柱立起来,到这一步 agent 还没真正作用于世界。真正让 "candidate action" 变成"real operation" 的那一步 —— 改一份文件、发一封邮件、扣一次款 —— 都发生在 tools 这一层。[[milvus-execution-layer]] 用一句话把这件事压缩到底:

> *The brain generates candidate actions; the execution layer turns those candidates into real operations. Without it, every agent action has to fit inside one prompt/response — which does not scale past toys.*

**Tool 是 agent 面向世界的那扇门**。门的形状、宽度、门禁规则、哪两扇门能同时开、哪两扇门绝不能同时开 —— 全部是工程师**一次性**的设计决策,之后 agent 的所有行为都会被这些决策塑形。开头那位工程师面对的困境,不是他写得不认真,是他把自己的工作**误认成了"加 API"**,而不是"修订词汇表"。从第一种视角到第二种视角的切换,就是这一章要钉下的那根桩子。

##### §8.1 为什么叫"词汇表",不叫"API 集合"

把开场那场会议再往下推一步。如果你是那位工程师,散会之后你最该改的不是某个工具的实现,是**你对这件事的词**。你过去每次讨论工具,脑子里浮现的是什么?是不是"给 agent 一组 endpoint",就像后端给前端提供 REST API 那样?这个心智模型在 agent 语境下会漏掉一整层问题 —— **它漏掉的那一层,恰恰是事故最常发生的那一层**。

**API 集合** 的心智模型是:你列出若干调用端点,每个端点独立评估 —— schema 对不对、权限对不对、错误处理对不对、速率限制对不对。你心里的图景是一个**列表**,每一项是一个独立单元。这个图景适合描述"前端调后端" 那一类场景,因为在那里,调用者的意图是人预先写好的,每次调用只产生一个独立的副作用,不存在"调用者自己组合"这回事。

**Vocabulary** 的心智模型完全不同。每个 tool 是一个"词";词与词之间的**组合** 会产生新语义;治理词汇表的人要同时考虑三件事:每个词的含义、词与词的组合会拼出什么句子、**哪些句子不应该被拼出来**。这里的调用者不是人,是 LLM —— 一个会**自己组词**、会在跨调用之间**构建组合策略**、会在发现某组词能够达成某个隐含目标时**主动选用该组合**的调用者。你设计的不是 endpoint 列表,是**一种语言的语法**。

这个区分不是文字游戏。它决定两件事。

**第一件事**:你是否会主动设计 tool 的**正交性**。如果你认为你在维护一组 API,那 "是否重复" 只是代码洁癖层面的问题 —— `read_file` 和 `cat_file` 重合了,无非浪费一行文档。但如果你认为你在维护一份词汇表,那两个词表达同一动作**本身就是语义污染**:模型在两个同义词之间选时会迷茫,在文档里看到两条几乎相同的描述会开始幻觉参数,在事故复盘里两个工具的行为差异会被埋到 git blame 里。**正交不是美学,是语言治理**。

**第二件事**:你是否会主动设计**组合不变量**。API 集合的心智模型不会问"A 和 B 的组合能做什么",因为它默认每个端点各自评估就够了。词汇表的心智模型必须问 —— 因为词本来就是为了被组合。一个词汇表里有 `read_file`、有 `send_email`、有 `list_directory`,**单独看每一个都合规**;但组合起来的那个句子是"把任意文件的内容通过邮件发出去"—— 这是组合语义,不是单点语义。Ch 13 会把这类失败专门命名为 **tool escape**(工具逃逸),并把它当作 session / harness / tools / verification 四柱失败的归因样本之一。

把这两件事加起来,可以得到一条判据。**当你加一个新 tool 的时候,你应该问:它与现有词汇表每一个词的组合,分别会生成什么样的新句子?** —— 如果你答不上来、或者回答"这问题太大没法列举",那你还在用 API 集合的心智做词汇表的工作。这正是那 47 行 YAML 安全复查的真正问题:**它从来没被当作语法来治理过**。

##### §8.2 三个硬要求:正交、可问责、与权限绑定

一份合格的 tool vocabulary 必须同时满足三件事。缺一件,它就只是个 API 清单。

###### 要求 1 · 正交 —— 每个词有一件独立的事

正交是词汇表里最接近"语言洁癖" 的要求,但它不是美学偏好,是**可用性前提**。一个 LLM 在面对 80 个工具的清单时,会比面对 15 个工具时**显著更容易选错**。这不是因为模型不够聪明 —— 人类工程师也会。选项越多、语义重叠越大,**选择本身** 就变成一个独立的决策成本。

| 反模式 | 正交替代 | 词汇表视角的解释 |
|---|---|---|
| `do_everything(json_payload)` | `read_file / write_file / run_cmd / fetch_url` 拆开 | 一个词不能承担五种语义,否则模型学不会在什么时候用它 |
| `smart_action(goal: str)` | 明确的动词 + 结构化参数 | 把"决定怎么做"这件事从 tool 里抠出来,还给 agent |
| `execute_task(task_name)` + 另一个 `run_job(job_id)` 并存 | 选一个名字统一 | 两个词表达同一动作,等于给调用者制造永恒的二选一困境 |
| `process(input, mode="read")` vs `process(input, mode="write")` | 拆成 `read_X` / `write_X` | 动词被藏在参数里,schema 无法在调用前表达约束 |

判别标准很简单,也很残酷:**"能一句话说出这个 tool 的职责" 吗?** 说不出来的那个,就是**不正交的物证**。开场那位工程师面对的第 7 号工具之所以解释不下来,根本原因不是他没准备,是这个工具从语义上就不应该存在 —— 它是三年里三次不同需求压在同一个名字上的结果。按词汇表视角,他应该做的不是"更好地描述它",是**拆**:一个词还给 Zapier 触发,一个词还给 Slack 通知,一个词还给 CRM 分支路径。三个正交的词,加起来覆盖原来那一个模糊的词,才能重新被治理。

正交不等于"越多越好"。[[concept-tool-vocabulary]] 里提到的**词表规模陷阱** 依然成立 —— 工具太少 agent 做不了事,太多选择崩溃、幻觉参数。经验值 10–20 个工具是甜区,视任务域偶有上下。正交意味着**每个词的职责边界清晰、不与其他词重叠**,不意味着要把一件事拆到最碎。一个拆成 50 个微型工具的清单,可能比一个混乱的 10 个工具清单**更难治理**,因为组合爆炸让组合安全性变得不可枚举。

真实团队的做法是:**先把词汇表规模压进甜区,再在甜区内部保证正交**。不是"先拆成 50 个再合并",也不是"先写 5 个糊的再拆"。从第一天就按词汇表治理。

###### 要求 2 · 可问责 —— 每次调用都留痕

一个词被说出来,它**说了什么** 必须有记录。在词汇表视角下,这不是"调试方便" 的工程习惯,是**可问责性** 的结构性要求。没有留痕的调用,在事后复盘时等于没发生过 —— 你只能靠 agent 的自述去拼凑,而 agent 的自述不是证据(Ch 9 会把这一点讲透)。

每次 tool call 必须同时产出以下结构化信息,一次不少地写进 session:

- **tool name** —— 调的是词汇表里的哪一个
- **input** —— 参数结构化记录,不是自由文本
- **output / output sha256** —— 返回值(小的直接存,大的存 hash + blob 路径)
- **actor** —— 由哪个 agent / 哪条 persona 发起
- **timestamp** —— 精确到毫秒
- **parent_event_id** —— 这次调用是在回应哪条上游事件

这六件事放在一起,**一次 tool call 就是一次完整可审计的事实**。任何事后的复盘、replay、diff 都需要这套字段;少一个字段,都可能在某次事故里变成"不可复现的黑洞"。[[concept-observability]] 讲了为什么 observability 必须是 harness 的一等公民,本章把它具体到 tool 层 —— 每一次词被说出来,都必须有一条可追溯的证据。

你可能会觉得六个字段是冗余。但想一下这样的场景:两个月后审计团队来查某次事故的责任链。agent 在事故当天做了 312 次 tool call,你想找的那一次在序列的中段。如果 actor 字段不全,你不知道是哪个 sub-agent 发起的;如果 parent_event_id 缺失,你不知道它是回应哪条用户请求的;如果 output sha 没存,你不知道它当时拿到的返回值是不是后来被静默修改过的版本。**缺任何一个字段,这次调用都会变成审计链上的断点**。断点在合规视角下不是技术问题,是**责任不可追溯**,这是监管能直接判定不合格的一类缺陷。

###### 要求 3 · 与权限绑定 —— credentials 不进 sandbox

[[anthropic-managed-agents]] 里,Lance Martin 团队给出了一条本书反复引用的原则 —— 他们的原话直接摆在 2026 年 4 月那篇工程 blog 里:

> *Credentials never reach sandboxes where Claude-generated code runs; MCP proxy patterns handle credential fetches without exposing tokens to the model.*

原文的立场锋利得不加修饰 —— 把权限收窄给一个 "narrow-scoped token" 放进 sandbox,本质上是**在赌模型不会想出方法滥用这个 token**。模型越来越聪明,这种赌局越来越不划算。

narrow-scoped token 的问题不在"scope 不够窄",在于**它把安全边界建在"能力假设" 上**。你发一个只能读某个 S3 bucket 的 token,你的假设是"模型不会想出办法把这个 token 的能力扩大"。但模型拿到这个 token 之后,能做的事不止它表面的 scope —— 它可以把 token 原样输出到某条日志、某封邮件、某个 issue;它可以在 token 过期前反复调用,消耗配额;它可以把 scope 内但不该读的内容(比如另一个用户的数据,哪怕在同一 bucket 里)合法地读出。**这些都是"在 scope 内但不合意图" 的调用**,token 本身拦不住。

更稳的做法是把安全从**能力级**(相信模型不会滥用)升级到**结构级**(即使模型想滥用也拿不到凭证):

- **凭证不进 sandbox** —— sandbox 里的 agent 看不到任何真实 token / key / secret。物理上看不到。
- **MCP proxy 做凭证桥接** —— sandbox 里的 agent 发起"请求 X",proxy 在外部 vault 里取真实凭证、发出实际 HTTP 请求、把 sanitized 结果传回。凭证在 proxy 的进程空间里,从未跨进 sandbox 的进程空间。
- **Vault 持有凭证** —— 凭证的生命周期由 vault 管,不由 agent 管。轮换、撤销、审计都是 vault 的职责,不借 agent 的手。

这套设计让"即使 agent 被越狱,它能做到的最多是**发起被 proxy 审核过的请求**",而不是"把 token 原样泄露到外部"。两者的失败半径差几个数量级。

举一个组合逃逸的具体例子,把这件事落到地面。某团队给 agent 配了两个看起来都合规的工具:`read_file(path)`,只能读 `/workspace/` 下的文件;`send_email(to, subject, body)`,只能发给该用户**已验证过的邮箱**,body 限 2MB。单独审计每个工具都通过了安全 review。部署半年后事故复盘发现,一位用户通过特定提示,让 agent 把 `/workspace/` 下的一个敏感配置文件读出来,拼成 body,发到"自己已验证的邮箱"—— 然后那个邮箱是攻击者注册的、并提前通过社工完成了邮箱验证。单独看每个 tool 都守规矩,组合起来就是**完整的数据外发链路**。

narrow-scoped token 防不住这类事,因为 token 在每一步都合规。防住它的不是更窄的 token,是**结构性分层**:让 "read + send" 的组合本身必须经过一条**组合策略检查**(比如"任何把文件内容放进外发正文的操作都要过二次确认"),检查发生在 proxy 而不是 agent 里。**这是把"语义"的治理放到和"语法"同一级的事**。[[anthropic-managed-agents]] 把这种设计哲学总结为 "不赌未来"—— 不押注模型的当前弱点,因为弱点会随升级而消失;要押注**结构** 的持久性,因为结构不随模型变。

##### §8.3 一个 tool call 事件在 session.jsonl 里长什么样

把 §8.2 三条要求合起来,落进 Ch 6 讲过的 session.jsonl,一次 tool call 及其结果对应两条事件,合并放在一起看更直观:

```json
[
  {
    "ts": 1734301000,
    "kind": "tool_call",
    "actor": "agent:generator",
    "parent_event_id": "evt_plan_17",
    "tool": "write_file",
    "input": {"path": "/workspace/foo.py", "content_sha256": "bd9...a1"},
    "guards_passed": ["path_in_workspace", "no_binary_content"],
    "status": "pending"
  },
  {
    "ts": 1734301001,
    "kind": "tool_result",
    "actor": "tool:write_file",
    "parent_event_id": "evt_tool_call_42",
    "output": {"bytes_written": 1247, "new_file_sha256": "4c3...f9"},
    "sensors_passed": ["diff_within_sprint_scope", "no_forbidden_imports"],
    "status": "ok"
  }
]
```

这一对事件放在一起是一个完整的证据单元。谁在什么时间发起、参数结构化是什么、调用前的 guard 过了哪些、执行结果是什么、调用后的 sensor 过了哪些 —— 一次 tool call 可以被**完整 replay**。事后的 audit 或 debugger 只需要读这两条事件,不需要 agent 的任何自述、不需要 harness 的任何 console log。

注意 `guards_passed` 和 `sensors_passed` 两个字段。它们不只是"做了哪些检查",更重要的是 —— 它们把 §8.4 要讲的 feedforward / feedback 两类控制,**以事件的形式固化进了证据链**。事后审计问"你们有没有检查路径合规",回答不是口头的"有",是**事件里列着 `path_in_workspace`**。这条记录在 agent 运行时就写入了,不可能事后补造。

这种结构化 event 是 §8.2 "可问责" 要求的具体产物。缺任何一个字段都会让审计链断掉 —— 这也是为什么本章要把"可问责"和"正交" 放在同一级的要求上。**Agent 能做什么,取决于词汇表的正交设计;你事后能不能追溯它做了什么,取决于每次调用的可问责结构**。这两件事不是 trade-off,是同一个语言系统的两半。

##### §8.4 Guides + Sensors —— Fowler 的两类控制在 tool 层的落地

[[fowler-on-harness]] 里 Fowler 的核心分析框架是 **computational controls(deterministic)** 和 **inferential controls(non-deterministic)** 两分。放到 tool 层,这个分类变形为一对更好用的工程术语 —— **guides(feedforward)** 和 **sensors(feedback)**。它们在每一次 tool call 的时间轴上,占据调用**之前** 和**之后** 两个位置。

###### Guides:调用之前的守卫

Guide 在 tool 真正执行**之前** 起作用。典型实现是 tool schema、argument validation、allowlist、dry-run 预演。它的目的只有一个:**在副作用发生之前,拒绝不应该发生的那些调用**。

举一个具体例子。某团队的 `write_file(path, content)` 的 guide 长这样:

- 路径必须在 `/workspace/` 下(allowlist)
- content 不能是二进制(content-type 检查)
- 写入前先 dry-run 一次,看这次写入是否会让仓库中的 `.gitignore` 失效
- 写入前比对 path 的 lock 状态,确认没有别的 agent 正在写同一路径

这几条检查做完,这次 `write_file` 才真正落盘。任何一条挂掉,tool 返回 `status: "guard_failed"`,连同失败原因一起写进 session;**副作用从未发生**。

一个真实失败场景:某次 agent 在迁移代码时,意图"把旧文件移到 archive/"—— 它用 `write_file` 直接写 `/archive/old_foo.py` 作为目标。因为 `/archive/` 不在 `/workspace/` 下,path allowlist guard 拦住了这次调用。session 里留下一条 `guard_failed` 事件,attached reason 是 `"path_not_in_workspace"`。agent 看到这条 feedback,下一轮改走 `move_file` 工具(它的 guard 允许跨目录但要求 source 和 dest 都在 allowlist 上),成功完成迁移。**Guard 的价值不在"拦住错误调用",在"让错误调用变成 feedback",不让它污染物理世界**。

###### Sensors:调用之后的观测

Sensor 在 tool 调用**之后** 起作用。典型实现是 output 校验、副作用对齐检测、异常序列模式识别。它的目的是:**副作用发生后,尽快检测出"虽然调用本身合规,但结果不合预期" 的情况**。

仍以 `write_file` 为例,sensor 的一组具体实现:

- **diff scope sensor** —— 这次写入产生的 diff 是否超出了当前 sprint 声明的文件范围?超出就发 `sensor_warning`。
- **forbidden imports sensor** —— 写入的代码是否引入了项目 `.agent-forbidden-imports` 列表里的依赖(比如 `eval / exec / requests.get(verify=False)`)?
- **binary diff sensor** —— 虽然内容不是二进制,但 diff 里是否出现了 base64 大段字符串这类"混入二进制"的模式?
- **test coverage sensor** —— 写入的源文件是否有对应的测试文件同步改动?没有就发 `coverage_regression` 事件,但**不 block 本次调用** —— 因为它属于 architecture fitness,不是 correctness(Fowler 的三层分类)。

一个真实场景:agent 在实现一个 payment 相关的函数,它的 `write_file` 合法通过了所有 guard,落盘成功。diff scope sensor 在 `tool_result` 之后立刻跑,发现 diff 里有一处改到了 `/billing/rate_limit.py`—— 而当前 sprint contract 里声明的改动范围是 `/billing/checkout.py`。sensor 发出 `scope_drift` 警告,harness 把这条警告注入下一轮 agent 的 context,agent 回滚了那一处越界修改。

**只有 guide 不够**:模型可以用完全合法的参数,做出不合预期的事。**只有 sensor 不够**:副作用已经发生了,回滚本身有成本、有时甚至不可逆(想一下 `send_email` 之后再想 "取消"—— 邮件已经出去了)。成熟的 tool 层**成对设计** guide 和 sensor,让每个词都有前置守卫 + 后置检查。这对"双柱"在词汇表治理上的价值,等同于编译器里"语法分析 + 语义分析" 的两段:**任何一段缺失,都会让错误的"句子" 溜进生产**。

##### §8.5 Milvus 五组件到本书四柱的映射

[[milvus-execution-layer]] 把 agent 的 execution layer 拆成五个组件。这五个组件和本书讲的四根柱不是一一对应关系 —— 它们**切法不同**,但讲的是同一块地形。把两种切法并列放在同一张表里,可以帮你在读两份不同文献时不迷路。

| Milvus 执行层组件 | 本书定位 | 关系解释 |
|---|---|---|
| Tool dispatcher | **Tools 柱的核心**(本章) | 一对一对应 —— tool 是执行层的入口 |
| State store | **Session 柱**(Ch 6) | session 就是 state store 的通用化 —— append-only 的事实流,不只是"当前状态" |
| Memory substrate | **Session + 知识层**(Ch 6 + Ch 11) | 短期在 session、长期在 wiki 层,两层职责不同 |
| Retrieval orchestration | **Tools 柱**(作为一种特殊 tool) | retrieval 本身是 agent 可以调用的一个词,不是"旁路" |
| Observability | **横切**(本章 §8.2 可问责 + Ch 9 verification) | 本书不单独立一柱,因为它是上述两柱的副产品 |

这张映射表里最值得展开的是 Milvus 的一个立场:它把 retrieval orchestration **当成 execution 的一部分**,而不是 context engineering 的一部分。这对多数用 RAG 的团队来说反直觉 —— 他们习惯把 retrieval 当成"上下文装配管线" 的一段,和 tool 分开讲。Milvus 的立场是:**retrieval 什么时候查、查哪个 index、怎么 rerank、结果少了怎么办,这些都是 harness 在运行时做的执行决策**,本质上就是"调用某只手",只不过这只手是检索而已。

本书采纳 Milvus 的切法。意味着:**你的 retrieval 和你的 `read_file` 在词汇表治理上是对等的** —— 同样要正交(两个 retrieval tool 不能语义重叠)、同样要可问责(每次 retrieval 的 query / result sha 必须进 session)、同样要与权限绑定。把 retrieval 从"context 配菜" 升格到"tool 主菜",是这一章和多数 RAG 教程最大的分歧点。Observability 这一列 Milvus 单独立柱,本书把它分拆到"session 层的可问责字段"和"verification 柱的 audit 输入",不另立,两种切法在工程上等价。

##### §8.6 Tool 层治理:谁能加、谁能撤、谁在审计

回到开场那位工程师手里那份 47 行的 `tools.yaml`。散会后他回到座位上,不是改代码,是**先改流程**。词汇表不是"一次设计好" 的东西,它会随团队需求演化;而演化本身需要治理。治理包括三个动作,每个动作都要落到人 / 时机 / 证据三要素。

**谁能加新 tool?** —— 通常需要 **spec 评审 + 安全 review** 两道。spec 评审问:这个词的正交职责能不能一句话说出来?它和现有词表的哪些词会产生组合?安全 review 问:这些组合里是否存在"单词合规、组合不合规" 的 tool escape 路径?任何一道没过,不加。**加新 tool = 扩大 agent 行为边界 = 一次协议变更**,不是一次普通的 PR。Ch 12 讲 reflexive harness 时会把一条更硬的红线画清楚:**agent 自己创建新 tool = 禁区档**,不允许。

**谁能撤销 tool?** —— 通常通过 **runtime flag**,不用重启 harness。这是为了响应事故:如果发现某 tool 有安全问题,必须能**立刻停用** 而不等下一次 release window。撤销时要写一条 `tool_deprecated` 事件进 session,让下游的 agent 在下一轮 `getEvents` 时自然感知到这个词从词汇表里消失。**撤销不是静默的**,它是词汇表的一次修订,所有正在运行的 session 都要收到这条修订事件。

**谁审计 tool call?** —— 所有 tool call 进 `session.jsonl`,作为**审计链**的一部分(§8.3)。Ch 9 会讲到,verification 的独立性要求 evaluator 能**独立读**到这些事件,不依赖生成者 agent 的自述。审计者可以是人,可以是独立的 evaluator agent,但不能是"被审计的 agent 自己"—— 这一条在下一章会展开成结构性论证。

把三个动作拉平在一张表里,方便你对照自己团队的现状:

| 治理动作 | 触发人 | 证据落点 | 红线 |
|---|---|---|---|
| 加新 tool | 提案工程师 + spec reviewer + 安全 reviewer 三方 | PR 里含 spec 评审记录 + 组合安全分析 | **agent 自主创建新 tool 禁止**(Ch 12) |
| 撤销 tool | 值班工程师 / 安全团队 | `tool_deprecated` 事件写入所有活跃 session | 不需要停机,但必须有 audit log |
| 审计 tool call | 独立 evaluator(人或 agent) | 读 session.jsonl,不读 agent 自述 | **被审计 agent 自己不能是审计者**(Ch 9) |

这三件事合起来,是词汇表活下去的免疫系统。**免疫系统不是一次性设计的,是每次事故后加固的**。回到开场那位工程师手里的 47 行 —— 真正的问题不是其中某几行,是**他们的团队从没设计过这套治理**。每个工具都是某次临时需求加进来的,没有 spec 评审记录,没有安全 review 记录,没有撤销流程,没有变更审计。清单看似"历史悠久",实质是**无治理状态下的自然沉积**。

所以他散会后做的第一件事不是拆哪个工具、不是加哪个 sensor,是**先写一份 tool 变更的 SOP**。从这一刻起,词汇表成为一个**被治理的资产**,而不是被动累积的清单 —— 但你必须先意识到它是词汇表,才能意识到治理是必需的。

##### §8.7 失败模式前瞻:Tool Escape 与 Hallucinated Parameters

Ch 13 会把 tool 层的失败模式展开到博物馆级别,这里先埋两根最重要的标记作跨章索引。

**Tool Escape(组合逃逸)**:两个独立看安全的 tool 组合使用,产生了超出单 tool 权限的能力。§8.2 讲过的 `read_file + send_email` 只是最简单的一种;更隐蔽的组合如 `fetch_url + write_file`(用外部内容覆写项目文件,供应链式污染)、`run_tests + modify_ci`(改 CI 标准让失败的测试通过)、`read_calendar + create_meeting`(通过新会议的描述字段泄露私密日历内容)。防御不是"更严格地审每个单 tool",是在 harness 或 MCP proxy 层**识别并拦截可疑的调用序列模式**。

**Hallucinated Parameters(参数幻觉)**:模型幻觉出 tool 不支持的参数,tool 返回报错,但**模型在下一轮可能"假装没发生" 继续推进**,导致状态漂移 —— 它以为副作用已经产生,但实际什么都没发生。防御是 **schema 严格验证 + 失败信号强制回传 session + 下一轮 prompt 显式展示上一次失败原因** 三件事合起来。

两类失败的共同点:**都是结构性问题,靠"提醒模型小心" 解决不了**,只能在 harness 和 tools 两层设计出来。词汇表治理不只是"把词写对",更包括"把不该拼出来的句子拦在语言系统之外" —— 后一半,才是 tool 层真正的工程深度。

---

##### 可观察信号

- 你能**一句话说出**你系统里每个 tool 的"正交职责" 吗?说不出来的那些,就是不正交的物证。
- 每次 tool call 的六字段(tool / input / output / actor / ts / parent_event_id)都在 session 里吗?缺一个,后续审计就会断链。
- **Credentials 是否物理上不可被 agent 看到**?如果答"agent 其实能读到 token,只是我们信它不会滥用",这就是 narrow-scoped token 赌局,不合格。
- 你的 tool 层有 guard(feedforward) 和 sensor(feedback) 两种控制吗?只有一种 = 半条腿走路。
- 你们加一个新 tool 的流程里,有没有**组合安全性检查** 这一步?如果没有,你们在维护 API 集合,不是词汇表。

---

##### 本章核心论断

1. Tool **不是** API 集合,**是** 动作词汇表 —— 词与词的**组合** 决定 agent 的行为边界。
2. 三个硬要求:**正交 / 可问责 / 与权限绑定**。缺一个都不合格。
3. **安全不建立在"模型不够聪明"上**,建立在**结构性权限边界** 上。Credentials 不进 sandbox,Vault + MCP proxy 解耦。
4. **Guides + Sensors** 必须成对设计 —— 前置守卫 + 后置检查,任何一端缺失都会出现可预期的失败模式。
5. Tool call 必须**全部进 session**,每条事件含六字段。这是 Ch 9 verification 独立性的上游信号来源。
6. Tool 层治理包括**谁能加 / 谁能撤 / 谁审计** 三个动作。**agent 自主创建 tool = 禁区档**(Ch 12)。
7. Tool Escape 和 Hallucinated Parameters 是两类结构性失败,Ch 13 展开为失败模式博物馆的样本。

---

##### 本章奠基文对齐

- [[milvus-execution-layer]] —— execution layer 作为 agent 本质;五组件切分
- [[anthropic-managed-agents]] —— credentials 不进 sandbox、narrow-scoped token 赌局
- [[fowler-on-harness]] —— computational vs inferential controls;guides + sensors
- [[mindstudio-harness]] —— 五柱分类中 tool orchestration + guardrails 的并置

##### 本章对应 wiki 页

- [[concept-tool-vocabulary]] · [[concept-observability]] · [[concept-harness]]

---

**前三柱是"做什么 + 怎么做"**。Session 是事实,harness 是调度,tools 是动作边界。**第 9 章的第四柱回答一个更锋利的问题:谁来证明 agent 做的事是对的?** —— verification 的独立性,是本书反脆弱论证的核心支点;也是开场那位工程师在下一次季度复查里,必须准备好回答的第三个问题。


#### 来自 `09-verification-pillar.md`：第 9 章 · Verification 的独立性

_源材料角色：独立 verification 与 audit trail。_


#### 第 9 章 · Verification 的独立性

> **命题**:任何足够重要的 AI 系统,都需要一个**独立于自身**的验证层。这种独立性是**结构性的**(位置属性),不是**能力性的**(多聪明)。这一条是本书反脆弱论证的核心支点 —— 模型再强,也不能让同一个体既是生成者又是唯一验证者。

##### 开场:三个座位上的人

先看三个场景。

上午八点十二分,一架载着三百二十七人的 A350 正从法兰克福起飞。机长坐在左座,副驾驶坐在右座。整个起飞过程,飞控系统全程自主完成 —— 它比任何一位人类飞行员算得都准、反应都快、疲劳度都低。自动驾驶这件事六十年前就技术可行。可是两位飞行员还在座位上,还要在起飞前对照清单念出每一项参数,还要为这趟飞行签字。为什么?

下午两点半,一家肿瘤医院的放射科。一位医师在屏幕前看一张胸部 CT。AI 已经在图像上标好了三处可疑结节,并把每一处的恶性概率算到小数点后三位。某些任务上,AI 的准确率在十年前就超过了放射科医师的平均水平。可是最后那份诊断报告,仍然由医师签字交出。医师花了二十分钟,逐个结节核对、回看患者既往影像、做出最终判断。为什么不是 AI 直接出报告?

傍晚六点四十,某个大型会计师事务所的合规办公室。一位审计师合上一份 10-K 申报文件的最终稿。全部数字都由系统自动汇总、交叉核对过,Excel 四十年前就能把账算得比任何人都准。但这份文件最后一页,要审计师本人签字。事务所本身还要盖章。如果有一天发现账目造假,事务所会被 SEC 追责,审计师本人可能被吊销执照。

三个座位上的人,都没有因为自动化能力的提升而消失。从能力看,他们每一位都比不过身边的那台机器 —— 算得不如机器准、看得不如机器仔细、记得不如机器全。但是他们都**还在**。为什么?

答案不是"因为他们还能算出机器算不出的东西"。机器在各自的任务上都更强。答案是另一件事:**在关键场景里,验证角色不会因为自动化能力提升而消失**。飞行员不在座位上,不是因为他算得过飞控;是因为出事时,有一个可问责的人。医师不在,不是因为他看片子比 AI 准;是因为病人有知情权,保险公司要求人签字。会计师不在,不是因为他算得过 Excel;是因为监管需要可问责的事务所盖章。

三件事都指向同一方向:**验证是社会-监管需求,不是能力缺口**。

这一章要论证的是:**LLM 时代,这件事不会改变 —— 只会更强烈**。因为 AI 被部署到越来越关键的场景,验证层的独立性不仅不会被模型能力提升削弱,反而会成为**上线 / 不上线** 的分水岭。讲完这个论证,本书前四柱合拢,第二部分结束。

##### §9.1 位置属性 vs 能力属性 —— 本章最重要的一刀

把开场那三个场景压缩到一句话:**验证的独立性,是位置属性,不是能力属性**。

这句话乍看像咬文嚼字,但它是本章最重要的一刀。两种属性的区分决定了你怎么读后面几节。

**能力属性**:一方比另一方更强、更准、更聪明、更懂领域。这是工程师最熟悉的思维模式 —— 讨论"验证" 时,第一反应往往是"验证者要比被验对象更强"。这个直觉在某些场景成立(比如专家 review 新手的代码),但在 AI 验证场景里会变成致命的误导。

**位置属性**:一方在另一方的"外面"、"上游"、"第三方"。它不依赖谁更强,依赖谁**在哪个位置上签字、看谁手里的证据、对谁负责**。飞行员可能算不过飞控,但他在"能被追责的位置" 上;医师可能看片不比 AI 准,但他在"向患者和保险公司签字的位置" 上;审计师可能算不过 Excel,但他在"事务所担责的位置" 上。

在 AI 系统里,这个区分具体变成这样:**让同一个 AI 既做生成者又做唯一验证者,不是"能力不够",是"位置不对"**。哪怕这个 AI 强到可以解答自己提出的所有问题,哪怕它自我验证的准确率达到 99.99%,它在**位置上** 依然不构成独立验证 —— 因为它和被验对象是同一个 actor,没有第三方、没有上游、没有外部追责的支点。

这一刀切下去之后,本章后面几节才能成立。§9.2 讲 P vs NP 的结构不对称 —— 它是位置独立性的**数学基础**;§9.3 讲 Gödel / Rice / Löb 三条逻辑链条 —— 它是位置独立性的**逻辑基础**;§9.4 讲三要件 Spec / Property Test / Audit Trail —— 它是位置独立性的**工程落地**;§9.5 讲 Anthropic 三 agent 架构 —— 它是独立性在真实长程任务里的工程形态;§9.6 讲 sycophancy-aware lint —— 它是位置独立性的**防御武器**;§9.7 讲四套监管框架 —— 它是位置独立性的**社会实现**;§9.8 用四问压力测试收尾 —— 它证明位置独立性**不随模型能力波动**。

如果你读完本章只带走一件事,就是这一刀:**位置独立性,不是能力独立性**。它是本书反脆弱论证的支点。

##### §9.2 生成 ≠ 验证 —— P vs NP 级的结构不对称

先说一件结构性的事。**生成一个对象**,和**检查一个对象是否满足某性质**,在复杂度上可以差天文数字。

最典型的例子是 SAT 问题 —— 找一个命题的满足解,在最坏情况下需要指数时间;但**验证**一个给定的赋值是否满足命题,只要线性时间。这正是 P vs NP 问题的核心直觉:验证往往比生成容易得多,这个不对称是**计算理论级的**,不是"我们还没找到好算法"。

需要在这里划一条线:本节用"P vs NP" 只是借它的**结构不对称** 作为类比,不主张"AI 验证 = NP 问题的形式化"—— 后者是一个具体数学猜想,本章不涉及它的技术化表述。**借的只是那个"生成难、检查易" 的结构直觉**。把它保持在这个抽象度,就不会被拖进计算复杂性的具体定理里。

这个不对称在软件工程里到处都是:

- 写一个 OAuth 实现,**vs** 证明该实现不会泄露 token —— 两个完全不同的问题,后者往往更难,但也更独立。
- 写一段排序代码,**vs** 检查排序结果是否有序 —— 前者可能错 10 种,后者一次过。
- 训练一个模型做图像分类,**vs** 检查一张图的分类是否正确 —— 一个要 GPU 周,一个要人一秒。
- 写一份一万行的合规报告,**vs** 检查某一段是否引用了错误版本的监管条款 —— 前者是撰写任务,后者是对照任务。

这个不对称有一个关键的工程含义:**验证者不需要和生成者一样强**。验证者只要能检查"这个产物符不符合某组性质",不需要知道怎么**造出** 这个产物。这让验证层可以用**更简单、更可靠、更独立** 的技术栈去做,而不是追着生成者的能力跑。

把这件事反过来说更鲜明:**"只有更强的 AI 才能验证强 AI" 这句话是错的**。它把能力属性和位置属性混淆了。飞控系统再强,它在结构上依然不是它自己的验证者;飞行员再弱,他在结构上依然是那个可追责的位置。验证的需求是"独立 + 可追溯",不是"更强"。P vs NP 结构不对称的真正礼物是 —— 它让"独立 + 可追溯" 在**更便宜、更可靠、更好审计** 的技术上成为可能,而不用等一个同等强的新 AI。

**P vs NP 不对称不会因为模型变强而消失**。反过来:模型越强、产出越多、每一次产出的验证需求越高,这个不对称的工程价值就越大。这是 §9.8 四问压力测试要再次回到的一条判据。

这里还要预防一个常见的误读。有些读者听到"验证比生成简单" 时会反射性反问 —— 那是不是说我们可以用一个更弱的 AI 做验证?答案不是那么直接。"更简单" 不等于"更弱的 AI 就行",它的真实意思是:**验证可以用更不一样的技术栈**。可以是确定性测试、可以是类型检查、可以是形式化证明、可以是人类 reviewer、可以是另一个架构不同的 AI。关键词是"不一样",不是"更弱"。两个同架构 AI 互验,在位置属性上依然不独立 —— 哪怕你让其中一个"扮演 verifier"。位置属性关心的是"是否同一 actor 的扩展",不是"名义上谁在当 verifier"。

##### §9.3 自我验证的结构性死结 —— 三条通向同一方向的逻辑链

直觉上,"让 AI 自己验自己" 似乎是个省事的办法 —— 同一个模型,既生成又打分,不就够了吗?答案是:**不够**。这件事的失败不是技术水平问题,是**结构上的死结**。

有三条逻辑链条指向同一方向。

**Gödel 不完备定理**(1931)—— 一个足够强的形式系统,无法从自己内部证明自己的一致性。具体到 AI 语境:如果一个系统强到能表达关于自身的陈述,它就无法完全确认自己的所有陈述。自我验证在足够丰富的系统里,必然留下它**看不见的盲区**。

**Rice 定理**(1953)—— 任何关于图灵机行为的非平凡语义性质,都是不可判定的,除非验证者具有"比被验程序更高的视角"。翻译到 AI 语境:从系统**内部** 判断系统行为的"好坏",在一般情况下不可计算。唯一的出路是**从外面看**—— 用一个具有更高视角的独立验证者。这个"更高视角" 不是能力意义上的更高,是**位置意义上的外部**。

**Löb 定理**(1955)—— "系统相信自己的某陈述 → 该陈述为真" 这种自反性只在该系统本身一致的前提下成立;而系统无法从内部证明自己一致。翻译:一个 agent 说"我验证过了",这句话的可信度上限,等于"agent 是否一致" 这个前提的可信度 —— 而这个前提**不能由 agent 自己给出**。

这三条定理从三个不同方向指向同一个结构事实:**系统无法从自己内部完整验证自己**。即使把这些数学结果放一边,纯直觉也能看出问题 —— 如果 AI 的训练数据里就存在系统性偏差,那么基于同一训练数据的"自我验证" 会**完美地错过** 这些偏差,因为偏差在它的先验里是"正确"的。让 A 和 A 的影子互相审计,影子不会发现 A 的遮蔽物。

这里还要多说一句工程上的体感。两个同架构 AI 共享训练数据,它们的错误在统计上是**相关的**,所以它们彼此验证并不等于独立验证。"用 GPT 验 GPT、用 Claude 验 Claude" 的惯常做法,在位置属性上**完全不独立**:它们在训练语料、价值对齐、默认偏好上共享太多。这类验证不是没价值,但它不是**verification 独立性** 在本书讲的那个意义上的独立 —— 它充其量是"同架构自检",和**外部 evaluator** 差一个量级。

独立验证的出路,要么来自不同训练数据、不同架构、不同假设的另一个生成器(同构但异源);要么干脆不来自机器生成 —— 比如:确定性测试、形式化证明、人类 reviewer、合规签字。这就是 §9.4 要讲的 **Spec → Property Test → Audit Trail** 三层结构,也是 §9.7 四套监管框架把独立验证**锁死在社会层** 的工程落点。

这里有一件要在工程团队里反复重申的事:**"用另一个 LLM 做 judge" 不等于独立验证**。把一份 GPT-4 的输出喂给 GPT-4(或 Claude 3、或 Gemini 1)去打分,表面上看是两次独立调用,位置属性上依然塌了 —— 两次调用背后的 actor 是同一个训练数据流、同一个 RLHF 偏好、同一个默认风格。它们共享盲区的概率远高于两个真正独立设计的验证者。更深的问题是,这种"LLM as judge" 的 benchmark 会同时被**生成者** 和**评估者** 在同一条训练轨迹上优化过,意味着 judge 对 generator 的默认偏好已经内建。把它当 verification 独立性的证据,是典型的**以生成系统的副产品当验证系统** —— 犯的正是 §9.1 位置属性那一刀试图阻止的错误。

##### §9.4 Verification 的三要件:Spec → Property Test → Audit Trail

位置独立性在工程上怎么落地?三个组件,按数据流串起来。它们不是可选项,是**最小必要结构** —— 缺任何一件,独立性就不成立。

###### (a) Spec —— 把人类意图形式化到可被机器检查的断言

第一步是把人类意图**形式化** 到机器可检查的断言。这正是 Ch 3 讲过的 spec 三层严密度的应用:

- **L1 prompt** —— **无法机器验证**,只能作为上下文。
- **L2 BDD scenario** —— Given / When / Then,可被 scenario test runner 执行。
- **L3 DbC 契约** —— `requires / ensures / old(…)`,可被形式化 verifier 检查。

大多数验证工作落在 L2 / L3。作为一个具体例子,下面是一段 Rust Design-by-Contract 风格的契约 —— 它声明"从账户扣款" 这个动作必须满足的前置和后置条件:

```rust
// L3 DbC · 把意图直接表达为可被 formal verifier 检查的断言
#[requires(amount > 0 && account.balance >= amount)]
#[ensures(account.balance == old(account.balance) - amount)]
#[ensures(result == amount)]
fn withdraw(account: &mut Account, amount: u64) -> u64 {
    account.balance -= amount;
    amount
}
```

三件事值得注意。**第一**,`requires` 表达前置条件 —— 金额必须大于 0 且余额足够;这是一个**在调用前** 应当被保证的不变量,如果违反,调用应该直接拒绝,而不是执行后发现错误。**第二**,`ensures` 表达后置条件 —— 余额必须严格减少 amount,返回值必须等于 amount;这是这次调用**承诺** 给调用者的事实。**第三**,`old(account.balance)` 引用调用前的状态快照,这是 DbC 在表达"状态迁移" 时最锋利的工具 —— 它把"之前 vs 之后" 显式地结构化进了断言。

这段契约写出来之后,它有什么用?它可以被 Rust 生态里的 formal verifier(Creusot / Prusti / Kani)静态检查 —— verifier 会试图证明:**在任何满足 `requires` 的输入下,函数体执行完毕后 `ensures` 都成立**。如果证不出来,verifier 会反馈一个反例 —— 比如它可能发现"如果 amount 极大导致溢出,后置条件不成立"。这是**位置独立性在 spec 层的体现**:契约作为独立于实现的证据,静态 verifier 作为独立于实现作者的 checker。

这里还要澄清一件事。Bertrand Meyer 在 1986 年提出 DbC 时,默认的假设是"spec 是人写的、正确的,只是实现需要验证"。这个假设在 AI 时代部分失效 —— AI 可能同时写实现和 spec。§9.6 会把这件事作为 sycophancy-aware lint 的核心问题展开。但 spec 作为"比 prompt 更形式化的意图载体" 这件事不变,只是需要额外的一道防御。

###### (b) Property Test —— 把契约变成随机化断言

契约写出来了,下一步是让它**真的跑起来**。L3 的静态 verifier 是一条路,但它对开发者的形式化训练要求很高,且不一定覆盖所有 property。一条更务实、更广覆盖的路是**property-based testing**:把契约翻译成随机化断言,让 quickcheck 式的框架在大量随机输入下验证它。

```rust
// Property-based testing · 把契约变成 128 次随机化测试
#[quickcheck]
fn withdraw_preserves_contract(mut acc: Account, amt: u64) -> bool {
    // 只在满足 requires 的输入上检验 ensures
    if amt == 0 || acc.balance < amt {
        return true; // precondition 不满足,跳过
    }
    let before = acc.balance;
    let returned = withdraw(&mut acc, amt);
    acc.balance == before - amt && returned == amt
}
```

quickcheck 默认跑 128 次随机样本。每一次它都按类型生成 `Account` 和 `u64`,筛掉不满足 `requires` 的那些,在剩下的样本上检查 `ensures`。如果发现反例,它会自动 shrink(缩小反例规模)报告出来 —— 这是比单元测试更有力的一层:**你不需要手写 128 个用例,随机化 + shrink 做了这件事**。

这两段代码放在一起的意义是:**同一条契约,静态 verifier 和 property test 从两个不同的角度给出独立证据**。静态 verifier 在所有可能输入上给出数学证明(如果它证得出);property test 在随机样本空间里给出概率证据(它的样本覆盖度有限但实际命中率高)。两者合起来,是"L3 契约" 在工程上的两条腿。

**agent-spec**(本书作者维护的项目)在这一层还增加了一条:把 Ch 6 讲的 session 里的事件回放,作为 golden trace 类型的 regression test。那是一个整条 agent 轨迹级的正确性检查,不是单步。三个层次合起来 —— 单步契约(property test)、整条轨迹(golden trace)、外部结果(outcome judge)—— 对应 [[concept-evaluation-harness]] 的三层评估模型。

###### (c) Audit Trail —— 每次 pass/fail 作为独立事件持久化

验证通过与否,必须作为**事件** 写回 session(Ch 6)。Ch 8 讲了 tool call 的事件结构,verify 事件的结构类似,但**关键字段不同**:

```json
{
  "ts": 1734302500,
  "kind": "verify_check",
  "actor": "verifier:evaluator",
  "parent_event_id": "evt_tool_result_73",
  "checked_spec": "payment_flow_v3",
  "property_tests": {"passed": 256, "failed": 0, "total": 256},
  "golden_traces": {"passed": 14, "failed": 0, "total": 14},
  "human_signoff": null,
  "verdict": "ok"
}
```

注意 `actor` 字段的值是 **`"verifier:evaluator"`**,**不是** `"agent"`。这一个细节承担了本章 §9.1 位置独立性的**全部工程落地**:同一个 session 里,生成者事件和验证者事件由**不同 actor** 写入。审计时可以按 actor 过滤,独立读出"验证层都验了什么"—— 不需要相信 agent 的自述、不需要拼凑 chain-of-thought、不需要事后还原。

这个对比有多重要,可以做一张小表:

| 事件字段 | 生成者视角 | 独立验证者视角 | 为什么不能合 |
|---|---|---|---|
| `actor` | `"agent:generator"` | `"verifier:evaluator"` | 合并 = 同一方既写实现又写 verdict,审计不知该信谁 |
| 写入时机 | tool call 完成后 | evaluator 独立读 session 后异步写入 | 同步写 = verdict 依赖生成者进程,失败相关 |
| 数据源 | 本地执行结果 + agent 自述 | 只读 session 事实流,不读 agent 自述 | 共享数据源 = 共享盲区 |
| 失败影响 | agent 自己看到失败会尝试修正 | evaluator 失败不影响 agent,只影响 verdict | 同一进程 = 失败会被悄悄吞掉 |

这张表不是"最佳实践列表",是**结构性必然**。每一列的第三行,就是把独立性合并掉之后的直接后果。

三要件合起来是 **意图可形式化 → 性质可机器运行 → 结果可持久审计**。每一步都让"正确性" 从**主观感受** 走向**可检验的结构性证据**。这正是第 9 章区别于前三柱的最重要一点:**其他柱都让 agent "做事做得好",这一柱让 agent "做的事能被独立证明"**。

##### §9.5 Anthropic 三 agent 架构 —— 独立性的真实工程形态

[[anthropic-harness-design]] 在 2026 年发布的 long-running apps 实证里给出了一个具体的三 agent 架构:**planner / generator / evaluator**。把 §9.1 的位置属性,具象到一个跑了四小时的真实任务里,它长这样。

想象一次任务:让 agent 在 4 小时内为一家客户搭一个复古游戏生成器。任务从**planner** 开始:planner 读用户需求,产出一份 **sprint contract** —— 明确写明"这个 sprint 要做什么 / 什么叫成功"。这份 contract 作为一条事件写进 session,所有下游 agent 都能读到。

然后进入 **generator** 阶段:generator 读 sprint contract,开始写代码、调 tool、把 diff 推进仓库。每一次 tool call、每一条 diff、每一次 retry,都以事件写进 session(Ch 8 讲过的六字段)。generator 不知道自己写得好不好 —— 它只负责"按 contract 生产"。

接着 **evaluator** 被独立唤醒:它读 session、读 sprint contract、读 generator 的产物。关键是,它**不读** generator 的自述(也就是 agent 自己在 chain-of-thought 里说的"我做得很好"之类的话)—— 它只读**客观事件**。它启动一个独立的 Playwright sandbox,把 generator 产出的应用跑起来,按四个维度打分:**Design / Originality / Craft / Functionality**。打分结果作为一条 `verdict` 事件写进 session,`actor` 字段是 `"verifier:evaluator"`。

如果 verdict 不通过,evaluator 把失败原因写进 session,generator 的下一轮读到后重新工作。这个循环跑 5–15 次,直到 verdict 通过或进入人类 review。

这个架构里,三件事是本章主张的直接工程化:

**第一**,planner / generator / evaluator 是三个**独立 actor**,不是同一个 agent 的三种"模式"。它们可以运行在不同进程、不同机器、不同模型版本上。**独立不是语义层面的,是进程层面的**。

**第二**,evaluator 的证据来源是 **session 的客观事实流**,不是 generator 的自述。这直接落地 §9.1 的位置属性 —— evaluator 在 generator 的"外面",它看的不是 generator 说什么,是 generator **留下了什么客观痕迹**。

**第三**,self-evaluation 在 Anthropic 的实证里被直接证明**不够用**:同一个 agent 自评自己的输出,在主观任务上会自信地夸自己的平庸产出。修法不是"更好的 prompt 让它更诚实",是**换一个独立 actor 作为 evaluator**。这和 §9.3 三定理的结论完美对齐 —— 不是能力不够,是结构不对。

Anthropic 给的数字:同一个任务,单 agent 跑 20 分钟、花 $9、结果浅;三 agent 架构跑 4 小时、花 ~$80、做出单 agent 在任何 token 预算下都达不到的生产级产物。**harness 解锁了模型已经拥有但单 agent 结构用不出来的能力**。这是 Fowler 的 *Agent = Model + Harness* 等式在大规模任务上的一次强印证:**改 harness,不改模型,13.7 个百分点的提升量级** —— 这是 [[mindstudio-harness]] 里 LangChain 52.8% → 66.5% 的同类信号,在 Anthropic 这里以 4 小时 / 4 维评分的形式重现。

[[stanford-meta-harness]] 在 2026 年从另一个方向给出了独立验证的实证:用一个独立的 outer-loop proposer 搜索 harness 代码变体,每一个候选 harness 在一组 held-out 题目(比如 200 道 IMO 级数学题)上打分。关键是**评分函数由独立评估者持有,不由 proposer 自评**。如果 proposer 能同时改 harness 和改评估,outer-loop 就会 collapse 成"找一个让自己打高分的 harness",不是"找一个真正做得更好的 harness"。这件事在工程上的直接启示是:**评估函数的独立性,是 meta-harness 能不能跑起来的前提**。搜索算法再强,评估不独立,搜到的就是自我奉承。

##### §9.6 Sycophancy-aware Verification —— 一位合规官问出的问题

把场景切到另一间会议室。这一次,一位合规官在 review 一份 AI 生成的代码审计报告。她是金融监管合规背景出身,读 10-K 文件十五年,对"谁签字" 这件事的敏感度远高于技术细节。她问的问题听起来像技术问题,但本质上是位置问题:

> "你们的 verifier 通过了。但这个 verifier 验的是**谁写的 spec**?"

会议室里一阵短暂的沉默。在场的工程师第一反应是想解释 verifier 的覆盖率、property test 的数量、golden trace 的完整度。但合规官没有问这些。她问的是**位置链条**:spec 从哪里来,implementation 从哪里来,verifier 在检查什么。

如果 spec 也是同一个 AI 写的,那"verifier 通过" 这件事的真正含义是 —— **AI 生成的代码,通过了 AI 生成的 spec 的检查**。这件事在位置属性上,和"AI 自评" 一样不独立。spec 可能只是 function body 的同义改写:body 写 `x = y + 1`,spec 写 `ensures(x == y + 1)`;verifier 通过 —— 但它通过的是一个**重言式**,不是一个"代码正确"的证据。

这件事在本书语境里叫 **sycophancy-aware verification** —— 意识到 AI 生成的证据本身可能是"自我奉承" 的回声。agent-spec(本书作者维护的项目)把这件事做成了一组可运行的 lint 规则。三条例子:

- **检测 `ensures` 子句是否只是 body 的赋值映射** —— 比如 body 写 `x = y + 1`,ensures 写 `x == y + 1`。通过不代表正确,只代表重言式。这条 lint 看 AST 相似度,超过阈值就 flag。
- **检测 universal claim 是否缺边界条件** —— 比如"for all input X, f(X) is safe",往往只在训练集覆盖的输入空间成立。边界条件(溢出、空、极大值、负值、NaN)缺失是重大信号,lint 应要求 universal claim 必须配套一组显式 boundary condition 检查。
- **检测 contract test 与 function 同源** —— 如果 function 和它的 property test 都由同一个 agent 写成,生成和检查就不独立。lint 要求 test 必须由"另一个独立 agent 或人" 重写 —— 这个"必须" 不是礼貌建议,是结构要求。

把三条 lint 放进一张表里,可以看得更清楚它们各自防御的是哪类"自我奉承":

| Lint 规则 | 检测信号 | 典型触发场景 | 防御的失败类型 |
|---|---|---|---|
| `ensures` vs body AST 相似度 | 两者 AST 结构化相似度 > 阈值 | agent 写 `x = f(y)` 又写 `ensures(x == f(y))` | 重言式 spec —— verifier 通过但没有证据力 |
| Universal claim 边界条件 | 全称命题没有配套溢出 / 空值 / NaN 检查 | agent 写 `for all X, safe(f(X))` 不配 boundary case | 训练集内"看上去全对",边界处真实失败 |
| Contract test 同源检测 | function 和 property test 的 commit author / session actor 相同 | 同一 agent 在同一 session 里写 impl + test | 生成-检查闭环,位置独立性塌陷 |

三条合起来,就是**先验证 spec 本身,再拿 spec 去验证 implementation** 的两级结构。**传统 verifier 假设 spec 是正确的、只是实现需要证明;AI 时代的 verifier 必须先假设 spec 本身可能是生成的,需要先验证 spec**。这是本章相对 Bertrand Meyer 1986 年原始 DbC 的一次必要扩展。

回到那位合规官。她问的问题,实际上是把 §9.1 位置属性的判据应用到 spec 层 —— 她不在乎 verifier 多强,她在乎"生成 spec 的位置" 和"生成 implementation 的位置" 是否独立。**如果两者都是同一个 AI**,位置属性上就已经塌了,再强的 verifier 也救不回来。所以 Ch 12 讲 reflexive harness 时会把这条红线画更狠一点:**agent 不能同时改 agent-spec 和改 implementation**,否则就是自己写 spec 又自己判自己通过。

##### §9.7 社会的验证独立性 —— 四套监管框架

前面几节讲的是**数学层 + 工程层** 的独立性。但真正把 verification 独立性**锁死** 在 "不能妥协" 这一档的,不是数学,是社会 —— **现代社会的监管和问责结构要求 verification 由可问责的独立方执行**。

四套具体的监管框架并列摆在那里:

| 框架 | 适用范围 | 对独立验证的要求 | 位置独立性落点 |
|---|---|---|---|
| **EU AI Act**(2024) | 所有高风险 AI(医疗、教育、司法、执法、基础设施) | risk management + data governance + **human oversight** + technical documentation | "human oversight" 直接要求可问责的人类节点不被自动化替代 |
| **SEC AI disclosure** | 上市公司使用 AI 的披露义务 | 披露 AI 作用范围 + 训练数据来源 + 输出 **attestation** | attestation 意味着有人签字 —— 机器不签字 |
| **FDA SaMD** | 医疗 AI 设备(Software as a Medical Device) | pre-market review + post-market surveillance + clinical validation | 每一步都需要**人类专业机构** 认证,不是算法自证 |
| **GDPR DPIA** | 涉及个人数据的 AI 处理 | Data Protection Impact Assessment + DPO 签字 | 责任不在模型,在负责 DPIA 的**人** |

四套框架的共同模式:**都要求一个"不是被验系统自己" 的位置,在事后必须可追责**。这个位置在 EU AI Act 里叫 human oversight,在 SEC 里叫 attestation,在 FDA 里叫 clinical validation,在 GDPR 里叫 DPO。名字不同,结构同构 —— 都是把"位置独立性" 写进了法律,不是写进了技术。

这件事的工程意涵是:**哪怕你的 AI 强到能自我验证,你在这四套框架下依然需要独立验证层** —— 因为框架要求的是"可追责的位置",不是"能力足够的验证者"。位置独立性**先被数学锁住,再被社会锁死**。

还有一件事要点出来:这四套框架在 2024–2026 年都在**加强**,不是放松。随着 AI 在关键场景的部署深度增加,监管对"独立验证" 的要求只会更严。这是 Ch 13 反脆弱论证要回来详谈的一条结构性趋势 —— 模型越强、部署越深,验证独立性的**商业合规价值** 就越高,不是相反。本章现在只需要让读者知道:**四套框架同时存在,构成 verification 独立性的社会共识**,这件事不是某一国政策或某一家公司意愿,是整个数字社会对"关键 AI 系统" 的默认期望。

##### §9.8 四问压力测试 —— "模型越强,第四柱越值钱"

把本章的所有论证合起来,放进四个压力测试问题里。这是本书 Ch 13 反脆弱论证的预演,但本章要先把它的结构摆清楚 —— 因为不做这个压力测试,第四柱的论证就不完整。

**问题 1**:完美 GPT-6 明天发布,第四柱归零吗?

> **不归零**。此时 AI 会被部署到更关键场景(医疗、金融、基础设施),独立验证的**监管需求** 只会更强,不会消失。§9.7 四套框架会在模型更强之后**要求更高**,不是放松。模型能力增长反而推高第四柱的**商业合规价值**。

**问题 2**:Self-verifying AGI 出现(一个号称能自我验证的 AI),独立验证层失效吗?

> **不失效**。独立性依赖**位置属性**(不同 actor),不是**能力属性**(多聪明)。哪怕一个 AI 能自我验证,它和它自己的 verdict 仍然是**同一 actor**,依然**不构成** 监管意义上的独立验证。§9.3 的三定理和 §9.7 的四套框架都独立给出这一结论,从数学和法律两个方向上锁死。

**问题 3**:Formal-verification AGI 出现(一个能证明任何代码满足任何 spec 的 AI),契约还需要吗?

> **需要**,而且更需要。契约的锚是**人类意图**,不是证明。formal verifier 只能证明"实现满足契约",不能证明"契约反映了人类想要什么"。**意图永远是人写的**。§9.6 sycophancy lint 讨论的正是这件事 —— 你不能让 AI 同时写实现和 spec,因为那会让 verifier 退化成重言式检查。

**问题 4**:有没有单一技术突破能让整个驾驭工程失效?

> **没有**。四柱结构性独立:session(Ch 6)是事实载体,harness(Ch 7)是调度,tools(Ch 8)是动作词汇表,verification(本章)是独立位置。四柱在不同维度上;任何单一突破都不能同时摧毁它们。**这就是反脆弱的精确陈述 —— 模型进展不削弱驾驭工程,而是让它更值钱**。

四问压力测试的一致回答是:**驾驭工程 —— 尤其是 verification 这根柱 —— 不是"模型不够好"的补丁,是"模型再好也绕不开"的结构要求**。这是 Ch 13 反脆弱四支柱的完整展开之一,本章是它的证据奠基。

---

##### 可观察信号

- 你的验证层和被验系统**在 actor 级别独立**吗?还是"用 AI 验 AI,共享训练数据"?
- 当监管者问"你怎么知道这是对的",你能拿出什么**不是被验系统自己生成的**证据?
- 你的 contract 通过了不等于 intent 对了。**谁检查 contract 本身对不对?**
- 你的 verify_check 事件在 session 里 actor 是谁?如果是 `"agent"` 和 tool call 同 actor,就不独立。
- 你现在的 verification 结构,明天 GPT-6 发布后会被削弱还是增强?如果答"被削弱",那你押的是能力,不是位置。

---

##### 本章核心论断

1. **位置独立性 ≠ 能力独立性** —— 这是本章最重要的一刀,也是本书反脆弱论证的支点。
2. **生成 ≠ 验证** —— P vs NP 级的结构不对称,不会随模型变强而消失;验证者**不需要** 和生成者一样强,只需要在**独立位置** 上。
3. **系统无法从自己内部完整验证自己** —— Gödel / Rice / Löb 三定理从不同角度指向同一结构死结;同架构 AI 共享训练数据,互验不等于独立验证。
4. 独立验证层的三要件:**Spec → Property Test → Audit Trail**。verify 事件的 `actor` 字段必须和生成者不同,这是位置独立性在事件层的具体体现。
5. Anthropic 三 agent 架构是位置独立性的真实工程形态;**planner / generator / evaluator 是独立 actor,不是同一 agent 的模式**。
6. **Sycophancy-aware lint** 是 AI 时代 verifier 的新武器 —— 传统 verifier 假设 spec 正确,AI 时代 verifier 必须先验证 spec 本身。
7. Verification 是**社会-监管需求**。EU AI Act / SEC / FDA / GDPR 四套框架从四个方向锁死"独立可追责位置"。
8. **模型越强,第四柱越值钱** —— 四问压力测试证明它是反脆弱的,不是补丁。

---

##### 本章奠基文对齐

- [[fowler-on-harness]] —— computational / inferential controls 两分
- [[anthropic-harness-design]] —— planner / generator / evaluator 三 agent 架构、evaluator ≠ generator
- [[mindstudio-harness]] —— Human-in-the-loop checkpoints 作为 verification 的社会落地
- [[stanford-meta-harness]] —— 200 题 held-out 验证方法、outer-loop 搜索需要独立评分函数
- Bertrand Meyer, *Design by Contract*(1986)—— L3 契约的学理奠基
- Creusot / Prusti / Kani —— Rust formal verification 谱系
- EU AI Act(2024)/ SEC AI disclosure / FDA SaMD / GDPR DPIA —— 四套监管框架

##### 本章对应 wiki 页

- [[concept-evaluation-harness]] · [[concept-observability]] · [[ariely-big-data-quote]]

---

**第二部分至此结束**。四柱已立:session 是事实载体(Ch 6)、harness 是无状态调度(Ch 7)、tools 是可问责动作词汇表(Ch 8)、verification 是独立的结构性位置(本章)。**第三部分进入跨时间维度** —— 当四柱跨会话运行,**人机共同进化** 开始发生;第 10 章先从两个循环讲起 —— 一个循环是 agent 在单次任务内的自我修正,另一个循环是 harness 本身在跨任务之间的演化。本章的四问压力测试在那里会获得它的第二层回答。
