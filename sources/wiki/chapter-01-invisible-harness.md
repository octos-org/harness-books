---
kind: draft
sources: []
related: [concept-harness, concept-prompt-vs-context-vs-harness, fowler-on-harness, ariely-big-data-quote]
updated: 2026-04-22
---

# 第一章 · 看不见的脚手架 (The Invisible Harness)

> *Harness engineering is like teenage sex…* — see [[ariely-big-data-quote]].

## 开场:一个被误诊的领域

过去三年,LLM 应用被反复诊断出同一个病:**prompt 不够好**。于是我们得到了成千上万的 prompt 教程、prompt 模板、prompt 注入防御。但线上 agent 依然会在第 40 步丢失目标、在第 3 次工具调用后幻觉一个不存在的 API、在 token 预算耗尽时突然沉默。这些症状,没有一个能靠改 prompt 治好。

真正的病灶,是 **[[concept-harness]]** —— 那层包住模型的运行时脚手架:工具词表、记忆层、状态持久化、上下文装配、执行沙箱、评估回路。本书的论点只有一句话:**LLM 原生应用里有意思的工程,99% 都在 harness 里,不在 prompt、也不在 model 里。**

## 为什么没人命名它

Harness 这个词 [[fowler-on-harness]] 在 2024 年中由 Martin Fowler 拾起,此前业界用 "agent framework"、"orchestration layer"、"runtime" 轮流指代,每个词只覆盖它的一个面。就像 Ariely 吐槽 big data 时那样,"harness" 是一个大家都在做、但没有人愿意承认自己只做到一半的东西。本章接下来把这个看不见的脚手架拆成 6 个可观察的组件,见 [[concept-harness]] 的 6-part anatomy 图。

## 与 [[concept-prompt-vs-context-vs-harness]] 的关系

三层是 superset,不是替代:Prompt Engineering ⊂ Context Engineering ⊂ Harness Engineering。写 prompt 依然重要,但只在 harness 已经把对的上下文送到对的位置之后才重要。这一点第三章会展开。
