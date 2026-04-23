# 11. Harness 必要但不充分

Harness solves orchestration correctness, not full product quality.

A high-quality coding agent still requires:

- strong model selection and routing strategy
- tool safety boundaries (sandbox, auth, privilege gates)
- robust prompt/policy alignment for coding workflows
- test generation/repair discipline
- repository-aware edit quality and review loops
- latency/cost governance

Think of harness as the runtime truth layer.  
Without it, quality cannot be trusted.  
With it alone, quality still depends on model + tool + product discipline.

In Octos terms, this is the boundary between "the system tells the truth" and "the system is a good product." The former is what the failure modes forced us to build; the latter still depends on model routing, sandboxing, prompt/policy alignment, and review discipline.

---

### 同步说明

本节以 Octos 短纲要为准。较大的 mdBook 源材料中暂时没有直接映射到本节的章节，所以本节目前保留为纲要主导内容。
