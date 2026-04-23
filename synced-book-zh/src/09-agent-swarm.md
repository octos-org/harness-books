# 8. Agent 群体编排：Harness 如何扩展团队而不只是代码

Harness 也是一个用于多 agent、多负责人交付的协调系统。

## 8.1 工作分解模式

```text
项目负责人
  -> 定义里程碑契约和验收不变量
运行时/Harness 负责人
  -> 负责 ABI、事件入口和监督器持久性
Skill 负责人（例如 deep-search）
  -> 负责事件发射和工作流映射
UI/API 负责人
  -> 负责回放一致性和作用域投影
发布/操作负责人
  -> 负责线上门禁、诊断和回滚策略
```

没有这种拆分，团队会合并通过本地测试、但破坏系统事实的局部真相。

原书的“多脑多手”不是“多开几个 agent 并行干活”这么简单。它描述的是一种组织结构：多个“脑”可以规划、生成、验证、总结；多个“手”可以操作文件、浏览器、shell、API、数据库。但这一切必须共享同一个 session、同一套工具权限、同一组验证规则和同一个操作员视图。[^many-brains-ch8]

没有 harness，多 agent 只会放大混乱。有 harness，多 agent 才能变成可分工、可审计、可回放的生产系统。

## 8.2 反混乱规则

门禁激活后，任何工作流都不得单方面重定义契约语义。  
任何 schema、生命周期语义或回放行为的变更，都必须在同一个 PR 切片中更新：

- fixture
- 脚本门禁
- E2E 规范
- 文档

## 8.3 为什么 sub-agent / swarm 往往比单个 1M 上下文更优

如果任务天然可以分块，那么把全部材料一次性塞进单个超长上下文，往往不是最优解。更常见的高收益结构是：

1. coordinator 只持有总目标、拆解计划、共享约束和最终验收标准；
2. 每个 sub-agent 只拿自己那一块原始材料或代码域；
3. 子 agent 产出的是摘要、证据、diff、引用和待验证结论，而不是把整个大海捞针窗口一路向上传递；
4. verifier 再把跨 shard 的冲突和遗漏拦下来。

这样做的好处不是单一维度的，而是四个维度一起改善：

- 质量上：减少位置偏置和“lost in the middle”效应，让每个 agent 都在更短、更密、更局部的工作区间里完成任务。[^swarm-econ-ch8]
- 成本上：避免把同一百万 token 在每一轮对话里反复 prefill；可复用的公共材料可以缓存，不可复用的局部材料只喂给对应 agent。
- 时延上：多个 200K 以内的 prefill 更容易并行、调度和提前结束，首 token 延迟也更容易控制。
- 组织上：每个 agent 的失败边界更清晰，更适合绑到具体 validator、artifact policy 和 owner。

当然，这不是说“永远不要用 1M 上下文”。如果问题确实需要对全局原文做一次统一视野下的比对、排序或证据整合，超长上下文仍然有价值。但在大多数工程任务里，真正需要的是：

- 局部阅读；
- 局部推理；
- 局部修改；
- 最后做全局汇总和验证。

这正是 harness 要支持的 swarm 形态：不是把一个大脑塞得更满，而是把任务切成多个仍处于最佳工作区间的小脑，再用 session、contracts 和 verification 把它们重新编回一个系统。

[^many-brains-ch8]: Anthropic, *Scaling Managed Agents: Decoupling the brain from the hands.* 本节借其 many brains / many hands 的组织视角来说明 coordinator、worker、verifier 的分工；见第 19 章参考文献 3。
[^swarm-econ-ch8]: 本节关于 sub-agent / swarm 在质量、成本与时延上的优势，组织层借鉴 Anthropic 的 managed agents，长上下文质量与 prefill 成本部分综合第 1 章已引的长上下文文献；见第 19 章参考文献 3、11-20。

---
