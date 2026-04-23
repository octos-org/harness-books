# 14. 结语：下一阶段的工程姿态

把 harness 工作当作产品可靠性工程，而不是抽象框架建设。

Octos 的胜利模式一直是：

1. 识别具体用户可见失败类别
2. 编码显式契约不变量
3. 把运行时/UI/操作员表面绑定到同一个事实模型
4. 合并前在小型 fleet live gates 上证明
5. 之后再扩展抽象和外部平台表面

这就是从“今天看起来很聪明”走向“每天都能正确交付”的路径。

---

### 扩展源材料


#### 来自 `99-epilogue.md`：结语 · Ariely 的影子,十年后再看一次

_源材料角色：大书收束论证。_


#### 结语 · Ariely 的影子,十年后再看一次

2013 年 Dan Ariely 的那句:

> *"Big data is like teenage sex: everyone talks about it, nobody really knows how to do it, everyone thinks everyone else is doing it, so everyone claims they are doing it."*

十三年过去。你合上这本书的时候,应该能准确回答:**什么才算"真正在做"驾驭工程?**

##### 一张合书前的自查图

| 柱 | 能具体说出 → 你**在做** | 还在模糊 → 你**在谈** |
|---|---|---|
| **Session** | append-only jsonl,不是 context window 镜像,可 `wake(id)` 从任一 event 恢复 | "对话历史都存 DB 了" |
| **Harness** | 无状态,接口只有 `getEvents / emitEvent / execute`,agent loop 可替换 | "我们用了 LangChain" |
| **Tools** | 词汇表正交 / 可问责 / 与权限绑定,credentials 不进 sandbox | "我们给 agent 开了 API" |
| **Verification** | 结构上独立于生成,spec → property test → audit trail 完整 | "我们跑了一些 eval" |

左列能全部具体说出 → 你在做驾驭工程。
只说得出右列 → 你**在说**驾驭工程。

两者之间的距离,就是这本书的价值。

##### 一个简单的预言

五年后回头看这本书,你会发现:

- **具体工具都变了** —— Claude 可能到了第 X 代,LangChain 可能归档,ascent-research 可能被上游吸收
- **四根稳定支柱没变** —— session / harness / tools / verification 依然是同一结构
- **反脆弱四支柱更显眼** —— Verification / Intent / Accountability / Objective 从"本书主张" 变成"监管硬要求"
- **Ariely 的俏皮话仍然有效** —— 永远有新的"大家都在谈" 的词,永远有少数人真的在做

这不是悲观,是**结构性**。

##### 一句合书的话

本书的 14 章,试图说服你一件事:

> **在 AI 越来越强的时代,工程师的价值不在"让 AI 更强",而在"帮人在 AI 面前做出可问责的判断"。**

这件事,从飞机自动驾驶出现那一天起就是这样。模型再强,也不会让它变。

---

**合上书的时候,你会打开 Claude Code 或 Codex,启动一个新 session。**

**那一刻,是你第一次 —— 不再"谈"驾驭工程,而是开始"做"它。**
