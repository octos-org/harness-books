# 5. 非 Rust 桥接：平台现实的必需品

Octos 是 Rust-first runtime，但 skill 生态是多语言的。

如果进度/事件契约只在 Rust 中可用：

- 第三方集成速度会坍塌
- 契约合规会变成 Rust 门槛
- 操作员数据质量会不一致

因此 M4.1A 的非 Rust 桥接是必要项，不是可选润色：

- Python emitter helper
- Node emitter helper
- CLI fallback emitter
- sink 缺失时的 no-op 语义
- runtime-side validation 仍然是权威

原则：发射端允许语言多样性，消费端严格规范化。

---

### 同步说明

本节以 Octos 短纲要为准。较大的 mdBook 源材料中暂时没有直接映射到本节的章节，所以本节目前保留为纲要主导内容。
