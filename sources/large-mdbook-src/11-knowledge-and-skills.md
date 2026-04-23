# 第 11 章 · 知识沉淀与 Skills 晋升

> agent 在积累的东西**分两级**:事实(知识层)与方法(skill 层)。
> 两级的治理原则**同构**,所以放同一章对比着讲最清楚。
> "AI 能做 X" ≠ "组织拥有 skill X";
> "agent 知道 Y" ≠ "组织记得 Y"。
> 这两句等号,很多团队划了六个月才划不对。

## 从 Karpathy 的一句话开始

[[case-karpathy-autoresearch]] 里那句被反复引用的话:

> *"The tedious part of maintaining a knowledge base is not reading or thinking — it's bookkeeping."*

Karpathy 谈的是 wiki,但这句话适用于**所有跨会话的 agent 资产**。AI 做"读"和"想"都很快;做 bookkeeping 慢且容易出错。谁写了什么、何时更新、什么该降级、谁签字、哪条有独立证据、哪个 skill 半年没被调用 —— **这些是 bookkeeping 工作,不是推理工作**。这一章把 bookkeeping 在两级上都制度化:事实层(知识沉淀)+ 方法层(skill 晋升)。读完之后,如果有人说"我们的 agent 没在学习",你能答:问题不在模型,问题在两级 bookkeeping 里某一环没被工程化。

## 为什么两级同章讲

很多团队把"知识"和"skill"分头搞 —— 一边 RAG,一边 prompt 模板 + 工具编排。工具链、失败模式、团队都不同。本书合在一章,因为它们**治理原则上结构同构** —— 都有候选 → 稳定 → 降级 → 归档生命周期;都需要带版本、带 provenance、带独立审核的 promotion 判据;都需要比 promotion 更难做对的 demotion;都会因为只 accrete 不 demote 在六个月内腐烂。**一套工程纪律同时套两级**。另一件要钉清楚的:**两级平级,没有谁"更高级"** —— 长程循环 Accrete 阶段同时发生的两件事,共享同一套治理词汇(promotion / demotion / provenance / owner / version),只是对象不同。

## 第一级 · agent 在积累哪四类东西

一个做得正确的驾驭系统里,随时间累积的东西**分四类**,生命周期、存储形态、治理动作都不同。

| 类别 | 生命周期 | 典型存储 | 治理动作 |
|---|---|---|---|
| **Raw events** | session 内,不可变 | `session.jsonl` | append-only,不删不改 |
| **Candidate knowledge** | 单 session / 单任务范围 | scratch 区 / wiki candidate 区 | 需 promotion |
| **Stable knowledge** | 跨多 session,长期 | `wiki/*.md` stable 页 | 需 demotion |
| **Governing principles** | 跨 agent 全生命周期 | SCHEMA / constitution | 需合规评审 |

四类搅成一锅,是知识层最早要纠正的事。把所有东西都叫 "memory" 扔进向量库:raw events 丢了顺序,candidate 和 stable 没有界,governing principles 被 agent 不小心改飞。**一锅粥的 memory 不是 memory,是 bookkeeping 失败的遗物**。

## Karpathy 三层分离 + 三操作

[[case-karpathy-autoresearch]] 的 LLM-wiki gist 给出了最小可行的知识架构,两个维度:**三层分离** + **三操作**。

三层分离:**Raw sources**(原始素材:文章、PDF、抓取的 web 页面,不修改只追加)→ **Maintained wiki**(LLM 编译出来的结构化页面,按 entity / concept / case / draft 四种 kind 组织,每次演化 diff 可见)→ **Schema**(编译规则:哪些主题要建页、页面长什么样、cross-ref 怎么连;是第三方工程对象,不是 agent 随手改的散文)。工程含义很锋利:**所有查询走 wiki,所有证据回链 raw,所有演化由 schema 驱动**。传统 RAG 把三层揉成一锅,失去了每层独立治理的能力 —— 没法对 raw 做 append-only 审计,没法对 wiki 做 promotion/demotion,没法对 schema 做独立 review。

三操作:**Ingest**(把 raw 转化为 wiki 页,抽取断言、提炼概念、更新 cross-ref、维护 `updated` 字段 —— agent 的 bookkeeping 劳动,不是人的)、**Query**(在 wiki 上做检索合成;有价值的查询结果可**回写**为 candidate 页,知识在被用中长)、**Lint**(定期扫描 contradictions、stale claims、orphan pages、coverage gaps、broken slugs —— **对知识库自身做 verification**,Ch 9 第四柱在长程循环里的落地)。三个操作合起来,agent 才有**可治理的长期记忆**,而不是"扔进去再也找不出来"的向量仓库。

## Memory Layer ≠ Retrieval Cache

行业里最普遍的混淆,得钉死。[[neo4j-context-vs-prompt]] 给出最锋利的反命题:**memory layer 不是 retrieval cache**。

| 维度 | Retrieval Cache(纯向量 RAG) | Memory Layer(结构化知识) |
|---|---|---|
| 组织 | 按相似度 | 按 entity + relationship |
| 演化 | 只追加,不管理 | 有 promotion / demotion |
| Provenance | 向量与原文的弱关联 | 每条断言 → source URL + sha256 |
| 失效检测 | 无 | lint + `updated` 时间戳 |
| 失败模式 | context collapse | 可被诊断、可被修复 |

立场跟 Neo4j 一致:**纯向量 RAG 是 context engineering 层的工具,不是 harness engineering 层的 memory**。把 RAG 当 memory 得到"永远新但永远乱的仓库";把 memory 作为一等组件得到"可治理的组织资产"。[[milvus-execution-layer]] 从数据侧佐证同一立场 —— retrieval 是 execution layer 的一等组件(harness 的一种 tool),不是 memory。原话:"retrieval is not a sidecar; it's part of the execution layer." 两家说的是同一件事:**向量库是工具,不是记忆**。

## Promotion 判据(两级同时看)

新断言被 ingest,不应立刻进 stable;新 skill 被提出,也不应立刻进 AGENTS.md。两级都先进**candidate 区**,积累证据,通过门槛才被提升。

知识层 promotion 判据(≥ 3 条):**Evidence count**(同一断言在多少独立 raw 源里出现,N ≥ 2 才考虑晋升)、**独立来源**(N 个源不能全来自同一机构/作者)、**审核人签字**(至少一次人类或独立 verifier agent 同意)、**Cross-ref 完整性**(相关 entity / concept / case 页已存在,不留断链)、**时间锁**(距 ingest 超过冷静期如 7 天没有被反驳)。

Skill 层 promotion 判据(≥ 3 条):**Contract 完整**(trigger / precondition / postcondition / 输入输出 schema / 失败模式,五件齐全)、**Verification pass**(unit test ≥ N 条、golden trace ≥ 3 条,全过)、**独立 reviewer 签字**(非 skill 作者)、**Owner 指派**(不接受 `owner: null`)、**调用记录**(被非作者调用 ≥ 10 次,无重大事故)。

两级共同骨架是 **证据(不是权威)+ 独立性(不是自我认证)+ 时间(不是一拍即合)**。这是 Ch 9 verification 独立性在 Accrete 阶段的具体应用 —— 晋升判据不能由创建者自己写,必须由独立 lint / reviewer 角色执行。

## Demotion 判据(两级同时看,且比 promotion 更难做对)

知识库和 skill 库**最被忽略的一件事**,是让 stable 条目能降级回 candidate。stable 会过时,但大多数系统没有 demotion 机制 —— 结果是 stable 区越积越多,70% 是历史垃圾。

知识层 demotion 判据(≥ 3 条):**`last_verified` 超期**(>90 天没被任何 query/lint 验证,降为 candidate)、**上游源撤稿**(raw 源被删或修订,涉及 stable 页自动降级)、**冲突新证据**(新断言与 stable 页冲突,两者进冲突池,直到人工仲裁)、**下游引用归零**(超过 180 天无其他 wiki 页 cross-ref,降级)。

Skill 层 demotion 判据(≥ 3 条):**重大事故**(复盘指向这个 skill 的 contract 或 implementation,立即 deprecated)、**依赖变化**(底层 API/模型换代后触发条件不准确,deprecated + 迁移指引)、**调用频率归零**(90 天无调用进候选池,再 60 天无新调用则正式 deprecated)、**有更好替代**(功能等价且 verification 更强的 skill 出现,老 skill deprecated,新 skill 继承流量)。

Demotion 比 promotion **更难做对**,因为它要"主动丢弃看上去还 OK 的东西"。一条 90 天没被 query 的 stable 页,可能是被忘了(该 demote),也可能是"真的暂时没人用但以后还要用"(不该 demote)。没有银弹,靠 owner 判断 —— 所以 owner 字段不能为 null。**没有 demotion 的知识库和 skill 库,半年后必然腐烂**。

## Provenance 是一等公民

每条知识项、每个 skill 必须记录六字段:`source`(来自哪里,raw 源 URL + sha256 / wiki slug / 人)、`evidence_count`(几条独立证据支持,或被成功调用多少次)、`last_verified`(上次验证时间)、`contradictions`(已知反例、失败案例)、`owner`(负责人,人或 agent persona)、`version`(semver)。

**Provenance 不是元数据的装饰,是决定晋升-退役的一等公民**。EU AI Act 要求"可追溯的训练证据";进生产时系统必须能回答"这条什么时候进来、谁批准、基于什么证据、上次被验证何时"。没有 provenance 的 memory 是**合规意义上的黑箱**。两级的细微区别:知识层 provenance 锚点是**证据链**(两条独立来源),skill 层是**调用记录 + verification trace**。锚点不同,字段语义相同 —— 这是"两级结构同构"在数据模型上的具体落点。

## Substrate 三形态权衡

知识层的物理存储有三种主要形态,skill 层通常跟知识层共用或借鉴。三者权衡:

| 形态 | 强项 | 弱项 | 典型场景 |
|---|---|---|---|
| **Markdown wiki**(文件 + git) | 可 diff / 可 code review / 人机共读 | 检索不精细 | 中小规模(< 500 页)、强治理 |
| **Knowledge graph**(Neo4j 等) | entity + relationship、多跳查询 | 写入成本高、debug 难 | 关系密集域(医学、金融) |
| **Vector DB**(Milvus 等) | 高召回、低延迟 | 丢失 provenance 与结构 | 作为 wiki/graph 之上的检索加速层 |

**本书推荐的起点是 markdown wiki + 按需加检索层**。markdown 文件可以被 diff、被 PR review、被 ascent-research 类工具的 lint 直接扫描 —— 治理钩子全在。规模长到 200 页以上,再叠一个向量索引做 fuzzy lookup。好处是:**promotion / demotion 永远基于 markdown 主库,vector DB 只是缓存;缓存可以重建,主库不能**。反过来(vector DB 是真相源、markdown 是 dump)会让你失去对治理的一切抓手 —— 大量第一代"企业知识库"死在这条路上,不是死在性能上。

## Skill 的四要素

从知识层切到方法层。一个合格 skill **有且只有四要素**:**Contract**(触发条件 / precondition / postcondition / 输入输出 schema / 已知失败模式;skill 的语义说明书,也是 verification 层的钩子)、**Implementation**(具体怎么做,可以是 prompt、agent loop、harness 配置或组合 —— 可替换,但 contract 不可替换)、**Verification**(property test + golden trace + 可选人工抽审,必须由**非 implementation 作者**执行或审核)、**Version**(semver 风格版本号、deprecation 日期、迁移指引)。四要素齐备才叫 stable;**缺一条都只是 candidate**。

一个具体 skill 文件骨架 + 对应 AGENTS.md 条目长这样:

```yaml
# docs/skills/research-local-wiki.yaml
name: research-local-wiki
version: 1.3.0
owner: "@researcher-team"
trigger: 当用户要 deep-dive 一个库或 codebase
preconditions:
  - ascent-research CLI 可用
  - 本地源码路径存在
method:
  - create session
  - add-local source tree
  - run loop N 次
  - synthesize bilingual report
postconditions:
  - session.md exists
  - wiki has >= 5 pages
  - coverage.sources_hallucinated == 0
verification:
  unit_tests: 12
  golden_traces: 3
  last_audit: 2026-04-20
deprecated: false

# --- AGENTS.md ---
## research-local-wiki (v1.3.0)
当用户要 deep-dive 一个库或 codebase → docs/skills/research-local-wiki.yaml
```

两段合起来就是"AGENTS.md 作目录、docs/ 作系统记录"的最小样本 —— skill 名字 + 一行描述进 AGENTS.md(永远在 context 里),细节进 docs/(按需加载)。

## AGENTS.md 作目录,不作百科

[[openai-harness-engineering]] 给出 skill 组织最极简也最有效的模式:**AGENTS.md 是目录,不是百科**。AGENTS.md 短、永远在 context 里,列 skill 名 + 一行描述 + 指向 `docs/skills/` 的链接;`docs/skills/` 按需加载,每 skill 一个文件,包含四要素。工程含义:**principles always in scope, details pulled on demand**。Skill 数量随时间增长,但 AGENTS.md 长度**不线性增长** —— 增加的是 `docs/` 条目数,不是 context 的永久负担。Claude Code / Codex / Cursor 的 skill 系统都是这个模式的变种。

反模式是**把所有 skill 的详细说明塞进 system prompt** —— 会在几周内烧光 context 预算,并让 skill 冲突藏在散文里。Ch 8 §8.2 讲过词汇表陷阱;skill 层陷阱是同一类,粒度更大。

## "AI 能做 X" ≠ "组织拥有 skill X"

这件事管理层最容易搞错。"AI 能做 X" 意味着:给它合适的 prompt + context,它能产出一次合格的 X。"组织拥有 skill X" 意味着:**任意新成员、任意时间、通过一个有名字的入口,都能得到一次合格的 X**。前者是"能力的 peak",后者是"能力的 median 且稳定"。入口从个人 prompt 调用变成 `skill.invoke("X", args)`;契约从口头约定变成文档化的 pre/postcondition;版本从"上次调得通"变成明确的 `skill-X@v3`;验证从"看结果大概对"变成三层 pass;失效从不可预测变成 `deprecated@v5` 明示退役。

前者是 demo,后者是工程。**管理层最常见的幻觉就是把前者当成后者**,然后问"我们为什么一直不能稳定交付"。答案永远在"你们有 skill 吗"上 —— 不是"AI 能不能做"。

## "0% Human Review" 的真实边界(回引 Ch 5)

[[openai-harness-engineering]] 的著名数字(1M LOC / 1,500 PR / 0% human review)经常被引用成"skill 做到位就不用人类 review"。Ch 5 已讲过真实边界:该数字成立依赖四项前提 —— 内部 agent 仓库、强 CI 约束、AGENTS.md 稳定目录、合规要求低。**"0% human review" 不是跳过验证,是把验证从 PR 级挪到 CI 级**(Ch 9 的核心思路:验证的位置独立,不是能力缺口)。

医疗 / 金融 / 隐私三类场景不适用 —— FDA SaMD、SEC AI disclosure、GDPR DPIA 都要求人类签字。skill 层的启示:**即使 verification 做到 100% 自动,一个 skill 能否走"0% human review"路径,取决于场景的合规属性,不取决于 skill 本身的质量**。

## Skill 与 Tool 的边界

Skill 和 tool 最容易混。**Tool** = "这个**动作**我能做"(黑盒 + 参数);**Skill** = "遇到这种**情况**我这样做"(白盒 + 方法链)。一个 skill 通常**编排多个 tool**。Tool 是词汇表的"词",skill 是由词构成的"习语"。**Tool 少而精(10–20),skill 可以多而专(几十到上百,但要治理)**。

## 两级生命周期对齐

两级的状态机是**同一张图**:Raw / Candidate → **promotion**(evidence / verification / reviewer)→ Stable → **demotion**(staleness / conflict / zero-use)→ Deprecated → **migration**(通告期 + 迁移指引)→ Archived → 超长时间无访问 → Dropped。知识层和 skill 层状态名字一样、转移条件形式一致,只是对象不同。**学会一套治理流水线,同时适用两级**。如果你已经实现了 wiki promotion / demotion,推广到 skill 层的工程代价比你以为的低;反过来也成立。

## 反模式图鉴

两级共享的四大反模式,几乎每个团队第一次做治理都会撞上:

- ❌ **RAG 全量注入 / Skill 膨胀** —— 无 promotion gate,agent 被噪声淹没。修法:加 promotion 判据 + owner 字段,无 owner 不进 stable。
- ❌ **Memory = 对话历史 / Skill = Prompt 模板** —— 没有结构,无法 demote、无法 audit。修法:provenance 六字段作硬 schema,缺一不入库。
- ❌ **Vector DB / Prompt Registry 当真相** —— 丢失层级,无法区分"组织铁律"与"一次性观察"。修法:分 candidate / stable / governing 三层,用 path 或 tag 强制区分。
- ❌ **只 promotion 不 demotion** —— 错误知识和死 skill 永不消失,日积月累毒化 agent。修法:每季度跑 demotion 扫描,`last_verified` / `last_invoked` 超期条目自动降级。

共同根源是**偷懒**:不做治理省一个月的活,用半年攒出一个不能用的库。

## Stanford Meta-Harness 能做什么,不能做什么

[[stanford-meta-harness]] 的 proposer agent 能自动搜索 harness 源码,**它能自动化 skill 的创建吗**?**部分能**。proposer 搜 harness 源码;skill 的 implementation 是 harness 配置的子集,所以 proposer 能提议新 implementation、优化 loop 变体、context packing 策略、tool 调用顺序。**但 contract 仍由人定**,因为 contract 的锚是**人类意图**(Ch 3 的第一性原理)。

换言之:**Stanford 能自动化 implementation,但无法自动化 contract、version、ownership**。这正是 Ch 13 反脆弱第四支柱 "Objective ≠ Optimizer" 的具体落点 —— agent 可以优化手段,人类始终定义目的。Ch 12 §12.6 会把这件事作为 reflexive harness 的极端形态再展开。

Accrete 阶段的 promotion 判据,在 Evolve 阶段会变成"agent 能不能改自己的 promotion 判据"的问题。两级的 contract 都是**禁区**,implementation 是**协商档**,日常 bookkeeping 是**自主档** —— 这三档是下一章主题。

---

## 可观察信号

- 你们的 wiki 有**页面生命周期**吗?还是"一旦写了就永远在"?
- `last_verified` 字段有人在动吗?还是只有 `created_at`?
- 新员工能通过**读 wiki + 看 AGENTS.md** 在三小时内摸清 agent 的能力边界吗?
- 每条 stable 知识 / 每个 stable skill 都有**独立 provenance** 吗?EU AI Act 级审计能回答"这条是怎么进来的"吗?
- 你们的 AGENTS.md 是"目录"(短)还是"百科"(长到塞不进 context)?
- 你们**真的 demote 过**任何 stable 条目吗?如果回答"几乎没有",你们已经在腐烂。

---

## 本章核心论断

1. Agent 长期资产**分两级**:事实(知识层)与方法(skill 层);两级平级,治理原则**结构同构**。
2. 四类积累 **raw / candidate / stable / governing** 生命周期不同,不能一锅粥混。
3. Karpathy 三层分离 **Raw → Wiki → Schema** + 三操作 **Ingest / Query / Lint** 是知识层最小可行架构;**Memory Layer ≠ Retrieval Cache**(向量库是工具,不是记忆)。
4. Promotion ≥ 3 条、Demotion ≥ 3 条,**两者缺一必腐烂**;Demotion 比 promotion 更难做对。**Provenance 六字段是一等公民**,EU AI Act 级审计的硬要求。
5. Skill 四要素 **contract / implementation / verification / version** 齐备才是 stable;**AGENTS.md 作目录,docs/ 作系统记录**。
6. "AI 能做 X" ≠ "组织拥有 skill X";"0% human review" 是**把验证挪到 CI 层**,不是跳过验证 —— 医疗/金融/隐私场景合规结构上不可替代(回引 Ch 5)。
7. Stanford Meta-Harness 能自动化 implementation,**不能自动化 contract** —— Ch 12 §12.6 再展开。

---

## 本章奠基文对齐

- [[case-karpathy-autoresearch]] —— 三层分离、三操作、bookkeeping 洞察
- [[neo4j-context-vs-prompt]] —— memory layer vs retrieval 的立场文本
- [[milvus-execution-layer]] —— retrieval 作为 tool,不作为 memory
- [[openai-harness-engineering]] —— AGENTS.md 作 ToC、1M LOC 实证的真实边界
- [[stanford-meta-harness]] —— 自动化 implementation vs 不能自动化 contract

## 本章对应 wiki 页

- [[concept-memory-layer]] · [[concept-state-durability]] · [[concept-tool-vocabulary]] · [[case-ascent-research]]

---

**Accrete 两级讲完了**。当 agent 开始协助修改自己的 promotion 判据、schema、甚至 harness 源码,**reflexive harness** 的边界问题浮现。第 12 章处理它 —— 长程循环 Evolve 阶段,给 agent 自改权限分三档,**边界写进代码,不写在团队文档里**。
