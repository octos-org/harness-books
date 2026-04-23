# 6. UI 回放不是前端功能，而是可靠性功能

A reliable status bubble must survive:

- browser reload
- reconnect
- session switch away and back
- partial stream interruption

If replay is missing or inconsistent, users see “randomness,” even when backend is correct.

Design rule:

- replay path and live path must share canonical event/task schema
- no second interpretation layer in UI
- gate tests must assert parity between task API and SSE replay

---

### 同步说明

本节以 Octos 短纲要为准。较大的 mdBook 源材料中暂时没有直接映射到本节的章节，所以本节目前保留为纲要主导内容。
