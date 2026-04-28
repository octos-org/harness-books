# 15. 附录 A：源文本与研究流程

本书论证建立在三类材料之上：第一类是 harness / agent / context engineering 的奠基文本，第二类是 Claude Code、Codex、OpenClaw、Hermes 这类系统样本，第三类是长上下文、控制论、memory hierarchy 和负反馈这些理论支撑。它们可以聚成四个实践组：

- 第 1 层谱系：Fowler、OpenAI、Fisher Zhang、NxCode
- 第 2 层谱系：Anthropic、Anthropic 长任务应用、Milvus、Stanford Meta-Harness
- 桥接文本：Neo4j 的上下文工程，Karpathy 的 wiki 纪律
- 系统解剖：Claude Code / Codex 源码审读、*Dive into Claude Code*、OpenClaw / Hermes 对照

保留这些材料的理由很具体：第 3 节中的失败样本属于 Layer 2 failure，而这本书本身的写作与重构过程又位于 Layer 1 谱系中。把理论、系统样本和失败案例放在一起读，能让控制系统视角保持诚实，避免把某个产品实现误当成普遍原则。

## 15.1 研究流程

1. 从一个真实失败模式或真实设计选择出发。
2. 选择与你正在处理的层次匹配的源文本集群。
3. 抽取不变量，而不只是引文，并写入 wiki 页面、schema 或 checklist。
4. 在下一次事故前，把不变量变成测试、门禁或评审规则。
5. 当系统行为变化时，重新审视章节问题。

## 15.2 核心研究问题

- 这篇文本属于哪一层？
- 哪个不变量本可以防止我正在研究的失败样本？
- 当模型变化时，什么必须保持稳定？
- 哪些契约属于 runtime，哪些属于 policy？

---
