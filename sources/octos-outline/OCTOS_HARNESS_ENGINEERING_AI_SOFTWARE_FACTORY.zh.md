# 驾驭工程：从灵光一闪的天才到稳定输出的 AI 软件工厂

日期：2026-04-22  
读者：Octos 维护者、app-skill 开发者、平台操作员

---

## 前言：为什么需要这本书

Octos 已经证明了一个硬事实：强模型加提示词技巧，可以在演示里显得很聪明；但一旦进入真实流量、长任务、页面重载和多会话并发，就会暴露系统性失败。

这本书记录的是把这种模式推向工厂化姿态的驾驭工程经验：

- 确定性的任务生命周期
- 持久化的契约状态
- 类型化的进度/事件 ABI
- 由验证器把关的完成状态
- 可回放的 UI 事实
- 操作员可见的失败原因

这些经验并不抽象。它们来自 Octos 的真实问题：后台任务进度漂移、`run_pipeline` / `deep-search` 状态不一致、会话污染、产物契约缺口、验证器不完整，以及操作员盲区。本书不断回到这些事故，是因为它们从不同表面展示了同一个模式：瓶颈不是模型，而是控制系统。

目标不是架构洁癖。目标是在模型、网络、插件、浏览器标签页和用户行为都很混乱的情况下，仍然能得到可靠结果。

---

## 0. 全书地图与阅读指南

这份单文件书稿是 Octos 驾驭工程的合并版综合稿。它保留既有叙事主线，并把 ZIP 源书的前置说明、阅读指南、附录和参考文献折叠进来，让整个论证可以在一个地方读完。

### 0.1 这本书适合谁

- 需要稳定运行时事实、而不是演示级行为的 Octos 维护者
- 需要进度、产物、验证契约的 app-skill 作者
- 需要不靠聊天文本猜测失败模式的平台操作员

### 0.2 推荐阅读顺序

- 线性路径：按顺序阅读第 1 到第 14 节
- Layer 1 路径：重点读第 1、2、3、5、10、11、13、14 节
- Layer 2 路径：重点读第 1、2、3、6、7、8、9、12、13 节
- 按角色路径：使用文末附录中的负责人、架构师、CTO 和研究者阅读路线

### 0.3 这个合并版新增了什么

- 面向 Octos 读者的紧凑前置说明
- 十篇奠基论文和文章的源文本附录
- 四根 harness 支柱的自查矩阵
- 贯穿全书的核心术语表
- 按角色组织的阅读指南和研究轨迹

核心弧线保持不变：第 1 节提出控制系统视角，第 3 节把 Octos 事故转化为失败类别，第 4 节和第 7 节把这些失败转化为运行时架构，后续章节区分 harness 能解决什么，以及哪些仍然依赖模型质量、治理和操作纪律。

---

## 1. LLM 的工作区间：为什么控制系统必不可少

核心工程目标不是“孤立地让模型更聪明”。  
真正的实践目标，是让 LLM 在尽可能长的任务周期里停留在它最擅长的上下文和工作区间内。

有两个类比很有用：

- CPU 缓存/RAM 局部性：工作集保持局部且一致时，吞吐是可预测的；一旦局部性丢失，性能会坍塌，方差会升高。
- 半导体放大器的线性区：在线性区里，输出能以可接受的失真跟随输入；离开这个区间后，削顶和饱和会让输出失控。

LLM 在实践中也呈现类似行为。它存在一个可用的确定性/高质量区间，其中：

- 任务约束明确且足够新
- 工具接口没有歧义
- 反馈回路短且可验证
- 跨轮次的状态迁移保持一致

离开这个区间后，质量会变得不稳定：

- 幻觉状态和陈旧假设增加
- 工具调用质量漂移
- 长周期一致性断裂
- 自信语言和真实正确性分离

### 1.1 自主系统中的控制栈演化

Octos 的工程实践演化出一组外层控制，用来让长任务尽量留在这个质量区间内：

```text
Prompt engineering
  -> 改善局部单轮行为
Context engineering
  -> 稳定多轮行为（AGENTS.md、skills、memory、policy context）
Harness engineering
  -> 用持久运行时契约稳定长周期自治行为
```

单靠 prompt engineering 无法提供持久的状态事实。  
Context engineering 能改善这一点，但仍依赖概率性的遵守。  
Harness engineering 增加运行时级别的护栏和证据，使系统可以从模型漂移中恢复，而不是假装漂移不存在。

### 1.2 Context engineering 是 harness 前置纪律

在 harness 成熟之前，上下文工程承担大部分控制重量：

- `AGENTS.md` 和角色指令约束规划风格
- skills 编码可复用的领域流程
- memory 记录用户/项目事实，减少重复漂移
- 有边界的工具策略减少不安全探索

这一层是必要的，但对长任务、并发和后台工作并不充分。

### 1.3 Harness engineering 是外层确定性循环

Harness 在概率模型输出外增加确定性控制循环：

- 可恢复、可追踪的工作区状态
- 工具调用生命周期 hook 和事件 sink，用于可观测性
- 终态成功前的输出验证/确认
- 持久任务生命周期和回放语义
- 面向修复和操作员行动的显式失败类别

Harness 不替代模型智能。它约束模型智能。

### 1.4 让系统保持在区间内的关键机制

1. 可恢复、可追踪的工作区契约
2. 工具调用事件 hook（`before_*`、`after_*`、spawn hooks）用于可见性
3. 产物和验证器契约，用来确认输出事实
4. 从失败中更新 memory/skills 的自修复循环
5. 可回放状态 API，保证 UI/操作员表面保持一致

这就是“偶尔输出好结果”变成“压力下稳定输出”的方式。

### 1.5 工作流约束与自由探索的取舍

受工作流约束的执行能提供更强保证：

- 更好的阶段单调性
- 更好的产物可预测性
- 更容易回放和操作员诊断

自由探索在新颖问题解决上有更高上限，但方差更高。

实践策略是混合式：

- 对长时间/高成本/高风险片段使用工作流轨道
- 在明确预算和检查内允许有边界的自由探索

### 1.6 多 agent 编排与自治等级

当系统从 L2 走向 L3/L4 自治时，长周期稳定性比单轮聪明更重要。

- L2 式辅助行为可以容忍更多人工恢复。
- L3/L4 式委托执行需要自监控、修复和有边界的自治。

多 agent 编排通过行为分解提供帮助：

- planner/coordinator agent 管理阶段意图
- specialist agent 执行狭窄工具领域
- verifier/operator agent 执行契约和升级

Harness 是让这种分解长期可靠的底座。

因此本书后续会在理论和 Octos 事故之间来回切换。事故展示控制平面在哪里断裂；理论解释为什么如果不把 session、tool、verification 和 replay 当作一个系统，同样的断裂会反复出现。

---

## 2. 成熟度鸿沟：灵光一闪 vs 工厂化输出

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

---

## 3. Octos 遇到的失败类别，以及代价为何高

### 3.1 后台任务进度 bug

观察到的类别：

- 子任务正确运行
- 父会话只显示初始状态或陈旧状态
- 用户以为任务挂起或重试，造成重复工作和混乱

根因：

- 进度以自由格式 stderr 文本发出
- 没有类型化事件 sink 契约
- 子任务进度没有持久桥接到父任务状态

代价：

- 错误的支持升级
- 重复子会话
- “本地能跑”但 live canary 失去信心

### 3.2 `run_pipeline` / `deep-search` 状态漂移

观察到的类别：

- 深度研究运行仍在进行，但状态气泡和任务 API 分离
- API 可能显示 running，而气泡像是冻结或处于错误阶段

根因：

- 多个状态通道，缺乏强一致协调
- UI/API/replay 没有强制使用单一规范阶段阶梯

修复方向（M4.1A 契约）：

- `octos.harness.event.v1` 进度 schema
- runtime sink -> `TaskStatusChanged` -> `/api/sessions/:id/tasks` + SSE
- UI replay 使用同一份后端事件事实

### 3.3 会话切换 / 状态气泡污染

观察到的类别：

- 切到兄弟会话时看到另一个会话的进度/状态
- 用户无法信任哪些信息属于当前对话

根因：

- topic/session 作用域没有端到端强制执行
- replay 和 active stream 混在一起，缺少严格会话归属检查

修复方向：

- 在任务状态事件中强制 session/topic 作用域
- live gate 中加入回放过滤和串扰检查
- 明确“无跨会话进度泄漏”的验收标准

### 3.4 产物契约执行缺口

观察到的类别：

- 后台任务完成，但交付了错误文件
- 缺失/无效主产物时仍标记任务完成

根因：

- 使用文件名启发式，而不是声明式产物事实
- 验证失败没有阻止完成

修复方向：

- 由策略声明的 `primary` 主产物
- `BeforeSpawnVerify` 阻断契约
- 完成状态绑定验证器结果

### 3.5 验证器运行器不完整

观察到的类别：

- 验证器存在，但输出对操作员/开发者过于粗糙
- 缺少足够的类型化证据用于调试和回放

必需姿态：

- 类型化的逐验证器结果
- 持续时间、原因类别、可回放证据路径
- 明确超时和失败分类

### 3.6 操作员盲区

观察到的类别：

- 有计数器，但没有紧凑的操作员叙事
- 很难快速回答“这个任务为什么失败”

修复方向：

- 操作员摘要和仪表盘都由规范任务/harness 状态驱动
- 不允许只存在于仪表盘中的隐藏逻辑

合在一起，这些失败不是六个独立 bug。它们是同一种模式在不同表面上的表现：Octos 把类似聊天的输出当成了运行时事实。下一章会把这个模式转化为关于状态、事件、验证和回放的具体架构。

---

## 4. 核心 Harness 架构：当前实用模型

```text
Child tool/skill (Rust/Python/Node/shell)
        |
        | emits octos.harness.event.v1 (progress/error/info)
        v
Event sink (OCTOS_EVENT_SINK transport: file/socket/stdio)
        |
        v
Runtime consumer + validation
        |
        +--> Task supervisor durable state (task_status, lifecycle_state, detail)
        |
        +--> TaskStatusChanged events
        |
        +--> Session event stream replay
        v
API (/sessions/:id/tasks + /events/stream)
        |
        v
UI status bubble / header / reload replay
```

关键规则：UI 永远是下游，不是权威。

### 4.1 生命周期模型

公开状态机：

- `queued`
- `running`
- `verifying`
- `ready`
- `failed`

内部可以存在更细粒度状态，但产品表面不应依赖不稳定的内部标签。

### 4.2 契约层

```text
Layer A: Capability manifest  (app 能做什么)
Layer B: Workspace policy     (artifact + validator + spawn contract)
Layer C: Runtime result model (lifecycle + task state + delivery evidence)
```

### 4.3 为什么类型化事件重要

没有类型化事件，进度只是“类似聊天的提示”。  
有了类型化事件，进度就是可以验证、回放和审计的数据产品。

---

## 5. 非 Rust 桥接：平台现实的必需品

Octos 是 Rust-first runtime，但 skill 生态是多语言的。

如果进度/事件契约只在 Rust 中可用：

- 第三方集成速度会坍塌
- 契约合规会变成 Rust 门槛
- 操作员数据质量会不一致

因此 M4.1A 的非 Rust 桥接是必要项，不是可选润色：

- Python emitter helper
- Node emitter helper
- CLI fallback emitter
- sink 缺失时的 no-op 语义
- runtime-side validation 仍然是权威

原则：发射端允许语言多样性，消费端严格规范化。

---

## 6. UI 回放不是前端功能，而是可靠性功能

可靠的状态气泡必须承受：

- 浏览器重载
- 重新连接
- 切走会话后再切回来
- 部分 stream 中断

如果 replay 缺失或不一致，即使后端正确，用户也会看到“随机性”。

设计规则：

- replay path 和 live path 必须共享规范 event/task schema
- UI 中不允许第二套解释层
- 门禁测试必须断言任务 API 和 SSE 回放之间的一致性

---

## 7. 操作员仪表盘与小型 fleet 实测

### 7.1 仪表盘的角色

仪表盘不是装饰性监控。它是日常控制平面，用来观察：

- 生命周期异常
- 阶段停滞
- 产物/验证器失败
- 重试、超时、孤儿子任务
- 跨会话串扰信号

### 7.2 小型 fleet 是发布事实

单元测试和集成测试是必要的，但不充分。  
Harness 回归通常具有时间性和多表面特征，只有 live canary 行为才能暴露。

上线门禁姿态：

- 至少在两台 mini-fleet 主机上运行脚本化验证
- 强制显式诊断类别，而不是通用 “failed”
- 当不变量破坏时阻止合并

规范例子包括：

- 缺失必需阶段
- 非单调阶段序列
- 生命周期回退
- 重复 research session
- 跨会话进度泄漏

---

## 8. Agent 群体编排：Harness 如何扩展团队而不只是代码

Harness 也是一个用于多 agent、多 owner 交付的协调系统。

### 8.1 工作分解模式

```text
Program Manager
  -> defines milestone contract + acceptance invariants
Runtime/Harness Owner
  -> owns ABI + sink + supervisor durability
Skill Owner (e.g., deep-search)
  -> owns event emission + workflow mapping
UI/API Owner
  -> owns replay parity + scoped projection
Release/Operator Owner
  -> owns live gate + diagnostics + rollback policy
```

没有这种拆分，团队会合并通过本地测试、但破坏系统事实的局部真相。

### 8.2 反混乱规则

门禁激活后，任何工作流都不得单方面重定义契约语义。  
任何 schema、生命周期语义或 replay 行为的变更，都必须在同一个 PR slice 中更新：

- fixture
- 脚本门禁
- e2e spec
- docs

---

## 9. 原则与反模式

### 9.1 原则

1. 将契约状态持久化在 prompt/chat context 之外。
2. 优先使用显式产物归属，而不是启发式交付。
3. 把完成状态视为由验证器把关的终态契约。
4. 在 API/UI/operator 表面使用同一个规范生命周期阶梯。
5. 把 session/topic 作用域作为硬安全边界强制执行。
6. 让进度可回放、可诊断，而不只是实时可见。
7. 让 transport 可替换；让 event schema 稳定并版本化。
8. 每个发布声明都必须绑定 live gate 证据，而不是轶事式运行。

### 9.2 必须禁止的反模式

1. Prompt-only 契约（“agent 应该记得发送文件”）。
2. UI-derived truth（“气泡显示 done，所以任务完成”）。
3. 用文件名猜测主产物。
4. 不阻断终态成功的 best-effort 验证器。
5. 把自由格式 stderr parsing 当作状态协议。
6. 无作用域 replay stream 泄漏兄弟会话状态。
7. 仪表盘指标与运行时规范数据脱节。
8. 发布 slice 中为了“再重构一下”而不增加用户可见不变量。

---

## 10. 工作流到里程碑映射：务实路线图

这份映射对齐当前 M4 方向和剩余平台化缺口。

### M4.1A — 父级可见的结构化进度 ABI

- 类型化 `octos.harness.event.v1`
- sink + consumer + task_status bridge
- deep-search 从 stderr status 迁移
- UI/API replay 一致性
- mini fleet live gate
- 非 Rust emitters

### M4.2 — 开发者契约产品化

- manifest/policy/task 字段的稳定文档
- 面向各类产物的入门应用模板
- 带失败模式的契约示例

### M4.3 — 类型化验证器运行器

- 带类型化结果的声明式验证器
- 超时分类和失败类别
- 可回放证据与面向操作员的来源记录

### M4.4 — 第三方 app/skill 兼容性门禁

- 从 git 安装
- 运行 harness 流程
- 验证产物
- 重载并验证持久化
- 卸载并验证没有状态串扰

### M4.5 — 操作员仪表盘成熟化

- 生命周期 + 阶段 + 验证器 + 产物表面
- 重试/超时/孤儿任务诊断
- 由规范任务摘要支撑的紧凑事故视图

### M4.6 — 显式 ABI 版本化和迁移策略

- events/hooks/policy/task 字段的 schema 版本
- 兼容性测试和废弃窗口
- 外部采用前的破坏性变更协议

这条路线图按上面的失败排序，而不是按 backlog 美观排序。前几项修复事实传播；后几项在事实模型稳定后加强兼容性和治理。下一章是必要的停顿：harness 修复编排正确性，但它不能完成整个产品。

---

## 11. Harness 必要但不充分

Harness 解决编排正确性，不解决完整产品质量。

高质量 coding agent 仍然需要：

- 强模型选择和路由策略
- 工具安全边界（沙箱、认证、权限门禁）
- 面向编码工作流的强提示词/策略对齐
- 测试生成/修复纪律
- 仓库感知的编辑质量和评审循环
- 延迟/成本治理

可以把 harness 看成运行时事实层。  
没有它，质量无法被信任。  
只有它，质量仍然依赖模型、工具和产品纪律。

用 Octos 的说法，这是“系统说真话”和“系统是好产品”之间的边界。前者是失败模式迫使我们构建的东西；后者仍然依赖模型路由、沙箱、提示词/策略对齐和评审纪律。

---

## 12. 可执行清单

### 12.1 维护者预合并清单（影响 harness 的 PR）

- [ ] 变更映射到显式用户可见不变量。
- [ ] 契约状态能跨崩溃/重载/压缩持久存在。
- [ ] 生命周期迁移是单调的，并有测试覆盖。
- [ ] 产物选择使用声明式策略，而不是把启发式回退当主路径。
- [ ] 必要时验证器失败会阻断终态成功。
- [ ] 会话/主题作用域检查能防止跨会话污染。
- [ ] API 和 SSE 回放暴露同一份任务事实。
- [ ] 操作员摘要/仪表盘信号包含新的失败模式。
- [ ] 小型 fleet 门禁至少在两台主机上通过。
- [ ] 契约变更时，文档、fixture、脚本、端到端测试在同一个 slice 更新。

### 12.2 第三方 app/skill 开发者清单

- [ ] 声明单一规范 `primary` 产物。
- [ ] 为存在性、大小和领域约束定义验证器。
- [ ] 只使用稳定生命周期/任务 API 字段。
- [ ] 当 `OCTOS_EVENT_SINK` 可用时，通过它发出结构化进度。
- [ ] stderr 用于诊断，不用于契约状态。
- [ ] 确保 hooks 幂等（尤其是 `before_spawn_verify`）。
- [ ] 为你的工作流测试重载/会话切换行为。
- [ ] 验证失败路径会产生操作员可读证据。

### 12.3 事故响应清单（状态漂移 / 污染类）

- [ ] 对比 `/api/sessions/:id/tasks` 快照和 UI 气泡/页头。
- [ ] 检查 SSE 流是否缺失或存在越界 `task_status` 事件。
- [ ] 确认回放和实时事件上的 session/topic tags。
- [ ] 检查最终快照中是否有重复 deep-research/run_pipeline 任务。
- [ ] 验证阶段顺序单调性和进度范围。
- [ ] 修补前捕获 diagnostic JSON 和 curl 提示。
- [ ] 修复后重新运行 mini fleet 门禁；不要接受仅本地验证。

---

## 13. 参考架构片段

### 13.1 任务事实流

```text
tool emits progress -> runtime validates event -> supervisor persists state
-> TaskStatusChanged -> API/SSE -> UI replay/status bubble
```

任何绕开这条链的直接 UI 变更都是可靠性风险。

### 13.2 契约执行流

```text
spawn success
  -> resolve candidate outputs
  -> before_spawn_verify (allow/modify/deny)
  -> validator runner
  -> mark ready or failed
  -> persist delivery evidence
```

在这条流程完成前标记终态成功，是契约违例。

---

## 14. 结语：下一阶段的工程姿态

把 harness 工作当作产品可靠性工程，而不是抽象框架建设。

Octos 的胜利模式一直是：

1. 识别具体用户可见失败类别
2. 编码显式契约不变量
3. 把运行时/UI/操作员表面绑定到同一个事实模型
4. 合并前在小型 fleet live gates 上证明
5. 之后再扩展抽象和外部平台表面

这就是从“今天看起来很聪明”走向“每天都能正确交付”的路径。

---

## 15. 附录 A：源文本与研究流程

本书论证建立在十篇奠基文本之上，但它们可以聚成三个实践组：

- Layer 1 谱系：Fowler、OpenAI、Fisher Zhang、NxCode
- Layer 2 谱系：Anthropic、Anthropic long-running apps、Milvus、Stanford Meta-Harness
- 桥接文本：Neo4j 的上下文工程，Karpathy 的 wiki 纪律

对 Octos 来说，保留全部十篇的理由很具体：第 3 节中的失败属于 Layer 2 failure，而产生这本合并书的过程位于 Layer 1 谱系中。把二者放在一起读，能让控制系统视角保持诚实。

### 15.1 研究流程

1. 从 Octos 中一个真实失败模式或真实设计选择出发。
2. 选择与你正在处理的层次匹配的源文本集群。
3. 抽取不变量，而不只是引文，并写入 wiki 页面、schema 或 checklist。
4. 在下一次事故前，把不变量变成测试、门禁或评审规则。
5. 当系统行为变化时，重新审视章节问题。

### 15.2 核心研究问题

- 这篇文本属于哪一层？
- 哪个不变量本可以防止我正在研究的 Octos 失败？
- 当模型变化时，什么必须保持稳定？
- 哪些契约属于 runtime，哪些属于 policy？

---

## 16. 附录 B：Harness 自查矩阵

使用下面的矩阵为团队或产品打分。每一行标记为 `❌`、`⚠️` 或 `✅`。

### 16.1 Session 支柱

| # | 检查项 |
|---|---|
| S1 | Session 数据与聊天历史分开存储。 |
| S2 | Session 日志只追加。 |
| S3 | Session 可以通过 ID 恢复。 |
| S4 | 事件流对人可读且可比较差异。 |
| S5 | 新队友可以从 session 产物重建工作过程。 |

### 16.2 Harness 支柱

| # | 检查项 |
|---|---|
| H1 | Harness 状态存在于 harness 进程之外。 |
| H2 | Harness 接口小而稳定。 |
| H3 | 循环变体可以变化，而不用重写 session 模型。 |
| H4 | 模型升级不会迫使大范围 harness 重写。 |
| H5 | 每个 harness 变更都明确属于缺陷修复或协议执行。 |

### 16.3 Tools 支柱

| # | 检查项 |
|---|---|
| T1 | 工具职责是正交的。 |
| T2 | 调用和结果记录到 session 日志。 |
| T3 | 无效调用可以回滚或纠正。 |
| T4 | 凭据不进入沙箱。 |
| T5 | 有效工具组合不能静默逃逸策略。 |

### 16.4 Verification 支柱

| # | 检查项 |
|---|---|
| V1 | 生成器和评估器是分离的。 |
| V2 | 规格自动或半自动流入性质测试。 |
| V3 | 每个裁决都持久化到审计轨迹。 |
| V4 | Linting 能抵抗自利或迎合式输出。 |
| V5 | 外部证据可以证明正确性，而不必信任验证器自己的输出。 |

### 16.5 评分

- 16+ 个 `✅`：L4，强成熟度
- 12-15 个 `✅`：L3，已有独立验证层
- 8-11 个 `✅`：L2，session 协议真实存在但不完整
- 4-7 个 `✅`：L1，session 存在但协议较弱
- 低于 4 个 `✅`：L0，仍然以 prompt 为中心

---

## 17. 附录 C：精选术语表

这是全书最常出现术语的紧凑节选。

| 术语 | 含义 |
|---|---|
| Agent Loop | 重复的 generate-act-observe 循环。 |
| Append-only log | 永不重写历史的日志。 |
| Context Engineering | 组织输入，使模型停留在有用区间。 |
| Feedforward / Feedback | 行动前的引导，行动后的感知。 |
| Harness | 约束并解释模型行为的运行时框架。 |
| Harness Engineering | 围绕模型设计控制层的工程实践。 |
| Intent | 必须被明确表达、不能靠猜的人类目标。 |
| Meta-Harness | 可以被优化或重新配置的 harness。 |
| Prompt Engineering | 通过 prompt 调整单轮行为。 |
| Session | 任务的持久、可恢复事实流。 |
| Stable Abstraction | 跨模型变化仍然有用的接口。 |
| Tool Vocabulary | 系统可以采取的有边界动作集合。 |
| Verification Independence | 验证不能与生成是同一件事。 |
| Wiki | 维护过的、结构化的历史工作记忆。 |

---

## 18. 附录 D：按角色阅读路径

如果你把这本书作为团队资料阅读，请使用与你职责最匹配的最短路径。

| 角色 | 先读 | 然后读 |
|---|---|---|
| Engineering lead | 1, 2, 3 | 5, 10, 11, 13 |
| Agent product builder | 1, 2, 6 | 7, 8, 9, 12 |
| Architect | 1, 4, 7 | 12, 13, 14 |
| CTO or operator | Preface, 1, 9 | 13, 14, 19 |
| Researcher | 1, 3, 4 | 9, 10, 11, 12, 15 |

---

## 19. 参考文献与研究轨迹

### 19.1 奠基来源

1. Birgitta Böckeler. *Harness engineering for coding agent users.* Martin Fowler, 2026-04-02. https://martinfowler.com/articles/harness-engineering.html
2. OpenAI. *Harness Engineering: Leveraging Codex in an Agent-First World.* https://openai.com/index/harness-engineering/
3. Lance Martin, Gabe Cemaj, Michael Cohen. *Scaling Managed Agents: Decoupling the brain from the hands.* https://www.anthropic.com/engineering/managed-agents
4. Prithvi Rajasekaran. *Harness Design for Long-Running Application Development.* https://www.anthropic.com/engineering/harness-design-long-running-apps
5. NxCode. *What Is Harness Engineering? Complete Guide for AI Agent Development.* https://www.nxcode.io/resources/news/what-is-harness-engineering-complete-guide-2026
6. Nyah Macklin. *Context Engineering for AI Agents.* https://neo4j.com/blog/developer/context-engineering/
7. Milvus. *Harness Engineering: The Execution Layer AI Agents Actually Need.* https://milvus.io/ai-quick-reference/harness-engineering-the-execution-layer-ai-agents-actually-need
8. Fisher Zhang. *Harness Engineering: The Oldest New Idea in AI.* https://medium.com/@fisher262425/harness-engineering-the-oldest-new-idea-in-ai-7a7bcd6baf7b
9. Andrej Karpathy. *LLM Wiki.* https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
10. Stanford IRIS Lab. *Meta-Harness: End-to-End Optimization of Model Harnesses.* https://arxiv.org/abs/2603.28052

### 19.2 支持性参考

- Kai Mei et al. *AIOS: LLM Agent Operating System.*
- Bertrand Meyer. *Object-Oriented Software Construction.*
- Dan Ariely 2013 年关于 big data 的那句话，它既是本书反复出现的玩笑，也是警告。
- EU AI Act、SEC disclosure expectations、FDA SaMD guidance 等治理压力。

### 19.3 研究轨迹

底层研究材料位于写作本书时使用的 `ascent-research` session tree，包括 `session.md`、`session.jsonl`、`SCHEMA.md`、`wiki/`、`diagrams/`、`raw/` 和 `drafts/`。

这条轨迹本身也是本书论点的一部分：写作过程就是一次被 harness 化、可恢复、可回放的工作。
