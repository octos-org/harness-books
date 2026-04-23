---
kind: concept
sources: [https://neo4j.com/developer-blog/, https://milvus.io/blog/]
related: [neo4j-context-vs-prompt, milvus-execution-layer, concept-harness, concept-state-durability]
updated: 2026-04-22
---
# 记忆层 (Memory Layer)

记忆层是 [[concept-harness]] 六个组件中最被误解的一个。常见误解：记忆 = 向量数据库。实际上，记忆是**写入策略 + 检索策略 + 遗忘策略**的三元组，向量库只是检索的一种实现。

[[neo4j-context-vs-prompt]] 主张用图结构而非向量表示长期记忆——关系本身是语义信号，边的类型比节点的相似度更能携带推理所需的结构。[[milvus-execution-layer]] 则把向量检索当作 harness 的一个子系统，强调延迟、召回、成本三维权衡，而不是"越大越好"的盲目扩展。

三种记忆形态：
- **短期工作记忆**：单次会话内的 scratch pad，生命周期等于一次 [[concept-agent-loop]] 迭代批次。
- **中期情景记忆**：任务历史、决策轨迹、工具调用日志——跨会话但限于项目范围。
- **长期语义记忆**：跨会话的事实、用户偏好、从错误中学到的模式。

每一层需要不同的 [[concept-state-durability]] 保证，这是把 LLM 应用从 demo 推到生产最关键的工程决策。
