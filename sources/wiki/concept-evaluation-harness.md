---
kind: concept
sources: [https://www.anthropic.com/research/building-effective-agents]
related: [concept-harness, anthropic-harness-design, concept-observability, concept-agent-loop]
updated: 2026-04-22
---
# 评估框架 (Evaluation Harness)

[[concept-harness]] 六个组件中最容易被省略的一个，却是 harness engineering 成熟度的真正分水岭。prompt engineering 时代，评估靠人工打分和 vibes check；harness engineering 时代，评估必须可复现、可回归、可分析——否则每一次迭代都是在猜测。

三个评估层次：
1. **单元评估 (Unit)**：单步工具调用的输入输出是否正确。类似单元测试，可直接断言。
2. **轨迹评估 (Trace)**：整个 [[concept-agent-loop]] 是否高效——步数、成本、是否绕弯。需要 [[concept-observability]] 提供原始数据。
3. **结果评估 (Outcome)**：最终交付物是否满足目标。往往需要另一个 LLM 作为 judge，或人工抽样。

[[anthropic-harness-design]] 给出了"golden trace"方法——人工标注一批正确轨迹作为回归基准，新版本必须在这批轨迹上保持或改进。

与传统测试的根本差异：harness 评估必须**容忍非确定性**。同一输入可能产生多条合理轨迹，metric 要度量"质量分布"而非"等价性"。这是从确定性系统工程文化到概率系统工程文化的心智切换。
