# 驾驭工程

## 面向意图的工程学 —— 人与 AI 如何共同进化

---

**ZhangHanDong** · 著

---

## 内容简介

当 2023 年"prompt engineering"成为新的热词,2025 年"context engineering"接棒,2026 年业界几乎同时涌现出一组关于 **harness engineering** 的奠基文——Martin Fowler、OpenAI、Anthropic、MindStudio、Neo4j、Milvus、Karpathy、AIOS Foundation、Stanford IRIS Lab 从不同的入口给出了各自的回答。

**但这些文本加在一起,仍然没有告诉一个工程团队:真正做驾驭工程时,每天要决定的是什么?**

本书尝试给出答案。第一件要做的事,是把"驾驭工程" 这个词**横跨的两层划清**:

- **Layer 1 · AI Coding 过程的驾驭工程** —— 软件工程这门老学科面向 AI 时代的进化;agent(Codex / Claude Code)是你的生产工具,**产品仍是代码本身**。Fowler 的《Harness engineering for coding agent users》、OpenAI 的 1M LOC 实证、MindStudio 的五柱分类,都在这一层。
- **Layer 2 · AI Agent 自身的 Harness 工程** —— agent 系统的运行时基础;**产品就是 agent**。Anthropic Managed Agents 的三抽象(session / harness / sandbox)、AIOS 的 LLM-as-OS、Neo4j 的 memory layer、Milvus 的 execution layer,都在这一层。

两层**正交**(同一家公司可能只做其中一层、也可能两层都做),但共享一组工程原则 —— 面向意图、稳定抽象、验证独立。基于十篇奠基文的精读、三十余项一线工程实践,以及作者本人在 `octos`、`dora-rs`、`ascent-research`、`agent-spec`、`mempal` 等开源项目中的实操经验,本书将驾驭工程归纳为四根**不随模型能力变化的稳定支柱**:可恢复的 session、可替换的 harness、可问责的 tools、独立于生成的 verification。

然后,本书进一步追问:当模型越来越强,这些支柱会消失吗?作者的论证是 —— 恰恰相反,**AI 越强,驾驭工程越值钱**。这是一门反脆弱的学科。它的命题不是"AI 有缺陷所以需要兜底",而是:**任何足够重要的 AI 系统,都需要一个独立于该系统自身的验证层,并且这个独立性是结构性的,不是能力性的**。

## 适合谁读

- **工程团队 lead** —— 你们用 AI 写代码,想要把"临时流程" 升级成"可复制的工程学科"(Layer 1 的主要读者群)
- **Agent 产品团队** —— 你们做的产品**本身就是** agent,合规、运维、长任务可靠性是生死线(Layer 2 的主要读者群)
- **做三年尺度架构选型的技术决策者** —— 你想知道什么会被模型升级清算、什么会更值钱
- **研究 agent systems 的学术工作者、关注 AI 治理与合规的技术管理者** —— 反脆弱四支柱对应的四套监管框架(EU AI Act / SEC / FDA / GDPR)是本书最直接的合规工具

第 1 章会用三问帮你判断自己站在哪一层。

## 不适合谁读

- 寻找"最好用 prompt 模板" 的初学者 —— 本书假设你已跨过 prompt engineering 阶段
- 相信 AGI 会在明天到来从此不需要任何工程 —— 请直接读结语里的压力测试

## 致谢

本书的写作本身是一次驾驭工程的实验 —— 所有研究都在 `ascent-research` 会话中进行,二十余个 wiki 页面 + 多张 hand-drawn SVG 作为本书的知识底库持续演化。感谢 Andrej Karpathy 的 autoresearch 原型、pi-autoresearch 的开源社区、Anthropic Managed Agents 团队、OpenAI Codex / Frontier 团队、Stanford IRIS Lab Meta-Harness 作者组,以及 Martin Fowler 持续不懈地命名这个学科的工作。

特别感谢 Dan Ariely —— 他 2013 年那句关于 big data 的俏皮话,给了这本书一条贯穿始终的黑色幽默线索,它在楔子、第 10 章、结语三次回响。

---

*本书使用 [ascent-research](https://github.com/ZhangHanDong/ascent-research) 进行素材调研,使用 [mdbook](https://rust-lang.github.io/mdBook/) 进行组织与渲染。书写过程的 session 目录完整公开于 `~/.actionbook/research/harness-engineering/`,读者可 fork 该 session 作为自己的调研起点 —— 这本身是驾驭工程长程循环的一次公开演示。*
