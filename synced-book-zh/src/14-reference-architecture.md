# 15. 参考架构片段

前面的章节已经给出原则、边界和检查表；这一章补七段最小架构片段，帮助团队把抽象要求落成具体事实流、契约执行流、swarm 控制流，以及一条匿名失败链的端到端落地图、最小事件序列、可直接复用的复盘模板，外加一份按全书贯穿样例（那条“假成功”的周报任务）填好的复盘范例。

## 15.1 任务事实流

```text
工具发出进度事件 -> 运行时校验事件 -> 监督器持久化状态
-> TaskStatusChanged -> API/SSE -> UI 回放与状态气泡
```

任何绕开这条链的直接 UI 变更都是可靠性风险。

## 15.2 契约执行流

```text
生成子任务成功
  -> 解析候选输出
  -> before_spawn_verify (allow/modify/deny)
  -> 运行验证器
  -> 标记 ready 或 failed
  -> 持久化交付证据
```

在这条流程完成前标记终态成功，是契约违例。

## 15.3 Swarm 控制流

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

## 15.4 匿名失败链的端到端落地图

把第 13.1 节那条匿名失败链翻译成一张可以落地的架构图，大致应该长这样：

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

## 15.5 一组最小事件序列

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
- `summary.updated` / `operator.alerted` 说明仪表盘该怎样说人话；
- `task.failed` 则把系统终态固定下来。

没有这类最小事件序列，很多系统也能“看起来运行”。但只要出一次事故，团队就会发现自己没有真正的运行时事实，只剩聊天记录和猜测。

## 15.6 可直接复用的事故复盘 Markdown 模板

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

这个模板最重要的价值，不是让复盘文档更整齐，而是避免团队把 harness 事故再次写成“一个人记得的故事”。只要每次都沿着这份模板写，事故就会持续沉进 session 模型、能力平面、validator、仪表盘和 swarm 纪律里。

## 15.7 一份填好的复盘：周报投递的“假成功”

空模板再清楚，也不如填好的一份有说服力。第 6 章那条贯穿全卷的任务——把 `q2-weekly.pdf` 发到 `#finance`、却在两段式上传的第二段悄悄失败——我们一路追到了第 10 章。现在把它按上面的模板填一遍，但只填操作员真正会在三十秒里扫过的那几格。它该长这样：

```md
# 事故：周报“已发送”，但 #finance 从未收到

## 1. 事故摘要
- 事故编号：INC-2026-0602-01
- 任务：t_9f2（季度周报投递）
- 当前状态：已修复
- 一句话摘要：模型在聊天里声称“已发送到 #finance”，但 slack.upload 的
  completeUpload 超时、delivery.receipt 从未生成；任务真实终态是 failed。

## 2. 用户影响与业务影响
- 受影响方：财务团队、CFO
- 时间窗：2026-06-02 09:01 报“完成”，至 06-05 例会上被发现，约 3 天
- 用户表面症状：聊天显示绿色完成气泡“已发送、已抄送 CFO”
- 错误交付：是——周报实际未送达，决策依据缺失
- 合规风险：低（无数据外泄，仅交付缺失）

## 3. 时间线
| 时间 | 事件 | 证据 |
|---|---|---|
| 06-02 09:00:31 | report.pdf 生成 | seq 5, sha256 9c0b… |
| 06-02 09:01:03 | slack.upload 第二段超时 | seq 7, ok=false, upload_incomplete |
| 06-02 09:01:05 | 模型声称“已发送” | seq 8, type=model.claim |
| 06-05 10:00   | CFO 例会上报告缺失 | 会议纪要 |

## 6. 五层断裂点解剖（一句话版）
- session：事实流没问题——seq 7 的失败一直在，从未被覆盖。
- 能力平面：✗ 早期版本里 slack.upload 是 prompt 里一段 curl，
  success_means 未定义，把第一段的 2xx 当成了成功。
- verifier：✗ slack.delivered 当时是 best-effort、非 gating，未阻断终态。
- dashboard：✗ 无“ready 但 gating 未全绿”信号，绿气泡无人质疑。
- swarm：本次为单 agent，未涉及。

## 8. 根因归类
- 四支柱：Tools（能力契约缺 success_means）+ Verification（gating 缺失）
- 九维度：能力平面 / 产物与验证
- 最终根因一句话：把“成功”的定义留给了模型语义和 HTTP 状态码，
  而不是一件可回查的 delivery.receipt 产物。

## 9. 为什么现有防线没有拦住
- slack.upload 无结果契约，未要求 emit delivery.receipt 产物
- slack.delivered 验证器存在但非 gating，failed 不阻断
- 无终态真实性门禁（assert_terminal_authentic）

## 11. 组织沉淀
- 新增 validator：slack.delivered 升为 gating
- 新增能力契约：slack.upload.success_means = completeUpload 2xx 且 file_id 可回查
- 新增门禁：assert_terminal_authentic（ready ⇒ 所有 gating validator 全绿）
- 新增 dashboard 信号：ready 但 gating 未全绿 → 立即标红
- 新增 runbook：见 READY_OVER_FAILED_GATE 处置三步
```

把这份填好的复盘和第 6 到 10 章对读，会发现它其实是那条防御链的回执单：第 2 节“用户看到绿、实际没送达”，正是第 8 章那个 fold 拒绝渲染的东西；第 6 节那行“能力平面 ✗”，正是第 7 章 `success_means` 要修的；第 9 节“验证器非 gating”，正是第 6.9 节 `gating` 开关存在的理由；第 11 节那条 `assert_terminal_authentic`，就是第 9 章那段门禁代码。一次事故、一条样例，从机理（卷一）到失败类别（第 5 章）、到参考架构与五章实现（卷三）、最后落回这份三十秒能读懂的复盘——这正是整本书想示范的那条闭环：**让每一次“假成功”，都被设计、被验证、被门禁、被复盘，逐层堵死它再次发生的可能。**

## 15.8 治理三片：审批、预算、路由

前面七段片段守的是“别让假成功悄悄点亮终态”。但第 16 章讲的治理边界是另一类问题：当 agent 真的有权花钱、删库、对外发声时，谁批准、花多少、用谁来干。治理听起来像是流程文档里的事，可一旦它只活在文档里，它就管不住运行时——真正能管住运行时的，是和前面同一条事实流里那几个 append-only 事件。下面三段把第 16 章的三条边界落成可回放的片段：每一段都是一条事件序列，外加一句它守住的不变量。它们和 §15.1–15.5 共享同一套底座，所以也共享同一种好处——出事时不靠谁的记忆，只靠 fold 回放。

先看审批。特权动作不该由发起它的那个 agent 自己批准——这就是第 16 章那句“被告不能兼任法官”。落地的办法不是加一个 `if user_is_admin` 的分支，而是让特权动作在执行器侧先被拦成一条挂起事件，把决定权交给一个独立的 actor，再用第二条事件把决定写回事实流。整条链长这样：

```text
tool.called          task=t_9f2 tool=slack.upload actor=agent privilege=external_send
approval.requested   task=t_9f2 action=external_send risk=medium
                     reason="向 #finance 投递对外可见周报" requested_by=agent seq=11
task.suspended       task=t_9f2 from=running to=verifying await=approval seq=12
approval.decided     task=t_9f2 action=external_send decision=allow
                     decided_by=operator:lin basis="周报内容已抽检、收件频道正确" seq=18
task.resumed         task=t_9f2 from=verifying to=running approver=operator:lin seq=19
```

关键在 `requested_by` 与 `decided_by` 必须是两个不同的 actor，且只有具备审批能力的 actor 才被允许写 `approval.decided`——这要靠第 6 章那张事件写入权限表来约束，正如只有 coordinator 能写 `task.settled`。`basis` 字段不是装饰：它让事后回放能回答“当时凭什么放行”，而不是只看到一个孤零零的 `allow`。**它守住的那条不变量是：任何特权动作的执行，都必须能在事实流里找到一条由独立 actor 写下、且带依据的 `approval.decided`，发起者自己的声明永远不算数。**

再看预算。预算的危险不在于超支本身，而在于“预算见底时系统怎么收场”。t_9f2 早期版本最隐蔽的一处，就是 turn 预算见底时它没有报错，而是悄悄跳过了本该执行的投递复查——预算耗尽被翻译成了“提前完成”。正确的做法是把每一次消耗记成事件、让累计可回放，并且把“耗尽”显式映射成一个非成功终态，而不是让它退化成静默的 done：

```text
budget.consumed   task=t_9f2 kind=turns delta=1 used=18 cap=20 seq=21
budget.consumed   task=t_9f2 kind=turns delta=1 used=19 cap=20 seq=23
budget.consumed   task=t_9f2 kind=turns delta=1 used=20 cap=20 seq=25
budget.exhausted  task=t_9f2 kind=turns used=20 cap=20 pending=delivery_recheck seq=26
task.settled      task=t_9f2 from=running to=failed
                  category=budget_exhausted_before_verify seq=27
```

注意 `pending=delivery_recheck`：它把“还差哪一步没做”留在了事实流里，于是终态是 `failed` 而非 `ready`，操作员一眼能看出这不是干净的完成。如果团队希望给一次补救机会，也可以让它退回 `verifying` 等待预算追加，但绝不能是 `done`——退回 `verifying` 与跳到 `failed` 的共同点，是都拒绝在复查没跑完时点亮终态。**它守住的那条不变量是：预算耗尽只能落到一个明确的非成功终态，未完成的验证步骤必须显式记录，绝不允许“没钱了”被静默改写成“做完了”。**

最后看路由。不是每个 turn 都值得动用最贵、最强的模型。第 16 章的路由边界，是让系统按风险、成本和有效工作区间来选模型，并把这个选择本身记成事件——可闭合、低风险的那部分工作可以路由给开源模型，再用 gating 验证器兜底，省下的预算留给真正难的判断。能这样做的前提，恰恰是验证器“可闭合”（sound、便宜、独立）：因为兜底门禁可靠，所以选谁来产出反而不那么要命。事件该长这样：

```text
model.selected   task=t_9f2 step=draft_summary model=oss-mid-14b
                 basis="可闭合:输出受 slack.delivered gating 兜底" risk=low cost_tier=1 seq=8
model.selected   task=t_9f2 step=delivery_decision model=frontier-lg
                 basis="对外投递、风险中、需判断收件频道" risk=medium cost_tier=3 seq=14
validator.ran    task=t_9f2 validator=slack.delivered gating=true result=fail seq=29
```

`basis` 同样是核心：它让“为什么这一步用了便宜模型”可回放，而不是事后只能猜。更要紧的是最后那行——无论上游选了哪个模型，`slack.delivered` 这道 gating 验证器都照跑不误；模型选择影响的是成本与速度，而绝不是终态的可信度。**它守住的那条不变量是：模型路由只能改变谁来产出、花多少成本，绝不能改变终态由 gating 验证器裁决这件事——便宜模型的产出，和贵模型的产出，要过的是同一道门。**

三段拼在一起，治理就不再是贴在墙上的制度，而是和任务事实流同源的几类事件：审批让权力可追溯，预算让代价可结算，路由让算力可调度——而它们各自守住的不变量，最终都指向同一句话：让对外可见的每一个终态，都站得住回放。

---
