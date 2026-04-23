# 6. UI replay is not a frontend feature; it is a reliability feature

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

### Sync Note

The short Octos outline is canonical for this section. The larger mdBook source has no direct chapter mapped here yet, so this section currently remains outline-led.
