# 16. 附录 B：Harness 自查矩阵

使用下面的矩阵为团队或产品打分。每一行标记为 `❌`、`⚠️` 或 `✅`。

## 16.1 Session 支柱

| # | 检查项 |
|---|---|
| S1 | Session 数据与聊天历史分开存储。 |
| S2 | Session 日志只追加。 |
| S3 | Session 可以通过 ID 恢复。 |
| S4 | 事件流对人可读且可比较差异。 |
| S5 | 新队友可以从 session 产物重建工作过程。 |

## 16.2 Harness 支柱

| # | 检查项 |
|---|---|
| H1 | Harness 状态存在于 harness 进程之外。 |
| H2 | Harness 接口小而稳定。 |
| H3 | 循环变体可以变化，而不用重写 session 模型。 |
| H4 | 模型升级不会迫使大范围 harness 重写。 |
| H5 | 每个 harness 变更都明确属于缺陷修复或协议执行。 |

## 16.3 Tools 支柱

| # | 检查项 |
|---|---|
| T1 | 工具职责是正交的。 |
| T2 | 调用和结果记录到 session 日志。 |
| T3 | 无效调用可以回滚或纠正。 |
| T4 | 凭据不进入沙箱。 |
| T5 | 有效工具组合不能静默逃逸策略。 |

## 16.4 Verification 支柱

| # | 检查项 |
|---|---|
| V1 | 生成器和评估器是分离的。 |
| V2 | 规格自动或半自动流入性质测试。 |
| V3 | 每个裁决都持久化到审计轨迹。 |
| V4 | Linting 能抵抗自利或迎合式输出。 |
| V5 | 外部证据可以证明正确性，而不必信任验证器自己的输出。 |

## 16.5 评分

- 16+ 个 `✅`：L4，强成熟度
- 12-15 个 `✅`：L3，已有独立验证层
- 8-11 个 `✅`：L2，session 协议真实存在但不完整
- 4-7 个 `✅`：L1，session 存在但协议较弱
- 低于 4 个 `✅`：L0，仍然以 prompt 为中心

---

### 扩展源材料


#### 来自 `appendix-b-self-audit-matrix.md`：附录 B · Harness 四柱自查矩阵

_源材料角色：完整四支柱自查矩阵。_


#### 附录 B · Harness 四柱自查矩阵

以下 20 行自查题,每根柱子 5 行,共 4 柱。每一行选一个答案:**❌ 没做 / ⚠️ 部分做了 / ✅ 做到位了**。

累计 ≥ 16 个 ✅ → L4,Harness Maturity 最高档。
累计 12-15 个 ✅ → L3,已有独立验证层。
累计 8-11 个 ✅ → L2,session 协议成型。
累计 4-7 个 ✅ → L1,有 session 但缺协议。
累计 < 4 个 ✅ → L0,仍停留在 prompt 层。

---

##### B.1 · Session 柱(5 行)

| # | 自查 | 你的答案 |
|---|---|---|
| S1 | 你的 session 有独立的文件/存储吗?(不是对话历史,不是 vector DB) | |
| S2 | Session 是 append-only 的吗?不会被 summarization 覆盖? | |
| S3 | 给一个 session ID,能不能 `wake(id)` 从任一 event 恢复? | |
| S4 | Session 的事件流对人类可读?可以 grep / diff? | |
| S5 | 新员工能否从 session.md + session.jsonl 独立理解一次调研的整个过程? | |

##### B.2 · Harness 柱(5 行)

| # | 自查 | 你的答案 |
|---|---|---|
| H1 | 你的 harness 是无状态的吗?状态在 session 不在 harness? | |
| H2 | Harness 的接口只有 getEvents / emitEvent / execute 三类吗? | |
| H3 | Agent loop 的变体(ReAct / Plan-Execute 等)可以换,**不需要改 session 或 tools**? | |
| H4 | 模型升级后,你的 harness 有多少行代码需要改? | |
| H5 | 你写 harness 的每一行时,能明确区分"补模型缺陷"还是"守协议"吗? | |

##### B.3 · Tools 柱(5 行)

| # | 自查 | 你的答案 |
|---|---|---|
| T1 | 每个工具的职责是**正交**的吗? | |
| T2 | 每次 tool call 的参数 + 结果都记录到 session.jsonl? | |
| T3 | 错误的 tool call 能 rollback? | |
| T4 | Credentials 不进 sandbox,通过 proxy + vault 解耦? | |
| T5 | 有机制检测"多个合法工具组合产生的 escape"? | |

##### B.4 · Verification 柱(5 行)

| # | 自查 | 你的答案 |
|---|---|---|
| V1 | 你的 generator 和 evaluator 是**不同**的 agent 实例吗?(Ch 7) | |
| V2 | Spec → property tests 的转换是自动的吗?(Ch 2 §2.3, Ch 7 §7.4) | |
| V3 | 每个 verdict(pass/fail)都进 audit trail?(Ch 7 §7.4) | |
| V4 | 有 sycophancy-aware lint 防止"AI 自我奉承"?(Ch 7 §7.5, Ch 11 §11.3) | |
| V5 | 当监管者问"你怎么知道这是对的",你能拿出**不是被验系统自己生成的**证据?(Ch 7 §7.3) | |

---

##### 如何使用这份矩阵

1. 团队一起填表,每人独立先填一遍
2. 对比答案差异 —— 差异本身就是重要信号(团队对 harness 没有共识)
3. 每季度重填一次,观察 ✅ 数的演化
4. ✅ 数不增长 > 两季度 = 驾驭工程进度停滞,需要专门 review

---

*本矩阵可以用 ascent-research CLI 保存为长期 schema:*

```bash
ascent-research schema edit <slug>
# 把本矩阵粘贴到 schema,每次 loop 都让 agent 对齐这 20 行
```
