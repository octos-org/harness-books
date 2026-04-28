# 10. 工作流到里程碑映射：务实路线图

如果第 4 到第 9 章回答的是“目标架构应该是什么”，第 10 章回答的就是“工程上先做什么、后做什么”。路线图的作用不是展示 backlog，而是把第 2.7 节那九个架构维度按依赖关系排成实施顺序。

更直接地说：先修真相，再修体验；先把事实流、生命周期和验证守住，再开放生态、丰富协作、提升运营面。

## R1 — 事实流：先建立唯一运行时真相

- 把 task、turn、tool result、artifact、validator result 写成 append-only 事实流。
- 明确 session / thread / transcript 的持久格式和恢复入口。
- 所有 UI、API、dashboard、replay 都只能投影这条事实流，不能各自发明状态。

## R2 — 生命周期：把任务状态变成单调阶梯

- 类型化 `harness.event.v1` 与 `task_status` 桥接。
- 生命周期至少覆盖 `queued`、`running`、`verifying`、`ready`、`failed`。
- deep-search / run_pipeline / background task 从 stderr 状态迁移到结构化事件。

## R3 — 能力平面：统一工具、MCP、脚本和人工输入

- 为 shell、Python、Node、MCP、browser、external API 提供统一事件入口。
- 支持非 Rust / 非主语言事件发射器，例如 `HARNESS_EVENT_SINK`。
- 工具调用必须带 session、scope、权限和审计信息。

## R4 — 产物与验证：完成状态必须由证据裁决

- manifest / policy / task 字段声明 primary artifact。
- 类型化验证器返回结果、失败类别、证据路径和耗时。
- `ready` / `failed` 只由 validator + evidence 裁决，不由生成器自报。

## R5 — 回放：让实时流和历史流共享对象模型

- API、SSE、历史回放和刷新恢复使用同一事实模型。
- 回放测试覆盖浏览器重载、重新连接、会话切换和部分 stream 中断。
- 小型 fleet 门禁验证线上 worker 的真实回放路径。

## R6 — 隔离与恢复：把 worktree / resume / background 做成一等能力

- root task、child task、worktree、owner、scope 显式绑定。
- resume 能恢复 transcript、未完成 tool use、artifact 引用和工作目录。
- background task 与 disk output 进入事实流，而不是只写本地日志。

## R7 — 协作：让 sub-agent / swarm 有角色、通信和终态裁决

- coordinator、worker、verifier、summarizer 的角色和权限分开。
- 子 agent 只返回 summary、evidence、diff、artifact reference，不污染父上下文。
- 只有 coordinator + verifier 可以宣布 root task ready / failed。

## R8 — 知识分层：把经验从 wiki 晋升到 skill / docs / AGENTS.md / gate

- `AGENTS.md` 保持短目录，细节下沉到 docs 与 skills。
- 重复事故进入 wiki，稳定经验晋升为 skill、validator、fixture 或 CI gate。
- 过时经验必须 demotion / deletion，避免知识层变成长期噪声源。

## R9 — 操作员面：把 dashboard、门禁、回滚和复盘接到同一事实流

- dashboard 展示 lifecycle、artifact、validator、child task、scope 和最近 summary。
- 门禁与发布声明绑定证据，不接受轶事式成功。
- 每次事故都沉淀为失败模式条目、复盘模板和可回放 fixture。

这条路线图按依赖排序，而不是按 backlog 美观排序。R1 到 R2 先建立事实和生命周期；R3 到 R4 让外部能力和完成裁决进入协议；R5 到 R7 解决回放、恢复和多 agent 协作；R8 到 R9 再把组织知识和操作员控制面接进来。顺序反过来，平台会在还没有稳定事实流时就开放外部复杂度，后续每一步都会更贵。

这条路线也不是凭空想象出来的。Claude Code 已经把 compaction、resume、worktree、sub-agent 摘要、外置 output、权限和扩展机制做进产品里；*Dive into Claude Code* 则把它们整理成五层系统结构；Codex 已经把 `thread-store`、`rollout`、`app-server`、tool registry 这些“骨架能力”做成显式模块。路线图真正要做的，不是复制某个仓库，而是把这些成熟样本已经证明必要的部件，按依赖顺序转译成自己的系统实现。

---
