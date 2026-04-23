# 13. 参考架构片段

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

### 同步说明

本节以 Octos 短纲要为准。较大的 mdBook 源材料中暂时没有直接映射到本节的章节，所以本节目前保留为纲要主导内容。
