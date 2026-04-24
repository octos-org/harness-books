# 13. 参考架构片段

前面的章节已经给出原则、边界和检查表；这一章补五段最小架构片段，帮助团队把抽象要求落成具体事实流、契约执行流、swarm 控制流，以及一条匿名失败链的端到端落地图和最小事件序列。

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

## 13.4 匿名失败链的端到端落地图

把第 11.1 节那条匿名失败链翻译成一张可以落地的架构图，大致应该长这样：

```text
用户提交“12 篇材料 -> 汇报 + slides”
  -> root session 创建，声明 primary artifacts = {report.md, slides.pptx}
  -> coordinator spawn research-worker / drafting-worker / verifier-worker
  -> research-worker 通过 web / MCP / shell 拉材料并回传 citation artifacts
  -> drafting-worker 在声明过的 worktree 内生成 report.md 与 slides draft
  -> verifier-worker 校验 artifact 归属、引用数量、页数、内容新鲜度
  -> task supervisor 汇总 validator 结果并更新 root task lifecycle
  -> dashboard 展示 root/child 关系、最近 summary、最近 artifact、失败证据
  -> 只有全部 validator 通过时，coordinator 才把 root task 标为 ready
```

这张图的关键，不是“用了几个 worker”，而是每一步都能沿着同一条事实流回放。只要某一步只能靠聊天文本或人脑猜测，最终用户看到的就仍然可能是伪完成。

## 13.5 一组最小事件序列

如果要让这条落地图真的可回放，session 里至少要能看到类似下面这样的一组最小事件：

```text
task.created         task=root-17 role=coordinator primary={report.md,slides.pptx}
task.spawned         task=child-17a parent=root-17 role=research scope=/worktrees/r-17a
tool.called          task=child-17a tool=mcp.search query="12 papers"
artifact.reported    task=child-17a kind=citation-bundle path=artifacts/citations.json
task.spawned         task=child-17b parent=root-17 role=drafting scope=/worktrees/d-17b
artifact.reported    task=child-17b kind=report path=deliverables/report.md
artifact.reported    task=child-17b kind=slides path=deliverables/slides.pptx
validator.failed     task=root-17 validator=slides_freshness evidence=checks/slides_freshness.json
summary.updated      task=root-17 text="draft complete, slides artifact stale"
operator.alerted     task=root-17 reason=validator_failed
task.failed          task=root-17 category=artifact_contract_violation
```

这组事件的价值在于，它把 `session -> capability plane -> verifier -> operator dashboard -> swarm` 串成了单一证据链：

- `task.created` / `task.spawned` 说明 session 与 swarm 关系；
- `tool.called` 说明 capability plane 实际调了什么能力；
- `artifact.reported` 说明谁声称自己产出了什么；
- `validator.failed` 说明为什么不能进入 `ready`；
- `summary.updated` / `operator.alerted` 说明 dashboard 该怎样说人话；
- `task.failed` 则把系统终态固定下来。

没有这类最小事件序列，很多系统也能“看起来运行”。但只要出一次事故，团队就会发现自己没有真正的运行时事实，只剩聊天记录和猜测。

---
