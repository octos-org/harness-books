# 5. Non-Rust bridge: mandatory for platform reality

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

### Sync Note

The short Octos outline is canonical for this section. The larger mdBook source has no direct chapter mapped here yet, so this section currently remains outline-led.
