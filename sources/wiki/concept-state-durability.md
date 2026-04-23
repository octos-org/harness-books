---
kind: concept
sources: []
related: [concept-harness, concept-memory-layer, case-ascent-research, milvus-execution-layer, concept-observability]
updated: 2026-04-22
---
# 状态与持久化 · State Durability

[[concept-harness]] 六组件中最被低估的一环。Prompt 是"本句"的，context 是"本轮"的，而 state 是"跨轮"的 — LLM 本身完全无状态，连续性*完全由 harness 装出来*。

## 核心论点

- **状态不在模型里，只能在 harness 里**：每次 `POST /chat/completions` 都是无记忆的 forward pass。所有"记忆"都是 harness 把往期内容重新塞进 prompt 做的戏法。
- **持久化的层次**：
  - *对话级*：单次 session 内的 message history；
  - *任务级*：跨 session、单任务内的 scratchpad / plan / todo list；
  - *项目级*：跨任务的知识图谱、向量库、文件系统；参见 [[milvus-execution-layer]] 的向量 state。
- **durability-resume axis（可持久-可恢复轴）**：harness 能否在任意步暂停、序列化、迁移到别处恢复？这是 [[case-ascent-research]] 的核心创新，也是从"demo agent"走向"生产 agent"的分水岭。本书 ch. 04 在七个参考资料之外加的一条原创坐标轴。
- **回滚与分支**：agent 犯错时能否回到某个 checkpoint 重试？Git-like branching 是下一代 harness 的必然形态。

## 失败模式

- *状态膨胀*：scratchpad 无限增长压垮 context window（与 [[concept-memory-layer]] 的摘要机制直接冲突）；
- *状态撕裂*：多个工具写同一资源但 harness 不协调 — 典型是两个并行子 agent 同时编辑一个文件；
- *幻觉状态*：模型"以为"自己之前做过某事，实际上 harness 没记录；必须 [[concept-observability]] 兜底才能发现。

## 设计原则

1. **显式优于隐式**：所有"记忆"都应该在 harness 的数据结构里有名字，而不是散落在对话历史里；
2. **持久化格式要人类可读**：JSON / YAML，便于调试和人工修正；
3. **checkpoint 免费**：每次 tool call 后自动快照 — 不需要显式 API。


<!-- appended 2026-04-22 -->

## The durability–resume axis (a harness pattern beyond the 7 primary sources)

This axis is the book's original contribution — it is NOT covered by any of [[fowler-on-harness]], [[anthropic-harness-design]], [[openai-harness-engineering]], [[mindstudio-harness]], [[neo4j-context-vs-prompt]], [[milvus-execution-layer]], or [[medium-oldest-new-idea]]. It emerges from the case-study material:

| Level | State lifetime | Resume semantics | Exemplar |
|-------|----------------|-------------------|----------|
| Ephemeral | process-scoped | none — crash = restart from zero | most agent demos today |
| Checkpointed | written to disk periodically | best-effort replay | [[case-karpathy-autoresearch]] |
| Durable | state IS the system of record | kill-and-resume is first-class | [[case-ascent-research]] |

The durable level is what makes multi-hour / multi-day agentic research tractable. It reframes the LLM call as a *worker* inside a larger state machine — which is exactly how OS schedulers framed processes in the 1970s (see [[medium-oldest-new-idea]]).

Cross-links: [[concept-agent-loop]] (the loop this durability wraps), [[concept-observability]] (you can only resume what you can inspect), [[concept-harness-as-platform]] (durability is the feature that promotes a harness from script to platform).
