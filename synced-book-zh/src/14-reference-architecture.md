# 13. 参考架构片段

## 13.1 任务事实流

```text
tool emits progress -> runtime validates event -> supervisor persists state
-> TaskStatusChanged -> API/SSE -> UI replay/status bubble
```

任何绕开这条链的直接 UI 变更都是可靠性风险。

## 13.2 契约执行流

```text
spawn success
  -> resolve candidate outputs
  -> before_spawn_verify (allow/modify/deny)
  -> validator runner
  -> mark ready or failed
  -> persist delivery evidence
```

在这条流程完成前标记终态成功，是契约违例。

---

### 同步说明

本节以 Octos 短纲要为准。较大的 mdBook 源材料中暂时没有直接映射到本节的章节，所以本节目前保留为纲要主导内容。
