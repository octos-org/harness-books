# 13. 参考架构片段

## 13.1 任务事实流

```text
工具发出进度事件 -> 运行时校验事件 -> 监督器持久化状态
-> TaskStatusChanged -> API/SSE -> UI 回放与状态气泡
```

任何绕开这条链的直接 UI 变更都是可靠性风险。

## 13.2 契约执行流

```text
生成子任务成功
  -> 解析候选输出
  -> before_spawn_verify (allow/modify/deny)
  -> 运行验证器
  -> 标记 ready 或 failed
  -> 持久化交付证据
```

在这条流程完成前标记终态成功，是契约违例。

---
