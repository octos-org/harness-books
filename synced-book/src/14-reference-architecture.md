# 13. Reference architecture snippets

## 13.1 Task truth flow

```text
tool emits progress -> runtime validates event -> supervisor persists state
-> TaskStatusChanged -> API/SSE -> UI replay/status bubble
```

Any direct UI mutation outside this chain is a reliability risk.

## 13.2 Contract enforcement flow

```text
spawn success
  -> resolve candidate outputs
  -> before_spawn_verify (allow/modify/deny)
  -> validator runner
  -> mark ready or failed
  -> persist delivery evidence
```

Marking terminal success before this flow completes is a contract violation.

---

### Sync Note

The outline is canonical for this section. The larger mdBook source has no direct chapter mapped here yet, so this section currently remains outline-led.
