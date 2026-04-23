---
kind: concept
sources: []
related: [concept-harness, concept-evaluation-harness, concept-state-durability, concept-agent-loop]
updated: 2026-04-22
---
# 可观测性 · Observability

Agent 不可调试 — 除非你把 harness 做成能被观测的。这是 [[concept-harness]] 六组件中最像传统 SRE 的那一环，也是实际生产中最先出事的一环。

## 三类信号

- **Trace**：每一次 LLM 调用、工具调用、状态变更构成一棵 span tree；OpenTelemetry 的语义几乎可以原样复用。[[concept-agent-loop]] 的每一圈循环就是一个顶层 span。
- **Metric**：token 消耗、工具成功率、任务完成率、回滚次数 — 这些是 harness 级别的 SLI（不是模型级别的 eval）。
- **Log**：原始 prompt / completion 的结构化记录，为 [[concept-evaluation-harness]] 提供 replay 语料；同时是事故复盘的唯一真相源。

## 与 prompt 调试的根本区别

| 维度 | Prompt 调试 | Harness 调试 |
| --- | --- | --- |
| 粒度 | 单次对话 | 数百次采样 |
| 工具 | Playground / REPL | Grafana / Jaeger |
| 技能 | 写作 | SRE |
| 修复对象 | 措辞 | 调度、memory、工具描述 |

这是本书主张"harness engineering ≠ prompt engineering"最硬核的一条佐证 — 二者需要的工程文化完全不同。

## 失败案例目录

- *静默工具失败*：工具返回 empty string，模型误以为成功 — 若无结构化日志根本发现不了；
- *状态漂移*：[[concept-state-durability]] 里说的"幻觉状态"只有在 trace 对比下才现形；
- *context collapse*：长对话里前几轮的重要约束被挤出 window，模型开始胡说 — trace 里能精确看到"system reminder 消失的那一步"；
- *工具调用抖动*：同样输入的 agent 两次跑出完全不同的工具序列 — 没有采样级 metric 就以为是偶然。

## 推荐最小栈

1. OpenTelemetry SDK 嵌进 harness 主循环；
2. 一个 append-only 的 run log（JSON Lines）；
3. replay 工具：吃 log、重放到任意步、diff 结果。这三件事齐了，harness 才进入"可以维护"的状态。
