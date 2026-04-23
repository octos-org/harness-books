# 5. 非 Rust 桥接：平台现实的必需品

Octos is Rust-first runtime, but skill ecosystem is multi-language.

If progress/event contracts work only in Rust:

- third-party integration speed collapses
- contract compliance becomes Rust-gatekept
- operator data quality becomes inconsistent

Therefore M4.1A’s non-Rust bridge is essential, not optional polish:

- Python emitter helper
- Node emitter helper
- CLI fallback emitter
- no-op semantics when sink absent
- runtime-side validation remains authoritative

Principle: language diversity at emit edge, strict normalization at consume edge.

---

### 同步说明

本节以 Octos 短纲要为准。较大的 mdBook 源材料中暂时没有直接映射到本节的章节，所以本节目前保留为纲要主导内容。
