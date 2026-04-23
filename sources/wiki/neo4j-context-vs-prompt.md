---
kind: entity
sources: [https://neo4j.com/blog/developer/context-engineering/]
related: [concept-prompt-vs-context-vs-harness, concept-harness, concept-memory-layer, fowler-on-harness, anthropic-harness-design, openai-harness-engineering]
updated: 2026-04-22
---

# Neo4j — Context Engineering as the Memory-Layer Argument

**Author:** Nyah Macklin (Senior Developer Advocate for AI, Neo4j) · 2026-03-09 · [原文](https://neo4j.com/blog/developer/context-engineering/)

Neo4j 的这篇文章并不把自己定位成 *harness engineering* 的宣言,而是 **context engineering** 的辩护书。但放进 [[concept-prompt-vs-context-vs-harness]] 的三层坐标里,它恰好落在第二层,并给第三层(harness)留下一个具体的插槽:**memory layer**。

## 核心论点

Context engineering 是 prompt engineering 的继任者。不再精雕一条指令,而是设计 agent 所在的**信息环境**。并且作者明确区分了三种 context 管理方式,按结构化程度递进:

1. **Prompt management** —— 直接指令雕琢,2023 年式做法。
2. **RAG(Retrieval-Augmented Generation)** —— 从 embedding 里动态检索;可扩展,但**丢失结构**。
3. **Knowledge graph** —— 结构化、关系化表示;跨轮次保留 entity 与 relationship。

Neo4j 的独家主张是第 3 条:知识图谱不仅是检索缓存,而是 agent 的 **memory layer**。entity 持久、relationship 演化,agent 在结构上推理,而不是在字符串相似度上撞运气。

## 为什么这属于 harness 讨论,而不仅仅是 RAG 讨论

作者自己划了坐标:

- **Prompt** = 一次调用的形状
- **Context** = 本次调用看到的信息
- **Harness** = 跨调用、跨时间的一切

按这个划分,[[concept-harness]] 是 context engineering 的**超集**。Graph-as-memory 是 harness 六件套里 memory 那一块的一个具体实现,与 [[fowler-on-harness]] 所强调的 controls、[[anthropic-harness-design]] 所强调的 interface 并置,而不是替代。

## 与其他来源的对照

| 维度 | Neo4j (本页) | [[openai-harness-engineering]] | [[anthropic-harness-design]] |
|---|---|---|---|
| 侧重 | 结构化记忆 | 工具编排 + 约束 | 交互契约 |
| 记忆形态 | knowledge graph | working memory + 文件 | 上下文 + 工具返回 |
| 反对的默认选项 | 纯 RAG | 纯 prompt | 纯模型能力 |

三者合起来正好覆盖 harness 的三条轴线:**数据 / 控制 / 交互**。

## 可落地的论断

- 多轮 agent **不要**只靠 prompt 管理。
- **不要**把 RAG 当默认选项 —— 它把 multi-entity 工作流需要的关系结构打碎了。
- memory layer 是一等设计决策,不是 plug-in。

## 本书将引用它的位置

- Ch. 3 三层坐标图里,作为 context → harness 的**过渡样本**。
- Ch. 5 memory pillar 的 case study,对照纯向量做法。
- 反例:将 RAG 当成 memory 的默认做法,对应失败模式“context collapse”。
