# 第 5 章 · AI 生成代码的工程谱系

> 如果你读到这里,你大概率是 Layer 1 的读者 —— 你的产品不是 agent,**agent 是你们产线上的工具**。这一章是你的主场;接下来四章(Part B)是 Layer 2 专场,你可以当作背景略读,或读完本章直接跳到 Part C。

## 凌晨两点的 merge 队列

凌晨两点,某基础设施团队的三位工程师面前是一块白板,白板上写着一个数字:**1,506**。这是过去 24 小时 Codex 在他们仓库开出来、还没合的 PR 数量。他们三人此刻都没在写应用代码 —— 更准确的说法是,他们的**整个岗位**已经不是"写应用代码"了。

他们在做三件事。第一位工程师盯着 CI 面板的红条 —— 架构约束 lint 失败:一批 PR 试图从 `payments/` 直接 import `audit-log/` 的内部类型,违反了三个月前"审计层只暴露 trait" 的约定。她在想是否把这条规则从 warning 提到 error;提上去,这 47 个 PR 下一轮 CI 会被一次性挡下,不需要任何人去看。第二位工程师在改 `AGENTS.md`:他刚发现一批 PR 都在重新发明日期解析,因为 `AGENTS.md` 里没有指向 `docs/datetime-conventions.md` 的那行链接。第三位工程师在和一个 property test 的失败记录较劲 —— Codex 写的一段去重逻辑在 256 个随机输入里有 3 个触发重复写入,他正把失败输入序列化进 `tests/regression/` 作为回归锚点。

三位工程师那晚没在写应用功能。但**应用功能正以每天 3.5 个 PR / 人的节奏合进 main**。他们做的工作的**对象**变了 —— 从"代码"变成了"让代码能自动被产出、自动被验证、自动被拒绝的那套条件"。

这一章讲的就是这套条件。它不是新学科,是软件工程这门老学科面对 AI 大量生成代码这个新输入的一次重校准。本章的单一问题 —— Ch 1 两层分界里 Layer 1 的那个问题 —— 是:**在 AI 大量生成代码的时代,怎么确保交付的工程质量**?答案的骨头,在一份 OpenAI 2026 年 2 月发表的工程博客里。

## 1M LOC 背后的五件工程事实

OpenAI Codex 团队 2025 年 8 月第一次提交,到 2026 年 2 月,五个月的时间窗口里,**三位工程师 · 1500+ PR · 约 1M LOC · 人类写的代码 0 行 · 每天约 10 亿 token 的 agent loop 消耗**。Ryan Lopopolo 在 Latent Space 播客上把这四个数字打包讲出来,配了一句话比任何宣传文案都准确:*"Extreme Harness Engineering for Token Billionaires: 1M LOC, 1B toks/day, 0% human code, 0% human review."*(见 [[openai-harness-engineering]])

这句话容易被读成"模型终于变强了",那不是重点。重点是另一个:**在这个规模上,能让 agent 可靠产出代码的那套脚手架,已经和 agent 本身一样是工程对象**。拆开看,那套脚手架由五件具体的工程事实组成,每一件都不是 prompt 层能触达的。

**一、可复现的开发环境是地基**。Codex 在依赖锁到字节级、测试结果两次运行必须位等的环境里工作 —— 否则反馈信号就是噪声。人类遇到 flaky test 会凭经验忽略,agent 不会 —— 它把 flaky 当真实信号,沿着假信号走一整晚。复现性在这里不是"卫生指标",是 agent loop 能否工作的**前置条件**。

**二、架构约束必须被 CI 强制执行**。白板前第一位工程师做的就是这件。架构纪律 —— 哪个模块能依赖哪个、哪些函数签名稳定 —— 如果只活在 `ARCHITECTURE.md` 里靠人审,一千多 PR / 天的量级下无法 scaling。办法是翻译成 linter、import 拓扑检查、公共 API diff,接到 CI 上。**agent 不会"感觉"架构味道**,它只会撞墙、看反馈、再改。没有墙,它就不会停。

**三、测试基础设施要同时快、密闭、agent 可运行**。快,是因为 agent 要求分钟级反馈;密闭,是因为测试不该触及真实网络 / 数据库 / 副作用;agent 可运行,是指测试有稳定调用接口,agent 能自己起测试、读结果、定位失败行。三条都满足,agent 能在同一个 PR 里跑几十轮试错不打扰人。这件事与评估框架(见 [[concept-evaluation-harness]])结构同构 —— 都是"让机器替人做 gate"。

**四、反馈回路的设计本身是工程对象**。PR 失败时 agent 看到什么?裸 stack trace?裁剪后的关键片段?渲染好的 UI 截图?每一个选择都会改变 agent 下一轮的行为。OpenAI 会把 CI 失败信息**重新排版**再喂给 agent —— 裁剪后的版本让 agent 更容易收敛到真因。用 Fowler 的话说(见 [[fowler-on-harness]]):*operator 的工作不是审查 agent 的输出,是迭代 harness 本身*。

**五、AGENTS.md + docs/ 的分层,是 agent 知识注入的主模式**。这条在下一节展开,因为它有一个可直接抄的结构。

五件事加起来是一份岗位说明书,上面**没有一条在讲"怎么写更好的 prompt"**;每一条都在讲"怎么设计 agent 能正确产出代码的**条件**"。这就是 Ch 2 视角位移在 Layer 1 上的具体形态:工程师的工作层**从写代码上移到设计写代码的条件**。

## AGENTS.md 作 ToC,不是 encyclopedia

第二位工程师改的那份 `AGENTS.md`,是 Layer 1 最具代表性也最容易写错的一件制品。典型反模式:把全部风格指南、架构文档、API 手册、数据字典、on-call 流程塞进一个 50KB 的 Markdown 每次整段注入。这种写法有两个问题:token 预算炸掉、agent 学到的上下文哲学错了 —— 它会把 "context = 某个早被写下的全集" 当世界观,而不会养成 "context = 此刻与任务相关的切片" 的习惯。

正确模式是把 `AGENTS.md` 当**目录**,不当百科全书 —— **原则长驻上下文,细节按需加载**。结构大致如下:

> **仓库根目录**
> · `AGENTS.md` —— 短文档(2–5KB)。列出:仓库定位一句话、语言与工具链版本锁、工作区拓扑、五条高频违规的红线、分层规则、指向 `docs/` 里各主题的目录表
> · `AGENTS.local.md` —— 本机 / 本工作区临时覆盖,`.gitignore`
> · **`docs/`** —— 系统记录层,每个主题一篇,agent 按需检索
>   · `docs/architecture.md` —— 模块拓扑与依赖方向
>   · `docs/datetime-conventions.md` —— 日期 / 时区 / ISO 格式惯例
>   · `docs/error-taxonomy.md` —— 错误分类与重试策略
>   · `docs/observability.md` —— 日志字段、trace id 传播规则
>   · `docs/security-boundaries.md` —— 哪些值不得进日志、哪些调用必须过 sandbox
>   · `docs/testing.md` —— 测试分层、fixtures、property test 规范
> · **`tests/`** —— 用例即规约
>   · `tests/property/` —— property-based 测试套,L3 契约的运行载体
>   · `tests/regression/` —— 失败输入的档案馆(agent 的负面教材)
> · **`.github/`(或等价 CI 目录)** —— 机器层 gate
>   · `workflows/architecture-lint.yml` —— 模块依赖方向检查
>   · `workflows/public-api-diff.yml` —— 公共接口变更门禁
>   · `CODEOWNERS` —— 高风险路径人审路由

这套结构的价值在三件事。**Principles always in scope** —— `AGENTS.md` 每轮注入,必须短到 token 不炸,又要覆盖通用约束。**Details pulled when needed** —— `docs/` 按需打开,写支付模块时打开 `error-taxonomy.md`,写观测模块时打开 `observability.md`,互不干扰。**tests/ 和 .github/ 是同一套意图的机器倒影** —— `docs/` 里写的文字约束,`tests/` 和 CI 里应有对应的可执行检查。这对应 [[concept-tool-vocabulary]] 反复说的:**agent 能做什么不是靠你劝它,是靠你给它的词表和检验器同时约束出来的**。

三类常见错误各有症状。**写成百科全书** —— 高频原则被细节稀释,"agent 读过也会违反"。**只写在 `AGENTS.md` 不在 CI 上落** —— 约束变建议,"说了不要 agent 还是做了"。**只在 CI 上拦不在 `AGENTS.md` 上写** —— "95% PR 能过,但每个都要走两轮"。三类错误对应三次修整动作,不用再多。

## Fowler 的两类控制在代码场景的落地

把那套脚手架形式化切一刀,Fowler 在 *Harness Engineering for Coding Agent Users* 里给的刀最好用(见 [[fowler-on-harness]])。他把 harness 里的"控制" 分成两类:**computational controls**(可计算控制)和 **inferential controls**(推断控制)。这是分析脊柱。

**Computational controls 确定性、便宜、快** —— linter 拦风格、type-checker 拦类型、unit test 拦行为、structural analysis 拦依赖反向。每次改动都能跑,**直接接进 agent 的 inner loop**。**Inferential controls 非确定性、慢、贵** —— AI code review 判断"是不是过度工程"、语义去重判断"这件 utility 是不是已经存在"、架构评审判断"有没有违反领域边界"。得不出干净的 true/false,只能给出带置信度的意见,**作为 outer loop 的 gate** 在 PR 合并前或周会上跑。

这一刀在 AI 生成代码场景下价值放大,因为**"代码好不好" 的评价函数不是单一维度**。后者一部分能翻译成 computational(架构约束一旦形式化就是 computational),一部分永远是 inferential 的。下表是两类控制在代码场景下的对照:

| 待检验的性质 | Computational(自动、便宜、inner loop) | Inferential(非确定、贵、outer loop gate) |
|---|---|---|
| 语法与类型 | rustc / tsc / mypy / pyright | —— |
| 风格与细节一致 | clippy / eslint / ruff / gofmt | —— |
| 单元行为 | `cargo test` / `pytest` / `go test` | —— |
| 随机化反例 | property-based test(proptest / Hypothesis / QuickCheck) | —— |
| 架构依赖方向 | `cargo-deny` / `dep-cruiser` / 自制 import-graph linter | 架构评审(human 或 LLM-as-reviewer) |
| 公共接口变更 | `cargo-semver-checks` / API diff CI 门禁 | 向后兼容性判断 · breaking 影响面评估 |
| 代码重复度 | `jscpd` / `pmd-cpd` 的表层相似度 | 语义去重("这件事已经有 utility") |
| 过度工程 | —— | LLM-as-reviewer · CODEOWNERS 资深工程师 |
| 命名与语义 | —— | 代码评审里的"起名" 讨论 |
| 业务意图对齐 | —— | PRD 对照 · scenario 评审 |

两侧都有项的行是最容易做对的。**只有 inferential 对应物**的行,是每一次能把一项从右移到左的机会。**"把一条约束从 inferential 移到 computational"** 是 harness 工程师一天的最高价值动作 —— 移过去之后,agent 的 inner loop 自己撞墙,不再需要 reviewer 复述。Fowler 援引的 Ashby's Law(调节器的多样性必须不小于被调节系统)在这里翻译成一句:**把组织约束形式化成 computational 规则的速度,决定了你们能承受的 AI 生成代码吞吐上限**。

反过来 **inferential controls 永远消不掉但可以跑得少**。把 80% 的 computable 部分搬到 CI 上,inferential 只在剩下 20% 上跑 —— 这 20% 通常是**语义判断值得花时间** 的那些。**Agent 生成代码的时代,人的工作不是消失,是更精准地集中在 inferential gate 上**。

## MindStudio 五柱的代码落地

Fowler 的切法是分析刀,MindStudio 入门指南(见 [[mindstudio-harness]])的切法是清单刀 —— 把 harness 切成 tool orchestration / guardrails / error recovery / observability / HITL 五柱。对 Layer 1 读者,这五柱的真实价值在**每一柱都能落到仓库里的具体文件夹或 CI 规则上**。MindStudio 反复引的 LangChain 实验是:同一个模型,**只改 harness**,benchmark 从 52.8% 走到 66.5%。+13.7pp 没有发生在 prompt 或模型里 —— 全在脚手架上。

下表把五柱逐一落到 Layer 1 的物理位置上:

| MindStudio 五柱 | Layer 1 里的物理位置 | 可观察信号 |
|---|---|---|
| Tool orchestration | `AGENTS.md` 里的工具白名单 · `docs/tools/` 单篇工具说明 · `package.json` / `Cargo.toml` 的依赖清单 | agent 可调用的 util / CLI / MCP tool 列表是否成文 |
| Guardrails & 安全约束 | CI 里的 architecture lint · `security-boundaries.md` · `CODEOWNERS` 上的敏感路径 · 硬编码值 lint(secrets / tokens) | 违规 PR 能在 CI 阶段被阻断,而不是在 review 里被记起 |
| Error recovery & feedback loops | CI 的失败信息格式化 · retry 策略文档 · `tests/regression/` 的失败档案馆 · merge queue 的 re-run 策略 | agent 第二轮修错的成功率 · flaky rate |
| Observability | 结构化日志字段规约 · trace id 贯穿要求 · `observability.md` · PR 模板里的"可观察性影响" 一栏 | 事故复盘时能从日志直接定位到 agent 的哪一次 tool call |
| Human-in-the-loop | `CODEOWNERS` 高风险路径必审 · PR 模板的合规 checklist · release gate | 每周 human review 的 PR 数量 / 总 PR 数的比例能不能被组织接受 |

两张表合起来看:**Fowler 的表是"控制怎么分类",MindStudio 的表是"控制放在哪"**。前者关心分析,后者关心落地。合在一起,就是 1M LOC 背后那套脚手架的结构。

一个诚实的警告:MindStudio 的五柱在学理上**没说清楚"为什么是五"**,它把 guardrails 和 tool orchestration 当成同级,而 Fowler 的语法里 guardrails 应当是 tool 层的一个**属性**。对 Layer 1 读者这个瑕疵不伤使用 —— 作为入门清单够用;想深一层的读者可以直接用 Fowler 的两类切法去整理。

## Spec → Property Test → Audit Trail 作为 AI 代码审计的结构性甜点

五柱和两类控制都讲完了,剩下一件事最关键:**AI 生成的代码凭什么被信?** Layer 1 的答案不是"让另一个 AI 再审一遍",是让**契约读代码**,不是让人读代码。

Ch 3 已经把上游讲透 —— 意图分三层严密度(L1 prompt / L2 BDD / L3 DbC 函数契约),L3 的现代落地是 Bertrand Meyer 1986 *Design by Contract* 在 Rust 形式化验证生态(Creusot / Prusti / Kani)里的回归(见 [[concept-evaluation-harness]])。Ch 3 的工作是**把意图送上 L3**;Ch 5 的工作是**在 AI 大量生成代码的条件下,把 L3 契约接到审计链路的下游**。

连接点是:**spec → property test → audit trail**。契约定义"正确"是什么意思;property test 生成 128 / 256 组随机输入打穿实现;audit trail 把失败输入序列化归档,作为 AI 生成代码的负面教材。下面两段代码展示两端。选的例子是**审计日志追加** —— AI 生成代码里出错频率最高、代码评审里又最不容易看出问题的一类:看上去对,但时序 / 幂等 / 单调性搞错了。

```rust
// L3 · 函数契约:append-only audit log 的四条性质
// 用 Creusot / Prusti 形式化属性声明(语法示意,具体 crate 语法各有差异)
#[requires(event.seq == old(log.last_seq()) + 1)]          // 序号必须严格递增
#[requires(event.ts >= old(log.last_ts()))]                // 时间戳单调不减
#[ensures(log.len() == old(log.len()) + 1)]                // 追加且仅追加一条
#[ensures(*log.get(log.len() - 1) == event)]               // 最后一条等于刚写入
fn append(log: &mut AuditLog, event: AuditEvent) {
    log.entries.push(event);
    log.last_seq = event.seq;
    log.last_ts = event.ts;
}
```

四条性质不多,但合起来把"审计日志" 从 AI 眼里"大约能 work 的 push" 钉成了可机器验证的断言。`requires` 是前置条件,`ensures` 是后置条件,`old(…)` 捕获调用前状态 —— 任何违反这四条的 AI 实现都会被下一步的 property test 逮出来。

```rust
// property test:让机器生成随机输入序列,检验契约永不被违反
use proptest::prelude::*;

proptest! {
    #[test]
    fn audit_log_append_preserves_monotonicity(
        events in prop::collection::vec(any::<AuditEvent>(), 0..256)
    ) {
        let mut log = AuditLog::new();
        let mut last_seq = 0u64;
        let mut last_ts = 0i64;

        for ev in events {
            // 前置条件过滤:不合法的输入不参与检验
            prop_assume!(ev.seq == last_seq + 1);
            prop_assume!(ev.ts >= last_ts);

            let len_before = log.len();
            append(&mut log, ev.clone());

            // 四条不变式一次性验证
            prop_assert_eq!(log.len(), len_before + 1);
            prop_assert_eq!(log.get(log.len() - 1).cloned(), Some(ev.clone()));
            last_seq = ev.seq;
            last_ts = ev.ts;
        }
    }
}
```

proptest 每次 CI 跑时生成 256 条随机事件序列,任何让契约翻车的序列都会被自动缩小(shrink)成最小反例,序列化到 `proptest-regressions/` 文件夹里。**那个文件夹就是 audit trail 的起点** —— 失败输入的档案馆,AI 生成代码在这个函数上**所有翻过的车**的物证。下一次 CI 重跑时,proptest 先跑档案馆里的用例,再跑新随机输入;**任何历史上翻过的车永远不会再翻第二次**。

这条链路的意义不是"多一层检查",是**检查的语法变了**。手写时代 property test 是"值得用但经常不用" 的工具,因为人有直觉兜底;AI 生成代码时代它是必选项 —— AI 的"直觉" 是训练语料的统计偏好,不是你这个仓库的 invariants。**让契约读代码**把审查负担从人眼转嫁到机器,这就是 Layer 1 在 AI 时代的结构性甜点。

一个限制要明说:L3 契约不是 AI 代码的全部审计。它覆盖"单个函数行为正确吗",不直接覆盖"函数放在这个模块对吗"、"API 设计对吗"、"改动有没有违背产品意图"。后者仍需要 inferential controls —— 前一节 Fowler 表格的右列。**L3 + property test 是审计地基,inferential review 是审计屋顶**,两者都不可省。

## "0% human review" 的真实边界

"0% human review" 是 1M LOC 故事里最煽动、也最容易被断章取义的一块。工程 lead 要问的第一件事不是"太厉害了",是:**它在什么条件下成立,在什么条件下不成立**?

条件成立的场景,是 OpenAI 自己内部的 Codex 工具链 —— 一个**内部仓库 · 非合规关键路径 · 风险自吸收**的环境。内部仓库意味着没有外部客户数据面、没有 SLA 合约;非合规关键路径意味着出错不触发监管事故;风险自吸收意味着 bug 的代价由 OpenAI 自己承担,没有第三方受害者向法律体系主张权利。三条都成立时,"computational + property test + inferential gate 构成完整 gating,省掉每条 PR 的 human review" 是可以做的工程选择,那次选择的产出(1M LOC, 3.5 PR / eng / day)是真实的。

**三条前提任何一条不成立,"0% human review" 立刻失效**。有三类场景必须明确列出 opt-out:

**第一类,医疗 SaMD(Software as a Medical Device)**。代码进入诊断、治疗、患者监护路径,FDA 21 CFR Part 820 与 IEC 62304 对变更控制、设计评审、可追溯性有具体要求 —— 关键路径代码变更必须有**签名的人类评审记录**。AI 生成的代码在 CI 上全绿,也不能省掉 named human reviewer 的签字。EU MDR 对 SaMD 的分级评审同理。这里"0% human review" 不是工程问题,是合规事实。

**第二类,金融与 SEC / 等价监管**。支付清算、风控决策、交易撮合、反洗钱路径,代码变更按 SOX 404 要求必须有双人评审与变更批准记录;SEC 新近的 AI 披露倾向还可能要求披露"AI 介入生成的代码比例"。可以让 AI 写测试、写 boilerplate,但**核心金融逻辑的变更评审权不能交给机器**。

**第三类,个人隐私与 GDPR / CCPA / 中国 PIPL**。处理个人身份信息、健康信息、金融信息的数据流代码,GDPR 下变更影响 Data Protection Impact Assessment(DPIA)时,必须经过 DPO 的 review 记录。**DPIA-affecting 的部分,merge 前人类签字不能省**。PIPL 对关键信息基础设施运营者要求更严。

三类加起来覆盖了大多数企业级仓库至少 20%–40% 的路径。结论要写进团队手册:**"0% human review" 是有边界条件的工程选择,不是普世目标**。

## Stanford Meta-Harness 在 coding 侧的含义

Layer 1 的终极想象是"把手工 harness 也自动搜出来",证据在 Stanford IRIS Lab 2026 年的 *End-to-End Optimization of Model Harnesses*(见 [[stanford-meta-harness]])。它把"设计 harness" 交给 outer-loop agent 去搜 —— proposer 读历史候选 harness 的源码、分数、trace,提议新变体,评分、保留、淘汰、再提议。Paper 实测:分类任务 +7.7 pts、数学推理 +4.7 pts、同分下 context token −75%,**TerminalBench-2 超越手工构造 harness**(具体增量以原始论文为准)。TerminalBench-2 是 coding 侧最接近实务的 benchmark —— 自动搜出来的跑赢人手工调的,这是 Layer 1 自动化极限的一块实证。

Layer 1 读者会问一个锋利的问题:**既然自动搜出来的都能跑赢手工,那"工程师的工作上移到设计 harness" 还有意义吗**?

答案分两半。**第一半**:Stanford meta-harness 自动化的是**稳定接口之下**的实现 —— retry 策略、tool 选择启发式、memory 压缩规则、plan 分解模板。这些是代码,是 proposer 能读写的对象。但在它之上有一样东西不在自动化范围内:**目标函数是谁定的、评估语义是谁写的、哪个接口被认为是 load-bearing 的**。三件事都还是人的工作。Paper 也认了这件事 —— outer-loop 的前提是评估函数可信,否则优化会收敛到噪声上([[concept-evaluation-harness]] 里的原话:meta-harness 的前提是评估框架本身可信)。

**第二半在 Ch 13 展开**:反脆弱的第四支柱 —— "什么叫做好" 永远由人定 —— 在 coding 场景下的具体形态就是这个答案。Stanford meta-harness 把 Layer 1 工程师从"写 harness 的每一行代码" 里解放出来,但没有从"定义 objective、哪些接口值得长期稳定、哪些 invariants 不可让渡" 里解放出来。**工作层继续往上移,不是消失**。从"写代码" 到"写 harness" 到"定义 objective 与接口",每一次上移都把人类判断推向更低频率、更高杠杆的位置。

## 回到那三位工程师

白板前那三位工程师,凌晨三点做完了当晚的工作。第一位把那条架构约束从 warning 提到 error,47 个 PR 在下一次 CI 时被一次性挡下,她当晚不再看它们。第二位在 `AGENTS.md` 里加上指向 `docs/datetime-conventions.md` 的那行链接 —— 下一批 Codex PR 的日期处理会自动收敛。第三位把 3 个 property test 失败输入序列化进 `tests/regression/proptest-regressions/audit-log.txt` —— 这个文件下周被 proptest 自动先跑,历史翻过的车永远不会再翻第二次。

他们那晚没审一条 PR。但他们完成的三件事每一件都**把未来几周几百条 PR 的审查**从 inferential controls 移到了 computational controls。这就是 Layer 1 harness 工程师的一天 —— 不是更高明的 prompt 技巧,是**把组织隐性知识 spec 化、把验证从 PR 级挪到 CI 级、把工作层从"写代码"上移到"设计 AI 能产出正确代码的条件"**。

下一章(Ch 6)翻进 Layer 2。如果你的产品不是 agent,Part B 可作为背景略读,读完可跳到 Part C;如果你的产品是 agent,Part B 四章(session / harness / tools / verification)是你的主场。两层工程纪律在名词上相似,在问题上不同 —— Ch 1 已钉过,这里重复是为了提醒:**Layer 1 做好了,不等于 Layer 2 就省了**。

---

## 可观察信号(自测三问)

- 你们仓库里,**最近一条架构约束从 warning 提到 error** 是什么时候的事?如果答不上来,意味着 Fowler 意义上的 computational controls 没有在持续扩张 —— 你们的 inferential 负担在默默堆积。
- 打开 `AGENTS.md`,它是**不到 5KB 的目录**,还是**几十 KB 的百科全书**?如果是后者,token 预算在每次对话里被稀释,agent 在学习一种错误的 context 哲学。
- 上周你们仓库合进 main 的 PR 里,有多少条是 **agent 直接开出、人只在 CI gate 上把关、没有 line-by-line human read** 的?这个比例决定了你们在 Layer 1 harness 成熟度上站在哪。

---

## 本章核心论断

1. **Layer 1 的驾驭工程 = 把软件工程的老学科,针对 AI 生成代码这个新输入重新校准**。核心动作是把组织隐性知识 spec 化、把验证从 PR 级挪到 CI 级、把工作层从写代码上移到设计写代码的条件。
2. **1M LOC 背后不是"模型变强",是五件具体工程事实**:可复现开发环境、CI 强制架构约束、密闭快测试基础设施、精细反馈回路、AGENTS.md + docs/ 分层注入。缺一不可。
3. **AGENTS.md 是 ToC,不是 encyclopedia**。principles always in scope,details pulled when needed;`docs/` 作系统记录,`tests/` 和 CI 是同一套意图的机器倒影。
4. **Fowler 两类控制(computational / inferential)是 harness 设计的分析脊柱**。工程师一天最高价值的动作,是把一条约束从 inferential 移到 computational,让 agent 自己撞到墙上。
5. **L3 契约 + property test 是 AI 代码审计的结构性甜点**(与 Ch 3 互为上下游):契约定义正确、property test 打穿实现、regression 文件是失败档案馆。审查的语法从"人读代码" 变成"契约读代码"。
6. **"0% human review" 有边界条件**。内部仓库 / 非合规关键路径 / 风险自吸收三条成立才能用。医疗(FDA SaMD / IEC 62304)、金融(SOX / SEC)、隐私(GDPR DPIA / PIPL)三类场景下,named human reviewer 签字是合规事实,不是可选项。
7. **Stanford Meta-Harness 在 TerminalBench-2 上超越手工 harness,是 Layer 1 自动化的极限证据,也是工作层继续上移的指向牌**。稳定接口之下可自动化,接口之上的 objective / verification semantics / 哪些 invariants 不可让渡 —— 仍然是人的工作。

---

## 本章奠基文对齐

- [[openai-harness-engineering]] —— 1M LOC / 3.5 PR per engineer per day / AGENTS.md + docs 模式的一手出处
- [[fowler-on-harness]] —— computational vs inferential 两类控制的分析脊柱;steering loop 概念
- [[mindstudio-harness]] —— 五柱入门清单;LangChain 52.8→66.5 harness-not-model 的最可引用数据点
- [[stanford-meta-harness]] —— Layer 1 自动化极限证据;TerminalBench-2 超越手工 harness

## 本章对应 wiki 页

- [[concept-harness]] · [[concept-tool-vocabulary]] · [[concept-evaluation-harness]]

---

**第 6 章进入 Part B 的第一柱:session**。Layer 1 读者可以把 Part B 四章当背景略读,或跳到 Part C(两类循环、知识治理、reflexive harness) —— 这些是两层共享的跨时间维度。Layer 2 读者,Ch 6 开始是你的主场。
