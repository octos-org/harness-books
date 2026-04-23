# 第 7 章 · Harness 是可替换的调度脑干

> **Session 立住了,谁去消费它?**
> 答案是 harness。但如果你把 harness 写成一个"会记事" 的东西,你就把上一章所有工作废掉了 —— 因为事实会悄悄漏回进程里,河又被削成了桶。

## 开场:Lance Martin 那一次"shell 进容器"

2026 年春天的某一天,Anthropic Labs 的 Lance Martin 接到一条客户反馈:"我们在你们这里跑的一个 agent 昨天半夜卡住了,能不能帮我们看一下?"

Martin 翻了翻,这个 agent 跑在 Managed Agents 的早期版本上。所谓"早期版本",指的是当时 session / harness / sandbox **塞在同一个容器里**的那个版本。他想查卡住的原因,需要读 session 日志;session 日志不在外部存储,在容器的本地文件系统里;要读它,他**必须 shell 进那个容器**。

那是客户的数据容器。里面是客户 agent 跑过的所有事情 —— 它访问过的网页、它写过的文件、它在 scratch 里思考的半成品。

Martin 当时的动作很简单 —— 打开终端、`kubectl exec -it` 进去、`cat` 一下日志。从"修复 agent" 的视角看,他只是想帮客户查一个 bug。但从合规、隐私、安全审计的视角看,**那一次 `exec` 本身就是一次事故**。工程师不应该为了"帮客户查 bug" 这件事就有权 shell 进客户的数据容器,这是一条明显的权限越界。

客户没有责备他。事实上这件事在事后的复盘里才被认出来 —— 当时大家都觉得这是"合理的工程操作"。但复盘时 Martin 的团队问出了一个更根本的问题:**为什么修一个 agent bug,我们必须 `exec` 进去?**

答案只有一句:**因为 harness 和 session 绑在了同一个进程里**。harness 没有独立出来,session 没有独立出来,sandbox 也没有独立出来。它们三件事糊在同一个容器里,任何一件出问题,都只能从里面查。里面是客户数据。所以每一次 bug fix 都是一次合规事故。

那一次"shell 进容器" 的动作,变成了本书 Part B 第二柱的起点。Anthropic 团队后来把这个 hard-won lesson 写进了 [[anthropic-managed-agents]] 的那篇 blog,并给糊在一起的那种 harness 起了一个运维圈里的老名字 —— **pet**。

这一章剩下的全部篇幅,都是在讲**怎么不要再 shell 进去**。

## §7.1 pet 问题的四个象限

运维圈里 pet 和 cattle 是一对老词。pet 是那种"每一台都有自己特殊性格、崩了要小心伺候" 的机器,cattle 是"可替换、可抛弃、有问题就换一头" 的机器。十五年前这对词用来讲服务器,现在它原封不动地用来讲 harness。

Anthropic 团队在复盘里把"pet harness" 的典型症状拆成了四个象限 —— 四件互相独立又互相加强的坏事。任何一个生产 agent 系统里,只要 harness 写成了 pet,这四件事里至少有三件会同时发生:

**象限一 · 崩了就丢。** 容器崩 → session 跟着丢。事实流没了,agent 从零重来。这是最显眼的一种症状 —— 用户在前面跑了两小时,back-end 一个 OOM 或者一次 pod restart,两小时灰飞烟灭。用户不理解"为什么我上次跟你讲了一小时的事情今天你完全不记得",你也没法解释 —— **解释不出来,因为这件事不应该发生**。

**象限二 · 不可接 VPC。** 客户要求在自己的私有 VPC 里跑,整个架构得重写。因为 harness 绑死了你们的基础设施 —— 它依赖你们的 k8s、你们的日志栈、你们的 secret manager、你们的监控 pipeline。客户那边没有这些东西,也不会为了一个 agent 产品专门去搭。结果是这类客户要么谈不下来,要么为他们做一个 fork,维护成本翻倍。

**象限三 · debug 要 `exec`。** 这一条就是本章开场那个故事。工程师要查 bug,必须 shell 进用户数据容器。**这本身就是合规事故** —— 它在医疗、金融、基础设施这些受监管的行业里根本过不了 security review。HIPAA / SOC 2 / ISO 27001 / EU AI Act,每一个都会在这个点上卡住。

**象限四 · 客户自管难。** 这一条是前三条的合并放大:客户即便愿意在自己的基础设施里跑,他们也维护不起来。harness 有本地状态 = 客户每次部署都要接管一整套运维:崩了怎么恢复、升级怎么做滚动替换、事故怎么复盘、两个实例怎么不互相踩。每一件事都是一次"pet 的护理"。客户不是你们的 DevOps 团队,他们没法也不应该为一个"产品 feature" 接下这么重的运维负担。

四件事放在一起看,你会发现它们有一个**共同根因** —— **harness 有状态**。因为有状态,所以崩了丢;因为状态绑在你们基础设施里,所以不能下放客户 VPC;因为状态绑在容器里,所以 debug 要 `exec` 进去;因为状态的运维 = harness 的运维,所以客户接不过去。

四象限的所有叶子,都开在**同一根有状态的根**上。

想象你是 Anthropic 当时的工程师。你看着这四件事,知道修每一件事单独都能修、但都治标不治本。你真正要做的动作是:**把 harness 的状态拔出去**。状态不住在 harness,住在 session。session 独立于 harness 存在,harness 只是一个"从 session 读事件、往 session 写事件" 的轻量级消费者。崩了起一个新的,读同一个 session,继续做。

四象限的所有症状,在"harness 无状态 + session 在场外" 这一拳下同时消解:崩了不丢(状态在场外)、可接 VPC(harness 是个 stateless binary,哪里都能跑)、debug 不用 `exec`(想看 session 直接读场外存储)、客户自管简单(harness 像 HTTP 服务器一样 cattle)。

**Anthropic 的修法不是修 harness,是把 harness 重新定义**。这是第 7 章剩下所有内容的起点。

## §7.2 Harness 的最小接口:三个函数

把上面的 hard-won lesson 落地成代码,**harness 的最小接口只有三个函数**:

- `getEvents(session_id) -> [Event]` —— **从 session 拿历史**。harness 每一轮要做决定时,先读 session。
- `emitEvent(session_id, event) -> ()` —— **向 session 写事实**。agent 每做一步,以事件形式写回去。
- `execute(name, input) -> string` —— **调用某只手**。sandbox / tool / MCP server,在 harness 视角下都是同一个调用接口。

三个函数,不到 50 行签名。但它们同时做到了几件很硬的事:

1. **Harness 不假设工具在哪** —— `execute(name, input)` 的实现可能是本机进程、远程 MCP、k8s 里跑的 sandbox、云函数、别的团队提供的 RPC。harness 不关心,因为它不管。
2. **Harness 不假设设备、OS、模型版本** —— 所有"要做什么" 都是 `getEvents` 的函数结果,所有"结果放哪" 都是 `emitEvent` 的参数。模型变、OS 变、sandbox 变,这三个接口不变。
3. **Harness 崩了可以秒起** —— 因为没有 in-memory state,新进程直接从 session 里 fetch 历史。

你注意到了吗?**这和 Unix 的 `read / write / exec` 几乎一比一**。不是巧合。Ch 4 讲过"围绕昂贵核心搭稳定抽象层" 这个四十年反复出现的模式 —— 编译器、操作系统、中间件、分布式系统,每一代都是同一个套路:**内部可变,接口稳定**。Harness 在 session 层上的三个接口,就是这个模式在 LLM 时代的又一次实例化。四十年前 Ken Thompson 写 Unix 的时候用 `read / write / fork / exec` 四个 syscall 把一整代操作系统的 ABI 钉住;四十年后 Anthropic 用 `getEvents / emitEvent / execute` 三个 harness 接口想把一整代 agent 运行时的 ABI 钉住。两个时代的钉桩手法是一样的。

把这个接口落进一段伪代码,整个 harness 的主循环大概长这样:

```python
# Cattle harness · 无状态、可秒起、可并行消费同一 session
def run(session_id: str):
    while True:
        history = get_events(session_id)                 # 读 session · 场外事实
        decision = model.propose_next(history)           # 纯推理,无副作用
        if decision.kind == "halt":
            emit_event(session_id, Event("halt"))
            break
        result = execute(decision.tool, decision.input)  # 调某只手 · 可能在任何地方
        emit_event(session_id, Event("tool_result",
                                     tool=decision.tool,
                                     sha256=hash(result)))
```

十几行。它把 harness 的全部哲学表达完了。你可以从上往下读一遍,注意几件事:

**没有 `self.xxx = ...` 这样的局部状态**。 `history`、`decision`、`result` 都是函数内的临时变量,循环下一次就忘。这是 cattle 的物理定义:进程被干掉的那一刻,它没有任何"我记得" 的东西,因为它从来没有过。

**随时可以被 kill**。下一次 `run(session_id)` 新进程起来,自动接上 session 的最后一条事件。kill-and-resume 不是 feature,是**结构直接给出的副产品**。

**你可以同时起两个 worker 读同一个 session**。比如一个 worker 扮演 planner,一个扮演 evaluator。它们不会踩彼此,因为**状态全部在场外 —— session 本身是它们的同步点**,不需要额外的锁、不需要 RPC、不需要 message queue。

如果你现在的 harness 比这段代码短、但做的事更多,那你在用**隐式状态** 补模型缺陷(比如在进程里默默 cache 了什么);如果比这段长、做的事不多,那你在写 pet(把本该在 session 层的事悄悄搬进了 harness)。长度不是关键,**每一行属于哪一类** 才是。

下一节讲的就是**哪一类**。

## §7.3 每写一行 harness 代码都要问:补缺陷 vs 守协议

Harness 无状态这件事立住之后,第二个问题立即来:**harness 内部到底该写什么东西?**

本书给出的硬判据只有一句:

> **每一行 harness 代码,都必须能回答 —— 这是在补模型缺陷,还是在守接口协议?**

两类代码表面上都是"让系统更可靠的辅助逻辑",长得像孪生兄弟。但它们的**寿命完全不同**。Ch 4 把这个区分讲过,这一节把它落到 harness 内部的具体案例。

| 一段 harness 代码 | 分类 | 寿命 |
|---|---|---|
| "模型不会规划,所以写死 5 步 DAG" | **补模型缺陷** | 下一代模型会规划 → 拆 |
| "模型会幻觉,所以加 retrieval 强制验证" | **补模型缺陷** | 模型更强 → 冗余 |
| "模型不会压 context,所以写手工 compressor" | **补模型缺陷** | 模型自带 context reset → 废弃 |
| "模型输出 JSON 会多引号/缺逗号,写修复器" | **补模型缺陷** | 下一代 JSON 模式稳了 → 删 |
| "工具权限边界必须守住,写 allowlist 检查" | **守协议** | 永远需要 |
| "session 必须可恢复,写事件持久化" | **守协议** | 永远需要 |
| "verification 必须独立,写 evaluator 隔离" | **守协议** | 永远需要 |
| "tool result 必须可审计,写 sha256 归档" | **守协议** | 永远需要 |

前四行是**赌"模型不会变强"**,后四行是**押"接口要长期稳定"**。前者在 4.5 → 4.6 这一轮升级里已经被证明要拆 —— Anthropic 的同一篇 blog 里提到,他们自己的 harness 在升级之后拆掉了大约 40% 的代码,全都是这一类补缺陷的东西。后者在同一轮里**只增不减**,每一条都活得比任何一次模型升级都长。

**在 harness 里攒技术债的团队,大多是把大量时间写了前四行**,还以为自己在做"健壮性工程"。本章的硬建议是 —— **把每一行上面那张表的分类**写在代码注释里。每一次 code review 都问这个分类问题。超过 40% 的行数落在"补缺陷" 列的 harness,它的**净资产等于零**,因为下一次模型升级你要把它们全部拆掉。

这条判据还有一种更锋利的问法:

> **"如果明天 GPT-6 / Claude 5 发布,这段代码还需要吗?"**

答"不需要" 的那些行,是 pet 式补丁。答"需要" 的那些行,才是接口层真正能复利的稳定投资。你可以把它想成一把钞票过火:补缺陷的那一半一烧就没,守协议的那一半烧完还在 —— 而且下一次同样的火势中,它的相对价值反而更高。

## §7.4 Agent loop 的所有变体,都是 harness 的实例

从 2023 到 2026,几乎每隔几个月就会有一种新的"agent loop 变体" 冒出来:ReAct / Reflexion / Plan-and-Execute / Autoresearch / CodeAct / Deep-Research / Tree-of-Thoughts / 还会继续有。每一种都号称自己"更强" —— 更 general、更稳、更高效、更适合 X 类任务。读者因此被迫反复问同一个问题:**我应该选哪个**?

本章的答案是:**你问错了**。

Agent loop 的变体学,**都是 harness 的具体实例**。ReAct 的 "Thought → Action → Observation" 循环,是 harness 的一种排程方式;Reflexion 的 "Act → Reflect → Revise" 是另一种;Plan-and-Execute 是先 `planner.emit` 再 `executor.emit` 的两阶段;Autoresearch 是 ingest-driven 的长程 loop;Deep-Research 是多源搜索 + 合成的一族 loop。每一个都是对 `getEvents / emitEvent / execute` 三接口的**一种具体用法**。

变体**可替换**,稳定的是它们之间的**接口**:都要读 session、都要写 session、都要 execute 工具。换一个变体,harness 以外的部分(session 协议、tools、verification)**不用改**。

这件事再推一步就很关键了 —— 不仅**人**可以换变体,**agent 也可以**。Stanford IRIS Lab 的 Meta-Harness([[stanford-meta-harness]])用一个 outer-loop proposer 在**源码级别** 搜索 harness 变体:它读取所有历史候选 harness 的源码、分数、执行 trace,据此提议一个新变体,跑、打分、淘汰、再提议。这是一个典型的进化式搜索循环,只是被搜索的对象不是 prompt、不是 weight,是 **harness 的源码本身**。

实测收益:文本分类 +7.7 分、上下文 token 消耗 −75%(同分下)、数学推理 +4.7 分,TerminalBench-2 上超过手工 harness。

这把"可替换" 命题推到了极限。它同时有两层含义:

- **对人可替换** —— 换一个团队成员接手,他能把 ReAct 换成 Autoresearch,harness 以外的东西不动。
- **对 agent 可替换** —— 一个 proposer agent 在源码级别自动演化出新 harness 变体,**超过手工调版本**。

两层都成立的前提是**同一件事**:harness 必须无状态、必须在稳定接口后面。接口不稳,既换不了人、也换不了 agent —— 因为每换一次都要跟着改 session 协议、改 tools、改 verification,代价指数级上升。接口稳了,换谁都一样,换多少次都不痛。

这里要小心一个术语混淆:Stanford 和 Anthropic 都在用 "meta" 这个词,但他们指的不是同一件事。[[anthropic-managed-agents]] 的 meta-layer 是**稳定接口的 meta**,设计者是人类平台工程师,承诺的是"接口几十年不变";它的优化目标是可复用、可问责。[[stanford-meta-harness]] 的 meta-layer 是**自动搜索的 meta**,设计者是一个 proposer agent,每任务重新搜一遍;它的优化目标是单任务最优性能。

两者**正交**,不是互斥 —— Anthropic 钉住稳定接口,Stanford 在稳定接口的内部做自动搜索。前者是地基,后者是地基上的房子。地基不稳,你没法在上面盖房子;地基稳了,你甚至可以让房子自己长出新造型。

所以"我该选哪个 agent loop 变体" 这个问题,本质是问错了尺度。正确的问题是:**我的 harness 接口够不够稳,稳到换一种 loop 变体,我不需要改 session 协议、不需要改 tools、不需要改 verification?** 接口够稳 —— 换谁都行。接口不稳 —— 你选哪个 loop 都救不了。

## §7.5 "Many brains, many hands" 的调度含义

[[anthropic-managed-agents]] 里有一句图景式的表述 —— **Many brains, many hands**。一个 brain 调度多只手;多个 brain 并行消费同一 session。这幅图景之所以成立,**完全依赖 harness 无状态** 这件事。

想象一个生产场景:一家工程团队让 agent 长周期地开发一个 web 应用。架构上长这样:

- 一个 **Planner brain** 读 session,提出下一个 sprint 的目标,emit 一条 `sprint_contract` 事件。
- 一个 **Generator brain** 拿 sprint 目标、读 session 里的相关代码事件,生成代码 diff,调用 sandbox (**hand 1**) 跑 build + test,emit 产出事件。
- 一个 **Evaluator brain** 独立读 session,拿 Generator 的产物,在一个隔离的 Playwright sandbox (**hand 2**) 里跑验收,emit `verify_check` 事件。

三个 brain 共享**同一条 session**,但各自无状态,可以独立重启,可以独立替换 —— 明天你把 Planner 换成 Claude 5,Generator 和 Evaluator 不用改一行。你甚至可以让两个 Evaluator 并行跑(一个跑功能、一个跑视觉),他们不会踩彼此,因为它们都只 append 事件,不修改已有事件。这是**场外事实流** 做为同步原语的天然好处。

[[anthropic-harness-design]] 里那个能跑四小时的三 agent 架构(planner / generator / evaluator),就是这个图景的一次工业级实证。retro game maker 的 benchmark 里,solo Claude 跑 20 分钟出 $9 的活,三 agent 架构跑 4 小时、花 $80、产出生产级的结果 —— 两者同一个模型,差的全是 harness。三 agent 能跑 4 小时的前提,**全在于 harness 无状态 + session 外置** 这个分层。没有这一层,协作成本会指数增长,必须加同步机制、加锁、加 RPC。

所以"多脑多手" 不是一个市场话术,是一个工程事实。它之所以成立,是因为 brain 和 hand 之间解耦了 —— 多个 brain 共享一条 session,每个 brain 调自己需要的 hand,各自没有历史、只看 session,谁崩了谁起。没有 session + stateless harness 这对组合,这件事做不起来。

Ch 14 会把"many brains, many hands" 讲成本书的终局愿景,整本书结构上要到最后一章才展开。但它的**工程前提**完全在这一章 —— **harness 无状态**。Ch 14 要做的只是把这个前提发挥到它应有的图景。没有这一章,Ch 14 的图景是空中楼阁。

## §7.6 Harness 不是一个人写的,是多年积累的

再讲一件事,免得读者合上这一章后以为"harness 是一个人、一个季度能写完的东西"。**它不是**。

一个生产级的 harness,是团队**多年积累**的工程资产 —— 它不是代码仓库里几千行 Python,是包含 session 协议、tool 权限矩阵、verification 接口、observability 管线、failure mode 博物馆的 playbook 的一整套东西。每一项都有血的教训在后面。

**harness 的价值是复利的**。每一次踩坑、每一次事故、每一次模型升级后的清理,都把 harness 又稳住一点。一个写了三年的 harness 和一个写了三个月的 harness,看代码行数可能差不了多少,但**前者里每一行都是事故复盘的结晶,后者里每一行都还没被应力测试过**。这不是比喻 —— Ch 13 失败模式博物馆讲的就是"把事故变成 harness 资产" 的方法论。博物馆不是为了追溯旧痛,是为了让下一次事故不会再踩同一个坑 —— 而避免的方式,就是把教训写进 harness 代码、写进 spec、写进 verification 规则。

这也是为什么本章的判据非常重要:如果你在 harness 里大量攒了"补模型缺陷" 的代码,那你攒的不是复利,是**每一次模型升级都要归零的负利**。攒对了类 —— 守协议 —— 那 harness 在每一次模型升级后**变得更值钱**,因为同一个稳定接口上能跑更多、更复杂、更关键的 agent。

## §7.7 Pet vs Cattle 对比表

本章到这里,可以把 pet 和 cattle 两种 harness 哲学放进同一张表做最后的对比:

| 维度 | Pet Harness | Cattle Harness |
|---|---|---|
| 状态位置 | in-memory 本地 | 外部 session |
| Crash 恢复 | 重启 = 重来 | `wake()` 秒起 |
| 并行性 | 多实例会冲突 | 多实例共享 session 无冲突 |
| 客户 VPC 部署 | 绑死你的基础设施 | 任意 VPC 都能跑 |
| 调试 | 需要 shell 进容器 | 读场外 session 即可 |
| 升级 | 停机窗口 | 滚动替换 |
| 对 agent 搜索开放 | 否(状态与代码耦合) | 是(Stanford Meta-Harness 的前提) |
| "补缺陷" 代码占比 | 通常过半 | 必须降到最低 |

如果你现在的 harness 在左列占了三项以上,那你在造 pet。造 pet 短期更快(因为不用设计接口),长期更慢(因为每一次变化都是重新手作)。本书的完整立场 —— 从 day 0 就把 harness 做成 cattle,即使开头看上去像过度工程 —— 因为它是 session 之后,agent 系统第二项能复利的工程资产。

**你愿不愿意从 day 0 就做成 cattle**,可能是 2026 年 Layer 2 团队之间最大的分水岭。做对的那些团队,两年后会有一个"在任何 VPC 里秒起、谁都能来 debug、谁都能接手、可以被 agent 自己改进" 的 harness,它的价值每一次模型升级都在膨胀。做错的那些,两年后会有一个"每次模型升级要重写一半、客户只能选你们的 cloud、debug 要 oncall 工程师 shell 进去" 的 harness,它的价值每一次模型升级都在流失。

两年累计下来,两边差的不是一倍。

## §7.8 回到 Lance Martin 那一次 `exec`

本章开场那一次 `kubectl exec`,现在可以用一整章的语言重讲一遍。

那一次 `exec` 的成本不是"半小时的调试时间",是**一次合规事故 + 一次架构债务的利息**。合规事故是工程师有了不该有的权限,架构债务是 harness 和 session 糊在同一个容器里所以只能这么修。两件事的根都是**harness 有状态**。

Anthropic 的修法不是"以后别 exec 了",是**让 exec 变得没必要** —— 把 harness 无状态化,把 session 搬出去。之后的工程师再 debug,读的是场外 session 存储,不需要进任何客户数据容器;事实上,**他甚至不需要和客户的基础设施建立任何连接**。session 是纯数据,可以被导出、被 audit、被另一个 agent 作为输入,不涉及任何与客户容器的交互。

你读到这里,应该能把"harness 无状态" 从一句抽象原则翻译成一个具体的合规-运维-架构三重收益了:

- 合规:没人需要 shell 进客户容器 → HIPAA/SOC 2/EU AI Act 全部过关。
- 运维:harness 是 cattle,崩了起一个新的,客户不用接手运维负担 → 客户能在自己的 VPC 里跑。
- 架构:harness / session / sandbox 三件事解耦 → 每一件可以独立升级,可以独立替换。

这三重收益合起来,就是 Anthropic 2026 年之所以敢说"我们把 agent 卖进客户 VPC 了" 的**物理基础**。它不是市场话术,是 Martin 那一次 `exec` 之后的四个月里,团队在架构层做的一次硬拆分。

同样的拆分,每一个做 Layer 2 agent 产品的团队都要自己做一次。**做得越晚,`exec` 进过的次数越多,以后要付的合规利息越厚**。

## 可观察信号

- **kill 掉 harness 进程再起一个新的,session 能不能从上一个事件继续**?能 = cattle;不能 = pet。
- 升级模型一代(比如 Sonnet → Opus),你的 harness 要改**多少行**?改的那些行里,有多少是"补缺陷"、多少是"守协议"?
- 把 agent loop 从 ReAct 换成 Plan-and-Execute,**harness 以外的部分要改多少**?改得越多,说明接口越不稳。

## 本章核心论断

1. Harness 必须**无状态** —— 状态住在 session,harness 是 cattle,不是 pet。Pet 四象限(崩了丢 / 不可接 VPC / debug 要 exec / 客户自管难)共用同一根有状态的根。
2. Harness 的最小接口只有三个:**getEvents / emitEvent / execute**。类比 Unix 的 read/write/exec,不是巧合 —— 是"稳定抽象围昂贵核心" 模式的又一次实例化。
3. 每写一行 harness 代码都要问:**补模型缺陷 / 守协议**。前者是技术债,模型升级就要拆;后者是稳定投资,每一次升级都更值钱。
4. Agent loop 的所有变体(ReAct / Reflexion / Plan-and-Execute / Autoresearch / CodeAct)都是 harness 的具体实例,可替换。**"可替换"有两层含义:对人可替换(Anthropic),对 agent 也可替换(Stanford Meta-Harness 的源码级搜索)** —— 两层的前提是同一件事:harness 无状态 + 接口稳定。
5. Brain-hand 解耦是**many brains, many hands** 的工程前提 —— Ch 14 终局愿景的物理基础,全在这一章。做对这一章,你在 Ch 14 的任何一段都不用再操心架构成立性。

## 本章奠基文对齐

- [[anthropic-managed-agents]] —— pet vs cattle、wake(sessionId)/emitEvent(id,e) 原接口、brain-hand 解耦
- [[openai-harness-engineering]] —— "harness 移上一层" 的立场声明
- [[fowler-on-harness]] —— harness 内部的 guides + sensors 治理、Agent = Model + Harness 等式
- [[stanford-meta-harness]] —— "可替换" 的极限:agent 自动搜索 harness 变体

## 本章对应 wiki 页

- [[concept-agent-loop]] · [[concept-harness]]

---

**Harness 负责调度,自身不记事**。第 8 章把焦点转向 **harness 调度的那些"手"** —— 工具词汇表。工具是 agent 能作用于世界的全部边界,也是事故最常发生的地方。Harness 是脑干,session 是档案,tools 是**手**;三者合起来,agent 这个工程对象才真正有了肉身。
