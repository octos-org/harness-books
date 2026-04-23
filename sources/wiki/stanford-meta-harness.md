---
kind: entity
sources:
  - https://arxiv.org/abs/2603.28052
  - https://github.com/stanford-iris-lab/meta-harness
related:
  - concept-harness
  - concept-harness-as-platform
  - concept-evaluation-harness
  - concept-agent-loop
  - anthropic-harness-design
  - case-karpathy-autoresearch
  - case-ascent-research
updated: 2026-04-22
---

# Stanford IRIS Lab · Meta-Harness

**Paper:** *End-to-End Optimization of Model Harnesses* — Lee, Nair, Zhang, Lee, Khattab, Finn (Stanford IRIS Lab, 2026). [arxiv:2603.28052](https://arxiv.org/abs/2603.28052) · [github](https://github.com/stanford-iris-lab/meta-harness).

## 核心论点
把"设计 harness"这件事**本身自动化** —— 用一个 outer-loop agent 去 **搜索** 最优的 harness 代码。prompt-tuning 优化 prompt,RLHF 优化 weights,这篇论文优化 **harness 本身**。这是 [[concept-harness]] 议题向上的一次跃迁:harness 不仅是研究对象,也是 **被优化对象**。

## 技术贡献

### Outer-loop search over harness code
一个 **agentic proposer**(默认 Claude Code 驱动)读取所有历史候选 harness 的源码、分数、执行痕迹(通过文件系统),据此提议新 harness 变体。评分、保留、淘汰、再提议 —— 典型的进化式搜索循环。这正是 [[case-karpathy-autoresearch]] 祖训在 harness 层的应用:session 存的不是事实,是 **harness 候选**。

### Filesystem as experience store
所有候选 harness 的代码 + 分数 + trace 都以文件系统组织,proposer agent 通过**读这些文件**获得"过去试过什么、效果怎么样"的信息。结构上与 [[case-ascent-research]] 的 session/wiki 架构**完全同构** —— 都是把 agent memory 外化为可 grep、可 diff 的文件树。

### 实测收益
- 分类任务 **+7.7 pts**
- 上下文 token 消耗 **−75%**(同分下)
- 数学推理 **+4.7 pts**
- TerminalBench-2 上超过手工 harness

## 与 Anthropic Managed Agents 的关键差异

| 维度 | [[anthropic-harness-design]] Managed Agents | Stanford Meta-Harness |
|---|---|---|
| "Meta" 的含义 | **稳定接口** 的 meta-layer | **自动搜索** harness 的 meta-layer |
| 设计者 | 人类平台工程师 | agent proposer |
| 稳定性承诺 | 接口 40 年不变 | 每任务重新搜 |
| 优化目标 | 可复用、可问责 | 单任务最优性能 |

两者**正交**。Anthropic 问"哪些接口值得长期稳定";Stanford 问"稳定接口内部的实现如何自动优化"。它们是同一件事的 **两个完全不同的层** —— 详见 [[concept-harness-as-platform]] 的 meta-layer 分节。

## 本书中的定位
第 11 个奠基文。在 [[concept-harness]] 之后增加一条推论:**harness 设计本身可被自动化,但 intent / verification / objective-specification 仍是人的责任**。另见 [[concept-evaluation-harness]] —— meta-harness 的前提是评估函数本身可信,否则 outer-loop 会优化到噪声上。
