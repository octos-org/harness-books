# 10. Agent 群体编排：把多脑多手变成可控系统

到这里为止，书里谈的主要还是“一个系统怎么说真话”。第 10 章往前走一步：当系统扩展成多 agent、多负责人、多工作区协作时，harness 是把复杂度**吸收**掉，还是把混乱**倍增**。这两条路的岔口，比大多数团队以为的来得早。

## 10.1 多 agent 的本质不是并行，是角色化

“多脑多手”常被误读成“多开几个 agent 一起跑”。它其实是一种组织结构：多个“脑”分别管规划、生成、验证、总结，多个“手”分别管文件、shell、浏览器、API、数据库、外部系统。而要紧的是——这些脑和手仍然要共享同一条 session 事实流、同一组权限边界、同一套验证规则、同一个操作员视图。[^many-brains-ch10] 一旦它们各拿各的真相，多 agent 就只是把第 5 章那些单 agent 的事故，乘上了 agent 的数量。

所以多 agent 真正缺的，从来不是“更多模型实例”，而是一小套编排原语。得有角色模板，把谁是 coordinator、谁是 worker、谁是 verifier、谁能请求人工输入分清；得有派工协议，规定子任务怎么启动、怎么续跑、怎么被打断；得有通信机制，让中间结论被回传，而不是让每个 agent 去读别人的全量日志；得有隔离机制，把工作区、权限、上下文和副作用彼此隔开；还得有汇总机制，让父任务不必重读所有原始细节，就能拿到可信的摘要和证据。Claude Code 的 `AgentTool.tsx`、`loadAgentsDir.ts`、`teammateMailbox.ts`、`worktree.ts`，和 Codex 的 `spawn_agent`、`send_input`、`wait_agent`、`resume_agent`，绕来绕去建的就是这几样，只是一个更偏产品器官、一个更偏协议原语。[^claudecode-codex-multiagent-ch10]

## 10.2 工作分解，怎样落到系统里的所有权

把第 6 章那张总图继续展开，多 agent 系统里会冒出一组清晰的所有权层：

```text
项目负责人
  -> 定义里程碑契约和验收不变量
Coordinator / Harness 负责人
  -> 负责 session、派工、汇总、升级与终态裁决
专项 worker 负责人
  -> 负责局部域内动作、证据与中间产物
Verifier 负责人
  -> 负责跨 worker 的冲突、遗漏与最终验证
UI / Operator 负责人
  -> 负责把群体协作投影成可读的摘要、证据和告警
```

没有这种角色化拆分，团队就会撞上一种很危险的假象：局部 worker 一个个都“成功了”，可系统级的事实早已被破坏——主产物没有唯一归属，几个子任务改了同一个工作区，汇总结论没过 validator，或者父任务压根不知道哪个子任务已经失联。第 13 章那条“假成功”失败链，根子就在这里。

## 10.3 为什么 sub-agent / swarm 往往胜过一个 1M 上下文

第 2 章给过理论结论：最大上下文窗口不是平坦工作区。到第 10 章，它要落成一个实践判断——什么时候该用单个超长上下文，什么时候该拆成多个局部 agent。如果任务天然可分块，把全部材料一次性塞进一个超长上下文，往往不是最优解。更常见的高收益结构是：coordinator 只攥着总目标、拆解计划、共享约束和最终验收标准；每个 sub-agent 只拿自己那一块原始材料或代码域；子 agent 往上交的是摘要、证据、diff、引用和待验证结论，而不是把整个“大海捞针”的窗口一路向上传；最后由 verifier 把跨 shard 的冲突和遗漏拦下来。

### 10.3.1 成本不能只看 token 账单

聊 1M context 的成本，最常见的误区是只盯 token 单价。账单当然重要，但真正把系统压垮的，往往是 prefill 变慢、首 token 延迟上升、KV cache 撑大、并发吞吐下降、重试变贵，以及调度越来越难。这些信号在价格页上都看得到端倪：OpenAI 公开价格按百万 token 标价，却把标准处理费率限定在 `under 270K` 的上下文长度；Google 发布 Gemini 1.5 时，一边宣布 128K 到 1M 的 pricing tier，一边提醒早期测试者要预期更长的延迟。[^swarm-econ-ch10] 它们都在说同一件事：超长上下文不是普通请求的线性放大版。

而从系统计算看，痛点通常不在 output token，在 prefill。MInference 的摘要给过一个够刺眼的数字——一个 8B 模型处理 1M token 的 prompt，能慢到 30 分钟量级，根因正是 attention 的二次复杂度。[^swarm-econ-ch10] 这不是哪家 API 的实现细节，而是长序列计算的基础压力。

### 10.3.2 “1M” 和 “5 个 200K” 不能只比总 token

做个极端理想化的假设：一个 1M 的请求，和五个各 200K 的请求，总输入 token 恰好相等，没有重复背景、没有协调开销、没有缓存。单看“按 token 计费”的账单，它们也许接近。但真实的 agent 系统很少这么跑——更常见的是 coordinator 持目标、计划、约束和验收，每个子 agent 只持一个 shard 的原料，公共的制度性上下文靠缓存或固定 system prompt 复用，向上交的是摘要而非整份语料。这一来，`5 × 200K` 的真实总 token，常常**小于** `1 × 1M`。

更关键的是，哪怕总 token 真的相等，prefill 的计算量也不等。按 dense attention 做个一阶量级估算：单次 1M 上下文的 attention 规模约是 `1,000,000² = 10¹²`，而五次 200K 的总规模约是 `5 × 200,000² = 2 × 10¹¹`。也就是说，在“总 token 相同”这个最有利于长上下文的理想条件下，`1 × 1M` 的 attention 量级，仍然大约是 `5 × 200K` 的**五倍**。所以工程上要同时翻三本账：账单、时延、可调度性——只看第一本，会做出系统性偏贵的决定。

### 10.3.3 sub-agent 的收益，不只是省钱

很多团队把 sub-agent 当纯吞吐工具，这低估了它——它真正带来的，是质量曲线和成本曲线**同时**改善。单个超长上下文的失败模式，正是第 2 章那几条机理的合演：原料过多，相关证据密度被稀释；中间状态和历史痕迹污染当前任务；query 的位置不稳，关键约束被长正文淹没；而且一次失败，就要重做整段昂贵的大 prefill。拆成 sub-agent 之后，工作形态就变了：每个 agent 看到的上下文更短、更局部，位置偏置更可控；每个 agent 的输入更单纯，更接近一个单一任务；出错只需在局部 shard 重试，不必重灌整段全局上下文；coordinator 处理的是证据摘要和冲突，而不是整片原始语料的海洋。说白了，sub-agent 不是为了炫架构，而是为了把每个 agent **压回它更容易成功的工作区间**，再把跨 shard 的协调，交还给 harness、session 和 verification。

### 10.3.4 什么时候仍该用一个超长上下文

但也别走到另一个极端，把什么都拆成 swarm。有几类任务，单个超长上下文仍然合理：要对全局原文做一次统一的排序、比对或证据归并时；任务主要是全局摘要、不涉及局部修改和反复迭代时；原料高度相关、拆开反而割裂语义连续性时；上下文能一次缓存、多轮查询主要复用同一大语料时；以及你更在意一次性的全局理解、而非并行吞吐时。只要这些前提稍一动摇，sub-agent 方案往往就开始占优——尤其当三条同时成立：材料天然可分 shard、子问题能先局部求解再全局汇总、每轮失败重试代价很高，这时就该优先考虑分解。

## 10.4 让 swarm 不失控的四条硬规则

多 agent 一旦上线，最先失控的通常不是模型质量，是控制面纪律。至少有四条规则要焊死。第一，**子 agent 不直接宣布系统终态**——只有 coordinator 加 verifier 能裁决 ready / failed，这是第 13 章那条假成功链的正面解药。第二，**子 agent 之间不共享隐式上下文**，能共享的只有显式的任务说明、事实流引用和被授权的中间产物，否则就回到第 5.3 节那种串扰。第三，**每个子 agent 都必须能被单独恢复、单独取消、单独审计**——群体里一旦有谁不可单独操作，排障时就只能整片重来。第四，**任何协议、生命周期、回放或 scope 语义的变更，都要同步更新 fixture、门禁、E2E 和文档**，否则多 agent 的复杂度会让一处不同步迅速扩散成多处事故。守不住这四条，多 agent 只会比单 agent 更快地制造混乱；守住了，它才真正变成能放大团队产能的协作系统。

## 10.5 把那条任务交给一个 swarm：谁有权说 ready

§10.4 那四条硬规则里，第一条最该被做成协议而不是口号——“子 agent 不直接宣布系统终态”。把它讲透，最好的办法还是回到那条贯穿全卷的周报任务，只不过这次，它不再由一个 agent 独力完成，而是被拆给一个小 swarm：

```text
coordinator ──spawn_agent("data-worker",     goal="渲染 q2 PDF")──────────▶ w1
coordinator ──spawn_agent("delivery-worker",  goal="发到 #finance", needs=[a_pdf_1])──▶ w2
coordinator ──spawn_agent("verifier",         goal="按契约核对产物", gating=true)──▶ v1
```

三个 worker 各干各的，但它们写进的是**同一条**事实流，只是每条事件都带上 `actor` 标明出处。于是那次熟悉的失败，在 swarm 里长这样：

```jsonl
{"seq":5, "actor":"agent:w1",          "type":"artifact.written","kind":"report.pdf","artifact_id":"a_pdf_1"}
{"seq":7, "actor":"agent:w2",          "type":"tool.returned","tool":"slack.upload","ok":false}
{"seq":8, "actor":"agent:w2",          "type":"subagent.reported","status":"blocked","reason":"upload_incomplete"}
{"seq":9, "actor":"agent:v1",          "type":"validator.result","validator":"slack.delivered","ok":false,"gating":true}
{"seq":10,"actor":"agent:coordinator", "type":"task.settled","state":"failed","reason":"required_validator_failed:slack.delivered"}
```

关键不在这串事件本身，而在**谁有资格写哪一种事件**。把它做成一张权限表，第一条硬规则就从一句叮嘱变成了系统强制的边界：

```text
事件类型            允许写入的角色
  artifact.written    任何 worker（只能写自己 scope 内的产物）
  subagent.reported   worker 自己（done / blocked / failed，仅描述本子任务的状态）
  validator.result    仅 verifier
  task.settled        仅 coordinator，且必须在所有 gating validator.result 之后
```

读懂这张表，整本书的论点在多 agent 这层闭合了。delivery-worker（w2）上传失败时，它**能**做的，是诚实地写一条 `subagent.reported: blocked`——描述“我这一步卡住了”；它**不能**做的，是写 `task.settled`——宣布“整单完成”。这一行权限，正是第 6 章那条“模型只能 `model.claim`、无权宣布终态”的规则，在 swarm 拓扑上的同构投影：worker 只能提议和汇报，verifier 只能裁定单项，唯有 coordinator 能在所有 gating 项落定之后，写下那一条 `task.settled`。

反过来想就更清楚了。一个偷懒的 swarm，如果允许 delivery-worker 自己喊一句“发完了，收工”，那它不过是把第 6 章那个单 agent 的“假成功”，原样乘上了 agent 的数量——每多一个能自宣终态的 worker，就多一个能撒谎的嘴。这也正是 §10.3 那个判断的另一面：sub-agent 的价值从来不是“多开几个并行”，而是在“多嘴多手”的同时，把**裁决权死死收敛到一个角色**。手可以很多，脑可以分工，但说“这单成了”的权力，整个 swarm 里只能有一份。[^claudecode-codex-multiagent-ch10] 谁都能宣布成功的系统，等于谁都没在负责成功。

## 10.6 一个 worker 中途崩了，群体怎么不塌

§10.5 演的是“失败被诚实地汇报、终态被正确地裁决”，那是一条相对干净的链：每个 worker 都活到了能写下自己那条 `subagent.reported` 的时刻。但真实的 swarm 里有更难看的一种情况——某个 worker 根本没机会体面收场，它在半道上崩了。进程被 OOM 杀掉、worktree 里一个本地依赖装不上、渲染库踩到一个段错误，于是它既没产出产物，也没来得及说“我卡住了”。这种“沉默的死”，恰恰是最考验控制面纪律的地方：一个没有角色化、不能单独恢复的系统，遇到它只有两条退路，要么整局推倒重跑，要么更糟——某个还活着的 agent 看见缺了块东西，自作主张地把窟窿填上，合成出一个假成功。

还是那三个 worker：data-worker `w1` 负责把 q2 数据渲染成 PDF，delivery-worker `w2` 负责把它发到 `#finance`，verifier `v1` 负责按契约核对。这次让 `w1` 在渲染到一半时崩掉。要紧的是看清，控制面是怎么把这次崩溃**吸收**进一条恢复链，而不是让它向上**放大**成一次全局重跑或一个绿色谎言。

第一道纪律，是 `w1` 的死讯只能以它自己的口吻被记下。崩溃本身由 coordinator 通过 `wait_agent` 观察到——子进程非正常退出，没有任何 `artifact.written`。注意这里有一个微妙但要命的边界：`w1` 能为自己写下（或被代写）一条 `subagent.reported:{status:"failed"}`，说的是“我这一步没成”，它绝写不出 `task.settled`。这正是 §10.4 第一条在崩溃路径上的回响——子 agent 描述自己这一步的死活，但永远无权宣布系统的终态。一个进程哪怕死了，它能污染的也只是自己 scope 内的那一格事实，碰不到那张只有 coordinator 能写 `task.settled` 的权限表。

第二道纪律，是恢复落在一个干净的工作区里，而不是原地缝补。coordinator 读到 `w1` 失败，并不去翻它崩溃时留下的半成品 worktree——那里可能有写了一半的 PDF、半截临时文件、一个坏掉的字体缓存。它做的是 §10.4 第三条所说的“单独恢复”：在一个全新的 worktree 里重新派发 `w1` 的子任务，给它一个新的 actor 身份 `w1'`，让它从干净状态重渲一次。整局里其余两个 worker 的事实、其余 shard 的进度，一格都不用动。这就是角色化与单独恢复合起来的红利：失败的爆炸半径，被收敛到一个子任务、一个 worktree。

第三道纪律，是下游 worker 因依赖未就绪而**正确地等待**，而不是抓着一个不存在的产物硬发。`w2` 的派工带着 `needs=[a_pdf_1]`。在 `w1` 崩到 `w1'` 重渲成功、`a_pdf_1` 真正落进事实流之前，`w2` 的前置条件就是不满足，它只能挂在 `blocked` 上等。这一条等待是被结构逼出来的，不是靠 `w2` 自觉——产物契约里那条 `a_pdf_1` 的依赖，物理上挡住了它去 `slack.upload` 一个空文件或一个上一轮的陈旧 PDF。把这条恢复链演出来，事实流大致是这样：

```jsonl
{"seq":12,"actor":"agent:w1",          "type":"tool.called","tool":"pdf.render","args_digest":"…q2…"}
{"seq":13,"actor":"agent:coordinator", "type":"subagent.reported","subagent":"w1","status":"failed","reason":"worker_crashed:exit_signal_SIGSEGV"}
{"seq":14,"actor":"agent:w2",          "type":"subagent.reported","status":"blocked","reason":"needs_unmet:a_pdf_1"}
{"seq":15,"actor":"agent:coordinator", "type":"subagent.respawned","of":"w1","as":"w1'","worktree":"wt_q2_retry","clean":true}
{"seq":16,"actor":"agent:w1'",         "type":"artifact.written","kind":"report.pdf","artifact_id":"a_pdf_1"}
{"seq":18,"actor":"agent:w2",          "type":"tool.returned","tool":"slack.upload","ok":true}
{"seq":19,"actor":"agent:w2",          "type":"artifact.written","kind":"delivery.receipt","artifact_id":"a_rcpt_1"}
{"seq":20,"actor":"agent:v1",          "type":"validator.result","validator":"shard.consistency","ok":false,"gating":true,"reason":"a_pdf_1 渲染自 shard 切换前的旧游标"}
{"seq":22,"actor":"agent:v1",          "type":"validator.result","validator":"slack.delivered","ok":true,"gating":true}
{"seq":24,"actor":"agent:coordinator", "type":"task.settled","state":"failed","reason":"required_validator_failed:shard.consistency"}
```

这条流里藏着第四道纪律，也是最容易被“多开几个 agent”忽略的一道：verifier 是跨 shard 的最后一道闸。`w1'` 在干净 worktree 里重渲时，恰好赶上数据层做了一次 shard 切换，它读到的是切换前那一刻的旧游标，于是 PDF 本身渲染成功、`slack.delivered` 也为真——单看 `w2` 这条链，一切都绿。可 `v1` 的 `shard.consistency` 验证器是独立于任何单个 worker 的视角，它比对了产物所依据的游标与当前权威游标，`seq:20` 那条 `ok:false` 把这个隐患拦在了终态之前。于是 coordinator 在 `seq:24` 写下的不是 ready，而是一条理由明确的 `failed`。这恰好呼应了第 13 章那条“可闭合验证器要 sound、要独立”的要求——独立，意味着它不被任何一个声称自己干完了的 worker 牵着走。

把这条恢复链倒过来看，对比就刺眼了。一个只会“多开几个 agent”、却没把角色与单独恢复能力焊进控制面的系统，遇到同样的 `w1` 崩溃，只剩两种难看的结局。第一种是整片重跑：因为没有“单独恢复一个子任务”的原语，唯一安全的做法就是把三个 worker 连同已经算对的部分一起推倒，付一次完整的、昂贵的 prefill 和 API 账单，这正是 §10.3 想让你省下的那笔钱。第二种更危险：某个还活着的 agent——比如一个被允许自宣终态的 `w2`——看见缺了 `a_pdf_1`，顺手抓起上一轮缓存里的旧 PDF 发了出去，再写一条“已发送”，于是崩溃被一路向上**放大**成了一个绿色气泡，正是贯穿全书那条 `t_9f2` 假成功的 swarm 翻版。区别从来不在 agent 的数量，而在那张权限表是否还立着：worker 只描述自己这一步、恢复落在干净 worktree、下游因 `needs` 未就绪而等待、verifier 独立把跨 shard 的隐患拦下、唯有 coordinator 在所有 gating 项落定后写终态。守住这五点，一个 worker 中途崩了，群体顶多慢一拍；守不住，它崩的那一下，会被整个群体齐声放大成一句谎话。

[^many-brains-ch10]: Anthropic, *Scaling Managed Agents: Decoupling the brain from the hands.* 本章在此处使用其 many brains / many hands 的组织视角，说明 coordinator、worker 与 verifier 的分工；对应第 23 章参考文献 3。
[^claudecode-codex-multiagent-ch10]: 本章在此处综合 Claude Code 的 `AgentTool.tsx`、`loadAgentsDir.ts`、`teammateMailbox.ts`、`worktree.ts` 等实现，以及 Codex `spawn_agent` / `send_input` / `wait_agent` / `resume_agent` 等工具原语，用来说明多 agent 需要角色、通信、隔离、汇总与恢复这些一等能力；对应第 23 章参考文献 21、24。
[^swarm-econ-ch10]: 本章在此处综合 Anthropic 的 managed agents 视角、OpenAI API Pricing 关于 `under 270K` 标准费率的限定、Google Gemini 1.5 关于 1M context pricing tiers 与 latency 的说明、Google long context 文档关于 retrieval-cost tradeoff 与 caching 的说明、LongLLMLingua 关于 higher computational cost / performance reduction / position bias 的概括，以及 MInference 关于 1M token prefill 代价的摘要数字，用于说明 sub-agent / swarm 在质量、成本与时延上的优势；对应第 23 章参考文献 3、14、15、18、19、20。

---
