---
kind: concept
sources: []
related: [concept-harness, anthropic-harness-design, mindstudio-harness, case-claude-code]
updated: 2026-04-22
---
# 工具词表 · Tool Vocabulary

在 [[concept-harness]] 的六组件解剖中，"工具词表"是 harness 暴露给模型的*动作空间*。它决定了 agent 能做什么，而不是它能想什么 — 这是 prompt engineering 触不到的一层。

## 核心要点

- **工具 = API + schema + 自然语言描述**：不止 function signature，还包括模型读得懂的 docstring、参数约束、失败模式说明。工具描述本身就是一段长期有效的 "system prompt"。
- **粒度即哲学**：`run_bash(cmd)` 和 `edit_file(path, old_str, new_str)` 代表两种相反的 harness 思路 — 前者给模型最大自由度，后者用结构化约束换可靠性。Anthropic 的选择见 [[anthropic-harness-design]]；Claude Code 的 Edit/MultiEdit 抉择见 [[case-claude-code]]。
- **词表规模陷阱**：工具太少模型做不了事；工具太多模型选择困难并开始幻觉参数。经验值大约 10–20 个工具是甜区。
- **工具即契约**：工具的 *输出* schema 也是输入 schema — 下一轮模型会读到它的结果，返回格式必须是"模型可消化"的（结构化 JSON、有明确字段名），而非"人可读"的（自由散文）。

## 与相邻组件的耦合

- 与 [[concept-memory-layer]]：工具副作用（写文件、调 API）往往是 memory 的物理载体 — 工具表设计直接决定 memory 的粒度。
- 与 [[concept-execution-sandbox]]：工具能做什么 ≠ agent 应该被允许做什么；词表是声明，沙箱是执行。
- 与 [[concept-evaluation-harness]]：工具调用成功率、幻觉参数率是 harness 级别的可观测指标，不是 prompt-level 的。

## 失败模式

- *工具过载*：给 agent 一百个 MCP tools，选择崩溃；
- *描述欠佳*：工具能用但模型不知道何时用；
- *输出非结构化*：工具返回长段自由文本，下一轮解析不了。
