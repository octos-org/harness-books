# 13. 参考架构片段

前面的章节已经给出原则、边界和检查表；这一章补六段最小架构片段，帮助团队把抽象要求落成具体事实流、契约执行流、swarm 控制流，以及一条匿名失败链的端到端落地图、最小事件序列和可直接复用的复盘模板。

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

## 13.6 可直接复用的事故复盘 Markdown 模板

下面这份模板可以直接作为团队的复盘章节骨架使用。它的重点不是格式统一，而是强制每一次事故都沿着同一条控制链写清楚。

```md
# 事故标题

## 1. 事故摘要

- 事故编号：
- 首次发生时间：
- 首次发现时间：
- 当前状态：进行中 / 已缓解 / 已修复 / 已验证
- 一句话摘要：
  - 例如：root task 被错误标记为 `ready`，但交付的 `slides.pptx` 实际是旧模板文件。

## 2. 用户影响与业务影响

- 受影响用户 / 项目：
- 受影响时间窗：
- 用户表面症状：
- 错误交付 / 重复执行 / 数据污染 / 合规风险：
- 是否需要外部沟通或补偿：

## 3. 时间线

| 时间（绝对时间） | 事件 | 证据 |
|---|---|---|
| 2026-04-23 10:02 | 用户提交任务 | session id / request id |
| 2026-04-23 10:05 | child task 开始拉资料 | event id / log path |
| 2026-04-23 10:12 | root task 被标记为 `ready` | task snapshot |
| 2026-04-23 10:18 | 用户报告交付文件错误 | support ticket |

## 4. 任务 / Agent 拓扑

- root task：
- coordinator：
- child tasks：
  - child A：role / owner / worktree / expected artifact
  - child B：role / owner / worktree / expected artifact
- 外部能力：
  - shell / MCP / Python / Node / browser / API
- 人工介入点：

## 5. 用户面与系统面如何分叉

- 用户看到的事实：
- UI / replay 呈现的事实：
- operator dashboard 呈现的事实：
- 底层运行时实际发生的事实：
- 第一次分叉发生在哪个时刻：

## 6. 五层断裂点解剖

### 6.1 Session

- root / child task 关系是否被显式持久化：
- primary artifact 是否被显式声明：
- scope / owner / role / worktree 是否完整：
- 这里的缺口是什么：

### 6.2 Capability Plane

- 实际调用了哪些能力：
- Python / Node / shell / MCP 是否走统一事件入口：
- artifact / citation / temp file 是否按契约回传：
- 这里的缺口是什么：

### 6.3 Verifier

- 哪些 validator 本应拦住问题：
- 实际运行了哪些 validator：
- 为什么没有阻断终态：
- 证据路径：

### 6.4 Operator Dashboard

- 值班同学是否能直接看到 root/child 关系、artifact、validator 结果：
- 哪些关键信息缺失：
- 哪些状态只是影子状态：

### 6.5 Swarm / Coordinator

- coordinator 的职责是否越界：
- child agent 是否回传了可验证 summary：
- 是否存在局部成功伪装成系统成功：

## 7. 证据包

- session / task 快照：
- 关键事件序列：
- artifact 路径：
- validator 输出：
- dashboard 截图：
- 相关 commit / deploy / feature flag：

## 8. 根因归类

- 四支柱归类：
  - Session / Harness / Tools / Verification
- 九维度归类：
  - 事实流 / 生命周期 / 能力平面 / 产物与验证 / 回放 / 隔离与恢复 / 协作 / 知识分层 / 操作员面
- 最终根因一句话：

## 9. 为什么现有防线没有拦住

- 哪个 validator 缺失：
- 哪个门禁没有覆盖：
- 哪个 dashboard 信号不够：
- 哪个 runbook 或 skill 没有晋升：

## 10. 修复动作

### 10.1 已执行 Hotfix

- [ ] 修复项
- [ ] 影响范围
- [ ] 回滚策略

### 10.2 结构修复

- [ ] session / schema 修复
- [ ] capability plane 修复
- [ ] validator 修复
- [ ] dashboard / replay 修复
- [ ] swarm / coordinator 修复

### 10.3 发布门禁补强

- [ ] mini-fleet case
- [ ] replay fixture
- [ ] validator evidence assertion
- [ ] cross-session contamination check

## 11. 组织沉淀

- 会新增哪些 validator：
- 会新增哪些 dashboard 信号：
- 会新增哪些 runbook：
- 会晋升哪些 `AGENTS.md` / docs / skills 规则：
- 下次同类事故应被什么机制更早拦住：

## 12. 完成定义

- [ ] 用户面症状已消失
- [ ] 根因层修复已上线
- [ ] 对应 validator / gate / dashboard 已补齐
- [ ] mini-fleet 已复现并验证通过
- [ ] 复盘已归档到 failure museum
```

这个模板最重要的价值，不是让复盘文档更整齐，而是避免团队把 harness 事故再次写成“一个人记得的故事”。只要每次都沿着这份模板写，事故就会持续沉进 session 模型、能力平面、validator、dashboard 和 swarm 纪律里。

---
