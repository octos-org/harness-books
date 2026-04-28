# 17. 附录 C：精选术语表

这是全书最常出现术语的紧凑节选。

| 术语 | 含义 |
|---|---|
| Agent 循环 | 重复的生成、行动、观察循环。 |
| 追加式日志 | 永不重写历史的日志。 |
| 上下文工程 | 组织输入，使模型停留在有用区间。 |
| 事实流 | 系统承认真实发生过的 append-only 任务记录。 |
| 生命周期 | 任务从 queued 到 ready / failed 的公开、单调状态阶梯。 |
| 能力平面 | shell、文件系统、MCP、外部 API、人工输入和子 agent 的统一调度面。 |
| 产物与验证 | 把 primary artifact、validator、evidence 和终态裁决绑定在一起的契约。 |
| 回放 | 从同一事实流重建实时状态、历史状态和 UI 投影的能力。 |
| 隔离与恢复 | 用 worktree、scope、resume、background task 和 disk output 控制副作用与中断。 |
| 协作 | coordinator、worker、verifier、summarizer 等多 agent 角色之间的受控分工。 |
| 知识分层 | 把经验按 wiki、skills、docs、`AGENTS.md`、CI / validator 分层治理。 |
| 操作员面 | dashboard、门禁、回滚和事故归因共享的运行时控制面。 |
| 前馈 / 反馈 | 行动前的引导，行动后的感知。 |
| Harness | 约束并解释模型行为的运行时框架。 |
| Harness 工程 | 围绕模型设计控制层的工程实践。 |
| 意图 | 必须被明确表达、不能靠猜的人类目标。 |
| 元 Harness | 可以被优化或重新配置的 harness。 |
| Prompt 工程 | 通过 prompt 调整单轮行为。 |
| Session | 任务的持久、可恢复事实流。 |
| 稳定抽象 | 跨模型变化仍然有用的接口。 |
| 工具词汇表 | 系统可以采取的有边界动作集合。 |
| 验证独立性 | 验证不能与生成是同一件事。 |
| Wiki | 维护过的、结构化历史工作记忆。 |

---
