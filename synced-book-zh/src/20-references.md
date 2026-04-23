# 19. 参考文献与研究轨迹

## 19.1 奠基来源

1. Birgitta Böckeler. *Harness engineering for coding agent users.* Martin Fowler, 2026-04-02. https://martinfowler.com/articles/harness-engineering.html
2. OpenAI. *Harness Engineering: Leveraging Codex in an Agent-First World.* https://openai.com/index/harness-engineering/
3. Lance Martin, Gabe Cemaj, Michael Cohen. *Scaling Managed Agents: Decoupling the brain from the hands.* https://www.anthropic.com/engineering/managed-agents
4. Prithvi Rajasekaran. *Harness Design for Long-Running Application Development.* https://www.anthropic.com/engineering/harness-design-long-running-apps
5. NxCode. *What Is Harness Engineering? Complete Guide for AI Agent Development.* https://www.nxcode.io/resources/news/what-is-harness-engineering-complete-guide-2026
6. Nyah Macklin. *Context Engineering for AI Agents.* https://neo4j.com/blog/developer/context-engineering/
7. Milvus. *Harness Engineering: The Execution Layer AI Agents Actually Need.* https://milvus.io/ai-quick-reference/harness-engineering-the-execution-layer-ai-agents-actually-need
8. Fisher Zhang. *Harness Engineering: The Oldest New Idea in AI.* https://medium.com/@fisher262425/harness-engineering-the-oldest-new-idea-in-ai-7a7bcd6baf7b
9. Andrej Karpathy. *LLM Wiki.* https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
10. Stanford IRIS Lab. *Meta-Harness: End-to-End Optimization of Model Harnesses.* https://arxiv.org/abs/2603.28052

## 19.2 支持性参考

- Kai Mei et al. *AIOS: LLM Agent Operating System.*
- Bertrand Meyer. *Object-Oriented Software Construction.*
- Dan Ariely 2013 年关于 big data 的那句话，它既是本书反复出现的玩笑，也是警告。
- EU AI Act、SEC disclosure expectations、FDA SaMD guidance 等治理压力。

## 19.3 研究轨迹

底层研究材料位于写作本书时使用的 `ascent-research` session tree，包括 `session.md`、`session.jsonl`、`SCHEMA.md`、`wiki/`、`diagrams/`、`raw/` 和 `drafts/`。

这条轨迹本身也是本书论点的一部分：写作过程就是一次被 harness 化、可恢复、可回放的工作。

### 扩展源材料


#### 来自 `99-references.md`：参考文献

_源材料角色：完整参考文献列表。_


#### 参考文献

##### 十篇奠基文(2026 同一季度集中出现)

1. Birgitta Böckeler. *Harness engineering for coding agent users.* martinfowler.com, 2026-04-02. https://martinfowler.com/articles/harness-engineering.html
2. OpenAI. *Harness Engineering: Leveraging Codex in an Agent-First World.* Feb 2026. https://openai.com/index/harness-engineering/
3. Lance Martin, Gabe Cemaj, Michael Cohen. *Scaling Managed Agents: Decoupling the brain from the hands.* Anthropic Engineering, Apr 2026. https://www.anthropic.com/engineering/managed-agents
4. Prithvi Rajasekaran. *Harness Design for Long-Running Application Development.* Anthropic Labs, 2026-03-24. https://www.anthropic.com/engineering/harness-design-long-running-apps
5. NxCode. *What Is Harness Engineering? Complete Guide for AI Agent Development.* March 2026. https://www.nxcode.io/resources/news/what-is-harness-engineering-complete-guide-2026
6. Nyah Macklin. *Context Engineering for AI Agents.* Neo4j blog, 2026-03-09. https://neo4j.com/blog/developer/context-engineering/
7. Milvus. *Harness Engineering: The Execution Layer AI Agents Actually Need.* 2026. https://milvus.io/ai-quick-reference/harness-engineering-the-execution-layer-ai-agents-actually-need
8. Fisher Zhang. *Harness Engineering: The Oldest New Idea in AI.* Medium, April 2026. https://medium.com/@fisher262425/harness-engineering-the-oldest-new-idea-in-ai-7a7bcd6baf7b
9. Andrej Karpathy. *LLM Wiki.* GitHub Gist (2024-2026). https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
10. Lee, Nair, Zhang, Lee, Khattab, Finn (Stanford IRIS Lab). *Meta-Harness: End-to-End Optimization of Model Harnesses.* 2026. https://arxiv.org/abs/2603.28052 · https://github.com/stanford-iris-lab/meta-harness

##### 其他重要来源

11. Kai Mei et al. *AIOS: LLM Agent Operating System.* COLM 2025. https://arxiv.org/abs/2403.16971
12. AIOS Foundation. https://www.aios.foundation/
13. Bertrand Meyer. *Object-Oriented Software Construction* (Design by Contract). Prentice-Hall, 1988.
14. Dan Ariely. Twitter, January 2013. "Big data is like teenage sex..."
15. EU AI Act. 2024.
16. SEC AI Disclosure requirements.
17. FDA Software as a Medical Device (SaMD) guidance.

##### 相关开源项目

- **ascent-research** (本书作者维护) —— https://github.com/ZhangHanDong/ascent-research
- **agent-spec** (本书作者维护) —— spec-driven development framework
- **mempal** (本书作者维护) —— memory governance for agent systems
- **pi-autoresearch** (Dave Copeland) —— https://github.com/davebcn87/pi-autoresearch
- **Creusot** —— Rust formal verification (INRIA)
- **Prusti** —— Rust formal verification (ETH Zurich)
- **Kani** —— Rust bounded model checker (AWS)

##### 调研过程

本书的全部调研过程透明可见于 `ascent-research` 会话:

```
~/.actionbook/research/harness-engineering/
├── session.md          —— 叙事层
├── session.jsonl       —— 事件流(所有 fetch / digest / write 记录)
├── SCHEMA.md           —— 本书的 schema 指引
├── wiki/               —— 21+ wiki 页面作为知识底库
├── diagrams/           —— 3 张 hand-drawn SVG
├── raw/                —— 所有原始 fact card
└── drafts/             —— 章节草稿
```

读者可以 fork 这个 session,继续累积自己的 harness engineering 研究。这本身就是一次驾驭工程的演示。
