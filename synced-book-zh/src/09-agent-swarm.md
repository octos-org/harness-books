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

[^many-brains-ch10]: Anthropic, *Scaling Managed Agents: Decoupling the brain from the hands.* 本章在此处使用其 many brains / many hands 的组织视角，说明 coordinator、worker 与 verifier 的分工；对应第 21 章参考文献 3。
[^claudecode-codex-multiagent-ch10]: 本章在此处综合 Claude Code 的 `AgentTool.tsx`、`loadAgentsDir.ts`、`teammateMailbox.ts`、`worktree.ts` 等实现，以及 Codex `spawn_agent` / `send_input` / `wait_agent` / `resume_agent` 等工具原语，用来说明多 agent 需要角色、通信、隔离、汇总与恢复这些一等能力；对应第 21 章参考文献 21、24。
[^swarm-econ-ch10]: 本章在此处综合 Anthropic 的 managed agents 视角、OpenAI API Pricing 关于 `under 270K` 标准费率的限定、Google Gemini 1.5 关于 1M context pricing tiers 与 latency 的说明、Google long context 文档关于 retrieval-cost tradeoff 与 caching 的说明、LongLLMLingua 关于 higher computational cost / performance reduction / position bias 的概括，以及 MInference 关于 1M token prefill 代价的摘要数字，用于说明 sub-agent / swarm 在质量、成本与时延上的优势；对应第 21 章参考文献 3、14、15、18、19、20。

---
