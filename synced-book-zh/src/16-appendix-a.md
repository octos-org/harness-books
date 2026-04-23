# 15. 附录 A：源文本与研究流程

The book's argument is grounded in ten foundational texts, but they cluster into three practical groups:

- Layer 1 lineage: Fowler, OpenAI, Fisher Zhang, NxCode
- Layer 2 lineage: Anthropic, Anthropic long-running apps, Milvus, Stanford Meta-Harness
- Bridge texts: Neo4j on context engineering, Karpathy on wiki discipline

For Octos, the reason to keep all ten is concrete: the failures in section 3 are Layer 2 failures, while the process that produced this merged book lives in the Layer 1 lineage. Reading both together keeps the control-systems framing honest.

## 15.1 Study workflow

1. Start from a live failure mode or a live design choice in Octos.
2. Pick the source text cluster that matches the layer you are working in.
3. Extract the invariant, not just the quote, into a wiki page, schema, or checklist.
4. Turn the invariant into a test, gate, or review rule before the next incident.
5. Revisit the chapter questions when the system behavior changes.

## 15.2 Core research questions

- Which layer does this text belong to?
- What invariant would have prevented the Octos failure I am studying?
- What must stay stable when the model changes?
- Which contracts belong in runtime, and which belong in policy?

---

### 扩展源材料


#### 来自 `appendix-a-foundation-texts.md`：附录 A · 十篇奠基文精读

_源材料角色：full foundation-text appendix._


#### 附录 A · 十篇奠基文精读

本书的十四章每一处具体引用,都能追溯到以下十篇在 2026 年同一季度集中涌现的文本(原九篇 + Stanford IRIS Lab Meta-Harness 论文,作为第 10 篇对 harness 自动化方向的奠基)。建议读者按编号顺序精读;它们在**风格、受众、位置**上互补:Fowler 给深度工程师,Anthropic 两篇给平台设计者,OpenAI 给实战 team lead,Medium 给概念梳理者,Neo4j/Milvus 给具体子领域,karpathy 给长期主义者,AIOS 给研究者,Stanford 给 "harness 本身可优化" 这一方向的开创者。

##### A.1 · Martin Fowler · *Harness engineering for coding agent users*

- **日期**:2026-04-02
- **链接**:https://martinfowler.com/articles/harness-engineering.html
- **作者**:Birgitta Böckeler
- **核心贡献**:**Agent = Model + Harness** 的等式。Feedforward (guides) + Feedback (sensors) 两类控制。Computational 和 Inferential 两类检查的效率/成本权衡。Ashby 的 Requisite Variety Law 在 harness 设计里的应用。
- **本书章节**:Ch 1, Ch 2, Ch 6
- **值得追问**:harness 的 coverage 指标还没有公认定义 —— 这是未来三年的开放研究方向

##### A.2 · OpenAI · *Harness Engineering: Leveraging Codex in an Agent-First World*

- **日期**:2026-02
- **链接**:https://openai.com/index/harness-engineering/
- **作者**:OpenAI Frontier Team
- **核心贡献**:**1M LOC / 1500 PR / 3 工程师 / 5 个月 / 0 人类写代码**的实证。*specifying intent* 作为核心工作。AGENTS.md 作为 table of contents (不是 encyclopedia) 的模式。
- **本书章节**:Ch 2, Ch 10
- **值得追问**:"0% human review" 是否有合规可接受性的边界?在医疗/金融场景还能持续吗?

##### A.3 · Anthropic · *Scaling Managed Agents: Decoupling the brain from the hands*

- **日期**:2026-04
- **链接**:https://www.anthropic.com/engineering/managed-agents
- **作者**:Lance Martin, Gabe Cemaj, Michael Cohen
- **核心贡献**:**Meta-harness** 概念。三抽象(Session / Harness / Sandbox)解耦。"The session is not Claude's context window"。Credentials 不进 sandbox 的安全哲学。Many brains, many hands。
- **本书章节**:Ch 3, Ch 4, Ch 5, Ch 6, Ch 14
- **值得追问**:meta-harness 的接口稳定需要多少年才能真正定型?类比 Unix syscall 的话,还在 1975 年还是 1985 年?

##### A.4 · Anthropic · *Harness Design for Long-Running Application Development*

- **日期**:2026-03-24
- **链接**:https://www.anthropic.com/engineering/harness-design-long-running-apps
- **作者**:Prithvi Rajasekaran (Anthropic Labs)
- **核心贡献**:**Planner / Generator / Evaluator** 三-agent 架构。Context anxiety 现象命名。Context resets with structured handoffs 优于 compaction。模型升级后 harness 自然变薄的实证(Sonnet 4.5 → Opus 4.6)。
- **本书章节**:Ch 2, Ch 3, Ch 5, Ch 12
- **值得追问**:三-agent 分工的最小必要性 —— 什么时候可以合二为一?

##### A.5 · NxCode · *What Is Harness Engineering? Complete Guide for AI Agent Development*

- **日期**:2026-03
- **链接**:https://www.nxcode.io/resources/news/what-is-harness-engineering-complete-guide-2026
- **核心贡献**:**五柱分类**(Tool Orchestration / Guardrails / Error Recovery / Observability / HITL)。Equestrian 词源(马具隐喻)。LangChain benchmark(52.8% → 66.5% 仅换 harness)。Claude Code / Cursor / OpenAI Codex 的 harness 对比。
- **本书章节**:Ch 1, Ch 6
- **值得追问**:五柱 vs 本书四柱的差异在于:nxcode 把 observability 单独列出,本书把它放进 session 柱 —— 哪种更自洽?

##### A.6 · Neo4j · *Context Engineering for AI Agents*

- **日期**:2026-03-09
- **链接**:https://neo4j.com/blog/developer/context-engineering/
- **作者**:Nyah Macklin
- **核心贡献**:Prompt / RAG / Knowledge Graphs 三种 context 管理方式的对比。知识图谱作为 **memory layer** 而非 retrieval cache 的立场。
- **本书章节**:Ch 1, Ch 9
- **值得追问**:知识图谱作为 memory 的治理流水线(promotion/demotion)如何设计?

##### A.7 · Milvus · *Harness Engineering: The Execution Layer AI Agents Actually Need*

- **日期**:2026
- **链接**:https://milvus.io/ai-quick-reference/harness-engineering-the-execution-layer-ai-agents-actually-need
- **核心贡献**:把 harness 定位为 **execution layer**。从数据 substrate(vector / graph)的角度看 harness。Tool dispatcher / state store / memory substrate / retrieval orchestration / observability 五组件。
- **本书章节**:Ch 6, Ch 9
- **值得追问**:vector DB 作为 memory substrate vs knowledge graph vs plain markdown wiki —— 成本/可治理性权衡

##### A.8 · Fisher Zhang · *Harness Engineering: The Oldest New Idea in AI*

- **日期**:2026-04
- **链接**:https://medium.com/@fisher262425/harness-engineering-the-oldest-new-idea-in-ai-7a7bcd6baf7b
- **核心贡献**:**三段论**(Prompt → Context → Harness 的 2023/2025/2026 时间线)。火/炉子/蒸汽机的历史类比。**Elden Ring / Clash of Clans / StarCraft II** 游戏尺度比喻。
- **本书章节**:Ch 1, Ch 3
- **值得追问**:下一个 era 的名字?(本书猜测:Substrate Engineering 或 Protocol Engineering)

##### A.9 · Andrej Karpathy · *LLM Wiki* (gist)

- **日期**:2024-2026(持续更新)
- **链接**:https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
- **核心贡献**:三层分离(Raw Sources / Maintained Wiki / Schema)。**Ingest / Query / Lint** 三操作。"The tedious part of maintaining a knowledge base is bookkeeping" 的洞察。**autoresearch** 家族(姐妹 gist)确立的两文件 resume 协议。
- **本书章节**:Ch 4, Ch 8, Ch 9
- **值得追问**:LLM Wiki 在 100-200 页规模后的扩展性 —— 是否需要引入 hierarchical index 或 secondary retrieval?

##### A.10 · Stanford IRIS Lab · *Meta-Harness: End-to-End Optimization of Model Harnesses*

- **日期**:2026
- **链接**:https://arxiv.org/abs/2603.28052 · https://github.com/stanford-iris-lab/meta-harness
- **作者**:Lee, Nair, Zhang, Lee, Khattab, Finn
- **核心贡献**:**自动化 harness 设计**。一个 outer-loop agentic proposer 读取所有历史候选 harness 的源码、分数、trace,提议新 harness 变体。文本分类 +7.7 分同时 context token -75%;数学推理 +4.7 分,5 个 held-out 模型;TerminalBench-2 超过手工 harness。
- **本书章节**:Ch 3, Ch 5, Ch 11, Ch 12, Ch 13
- **值得追问**:当 proposer 能自动优化 harness,什么是**永远不能交给 proposer 的东西**?本书答案:objective 定义、verification 独立性、tool 权限边界。
- **与 A.3 Anthropic Managed Agents 的关系**:"Meta" 字面相同,含义正交。Anthropic = *稳定接口* 的 meta;Stanford = *自动搜索* 的 meta。两者可组合:Anthropic 定义 slot,Stanford 往里自动填内容。详见 [[concept-harness-as-platform]] 的 "Two orthogonal meanings of meta-harness" 节。

---

##### 如何用这份精读开始你自己的调研

按照 ascent-research 的工作流:

```bash
# 1. 新建 session
ascent-research new "harness engineering study" --slug hx-study

# 2. 把九篇奠基文作为 local sources 加入
ascent-research add <URL of each piece>

# 3. 运行 loop 让 agent 沉淀你自己的 wiki
ascent-research loop hx-study --iterations 12

# 4. 针对本书每一章的"值得追问"做 wiki query
ascent-research wiki query "how does Ashby's law apply to LLM harness coverage metrics?"
```

这样,九篇奠基文 → 你的私有 wiki → 你的长期记忆库。这就是驾驭工程的**自我应用**。
