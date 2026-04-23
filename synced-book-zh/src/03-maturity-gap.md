# 2. 成熟度鸿沟：灵光一闪 vs 工厂化输出

上一章回答的是“为什么必须有 harness”；这一章回答的是“成熟系统究竟在建设什么，才能从 demo 式聪明跨到工厂化输出”。这里会按重要性看四类样本：Claude Code 作为主分析对象，Codex 作为公开的开源结构样本，OpenClaw/Hermes 作为更广义 agent product 对照，而 OpenAI 1M LOC 案例则提供组织生产层的极端样本。Octos 不在这一章里做主角，它在下一章只作为失败样本出现。

“灵光一闪的天才”模式有这些特征：

- 成功依赖 prompt，且不可重复
- 状态来自聊天文本，而不是持久运行时状态
- 产物靠文件名或启发式猜测
- 长任务可以静默失败，却看起来像“完成”
- 会话切换导致状态串扰和 UI 混乱

软件工厂模式具有相反特征：

- 由契约定义输出和验证器
- 生命周期持久化且单调（`queued -> running -> verifying -> ready|failed`）
- 进度是事件化、类型化、可回放、有作用域的
- UI 是后端事实的投影，而不是独立事实
- 每次事故都有操作员级证据

Harness 就是这两种模式之间的转换机制。

## 2.1 Claude Code：harness 已经产品化

如果只看表面，Claude Code 像一个终端里的模型壳；但看源码，它更像一套为长运行 coding agent 准备的控制系统。2026-04-23 对本地源码镜像的审读里，光会话持久化 `sessionStorage.ts` 就约 5105 行，全量 compaction `compact.ts` 约 1705 行，worktree 管理 `worktree.ts` 约 1519 行，另有 `StreamingToolExecutor.ts`、`microCompact.ts`、`apiMicrocompact.ts`、`diskOutput.ts`、`agentSummary.ts`、`resumeAgent.ts` 等专门模块。这里最值得学的不是文件大，而是 Anthropic 把“长任务会坏在哪里”拆成了独立子系统。[^claudecode-ch2]

这套拆分至少说明了六件事。第一，tool execution 不是简单的“来一个就跑一个”；`StreamingToolExecutor` 明确区分 concurrency-safe 与 exclusive tool，把并发安全变成调度器的职责。第二，长上下文管理不是只有一次“大压缩”；Claude Code 事实上做了三层 compaction：`microCompact` 清理旧 tool result，`apiMicrocompact` 利用 provider 原生 context management，`compact.ts` 再做全量摘要并在压缩后补回最近文件与 skills。第三，session resume 不是简单地把 JSONL 重新读回来；恢复逻辑会过滤 unresolved tool uses、清理 orphaned thinking，并恢复 file history、context collapse snapshot 与 worktree 状态。第四，sub-agent 不是 fire-and-forget；每个子 agent 都可以有独立 disk-backed output、滚动摘要、后台恢复和继续发送消息。第五，worktree 不是方便功能，而是隔离副作用和保证恢复语义的一部分。第六，文件读取缓存、prompt cache、tool result 存储和任务输出文件，共同组成了长任务的外部工作记忆。

Claude Code 真正证明的不是“模型够强就能写很多代码”，而是 coding agent 一旦进入多分钟、多子任务、可恢复、可继续派工的场景，就必须把并发、上下文、产物输出和子 agent 生命周期做成一等公民。否则所谓“长任务”只是把一次短聊天拖得更长。[^claudecode-ch2]

## 2.2 Codex：把 harness 边界显式模块化

相较之下，Codex 的公开仓库暴露的是另一种成熟度。它没有把 Claude Code 那样多的产品内脏完整摊开，但它把 harness 的边界切得更显式：仓库里单独存在 `codex-rs/exec-server`、`hooks`、`tools`、`rollout`、`mcp-server`、`process-hardening` 等模块，文档里把 `AGENTS.md`、sandbox、approvals 单独立项，`AGENTS.md` 还明确要求控制 crate 边界、最小化 `codex-core` 膨胀，以及通过专门的 MCP connection manager 管理工具调用。[^codex-oss-ch2]

这说明 Codex 的代表性不在于“已经把所有长会话产品细节都做完”，而在于它把 harness 先拆成一组可维护、可组合、可审计的运行时原语：执行、审批、MCP、rollout、sandbox、文档注入。Claude Code 更像一个重产品化的长任务 coding agent；Codex 更像一个把运行边界讲清楚的开源内核。两者不是谁替代谁，而是从不同方向证明 harness 已经是主体，而不是附属。[^codex-oss-ch2]

## 2.3 OpenClaw 与 Hermes：更广义 agent product 也在重复同一规律

OpenClaw 和 Hermes 不以 coding agent 为中心，但恰好证明 harness 不是 coding-only 现象。OpenClaw 把 Gateway 明确称为 control plane，核心围绕 sessions、channels、skills、routing、web surfaces 和安全边界展开；Hermes 则把 gateway、SQLite session store、FTS5 memory、skills、delegate tool、cron、MCP 与多种 terminal backend 放到同一运行面。二者共同点都不是“提示词写得更会”，而是把 session、memory、skills、gateway、cron、sub-agent 当作系统事实。[^openclaw-hermes-ch2]

对本书而言，OpenClaw 和 Hermes 只需要简单分析，因为它们不是最贴近“AI 软件工厂”的主样本；但它们非常有价值，因为它们说明一旦 agent 要跨渠道、跨时段、跨环境连续行动，control plane 一定会长出来。也就是说，harness 不是 coding agent 的偶然补丁，而是 agent product 普遍会演化出来的外层系统。[^openclaw-hermes-ch2]

## 2.4 OpenAI 1M LOC 案例真正说明了什么

相比 Claude Code 和 Codex 主要展示产品或仓库层面的运行时结构，OpenAI 的 1M LOC 案例展示的是组织生产层发生了什么变化：从 2025 年 8 月第一次提交到 2026 年 2 月，约五个月时间，三位工程师驱动 Codex 产出约 1M LOC、1500+ 个已合并 PR，平均每位工程师每天 3.5 个 PR，并宣称人类不直接写应用代码。[^openai-factory-ch2] 这个故事的重点不是“模型终于可以替代工程师”，而是工程师的工作对象上移了。

他们不再把主要时间花在逐行写业务代码，而是在设计让 agent 能持续产出正确代码的条件：

- 可复现开发环境，让 agent 看到的失败信号稳定可信。
- CI 强制架构约束，把“不要跨层依赖”这类口头纪律变成机器会挡的墙。
- 快速、密闭、agent 可运行的测试基础设施，让反馈能进入内循环。
- 精心设计的失败反馈，把堆栈追踪、diff、截图和裁剪后的日志变成 agent 能收敛的信号。
- `AGENTS.md` 作为目录，`docs/` 作为系统记录，避免把几十 KB 文档硬塞进每次上下文。

这五件事合在一起，才是“工厂化输出”的骨架。没有这些条件，1M LOC 只会变成 1M 行没人敢合的文本。

## 2.5 AGENTS.md 应该是目录，不是百科全书

原书对 `AGENTS.md` 的处理很值得直接采用：它应该短、稳定、可常驻上下文，只放仓库定位、工具链版本、工作区拓扑、高频红线和指向 `docs/` 的目录。真正细节放在 `docs/` 里，按任务需要加载。Codex 的公开文档也明确把 `AGENTS.md` 当成一个单独的能力层，而不是把所有知识都塞进系统提示。[^agents-catalog-ch2]

反模式是把全部风格指南、API 手册、架构文档、on-call 流程塞进一个大 prompt。这样不仅浪费 token，更严重的是教会 agent 一种错误的上下文哲学：以为“上下文 = 曾经写下的全集”，而不是“上下文 = 当前任务需要的切片”。

## 2.6 “0% 人工审查”的边界

OpenAI 的极端案例不能直接搬到所有场景。内部工具链、非合规关键路径、风险自吸收时，可以把大量人工审查下沉到 CI、性质测试、结构化验证和指标门禁。医疗、金融、隐私、客户数据路径则不同：实名人工 reviewer、审计记录、变更控制和合规签字是事实要求，不是工程偏好。[^review-boundary-ch2]

因此大多数团队的目标都不该是追求“没有人看”，而是把人类从重复、低信号的逐行审查中解放出来，转向审查契约、门禁、失败分类和高风险边界。

下一章不再继续看成熟样本，而改用 Octos 这个失败样本来回答另一个问题：当这些机制缺位时，系统具体会怎么坏。

[^claudecode-ch2]: 本章在此处根据 2026-04-23 对 Claude Code 本地源码镜像的结构审读，使用其 `StreamingToolExecutor.ts`、`services/compact/*`、`utils/sessionStorage.ts`、`utils/fileStateCache.ts`、`utils/task/diskOutput.ts`、`services/AgentSummary/agentSummary.ts`、`tools/AgentTool/resumeAgent.ts` 与 `utils/worktree.ts` 所体现的并发控制、分层 compaction、resume、disk output、sub-agent summary 和 worktree 机制；对应第 19 章参考文献 24。
[^codex-oss-ch2]: OpenAI, *codex* 开源仓库。 本章在此处使用其 README、`AGENTS.md` 与 `docs/` 中关于 sandbox、approvals、MCP、rollout 与 `AGENTS.md` 的公开结构；对应第 19 章参考文献 21。
[^openclaw-hermes-ch2]: 本章在此处综合 OpenClaw README 中关于 Gateway control plane、sessions、channels、skills 与 routing 的描述，以及 Hermes README/AGENTS 中关于 gateway、SQLite session store、memory、skills、delegate tool、cron 与 MCP 的结构；对应第 19 章参考文献 22、23。
[^openai-factory-ch2]: OpenAI, *Harness Engineering: Leveraging Codex in an Agent-First World.* 本章在此处使用其关于 1M LOC、1500+ merged PR、三位工程师与低人工写码比例的案例数字；对应第 19 章参考文献 2。
[^agents-catalog-ch2]: 本章在此处综合 Fowler、OpenAI 与 Codex 开源文档关于 `AGENTS.md` 作为短目录、细节下沉到 `docs/` 的做法；对应第 19 章参考文献 1、2、21。
[^review-boundary-ch2]: 本章在此处前半使用 OpenAI 关于极端自动化案例边界的表述；后半关于医疗、金融、隐私与客户数据路径的要求属于本文的工程外推；对应第 19 章参考文献 2。

---
