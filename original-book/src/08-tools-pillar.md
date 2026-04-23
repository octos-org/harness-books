# 第 8 章 · Tools 是可问责的动作词汇表

> **命题**:Tool **不是** 给 agent 的 API 集合,**是**动作词汇表;词汇表的三个硬要求是**正交、可问责、与权限绑定**。定义词汇表的人,就在定义 agent 的社会契约。

## 开场:一个工程师盯着 47 行 JSON 看了很久

一位负责 agent 平台的工程师,被拉进一间会议室做 tool 清单的季度复查。投影仪上是一份 `tools.yaml`,47 个工具,从 `read_file` 到 `send_slack_message` 到 `cancel_subscription`,按加入顺序排列。安全团队的人问他第一个问题:

> "第 7 号这个 `invoke_workflow`,你能一句话说清楚它是做什么的吗?"

他看了几秒。然后他开始解释:这个工具是三年前加的,当时的需求是让 agent 能触发一条 Zapier 自动化流,但后来 Zapier 换了接口,于是内部又拿它包了一层 Slack 提醒,再后来某个客户要求接入他们的 CRM,于是它又加了一段"如果目标系统是 Salesforce 就走另一条分支"的逻辑……一句话解释不下来。

安全的人接着问第二个问题:"如果一个 agent 同时调用 `read_file` 和这个 `invoke_workflow`,能不能把任何一个文件的内容通过某条 workflow 路径发到你不信任的第三方?"

这位工程师第二个问题也答不上来。不是因为答案是"能",也不是因为答案是"不能",是因为他从来没有**以词汇表组合的视角**看过这份 tool 清单。在他的心智模型里,这 47 个工具是 47 个独立的 API,每个的安全性各自评估过。**他从没把它们当成"词" 来看,所以也没想过词与词能拼出什么句子**。

本章要讲的就是这件事:为什么 tool 不是 API 集合,为什么它是一份词汇表,以及,作为词汇表的设计者,你每次加一个词都在给 agent 的行为空间扩张一块新的语法区域 —— **哪怕你自己没意识到**。

Ch 6 讲过 session 是事实的载体,Ch 7 讲过 harness 是调度的脑干。两根柱立起来,到这一步 agent 还没真正作用于世界。真正让 "candidate action" 变成"real operation" 的那一步 —— 改一份文件、发一封邮件、扣一次款 —— 都发生在 tools 这一层。[[milvus-execution-layer]] 用一句话把这件事压缩到底:

> *The brain generates candidate actions; the execution layer turns those candidates into real operations. Without it, every agent action has to fit inside one prompt/response — which does not scale past toys.*

**Tool 是 agent 面向世界的那扇门**。门的形状、宽度、门禁规则、哪两扇门能同时开、哪两扇门绝不能同时开 —— 全部是工程师**一次性**的设计决策,之后 agent 的所有行为都会被这些决策塑形。开头那位工程师面对的困境,不是他写得不认真,是他把自己的工作**误认成了"加 API"**,而不是"修订词汇表"。从第一种视角到第二种视角的切换,就是这一章要钉下的那根桩子。

## §8.1 为什么叫"词汇表",不叫"API 集合"

把开场那场会议再往下推一步。如果你是那位工程师,散会之后你最该改的不是某个工具的实现,是**你对这件事的词**。你过去每次讨论工具,脑子里浮现的是什么?是不是"给 agent 一组 endpoint",就像后端给前端提供 REST API 那样?这个心智模型在 agent 语境下会漏掉一整层问题 —— **它漏掉的那一层,恰恰是事故最常发生的那一层**。

**API 集合** 的心智模型是:你列出若干调用端点,每个端点独立评估 —— schema 对不对、权限对不对、错误处理对不对、速率限制对不对。你心里的图景是一个**列表**,每一项是一个独立单元。这个图景适合描述"前端调后端" 那一类场景,因为在那里,调用者的意图是人预先写好的,每次调用只产生一个独立的副作用,不存在"调用者自己组合"这回事。

**Vocabulary** 的心智模型完全不同。每个 tool 是一个"词";词与词之间的**组合** 会产生新语义;治理词汇表的人要同时考虑三件事:每个词的含义、词与词的组合会拼出什么句子、**哪些句子不应该被拼出来**。这里的调用者不是人,是 LLM —— 一个会**自己组词**、会在跨调用之间**构建组合策略**、会在发现某组词能够达成某个隐含目标时**主动选用该组合**的调用者。你设计的不是 endpoint 列表,是**一种语言的语法**。

这个区分不是文字游戏。它决定两件事。

**第一件事**:你是否会主动设计 tool 的**正交性**。如果你认为你在维护一组 API,那 "是否重复" 只是代码洁癖层面的问题 —— `read_file` 和 `cat_file` 重合了,无非浪费一行文档。但如果你认为你在维护一份词汇表,那两个词表达同一动作**本身就是语义污染**:模型在两个同义词之间选时会迷茫,在文档里看到两条几乎相同的描述会开始幻觉参数,在事故复盘里两个工具的行为差异会被埋到 git blame 里。**正交不是美学,是语言治理**。

**第二件事**:你是否会主动设计**组合不变量**。API 集合的心智模型不会问"A 和 B 的组合能做什么",因为它默认每个端点各自评估就够了。词汇表的心智模型必须问 —— 因为词本来就是为了被组合。一个词汇表里有 `read_file`、有 `send_email`、有 `list_directory`,**单独看每一个都合规**;但组合起来的那个句子是"把任意文件的内容通过邮件发出去"—— 这是组合语义,不是单点语义。Ch 13 会把这类失败专门命名为 **tool escape**(工具逃逸),并把它当作 session / harness / tools / verification 四柱失败的归因样本之一。

把这两件事加起来,可以得到一条判据。**当你加一个新 tool 的时候,你应该问:它与现有词汇表每一个词的组合,分别会生成什么样的新句子?** —— 如果你答不上来、或者回答"这问题太大没法列举",那你还在用 API 集合的心智做词汇表的工作。这正是那 47 行 YAML 安全复查的真正问题:**它从来没被当作语法来治理过**。

## §8.2 三个硬要求:正交、可问责、与权限绑定

一份合格的 tool vocabulary 必须同时满足三件事。缺一件,它就只是个 API 清单。

### 要求 1 · 正交 —— 每个词有一件独立的事

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

### 要求 2 · 可问责 —— 每次调用都留痕

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

### 要求 3 · 与权限绑定 —— credentials 不进 sandbox

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

## §8.3 一个 tool call 事件在 session.jsonl 里长什么样

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

## §8.4 Guides + Sensors —— Fowler 的两类控制在 tool 层的落地

[[fowler-on-harness]] 里 Fowler 的核心分析框架是 **computational controls(deterministic)** 和 **inferential controls(non-deterministic)** 两分。放到 tool 层,这个分类变形为一对更好用的工程术语 —— **guides(feedforward)** 和 **sensors(feedback)**。它们在每一次 tool call 的时间轴上,占据调用**之前** 和**之后** 两个位置。

### Guides:调用之前的守卫

Guide 在 tool 真正执行**之前** 起作用。典型实现是 tool schema、argument validation、allowlist、dry-run 预演。它的目的只有一个:**在副作用发生之前,拒绝不应该发生的那些调用**。

举一个具体例子。某团队的 `write_file(path, content)` 的 guide 长这样:

- 路径必须在 `/workspace/` 下(allowlist)
- content 不能是二进制(content-type 检查)
- 写入前先 dry-run 一次,看这次写入是否会让仓库中的 `.gitignore` 失效
- 写入前比对 path 的 lock 状态,确认没有别的 agent 正在写同一路径

这几条检查做完,这次 `write_file` 才真正落盘。任何一条挂掉,tool 返回 `status: "guard_failed"`,连同失败原因一起写进 session;**副作用从未发生**。

一个真实失败场景:某次 agent 在迁移代码时,意图"把旧文件移到 archive/"—— 它用 `write_file` 直接写 `/archive/old_foo.py` 作为目标。因为 `/archive/` 不在 `/workspace/` 下,path allowlist guard 拦住了这次调用。session 里留下一条 `guard_failed` 事件,attached reason 是 `"path_not_in_workspace"`。agent 看到这条 feedback,下一轮改走 `move_file` 工具(它的 guard 允许跨目录但要求 source 和 dest 都在 allowlist 上),成功完成迁移。**Guard 的价值不在"拦住错误调用",在"让错误调用变成 feedback",不让它污染物理世界**。

### Sensors:调用之后的观测

Sensor 在 tool 调用**之后** 起作用。典型实现是 output 校验、副作用对齐检测、异常序列模式识别。它的目的是:**副作用发生后,尽快检测出"虽然调用本身合规,但结果不合预期" 的情况**。

仍以 `write_file` 为例,sensor 的一组具体实现:

- **diff scope sensor** —— 这次写入产生的 diff 是否超出了当前 sprint 声明的文件范围?超出就发 `sensor_warning`。
- **forbidden imports sensor** —— 写入的代码是否引入了项目 `.agent-forbidden-imports` 列表里的依赖(比如 `eval / exec / requests.get(verify=False)`)?
- **binary diff sensor** —— 虽然内容不是二进制,但 diff 里是否出现了 base64 大段字符串这类"混入二进制"的模式?
- **test coverage sensor** —— 写入的源文件是否有对应的测试文件同步改动?没有就发 `coverage_regression` 事件,但**不 block 本次调用** —— 因为它属于 architecture fitness,不是 correctness(Fowler 的三层分类)。

一个真实场景:agent 在实现一个 payment 相关的函数,它的 `write_file` 合法通过了所有 guard,落盘成功。diff scope sensor 在 `tool_result` 之后立刻跑,发现 diff 里有一处改到了 `/billing/rate_limit.py`—— 而当前 sprint contract 里声明的改动范围是 `/billing/checkout.py`。sensor 发出 `scope_drift` 警告,harness 把这条警告注入下一轮 agent 的 context,agent 回滚了那一处越界修改。

**只有 guide 不够**:模型可以用完全合法的参数,做出不合预期的事。**只有 sensor 不够**:副作用已经发生了,回滚本身有成本、有时甚至不可逆(想一下 `send_email` 之后再想 "取消"—— 邮件已经出去了)。成熟的 tool 层**成对设计** guide 和 sensor,让每个词都有前置守卫 + 后置检查。这对"双柱"在词汇表治理上的价值,等同于编译器里"语法分析 + 语义分析" 的两段:**任何一段缺失,都会让错误的"句子" 溜进生产**。

## §8.5 Milvus 五组件到本书四柱的映射

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

## §8.6 Tool 层治理:谁能加、谁能撤、谁在审计

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

## §8.7 失败模式前瞻:Tool Escape 与 Hallucinated Parameters

Ch 13 会把 tool 层的失败模式展开到博物馆级别,这里先埋两根最重要的标记作跨章索引。

**Tool Escape(组合逃逸)**:两个独立看安全的 tool 组合使用,产生了超出单 tool 权限的能力。§8.2 讲过的 `read_file + send_email` 只是最简单的一种;更隐蔽的组合如 `fetch_url + write_file`(用外部内容覆写项目文件,供应链式污染)、`run_tests + modify_ci`(改 CI 标准让失败的测试通过)、`read_calendar + create_meeting`(通过新会议的描述字段泄露私密日历内容)。防御不是"更严格地审每个单 tool",是在 harness 或 MCP proxy 层**识别并拦截可疑的调用序列模式**。

**Hallucinated Parameters(参数幻觉)**:模型幻觉出 tool 不支持的参数,tool 返回报错,但**模型在下一轮可能"假装没发生" 继续推进**,导致状态漂移 —— 它以为副作用已经产生,但实际什么都没发生。防御是 **schema 严格验证 + 失败信号强制回传 session + 下一轮 prompt 显式展示上一次失败原因** 三件事合起来。

两类失败的共同点:**都是结构性问题,靠"提醒模型小心" 解决不了**,只能在 harness 和 tools 两层设计出来。词汇表治理不只是"把词写对",更包括"把不该拼出来的句子拦在语言系统之外" —— 后一半,才是 tool 层真正的工程深度。

---

## 可观察信号

- 你能**一句话说出**你系统里每个 tool 的"正交职责" 吗?说不出来的那些,就是不正交的物证。
- 每次 tool call 的六字段(tool / input / output / actor / ts / parent_event_id)都在 session 里吗?缺一个,后续审计就会断链。
- **Credentials 是否物理上不可被 agent 看到**?如果答"agent 其实能读到 token,只是我们信它不会滥用",这就是 narrow-scoped token 赌局,不合格。
- 你的 tool 层有 guard(feedforward) 和 sensor(feedback) 两种控制吗?只有一种 = 半条腿走路。
- 你们加一个新 tool 的流程里,有没有**组合安全性检查** 这一步?如果没有,你们在维护 API 集合,不是词汇表。

---

## 本章核心论断

1. Tool **不是** API 集合,**是** 动作词汇表 —— 词与词的**组合** 决定 agent 的行为边界。
2. 三个硬要求:**正交 / 可问责 / 与权限绑定**。缺一个都不合格。
3. **安全不建立在"模型不够聪明"上**,建立在**结构性权限边界** 上。Credentials 不进 sandbox,Vault + MCP proxy 解耦。
4. **Guides + Sensors** 必须成对设计 —— 前置守卫 + 后置检查,任何一端缺失都会出现可预期的失败模式。
5. Tool call 必须**全部进 session**,每条事件含六字段。这是 Ch 9 verification 独立性的上游信号来源。
6. Tool 层治理包括**谁能加 / 谁能撤 / 谁审计** 三个动作。**agent 自主创建 tool = 禁区档**(Ch 12)。
7. Tool Escape 和 Hallucinated Parameters 是两类结构性失败,Ch 13 展开为失败模式博物馆的样本。

---

## 本章奠基文对齐

- [[milvus-execution-layer]] —— execution layer 作为 agent 本质;五组件切分
- [[anthropic-managed-agents]] —— credentials 不进 sandbox、narrow-scoped token 赌局
- [[fowler-on-harness]] —— computational vs inferential controls;guides + sensors
- [[mindstudio-harness]] —— 五柱分类中 tool orchestration + guardrails 的并置

## 本章对应 wiki 页

- [[concept-tool-vocabulary]] · [[concept-observability]] · [[concept-harness]]

---

**前三柱是"做什么 + 怎么做"**。Session 是事实,harness 是调度,tools 是动作边界。**第 9 章的第四柱回答一个更锋利的问题:谁来证明 agent 做的事是对的?** —— verification 的独立性,是本书反脆弱论证的核心支点;也是开场那位工程师在下一次季度复查里,必须准备好回答的第三个问题。
