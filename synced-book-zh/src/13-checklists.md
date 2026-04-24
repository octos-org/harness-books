# 12. 可执行清单

边界讲清之后，剩下的工作就是把前面各章的要求压成能执行的检查项。第 12 章不是新观点，而是把第 2.7 节那九个维度压成可以拿来做合并前、上线前、事故后的动作清单，并补上一条匿名失败链的逐层排查顺序。

## 12.1 维护者预合并清单（影响 harness 的 PR）

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

## 12.2 第三方 app/skill 开发者清单

- [ ] 声明单一规范 `primary` 产物。
- [ ] 为存在性、大小和领域约束定义验证器。
- [ ] 只使用稳定生命周期/任务 API 字段。
- [ ] 当 `HARNESS_EVENT_SINK` 可用时，通过它发出结构化进度。
- [ ] stderr 用于诊断，不用于契约状态。
- [ ] 确保 hooks 幂等（尤其是 `before_spawn_verify`）。
- [ ] 为你的工作流测试重载/会话切换行为。
- [ ] 如果工作流会 spawn 子 agent，声明其摘要格式、产物归属和取消/恢复语义。
- [ ] 验证失败路径会产生操作员可读证据。

## 12.3 事故响应清单（状态漂移 / 污染类）

- [ ] 对比 `/api/sessions/:id/tasks` 快照和 UI 气泡/页头。
- [ ] 检查 SSE 流是否缺失或存在越界 `task_status` 事件。
- [ ] 确认回放和实时事件上的 session/topic 标签。
- [ ] 检查最终快照中是否有重复 deep-research/run_pipeline 任务。
- [ ] 验证阶段顺序单调性和进度范围。
- [ ] 修补前捕获诊断 JSON 和 curl 提示。
- [ ] 修复后重新运行小型 fleet 门禁；不要接受仅本地验证。

## 12.4 匿名失败链的逐层落地检查

如果你正在修第 11.1 节那类“看似完成、实际交错文件”的事故，可以直接按下面这条链检查，不要一上来就改 prompt。

- [ ] `session`：root task 是否显式声明 primary artifact、child task、owner、role 和 worktree。
- [ ] `session`：artifact 报告是否带 task id / session id，而不是只有自由文本路径。
- [ ] `capability plane`：Python / Node / shell / MCP 调用是否都通过统一事件入口回传状态与产物。
- [ ] `capability plane`：外部能力是否把引用、下载物、临时文件写进了声明过的 scope，而不是写进任意目录。
- [ ] `verifier`：是否同时验证“文件存在”“文件归属正确”“内容足够新”“关键业务约束达标”。
- [ ] `verifier`：失败时是否留下了 validator 名称、失败类别、证据路径和持续时间。
- [ ] `operator dashboard`：是否能直接看到 root / child task 关系、最近 summary、最近 artifact、最近 validator 结果。
- [ ] `operator dashboard`：是否存在只在 dashboard 里出现、却无法回指事实流的影子状态。
- [ ] `swarm`：coordinator 是否只做拆解与裁决，而不是自己悄悄替 child task 兜底宣布成功。
- [ ] `swarm`：child agent 的 summary 是否包含可验证产物引用，而不是一句模糊的 “done”。

这组检查项的目的，是把“问题出在 session、能力平面、validator、dashboard 还是 swarm”快速切开。只要团队还在把这五层混成一个“agent 没做好”，修复成本就会始终过高。

---
