# 15. 附录 A：源文本与研究流程

本书论证建立在十篇奠基文本之上，但它们可以聚成三个实践组：

- 第 1 层谱系：Fowler、OpenAI、Fisher Zhang、NxCode
- 第 2 层谱系：Anthropic、Anthropic 长任务应用、Milvus、Stanford Meta-Harness
- 桥接文本：Neo4j 的上下文工程，Karpathy 的 wiki 纪律

对 Octos 来说，保留全部十篇的理由很具体：第 3 节中的失败属于 Layer 2 failure，而产生这本合并书的过程位于 Layer 1 谱系中。把二者放在一起读，能让控制系统视角保持诚实。

## 15.1 研究流程

1. 从 Octos 中一个真实失败模式或真实设计选择出发。
2. 选择与你正在处理的层次匹配的源文本集群。
3. 抽取不变量，而不只是引文，并写入 wiki 页面、schema 或 checklist。
4. 在下一次事故前，把不变量变成测试、门禁或评审规则。
5. 当系统行为变化时，重新审视章节问题。

## 15.2 核心研究问题

- 这篇文本属于哪一层？
- 哪个不变量本可以防止我正在研究的 Octos 失败？
- 当模型变化时，什么必须保持稳定？
- 哪些契约属于 runtime，哪些属于 policy？

---
