# 16. Appendix B: harness self-audit matrix

Use the matrix below to score a team or product. Mark each row as `❌`, `⚠️`, or `✅`.

## 16.1 Session pillar

| # | Check |
|---|---|
| S1 | Session data is stored separately from chat history. |
| S2 | The session log is append-only. |
| S3 | A session can be resumed from an ID. |
| S4 | The event stream is human-readable and diffable. |
| S5 | A new teammate can reconstruct the work from the session artifacts. |

## 16.2 Harness pillar

| # | Check |
|---|---|
| H1 | Harness state lives outside the harness process. |
| H2 | The harness interface is small and stable. |
| H3 | Loop variants can change without rewriting the session model. |
| H4 | Model upgrades do not force broad harness rewrites. |
| H5 | Each harness change is clearly either defect repair or protocol enforcement. |

## 16.3 Tools pillar

| # | Check |
|---|---|
| T1 | Tool responsibilities are orthogonal. |
| T2 | Calls and results are recorded to the session log. |
| T3 | Invalid calls can be rolled back or corrected. |
| T4 | Credentials stay out of the sandbox. |
| T5 | Combinations of valid tools cannot silently escape policy. |

## 16.4 Verification pillar

| # | Check |
|---|---|
| V1 | Generator and evaluator are distinct. |
| V2 | Specs flow into property tests automatically or semi-automatically. |
| V3 | Every verdict is persisted in an audit trail. |
| V4 | Linting resists self-serving or sycophantic outputs. |
| V5 | External evidence can justify correctness without trusting the verifier's own output. |

## 16.5 Scoring

- 16+ `✅`: L4, strong maturity
- 12-15 `✅`: L3, independent verification layer exists
- 8-11 `✅`: L2, session protocol is real but incomplete
- 4-7 `✅`: L1, session exists but protocol is weak
- below 4 `✅`: L0, still prompt-centric

---

### Expanded Source Material


#### From `appendix-b-self-audit-matrix.md`: 附录 B · Harness 四柱自查矩阵

_Source role: full four-pillar self-audit matrix._


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
