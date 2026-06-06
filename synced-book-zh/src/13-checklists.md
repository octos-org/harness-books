# 14. 可执行清单

边界讲清之后，剩下的工作就是把前面各章的要求压成能执行的检查项。第 14 章不是新观点，而是把第 4.8 节那九个维度压成可以拿来做合并前、上线前、事故后的动作清单，并补上一条匿名失败链的逐层排查顺序。

## 14.1 维护者预合并清单（影响 harness 的 PR）

- [ ] 变更映射到显式用户可见不变量。
- [ ] 契约状态能跨崩溃/重载/压缩持久存在。
- [ ] 生命周期迁移是单调的，并有测试覆盖。
- [ ] 产物选择使用声明式策略，而不是把启发式回退当主路径。
- [ ] 必要时验证器失败会阻断终态成功。
- [ ] 会话/主题作用域检查能防止跨会话污染。
- [ ] API 和 SSE 回放暴露同一份任务事实。
- [ ] 操作员摘要/仪表盘信号包含新的失败模式。
- [ ] 新增 sub-agent / background task 路径时，角色、scope、summary 和 validator 一起落地。
- [ ] 小型 fleet 门禁至少在两台主机上通过。
- [ ] 契约变更时，文档、fixture、脚本、端到端测试在同一个 slice 更新。

## 14.2 第三方 app/skill 开发者清单

- [ ] 声明单一规范 `primary` 产物。
- [ ] 为存在性、大小和领域约束定义验证器。
- [ ] 只使用稳定生命周期/任务 API 字段。
- [ ] 当 `HARNESS_EVENT_SINK` 可用时，通过它发出结构化进度。
- [ ] stderr 用于诊断，不用于契约状态。
- [ ] 确保 hooks 幂等（尤其是 `before_spawn_verify`）。
- [ ] 为你的工作流测试重载/会话切换行为。
- [ ] 如果工作流会 spawn 子 agent，声明其摘要格式、产物归属和取消/恢复语义。
- [ ] 验证失败路径会产生操作员可读证据。

## 14.3 事故响应清单（状态漂移 / 污染类）

- [ ] 对比 `/api/sessions/:id/tasks` 快照和 UI 气泡/页头。
- [ ] 检查 SSE 流是否缺失或存在越界 `task_status` 事件。
- [ ] 确认回放和实时事件上的 session/topic 标签。
- [ ] 检查最终快照中是否有重复 deep-research/run_pipeline 任务。
- [ ] 验证阶段顺序单调性和进度范围。
- [ ] 修补前捕获诊断 JSON 和 curl 提示。
- [ ] 修复后重新运行小型 fleet 门禁；不要接受仅本地验证。

## 14.4 匿名失败链的逐层落地检查

如果你正在修第 13.1 节那类“看似完成、实际交错文件”的事故，可以直接按下面这条链检查，不要一上来就改提示词。

- [ ] `session`：root task 是否显式声明 primary artifact、child task、owner、role 和 worktree。
- [ ] `session`：artifact 报告是否带 task id / session id，而不是只有自由文本路径。
- [ ] `capability plane`：Python / Node / shell / MCP 调用是否都通过统一事件入口回传状态与产物。
- [ ] `capability plane`：外部能力是否把引用、下载物、临时文件写进了声明过的 scope，而不是写进任意目录。
- [ ] `verifier`：是否同时验证“文件存在”“文件归属正确”“内容足够新”“关键业务约束达标”。
- [ ] `verifier`：失败时是否留下了 validator 名称、失败类别、证据路径和持续时间。
- [ ] `operator dashboard`：是否能直接看到 root / child task 关系、最近 summary、最近 artifact、最近 validator 结果。
- [ ] `operator dashboard`：是否存在只在仪表盘里出现、却无法回指事实流的影子状态。
- [ ] `swarm`：coordinator 是否只做拆解与裁决，而不是自己悄悄替 child task 兜底宣布成功。
- [ ] `swarm`：child agent 的 summary 是否包含可验证产物引用，而不是一句模糊的 “done”。

这组检查项的目的，是把“问题出在 session、能力平面、validator、仪表盘还是 swarm”快速切开。只要团队还在把这五层混成一个“agent 没做好”，修复成本就会始终过高。

## 14.5 参考架构落地自检（卷三的具体工件是否到位）

前一组清单切的是“事故出在哪一层”，这一组切的是更早的问题：你照着卷三搭出来的那套参考架构，关键工件到底有没有真正落地。它逐条对应第 6 到 10 章那条“假成功”任务被堵死的每一道缝——任何一条还打着叉，那道缝就还开着。

- [ ] `事实流`：模型的完成声明被单独建模成 `model.claim`，与带 `ok` 字段的 `tool.returned` 物理隔离，且无权改写终态。
- [ ] `事实流`：每条事件带单调 `seq`，产物事件带 `sha256`，工具事件带 `args_digest` 而非原始参数。
- [ ] `生命周期`：`verifying → ready` 这条边的守卫是“所有 gating validator 全绿”，模型最多只能把任务从 `running` 推到 `verifying`。
- [ ] `生命周期`：`resume` 是一等迁移，能从某个 checkpoint `seq` 重建上下文，而不是重开任务。
- [ ] `产物与验证`：每个任务在创建时声明 artifact 契约（`required_artifacts` + `owner_rule:single`），主产物显式唯一归属。
- [ ] `产物与验证`：验证器分 `gating` 与非 `gating`，只有 gating 失败否决终态，“尽力而为”的检查记录但不阻断。
- [ ] `产物与验证`：每一项“成功的证据”都是一件可寻址的 artifact（如 `delivery.receipt`），而不是一句可被乐观改写的日志。
- [ ] `能力平面`：每个桥接工具有 `success_means` 结果契约，把“成功”钉在可回查的客观事实上，而非 HTTP 状态码或模型语义。
- [ ] `能力平面`：非主语言脚本经 `HARNESS_EVENT_SINK` 回流事件，sink 缺失时 `emit` no-op，但 artifact 契约与 gating validator 绝不因此豁免。
- [ ] `权限`：特权 scope（发外部、花钱、删除）触发 `approval.requested`，审批的请求与裁决都是事实流里的一等事件。
- [ ] `回放`：UI 的生命周期值只能由 `task.settled` 点亮，fold 是无私有记忆的纯函数；绿色完成态对 `model.claim` 不可表示。
- [ ] `操作员面`：存在 `assert_terminal_authentic` 类门禁，对每个 `ready` 任务断言其 gating validator 全绿、required artifact 齐备。
- [ ] `协作`：事件写入权限表强制“仅 coordinator 能写 `task.settled`、仅 verifier 能写 `validator.result`”，worker 只能 `subagent.reported`。

这组自检最好在第一次把参考架构接进自己系统时逐条过一遍，之后每次大改事实流、验证或编排协议时再过一遍。它不保证产品好用——那是第 13 章划清的边界——但它保证：系统至少不会再对用户说一次它自己都没验证过的“完成”。

---
