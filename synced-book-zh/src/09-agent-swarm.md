# 8. Agent 群体编排：把多脑多手变成可控系统

到这里为止，书里讨论的主要还是“单个系统如何说真话”。第 8 章再往前走一步：当系统开始扩展成多 agent、多负责人、多工作区协作时，harness 如何把复杂度吸收掉，而不是把混乱倍增。

## 8.1 多 agent 的本质不是并行，而是角色化

所谓“多脑多手”，并不是多开几个 agent 并行干活，而是一种组织结构：多个“脑”分别负责规划、生成、验证、总结，多个“手”分别负责文件、shell、浏览器、API、数据库、外部系统。关键在于，这些脑和手仍然要共享同一个 session 事实流、同一组权限边界、同一套验证规则和同一个操作员视图。[^many-brains-ch8]

所以多 agent 真正需要的不是“更多模型实例”，而是至少下面这些编排原语：

- 角色模板：谁是 coordinator，谁是 worker，谁是 verifier，谁可以请求人工输入；
- 派工协议：子任务怎么启动、怎么续跑、怎么被打断；
- 通信机制：中间结论如何回传，而不是彼此读对方全量日志；
- 隔离机制：工作区、权限、上下文和副作用如何彼此隔开；
- 汇总机制：父任务如何在不重读所有原始细节的前提下，拿到可信摘要和证据。

Claude Code 的 `AgentTool.tsx`、`loadAgentsDir.ts`、`teammateMailbox.ts`、`worktree.ts`，以及 Codex 的 `spawn_agent`、`send_input`、`wait_agent`、`resume_agent`，其实都在围绕这几件事建设，只是一个更偏产品器官，一个更偏协议原语。[^claudecode-codex-multiagent-ch8]

## 8.2 实战上的工作分解应该怎样落到系统里

如果把第 4 章那张总图继续展开，多 agent 系统里至少会出现下面这些所有权：

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

没有这种角色化拆分，团队很容易出现一种危险假象：局部 worker 都“各自成功了”，但系统级事实已经被破坏，比如主产物没有唯一归属、多个子任务修改了同一工作区、汇总结论没有经过 validator，或者父任务根本不知道哪个子任务已经失联。

## 8.3 为什么 sub-agent / swarm 往往比单个 1M 上下文更优

第 1 章已经给出理论结论：最大上下文窗口不是平坦工作区。到了第 8 章，这个理论要落成实践判断：什么时候应该用单个超长上下文，什么时候应该拆成多个局部 agent。

如果任务天然可以分块，把全部材料一次性塞进单个超长上下文，往往不是最优解。更常见的高收益结构是：

1. coordinator 只持有总目标、拆解计划、共享约束和最终验收标准；
2. 每个 sub-agent 只拿自己那一块原始材料或代码域；
3. 子 agent 产出的是摘要、证据、diff、引用和待验证结论，而不是把整个大海捞针窗口一路向上传递；
4. verifier 再把跨 shard 的冲突和遗漏拦下来。

### 8.3.1 成本不能只看 token 账单

讨论 1M context 成本时，最常见的误区是只看 token 单价。账单当然重要，但真正把系统压垮的，常常是 prefill 变慢、首 token 延迟上升、KV cache 撑大、并发吞吐下降、重试变贵，以及任务调度越来越难。

OpenAI 公开价格页按百万 token 标价，但也把标准处理费率限定在 `under 270K` context lengths；Google 在 Gemini 1.5 发布时一方面宣布 128K 到 1M 的 pricing tiers，另一方面提醒早期测试者应预期更长 latency。[^swarm-econ-ch8] 这些信号说明，超长上下文不是普通请求的线性放大版。

从系统计算看，痛点通常不在 output token，而在 prefill。MInference 摘要里给过一个足够刺眼的数字：8B LLM 处理 1M token prompt 可以到 30 分钟量级，并把根因指向 attention 的二次复杂度。[^swarm-econ-ch8] 这不是某家 API 的具体实现细节，而是长序列计算的基础压力。

### 8.3.2 1M 和 5 个 200K 不能只比总 token

如果做一个极端理想化假设：一个 1M 请求，和五个各 200K 的请求，总输入 token 恰好一样，没有重复背景、没有协调 token、没有缓存，那么从“按 token 计费”的账单角度看，它们可能接近。

但真实 agent 系统很少这么运行。更常见的是：coordinator 持有目标、计划、约束和最终验收；每个子 agent 只持有一个 shard 的原始材料；公共制度性上下文通过缓存或固定 system prompt 复用；向上汇报的是摘要、证据、diff、引用和中间产物，而不是整份原始语料。这时 `5 x 200K` 的真实总 token 常常小于 `1 x 1M`。

即使总 token 恰好一样，prefill 计算量也不一样。若按 dense attention 做一阶量级估算：

- 单次 1M 上下文的 attention 规模约为 `1,000,000^2 = 10^12`；
- 五次 200K 的总 attention 规模约为 `5 * 200,000^2 = 2 * 10^11`。

也就是说，在“总 token 相同”的理想化条件下，`1 x 1M` 的 attention 量级仍然大约是 `5 x 200K` 的 5 倍。工程上要同时看三本账：账单、时延、可调度性。

### 8.3.3 sub-agent 的收益不是只省钱

很多团队把 sub-agent / swarm 只当成吞吐工具，这是低估了它。它真正带来的，是质量曲线和成本曲线的同时改善。

单个超长上下文的失败模式往往是：原始材料过多，相关证据密度下降；中间状态和历史痕迹污染当前任务；query 位置不稳定，重要约束被长正文淹没；一次失败就要重做整段大 prefill。

分解成 sub-agent 之后，系统得到的是另一种工作形态：每个 agent 看到的上下文更短、更局部，位置偏置更可控；每个 agent 的输入类型更单纯，更接近单一任务；错误只需在局部 shard 重试，不必重灌整段全局上下文；coordinator 处理的是证据摘要和冲突，而不是整个原始语料海洋。

换句话说，sub-agent 不是为了炫耀架构复杂，而是为了把每个 agent 压回它更容易成功的工作区间，再把跨 shard 协调交给 harness、session 和 verification。

### 8.3.4 什么时候仍然该用单个超长上下文

不是所有任务都该拆成 swarm。以下几类任务，单个超长上下文仍然可能是合理选择：

- 必须对全局原文做一次统一排序、比对或证据归并；
- 任务主要是全局摘要，不涉及局部修改和重复迭代；
- 原始材料高度相关，拆分后反而破坏语义连续性；
- 上下文可以一次缓存，多轮查询主要复用同一大语料；
- 你更在意一次性全局理解，而不是并行吞吐。

但这些前提只要稍微动摇，sub-agent 方案往往就开始占优。尤其当任务同时满足三条：材料天然可分 shard；子问题可以先局部求解再全局汇总；每轮失败重试代价很高，就应当优先考虑分解。

## 8.4 让 swarm 不失控的四条硬规则

多 agent 一旦上线，最容易失控的不是模型质量，而是控制面纪律。因此至少要守住四条硬规则：

1. 子 agent 不直接宣布系统终态；只有 coordinator + verifier 能裁决 ready / failed。
2. 子 agent 之间不共享隐式上下文；共享的只有显式任务说明、事实流引用和被授权的中间产物。
3. 每个子 agent 都必须能被单独恢复、单独取消、单独审计。
4. 任何协议、生命周期、回放或 scope 语义变更，都必须同步更新 fixture、门禁、E2E 和文档。

守不住这四条，多 agent 只会比单 agent 更快制造混乱。守住了，它才会真正变成能放大团队产能的协作系统。

[^many-brains-ch8]: Anthropic, *Scaling Managed Agents: Decoupling the brain from the hands.* 本章在此处使用其 many brains / many hands 的组织视角，说明 coordinator、worker 与 verifier 的分工；对应第 19 章参考文献 3。
[^claudecode-codex-multiagent-ch8]: 本章在此处综合 Claude Code 的 `AgentTool.tsx`、`loadAgentsDir.ts`、`teammateMailbox.ts`、`worktree.ts` 等实现，以及 Codex `spawn_agent` / `send_input` / `wait_agent` / `resume_agent` 等工具原语，用来说明多 agent 需要角色、通信、隔离、汇总与恢复这些一等能力；对应第 19 章参考文献 21、24。
[^swarm-econ-ch8]: 本章在此处综合 Anthropic 的 managed agents 视角、OpenAI API Pricing 关于 `under 270K` 标准费率的限定、Google Gemini 1.5 关于 1M context pricing tiers 与 latency 的说明、Google long context 文档关于 retrieval-cost tradeoff 与 caching 的说明、LongLLMLingua 关于 higher computational cost / performance reduction / position bias 的概括，以及 MInference 关于 1M token prefill 代价的摘要数字，用于说明 sub-agent / swarm 在质量、成本与时延上的优势；对应第 19 章参考文献 3、14、15、18、19、20。

---
