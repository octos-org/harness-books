---
kind: concept
sources: [https://www.anthropic.com/research/building-effective-agents]
related: [anthropic-harness-design, case-claude-code, concept-harness, concept-evaluation-harness]
updated: 2026-04-22
---
# 智能体循环 (Agent Loop)

智能体循环是 [[concept-harness]] 的运行时骨架。每次迭代包含四个阶段：感知(观察环境)、规划(LLM 推理)、行动(调用工具)、反思(更新状态)。与传统事件循环不同，这里的"事件"由 LLM 生成，而不是由外部触发——这是从被动响应式系统到主动生成式系统的范式转移。

最小可用实现见 [[anthropic-harness-design]]：`while model.wants_tool_call(): execute(call); update_context(result)`。工程挑战不在循环本身，而在**终止条件**——模型可能陷入"想再试一次"的回路，需要 harness 层的预算控制、冗余检测、进度度量。[[case-karpathy-autoresearch]] 使用显式的步数上限 + 无进展检测双重护栏。

与 [[concept-evaluation-harness]] 的关系：循环的质量无法从单步正确性推断，必须在整条轨迹上测量。与 [[concept-memory-layer]] 的关系：每次循环都在读写状态，记忆策略决定了循环的"记忆力"。
