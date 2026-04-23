# 0. 全书地图与阅读指南

这份单文件书稿是 Octos 驾驭工程的合并版综合稿。它保留既有叙事主线，并把 ZIP 源书的前置说明、阅读指南、附录和参考文献折叠进来，让整个论证可以在一个地方读完。

## 0.1 这本书适合谁

- 需要稳定运行时事实、而不是演示级行为的 Octos 维护者
- 需要进度、产物、验证契约的 app-skill 作者
- 需要不靠聊天文本猜测失败模式的平台操作员

## 0.2 推荐阅读顺序

- 线性路径：按顺序阅读第 1 到第 14 节
- Layer 1 路径：重点读第 1、2、3、5、10、11、13、14 节
- Layer 2 路径：重点读第 1、2、3、6、7、8、9、12、13 节
- 按角色路径：使用文末附录中的负责人、架构师、CTO 和研究者阅读路线

## 0.3 这个合并版新增了什么

- 面向 Octos 读者的紧凑前置说明
- 十篇奠基论文和文章的源文本附录
- 四根 harness 支柱的自查矩阵
- 贯穿全书的核心术语表
- 按角色组织的阅读指南和研究轨迹

核心弧线保持不变：第 1 节提出控制系统视角，第 3 节把 Octos 事故转化为失败类别，第 4 节和第 7 节把这些失败转化为运行时架构，后续章节区分 harness 能解决什么，以及哪些仍然依赖模型质量、治理和操作纪律。

---

### 扩展源材料


#### 来自 `00-how-to-read.md`：本书使用说明

_源材料角色：大书阅读指南。_


#### 本书使用说明

##### 一件要先搞清楚的事:你属于哪一层

这本书横跨两层,第一件事是先定位自己:

- **Layer 1 · AI Coding 过程** —— 你们团队用 AI 写代码,但**交付的产品不是 agent**(是 web、API、SaaS、移动 app 等传统形态)。AI 是幕后工具。
- **Layer 2 · AI Agent 自身** —— 你们的产品就是 agent;用户直接和它交互,合规、运维、长任务可靠性是生死线。
- **两层都在** —— 你们自己用 Codex 写代码(Layer 1),产出物又是一个 agent 产品(Layer 2)。最常见,但最容易把两层的问题混成一锅。

第 1 章会用三问帮你判断。**先读第 1 章,再选读法**。

##### 本书的结构

本书 14 章正文、4 个附录,按两层分工组织:

| 部分 | 章节 | 定位 |
|---|---|---|
| **Part 0 · 定位与共享坐标** | Ch 1–4 | 两层共享的坐标系、第一性原理、历史定位 |
| **Part A · AI Coding 过程的驾驭工程** | Ch 5 | Layer 1 专章 |
| **Part B · AI Agent 自身的 Harness 工程** | Ch 6–9 | Layer 2 的四根稳定支柱(session / harness / tools / verification) |
| **Part C · 跨时间的驾驭** | Ch 10–12 | 两类循环、知识与 skills 治理、reflexive harness |
| **Part D · 落地与未来** | Ch 13–14 | 失败模式博物馆 + 反脆弱四支柱、Many Brains Many Hands 终局 |

##### 方法论承诺

**每一章都对齐三个来源**:

1. **一篇或多篇奠基文** —— 业界公开发表的权威论述(**10 篇**,见附录 A)
2. **一个或多个代码库实证** —— 本书引用的开源项目:`ascent-research` / `agent-spec` / `mempal` / Anthropic Managed Agents SDK / AIOS / Stanford Meta-Harness 等
3. **一条可观察的信号** —— 什么指标可以告诉你"做到位了"还是"没做到"

如果某一章的论点不能同时对齐这三个来源,它就不会被写进这本书。

##### 四种读法

###### 读法一 · 线性(约 10–12 小时)

第 1 章到第 14 章顺着读。初次接触本书最稳妥的读法。

###### 读法二 · Layer 1 快速路径(约 4 小时)

你只做 Layer 1(产品不是 agent)——

Ch 1(定位)→ Ch 2(三把尺)→ Ch 3(面向意图)→ **Ch 5(AI Coding 专章)** → Ch 10(两循环)→ Ch 11(知识与 skills)→ Ch 13(失败模式 + 反脆弱)→ 结语。
**Part B 四柱(Ch 6–9)可作背景略读**。

###### 读法三 · Layer 2 快速路径(约 6 小时)

你只做 Layer 2(产品就是 agent)——

Ch 1 → Ch 2 → Ch 3 → Ch 4 →(Ch 5 作背景略读)→ **Part B 四柱 Ch 6–9 是主场** → Ch 10 → Ch 11 → Ch 12 → Ch 13 → Ch 14 → 结语。

###### 读法四 · 按角色切入

附录 D 为 **工程师、架构师、CTO、研究者** 四种角色各提供一条 4–6 章的阅读路径。

##### 每章的结构

每一章尽可能遵循:

```
# 第 N 章 · 主标题
> 一句话命题(本章核心论断)

## 开场场景(anecdote / 具体动作)
## 论证主干(若干小节,嵌套奠基文与案例)
## 可观察信号(本章论断可被什么现象证伪或确认)
## 本章核心论断(5–7 条要点)
## 本章奠基文对齐 · 本章对应 wiki 页
```

开场不是"命题 + 结构化 outline",是**场景或 anecdote** —— 这本书关心的是工程实践,实践从具体情景开始。

##### 关于 `[[wiki-slug]]` 标记

书中会出现形如 `[[concept-harness]]`、`[[fowler-on-harness]]` 的标记。这些指向本书的**调研知识底库** —— `~/.actionbook/research/harness-engineering/wiki/*.md` 下的结构化笔记页。它们不是章节,是**证据来源与扩展阅读**。想钻下去就打开那些 wiki 页;不想钻就把它们当作"此处有论据" 的指向符。

##### 关于 Ariely 的三次呼应

Dan Ariely 2013 年关于 big data 的那句俏皮话,在全书**只完整出现三次**:楔子(第一次)、第 10 章(mid-book callback)、结语(最后回响)。这是有意的节奏编排,不是重复。

---

**准备好了吗?** 翻到下一页,楔子在等着你。


#### 来自 `SUMMARY.md`：Summary

_源材料角色：原 mdBook 目录，用于可追溯性。_


#### Summary

[扉页 · 副标题与致谢](./00-frontmatter.md)
[本书使用说明](./00-how-to-read.md)

---

[楔子 · 十年前的 Big Data,今天的驾驭工程](./00-prologue.md)

#### 第零部分 · 定位与共享坐标

- [第 1 章 · 两种驾驭工程 —— 先把界划清](./01-two-layers.md)
- [第 2 章 · 从 Prompt 到 Harness —— 一次视角的位移](./02-from-prompt-to-harness.md)
- [第 3 章 · 面向意图的工程学](./03-intent-first-engineering.md)
- [第 4 章 · The Oldest New Idea —— 稳定抽象的历史](./04-oldest-new-idea.md)

#### 第一部分 · AI Coding 过程的驾驭工程

- [第 5 章 · AI 生成代码的工程谱系](./05-ai-coding-harness.md)

#### 第二部分 · AI Agent 自身的 Harness 工程

- [第 6 章 · Session 是可恢复的事实流](./06-session-pillar.md)
- [第 7 章 · Harness 是可替换的调度脑干](./07-harness-pillar.md)
- [第 8 章 · Tools 是可问责的动作词汇表](./08-tools-pillar.md)
- [第 9 章 · Verification 的独立性](./09-verification-pillar.md)

#### 第三部分 · 跨时间的驾驭

- [第 10 章 · 两种协作循环](./10-two-loops.md)
- [第 11 章 · 知识沉淀与 Skills 晋升](./11-knowledge-and-skills.md)
- [第 12 章 · 可自我修改的 Harness](./12-reflexive-harness.md)

#### 第四部分 · 落地与未来

- [第 13 章 · 失败模式博物馆与反脆弱四支柱](./13-failure-and-antifragility.md)
- [第 14 章 · Many Brains, Many Hands](./14-many-brains-many-hands.md)

#### 附录

- [附录 A · 十篇奠基文精读](./appendix-a-foundation-texts.md)
- [附录 B · Harness 四柱自查矩阵](./appendix-b-self-audit-matrix.md)
- [附录 C · 术语对照](./appendix-c-glossary.md)
- [附录 D · 按角色导读](./appendix-d-reading-guide.md)

---

[结语 · Ariely 的影子,十年后再看一次](./99-epilogue.md)
[参考文献](./99-references.md)
