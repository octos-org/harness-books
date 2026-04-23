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
11. Nelson F. Liu et al. *Lost in the Middle: How Language Models Use Long Contexts.* TACL 2024. https://direct.mit.edu/tacl/article/doi/10.1162/tacl_a_00638/119630/Lost-in-the-Middle-How-Language-Models-Use-Long
12. Cheng-Yu Hsieh et al. *Found in the Middle: Calibrating Positional Attention Bias Improves Long Context Utilization.* ACL Findings 2024. https://aclanthology.org/2024.findings-acl.890/
13. Anthropic. *Prompting best practices: Long context prompting.* https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#long-context-prompting
14. Google. *Introducing Gemini 1.5, Google's next-generation AI model.* 2024-02-15. https://blog.google/innovation-and-ai/products/google-gemini-next-generation-model-february-2024/
15. Google AI for Developers. *Long context.* https://ai.google.dev/gemini-api/docs/long-context
16. Ali Modarressi et al. *NoLiMa: Long-Context Evaluation Beyond Literal Matching.* ICML 2025. https://proceedings.mlr.press/v267/modarressi25a.html
17. Stefano Rando et al. *LongCodeBench: Evaluating Coding LLMs at 1M Context Windows.* COLM 2025. https://openreview.net/forum?id=GFPoM8Ylp8
18. Huiqiang Jiang et al. *LongLLMLingua: Accelerating and Enhancing LLMs in Long Context Scenarios via Prompt Compression.* ACL 2024. https://aclanthology.org/2024.acl-long.91/
19. Huiqiang Jiang et al. *MInference: Accelerating Pre-filling for Long-Context LLMs via Dynamic Sparse Attention.* 2024. https://openreview.net/forum?id=C5Nh2UFJ9S
20. OpenAI. *API Pricing.* Accessed 2026-04-23. https://openai.com/api/pricing/
21. OpenAI. *openai/codex* repository, including README, `AGENTS.md`, and `docs/`. Accessed 2026-04-23. https://github.com/openai/codex
22. OpenClaw. *openclaw/openclaw* repository README and docs. Accessed 2026-04-23. https://github.com/openclaw/openclaw
23. Nous Research. *NousResearch/hermes-agent* repository README and developer guide. Accessed 2026-04-23. https://github.com/NousResearch/hermes-agent
24. Claude Code 本地源码镜像审读，关键模块包括 `services/tools/StreamingToolExecutor.ts`、`services/compact/{microCompact,compact,apiMicrocompact}.ts`、`utils/sessionStorage.ts`、`utils/fileStateCache.ts`、`utils/task/diskOutput.ts`、`services/AgentSummary/agentSummary.ts`、`tools/AgentTool/resumeAgent.ts`、`utils/worktree.ts`。审读日期 2026-04-23。

## 19.2 支持性参考

- Kai Mei et al. *AIOS: LLM Agent Operating System.*
- Bertrand Meyer. *Object-Oriented Software Construction.*
- Dan Ariely 2013 年关于 big data 的那句话，它既是本书反复出现的玩笑，也是警告。
- EU AI Act、SEC disclosure expectations、FDA SaMD guidance 等治理压力。

## 19.3 研究轨迹

底层研究材料位于写作本书时使用的 `ascent-research` session tree，包括 `session.md`、`session.jsonl`、`SCHEMA.md`、`wiki/`、`diagrams/`、`raw/` 和 `drafts/`。

这条轨迹本身也是本书论点的一部分：写作过程就是一次被 harness 化、可恢复、可回放的工作。
