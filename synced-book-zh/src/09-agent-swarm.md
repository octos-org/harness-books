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

如果任务天然可以分块，那么把全部材料一次性塞进单个超长上下文，往往不是最优解。更常见的高收益结构是：

1. coordinator 只持有总目标、拆解计划、共享约束和最终验收标准；
2. 每个 sub-agent 只拿自己那一块原始材料或代码域；
3. 子 agent 产出的是摘要、证据、diff、引用和待验证结论，而不是把整个大海捞针窗口一路向上传递；
4. verifier 再把跨 shard 的冲突和遗漏拦下来。

这样做的好处不是单一维度的，而是四个维度一起改善：

- 质量上：减少位置偏置和 “lost in the middle” 效应，让每个 agent 都在更短、更密、更局部的工作区间里完成任务。[^swarm-econ-ch8]
- 成本上：避免把同一百万 token 在每一轮对话里反复 prefill；可复用的公共材料可以缓存，不可复用的局部材料只喂给对应 agent。
- 时延上：多个 200K 以内的 prefill 更容易并行、调度和提前结束，首 token 延迟也更容易控制。
- 组织上：每个 agent 的失败边界更清晰，更适合绑到具体 validator、artifact policy 和 owner。

当然，这不是说“永远不要用 1M 上下文”。如果问题确实需要对全局原文做一次统一视野下的比对、排序或证据整合，超长上下文仍然有价值。但在大多数工程任务里，真正需要的是局部阅读、局部推理、局部修改，最后再做全局汇总和验证。

## 8.4 让 swarm 不失控的四条硬规则

多 agent 一旦上线，最容易失控的不是模型质量，而是控制面纪律。因此至少要守住四条硬规则：

1. 子 agent 不直接宣布系统终态；只有 coordinator + verifier 能裁决 ready / failed。
2. 子 agent 之间不共享隐式上下文；共享的只有显式任务说明、事实流引用和被授权的中间产物。
3. 每个子 agent 都必须能被单独恢复、单独取消、单独审计。
4. 任何协议、生命周期、回放或 scope 语义变更，都必须同步更新 fixture、门禁、E2E 和文档。

守不住这四条，多 agent 只会比单 agent 更快制造混乱。守住了，它才会真正变成能放大团队产能的协作系统。

[^many-brains-ch8]: Anthropic, *Scaling Managed Agents: Decoupling the brain from the hands.* 本章在此处使用其 many brains / many hands 的组织视角，说明 coordinator、worker 与 verifier 的分工；对应第 19 章参考文献 3。
[^claudecode-codex-multiagent-ch8]: 本章在此处综合 Claude Code 的 `AgentTool.tsx`、`loadAgentsDir.ts`、`teammateMailbox.ts`、`worktree.ts` 等实现，以及 Codex `spawn_agent` / `send_input` / `wait_agent` / `resume_agent` 等工具原语，用来说明多 agent 需要角色、通信、隔离、汇总与恢复这些一等能力；对应第 19 章参考文献 21、24。
[^swarm-econ-ch8]: 本章在此处综合 Anthropic 的 managed agents 视角与第 1 章长上下文文献，用于说明 sub-agent / swarm 在质量、成本与时延上的优势；对应第 19 章参考文献 3、11-20。

---
