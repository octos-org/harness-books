# 13. 参考架构片段

前面的章节已经给出原则、边界和检查表；这一章补三段最小架构片段，帮助团队把抽象要求落成具体事实流、契约执行流和 swarm 控制流。

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

## 13.3 Swarm 控制流

```text
coordinator 接收总目标
  -> 拆成带 scope / owner / validator 的子任务
  -> spawn sub-agent 到隔离 worktree / context
  -> 子 agent 回传摘要、证据、diff、产物引用
  -> verifier 汇总跨 shard 冲突与遗漏
  -> coordinator 依据验证结果裁决 ready / failed
  -> dashboard / replay 投影同一条协作事实流
```

没有 summary、scope、validator 和终态裁决的并行，只是多窗口，不是 swarm。

---
