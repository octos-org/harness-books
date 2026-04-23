# 18. Appendix D: role-based reading paths

If you are reading this as a team artifact, use the shortest path that matches your job.

| Role | Read first | Then read |
|---|---|---|
| Engineering lead | 1, 2, 3 | 5, 10, 11, 13 |
| Agent product builder | 1, 2, 6 | 7, 8, 9, 12 |
| Architect | 1, 4, 7 | 12, 13, 14 |
| CTO or operator | Preface, 1, 9 | 13, 14, 19 |
| Researcher | 1, 3, 4 | 9, 10, 11, 12, 15 |

---

### Expanded Source Material


#### From `appendix-d-reading-guide.md`: 附录 D · 按角色导读

_Source role: full role-based reading guide._


#### 附录 D · 按角色导读

本书支持**五条不同的阅读路径**。每条 4–7 章,耗时 3–6 小时,对应一种典型读者的关注点。

**先读 Ch 1(两种驾驭工程)**—— 它帮你判断自己属于 Layer 1(AI Coding 过程)、Layer 2(AI Agent 自身)、还是两层都在。任何路径都从 Ch 1 开始。

---

##### D.1 · Layer 1 工程师路径(实战:用 AI 写代码)

**你是谁**:工程团队 lead,团队用 Codex / Claude Code / Cursor 写自己的 SaaS 产品;你们的产品本身**不是** agent。
**你关心**:怎么让 AI 写的代码合规上线、怎么让 1M LOC / 0% human review 式的极端点真正对你们可行。
**推荐顺序**:

1. Ch 1 · 两种驾驭工程 —— 先定位自己
2. Ch 2 · 从 Prompt 到 Harness —— 共享坐标系
3. Ch 3 · 面向意图的工程学 —— 第一性原理
4. **Ch 5 · AI 生成代码的工程谱系 —— 你的主场**
5. Ch 10 · 两种协作循环 —— 长程循环怎么在 Coding 过程里跑
6. Ch 11 · 知识沉淀与 Skills 晋升 —— AGENTS.md + 团队 skill 治理
7. Ch 13 · 失败模式博物馆与反脆弱四支柱 —— 出事时归柱诊断 + 反脆弱判断

**略读**:Part B(Ch 6–9,Layer 2 四柱)、Ch 12(reflexive)、Ch 14(终局)可作背景快速浏览。

**耗时**:约 4 小时。

---

##### D.2 · Layer 2 Agent 团队路径(实战:做 agent 产品)

**你是谁**:agent 产品工程师;你们卖的就是 agent 本身。
**你关心**:session 怎么搭、harness 怎么做 cattle 不做 pet、tool 怎么正交、verification 怎么独立。
**推荐顺序**:

1. Ch 1 · 两种驾驭工程 —— 确认自己在 L2
2. Ch 2 · 从 Prompt 到 Harness
3. Ch 3 · 面向意图的工程学
4. **Ch 6 · Session 柱 —— 最先动手**
5. **Ch 7 · Harness 柱 —— pet vs cattle**
6. **Ch 8 · Tools 柱 —— 可问责词汇表**
7. **Ch 9 · Verification 柱 —— 反脆弱核心**
8. Ch 13 · 失败模式博物馆 —— 出事时首先翻

**略读**:Ch 5(Layer 1 专场,可作背景);Ch 4、Ch 11、Ch 12、Ch 14 可按兴趣选读。

**耗时**:约 6 小时。

---

##### D.3 · 架构师 / 技术选型路径

**你是谁**:要在未来三年做架构选型,不想被某一家锁死。
**你关心**:什么是稳定的、什么会过时、协议层和应用层的分界在哪。
**推荐顺序**:

1. Ch 1 · 两种驾驭工程
2. Ch 4 · The Oldest New Idea —— 稳定抽象的历史规律
3. Ch 6 · Session 柱(Layer 2 团队必读;Layer 1 快速过)
4. Ch 7 · Harness 柱 —— 无状态接口的判断
5. Ch 12 · 可自我修改的 Harness —— 三档边界
6. Ch 13 · 失败模式博物馆与反脆弱四支柱 —— 核心选型工具
7. Ch 14 · Many Brains, Many Hands —— 终局愿景与协议层押注
8. 附录 A · 十篇奠基文精读 —— 自己再判断

**略读**:Ch 2、Ch 3 如果已熟悉 prompt/context 讨论可快速过。

**耗时**:约 5 小时。

---

##### D.4 · CTO / 决策者路径

**你是谁**:签字的那个人;对合规、反脆弱、商业锚点敏感。
**你关心**:这是稳的生意吗?会不会被 GPT-N 颠覆?监管会不会成为护城河?
**推荐顺序**:

1. 楔子 · 十年前的 Big Data,今天的驾驭工程
2. Ch 1 · 两种驾驭工程 —— 团队到底在哪层
3. Ch 3 · 面向意图的工程学 —— 为什么意图而非代码
4. Ch 9 · Verification 的独立性 —— 反脆弱核心
5. Ch 13 · 失败模式博物馆与反脆弱四支柱 —— 五问压力测试
6. Ch 14 · Many Brains, Many Hands —— 协议层押注
7. 结语 · Ariely 的影子 —— 可以对团队提的问题
8. 附录 B · 自查矩阵 —— 每季度让团队填

**略读**:Part B 四柱细节可由工程主管代读。

**耗时**:约 4 小时。

---

##### D.5 · 研究者路径(思辨)

**你是谁**:研究 agent systems、想问"为什么这样而不那样"的人。
**你关心**:边界在哪、反例是什么、下一步是什么。
**推荐顺序**:

1. Ch 1 · 两种驾驭工程 —— 研究对象分层
2. Ch 3 · 面向意图的工程学 —— 方法论第一性
3. Ch 4 · The Oldest New Idea
4. Ch 9 · Verification 的独立性 —— P vs NP / Gödel / Rice / Löb
5. Ch 10 · 两种协作循环
6. Ch 11 · 知识沉淀与 Skills 晋升
7. Ch 12 · 可自我修改的 Harness —— 研究热点(Stanford Meta-Harness + 三档边界)
8. Ch 14 · Many Brains, Many Hands —— 三个治理开放问题
9. 附录 A · 十篇奠基文精读 —— 每条"值得追问"都是研究题

**加餐**:每一章的"可观察信号"与"本章奠基文对齐"里有十余个未来研究方向;建议建一个 `ascent-research` session 跟踪它们。

**耗时**:约 6 小时。

---

##### D.6 · 全书线性路径

时间足够,按 Ch 1 → Ch 14 顺读,这是**默认路径**。估计阅读 + 做笔记 10–12 小时。全书论证承接关系:

```
楔子 (问题意识)
  ↓
Part 0 · Ch 1-4 (两层分界 + 共享坐标)
  ↓
Part A · Ch 5 (Layer 1 专章)
  ↓
Part B · Ch 6-9 (Layer 2 四柱)
  ↓
Part C · Ch 10-12 (跨时间)
  ↓
Part D · Ch 13-14 (落地 + 终局)
  ↓
结语 (回到 Ariely)
```

**每一部分都可以独立阅读**。第一次通读建议按顺序;之后随时回翻具体章节作为参考。
