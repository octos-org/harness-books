# 10. Workstream to milestone mapping (pragmatic roadmap)

This mapping aligns with current M4 direction and remaining platformization gaps.

## M4.1A — Parent-visible structured progress ABI

- typed `octos.harness.event.v1`
- sink + consumer + task_status bridge
- deep-search migration from stderr status
- UI/API replay parity
- mini fleet live gate
- non-Rust emitters

## M4.2 — Developer contract productization

- stable docs for manifest/policy/task fields
- starter app templates across artifact classes
- contract examples with failure modes

## M4.3 — Typed validator runner

- declarative validators with typed outcomes
- timeout taxonomy and failure categories
- replayable evidence and operator-facing provenance

## M4.4 — Compatibility gate for third-party apps/skills

- install from git
- run harness flow
- validate artifacts
- reload and verify persistence
- uninstall and verify no state bleed

## M4.5 — Operator dashboard maturation

- lifecycle + phase + validator + artifact surfaces
- retry/timeout/orphan diagnostics
- compact incident-ready views backed by canonical task summary

## M4.6 — Explicit ABI versioning and migration policy

- schema versions for events/hooks/policy/task fields
- compatibility tests and deprecation windows
- breaking-change protocol before external adoption

This roadmap is ordered to match the failures above, not to satisfy backlog aesthetics. The first items repair truth propagation; the later items harden compatibility and governance once the truth model is stable. The next chapter is the necessary pause: harness fixes orchestration correctness, but it does not finish the product.

---

### Sync Note

The outline is canonical for this section. The larger mdBook source has no direct chapter mapped here yet, so this section currently remains outline-led.
