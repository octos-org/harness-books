---
kind: case
sources: []
related: [concept-state-durability, concept-harness, case-karpathy-autoresearch, concept-incremental-research, concept-observability]
updated: 2026-04-22
---
# Case · Ascent Research

Ascent Research 是本书里 [[concept-state-durability]] 的典范案例 — 它把 durability-resume axis 做成一等公民，而非事后补丁。这一条原创坐标轴不在书中七份参考资料里，是本书的理论增量。

## 它体现的 harness 哲学

- **Run = 一等对象**：一次研究任务是一个可序列化、可恢复、可 fork 的 Run 实体，而不是一串 message。Run 有 id、有 state machine、有持久层。
- **状态 ≫ 对话**：context window 里的内容是临时的；Run 持久层里的结构化笔记才是项目的真实记忆。对话被当作"缓存"，随时可丢。
- **增量研究循环**：每一步的输出成为下一步的输入，形成 [[concept-incremental-research]] 的显式循环，而不是依赖模型"记住"。
- **观测默认开**：每次 LLM 调用、每次工具调用都写入结构化事件流，参见 [[concept-observability]] 的 trace/metric/log 三件套。

## 与 [[case-karpathy-autoresearch]] 的对比

Karpathy 的 autoresearch 是"一次性 script + 大 prompt"，适合 demo 和个人实验；Ascent 把同样的循环 *状态化*，使之适合几十小时的长任务。

| 维度 | Karpathy 模式 | Ascent 模式 |
| --- | --- | --- |
| 状态载体 | 单个 scratchpad 文件 | 结构化 Run 实体（数据库 + 文件系统） |
| 恢复粒度 | 重跑整个 script | 恢复到任意 step |
| 多 agent 协作 | 无 | Run 可 fork + 合并 |
| 观测 | stdout | 结构化事件流 |
| 失败成本 | 整次 run 丢弃 | 回滚到上一个 checkpoint |

## 为什么它是关键证据

本 case 支撑 [[chapter-01-invisible-harness]] 的核心论点 *"harness 的工程价值在长任务中指数放大"* — 短任务里 prompt 够了，长任务里没有 state durability 就会崩。Ascent 的存在证明这不是理论，是已经有人在做的生产工程学科。
