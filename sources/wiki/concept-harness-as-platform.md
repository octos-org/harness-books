---
kind: concept
sources: []
related: [concept-harness, aios-foundation, medium-oldest-new-idea, fowler-on-harness, concept-evaluation-harness]
updated: 2026-04-22
---
# Harness 即平台 · Harness as Platform

本书的最终论点 — harness 不是一次性的脚手架，而是一个可复用的 *平台层*，像操作系统、运行时、中间件那样，长出独立的工程学科。这是 [[medium-oldest-new-idea]] 的历史类比在 LLM 时代的直接投影。

## 为什么 harness 会变成平台

- **多租户**：同一个 harness 同时服务多个 agent、多种模型、多种任务 — 调度、配额、隔离必须是一等公民，不能事后加。
- **供应商无关**：harness 不应绑死某一家 LLM；model 是可替换的后端，参见 [[aios-foundation]] 的 Model Abstraction Layer。
- **可编程接口**：上层应用通过稳定的 harness API 使用 agent 能力，而不是直接调 LLM — 就像 Web 开发者用 HTTP 库而非直接写 TCP。

## 平台成熟度的五个标志

| 标志 | 对应传统平台 |
| --- | --- |
| 配置而非改代码 | Kubernetes YAML |
| 可观测性默认开 | Prometheus + OpenTelemetry |
| 可扩展的插件点 | VS Code extensions |
| 跨语言 SDK | gRPC / OpenAPI |
| 官方 conformance 测试 | [[concept-evaluation-harness]] 的 golden set |

## 对从业者的含义

- *应用开发者*：学会选 harness，像当年选 Rails vs Django；
- *平台开发者*：这是下一个十年的系统软件岗；
- *研究者*：harness 本身是研究对象 — ablation 对象不再是 prompt 措辞，而是调度策略、memory 结构、工具粒度。

## 哲学收束

> 每一代软件平台都有一个阶段：新从业者把旧平台的经验当作"过时"，直到他们重新发明其中的一半。

呼应 [[fowler-on-harness]] 的 "the oldest new idea"，也是本书的 Dan Ariely 框架 — 当人人都在谈 LLM，真正的工程在别处（harness 里）。


<!-- appended 2026-04-22 -->

## Two orthogonal meanings of "meta-harness" (2026-04-22)

After ingesting [[stanford-meta-harness]] the "meta" prefix fractures into two unrelated axes — a distinction the earlier draft collapsed:

| Axis | Anthropic *stable-interface* meta | Stanford *search-based* meta |
|---|---|---|
| Question answered | which interfaces deserve 40-year stability? | how to auto-search implementations behind a fixed interface? |
| Who designs | human platform engineers | agent proposer (outer loop) |
| Output | a contract | a piece of harness code |
| Failure mode | interface rot / premature commitment | optimizer overfits the eval set |

They compose cleanly: Anthropic picks the **slot**, Stanford's meta-harness fills it. Treat them as layers, not alternatives. See [[stanford-meta-harness]] and [[anthropic-harness-design]].