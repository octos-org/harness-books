# 驾驭工程

## 驾驭工程：从灵光一闪的天才到稳定输出的 AI 软件工厂

日期：2026-04-22  
读者：coding agent / agent 平台维护者、skill 开发者、平台操作员、技术负责人

---

## 前言：为什么需要这本书

如果把过去一年里最有代表性的几类系统放在一起看，无论是 Claude Code、Codex，还是 OpenClaw、Hermes，都在证明同一个硬事实：强模型加提示词技巧，可以在演示里显得很聪明；但一旦进入真实流量、长任务、页面重载、多会话和多工具并发，瓶颈就会从“回答质量”迅速转移到“控制系统质量”。

这本书记录的是把这种模式推向工厂化姿态的驾驭工程经验：

- 确定性的任务生命周期
- 持久化的契约状态
- 类型化的进度/事件 ABI
- 由验证器把关的完成状态
- 可回放的 UI 事实
- 操作员可见的失败原因

这些经验并不抽象。Claude Code 和 Codex 提供了比较成熟的正向样本，OpenClaw 和 Hermes 提供了更广义 agent product 的相邻样本，而本文掌握的一组内部失败案例则提供了反证：后台任务进度漂移、`run_pipeline` / `deep-search` 状态不一致、会话污染、产物契约缺口、验证器不完整，以及操作员盲区。本书会反复对照这些系统，不是为了做产品测评，而是为了说明同一个模式会怎样在不同系统表面重复出现：瓶颈不是模型，而是控制系统。

目标不是架构洁癖。目标是在模型、网络、插件、浏览器标签页和用户行为都很混乱的情况下，仍然能得到可靠结果。

这本书只试图把一条论证链讲清楚：LLM 之所以需要 harness，不是因为它“不够强”，而是因为长任务里的质量、成本、时延和状态一致性都会在离开最佳工作区间后迅速恶化；一旦系统要跨会话、跨工具、跨时间地行动，就必须把状态、验证和回放从 prompt 外移到运行时契约里。后文所有案例、事故、架构和路线图，都是在展开这条主线。

这本书的写法有一个明确取舍：不按资料来源分章，也不把历史稿本当旁白，而是沿着当前提纲，把两层驾驭工程、OpenAI 1M LOC 案例、`AGENTS.md` 分层、四支柱、长程循环、skills 晋升和“多脑多手”组织方式这些关键论证，放进同一条主线里重新组织。整本书的目标不是复述某个系统的实现细节，而是提炼出一套可迁移的 harness engineering 方法。

---

## 0. 全书地图与阅读指南

这本书围绕一条明确主线展开，但主分析线并不围绕某个具体产品品牌。它把前沿样本、失败案例、架构总结、路线图和附录压成一个连续论证，让读者在一个地方看清从根因到落地的完整链条。

### 0.1 先抓住这本书的主线

为了避免章节多了以后主线发散，可以先把全书逻辑压成七步：

1. LLM 的底层能力来自条件生成：它擅长在给定上下文里生成高质量候选，但它本身不是状态机、操作系统、数据库或验证器。
2. 一旦任务跨越长时间、多工具、多会话，目标保持、上下文选择、副作用隔离、事实持久化和结果验证都会离开单轮 prompt 能解决的范围。
3. Agentic AI 的出现，本质上是给 LLM 补上感知、行动、反馈、记忆、工具和人类控制边界，让模型从“回答器”进入“闭环执行体”。
4. 从 cache system 看，harness 要管理工作集、分层记忆、准入和驱逐；从放大器系统看，harness 要用负反馈、限幅和锁存，让模型维持在可预测的工作区间。
5. Claude Code、Codex 这类成熟样本说明，真正的产品化 agent 不是一个更长的 prompt，而是一套包含事实流、权限、工具、compaction、session、sub-agent、验证和操作员面的控制系统。
6. 一组真实失败案例反向证明：系统一旦把“类似聊天的输出”误当成“运行时事实”，就会出现进度漂移、会话污染、产物错交、验证失效和操作员盲区。
7. 因此解法必须围绕 session、harness、tools、verification 四支柱展开，并沉淀成原则、路线图、清单和边界说明，避免系统只会“偶尔成功”，却不能稳定交付。

### 0.2 这本书适合谁

- 需要稳定运行时事实、而不是演示级行为的 coding agent / agent platform 维护者
- 需要进度、产物、验证契约的 skill / app 开发者
- 需要不靠聊天文本猜测失败模式的平台操作员和技术负责人

### 0.3 推荐阅读顺序

- 线性路径：按顺序阅读第 1 到第 14 节
- Layer 1 路径：重点读第 1、2、3、5、10、11、13、14 节
- Layer 2 路径：重点读第 1、2、3、6、7、8、9、12、13 节
- 按角色路径：使用文末附录中的负责人、架构师、CTO 和研究者阅读路线

### 0.4 这版书稿的组织方式

- 面向中文工程读者的紧凑前置说明
- 奠基文本、系统样本和研究材料的源文本附录
- 四根 harness 支柱的自查矩阵
- 贯穿全书的核心术语表
- 按角色组织的阅读指南和研究轨迹

核心弧线改成更清楚的交替节奏：第 1 节只建立理论底座，讲 LLM 工作机理、agent 概念演化、控制论、cache、负反馈和最佳工作区间；第 2 节立刻进入 Claude Code、Codex、OpenClaw、Hermes 这些成熟实践样本；第 3 节用真实失败案例反证理论为什么必要；第 4 节再把理论和样本压成运行时架构；第 5 到第 8 节按能力平面、回放、操作员面、swarm 继续把理论和实践穿插展开。后续章节则把这些机制收束成原则、路线图、清单和边界。

---

## 1. LLM 是一台什么机器

凡是和 coding agent 长时间打过交道的人，多半都见过同一幕：开场它像个天才——读懂需求、写出利落的第一版、连你没提到的边角情况都照顾到了；可任务一旦拖长，跨了十几个文件、几十轮工具调用，它会慢慢变成另一个人。先是忘了两小时前你亲口定下的约束，接着把一个早被否决的方案重新端上来，最后用一种毫不动摇的语气，把一段根本跑不通的代码交到你手里，还附赠一句“已完成”。

奇怪的是，这中间模型并没有变笨。同一个权重、同一个温度，它在一个短问题上依然才华横溢。变的不是能力，而是它所处的那个区间——它悄悄滑出了自己最擅长的工作带，却没有任何人、任何机制把它拉回来。

要理解这一幕，得先弄清楚这台机器到底是怎么工作的。这一章不假设你有机器学习背景，只把后文反复要用到的几个概念讲透：它读的是什么、信息在它内部怎样流动、它凭什么“记得”上文、又为什么说它本质上是个“会续写自己的概率生成器”。把这台机器看清楚，下一章那条“它必然会在时间和空间上失效”的结论，才不会显得突兀。

### 1.1 它不读字符，读 token

模型并不直接读字符或单词，而是先把输入切成一串`token`——可以粗略理解成“词或子词”，常见的英文单词往往是一个 token，长词或中文则会被切成几块。每个 token 再被映射成一个固定长度的向量，叫它的`嵌入（embedding）`。

对工程师来说，最贴切的类比是：这有点像把每个词“哈希”成一个高维空间里的坐标点，只不过这套映射是训练出来的，目的是让**语义相近的 token，坐标也相近**。于是“猫”和“狗”离得近，“猫”和“积分”离得远。一段文本进了模型，就变成了一串这样的向量——后面所有运算，处理的都是向量，不再是文字。

### 1.2 一摞相同的层，和一条贯穿其中的“残差流”

模型的主体，是几十层结构完全相同的层，一层叠一层。每个 token 在穿过这些层时，都随身带着一个固定宽度的向量，这个向量被一层层地读取、修改、写回——业界把它叫作这个 token 的`残差流（residual stream）`。

可以把残差流想成这个 token 一路携带的、宽度固定的“工作记忆”：每一层都在它上面叠加一点自己的贡献（像 `x += 这一层算出来的东西`），而不是推倒重来。这里有一个之后会反复回来的关键事实——**这条工作记忆的宽度是固定的**。无论上下文是十个 token 还是一百万个 token，每个位置能携带的信息量都被这条定宽向量卡死。一台容量固定的搬运车，迟早装不下越堆越多的货，这一点会在下一章变成一条硬性的失效机理。

### 1.3 注意力：每个位置如何“看”别的位置

层与层之间最核心的动作，叫`注意力（attention）`。它要解决的问题是：当前这个 token 在更新自己时，应该参考上下文里的哪些其他 token？

机制可以用一个工程师熟悉的结构去想——一次“软的”关联查找（associative lookup）。每个位置都准备三样东西：一个 query 向量 `q`（“我在找什么”）、一个 key 向量 `k`（“我能作为什么样的索引被找到”）、一个 value 向量 `v`（“如果被选中，我交出什么内容”）。当前位置拿自己的 `q`，去和每个被看位置的 `k` 做点积——点积越大，代表越“相关”。这些相关性分数（叫 `logit`）经过 `softmax` 归一化成一组**总和恒为 1** 的权重，最后把各位置的 `v` 按这组权重加权混合起来，就是这一步的输出：

```text
o = Σ_i w_i · v_i ,   其中  w_i = exp(q·k_i /√d) / Σ_j exp(q·k_j /√d) ,   且  Σ_i w_i = 1
```

和普通哈希表的硬查找（key 完全相等才命中）不同，注意力是一次**软查找**：它不挑出唯一一条，而是把所有条目按相关度调成比例，再加权平均。`softmax` 在这里只干一件事——把一串可正可负的实数分数，压成一个“总和为 1 的分配比例”。这个“总和恒为 1”的约束看似不起眼，却是下一章第一条失效机理的源头：注意力是一种**守恒**的资源，盘子就那么大，看的东西越多，分到每一样的就越少。

还有一个约束来自任务本身。模型是在“预测下一个 token”，所以在生成时，每个位置只能看它**左边**（已经出现）的 token，看不到右边（还没生成）的——这叫`因果掩码（causal mask）`。它的后果是：信息只能自左向右、一层层向最后一个位置汇聚。这个看似不起眼的方向性，也会在下一章长出一条失效机理。

### 1.4 KV cache：把算过的历史存起来

模型生成文本是一个 token 一个 token 往外蹦的，每蹦一个新 token，它都要回头去“看”前面所有 token——也就是要用到前面每个位置的 `k` 和 `v`。如果每生成一个新 token 都把整段上文的 `k`、`v` 从头算一遍，代价会随长度平方级地涨上去。

工程上的对策很直接，也是每个工程师都熟悉的招：把算过的结果缓存下来。模型把每个位置一次性算好的 `k`、`v` 存进一块缓存，后续每一步直接复用——这块缓存就是常被提到的 `KV cache`，本质上是一次跨步的 memoization（增量计算）。

这里要记住两件后文要用的事。其一，**KV cache 是模型对“过去”的唯一留存**：跨越生成步骤，它对上文的全部记忆，就是这块缓存里躺着的一条条 `k`、`v`；模型并没有另一个数据库或状态机替它记着什么。其二，**这块缓存随上下文长度线性增长**：上下文越长，要存的 `k`、`v` 越多，占的显存越大——这条成本曲线，正是后面“百万上下文为什么要靠压缩去硬撑”的根源。

### 1.5 自回归：它在反复“续写自己”

把以上拼起来，就得到这台机器的工作循环：给定当前上下文，模型算出一个“下一个 token 的概率分布”，从中采一个 token，接到上下文末尾，再以这条更长的上下文为条件，预测再下一个——如此反复。这种“拿自己刚生成的输出，当作下一步的输入”的模式，叫`自回归（autoregressive）`。

对工程师来说，这里最该警觉的一点是：**它是一个把自己输出回灌进自己输入的反馈回路**。这意味着它生成的每一个 token，无论对错，都会变成后续所有 token 必须依从的“既成事实”。短问题里这没什么；可一旦链条拉长，这条回路会让早期的小偏差被一路放大、供养——这条性质会在下一章变成一类“延长上下文也救不了”的失效。（采样时还有个“温度”参数控制随机性：温度越高越发散、越低越保守，但它不改变上面这条反馈回路的本质。）

### 1.6 两个会一直用到的硬件类比：缓存与放大器

在进入失效分析之前，先借两个来自硬件世界的老概念，它们会贯穿这一部分的三章，是后面所有直觉的来处。

第一个来自计算机体系结构里的**缓存层级**。现代 CPU 旁边有几级容量递增、速度递减的存储：最贴近运算单元的是又小又快的 L1，往外是 L2、L3，再往外才是又大又慢的主存。机器跑得快，靠的不是把所有数据都塞进最快那层（也塞不下），而是一条朴素的经验规律——程序在一段时间里往往反复访问同一小撮数据，这叫“局部性（locality）”。于是只要把当前用得着的那一小撮“工作集”放进最快层，整体吞吐就高且可预测；一旦工作集散掉、频繁去慢层取数，性能就断崖式下跌。一句话：**决定性能的不是“你总共有多少内存”，而是“你有没有把对的东西放进最快的那一层”。**

第二个来自模拟电路里的**放大器**。一个三极管放大器的本职，是把一个微弱的输入信号放大成一个更强的输出，放大的倍数叫“增益（gain）”。但它只在一段被称作“线性区”的输入范围内，才能让输出忠实地、不失真地跟随输入；一旦输入太强、越出这段区间，输出就会“削顶”或“饱和”——波形顶部被硬生生削平，信息失真，这时增益再大也没意义。成熟的放大器设计因此往往不追求最大裸增益，而是宁可牺牲一部分增益，换取更宽、更稳的线性区。这个“宁可牺牲增益换稳定”的取舍，到第 3 章会变成理解 harness 的钥匙。

这两个概念都在讲同一件事：**资源有限的系统，只在一段有限的区间里保持高保真。** 缓存讲的是空间维度上的工作集，放大器讲的是不失真的稳定带宽。记住它们，下一章会看到 LLM 同时落在这两条约束之下。

### 1.7 小结：一个强大的条件生成器，不是状态机

把这一章收束成一句话：**LLM 是一个高能力的条件生成器**——给定上下文，它生成下一段高概率、高相关性的文本或动作。它能吸收海量语言、代码、工具调用和领域知识，在很短时间里给出像样的候选解释、计划、代码和产物。

但从系统角度看，它**不是**状态机、不是操作系统、不是数据库、也不是验证器。这个区分，本书会反复用到：它可以在当前上下文里“看起来记得”某条约束，却并不天然拥有持久事实（§1.2 那条定宽残差流和 §1.4 那块会被挤占的 KV cache，决定了“记得”只是暂时的影子）；它可以生成一条 shell 命令，却不知道这条命令是否越权、是否毁掉工作区、是否波及另一个会话；它可以说“完成了”，但这句话本身并不等于产物存在、测试通过、用户目标达成。开篇那个“自信地交付跑不通代码”的 agent 并不是在撒谎——它只是没有任何器官，能区分“说出口的完成”和“被证据证实的完成”。

正因为它是条件生成器，它的强项和弱项来自同一件事：上下文切片合适、目标明确、反馈短而可验证时，它聪明得惊人；可一旦上下文过长、目标漂移、工具副作用复杂、反馈延迟拉长，它就会把“概率上的连贯”误当成“运行时的事实”。它有一段最擅长的工作区间——而这段区间的边界在哪、为什么必然存在，正是下一章要拆开的事。

## 2. 时空失效：工作区间为什么必然存在

第 1 章末尾留下一个说法：LLM 有一段最擅长的“工作区间”，离开它，质量就开始飘。这一章要把这个说法钉死成一条结论——**有效工作区间的存在，是 transformer 加自回归这套架构在有限算力与显存预算下的数学必然，而不是“模型还不够好、以后会修好”的暂时缺陷。** 讲透机理很重要，因为后文每一项 harness 能力，都是对其中某一条失效机理的对症补偿；不先讲清楚模型天然缺什么，harness 就会被误读成一袋经验技巧。

### 2.1 一个统一视角：自回归是一个有限预算的时空滤波器

把第 1 章 §1.6 那两个硬件类比收束成一句话：**自回归加 attention，本质上就是一个有限预算下的时空滤波器。** 它对“位置远”（空间）和“时间旧”（时间）的信号都会衰减——就像一束光打在越来越宽的舞台上必然越来越暗，又像一段话经过越来越多人转述必然越来越走样。缓存讲的是空间维度上的工作集，放大器线性区讲的是不失真的稳定带宽，而 LLM 同时落在这两条约束之下。下面把“空间”和“时间”两条轴分开拆解。

### 2.2 空间轴：位置越远，有效敏感度越低

沿着上下文的方向，有好几条机理在同时压低远端 token 的有效权重，它们叠加起来，才让“窗口不平坦”成为必然。

最直接、也最接近纯算术的一条，是 softmax 带来的**稀释**。回忆第 1 章 §1.3：注意力的权重总和恒为 1——这意味着注意力是一种“守恒”的资源。打个比方，一位老师的目光总量是固定的一份：台下五个学生时，每张脸都照顾得到；台下五百人时，同一份目光摊到每个人身上，几乎落不下什么。模型也一样，窗口里有 `n` 个 token，平均每个只分到 `1/n`。要让模型把目光牢牢压在某一个远端关键 token 上，它的 logit 就得显著高过其余——具体地，要把那个 token 的权重抬到 `p`，它的 logit 需要比其余高出大约 `ln[(n−1)·p/(1−p)]`，也就是随 `n` 大致以 `ln n` 的速度增长。可 logit 不能想多大就多大：它正比于 q、k 两个向量的点积，而现代模型为了训练稳定，会用 RMSNorm、QK-Norm，乃至 Kimi 报告里专门设计的 QK-Clip 把它压住——不压的话，attention logit 会冲到上千量级、训练直接发散。于是 logit 的可达差距被一个与 `n` 无关的常数 `G` 卡死，单个 token 能拿到的最大权重大约是 `w_max ≈ e^G / (e^G + n − 1)`，随 `n` 增大不可避免地趋于零。结论几乎是算术而非调参：**窗口越满，对任意单个远端证据的“最锐检索”就越弱。**[^softmax-dilution-ch2][^bounded-logit-ch2]

与这条稀释叠加在一起的，是位置编码本身带来的**距离衰减**。今天主流的位置编码叫 RoPE，它的做法是给每个位置的 q、k 旋转一个与“第几个 token”相关的角度，从而把位置信息编码进去。这种旋转有一个数学副作用：两个 token 离得越远，它们 q、k 内积的上界就越低——也就是说，距离本身就在替模型“调暗”远端。更麻烦的是，一旦上下文长度超出训练时见过的范围，这些旋转角度会“退相干”，外推直接失效。需要诚实地补一句：这条距离衰减的严格证明假设了 q、k 是常向量，真实情况下它更像一个先验偏置而非铁律——但偏置的方向是确定的。[^rope-decay-ch2]

再往深一层，是一个容量问题。还记得第 1 章 §1.2 说过，每个 token 的残差流是**定宽**的吗？这条固定宽度的向量，要同时承载整段上下文里与当前 token 相关的所有信息。由信息论，一个定宽的状态无法无损地保存无界的上下文——越旧、越远的细节，越会被后来的信息压缩、覆盖。这正是第 1 章 §1.7 那句“看起来记得、却没有持久事实”在数值层面的根：模型并没有真的把某条约束写进某个寄存器，只是在当前这薄薄一层表示里，暂时还留着它的影子。

最后一条藏在“多层”这个结构里，业界借用图神经网络的术语叫它 `over-squashing`（过度挤压）。要把一个远端 token 的信息送到“当前预测位点”，得跨越很多层注意力；而由于第 1 章 §1.3 讲的因果掩码——每个位置只能看它左边的 token，信息只能自左向右、层层向最后一个位置汇聚——逐层的 softmax 平均会把任何单一来源指数级地稀释掉，以致两段本来不同的长输入，会在最后一个位置的表示上坍缩成几乎一样（低精度浮点会让情况更糟）。这解释了一个反直觉的现象：在长上下文里，“计数、复制、精确区分”这类看起来最简单的任务，反而最先退化。[^oversquash-ch2]

把这几条叠起来，§2.4 将给出的经验现象——U 形偏置、NoLiMa 等——就有了机理解释：**上下文窗口不是一块平坦内存，它的“有效分辨率”从光标附近向远处递减。**

而工业界已经把这条“非均匀分辨率”直接做进了架构。为了在百万 token 上还付得起算力（还记得第 1 章 §1.4 说 KV cache 随长度线性涨吗），新一代模型干脆不再对全程做均匀的全注意力：滑动窗口注意力是字面意义上的矩形窗，窗外直接置零；线性注意力与状态空间模型（如 MiniMax 的做法）是字面意义上的指数衰减核；而 KV 压缩（DeepSeek V4 的 CSA 与 HCA、Kimi 的 MLA）则是有损降采样——近端最近的 token 保留高分辨率、不压缩，越往远端、KV 被聚合得越狠：CSA 把每 `m` 个 token 压成一条，HCA 把每 `m′`（远大于 `m`）个 token 压成一条。换句话说，**所谓“1M context”不是一条处处等价的传送带，而是一组分辨率非均匀的滤波器：近端清晰，远端只剩轮廓。** 这件事意味深长：连最有动机把窗口吹大的模型厂商，自己也在用压缩偷偷换取那个标称的容量上限。[^nonuniform-kv-ch2]

这里要专门强调一句，免得读者误以为“换个更强的闭源前沿模型就没事了”：**闭源前沿也不例外。** 第三方的系统评测（如 Chroma 对 18 个前沿模型做的 *Context Rot* 测试）显示，每一个模型都在每一个长度增量上掉点；前沿模型只是衰减得更缓，而非豁免。更说明问题的是，lost-in-the-middle 和干扰项导致的退化，在大概率使用全注意力的模型上照样出现——这说明它来自上面那几条基本面的“地板”，而不只是压缩作弊。Anthropic 自己的工程文档也直说，context rot 在远未触达容量上限时就已经开始。这是个该让团队清醒的事实：你买到的从来不是一块平坦的百万格内存，而是一段中心清晰、边缘发虚的视野。[^context-rot-ch2]

### 2.3 时间轴：时间越旧，有效敏感度越低

长任务的失效看起来是个“时间”问题——跑得越久越偏——但要拆成两半才讲得透：一半可以归约成空间问题，另一半不可约。

先说可约的那一半，姑且叫它**记忆老化**。第 1 章 §1.4 交代过，模型对“过去”的唯一留存就是 KV cache，除此之外并没有别的跨步状态——所以“k 步之前的事还记不记得”，等价于“那个 token 还在不在窗口里、当前 token 还 attend 得到它吗”。随着生成一步步推进，一个旧事实与当前光标之间的相对距离单调增大，于是它就按上一节的几条空间机理被衰减，最终被窗口截断、被压缩、或被逐出。所以“随时间遗忘”在机理上就是“随相对距离衰减”——时间问题塌缩成了空间问题。开篇那个“忘掉两小时前约束”的 agent，并不是记性差，而是那条约束在它的视野里一步步退到了边缘。

再说不可约的那一半，叫**误差复合**。还记得第 1 章 §1.5 说自回归是一个“把自己输出回灌进自己输入”的反馈回路吗？即便给它一个完美、无限、均匀的窗口（空间衰减为零），这条回路仍然会让它随任务变长而劣化。这一点最像小孩玩的传话游戏：第一个人说得清清楚楚，传到第十个人嘴里已经面目全非。区别只在于，自回归模型既是传话的人、也是听话的人——它把自己上一句可能说错的话，当成下一句必须遵从的事实。设每一步出错的概率是 `ε`，那么连续 `T` 步全对的概率大约是 `(1−ε)^T`——可靠性随任务长度（horizon）几何式地衰减。再叠加一个被称作 exposure bias 的偏差：训练时模型总是被喂以正确的前缀，推理时却只能以自己越来越偏离分布的输出为条件。换句话说，错误不是被稀释，而是被供养。这一半是反馈回路自身的性质，**延长上下文救不了它**——只能靠降低单步 `ε`、缩短 horizon、引入独立验证、或重采样。

用电路语言收个尾会很干净：一个带反馈的递归系统，有两种相互独立的退化方式——一种是它的“冲激响应”随距离衰减（对应记忆与空间衰减，可约），另一种是它把自己带噪的输出回灌后，噪声在回路里不断累积（对应误差复合，不可约）。对应的补偿，恰好也是两类互补的器件：一类像“锁存器”，把关键事实牢牢锁住、对抗记忆衰减；另一类像“负反馈环”，把错误送回去纠偏、对抗误差复合。这两类器件的电路史——Black 的负反馈放大器、SRAM 的双稳态锁存——会在第 3 章作为 harness 的血统展开；本章先把“为什么必然需要这两类器件”从机理上立住。

这里顺手给出一个后文会反复用到的可操作判据：**把丢失的信息重新塞回光标附近——如果失效被修复了，它就是空间问题，可由上下文工程补偿；如果模型本来就拿到了信息却仍然漂移、越错越多，它就是不可约的时间核，只能靠验证、缩短 horizon 和人在环上来兜住。** 记住这条分界线，后文几乎所有 harness 设计的取舍，都能落到它的两侧。

### 2.4 容量上限不等于有效工作区间：实测印证

上面的机理预测了一个直接后果：同一个上下文窗口，越往远端越不可用。这一节把它落到事实，并给出工程上该怎样对待它。

2024 年初有过一个短暂的乐观时刻。Google 发布 Gemini 1.5，宣布它能在百万 token 的“大海”里，以 99% 的命中率捞出那一根“针”——不少人当时以为长上下文问题就此了结。乐观没能维持多久，因为人们很快意识到，真实任务里要捞的从来不是一根针，而是一把散落各处、还彼此牵连的针。

把这件事摊开看，结论相当一致。Google 自己后续的 long context 开发文档就明确提醒：一旦从“单根针”变成多个待检索的信息点，命中率不再维持那个漂亮的数字，而且会随上下文内容大幅波动。[^gemini15-ch2][^google-long-context-ch2] 学术界给出的信号更直接：*Lost in the Middle* 发现，放在开头或结尾的信息更容易被用上，夹在中间的则明显被冷落；*Found in the Middle* 进一步把这种现象概括成一条 `"U 形注意力偏置"`——这正是上一节那条“有效分辨率从光标附近向远处递减”的曲线，在检索任务上显出的形状。说到底，这是个很有人性的毛病：我们读一篇长文，也总是记得开头和结尾，把中间那段忘得最干净。[^ltm-ch2][^fitm-ch2] 而当任务从“按字面找”升级成“跨段落推理”时，分数会塌得更厉害——NoLiMa 去掉字面匹配线索后，单是在 32K 长度上，就把 GPT-4o 从 99.3% 打到了 69.7%；LongCodeBench 把场景换成真实的代码理解与修复，长上下文能力同样明显变脆。[^nolima-ch2][^longcodebench-ch2] 反过来，也正因为窗口不平坦，Anthropic 的长上下文文档才会给出那个很务实的经验：把长文档放在前面、把问题放在最后，复杂的多文档输入下，回答质量能提升三成左右。[^anthropic-long-ch2]

这些结果合起来说明同一件事：在同一个“1M context”里，不同位置、不同信息密度、不同任务形式的可用性并不均匀。上下文窗口更像一块可寻址的大内存，而不是一条任何位置都等价的理想传送带；所谓“最佳工作区间”，也不是某个固定的魔法数字（比如“128K 最好、256K 开始变差”），而是一条随任务结构变化的工作带宽——在多大范围内，模型还能稳定检索、遵循指令、保持多步推理、避免位置偏置，并让系统在成本和时延上可接受。

### 2.5 小结：把容量上限和有效工作区间分开

因此，工程上必须把两件事分开：一件是**容量上限**，即模型最多能接收多少 token；另一件是**有效工作区间**，即在当前任务形态下，模型还能稳定检索、遵循指令、维持推理链的那一段上下文。前者写在产品规格里，后者才是 harness 真正要经营的对象。结论也随之而来：最大 context 是容量上限，最佳工作区间才是设计目标。一个 agent 系统不该默认“把更多材料塞进窗口”就会更可靠，而应当反过来设计任务——让模型每次只看到更短、更密、更靠近当前决策的证据切片，把状态、历史、产物和验证证据移到运行时的事实流里，再按需调回 prompt。这条原则听起来朴素，却和大多数人对“长上下文”的第一直觉正好相反，它是本书后面所有上下文设计的出发点。

到这里，问题已经摆清楚了：模型在空间和时间上都会失效，而且这是架构层面的必然。下一章回答的，就是该拿它怎么办——那个把模型拉回工作区间的“外层控制系统”，到底是什么、从哪来。

[^softmax-dilution-ch2]: Petar Veličković et al., *Softmax is not Enough (for Sharp Size Generalisation).* 本章在此处使用其关于 softmax 随规模稀释、无法保持锐利选择的结论，来解释注意力质量守恒下的远端稀释；对应第 21 章参考文献 43。
[^bounded-logit-ch2]: 本章在此处使用 Kimi K2 技术报告关于 attention logit explosion 与 QK-Clip 的描述（不封顶时 max logit 越过 1000 量级、训练发散），用来说明 logit 被主动限幅、因此单 token 注意力权重存在与 n 无关的上界；对应第 21 章参考文献 47。
[^rope-decay-ch2]: Jianlin Su et al., *RoFormer: Enhanced Transformer with Rotary Position Embedding.* 本章在此处使用其关于相对距离衰减包络（经 Abel 变换得到）的结论；并按 *Round and Round We Go!* 标注该衰减证明依赖 query/key 为常向量的前提，故宜视为先验偏置；对应第 21 章参考文献 44、45。
[^oversquash-ch2]: Federico Barbero et al., *Transformers need glasses! Information over-squashing in language tasks.* 本章在此处使用其关于 representational collapse 与因果掩码下信息单向汇聚、over-squashing 的分析，来解释长输入中计数/复制/区分类任务的退化；对应第 21 章参考文献 46。
[^nonuniform-kv-ch2]: 本章在此处综合 DeepSeek-V4 技术报告（CSA/HCA 混合压缩注意力、异构与 on-disk KV cache，将近端高分辨率与远端激进聚合并置）与 MiniMax M3（MSA 稀疏/线性注意力）的做法，用来说明工业界以非均匀分辨率换取百万级容量上限；对应第 21 章参考文献 48、49。
[^context-rot-ch2]: 本章在此处综合 Chroma *Context Rot* 对 18 个前沿模型在各长度增量普遍退化的测试，以及 Anthropic *Effective context engineering for AI agents* 关于“context rot 在远未触达容量上限时即开始”的说明，用来支撑“闭源前沿也不例外”；对应第 21 章参考文献 50、51。
[^gemini15-ch2]: Google, *Introducing Gemini 1.5, Google's next-generation AI model.* 本章在此处使用其关于 NIAH 命中率、1M context pricing tier 与时延预期的表述；对应第 21 章参考文献 14。
[^google-long-context-ch2]: Google AI for Developers, *Long context.* 本章在此处使用其关于 performance variability、retrieval-cost tradeoff 与 caching 的说明；对应第 21 章参考文献 15。
[^ltm-ch2]: Nelson F. Liu et al., *Lost in the Middle: How Language Models Use Long Contexts.* 本章在此处使用其关于长上下文位置偏置与中段退化的结果；对应第 21 章参考文献 11。
[^fitm-ch2]: Cheng-Yu Hsieh et al., *Found in the Middle: Calibrating Positional Attention Bias Improves Long Context Utilization.* 本章在此处使用其关于 `"U-shaped attention bias"` 的分析；对应第 21 章参考文献 12。
[^nolima-ch2]: Ali Modarressi et al., *NoLiMa: Long-Context Evaluation Beyond Literal Matching.* 本章在此处使用其关于 32K 条件下模型退化统计，以及 GPT-4o 从 99.3% 降至 69.7% 的结果；对应第 21 章参考文献 16。
[^longcodebench-ch2]: Stefano Rando et al., *LongCodeBench: Evaluating Coding LLMs at 1M Context Windows.* 本章在此处使用其关于代码任务长上下文退化的样例数据；对应第 21 章参考文献 17。
[^anthropic-long-ch2]: Anthropic, *Prompting best practices: Long context prompting.* 本章在此处使用其关于长文档前置、query 后置与约 30% 质量提升的建议；对应第 21 章参考文献 13。

## 3. 控制系统的回应：harness 是什么、从哪来

第 1 章说清了 LLM 是一台什么机器，第 2 章说清了它在时间和空间上为什么必然失效。两章合起来，指向同一个工程结论：一个概率性的条件生成器，必须被一个外层系统持续纠偏，才能在长任务里留在有效工作区间内。这一章回答的就是——这个外层系统是什么、从哪来。

要先把主从关系说明白：**harness 的正当性首先来自第 2 章的失效机理；这一章要讲的控制论、缓存与负反馈历史，是这套控制语言的来源与直觉，而不是另一条独立的证明。** 答案会落到 agentic AI 上：所谓 agentic AI，不是“让模型自己想办法”的浪漫说法，而是给 LLM 搭一个能感知、行动、记忆、验证、恢复、并被人类监督的工作环境；正是这个环境提供的负反馈循环，才是 LLM 能稳定、高效工作的前提。

### 3.1 条件生成器带来的五类系统挑战

第 1 章末尾说过，LLM 是个高能力的条件生成器，而不是状态机。把这样一台机器放进真实工作流后，问题很快就不再是“它能不能回答”，而是几件它天生不擅长的事接连冒出来。最先暴露的是目标保持：用户目标会被拆成一串带依赖、带冲突、带优先级的子目标，模型能把目标复述得很漂亮，却不天然拥有跨小时、跨会话守住目标的机制。紧接着是上下文选择——真实任务的材料远大于窗口，哪些内容常驻、哪些按需加载、哪些压缩成摘要、哪些必须写回事实流，这种取舍不能指望模型临场自觉。再往下是工具副作用：shell、文件系统、浏览器、MCP、外部 API 都会真实地改变环境，而“模型提出一个动作”绝不等于“这个动作就该被执行”。然后是结果验证：生成器天然偏好给出连贯的结论，可连贯并不等于正确，产物到底存不存在、新不新鲜、属不属于当前任务、满不满足业务约束，需要一个独立的判断者。最后是人类控制——用户需要授权、打断、恢复、审计和接管，一个看不懂、停不下、复不了盘的 agent，哪怕短期能把活干完，也很难真正进入生产。

这几类挑战，没有一类是单个 prompt 能彻底解决的。prompt 能提高局部的成功率，却提供不了持久状态、权限边界、工具隔离、回放证据和终态裁决——它们必须进入运行时。

### 3.2 Agent 概念的演化：从自治系统到 LLM 工具执行体

早期的 agent 理论并不是从 LLM 开始的。Franklin 和 Graesser 给 autonomous agent 下的定义，今天拿来当起点依然合适：agent 不是一次性运行的程序，而是会 `"senses that environment and acts on it, over time"` 的系统；他们甚至故意举了个有点刺耳的例子，说一个恒温器也满足这个定义。[^agent-theory-ch3]

这句话初听很“降格”，因为现代人一提 agent，脑子里先冒出来的往往是个会说话、会规划、会调工具的复杂体。但 Franklin / Graesser 的用意恰恰相反：他们想提醒我们，别把 agent 的本体误认成它语言的表面。只要一个系统会感知环境、按当前状态调整行为、再把自己的行动回写进下一轮的感知条件里，它就已经进入了 agent 的问题域。Wooldridge / Jennings 那条经典线索，进一步把 agent 的弱定义压成几项可工程化的特征：自主性、反应性、主动性和社会性。[^agent-theory-ch3] 到了 LLM 时代，ReAct 把这条线索重新接到语言模型上——模型不再只做一次性回答，而是在推理（reasoning）和行动（acting）之间来回循环，让每一步的观察结果都进入下一步的推理；Claude Code 论文也把现代 coding agent 的演化路径讲得很清楚：从自动补全，到 IDE 助手，再到能规划多步修改、执行 shell、读写文件、迭代自己输出的 agentic system。[^llm-agent-evolution-ch3][^claude-code-design-space-ch3]

把这些概念翻成工程语言，一个现代 LLM agent 至少包含下面这个循环：

```text
用户目标 / 环境 / 工具 / 运行时事实
  -> 感知（读取上下文、工具回执、session 状态）
  -> 判断（识别约束、估计状态、更新计划）
  -> 决策（选择下一步、选择工具、选择角色/路径）
  -> 行动（调用工具、修改产物、派工、回写事实）
  -> 新环境 / 新事实
```

这也正是 agent 和普通聊天程序在工程上完全不是一回事的原因。普通程序的输入输出常常是一锤子买卖；而 agent 当下的行动，会改变它下一次能感知到什么，所以它天然是个闭环系统，而不是一个单轮映射函数。语言模型在这里只是判断器、或者说策略生成器的一部分，而不是整个系统。

### 3.3 Agentic AI 做的事：给 LLM 建一个稳定工作环境

如果把上一节那个闭环拆开，agentic AI 在做的事就清楚了：它不是替代 LLM，而是为 LLM 建一个工作环境。这个环境大体分工如下——感知的部分，负责把用户目标、文件、日志、网页、MCP 资源、历史事实和工具回执，组织成当前可用的上下文；行动的部分，负责把模型提出的动作，转成受权限、沙箱、schema 和并发规则约束的工具调用；记忆的部分，负责把重要事实写回 session、文档、skills、memory 和 artifact，而不是任由它们只漂在 prompt 里；验证的部分，负责把“看起来完成”改成“证据证明完成”；而控制的部分，则负责压缩、恢复、打断、升级、分派子 agent，并把错误反馈回下一轮。

Claude Code 论文对这一点的概括很有价值：核心的 agent loop 可以简单到只是一个“调用模型、运行工具、再来一遍”的 while 循环，但绝大多数代码并不在这个循环里，而在循环周围那套系统——权限、compaction、MCP/插件/skills/hooks、子 agent 派发，以及追加式的 session 存储。[^claude-code-design-space-ch3] 这恰好说明，agentic AI 的本体不是“模型多聪明”，而是模型周围那套让它能持续工作的控制系统。所以本书所说的 harness，不该被理解成一层外挂的脚手架，而应被理解成 agent 的外层反馈控制系统：它的任务不是让模型显得更聪明，而是持续感知偏差、校正偏差，并把系统重新拉回可用区间。

### 3.4 三段血统：控制论、缓存、负反馈

这套控制系统并不是凭空发明的。今天我们在 agent 上遇到的问题，本来就是三段老工程史在一种新的计算介质里重演——它们正是第 1 章 §1.6 那两个类比（缓存、放大器）的来处。隔着半个多世纪，这三拨人面对的其实是同一个问题：怎样让一个系统，在噪声里不丢方向。

第一段是**控制论**。Norbert Wiener 之所以重要，不只是因为他写了一本标题里带 `Cybernetics` 的书，更因为他把一个工程问题第一次讲成了一种统一的语言。Britannica 对这段历史的概括点到了要害：Wiener 在二战期间处理的是“如何瞄准移动目标”这类控制问题，他在预测、滤波和目标保持上的思考，后来直接通向了控制论。[^cybernetics-history-ch3] 他关心的不是“机器会不会像人一样思考”，而是“一个系统怎样在持续变化的环境里保持方向”——这是个相当谦卑的问题意识：不追问机器能否超越人，只追问它能否别在半路走丢。MIT Press 对《控制论》的概括很简洁：它研究的是带有 `"feedback loops"` 的系统中信息如何被控制，以及噪声如何破坏系统的 `homeostasis`（稳态）。[^cybernetics-foundation-ch3] 把这套语言翻回今天的 LLM agent，结论非常直接：真正困难的问题，不是让模型偶尔答出一个漂亮答案，而是让系统在任务持续推进、外界不断反馈、约束持续变化时，仍然不丢目标——而控制论关心的“目标保持”，恰好就是第 2 章 §2.3 那条“记忆老化”机理在系统层面显出的样子。

第二段是**缓存**。第 1 章 §1.6 已经讲过缓存层级和局部性，这里补的是它背后那段很“物理”的失败史，因为它和 agent 的上下文控制几乎同构。Computer History Museum 的描述很形象：第一代很多内存是串行的，比特在环路里循环流动，机器想读写某个数据，只能等那一串比特转回到可访问的位置；Maurice Wilkes 的 EDSAC 用过水银延迟线，数据化作声波脉冲在水银柱里来回，你要的那一位得等它转回管口；直到随机访问内存出现，才真正 `"eliminated the wait"`。[^cache-history-ch3] 后来分层越来越清楚：IBM 的 System/370 把计算带进“硅时代”，而它所用的双极型 RAM 正是用作缓存。这段演进说明，缓存不是“聪明人爱抽象”的产物，而是当单层存储无法同时满足速度、容量和成本时，被现实逼出来的体系结构选择——这恰好也是今天“1M 上下文 vs 有效工作区间”那道矛盾的前身。Chris Terman 把缓存奏效的前提总结成一个词——`"locality of reference"`（引用局部性）：系统不必把全部数据都放进最快层，只需把当前工作集放进去，再靠组相联度、块大小、替换策略、写策略自动管理层间流动。[^memory-hierarchy-ch3] 这套逻辑直接对应到 agent：当前这一轮的 prompt 相当于贴近 CPU 的 L1，`AGENTS.md`、skills 和短期 memory 相当于可快速调入的次级层，而 session 事实流、artifact、文档、外部检索结果相当于更慢更大的下层存储。harness 在这里做的，就是一种“认知层级的缓存控制”——决定什么允许进入当前 prompt（admission）、什么旧信息该退回 session（eviction）、一次喂进去的是整块原文还是压缩切片（block size）、哪些中间状态必须立刻写回持久事实流（write policy）。这正是第 2 章 §2.2 那条“softmax 稀释”机理的直接对策：不把高速层塞爆，只把短、密、近的证据切片放进当前窗口。

第三段是**负反馈**，故事感最强。Harold S. Black 在 Bell System 遇到的问题并不神秘：长途电话链路上，信号要穿过一串又一串放大器，增益是有了，可失真、噪声和漂移也一路叠加上去——这几乎就是第 2 章 §2.3 那个“传话游戏”的电学版本。Black 为消除失真坚持了六年，最终在一个再普通不过的通勤早晨、在开往曼哈顿的渡轮上想清楚了负反馈放大器的原理，顺手把推导记在了一份报纸的边角上。[^feedback-history-ch3] 这件事揭示了一个反直觉的工程事实：成熟系统追求的，往往不是最大的裸增益，而是更可控的整体行为。回到第 1 章 §1.6 那个放大器——它只在线性区内不失真，越界就削顶；Black 的做法，本质上是把一部分输出送回输入端，用主动牺牲一点增益，换来更宽的线性区、更低的失真和更可预测的整体表现。[^feedback-circuits-ch3] 半导体世界里还有一幅互补的画面：Terman 讲 SRAM 的存储单元时说得很直接，它本质上是一个 `"positive feedback loop"`（正反馈回路），用来形成可稳定保存状态的双稳态。[^memory-hierarchy-ch3] 这正是第 2 章 §2.3 点到的那两类互补反馈的电路原型——正反馈用来锁存状态，让一个比特不至于自己滑掉；负反馈用来抑制放大链里的漂移与失真，让整体仍停在稳定区。对一个长期运行的 agent，这两类机制缺一不可：它的“锁存器”，是 session 事实流、通过了验证的 artifact，以及角色、作用域、worktree 这些边界；它的“负反馈环”，是验证器、回放、dashboard、人工升级、角色重分配和恢复逻辑。长任务 agent 最容易犯的错，恰恰是把这两类机制一起省掉——既没有东西把关键事实锁住，又没有东西把错误输出送回纠偏，结果短期看跑得飞快，长期看状态漂移、工具误用、上下文污染和错误自信一起累积，败因和那条没有负反馈的放大链一模一样。

### 3.5 Harness 作为外层反馈控制器，与那层控制栈

把三段血统叠起来，harness 的角色就立体了：模型本身只负责生成下一步的候选动作，真正把闭环“关上”的是 harness——它通过 session、工具回执、验证器、dashboard 与回放来感知系统状态，通过 compaction、检索、角色路由、权限边界、重试与升级来调节系统，又通过 artifact 契约、终态裁决和人工介入，把错误的行动拦在用户可见的表面之前。

2026 年 Thoughtworks 这一波关于 harness engineering 的讨论，很适合当现代实践的起点：Birgitta Böckeler 在文章里公开致谢 Kief Morris，说是他把控制论带进了讨论——这不是花絮，而是一个信号：今天的软件团队重新谈 harness，本质上是在重新发现一个很老的控制问题。[^harness-story-ch3] Böckeler 把团队对 AI 生成代码的那道 `"natural trust barrier"`（信任壁垒）拆得很控制论：前馈的“向导（guides）”负责在行动之前提高成功概率，反馈的“传感器（sensors）”负责在行动之后帮系统自纠。Kief Morris 则把人的位置重新定义成 `"on the loop"`（在环上）——人的工作不是盯着每一行生成的代码，而是设计并改进那个会持续产出代码、测试、文档和验证结果的工作回路。[^harness-story-ch3] 这两个说法——前馈向导与反馈传感器、人“在环上”而非“在环里”——后面几章会反复出现，值得先记住。

那么 harness 落到实处是什么？当 agent 离开 demo、走进跨文件、跨工具、跨角色、跨时段的真实场景时，系统瓶颈会从“模型够不够聪明”转向“控制环够不够好”，而真正决定上限的是下面这层控制栈：

```text
Prompt 工程
  -> 改善局部单轮行为
上下文工程
  -> 稳定多轮行为（AGENTS.md、skills、memory、策略上下文）
Harness 工程
  -> 用持久运行时契约稳定长周期自治行为
```

这三层的分工值得说清，因为后文不会再把它们分开重述。上下文工程是 harness 的前置纪律，在 harness 成熟之前承担着大部分控制重量：`AGENTS.md` 和角色指令约束规划风格，skills 把可复用的领域流程编码下来，memory 记录用户与项目的事实以减少重复漂移，有边界的工具策略压住不安全的探索；这一层必要，但它仍然依赖模型概率性的“遵守”，对长任务、并发和后台工作并不充分。再往上的 harness 工程，则在概率性的模型输出之外，再加一层确定性的控制循环——它提供可恢复、可追踪的工作区状态，给工具调用挂上生命周期 hook 与事件 sink 以便观测，在终态成功之前先做输出的验证与确认，维护持久的任务生命周期与回放语义，并为修复和操作员行动留出显式的失败类别。一句话：**harness 不替代模型智能，它约束模型智能**，好让系统能从模型的漂移中恢复，而不是假装漂移不存在。`AGENTS.md`、skills、memory、hooks、验证器、dashboard、swarm 协作，其实都是这套反馈控制器上的不同传感器、执行器和约束器件——下一节会把它们逐条对回到第 2 章的失效机理上。

### 3.6 机理对应能力：本书后续章节的提纲

第 2 章讲清了模型天然缺什么，前几节讲清了外层控制系统是什么、从哪来。把两者并排放在一起，会看到一种近乎对仗的结构：**模型每缺一样东西，harness 就补上一件对应的器件。** 下面这张表，是全书的提纲——左边是模型层“天然缺什么”，右边是 harness 层“补什么、在哪一章展开”。此刻表里出现的术语（事实流、验证、正/负反馈、人在环上），都已在前几节定义过，不再是空名词。

| 失效机理（模型层） | 失效表现 | 对症的 harness 能力 | 展开章节 |
|---|---|---|---|
| softmax 稀释 | 上下文越长，关键证据越被“平均掉” | 认知层级缓存控制：admission / eviction、compaction、检索式“短密近”证据切片 | §3.4、第 6 章（事实流）、第 11 章 |
| RoPE 距离衰减 / 外推退相干 | 远距离关联弱、超长外推失效 | 上下文分层加按需调入（L1 prompt / L2 `AGENTS.md`·skills·memory / L3 事实流）；把关键事实重新拉回光标附近 | §3.4、第 6 章、第 8 章 |
| 有限残差维度 | 长历史细节被压缩、陈旧假设增多 | 持久事实流：把状态移出 prompt、写回运行时，而不是让模型“记住” | 第 6 章（session 支柱）、第 8 章 |
| over-squashing / 表示坍缩 | 长输入里“分不清”、计数与复制类退化 | 结构化证据加产物契约加独立验证：不靠模型在巨大上下文里自己看出来 | 第 6 章（验证支柱）、第 11 章 |
| 非均匀 KV 分辨率 | 同一窗口不同位置可用性不均（U 形） | 把容量上限与有效工作区间分开设计；短密近证据加检索加分层缓存，不默认塞满 | §2.4–2.5、第 6 章 |
| 记忆老化（时间⊆空间） | 跨小时、跨会话目标漂移，陈旧上下文 | 目标保持加锁存：目标、约束、产物锁进 session 与 artifact；compaction 时保留关键决策并定期回注 | 第 6 章（session）、第 11 章（短回路与长回路） |
| 不可约误差复合 | 长任务越跑越偏，自信但错误累积 | 负反馈环：独立验证、终态裁决、回放、重试与升级、人在环上；并用子 agent 分解缩短单链 horizon | 第 6 章（验证）、第 9 章（操作员面）、第 10 章（群体编排）、第 11 章 |

不妨把其中一行读成一个小故事。回到开篇那个 agent：它“忘掉了两小时前的约束”——对应表里的“记忆老化”。它不是不想记，而是那条约束随着光标前移、相对距离变远，被注意力一点点稀释掉了（第 2 章 §2.2 的机理）。harness 的对策不是恳求模型“别忘”，而是把这条约束从易逝的 prompt 里取出来，锁进 session 事实流，再在每次 compaction 之后把它重新放回光标附近——这正是 §3.4 那个“锁存器”三个字的全部含义。同一个 agent“自信地交付跑不通的代码”——对应“不可约误差复合”：靠模型自查没有用，必须在终态由一个独立的验证器说“测试没过”，再把这条反馈送回循环。表里的每一行，都是这样一组“机理—症状—对策”的对应。

读这张表，有两个要点。其一，**harness 不是一袋经验技巧，而是一组针对已知失效机理的控制器件**：表右栏的每一项，都对准左栏一条具体的失效机理，这正是把 §3.5 “harness 是外层反馈控制器”落到实处的方式。其二，也是更深的一点——**空间类的机理大多能被上下文工程“补偿”，但时间轴上那条“不可约误差复合”补偿不了，只能被“兜住”。** 这条边界不是修辞，而是工程事实：它正是 §3.5 控制栈里“上下文工程必要但不充分、必须上升到 harness 工程”的根本原因，也是为什么第 10 章要用群体编排去缩短单链 horizon、第 11 章要把系统拆成短回路与长回路。把更大的窗口当成解药，只能缓解空间类机理；时间轴那个不可约的核，必须靠运行时的验证与人的监督来关闭。这条边界还顺带解释了一个产业层面的判断：既然时空失效是架构层面的必然，连前沿模型都只能“缓”而不能“消”，那么“把上下文窗口做得更大”就永远只是缓解、而非根治；真正决定长任务可靠性上限的，是模型之外的这套控制系统——这也是本书把 harness engineering 当作工程主战场、而不是把希望寄托在“等下一代模型”身上的根本理由。

到这里，本书的第一部分（基础）完成了它的全部任务：第 1 章看清这台机器，第 2 章诊断它的必然失效，第 3 章给出外层控制系统的来历与提纲。后文不会再把理论一次性堆在前面，而是采用交替推进的节奏。第 4 章先看成熟样本，拆开 Claude Code 和 Codex，看它们把哪些控制器、传感器、执行器、记忆和权限边界做成了实打实的产品结构；第 5 章转去看失败样本，看一个系统在把聊天输出误当成运行时事实之后，会怎样接连出现进度漂移、会话污染、产物错交和验证失效；第 6 章再把理论和样本压成一张统一的架构图——事实流、生命周期、能力平面、产物验证、回放、隔离恢复、协作、知识分层和操作员面；从第 7 章到第 10 章，则逐个专题展开，每一章都先给出理论约束，再接上 Claude Code / Codex 的实现例证和失败案例的反证。理论负责给读者建立判断的坐标，实践负责不断校正这套坐标。开篇那个时而天才、时而走神的 agent，会在后面每一章里反复回到我们眼前——只是这一次，它身边会逐渐长出一整套把它拉回工作区间的器官。

[^agent-theory-ch3]: 本章在此处综合 Franklin / Graesser 对 autonomous agent 的定义，以及 Wooldridge / Jennings 关于 autonomy、reactivity、pro-activeness 与 social ability 的经典描述；对应第 21 章参考文献 26、27。
[^llm-agent-evolution-ch3]: 本章在此处综合 ReAct 关于 reasoning / acting 循环的经典框架，以及 *Dive into Claude Code* 对 coding assistant 演化到 agentic system 的描述，用来说明 LLM agent 如何从单轮回答走向工具闭环；对应第 21 章参考文献 41、42。
[^claude-code-design-space-ch3]: Jiacheng Liu 等，*Dive into Claude Code: The Design Space of Today's and Future AI Agent Systems.* 本章在此处使用其关于 Claude Code agentic loop、系统边界与源码分析结论，用来把 agentic AI 从概念落到具体产品架构；对应第 21 章参考文献 41。
[^cybernetics-foundation-ch3]: Norbert Wiener, *Cybernetics or Control and Communication in the Animal and the Machine.* 本章在此处使用 MIT Press 对 cybernetics、feedback loops、noise 与 homeostasis 的概括，来建立控制论视角；对应第 21 章参考文献 25。
[^cybernetics-history-ch3]: 本章在此处综合 Britannica 对 Wiener 战时目标跟踪与预测问题的概述，以及 MIT Press 对 Macy Conferences、Wiener、von Neumann、Margaret Mead、Gregory Bateson 等人的描述，用来补足控制论的人物与历史脉络；对应第 21 章参考文献 30、31。
[^cache-history-ch3]: 本章在此处综合 Computer History Museum 关于 delay line、main memory、magnetic core 与 bipolar RAM/cache 的材料，以及 IBM 对 System/370 向硅与高速 cache 迁移的回顾，用来解释 memory hierarchy 不只是抽象理论，而是现实成本、速度与容量冲突逼出来的分层工程；对应第 21 章参考文献 32、33、34。
[^memory-hierarchy-ch3]: Chris Terman, *Computation Structures* 的 *The Memory Hierarchy* 与 *Virtual Memory* 讲义。本章在此处使用 locality of reference、associativity、block / replacement / write policy，以及 SRAM 中 positive feedback loop 的解释，来建立 memory hierarchy 与稳定存储的类比；对应第 21 章参考文献 28。
[^feedback-circuits-ch3]: H. S. Black, *Stabilized Feedback Amplifiers.* 本章在此处使用其关于多级放大器稳定性、负反馈与非线性抑制的讨论，来类比长任务 agent 的漂移控制；对应第 21 章参考文献 29。
[^feedback-history-ch3]: 本章在此处综合 National Inventors Hall of Fame 与 Bell Labs 对 Harold S. Black 负反馈放大器的历史描述，用来补足 Bell System 长距离电话失真、六年坚持与 ferry 灵感的故事线；对应第 21 章参考文献 29、35。
[^harness-story-ch3]: 本章在此处综合 Birgitta Böckeler 关于 guides / sensors 的 harness 抽象、Kief Morris 关于 humans “on the loop” 的论述、OpenAI Ryan Lopopolo 的 harness 实践，以及 Anthropic 对 Claude Code 组织采用的公开描述，用来说明今天的 harness engineering 是一条带有人物、组织与实践演进的技术线，而不是新造术语；对应第 21 章参考文献 1、2、36、37、38。

## 4. 成熟度鸿沟：灵光一闪 vs 工厂化输出

上一章回答的是“为什么必须有 harness”；这一章回答的是“成熟系统究竟在建设什么，才能从 demo 式聪明跨到工厂化输出”。这里会按重要性看四类样本：Claude Code 作为主分析对象，Codex 作为公开的开源结构样本，OpenClaw/Hermes 作为更广义 agent product 对照，而 OpenAI 1M LOC 案例则提供组织生产层的极端样本。那组内部失败案例不在这一章里做主角，它在下一章只作为反证样本出现。

### 4.1 两层驾驭工程：先把实践对象分清

进入样本之前，必须先把“驾驭工程”分成两层，否则读者会把 OpenAI 1M LOC、Claude Code、Codex、OpenClaw、Hermes 和失败案例混成一类东西。

第 1 层是 AI 编码过程的驾驭工程。这里 agent 是工程团队的生产工具，最终产品仍然是代码、服务、应用或基础设施。OpenAI Codex 团队的 1M LOC 案例、Fowler 的代码 agent harness、Codex 开源仓库里对 sandbox、approval、MCP、rollout 和 `AGENTS.md` 的显式边界，都属于这一层。[^layer1-harness-ch2]

第 2 层是 AI agent 自身的 harness 工程。这里产品本身就是 agent，用户直接把任务交给它。系统要处理 session 恢复、sandbox 权限、工具调用审计、长任务重启、客户环境隔离、gateway 路由和合规签字。Anthropic 的 session / harness / sandbox 三抽象、Claude Code 源码里对 compaction、resume、worktree、sub-agent 的拆分，以及 OpenClaw/Hermes 在 gateway、memory、skills、cron 和多会话上的控制面，都更接近这一层。[^layer2-harness-ch2]

Claude Code 和 Codex 站在这两层的分界线附近：它们既是编码生产工具，也体现出长任务 harness 产品的形态。OpenClaw 和 Hermes 更明显属于 Layer 2。下一章的失败案例只承担一个角色：反证样本。它有价值，不是因为它代表行业，而是因为它把同一种结构性问题暴露得很具体。

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

### 4.2 Claude Code：harness 已经产品化

如果只看 Anthropic 对外讲 Claude Code 的方式，很容易把它误判成一个更强的 coding CLI。但把两条官方叙事并起来看，事情就变了。产品页直接写着，公司里 `"majority of code is now written by Claude Code"`，工程师的工作重心转向 architecture、product thinking 和 continuous orchestration。另一篇内部案例更有画面感：律师拿它做电话树系统，设计师开始做原本不太会碰的大块 state management 变更，数据科学家在“几乎不会 JavaScript/TypeScript”的情况下，用它搭出生产级可视化应用。[^claudecode-story-ch2]

这些故事的意义不是“人人都能一键写软件”，而是 Claude Code 已经越过了传统 coding assistant 的边界，开始充当一个更通用的任务 runtime：只要工作能被还原成“收集上下文 -> 规划 -> 调工具 -> 生成产物 -> 跑检查 -> 继续迭代”这条链，它就不再局限于写代码。下面再回到源码去看，就更容易理解它为什么必须长出那么多看似“与写代码无关”的运行时器官。

如果只看表面，Claude Code 像一个终端里的模型壳；但沿着 `Tool.ts -> query.ts -> services/tools -> services/compact -> sessionStorage -> AgentTool -> worktree` 这条链读下来，它其实是一套通用 agent runtime。2026-04-23 对本地源码镜像的审读里，仅会话持久化 `sessionStorage.ts` 就约 5105 行，全量 compaction `compact.ts` 约 1705 行，worktree 管理 `worktree.ts` 约 1519 行，另有 `StreamingToolExecutor.ts`、`diskOutput.ts`、`agentSummary.ts`、`resumeAgent.ts`、`teammateMailbox.ts` 等专门模块。这个体量本身就在说明：Claude Code 解决的主问题不是“如何让模型回答得更像程序员”，而是“如何让一个模型驱动的执行体在真实工作流里连续工作、可恢复、可委派、可审计”。[^claudecode-ch2]

2026 年 4 月的论文 *Dive into Claude Code* 给这条判断提供了一个更公开、可审计的版本。论文基于公开可获得的 TypeScript 源码分析，把 Claude Code 拆成五类价值目标：human decision authority、safety and security、reliable execution、capability amplification、contextual adaptability；再把它们落到十三条设计原则上。最重要的是，论文也得出同一个结构性结论：核心 agent loop 可以很简单，真正庞大的部分是 loop 周围的权限系统、上下文压缩、扩展机制、subagent 编排和 append-oriented session storage。[^claude-code-paper-ch2] 这正好把本书前面的 cache / 负反馈类比落成了具体系统：Claude Code 不是把 LLM 当作孤立智能体，而是把它放进一套持续限制、补偿、恢复和放大的控制环境里。

#### 4.2.1 从代码反推，Claude Code 在解决什么问题

从源码反推，Claude Code 的目标并不是把 IDE 补全做得更聪明，而是把“长任务代理”做成可运行的软件。这里的长任务不是一句 prompt 换一段代码，而是持续几十分钟甚至更久的工作：读仓库、读文档、调用 shell、改多类文件、向外部系统取数、拆给子 agent、等结果回来、恢复中断、继续推进。只要任务进入这个尺度，真正的问题就不再是“模型会不会写代码”，而是“这个执行体怎样管理状态、工具、副作用和恢复语义”。

这也是为什么 Claude Code 可以从 coding agent 长成更广义的 agent 工具。它面对的对象并不局限于源代码，而是更一般的“有输入材料、有产物目标、有验证步骤的工作单元”。写代码只是其中一种；写文章、写 slide、整理研究摘要、本地批处理、调用外部 MCP 服务，本质上都落在同一个工作流里：收集上下文，组织任务，修改产物，运行检查，必要时继续委派。

#### 4.2.2 为什么它可以成为万用的 agent 工具

`ToolUseContext` 已经把 Claude Code 的真实抽象暴露出来了：它同时持有 `commands`、`tools`、`thinkingConfig`、`mcpClients`、`mcpResources`、`agentDefinitions`、`AppState`、`notifications`、`FileStateCache`、权限上下文、file history、content replacement state 等对象。换句话说，它的核心单元不是“代码文件”，而是“一个会用工具、会恢复状态、会调用外部系统、会继续派工的任务线程”。[^claudecode-ch2]

这就是它为何能从“写代码”自然扩展到“写文章、写 slide、做研究、驱动外部 agent”。工具目录里同时存在 `FileReadTool`、`FileWriteTool`、`FileEditTool`、`NotebookEditTool`、`WebSearchTool`、`WebFetchTool`、`MCPTool`、`ReadMcpResourceTool`、`AgentTool`、`SendMessageTool`、`TeamCreateTool`、`CronCreateTool` 等模块。对于运行时来说，代码、Markdown 文稿、slide 源文件、notebook、甚至一份需要通过 shell 渲染出来的中间产物，并没有本质差别；差别只在于任务提示、工具组合和验证方式。[^claudecode-ch2]

因此，Claude Code 的“万能”并不是来自一个无所不能的大 prompt，而是来自一个更底层、与领域相对无关的动作底座：文件系统、shell、web、MCP、子 agent、权限、恢复、摘要、回放。只要某类工作能被还原成这套动作组合，它就可以被装进同一个 agent runtime。

#### 4.2.3 这种广度能力提出了哪些系统要求

第一，入口不能只有一个聊天框。`main.tsx` 在启动期同时装配 CLI、会话恢复、skills、plugins、MCP、policy limits、remote managed settings、direct connect、assistant mode、worktree mode、sandbox manager 等部件。源码里甚至明确写着 `main.tsx` 只是入口；真正的运行面在后面的状态、工具与会话系统里。这说明 Claude Code 把终端当成外壳，而不是唯一产品。[^claudecode-ch2]

第二，角色不能写死在主 prompt 里。`AgentTool.tsx` 允许调用者为子 agent 指定 `name`、`team_name`、`mode`、`isolation`、`cwd`、`run_in_background`；`loadAgentsDir.ts` 则允许 agent 定义声明 `tools`、`disallowedTools`、`model`、`effort`、`permissionMode`、`mcpServers`、`hooks`、`maxTurns`、`skills`、`memory`、`background`、`isolation` 等属性。也就是说，Claude Code 不是只有“一个智能体”，而是已经具备了角色模板、权限边界、工具包和记忆范围这些编排原语。[^claudecode-ch2]

第三，外部系统必须成为一等公民，而不是临时插件。`ToolUseContext` 直接持有 `mcpClients` 和 `mcpResources`；工具层里既有 MCP 调用，也有资源读取。对 Claude Code 来说，MCP 不是给 demo 做一点扩展，而是把外部能力接入统一运行面的方法。用户说“通过 CLI 调 API”或者“通过 MCP 调外部 agent”，在这套架构里其实是同一件事：都只是让当前任务线程获得另一个可调度能力源。[^claudecode-ch2]

第四，多 agent 不是多开几个窗口，而是要有真正的协调平面。`teammateMailbox.ts` 的文件头直接把自己定义为 `"File-based messaging system for agent swarms"`；它给每个 teammate 建 inbox，并用锁保证并发写入安全。再往上看，`AgentTool.tsx` 支持后台运行与独立 worktree，`agentSummary.ts` 周期性生成进度摘要。也就是说，Claude Code 已经把“谁在做什么、怎样传递中间信息、怎样让操作者看懂分工状态”做成了系统功能，而不是靠人类手工记忆。[^claudecode-ch2]

这也能和 *Dive into Claude Code* 的五层分解对上：surface layer 负责入口和渲染，core layer 负责 agent loop 与 compaction，safety/action layer 负责权限、hooks、工具、sandbox 和 subagent，state layer 负责 context assembly、session persistence、memory 和 sidechain transcripts，backend layer 负责 shell、MCP、remote execution 和外部资源。[^claude-code-paper-ch2] 也就是说，第 6 章后面总结出的“事实流、生命周期、能力平面、产物与验证、回放、隔离与恢复、协作、知识分层、操作员面”，不是本书凭空造出来的分类，而是可以在一个成熟产品的公开源码分析中看到对应物。

#### 4.2.4 这种深度能力提出了哪些可靠性要求

广度回答的是“能做多少种事”；深度回答的是“能不能把一件事连续做完”。Claude Code 之所以不像普通聊天壳，关键在于它把深度问题拆成了若干个独立子系统。

第一是调度问题。`StreamingToolExecutor.ts` 文件头明确写着，`"Concurrent-safe tools can execute in parallel"`，而非并发安全工具必须独占执行。这意味着工具调用不再是模型吐一个就跑一个，而是进入一个知道并发语义、能处理取消和错误传播的调度器。写代码、写文稿、做数据整理时都一样：一旦涉及 shell、文件编辑、外部请求并发，调度器就比 prompt 更接近真实问题。[^claudecode-ch2]

第二是上下文压力问题。Claude Code 不是只在窗口快满时做一次“摘要压缩”，而是分层处理：`microCompact` 清理旧 tool result，`apiMicrocompact` 利用 provider 原生 context management，`compact.ts` 做更重的全量压缩并在压缩后补回最近文件和 skills；`query.ts` 主循环还把 auto compact、reactive compact、context collapse、tool summary、token budget 都连在一起。这里真正表达的工程判断是：长任务的上下文维护必须是持续策略，而不是临门一脚的 emergency button。[^claudecode-ch2]

第三是持久化与恢复问题。`sessionStorage.ts` 不是简单日志文件帮助函数，而是整套 transcript、metadata、progress、history 的保存与读取层。`resumeAgent.ts` 恢复时会过滤 unresolved tool uses、清理 orphaned thinking、重建 content replacement state，并尽可能恢复 worktree 路径。这意味着 Claude Code 默认假定任务会中断、会切换、会稍后继续；resume 不是附属功能，而是核心语义。[^claudecode-ch2]

第四是产物外置问题。`diskOutput.ts` 给每个任务分配独立 output file，并设置 5GB 上限；`agentSummary.ts` 每约 30 秒从子 agent transcript 中生成一次简短进度摘要。前者解决“长输出不能都塞回聊天上下文”，后者解决“操作者和父 agent 不能盯着原始日志看”。一旦任务开始写大型文档、生成 slide、跑长时间命令、并行开多个 agent，这两件事就都变成硬需求。[^claudecode-ch2]

第五是副作用隔离问题。`worktree.ts` 负责隔离工作目录，`fileStateCache.ts` 负责把文件状态变成受控工作记忆。前者避免不同任务互相踩工作区，后者避免每轮都把大量文件重新塞回模型上下文。对通用 agent 来说，这两层分别对应“在哪里动手”和“脑子里记住什么”；两者都必须被 harness 显式管理。[^claudecode-ch2]

#### 4.2.5 工程结论：Claude Code 为什么足以成为主样本

从代码反推，Claude Code 的代表性不在于“Anthropic 做了一个很大的 coding CLI”，而在于它证明了通用 agent 的真正内核是什么。它之所以既能写代码，也能写文章、写 slide、做研究、调用 MCP 服务、再进一步编排多个 agent，并不是因为这些场景有某个神奇共用 prompt，而是因为它们共享同一组运行时需求：可调度工具、可恢复会话、可外置产物、可隔离副作用、可委派协作、可让人类看懂当前状态。[^claudecode-ch2]

一旦把问题定义为这组需求，Claude Code 就不再只是“把 LLM 接到终端上”。它已经把 harness 做成了产品本体。模型很重要，但真正让它成为万用 agent 的，是这套围绕模型长出来的控制系统。

### 4.3 Codex：把 harness 边界显式模块化

如果把 Codex 只看成一个开源 CLI，读法会偏得很厉害。官方产品线自己已经把问题说得很清楚。2025 年 5 月 OpenAI 首次公开 Codex 时，把它定义成 `"a cloud-based software engineering agent that can work on many tasks in parallel"`；每个任务都在独立、隔离、预装仓库的环境里运行。到了 2026 年 2 月发布 Codex app 时，OpenAI 又把同一条线往前推了一步：真正的挑战已经从“agent 能做什么”转向“人怎样在规模上去指挥、监督、协作多个 agent”，于是 app 被直接定义成 `"a command center for agents"`。[^codex-story-ch2]

这条演进线对本书很重要，因为它说明 Codex 的本体从来不是“终端里更聪明的补全工具”，而是一套跨云端、桌面、本地 CLI、IDE 和 rich interface 的 agent runtime。也正因为这样，开源仓库最值得读的不是某个 prompt，而是 OpenAI 愿意公开暴露出来的那些边界：线程、回合、事件、工具、存储、sandbox、approval、app-server、skills、agent control。这些不是实现细节，而是产品形态倒逼出来的内核语法。[^codex-story-ch2]

如果说 Claude Code 展示的是一个重产品化 agent runtime 的内部器官，那么 Codex 公开仓库展示的是另一条路线：把同类能力拆成显式的模块和协议。只看 `codex-rs/cli/src/main.rs` 就知道，它面对的绝不只是一个交互式 coding CLI；同一个入口同时暴露 `exec`、`review`、`mcp`、`plugin`、`mcp-server`、`app-server`、`sandbox`、`resume`、`fork`、`cloud`、`exec-server`、`features` 等子命令。问题定义已经从“给命令行加一个写码助手”上升到“如何把 agent runtime 复用到多种运行面”。[^codex-oss-ch2]

#### 4.3.1 从代码反推，Codex 在解决什么问题

Codex 在解决的是一个更偏平台层的问题：怎样让同一个 agent 内核同时服务 CLI、IDE、桌面端、Web、非交互执行、云任务和插件生态，而不让每个表面各自发明一套状态机。OpenAI 在 GitHub README 里对 CLI 的一句定义就已经很说明问题：`"Codex CLI is a coding agent from OpenAI that runs locally on your computer."` 这句话的价值不在“本地”，而在“agent”。它暗示这不是 shell 包装器，而是一个可以带着工具、状态、权限和恢复语义运行在本机上的执行体。[^codex-story-ch2]

再往上接产品线，Codex cloud、Codex app、CLI、IDE extension 并不是彼此独立的四样东西，而是同一运行时在不同表面的展开：云端强调异步委派和隔离环境，本地强调与真实工作区、真实工具链和真实权限体系的贴身集成，桌面 app 则强调如何同时管理多个 agent、多个线程和更长时间的工作。Claude Code 更像把运行时做深，Codex 则更像先把边界讲清楚。它公开暴露的不是某个神秘 prompt，而是 thread、turn、tool、sandbox、approval、MCP、storage 这些可命名、可替换的部件。[^codex-oss-ch2][^codex-story-ch2]

这也是为什么 Codex 对本书很重要。Claude Code 告诉我们，一套通用 agent 产品最后会长出哪些器官；Codex 则告诉我们，这些器官怎样被抽象成一套更清楚的内核接口。前者偏“运行得起来”，后者偏“边界讲得清楚”。

#### 4.3.2 为什么说 Codex 更像 agent 内核，而不是单一 CLI

`codex app-server` 的 README 写得非常直白：它是 Codex 用来 `"power rich interfaces"` 的接口，并且把整个系统抽象成三个核心原语：`Thread`、`Turn`、`Item`。`Thread` 是对话级持久单元，`Turn` 是一次交互的执行单元，`Item` 是会被保存并进入未来上下文的输入输出与副作用。这个抽象一旦成立，CLI 就只是众多客户端之一，而不是系统本体。[^codex-oss-ch2]

这和 OpenAI 在 Codex app 里讲的产品现实是完全对得上的。官方写得很直白：agents 在 separate threads 里按 project 组织，开发者要能在多个任务之间无缝切换而不丢上下文；app 内置 worktrees，让多个 agent 能在同一 repo 上并行工作而不互相踩状态。[^codex-story-ch2] 这实际上就是把 `Thread` / `Turn` / `Item` 这种协议对象，落实成多 agent 编排、项目切换和长任务监督的用户界面。

更关键的是，Codex 没有把这些对象留在内部实现里，而是通过 `thread/start`、`thread/resume`、`thread/fork`、`turn/start`、`turn/steer`、`turn/interrupt` 等接口公开出来。也就是说，它把“开始任务、继续任务、分叉任务、插话、打断”这些 agent 行为显式变成了协议能力。用户口中的“通过 CLI 调 API”，在 Codex 视角里只是一个前端；底下真正稳定的对象模型是 thread/turn/item。[^codex-oss-ch2]

#### 4.3.3 这种广度能力在 Codex 里是如何实现的

Codex 的广度，首先来自它把能力面协议化。`app-server` README 的 API 概览里，除了 thread/turn 管理，还有 `command/exec`、`fs/readFile`、`fs/writeFile`、`fs/watch`、`skills/list`、`plugin/list`、`plugin/install`、`app/list`、`mcpServer/resource/read`、`mcpServer/tool/call`、`tool/requestUserInput` 等接口。换句话说，文件系统、命令执行、技能、插件、外部应用、MCP、人工输入都不是附会功能，而是与对话本身并列的协议面。[^codex-oss-ch2]

如果把这件事和 2026 年的 Codex app 产品叙事合起来看，意图就更明显了。OpenAI 已经明确说 Codex 正在从“写代码的 agent”变成“用代码把工作做完的 agent”：skills 不只是补充件，而是让它能去做信息收集、问题求解、写作、部署、文档、自动化等更广义知识工作的桥。[^codex-story-ch2] 这正是为什么开源仓库里会同时出现 `plugin`、`mcp-server`、`skills`、`app-server`、`spawn_agent` 这类看起来比“写代码”更大的部件。

`codex-rs/tools/src/lib.rs` 则把这些能力进一步落成统一工具注册面：本地 shell、`apply_patch`、code mode、MCP 资源与工具、`request_user_input`、`spawn_agent`、`send_input`、`wait_agent`、`resume_agent`、`close_agent`、图像查看、计划更新，都通过一个清晰的工具层暴露出来。这意味着 Codex 不是把“多 agent”“MCP”“人类确认”当特殊 case 处理，而是把它们纳入同一工具经济里。对一个广义 agent 来说，这比“把更多知识塞进 prompt”更接近真正的可扩展性。[^codex-oss-ch2]

也正因为这样，Codex 可以自然承担从 coding 到 review，再到研究、批处理和外部系统编排的多种角色。只要任务能被表达为 thread/turn/item 上的历史，加上一组工具调用和少量人工干预，它就可以挂到同一个 runtime 里。广度不是来自模型知道所有领域，而是来自平台允许不同领域工作共用同一套控制栈。

#### 4.3.4 这种深度能力在 Codex 里是如何模块化的

如果说 Claude Code 倾向于把深度能力沉到一个大而完整的产品里，Codex 的做法是把它们拆散为更清楚的模块。`thread-store` 在文件头直接把自己定义为 `"Storage-neutral thread persistence interfaces"`；`rollout` 则是 `"Rollout persistence and discovery for Codex session files"`。这两个短句很关键，因为它们清楚表明：持久化不是聊天 UI 的附属，而是 agent runtime 的独立层；并且这层不应该被绑死在某一种本地文件实现上。[^codex-oss-ch2]

这种模块化不是学院式洁癖，而是被真实产品约束逼出来的。OpenAI 在 Codex app 文章里把要求列得很直：默认 secure by default，多个 agent 要能并行，worktree 要能隔离，线程要能跨 CLI / app / IDE 继承历史和配置，技能要能跨这些表面复用。[^codex-story-ch2] 一旦这些要求同时成立，系统就不可能继续靠一个会话对象加一堆隐式状态往前堆，而必须把持久化、通知总线、sandbox、approval、tooling、线程历史都拆成可审计、可替换的独立层。

同样的思路也体现在其他模块边界上。仓库单独拆出 `app-server`、`app-server-protocol`、`tools`、`thread-store`、`rollout`、`exec-server`、`sandboxing`、`process-hardening`、`mcp-server` 等 crate；根目录 `AGENTS.md` 又反复强调 crate 边界、sandbox 约束、MCP connection manager 和文档同步。它真正回答的是：当 agent 既广又深时，哪些责任必须成为清晰的所有权边界，才能避免整个系统退化成一个巨大且难以维护的核心包。[^codex-oss-ch2]

`docs/agents_md.md` 也说明了另一件事：连 `AGENTS.md` 这种“给 agent 的操作说明”都被当作正式能力层来设计，还考虑分层作用域与优先级。这和普通项目里把所有指令糊进一个系统提示完全不同。Codex 的选择是把文档注入、权限、持久化、工具注册、UI 连接协议全部做成可审计的显式结构，从而让 agent 行为更容易被不同客户端复用。[^codex-oss-ch2]

#### 4.3.5 Claude Code 与 Codex 合起来说明了什么

从代码反推，Claude Code 和 Codex 实际上在回答同一类需求，只是切入点不同。Claude Code 证明：如果你真想让 agent 做长任务、带副作用、可恢复、可协作，你最后一定会长出 compaction、resume、disk output、mailbox、worktree、角色模板这些器官。Codex 证明：这些器官可以进一步抽象成 thread/turn/item、tool registry、thread store、rollout、sandbox、approvals、app-server 这样的边界，从而形成一个更清楚的 agent kernel。[^codex-oss-ch2]

如果再把产品演进线补进来，这个结论会更完整：Codex 不是“先有一个 CLI，后来加了 app”，而是先遇到多任务并行、异步委派、隔离环境、跨表面会话延续这些真实问题，然后才不得不长出今天这套开放出来的对象模型。也就是说，Codex 开源仓库最值得学的，不是某一版目录结构，而是它如何把产品压力压缩成一组长期稳定的 runtime 边界。[^codex-story-ch2]

因此，本书把 Claude Code 和 Codex 放在一起看，不是为了比较谁更强，而是为了看清同一条工程定律的两个侧面：一个侧面是产品化后的丰满器官，一个侧面是模块化后的清晰骨架。两者都在说明，harness 不是附属层，而是 agent 软件本体。

### 4.4 OpenClaw 与 Hermes：更广义 agent product 也在重复同一规律

OpenClaw 和 Hermes 不以 coding agent 为中心，但恰好证明 harness 不是 coding-only 现象。OpenClaw 把 Gateway 明确称为 control plane，核心围绕 sessions、channels、skills、routing、web surfaces 和安全边界展开；Hermes 则把 gateway、SQLite session store、FTS5 memory、skills、delegate tool、cron、MCP 与多种 terminal backend 放到同一运行面。二者共同点都不是“提示词写得更会”，而是把 session、memory、skills、gateway、cron、sub-agent 当作系统事实。[^openclaw-hermes-ch2]

对本书而言，OpenClaw 和 Hermes 只需要简单分析，因为它们不是最贴近“AI 软件工厂”的主样本；但它们非常有价值，因为它们说明一旦 agent 要跨渠道、跨时段、跨环境连续行动，control plane 一定会长出来。也就是说，harness 不是 coding agent 的偶然补丁，而是 agent product 普遍会演化出来的外层系统。[^openclaw-hermes-ch2]

### 4.5 OpenAI 1M LOC 案例真正说明了什么

相比 Claude Code 和 Codex 主要展示产品或仓库层面的运行时结构，OpenAI 的 1M LOC 案例展示的是组织生产层发生了什么变化：从 2025 年 8 月第一次提交到 2026 年 2 月，约五个月时间，三位工程师驱动 Codex 产出约 1M LOC、1500+ 个已合并 PR，平均每位工程师每天 3.5 个 PR，并宣称人类不直接写应用代码。[^openai-factory-ch2] 这个故事的重点不是“模型终于可以替代工程师”，而是工程师的工作对象上移了。

#### 4.5.1 这不是炫耀案例，而是一场强制约束实验

Ryan Lopopolo 在文章开头给出的设定非常有信息量：这支团队从一开始就刻意施加了 `0 lines of manually-written code` 的强约束，并用一句很像组织原则的话把它钉死了：`"Humans steer. Agents execute."`[^openai-factory-story-ch2] 这不是营销 stunt，而是一种 forcing function。它逼团队承认一件很多组织还不愿正视的事：如果 agent 真要成为主生产力，你就不能在关键时刻偷偷靠人工把洞补上，否则你永远不知道系统到底缺了什么。

正因为有这个约束，文章里的很多结论才可信。第一份 commit 是空仓库上的 late August 2025；初始 scaffold、CI、格式规则、包管理、应用框架，甚至最早那份 `AGENTS.md` 都是 Codex 自己写的。[^openai-factory-story-ch2] 换句话说，这不是“人类写好骨架、agent 负责填肉”，而是连骨架本身都在 agent 驱动下长出来。对本书来说，最关键的启发是：只有当人类不能直接接管实现时，组织才会被迫去建设真正的 harness。

#### 4.5.2 工程师角色为什么会上移

这篇文章最该反复读的，不是 1M LOC 这个数字，而是 OpenAI 对工程师新角色的定义。Lopopolo 写得很直接：早期进展慢，不是因为 Codex 不行，而是因为 environment was underspecified；真正缺的是 tools、abstractions 和 internal structure。于是工程师的主要工作，不再是亲手写每一行代码，而是不断追问：“缺了什么能力，怎样把它做得既 legible 又 enforceable for the agent？”[^openai-factory-story-ch2]

这和传统工程管理的差异非常大。过去一个 senior engineer 遇到问题，常见反应是自己下场把关键路径写掉；在这个实验里，那条路被刻意封死了。于是团队被迫做 depth-first 的 enablement：先让 agent 会设计、会测试、会 review、会操作环境，再用这些中间能力解锁更复杂的任务。换句话说，工程师从“代码作者”转成了“能力供给者”“环境设计者”“反馈环建筑师”。这正是 harness engineering 的组织学含义。

#### 4.5.3 为什么 legibility 会先于 intelligence

OpenAI 在这篇文章里反复强调的一个词是 legibility。这里的意思不是“代码写得漂亮”，而是 agent 能不能看懂、验证、继续沿着现有结构工作。文章给出的做法几乎是一套控制面样板：

- app 必须 bootable per git worktree，这样每个变更都有自己隔离的运行实例；
- Chrome DevTools Protocol 直接接进 agent runtime，让它能自己看 DOM snapshot、截图、导航和 UI 行为；
- 日志、指标、trace 通过本地 observability stack 暴露给 agent；
- 长任务可以持续数小时，文章里明确说经常看到单次 Codex run 工作六小时以上。[^openai-factory-story-ch2]

这组做法的共同点是：它们都在把系统状态从“人类肉眼可见”转成“agent 也可直接读取并利用”。这正是为什么文章会把一节标题直接写成 `Agent legibility is the goal`。[^openai-factory-story-ch2] 只有当 UI、日志、指标、线程状态、执行历史都变成 agent 可读事实，反馈环才真正闭合；否则系统再强，也只是把人类换成了一个更快但更盲的执行者。

#### 4.5.4 为什么文档、架构约束和 merge 哲学都变了

这篇文章真正成熟的地方，在于它没有把问题收缩成“多写点提示词”。OpenAI 团队很早就试过“one big AGENTS.md”，结论是 predictable 地失败：上下文挤占、重点失焦、快速腐烂、不可验证。最后他们把 `AGENTS.md` 降回目录，把 `docs/` 提升成 system of record。[^openai-factory-story-ch2] 这和本书前文关于 `AGENTS.md` 的判断完全一致：它必须短、稳定、常驻，上下文里只放地图，不放百科全书。

更重要的是，OpenAI 没把“好架构”停留在文档层。他们明确写到：documentation alone 不足以维持 agent-generated codebase 的 coherent；真正有效的是 enforcing invariants, not micromanaging implementations。[^openai-factory-story-ch2] 于是 business domain 分层、依赖方向、可允许边、数据 shape 边界、知识库 freshness、文档 cross-link、甚至“golden principles” 都被做成机器可检查的规则。

这会直接改变 merge 哲学。文章里有一段非常值得抄在团队墙上：随着 Codex throughput 上升，很多传统工程规范会变得 counterproductive；仓库采用 minimal blocking merge gates，PR 生命周期变短，test flake 更常通过 follow-up run 解决，因为在“agent throughput far exceeds human attention”的系统里，corrections are cheap，而 waiting is expensive。[^openai-factory-story-ch2] 这不是鼓吹降低质量，而是在说明：当产能模型变了，质量控制点也必须重排。

#### 4.5.5 1M LOC 真正说明了什么

如果把这篇文章只读成“OpenAI 用 AI 写了 1M LOC”，结论会非常浅。它真正说明的是，AI 软件工厂并不是把人拿掉，而是把人的位置往外推：人不再主要承担逐行实现，而是负责搭环境、写约束、造反馈、设计知识系统、定义架构边界、安排 merge 节奏、持续做 garbage collection。

文章最后一段几乎已经把本书主线说完了：他们最难的问题，现在都集中在 designing environments, feedback loops, and control systems 上。[^openai-factory-story-ch2] 这正是为什么 1M LOC 案例对本书有决定性意义。它不是在证明“模型自己会造软件”，而是在证明：当 agent 进入真实生产，真正稀缺的能力不是生成代码，而是构造一个让代码生成、验证、回放、纠偏和治理都能持续运转的 harness。

### 4.6 AGENTS.md 应该是目录，不是百科全书

对 `AGENTS.md` 更稳妥的处理方式，是把它视为短目录、不是长百科。它应该短、稳定、可常驻上下文，只放仓库定位、工具链版本、工作区拓扑、高频红线和指向 `docs/` 的目录。真正细节放在 `docs/` 里，按任务需要加载。Codex 的公开文档也明确把 `AGENTS.md` 当成一个单独的能力层，而不是把所有知识都塞进系统提示。[^agents-catalog-ch2]

反模式是把全部风格指南、API 手册、架构文档、on-call 流程塞进一个大 prompt。这样不仅浪费 token，更严重的是教会 agent 一种错误的上下文哲学：以为“上下文 = 曾经写下的全集”，而不是“上下文 = 当前任务需要的切片”。

### 4.7 “0% 人工审查”的边界

OpenAI 的极端案例不能直接搬到所有场景。内部工具链、非合规关键路径、风险自吸收时，可以把大量人工审查下沉到 CI、性质测试、结构化验证和指标门禁。医疗、金融、隐私、客户数据路径则不同：实名人工 reviewer、审计记录、变更控制和合规签字是事实要求，不是工程偏好。[^review-boundary-ch2]

因此大多数团队的目标都不该是追求“没有人看”，而是把人类从重复、低信号的逐行审查中解放出来，转向审查契约、门禁、失败分类和高风险边界。

### 4.8 把成熟样本压成全书的架构索引

如果把 Claude Code 的“器官”与 Codex 的“骨架”叠在一起，再把 OpenClaw / Hermes 的 control plane 经验作为侧证，可以把全书后续章节统一压成九个架构维度：

1. 事实流维度：session / thread / transcript 必须是独立、可恢复、可回放的持久层。
2. 生命周期维度：任务必须有单调、公开、跨表面一致的状态阶梯。
3. 能力平面维度：工具、shell、MCP、外部应用、人工输入都必须进入统一调度面。
4. 产物与验证维度：主产物、验证器、失败证据和终态裁决必须显式绑定。
5. 回放维度：实时流、历史流、刷新恢复和 UI 投影必须共享同一事实模型。
6. 隔离与恢复维度：worktree、resume、background task、disk output 这类机制必须成为运行时能力，而不是异常补丁。
7. 协作维度：sub-agent / swarm 需要角色、通信、权限、汇总与验证，而不是“多开几个窗口”。
8. 知识分层维度：`AGENTS.md`、docs、skills、memory 需要按常驻层、按需层、晋升层治理。
9. 操作员维度：dashboard、门禁、回滚、故障归因必须建立在同一条运行时事实流上。

第 6 章会先给出这九个维度如何组成最小可用 harness；第 7 到第 10 章分别展开能力平面、回放、操作员控制面和多 agent 编排；第 11 章把这些维度再上升为设计原则；第 12 到第 16 章则把原则压成路线图、边界、清单和收束。

下一章不再继续看成熟样本，而改用一组真实失败案例来回答另一个问题：当这些维度缺位时，系统具体会怎么坏。

[^layer1-harness-ch2]: 本章在此处综合 Fowler 关于 coding agent harness 的框架，以及 OpenAI 与 Codex 开源仓库关于 1M LOC、`AGENTS.md`、sandbox、approval、MCP 与 rollout 的工程边界；对应第 21 章参考文献 1、2、21。
[^layer2-harness-ch2]: 本章在此处综合 Anthropic 关于 managed agents 与 long-running harness 的接口抽象、Claude Code 本地源码镜像所体现的 session/compaction/sub-agent 机制，以及 OpenClaw/Hermes 在 gateway、memory、skills 与 sub-agent 上的产品形态；对应第 21 章参考文献 3、4、6、7、22、23、24。
[^claudecode-ch2]: 本章在此处根据 2026-04-23 对 Claude Code 本地源码镜像的结构审读，使用其 `Tool.ts`、`query.ts`、`main.tsx`、`services/tools/StreamingToolExecutor.ts`、`services/compact/*`、`tools/AgentTool/{AgentTool.tsx,loadAgentsDir.ts,resumeAgent.ts}`、`utils/{sessionStorage.ts,fileStateCache.ts,worktree.ts,teammateMailbox.ts}`、`utils/task/diskOutput.ts` 与 `services/AgentSummary/agentSummary.ts` 所体现的 tool context、主循环、MCP、技能/插件、子 agent、swarm mailbox、分层 compaction、resume、disk-backed output 和 worktree 机制；对应第 21 章参考文献 24。
[^claudecode-story-ch2]: 本章在此处综合 Anthropic Claude Code 产品页关于 “majority of code is now written by Claude Code” 的表述，以及 Anthropic 内部团队案例中关于律师、设计师和数据科学家使用 Claude Code 的故事，用来说明 Claude Code 已经超出传统 coding assistant 的边界；对应第 21 章参考文献 36、37。
[^claude-code-paper-ch2]: Jiacheng Liu 等，*Dive into Claude Code: The Design Space of Today's and Future AI Agent Systems.* 本章在此处使用其基于公开 TypeScript 源码的 Claude Code 分析，包括五类价值目标、十三条设计原则、七个高层组件、五层子系统结构、权限系统、五层 compaction、MCP / plugins / skills / hooks、subagent delegation 与 append-oriented session storage；对应第 21 章参考文献 41。
[^codex-oss-ch2]: OpenAI, *openai/codex* 开源仓库。 本章在此处使用其 `codex-rs/cli/src/main.rs`、`codex-rs/app-server/README.md`、`codex-rs/app-server-protocol/src/protocol/v2.rs`、`codex-rs/tools/src/lib.rs`、`codex-rs/thread-store/src/lib.rs`、`codex-rs/rollout/src/lib.rs`、仓库根 `AGENTS.md` 与 `docs/agents_md.md` 中关于 CLI surfaces、Thread/Turn/Item、tool registry、thread persistence、rollout、sandbox、approvals 与 `AGENTS.md` 的公开结构；对应第 21 章参考文献 21。
[^codex-story-ch2]: 本章在此处综合 OpenAI 关于 *Introducing Codex* 与 *Introducing the Codex app* 的产品叙事，以及 Codex 开源 README / app-server README 对本地 CLI、rich interfaces、多线程、多 agent 与 worktree 的公开描述，用来补足 Codex 从云端并行 agent 到本地 runtime kernel 的演进故事；对应第 21 章参考文献 21、39、40。
[^openclaw-hermes-ch2]: 本章在此处综合 OpenClaw README 中关于 Gateway control plane、sessions、channels、skills 与 routing 的描述，以及 Hermes README/AGENTS 中关于 gateway、SQLite session store、memory、skills、delegate tool、cron 与 MCP 的结构；对应第 21 章参考文献 22、23。
[^openai-factory-ch2]: OpenAI, *Harness Engineering: Leveraging Codex in an Agent-First World.* 本章在此处使用其关于 1M LOC、1500+ merged PR、三位工程师与低人工写码比例的案例数字；对应第 21 章参考文献 2。
[^openai-factory-story-ch2]: 本章在此处使用 Ryan Lopopolo 文章中关于 “Humans steer. Agents execute.”、无手写代码、worktree、repository knowledge 作为 system of record、minimal merge gates 与 garbage collection 的叙述，用来补足 1M LOC 案例的组织与控制系统视角；对应第 21 章参考文献 2。
[^agents-catalog-ch2]: 本章在此处综合 Fowler、OpenAI 与 Codex 开源文档关于 `AGENTS.md` 作为短目录、细节下沉到 `docs/` 的做法；对应第 21 章参考文献 1、2、21。
[^review-boundary-ch2]: 本章在此处前半使用 OpenAI 关于极端自动化案例边界的表述；后半关于医疗、金融、隐私与客户数据路径的要求属于本文的工程外推；对应第 21 章参考文献 2。

---

## 5. 通用失败类别：一组真实失败案例如何把问题暴露出来

如果说第 4 章回答的是成熟系统在建设什么，那么这一章回答的是：一旦这些机制缺位，系统会怎样坏。这里使用一组内部系统的真实失败案例，不点名，因为我们关心的是结构，不是品牌。与 Codex 把 `Thread` / `Turn` / `Item` 做成显式协议、Claude Code 把 transcript、resume、worktree 和多 agent 协调做成独立模块相对照，这组失败案例恰好暴露了另一面：事实流、回放、验证和调度一旦没有被系统化，系统就会重新滑回“看起来像聊天，其实不是运行时”的状态。

这一章最好不要当成一串 bug 标签来读，而应该把它当成几场反复发生的事故现场。每一类失败，起初看起来都像一个局部实现问题：一个气泡没刷新，一个文件选错了，一个验证器输出太简略。但真正昂贵的地方并不在 bug 本身，而在于系统同时向不同角色说了不同的话。用户看到的是一套状态，操作员看到的是另一套状态，底层执行层里又是第三套状态。只要这三套事实没有被收束到同一条运行时事实流里，团队就会持续花时间在“到底发生了什么”上，而不是花时间在“如何修正它”上。

下面这几类失败，都是这种结构性问题的不同表面。

### 5.1 后台任务进度 bug

一个典型现场是：用户在会话里发起一个后台研究或生成任务，子任务其实已经在跑，底层日志也在持续输出进度，但父会话里的状态气泡还停在“开始中”或者更早的旧状态。用户等了几分钟没有看到变化，很自然会得出两个结论之一：要么任务挂了，要么系统没收到命令。于是他会重试一次，或者切到别的会话再回来确认。结果往往是系统里出现两份几乎相同的后台任务，甚至争抢同一个产物路径。

这类事故最麻烦的地方，不是任务本身有没有跑，而是“执行事实”和“可见事实”开始分叉。支持同学看到的是一个看起来停滞的任务，底层工程师看到的是一个其实已经推进的子进程，用户看到的则是一个似乎没有响应的产品。三方都没有说错，但三方说的不是同一个东西。Claude Code 之所以会把 `agentSummary.ts`、`diskOutput.ts`、`sessionStorage.ts` 做成独立模块，就是因为一旦后台任务存在，父级可见进度就必须成为运行时事实，而不能继续依赖 stderr 文本或人类猜测。

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
- “本地能跑”但线上 canary 失去信心

### 5.2 `run_pipeline` / `deep-search` 状态漂移

另一种更隐蔽的事故是状态漂移。一个深度研究任务可能已经进入第二或第三阶段，底层 API 仍然把它视为 `running`，但用户界面上的阶段气泡却像冻结了一样；刷新页面后，气泡又跳到另一个看似合理、但其实不是当前真实阶段的位置。于是同一个任务在同一时刻会出现三种说法：API 说还在跑，UI 像是卡住，回放看起来又像进入过别的阶段。

这比单纯“不刷新”更危险，因为它制造的是假一致性。用户会以为某个阶段已经结束，操作员会以为页面只是渲染慢，工程师则会从日志里看到流水线其实一直在前进。真正的根因是多个状态通道分别在解释任务：一套来自后端执行，一套来自 UI 气泡，一套来自 replay。Codex 用单一的 `thread/started`、`turn/started`、`item/*`、`turn/completed` 事件流避免这种分叉；这正说明一旦系统允许多个表面各自推断阶段，阶段本身就不再可信。

观察到的类别：

- 深度研究运行仍在进行，但状态气泡和任务 API 分离
- API 可能显示 running，而气泡像是冻结或处于错误阶段

根因：

- 多个状态通道，缺乏强一致协调
- UI/API/replay 没有强制使用单一规范阶段阶梯

修复方向（事实协议与生命周期契约）：

- `harness.event.v1` 进度 schema
- 运行时事件入口 -> `TaskStatusChanged` -> `/api/sessions/:id/tasks` + SSE
- UI 回放使用同一份后端事件事实

### 5.3 会话切换 / 状态气泡污染

最伤用户信任的一类事故，是会话污染。一个操作员从当前会话切到兄弟会话，本来只是想确认另一项任务是否完成，结果却在新会话里看到旧会话的状态气泡、进度描述，甚至像是别的任务正在当前对话里继续推进。到了这一步，问题就已经不再是“显示错了一下”，而是用户无法判断屏幕上哪些事实真正属于当前上下文。

这类问题表面上像前端 bug，本质上却是作用域边界失守。只要 session/topic 作用域没有在事件层、回放层和渲染层端到端强制执行，实时流和历史流就会把彼此的状态带进错误的容器里。成熟系统之所以把 `Thread` 或 transcript 当作硬边界，不是为了架构好看，而是因为一旦跨会话进度泄漏发生，产品在用户心里的可信度会瞬间掉到底。

观察到的类别：

- 切到兄弟会话时看到另一个会话的进度/状态
- 用户无法信任哪些信息属于当前对话

根因：

- topic/session 作用域没有端到端强制执行
- 回放流和实时流混在一起，缺少严格会话归属检查

修复方向：

- 在任务状态事件中强制 session/topic 作用域
- 线上门禁中加入回放过滤和串扰检查
- 明确“无跨会话进度泄漏”的验收标准

### 5.4 产物契约执行缺口

还有一种事故，往往在任务“看似成功”时才暴露出来。系统把任务标成完成，用户也看到了绿色终态，但真正打开交付物时才发现文件错了：可能写到了错误目录，可能产出的是中间草稿而不是主产物，也可能主文件根本没生成，只是某个同名或近似名文件被启发式地当成了结果。对用户而言，这比直接报错更糟，因为它先给了一个成功信号，再把验证成本转嫁给人类。

这类问题说明系统实际上没有真正的“产物契约”，只有一些“看起来像结果”的启发式。只要主产物不是被显式声明的事实，而是运行结束后再根据文件名、路径或最近修改时间去猜，系统就一定会在复杂工作流里交付错误对象。Claude Code 与 Codex 都在不同层面强调这一点：动作可以灵活，但最终交付物必须被明确命名、明确验证、明确挂到终态上。

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

### 5.5 验证器运行器不完整

有些团队已经意识到需要验证器，于是给系统加了 lint、存在性检查、简单领域校验。但事故仍然不断，因为验证器虽然“存在”，它的输出却不足以支撑调试和回放。一个典型场景是：任务失败了，界面或日志里只留下一个模糊的 `failed` 或 `validation error`。没有人知道到底是哪一个验证器失败了、期望和实际是什么、证据文件在哪里、这是超时还是断言失败。于是团队唯一能做的事情，只剩整轮重跑。

这类问题暴露的是“验证器运行器”本身没有被产品化。验证不是写几个脚本就结束，它还需要一个能把验证过程转成结构化证据的运行器。操作员要能看到哪个 validator 失败，开发者要能回放失败证据，系统要能根据失败类别决定重试、降级还是终止。没有这一层，验证器只是一些散落的脚本；有了这一层，验证器才会变成真正的终态门禁。

观察到的类别：

- 验证器存在，但输出对操作员/开发者过于粗糙
- 缺少足够的类型化证据用于调试和回放

必需姿态：

- 类型化的逐验证器结果
- 持续时间、原因类别、可回放证据路径
- 明确超时和失败分类

### 5.6 操作员盲区

最后一种失败不是单点 bug，而是一种长期运营上的“盲区感”。系统里已经有很多计数器：多少任务完成、多少失败、多少重试、多少超时。但当值班同学真正被问到“这个任务为什么失败”时，他依然得去翻多处日志、看多个 API、比对多个时间戳，最后靠脑内拼图把故事拼出来。换句话说，系统有数字，没有叙事；有数据，没有操作员可用的事实组织。

这类问题在规模小的时候容易被忍受，因为熟悉系统的人还能靠经验补足空白；一旦任务量上来、值班轮换变多、问题跨会话跨主机出现，盲区就会立刻变成成本。Claude Code 会做子 agent 摘要，不是为了界面好看，而是因为操作者需要在几十秒内知道“最近在做什么”；Codex 把 thread/turn/item 这样的层次公开出来，也是在给 dashboard 与 replay 提供天然的叙事骨架。操作员视图如果不能快速回答“发生了什么、卡在哪、证据在哪、下一步该怎么做”，那它就还不是控制面，只是统计页。

观察到的类别：

- 有计数器，但没有紧凑的操作员叙事
- 很难快速回答“这个任务为什么失败”

修复方向：

- 操作员摘要和仪表盘都由规范任务/harness 状态驱动
- 不允许只存在于仪表盘中的隐藏逻辑

合在一起，这些失败不是六个独立 bug。它们更像六种不同的事故叙事，但最后都指向同一个根因：系统把类似聊天的输出当成了运行时事实，于是每一层都在自己解释“现在到底发生了什么”。下一章会把这个模式转化为关于状态、事件、验证和回放的具体架构。

### 5.7 失败模式博物馆：每个事故都要沉淀成结构

把事故做成“失败模式博物馆”的价值，在于强迫团队把故事变成结构。注意，这不是要消灭“故事”，而是要把故事压缩成以后还能复用的结构。一个合格的失败条目至少包含三栏：症状、根因、修法。

症状是用户或操作员看到的表面，例如状态气泡冻结、产物丢失、会话串扰。根因必须落到四支柱之一：session 没有持久事实、harness 没有稳定协议、tool 没有问责边界、verification 不独立或不阻断。修法不能停留在“改 prompt”或“加日志”，而要转成 schema、gate、fixture、validator、dashboard 诊断或文档契约。

更具体地说，一个好的条目应该能回答五个问题：用户当时看到了什么；系统底层实际在做什么；两者为什么会分叉；哪一层边界缺失了；以后怎样让同类事故在 CI、replay 或 dashboard 上更早暴露。只有这样，事故才会从一次性的火警变成组织的长期免疫力。

任何团队后续每次遇到 harness 事故，都应该按这个格式归档。否则团队只是在修 bug，没有增长系统免疫力。

### 5.8 事故复盘章节模板：从火警到组织免疫

如果要把“失败模式博物馆”真正变成一本能不断增厚的工程书，团队还需要统一的事故复盘章节模板。好的模板不是为了写得更像公文，而是为了保证每一篇复盘最后都能沉到 schema、validator、dashboard、runbook 或 skill，而不是停在“大家下次注意”。

一个完整的 harness 事故复盘，至少应该包含下面十段：

1. `事故摘要`：一句话说清用户表面看到了什么，系统最终造成了什么错误裁决。
2. `用户影响与业务影响`：哪些用户或下游系统受影响，错误持续多久，是否有错误交付、重复执行、数据污染或合规风险。
3. `时间线`：从触发、发现、缓解到修复，按绝对时间列出关键事件，而不是只写模糊顺序。
4. `任务/agent 拓扑`：列出 root task、child task、role、worktree、外部能力和人工介入点，让读者知道这不是单进程 bug。
5. `五层断裂点解剖`：逐层分析 `session / capability plane / verifier / operator dashboard / swarm` 各自出了什么问题，哪些层是缺失，哪些层是误判，哪些层只是把错误放大了。
6. `证据包`：列出事件片段、artifact 路径、validator 输出、dashboard 截图、日志片段和 commit / deploy 边界。没有证据，复盘就只是回忆录。
7. `根因归类`：把问题落到四支柱和九个架构维度里，而不是写成“大模型抽风”或“偶发 race condition”。
8. `为什么现有防线没有拦住`：明确是没有 validator、validator 不阻断、scope 不完整、dashboard 不可读，还是 canary / mini-fleet 没覆盖到对应路径。
9. `修复与长期动作`：区分 hotfix、结构修复、发布门禁、知识晋升和组织流程调整，不把所有事情都塞成一个 patch。
10. `组织沉淀`：这次事故会变成什么长期资产，例如新的 validator、`AGENTS.md` 规则、skill、runbook、dashboard 信号、回放 fixture 或发布门禁。

这样的模板之所以重要，是因为 harness 事故往往不是“哪一行代码错了”这么简单，而是多个表面一起说了不同的话。统一模板能逼团队每次都沿着同一条控制链回溯，从而让事故真正转化成组织免疫力。

---

## 6. 核心 Harness 架构：把样本反推成可复用总图

第 4 章给了正向样本，第 5 章给了失败叙事。把两者叠在一起看，可以得到一个比“某个仓库的实现细节”更稳定的结论：成熟 agent 系统最终都会收敛到一条共同的运行时总图。Claude Code 把这张总图长成了一套丰满器官；Codex 把它拆成了一套更清楚的模块边界。我们真正要吸收的不是它们的代码排版，而是这张总图背后的责任分工。[^claudecode-codex-spine-ch4]

把第 3 章的控制论语言落到运行时，可以先看五个角色：受控对象是 task / session / thread；目标与约束是用户目标、验收标准、artifact 契约、权限和预算；传感器是 tool 回执、文件变化、validator 结果、child summary 和 turn/item 事件；控制器负责继续、压缩、重试、派工、升级、打断、恢复；执行器则是 shell、文件系统、MCP、子 agent、worktree、外部 API 和 artifact 写入。

按这个框架回看 Claude Code，`ToolUseContext` 和 `query.ts` 是控制器入口，`StreamingToolExecutor.ts` 是执行器调度面，`sessionStorage.ts`、`fileStateCache.ts`、`agentSummary.ts`、`diskOutput.ts` 是传感器与状态保持层，`microCompact` / `compact.ts` / `resumeAgent.ts` / `worktree.ts` 则负责稳定性控制。Codex 把同一逻辑拆得更显式：`Thread` / `Turn` / `Item` 建模受控对象，`thread-store` 与 `rollout` 负责持久层，`app-server` 与 notifications 公开观测总线，`tools` registry、sandbox、approval、`thread/resume`、`thread/fork`、`turn/interrupt` 构成执行与稳定边界。[^claudecode-codex-spine-ch4]

```text
用户任务 / 外部触发
        |
        v
Session / Thread 事实流
        |
        +--> 调度循环（turn / tool / sub-agent / resume）
        |
        +--> 能力平面（shell / fs / web / MCP / human input）
        |
        +--> 产物与验证（artifact policy / validator / evidence）
        |
        +--> 回放与摘要（API / SSE / dashboard / operator summary）
        v
终态裁决（ready / failed）与可追责证据
```

关键规则只有一句：任何用户可见状态，都必须能沿着这张图一路回溯到同一条事实流。

为了避免后文一会儿讲 Claude Code 的产品器官，一会儿讲 Codex 的协议骨架，到第 11 章又突然换成抽象原则，这里先固定一套贯穿全书的运行时词汇。后面凡是提到 Claude Code 的 `sessionStorage.ts`、`StreamingToolExecutor.ts`、`agentSummary.ts`，或 Codex 的 `Thread` / `Turn` / `Item`、`tools`、`thread-store`、`app-server`，都只是在这张表里占不同位置。[^claudecode-codex-spine-ch4]

| 统一术语 | 它回答的问题 | Claude Code 的落点 | Codex 的落点 |
|---|---|---|---|
| 事实流 | 什么真实发生过 | `sessionStorage.ts`、transcript、`resumeAgent.ts` | `Thread` / `Turn` / `Item`、`thread-store`、`rollout` |
| 生命周期 | 系统现在推进到哪一步 | `query.ts` 主循环、compaction、resume 迁移 | `turn/start`、`turn/interrupt`、thread / turn notifications |
| 能力平面 | 系统能调用什么动作 | `ToolUseContext`、`StreamingToolExecutor.ts`、MCP、shell | `tools` registry、`command/exec`、`fs/*`、`mcpServer/tool/call` |
| 产物与验证 | 什么才算完成 | `diskOutput.ts`、产物外置、policy / hooks | artifact item、approval、sandbox、review / gate |
| 回放 | 用户与系统如何看到同一事实 | transcript、`agentSummary.ts`、resume | `app-server` notifications、rich interfaces |
| 隔离与恢复 | 长任务怎样不失稳 | `worktree.ts`、background task、resume | `thread/fork`、`thread/resume`、sandboxing |
| 协作 | 多 agent 如何分工 | `AgentTool.tsx`、`loadAgentsDir.ts`、`teammateMailbox.ts` | `spawn_agent`、`send_input`、`wait_agent` |
| 知识分层 | 经验怎样沉成长期资产 | skills、hooks、memory scope | `AGENTS.md`、`docs/agents_md.md`、plugins / skills |
| 操作员面 | 人怎样监督系统 | summary、disk output、恢复入口 | app-server rich interfaces、thread / project 视图 |

### 6.1 从失败反推，最小可用 harness 至少要回答什么问题

第 5 章那六类事故，其实只是在追问六个更底层的问题：

1. 这条任务事实到底写在哪？
2. 当前生命周期由谁裁决？
3. 工具、副作用和外部系统由谁调度？
4. 哪个产物算交付，谁来验证？
5. 刷新页面或切换会话后，用户还能不能看到同一套事实？
6. 出事时，操作员能不能在几十秒内拼出完整叙事？

后台任务进度 bug、状态漂移、会话污染，逼我们承认“聊天文本”不是事实流；产物契约缺口和验证器不完整，逼我们承认“模型说完成”不是终态；操作员盲区则逼我们承认，没有摘要、回放和证据组织，系统就算内部做对了很多事，也仍然无法运营。

因此，第 4 章末尾那九个维度并不是分析框架的装饰，而是从失败中被倒逼出来的最小系统边界。

### 6.2 生命周期与事实流是第一层骨架

公开状态机仍然应当保持简单：

- `queued`
- `running`
- `verifying`
- `ready`
- `failed`

内部当然可以存在更细粒度状态，但产品表面不应依赖一长串不断变化的内部标签。因为一旦 UI、API、replay、dashboard 各自解释一遍阶段，系统就会重新掉回第 5.2 节那种“每一层都没说错，但每一层说的不是同一件事”的状态。

如果用上面那张统一词汇表来重述，第 4 章里关于 Claude Code / Codex 的产品故事，首先都落在“事实流 + 生命周期”这两层。Codex 的 `Thread` / `Turn` / `Item` 把这件事表达得很清楚：线程承载持久历史，turn 承载一次执行，item 承载输入、输出和副作用。Claude Code 虽然没有用同一套名词，但 `query.ts`、`sessionStorage.ts`、`resumeAgent.ts`、`agentSummary.ts` 实际上也在做相同切分：一轮交互是什么、后台动作是什么、恢复时哪些事实要继续存在。成熟系统真正的共识不是术语相同，而是都不再把“一整段聊天记录”当成唯一状态机。[^claudecode-codex-spine-ch4]

### 6.3 能力平面、产物与验证：把能力、工作流和结果拆开

第 4 章里那些“Claude Code 为什么能既写代码又写文章、还能调 MCP 和多 agent”“Codex 为什么像 agent 内核”的故事，到了架构层其实只剩三件事：能力平面决定系统能做什么，工作流契约决定系统可以怎么做，产物与验证决定系统何时算完成。要把 Claude Code / Codex 的经验移植到别的系统，最重要的不是照搬模块名，而是先把契约分层：

```text
第 A 层：能力契约
  系统能调用哪些动作：shell、fs、web、MCP、sub-agent、human input

第 B 层：工作流契约
  这类任务允许什么路径：产物位置、spawn 规则、权限边界、验证前置条件

第 C 层：结果契约
  生命周期、主产物、验证结果、失败证据、终态裁决
```

很多团队的问题，不是“没有契约”，而是把三层揉成一团。比如把工具描述写进 prompt，把验证要求埋在脚本里，把最终产物靠文件名猜。这种做法短期能跑，长期一定会在第 3.4 和第 5.5 节那两类事故里出问题。

### 6.4 四支柱不是概念图，而是所有权边界

把上面三层契约落进系统实现，最后会自然收敛到四根支柱：

- Session：可恢复、可回放、append-only 的事实流。
- Harness：读取事实、驱动循环、调度工具、处理失败与升级的脑干。
- Tools：带权限、带 schema、带审计边界的动作词汇表。
- Verification：独立于生成器的判断层，负责裁决 ready / failed。

这四根支柱真正有价值的地方，在于它们对应了清晰的所有权边界。换句话说，九个维度描述的是运行时语义，四支柱描述的是团队如何持有这些语义。前者回答“系统必须有哪些真相边界”，后者回答“这些边界由谁实现、谁守住、谁裁决”。

Session 团队负责“什么是真实发生过的”；Harness 团队负责“系统下一步怎么行动”；Tools 负责人负责“允许系统做哪些副作用”；Verification 负责人负责“什么才算真的完成”。只要这四件事被混在一个 prompt、一个巨型 controller 或一个前端状态树里，团队很快就会失去可维护性。

Claude Code 在 `StreamingToolExecutor.ts`、`worktree.ts`、`sessionStorage.ts`、`diskOutput.ts`、`agentSummary.ts` 里，把这四根支柱做成产品器官；Codex 则在 `tools`、`thread-store`、`rollout`、`app-server-protocol` 里，把同一分工做成协议化边界。前者说明这些能力在真实产品里必须存在，后者说明这些能力可以被更清晰地组织。第 11 章所谓“设计原则”，本质上就是把这里这套器官与边界，再翻译成团队可长期复用的规范语言。[^claudecode-codex-spine-ch4]

### 6.5 朴素事实流为什么比“聪明状态”更可靠

Karpathy 的 autoresearch 经验提醒过一个很朴素但很重要的事实：长期知识系统最难的不是“让模型想起来”，而是 bookkeeping。`session.md` 提供人类可读叙事，`session.jsonl` 提供机器可回放事件。这个组合看起来不花哨，但它有一个决定性优势：模型会换，UI 会换，工具会换，事实流最好不要跟着频繁换。[^karpathy-bookkeeping-ch4]

很多系统一开始会尝试更“聪明”的状态层：把前端状态当事实、把聊天 transcript 当事实、把临时日志解析当事实、把缓存快照当事实。它们往往在 demo 阶段更轻，但一旦进入刷新恢复、跨设备继续、后台任务、子 agent 协作和事故排查，就会发现这些状态都不够硬。

因此，任务状态、SSE 回放、操作员仪表盘，本质上都应从同一条 append-only 事实流派生，而不是各自维护一份“看起来差不多”的影子状态。

### 6.6 这张总图怎样展开成后续章节

从这里开始，后面的章节不再新增一个个并列概念，而是沿着这张总图把关键维度展开：

- 第 7 章展开能力平面与生态桥接：为什么万用 agent 必然走向 MCP、外部应用和多语言工具。
- 第 8 章展开回放与用户事实：为什么 UI 只能投影事实，而不能自己发明生命周期。
- 第 9 章展开操作员控制面与发布真实性：为什么 dashboard、门禁和事故归因必须共享同一条事实流。
- 第 10 章展开 sub-agent / swarm：为什么多 agent 的关键不是并行，而是角色、隔离、通信和验证。
- 第 11 章再把同一套词汇表改写成九条设计原则和九组反模式，让“产品故事 -> 架构维度 -> 设计法则”成为一条连续论证，而不是三套散开的语言。

[^claudecode-codex-spine-ch4]: 本章在此处综合 Claude Code 本地源码镜像、*Dive into Claude Code* 中七组件与五层子系统分析，以及 Codex 开源仓库中 `app-server-protocol`、`tools`、`thread-store`、`rollout` 所体现的模块边界，用来反推 agent harness 的通用总图；对应第 21 章参考文献 21、24、41。
[^karpathy-bookkeeping-ch4]: Andrej Karpathy, *LLM Wiki.* 本章在此处使用其关于 autoresearch 双文件与 bookkeeping 的思路，说明 `session.md` + `session.jsonl` 这类事实流设计的价值；对应第 21 章参考文献 9。

---

## 7. 能力平面与生态桥接：不要把 agent 关在单一语言里

第 6 章那张总图里，最容易被低估的是“能力平面”。很多团队把它理解成“再接几个工具”，但 Claude Code 和 Codex 给出的实际信号更强：想做万用 agent，就必须默认系统会不断越出本语言、越出本进程、越出本仓库，去调用 shell、浏览器、MCP、外部 API、第三方脚本，甚至别的 agent。

### 7.1 为什么万用 agent 必然走向能力平面

Claude Code 之所以能既写代码、又写文章、写 slide、做研究、驱动外部 MCP 服务，不是因为它为每个场景单独训练了一套 prompt，而是因为这些场景都能被还原成一组相对稳定的动作原语：

- 读写本地产物；
- 运行命令和脚本；
- 访问网络与外部服务；
- 读取外部资源；
- 派工给别的 agent；
- 在必要时向人类请求输入或确认。

Codex 也在公开协议面上把同样的能力列得很清楚：`command/exec`、`fs/*`、`mcpServer/tool/call`、`mcpServer/resource/read`、`tool/requestUserInput`、`spawn_agent` 等都不是附属功能，而是 runtime 的原生动作词汇表。两套系统说明的是同一件事：所谓“万用 agent”，本质上是一个能编排多种能力源的运行时，不是一个更长的 system prompt。[^capability-plane-ch5]

### 7.2 Claude Code / Codex 如何把外部能力接进来

Claude Code 在 `ToolUseContext` 里直接持有 `mcpClients`、`mcpResources`、`agentDefinitions`、`commands`、`tools`、权限上下文与 `AppState`。这说明它的核心对象不是“当前正在编辑的代码文件”，而是“当前正在推进的任务线程”。任务线程会拿着同一套身份、权限、记忆与摘要机制，去调用不同来源的能力。

Codex 的路线更偏协议化。它把文件系统、命令执行、MCP、人工输入、多 agent 工具统一暴露在工具注册面和 app-server 协议上。这样做的意义在于，CLI、桌面端、Web 或未来的别的客户端，不需要各自重新发明一遍“怎么执行 shell、怎么继续 thread、怎么向外部 agent 派工”。能力面已经先在内核层被抽象出来。[^capability-plane-ch5]

这里真正值得学习的不是具体模块名，而是一个架构判断：外部能力不是插件尾巴，而是运行时主干的一部分。

### 7.3 失败案例怎样倒逼出协议化接入

一旦外部能力没有进入统一协议面，第 5 章那几类事故会立刻重新出现：

- 某个 Python skill 用 stderr 表达进度，父任务就会回到 3.1 的进度漂移；
- 某个 Node 脚本自己猜主产物路径，就会回到 3.4 的产物契约缺口；
- 某个 shell job 不带 session / topic scope，就会回到 3.3 的会话污染；
- 某个外部 verifier 只返回一行字符串，就会回到 3.5 的验证器不完整；
- 某个集成只在自己的日志里留证据，操作员就会回到 3.6 的盲区。

所以“桥接”绝不只是 SDK 便利性问题。它的本质是：所有外部能力都要在进入系统时就被收口到同一套 session、scope、artifact、validator、evidence 规则里。

### 7.4 落地模式：入口允许多样，消费端必须强约束

更稳妥的落地方式通常是下面这组组合：

- 为 Python / Node / shell / 外部服务提供轻量事件发射辅助层；
- 提供 CLI 或环境变量形式的兜底桥接，例如 `HARNESS_EVENT_SINK`；
- 允许 sink 缺失时 no-op，但不允许跳过结果契约和终态验证；
- 在消费端统一校验 schema、session/topic scope、phase、artifact 引用与 validator 证据。

这条原则可以压成一句话：发射端允许语言和生态多样性，消费端必须保持运行时真相的唯一性。

如果系统以后还要接插件市场、第三方 workflow 或外部 agent，这一章讲的能力平面就是最先要守住的边界。否则平台每开放一步，事实协议就会被侵蚀一步。

[^capability-plane-ch5]: 本章在此处综合 Claude Code `ToolUseContext`、MCP 与 agent 定义相关实现，以及 Codex `tools` 与 `app-server` 协议面中关于 command、fs、MCP、human input、多 agent 工具的公开边界，用来说明万用 agent 必须先拥有统一的能力平面；对应第 21 章参考文献 21、24。

---

## 8. 回放与用户事实：前端只能投影运行时真相

一个跑了二十分钟的任务，你中途切去回邮件，回来顺手刷新。进度条归零，那行“正在重构第 3 个模块”不见了，界面要么卡在永远转圈的“运行中”，要么从头问你“需要我做什么”。后台其实一切照旧——任务在那台 worker 上稳稳推进——可你这一侧已经慌了。

这一慌的根源不在后台，在前端对“真相”的态度。如果第 7 章守的是能力入口，第 8 章守的就是用户表面的真实性：前端是运行时事实能否被用户正确看见的**最后一跳**，是第 2 章 §2.3 那个负反馈环里离人最近的一枚传感器。传感器一旦开始编数据，系统就掉回第 5.1 到 5.3 节那些事故里——用户看到的进度和真实进度对不上，而且没人说得清哪个算数。

### 8.1 回放要解决的不是“刷新后保留聊天”

先把那次刷新，拆到秒。

任务跑到第 1,140 秒。屏幕上，进度停在“正在重构 `auth/` 下的第 3 个模块（3/7）”，上面滚着十几条工具调用记录。你按下 ⌘R。

接下来发生什么，**完全取决于这个前端把“状态”存在了哪里**。

在一个把 replay 当成“重画聊天”的系统里，过程是这样的。浏览器内存被刷新清空，前端于是做两件事：从 `localStorage` 里捞出那个缓存的消息数组，把十几条气泡重新画出来；同时向 `/messages?session=…` 要一遍历史。麻烦在于，这两样东西里**都没有**“3/7”“正在重构”这种东西——它根本不是一条消息，而是前端在上一段会话里，靠着陆续收到的流式片段，在自己内存里一点点攒出来的推断。内存一清，推断就蒸发了。前端只剩最后一点依据：历史里最后一条记录是什么？是一条还没等到结尾的工具调用。它只能二选一——要么乐观地接着转圈（于是你盯着一个永不结束的“运行中”），要么判定“上一轮大概结束了”、弹出输入框问你下一步。而与此同时，那台 worker 正一声不吭地把第 4 个模块重构到一半。

谎言就在这一帧诞生：不是后台算错了，是前端在内存清零的瞬间，被迫拿“最后一条消息”去冒充“当前状态”——而这两者，从来不是一回事。

换一种存法，同一次刷新会平静得近乎无聊。

这一次，后台维护的是一条只追加、不修改的事件日志（后端工程师熟悉的 `事件溯源`：当前状态不存成可改写的快照，而是由一条不可变的日志折叠出来）。你刷新时，流大概停在这样一个位置：

```text
turn/started     { turn: 57 }
item/tool_call   { name: "edit", path: "auth/oauth.rs", phase: "refactor", step: "3/7" }
item/tool_result { ok: true }
turn/completed   { turn: 57 }
turn/started     { turn: 58 }      ← ⌘R 发生在这里
```

前端不去重画消息。它做的是另一件事：向 `/sessions/:id/state` 要一份快照（阶段 `refactor`、进度 `3/7`、主产物路径、最近一个动作），再订阅从 `turn 58` 起的增量，然后把两者**折叠（fold）一遍**，落回那个一模一样的 `3/7`。注意：它没有“记住”任何东西。它没有私藏的状态可丢，因为它的“当前状态”压根不是攒出来的，而是事实流的一个纯函数——给同样的日志，它每次都吐出同样的值。刷新、重连、切走再切回，在它眼里都只是“重新求一次值”。

两种存法的差别，一句话就能戳破。前一种，“当前状态”是前端的私有内存，刷新即失忆；后一种，“当前状态”是事实流的纯函数，刷新只是重算。所以 replay 真正要解决的，从来不是“把聊天留住”——而是**让前端根本没有自己的记忆可丢**。

剩下那一串考验——重连、切会话、worker 重启、流中断后重新订阅——本质上是同一道题的不同问法：你的前端，是有自己的记忆、还是只会重算？想清楚这一个，后面全是它的推论。

### 8.2 一个对象模型，还是两个

上一节那条事件日志藏着一个容易被忽略的前提：**直播给你看的流，和事后回放给你看的历史，必须是同一个对象模型。** 这话听起来像废话，可一旦违反，bug 会以最难查的形式出现。

设想团队为了赶进度，分别写了两条路径。直播路径直接消费 WebSocket 推来的事件，前端边收边更新一个内存状态机；历史路径则是另一个人写的，从数据库把消息拉出来、用一段“看起来差不多”的逻辑重建状态。两段代码，对同一件事各有一套理解。某天有人改了后端：`turn/completed` 之后、下一个 `turn/started` 之前，多塞了一条 `item/verification`。直播路径的状态机认得它，把阶段推进到“验证中”；历史路径那段重建逻辑没人同步改，遇到这条 item 直接忽略，于是回放出来停在“执行中”。结果就是：任务跑着的时候你看到“验证中”，刷新一下变成“执行中”，再等一秒推送进来又跳回“验证中”。用户报的 bug 是“状态会闪”，你查了三天——因为问题不在任何一条路径里，而在**它们俩对世界的解释不一致**。

Codex 把这条坑直接堵死在了内核层。它的 `app-server` 把 `thread/started`、`turn/started`、`item/*`、`turn/completed` 做成一条统一的通知流——直播和回看，吃的是同一份对象模型，不存在“两套代码各自解释”的缝。Claude Code 从产品器官的角度说着同一句话：`query.ts` 的执行循环、transcript 持久化、resume、子 agent 进度摘要，合起来表明无论这 UI 多像聊天框，本体都是**一个可恢复执行体的事实投影**，而不是聊天本身。[^replay-truth-ch8]

把这条约束推到底，就给前端划出了一条很硬的边界。UI 最多配拥有三样东西：把事实流折叠成可显示状态的**投影逻辑**、把状态摆成像素的**展示逻辑**、把用户操作翻译成请求的**交互逻辑**。它唯独不能拥有第四样——**独立事实**。前端可以缓存、可以做动画、可以决定先画哪块；但它一旦自己判断“这任务大概进到验证阶段了吧”，就在事实流之外私设了第二个真相源。而系统里只要有两个真相源，剩下的就只是它们哪天打架、以及你要查几天的问题了。

### 8.3 一条事故，怎样长成一条回放规则

抽象的规则记不住，被一次事故烫过的规则才记得住。挑第 5.3 节那次会话污染来追。

你同时开着两个会话：A 在重构支付模块，B 在写一份文档。两者都在跑。你在 A 里刷新。前端要历史，调了 `/messages?session=A`——到这步都对。可问题出在更下面一层：后端那张事件表为了查询快，建了个按用户聚合的缓存，回放时从缓存里取最近事件，而那段取数的代码，**漏掉了 `session` 这个过滤条件**。于是 B 刚产生的一条“文档已保存”事件，被当成 A 的历史回放了进来。A 的界面上，于是冒出一条它从没做过的动作。更糟的是，如果 A 的状态机看到这条“保存”就把阶段推进了，你会以为支付模块的某一步完成了——而它根本没动。

注意这条 bug 的形状：后端的事件本身没错，每条事件都老老实实带着自己的 `session`；错的是**回放路径在某一段把 scope 丢了**。这就是为什么 scope 不能只在“产生事件”时存在，而必须从事件层、贯穿到回放层、再贯穿到渲染层——中间任何一段图省事把它丢掉，兄弟会话的状态就会从那个缺口里渗进来。

把这一条想透，三条更普遍的规则就自然落地了，而且都指向同一件事：**前端里不该存在第二套生命周期解释器。** 直播和回看若各自解释“什么算一个阶段”，就会像 §8.2 那样闪；scope 若在任一层断掉，就会像刚才那样串；而 UI 若只显示一个干巴巴的状态词、不把最近动作和最近证据一并摆出，操作员就回到第 5.6 节那种盲区。前端可以做缓存、动画、布局，但它不能凭空发明一个阶段——它发明的每一个阶段，都是一条迟早要和后台对质、且必输的影子真相。

### 8.4 把回放写成一道门禁

这类问题最阴的地方在于，单元测试照不到它们——它们只在“刷新、重连、切会话”这些动作发生的那一瞬现形。所以测试得换个写法：与其断言某个函数的返回值，不如断言**两条路径给出的世界是不是同一个**。

最该先写的那道门禁，正好就是 §8.1 那个场景的自动化版本。它做三件事：起一个任务，让它跑到中途某个确定的阶段（比如 `refactor 3/7`）；然后分别走两条路——一条直接读任务快照接口 `/api/sessions/:id/tasks`，一条把 SSE 流从头回放一遍 fold 出状态；最后断言这两个状态在生命周期上**逐字段相等**。这道断言一旦挂上 CI，§8.2 那种“两个对象模型悄悄分叉”的 bug 就再也合不进主干——因为它一分叉，这道门禁立刻红。

其余的断言是它的同族，方向都一样：刷新前后、重连前后、切会话前后，用户看到的必须是同一份任务事实；历史回放绝不能把兄弟 session 的状态带进当前容器（这正是 §8.3 那道缺口的守卫）；子 agent 摘要、主产物状态、验证证据，刷新后必须依然在；流中断后用 replay 重建的状态，要和恢复直推后继续推送的状态严丝合缝。

这些断言读着琐碎，却是“用户事实层到底存不存在”的试金石。一个朴素的判据：只要这些断言还没成为合并/发布的门禁，团队就还停留在“实现了一个前端”——它刷新一下就可能骗人；而一个真正可信的用户事实层，是你怎么刷、怎么断、怎么切，它都说同一句实话。区别不在画得好不好看，在敢不敢被这样反复地刷。

[^replay-truth-ch8]: 本章在此处综合 Codex `app-server` 中 thread / turn / item 的统一事件流设计，以及 Claude Code transcript、resume 与 agent summary 机制，说明 UI replay 必须建立在统一的后端事实模型之上；对应第 21 章参考文献 21、24。

---

## 9. 操作员控制面与发布真实性

凌晨两点，值班的人盯着一屏仪表盘：错误率平稳，延迟正常，吞吐没掉，一片祥和的绿。与此同时，一个高价值客户的任务已经卡死四十分钟——它停在某个阶段，既不报错，也不超时，只是不再往前。聚合指标永远不会替它报警，因为单独一个任务卡住，撼不动任何平均值。

到第 8 章为止，我们回答的是“用户怎么看到真相”；第 9 章回答另一半：“操作员怎么足够快地理解真相，并据此做发布决策”。很多团队栽在一个误判上——系统里已经攒了一堆事件和日志，于是以为“可观测性差不多有了”。这里要把两个东西掰开：`可观测性`回答的是“系统整体健不健康”，靠的是指标和日志的聚合；而 harness 要的是`控制面`，它回答的是“这一个任务此刻卡在哪、为什么、我下一步该按哪个键”。前者是一排仪表，后者是一个驾驶舱。日志堆得再高，也堆不出一个驾驶舱。

### 9.1 凌晨两点，操作员到底在找什么

接着把那次卡死追下去，看值班的人实际经历了什么。

他先扫一眼那排绿灯——没用，绿灯只说明“大多数任务没事”，不说明“这一单出事”。于是他去翻日志，`grep` 那个 task id，滚出来三千行：模型的思考、工具的入参出参、一堆 `DEBUG`。他往下翻了两屏，看到最后一条是某个工具调用发出去了、但没有对应的返回。然后呢？这条信息答不出他真正要决断的事——这究竟是任务自己的逻辑死循环，还是某个子 agent 卡住了，还是那个外部 API 在限流？该重试，还是会把已经写了一半的产物搞坏？主产物现在到底在哪条路径上、是个什么状态？四十分钟过去，他手里只有“某个工具没返回”，而他需要的是一个**决定**。

他缺的从来不是数据，是数据的**形状**。计数器告诉他“最近很忙”“失败率升高”，却答不出“这一次具体为什么错”。三千行 transcript 里其实什么都有，可它没有被加工成“一个任务的来龙去脉”——没有阶段、没有归属、没有“最近一个有意义的动作”、没有“哪个 validator 红了”、没有恢复入口。盲区不是信息太少，是信息停在了“聚合统计”和“原始流水”这两个极端，**唯独缺了中间那层给人看的叙事**。这，就是第 5.6 节那种操作员盲区的真正成因。

### 9.2 别逼操作员去读原始 transcript

凌晨两点读三千行日志，是设计的失败，不是操作员不够努力。Claude Code 的 `agentSummary.ts`、`diskOutput.ts` 和 resume 机制，透露的正是相反的取向：把那三千行**预先折叠**成人在十几秒里能用的东西——一段摘要、一个“最近做了什么”、产物落在哪条路径、这活归谁、以及一个“从这儿接着跑”的入口。同样是面对那次卡死，有了这层，值班的人看到的不再是工具调用的残片，而是一张卡片：“任务 #4127，阶段=验证，卡 40 分钟；最近动作=调用外部 lint 服务未返回；主产物 `report.md` 已生成未验证；归属 session B；可从 turn 58 resume。”——读完他就知道该按哪个键了。

Codex 给的是同一件事的另一半：地基。它用 `Thread` / `Turn` / `Item` 把“历史”“正在执行的一步”“产生的副作用”分到不同的层上，于是这些东西天然就能被重组成上面那张卡片，而不必从一锅糊在一起的文本里硬抠。[^operator-plane-ch9] 把两者合起来是一条很稳的经验：**操作员视图不该只消费 metrics，它必须消费从事实流派生出来的叙事结构。** 指标是给系统做体检的，叙事才是给人做决断的——而控制面的本职，就是把第 8 章那条只追加的事实流，按“一个任务的视角”折叠成人能读懂的故事。

### 9.3 仪表盘上每一个状态，都得在事实流里找得到出处

控制面有一种很隐蔽的失败方式，比“没有控制面”更危险，因为它看起来像有。

假设 dashboard 上有个醒目的绿色徽章：“验证通过率 99.2%”。它从哪来？某个图表服务，每分钟自己去数据库跑一条聚合 SQL 算出来的。某天有人改了产物写入的时机，验证事件偶尔会迟到，那条 SQL 因此把“还没验证”误统计成了“已通过”。于是徽章稳稳显示 99.2%，而真实的验证其实在大面积超时。这块绿，是 dashboard **自己算出来的**，在那条权威事实流里根本找不到对应的事件——它是一条影子真相，和第 8 章前端“发明阶段”是同一种病，只不过这次的发明者换成了监控层，而且因为它顶着“监控”的名头，没人会怀疑它在撒谎。

所以一个靠谱的 dashboard，展示的不该是它自己攒出来的好看数字，而该是从事实流里**投影**出来的几个固定切面，且每个切面都能在流里指出出处：现在在哪个阶段、什么时候进的、有没有违反单调（阶段不该倒退却倒退）；最近调了什么工具、派了什么子任务；主产物在哪条路径、过没过验证；哪个 validator 红了、证据落在哪、错误归哪一类；这事属于哪个 session / worktree、归谁；以及重试了几次、有没有孤儿任务、要不要人工介入。这么排不是为了好看，是为了让它和第 6 章那张运行时总图**一一对齐**——图上有的维度盘上就该有，盘上有的状态流里就该找得到源。一旦盘上出现一个“只在图表里有、流里却无源”的数，系统就又多了一条没人会怀疑的影子真相。

### 9.4 小型 fleet：发布真实性的最低证明面

为什么这些问题非要到真实环境才暴露？因为第 2 章其实早就埋了伏笔：最难缠的错误是**时序型、多表面、跨 session** 的，它们依赖真实的并发和真实的重连，而这恰恰是单机单元测试构造不出来的。

举个具体的。两个 session 共用一个后台连接池，平时相安无事。可当 A 在刷新、B 恰好在那一两百毫秒内推送一条事件时，连接的复用逻辑会把 B 的那条事件错投给正在重连的 A——就是第 8 章 §8.3 那种串扰。这个 bug 单元测试里永远复现不了：它要两个并发 session、一次真实重连、外加一个窄到一两百毫秒的时间窗，三者同时撞上。它只在真实主机、真实 worker、真实重连路径上，偶尔现身一次。

这就是为什么要养一支`小型 fleet`——把它理解成一支袖珍的“金丝雀”机群：正式放量前，先用一小撮真实主机、真实流量，把该有的不变量跑一遍。它得被当成**发布真实性的最低证明面**，而不是可选的加分项。具体说，它至少在两台以上主机上跑脚本化门禁，至少覆盖两个 session、一次重载、一次重连、一次子任务或外部能力调用；它必须吐出**显式的诊断类别**而不是笼统一句 `failed`（“失败了”帮不了任何人）；而且不变量一旦被破，它要能直接挡住合并或发布，而不是记条告警了事。最值得门禁化的那些不变量，几乎原样来自第 5 章那座事故博物馆——必需阶段不能缺、阶段序列不能倒退、终态不能在验证前就被宣布成功、会话 scope 不能泄漏、research/background 不能被重复触发、子 agent 摘要不能和主任务事实失联。它们都是用真实事故换来的边界；写成门禁，等于让系统替你记住这些教训。

### 9.5 让每一次翻车，回流成控制面的免疫力

第 5.7 节讲“失败模式博物馆”，重点是**归档**——把每次有价值的翻车连同根因存成可查的记录。到第 9 章，重点要从归档变成**回流**：归档只是把教训写下来，回流是把教训接回系统。

拿刚才那次连接池串扰走完整条回流。它先进博物馆，有了名字和根因。然后它要长出三样东西：一个 dashboard 信号——“同一连接上出现跨 session 事件”立刻标红，让它下次一冒头就可见；一段门禁脚本——就是 §9.4 里那条两 session、强制重连的 fleet 用例，把它焊进发布前的检查；以及一条 runbook（写明“看到这个标红，先按这几步隔离、再这样恢复”的操作手册），让凌晨两点接班的人不必从零推理。只有走完这三步，一个事故才真正变成了控制面的免疫力——同类问题再来，要么被门禁挡在合并前，要么在盘上一眼可见、还配着现成处置。

这一步最常被省掉，写完一份漂亮复盘就归档了事；可它恰恰是复盘有没有白做的分水岭。某种意义上，一套控制面的成熟度，就等于“有多少条事故，已经回流成了免疫力”。

[^operator-plane-ch9]: 本章在此处综合 Claude Code `agentSummary.ts`、`diskOutput.ts`、resume 相关实现，以及 Codex `Thread` / `Turn` / `Item` 的对象分层，用来说明操作员控制面应如何建立在统一事实流之上；对应第 21 章参考文献 21、24。

---

## 10. Agent 群体编排：把多脑多手变成可控系统

到这里为止，书里讨论的主要还是“单个系统如何说真话”。第 10 章再往前走一步：当系统开始扩展成多 agent、多负责人、多工作区协作时，harness 如何把复杂度吸收掉，而不是把混乱倍增。

### 10.1 多 agent 的本质不是并行，而是角色化

所谓“多脑多手”，并不是多开几个 agent 并行干活，而是一种组织结构：多个“脑”分别负责规划、生成、验证、总结，多个“手”分别负责文件、shell、浏览器、API、数据库、外部系统。关键在于，这些脑和手仍然要共享同一个 session 事实流、同一组权限边界、同一套验证规则和同一个操作员视图。[^many-brains-ch8]

所以多 agent 真正需要的不是“更多模型实例”，而是至少下面这些编排原语：

- 角色模板：谁是 coordinator，谁是 worker，谁是 verifier，谁可以请求人工输入；
- 派工协议：子任务怎么启动、怎么续跑、怎么被打断；
- 通信机制：中间结论如何回传，而不是彼此读对方全量日志；
- 隔离机制：工作区、权限、上下文和副作用如何彼此隔开；
- 汇总机制：父任务如何在不重读所有原始细节的前提下，拿到可信摘要和证据。

Claude Code 的 `AgentTool.tsx`、`loadAgentsDir.ts`、`teammateMailbox.ts`、`worktree.ts`，以及 Codex 的 `spawn_agent`、`send_input`、`wait_agent`、`resume_agent`，其实都在围绕这几件事建设，只是一个更偏产品器官，一个更偏协议原语。[^claudecode-codex-multiagent-ch8]

### 10.2 实战上的工作分解应该怎样落到系统里

如果把第 6 章那张总图继续展开，多 agent 系统里至少会出现下面这些所有权：

```text
项目负责人
  -> 定义里程碑契约和验收不变量
Coordinator / Harness 负责人
  -> 负责 session、派工、汇总、升级与终态裁决
专项 worker 负责人
  -> 负责局部域内动作、证据与中间产物
Verifier 负责人
  -> 负责跨 worker 的冲突、遗漏与最终验证
UI / Operator 负责人
  -> 负责把群体协作投影成可读的摘要、证据和告警
```

没有这种角色化拆分，团队很容易出现一种危险假象：局部 worker 都“各自成功了”，但系统级事实已经被破坏，比如主产物没有唯一归属、多个子任务修改了同一工作区、汇总结论没有经过 validator，或者父任务根本不知道哪个子任务已经失联。

### 10.3 为什么 sub-agent / swarm 往往比单个 1M 上下文更优

第 2 章已经给出理论结论：最大上下文窗口不是平坦工作区。到了第 10 章，这个理论要落成实践判断：什么时候应该用单个超长上下文，什么时候应该拆成多个局部 agent。

如果任务天然可以分块，把全部材料一次性塞进单个超长上下文，往往不是最优解。更常见的高收益结构是：

1. coordinator 只持有总目标、拆解计划、共享约束和最终验收标准；
2. 每个 sub-agent 只拿自己那一块原始材料或代码域；
3. 子 agent 产出的是摘要、证据、diff、引用和待验证结论，而不是把整个大海捞针窗口一路向上传递；
4. verifier 再把跨 shard 的冲突和遗漏拦下来。

#### 10.3.1 成本不能只看 token 账单

讨论 1M context 成本时，最常见的误区是只看 token 单价。账单当然重要，但真正把系统压垮的，常常是 prefill 变慢、首 token 延迟上升、KV cache 撑大、并发吞吐下降、重试变贵，以及任务调度越来越难。

OpenAI 公开价格页按百万 token 标价，但也把标准处理费率限定在 `under 270K` context lengths；Google 在 Gemini 1.5 发布时一方面宣布 128K 到 1M 的 pricing tiers，另一方面提醒早期测试者应预期更长 latency。[^swarm-econ-ch8] 这些信号说明，超长上下文不是普通请求的线性放大版。

从系统计算看，痛点通常不在 output token，而在 prefill。MInference 摘要里给过一个足够刺眼的数字：8B LLM 处理 1M token prompt 可以到 30 分钟量级，并把根因指向 attention 的二次复杂度。[^swarm-econ-ch8] 这不是某家 API 的具体实现细节，而是长序列计算的基础压力。

#### 10.3.2 1M 和 5 个 200K 不能只比总 token

如果做一个极端理想化假设：一个 1M 请求，和五个各 200K 的请求，总输入 token 恰好一样，没有重复背景、没有协调 token、没有缓存，那么从“按 token 计费”的账单角度看，它们可能接近。

但真实 agent 系统很少这么运行。更常见的是：coordinator 持有目标、计划、约束和最终验收；每个子 agent 只持有一个 shard 的原始材料；公共制度性上下文通过缓存或固定 system prompt 复用；向上汇报的是摘要、证据、diff、引用和中间产物，而不是整份原始语料。这时 `5 x 200K` 的真实总 token 常常小于 `1 x 1M`。

即使总 token 恰好一样，prefill 计算量也不一样。若按 dense attention 做一阶量级估算：

- 单次 1M 上下文的 attention 规模约为 `1,000,000^2 = 10^12`；
- 五次 200K 的总 attention 规模约为 `5 * 200,000^2 = 2 * 10^11`。

也就是说，在“总 token 相同”的理想化条件下，`1 x 1M` 的 attention 量级仍然大约是 `5 x 200K` 的 5 倍。工程上要同时看三本账：账单、时延、可调度性。

#### 10.3.3 sub-agent 的收益不是只省钱

很多团队把 sub-agent / swarm 只当成吞吐工具，这是低估了它。它真正带来的，是质量曲线和成本曲线的同时改善。

单个超长上下文的失败模式往往是：原始材料过多，相关证据密度下降；中间状态和历史痕迹污染当前任务；query 位置不稳定，重要约束被长正文淹没；一次失败就要重做整段大 prefill。

分解成 sub-agent 之后，系统得到的是另一种工作形态：每个 agent 看到的上下文更短、更局部，位置偏置更可控；每个 agent 的输入类型更单纯，更接近单一任务；错误只需在局部 shard 重试，不必重灌整段全局上下文；coordinator 处理的是证据摘要和冲突，而不是整个原始语料海洋。

换句话说，sub-agent 不是为了炫耀架构复杂，而是为了把每个 agent 压回它更容易成功的工作区间，再把跨 shard 协调交给 harness、session 和 verification。

#### 10.3.4 什么时候仍然该用单个超长上下文

不是所有任务都该拆成 swarm。以下几类任务，单个超长上下文仍然可能是合理选择：

- 必须对全局原文做一次统一排序、比对或证据归并；
- 任务主要是全局摘要，不涉及局部修改和重复迭代；
- 原始材料高度相关，拆分后反而破坏语义连续性；
- 上下文可以一次缓存，多轮查询主要复用同一大语料；
- 你更在意一次性全局理解，而不是并行吞吐。

但这些前提只要稍微动摇，sub-agent 方案往往就开始占优。尤其当任务同时满足三条：材料天然可分 shard；子问题可以先局部求解再全局汇总；每轮失败重试代价很高，就应当优先考虑分解。

### 10.4 让 swarm 不失控的四条硬规则

多 agent 一旦上线，最容易失控的不是模型质量，而是控制面纪律。因此至少要守住四条硬规则：

1. 子 agent 不直接宣布系统终态；只有 coordinator + verifier 能裁决 ready / failed。
2. 子 agent 之间不共享隐式上下文；共享的只有显式任务说明、事实流引用和被授权的中间产物。
3. 每个子 agent 都必须能被单独恢复、单独取消、单独审计。
4. 任何协议、生命周期、回放或 scope 语义变更，都必须同步更新 fixture、门禁、E2E 和文档。

守不住这四条，多 agent 只会比单 agent 更快制造混乱。守住了，它才会真正变成能放大团队产能的协作系统。

[^many-brains-ch8]: Anthropic, *Scaling Managed Agents: Decoupling the brain from the hands.* 本章在此处使用其 many brains / many hands 的组织视角，说明 coordinator、worker 与 verifier 的分工；对应第 21 章参考文献 3。
[^claudecode-codex-multiagent-ch8]: 本章在此处综合 Claude Code 的 `AgentTool.tsx`、`loadAgentsDir.ts`、`teammateMailbox.ts`、`worktree.ts` 等实现，以及 Codex `spawn_agent` / `send_input` / `wait_agent` / `resume_agent` 等工具原语，用来说明多 agent 需要角色、通信、隔离、汇总与恢复这些一等能力；对应第 21 章参考文献 21、24。
[^swarm-econ-ch8]: 本章在此处综合 Anthropic 的 managed agents 视角、OpenAI API Pricing 关于 `under 270K` 标准费率的限定、Google Gemini 1.5 关于 1M context pricing tiers 与 latency 的说明、Google long context 文档关于 retrieval-cost tradeoff 与 caching 的说明、LongLLMLingua 关于 higher computational cost / performance reduction / position bias 的概括，以及 MInference 关于 1M token prefill 代价的摘要数字，用于说明 sub-agent / swarm 在质量、成本与时延上的优势；对应第 21 章参考文献 3、14、15、18、19、20。

---

## 11. 从抽象到原则：Harness Engineering 的设计法则

前面 1 到 8 章已经把根因、样本、失败、架构和协作面铺开了。第 11 章要做的不是再发明新部件，而是把这些观察压缩成一套更高层、但仍然能落地的设计法则。

这里最值得借鉴的，不是某个仓库的代码排版，而是 Fowler / Thoughtworks 那条线对 harness engineering 的抽象：不要把 agent 的成功寄托在一次 prompt 奇迹上，而要把任务状态、反馈回路、工具边界和验证证据做成系统外部、可检查、可演化的控制层。[^thoughtworks-principles-ch9] 也因此，这一章不会换一套新词；它只会把第 6 章那九个维度，改写成团队能拿来做设计评审、事故复盘和路线排序的九条原则。

### 11.1 第一原则：把模型能力和控制系统分开

Claude Code 和 Codex 都很强，但它们真正可迁移的启发不在于“某个 prompt 怎么写”，而在于都在做同一件事：把模型生成能力与控制系统分层。

模型负责提出候选动作、生成候选产物、总结局部信息；控制系统负责守住事实流、生命周期、能力平面、产物与验证、回放、隔离与恢复、协作、知识分层和操作员面。只要这两层没有被切开，团队最终一定会重新回到第 5 章那类事故里。

### 11.2 九条可迁移原则

把第 4.8 节的九个架构维度和第 6 章的统一词汇表进一步压缩，可以得到九条可迁移原则。读者可以把它直接看成一条映射链：Claude Code 的产品器官和 Codex 的协议骨架，在原则层分别对应下面九条约束。

1. `事实流原则`：契约状态必须持久化在 prompt / 聊天上下文之外。
2. `生命周期原则`：生命周期必须单调、公开，并在 API / UI / operator 表面保持一致。
3. `能力平面原则`：所有外部能力都必须进入统一调度面，而不是各自维持私有状态机。
4. `产物与验证原则`：主产物必须显式归属，`ready` / `failed` 必须由验证器和证据裁决；交付不能依赖文件名、启发式猜测或生成器自报完成。
5. `回放原则`：回放、摘要和历史重建必须都从同一条事实流派生。
6. `隔离与恢复原则`：session / topic / worktree scope 必须被当成硬边界，resume / worktree / background task 必须是运行时能力，而不是异常补丁。
7. `协作原则`：sub-agent / swarm 的价值来自角色化、隔离、汇总和验证，而不是单纯并行。
8. `知识分层原则`：知识必须沿着 wiki -> skill -> docs / `AGENTS.md` -> CI / validator 这条长循环晋升，而不是堆成一个永不清理的大 prompt。
9. `操作员原则`：dashboard、门禁、事故归因和发布声明都必须绑定同一条事实流与同一组证据。

这九条原则的价值在于，它们不依赖 Claude Code 用 TypeScript 还是 Codex 用 Rust，也不依赖团队是否采用 MCP、worktree 或某个特定 UI。它们描述的是控制系统必须守住的结构性边界，也就是第 6 章那张总图在团队决策语言里的翻译版。

### 11.3 必须禁止的反模式

与上面九条原则一一对应，下面这些反模式必须被明确禁止：

1. `事实流反模式`：只有 prompt 的契约，例如“agent 应该记得发送文件”。
2. `生命周期反模式`：从 UI 反推事实，例如“气泡显示 done，所以任务完成”。
3. `能力平面反模式`：用 stderr 文本、自由格式日志或缓存快照充当状态协议。
4. `产物与验证反模式`：用文件名、最近修改时间或目录启发式猜主产物，或让尽力而为式验证器不影响终态成功。
5. `回放反模式`：让 replay、summary、历史页各自维护一套“差不多”的影子状态。
6. `隔离与恢复反模式`：把 resume、scope、worktree、background task 当成边缘补丁，而不是主运行时能力。
7. `协作反模式`：让子 agent 直接宣布系统终态，或直接污染父任务事实。
8. `知识分层反模式`：把所有经验都塞进一个大 prompt，而不做 promotion / demotion。
9. `操作员反模式`：让 dashboard 指标、门禁状态和运行时事实流脱节。

这些反模式的共同点，是把“系统说真话”退化成“系统看起来差不多在工作”。一开始它们都节省代码，后来都会以事故成本把节省加倍收回来。

### 11.4 短循环和长循环

所有 agent 都有短循环：生成、行动、观察，再生成。驾驭工程真正关心的是长循环：事故如何进入 wiki，wiki 如何晋升成 skill，skill 如何进入 `AGENTS.md` 或 docs，docs 中的约束如何再沉成 CI、validator 和 dashboard 信号。[^long-loop-ch9] 如果用第 6 章那套词汇来说，这一节其实是在展开“知识分层”和“操作员面”如何反过来塑造事实流、验证器和门禁。

没有长循环，agent 每次都像从零开始的实习生。长循环跑起来之后，组织会把一次失败变成长期免疫力。

### 11.5 知识和 Skill 的晋升纪律

不是所有经验都应该写进 `AGENTS.md`。更稳妥的治理方式是 promotion / demotion：重复出现、跨任务稳定、能被验证的经验才晋升；过时、低频、无法验证或引起误导的经验要降级或删除。[^promotion-discipline-ch9]

Skill 也不是 prompt 集合。一个合格 skill 至少要有触发条件、输入输出契约、执行步骤和验证方式。对这类系统来说，skill 的价值不在“让模型多知道一点”，而在“把组织经验变成可执行、可检查的流程”。

Codex 的 `AGENTS.md` 文档化和分层作用域设计，说明了什么应该常驻、什么应该按需加载；Claude Code 的 `loadAgentsDir.ts`、skills、hooks、memory scope 则说明了知识成熟后怎样沉进 agent 定义、技能包和能力边界。知识治理不是单独的文档工作，它会反过来塑造能力平面、协作拓扑和验证器边界。

### 11.6 反身 harness 的边界

未来 harness 会越来越多地修改自己：更新文档、生成测试、补充验证器、建议 schema 迁移。这是趋势，但反身能力必须分级。低风险变更可以自动化；影响事实流 schema、权限边界、验证独立性和合规目标的变更，必须保留人工决策。不能把目标函数、权限边界和验证器独立性，也交给提案者自己定义。

[^thoughtworks-principles-ch9]: Birgitta Bockeler, *Harness engineering for coding agent users.* 本章在此处使用其关于把任务状态、工具边界、验证反馈与控制回路从 prompt 中外移出来的抽象，总结为本书的可迁移原则；对应第 21 章参考文献 1。
[^long-loop-ch9]: 本章在此处使用 Karpathy 的知识记账思路，并结合本文前述 harness 实践，说明 wiki -> skill -> `AGENTS.md` / docs -> CI / validator / dashboard 的长循环；对应第 21 章参考文献 9。
[^promotion-discipline-ch9]: 本章在此处综合 OpenAI 与 Karpathy 关于 `AGENTS.md` 保持短目录、经验 promotion / demotion 的治理思路；对应第 21 章参考文献 2、9。

---

## 12. 工作流到里程碑映射：务实路线图

如果第 6 到第 11 章回答的是“目标架构应该是什么”，第 12 章回答的就是“工程上先做什么、后做什么”。路线图的作用不是展示 backlog，而是把第 4.8 节那九个架构维度按依赖关系排成实施顺序。

更直接地说：先修真相，再修体验；先把事实流、生命周期和验证守住，再开放生态、丰富协作、提升运营面。

### R1 — 事实流：先建立唯一运行时真相

- 把 task、turn、tool result、artifact、validator result 写成 append-only 事实流。
- 明确 session / thread / transcript 的持久格式和恢复入口。
- 所有 UI、API、dashboard、replay 都只能投影这条事实流，不能各自发明状态。

### R2 — 生命周期：把任务状态变成单调阶梯

- 类型化 `harness.event.v1` 与 `task_status` 桥接。
- 生命周期至少覆盖 `queued`、`running`、`verifying`、`ready`、`failed`。
- deep-search / run_pipeline / background task 从 stderr 状态迁移到结构化事件。

### R3 — 能力平面：统一工具、MCP、脚本和人工输入

- 为 shell、Python、Node、MCP、browser、external API 提供统一事件入口。
- 支持非 Rust / 非主语言事件发射器，例如 `HARNESS_EVENT_SINK`。
- 工具调用必须带 session、scope、权限和审计信息。

### R4 — 产物与验证：完成状态必须由证据裁决

- manifest / policy / task 字段声明 primary artifact。
- 类型化验证器返回结果、失败类别、证据路径和耗时。
- `ready` / `failed` 只由 validator + evidence 裁决，不由生成器自报。

### R5 — 回放：让实时流和历史流共享对象模型

- API、SSE、历史回放和刷新恢复使用同一事实模型。
- 回放测试覆盖浏览器重载、重新连接、会话切换和部分 stream 中断。
- 小型 fleet 门禁验证线上 worker 的真实回放路径。

### R6 — 隔离与恢复：把 worktree / resume / background 做成一等能力

- root task、child task、worktree、owner、scope 显式绑定。
- resume 能恢复 transcript、未完成 tool use、artifact 引用和工作目录。
- background task 与 disk output 进入事实流，而不是只写本地日志。

### R7 — 协作：让 sub-agent / swarm 有角色、通信和终态裁决

- coordinator、worker、verifier、summarizer 的角色和权限分开。
- 子 agent 只返回 summary、evidence、diff、artifact reference，不污染父上下文。
- 只有 coordinator + verifier 可以宣布 root task ready / failed。

### R8 — 知识分层：把经验从 wiki 晋升到 skill / docs / AGENTS.md / gate

- `AGENTS.md` 保持短目录，细节下沉到 docs 与 skills。
- 重复事故进入 wiki，稳定经验晋升为 skill、validator、fixture 或 CI gate。
- 过时经验必须 demotion / deletion，避免知识层变成长期噪声源。

### R9 — 操作员面：把 dashboard、门禁、回滚和复盘接到同一事实流

- dashboard 展示 lifecycle、artifact、validator、child task、scope 和最近 summary。
- 门禁与发布声明绑定证据，不接受轶事式成功。
- 每次事故都沉淀为失败模式条目、复盘模板和可回放 fixture。

这条路线图按依赖排序，而不是按 backlog 美观排序。R1 到 R2 先建立事实和生命周期；R3 到 R4 让外部能力和完成裁决进入协议；R5 到 R7 解决回放、恢复和多 agent 协作；R8 到 R9 再把组织知识和操作员控制面接进来。顺序反过来，平台会在还没有稳定事实流时就开放外部复杂度，后续每一步都会更贵。

这条路线也不是凭空想象出来的。Claude Code 已经把 compaction、resume、worktree、sub-agent 摘要、外置 output、权限和扩展机制做进产品里；*Dive into Claude Code* 则把它们整理成五层系统结构；Codex 已经把 `thread-store`、`rollout`、`app-server`、tool registry 这些“骨架能力”做成显式模块。路线图真正要做的，不是复制某个仓库，而是把这些成熟样本已经证明必要的部件，按依赖顺序转译成自己的系统实现。

---

## 13. Harness 必要但不充分

讲完路线图以后，必须立刻收边界。否则团队很容易把 harness 当成万能解释，把所有产品质量问题都往上堆。这一章的任务，就是把 harness 能解决什么、不能解决什么切开。

### 13.1 一个匿名失败链：研究任务“看似完成”，但交付的是错文件

拿一条很典型的匿名失败链来看，会更容易看清 harness 的边界。用户发来一个任务：“读 12 篇材料，生成一份 20 页汇报，并附带可演示的 slides。”系统表面上做了很多对的事情：起了研究 worker，调用了 web / MCP 搜索，写了草稿，最后还返回了一个 `ready` 状态和一份 `pptx`。但用户一打开文件，发现交付的是旧版本模板，引用也不完整，真正的新内容只写进了一个中间 Markdown 文件里。

如果顺着事故往回追，这条失败链通常会长成下面这样：

1. session 层没有把“哪一个 root task、哪几个 child task、哪一个 primary artifact”钉成单一事实；
2. capability plane 层里，研究 worker 用 Python 脚本和 MCP 拉资料，打包 worker 用 shell 生成 slides，但两边只在自由文本里提到产物路径，没有统一的 artifact 引用；
3. verifier 只检查“有没有生成一个 `pptx` 文件”，没有检查引用数量、主文件归属和内容新鲜度，于是错误文件也能通过；
4. operator dashboard 只能看到“任务 ready”，看不到哪个 child worker 报告了哪个产物、哪个 validator 实际没覆盖到关键约束；
5. swarm 层里，coordinator 只拿到一句“slides generated successfully”，没有拿到带证据的 summary，因此把错误结果当成了真实完成。

这条链很有代表性，因为它不是模型单点失误，而是 `session -> capability plane -> verifier -> operator dashboard -> swarm` 五层都少了一点约束，于是最后在用户面前合成了一次“假成功”。

### 13.2 顺着这条失败链，看五层架构如何真正落地

如果要把上面的事故真正修住，不能只在最后补一个“更强提示词”，而要顺着五层架构逐层落地。

`session` 层先做硬事实。root task 创建时，就声明本轮交付物是 `report.md` 与 `slides.pptx`，并把每个 child task 的 owner、role、scope、worktree、expected artifact type 写进事实流。这样 coordinator、replay、dashboard 和 verifier 才是在读同一份任务定义，而不是各自猜测。

`capability plane` 层再做统一入口。研究 worker 无论是用 Python、Node、shell 还是 MCP，都只能通过统一事件和 artifact 报告面回传结果。脚本可以自由实现，但不能自由定义状态协议；外部能力可以多样，但产物引用、scope 绑定和任务归属必须一致。

`verifier` 层负责终态裁决。它不只检查“文件存在”，还要检查：这是不是被声明过的 primary artifact，引用和页数是否达标，slides 是否基于当前 report 生成，证据文件存在哪里。只有通过这些检查，root task 才能进入 `ready`。否则就应该停在 `verifying` 或进入 `failed`，而不是把验证成本甩给用户。

`operator dashboard` 层负责把这条链说清楚。值班同学应该能一眼看到：哪个 coordinator 派出了哪些 child task，每个 child 最近一次 summary 是什么，哪个 artifact 被报告，哪个 validator 成功或失败，证据路径在哪里。这样收到用户投诉时，团队不是从头猜，而是直接沿着事实流定位是哪一层断了。

`swarm` 层最后负责把多 agent 协作收束成单一系统真相。coordinator 只负责拆解、汇总和裁决；research worker 只负责证据搜集；draft worker 只负责文本和 slides 生成；verifier worker 只负责检查。没有任何一个 worker 可以单独宣布整个系统已经成功。只要这条规则还守着，局部成功就不会再轻易伪装成系统成功。

### 13.3 Harness 解决到哪，哪里仍不是 harness 的职责

Harness 解决编排正确性，不解决完整产品质量。

高质量代码 agent 仍然需要：

- 强模型选择和路由策略
- 工具安全边界（沙箱、认证、权限门禁）
- 面向编码工作流的强提示词/策略对齐
- 测试生成/修复纪律
- 仓库感知的编辑质量和评审循环
- 延迟/成本治理

Claude Code 和 Codex 自己也在证明这条边界。前者即使已经有了很重的 harness 运行时，仍然花大量工程在权限、模型、MCP、session、worktree 和进度管理上；后者即使把 thread/turn/item、tools、sandboxing、approvals 抽得很清楚，也依然需要强模型、强测试和强治理来保证结果质量。Harness 能解决的是“系统说真话、状态一致、可恢复、可审计”；它不能替代模型能力、领域知识和组织纪律。

可以把 harness 看成运行时事实层。  
没有它，质量无法被信任。  
只有它，质量仍然依赖模型、工具和产品纪律。

也可以把它理解为“系统说真话”和“系统是好产品”之间的边界。前者是失败模式迫使我们构建的东西；后者仍然依赖模型路由、沙箱、提示词/策略对齐和评审纪律。

这条边界很重要。Harness 能让系统不撒谎：没完成就不显示完成，产物无效就不交付，验证失败就不进入 ready，会话切换不串状态。但它不能保证产品判断正确、模型选择最优、用户需求被理解、成本足够低、交互体验足够好。把 harness 当成产品质量的全部，是另一种形式的过度工程。

---

## 14. 可执行清单

边界讲清之后，剩下的工作就是把前面各章的要求压成能执行的检查项。第 14 章不是新观点，而是把第 4.8 节那九个维度压成可以拿来做合并前、上线前、事故后的动作清单，并补上一条匿名失败链的逐层排查顺序。

### 14.1 维护者预合并清单（影响 harness 的 PR）

- [ ] 变更映射到显式用户可见不变量。
- [ ] 契约状态能跨崩溃/重载/压缩持久存在。
- [ ] 生命周期迁移是单调的，并有测试覆盖。
- [ ] 产物选择使用声明式策略，而不是把启发式回退当主路径。
- [ ] 必要时验证器失败会阻断终态成功。
- [ ] 会话/主题作用域检查能防止跨会话污染。
- [ ] API 和 SSE 回放暴露同一份任务事实。
- [ ] 操作员摘要/仪表盘信号包含新的失败模式。
- [ ] 新增 sub-agent / background task 路径时，角色、scope、summary 和 validator 一起落地。
- [ ] 小型 fleet 门禁至少在两台主机上通过。
- [ ] 契约变更时，文档、fixture、脚本、端到端测试在同一个 slice 更新。

### 14.2 第三方 app/skill 开发者清单

- [ ] 声明单一规范 `primary` 产物。
- [ ] 为存在性、大小和领域约束定义验证器。
- [ ] 只使用稳定生命周期/任务 API 字段。
- [ ] 当 `HARNESS_EVENT_SINK` 可用时，通过它发出结构化进度。
- [ ] stderr 用于诊断，不用于契约状态。
- [ ] 确保 hooks 幂等（尤其是 `before_spawn_verify`）。
- [ ] 为你的工作流测试重载/会话切换行为。
- [ ] 如果工作流会 spawn 子 agent，声明其摘要格式、产物归属和取消/恢复语义。
- [ ] 验证失败路径会产生操作员可读证据。

### 14.3 事故响应清单（状态漂移 / 污染类）

- [ ] 对比 `/api/sessions/:id/tasks` 快照和 UI 气泡/页头。
- [ ] 检查 SSE 流是否缺失或存在越界 `task_status` 事件。
- [ ] 确认回放和实时事件上的 session/topic 标签。
- [ ] 检查最终快照中是否有重复 deep-research/run_pipeline 任务。
- [ ] 验证阶段顺序单调性和进度范围。
- [ ] 修补前捕获诊断 JSON 和 curl 提示。
- [ ] 修复后重新运行小型 fleet 门禁；不要接受仅本地验证。

### 14.4 匿名失败链的逐层落地检查

如果你正在修第 13.1 节那类“看似完成、实际交错文件”的事故，可以直接按下面这条链检查，不要一上来就改 prompt。

- [ ] `session`：root task 是否显式声明 primary artifact、child task、owner、role 和 worktree。
- [ ] `session`：artifact 报告是否带 task id / session id，而不是只有自由文本路径。
- [ ] `capability plane`：Python / Node / shell / MCP 调用是否都通过统一事件入口回传状态与产物。
- [ ] `capability plane`：外部能力是否把引用、下载物、临时文件写进了声明过的 scope，而不是写进任意目录。
- [ ] `verifier`：是否同时验证“文件存在”“文件归属正确”“内容足够新”“关键业务约束达标”。
- [ ] `verifier`：失败时是否留下了 validator 名称、失败类别、证据路径和持续时间。
- [ ] `operator dashboard`：是否能直接看到 root / child task 关系、最近 summary、最近 artifact、最近 validator 结果。
- [ ] `operator dashboard`：是否存在只在 dashboard 里出现、却无法回指事实流的影子状态。
- [ ] `swarm`：coordinator 是否只做拆解与裁决，而不是自己悄悄替 child task 兜底宣布成功。
- [ ] `swarm`：child agent 的 summary 是否包含可验证产物引用，而不是一句模糊的 “done”。

这组检查项的目的，是把“问题出在 session、能力平面、validator、dashboard 还是 swarm”快速切开。只要团队还在把这五层混成一个“agent 没做好”，修复成本就会始终过高。

---

## 15. 参考架构片段

前面的章节已经给出原则、边界和检查表；这一章补六段最小架构片段，帮助团队把抽象要求落成具体事实流、契约执行流、swarm 控制流，以及一条匿名失败链的端到端落地图、最小事件序列和可直接复用的复盘模板。

### 15.1 任务事实流

```text
工具发出进度事件 -> 运行时校验事件 -> 监督器持久化状态
-> TaskStatusChanged -> API/SSE -> UI 回放与状态气泡
```

任何绕开这条链的直接 UI 变更都是可靠性风险。

### 15.2 契约执行流

```text
生成子任务成功
  -> 解析候选输出
  -> before_spawn_verify (allow/modify/deny)
  -> 运行验证器
  -> 标记 ready 或 failed
  -> 持久化交付证据
```

在这条流程完成前标记终态成功，是契约违例。

### 15.3 Swarm 控制流

```text
coordinator 接收总目标
  -> 拆成带 scope / owner / validator 的子任务
  -> spawn sub-agent 到隔离 worktree / context
  -> 子 agent 回传摘要、证据、diff、产物引用
  -> verifier 汇总跨 shard 冲突与遗漏
  -> coordinator 依据验证结果裁决 ready / failed
  -> dashboard / replay 投影同一条协作事实流
```

没有 summary、scope、validator 和终态裁决的并行，只是多窗口，不是 swarm。

### 15.4 匿名失败链的端到端落地图

把第 13.1 节那条匿名失败链翻译成一张可以落地的架构图，大致应该长这样：

```text
用户提交“12 篇材料 -> 汇报 + slides”
  -> root session 创建，声明 primary artifacts = {report.md, slides.pptx}
  -> coordinator spawn research-worker / drafting-worker / verifier-worker
  -> research-worker 通过 web / MCP / shell 拉材料并回传 citation artifacts
  -> drafting-worker 在声明过的 worktree 内生成 report.md 与 slides draft
  -> verifier-worker 校验 artifact 归属、引用数量、页数、内容新鲜度
  -> task supervisor 汇总 validator 结果并更新 root task lifecycle
  -> dashboard 展示 root/child 关系、最近 summary、最近 artifact、失败证据
  -> 只有全部 validator 通过时，coordinator 才把 root task 标为 ready
```

这张图的关键，不是“用了几个 worker”，而是每一步都能沿着同一条事实流回放。只要某一步只能靠聊天文本或人脑猜测，最终用户看到的就仍然可能是伪完成。

### 15.5 一组最小事件序列

如果要让这条落地图真的可回放，session 里至少要能看到类似下面这样的一组最小事件：

```text
task.created         task=root-17 role=coordinator primary={report.md,slides.pptx}
task.spawned         task=child-17a parent=root-17 role=research scope=/worktrees/r-17a
tool.called          task=child-17a tool=mcp.search query="12 papers"
artifact.reported    task=child-17a kind=citation-bundle path=artifacts/citations.json
task.spawned         task=child-17b parent=root-17 role=drafting scope=/worktrees/d-17b
artifact.reported    task=child-17b kind=report path=deliverables/report.md
artifact.reported    task=child-17b kind=slides path=deliverables/slides.pptx
validator.failed     task=root-17 validator=slides_freshness evidence=checks/slides_freshness.json
summary.updated      task=root-17 text="draft complete, slides artifact stale"
operator.alerted     task=root-17 reason=validator_failed
task.failed          task=root-17 category=artifact_contract_violation
```

这组事件的价值在于，它把 `session -> capability plane -> verifier -> operator dashboard -> swarm` 串成了单一证据链：

- `task.created` / `task.spawned` 说明 session 与 swarm 关系；
- `tool.called` 说明 capability plane 实际调了什么能力；
- `artifact.reported` 说明谁声称自己产出了什么；
- `validator.failed` 说明为什么不能进入 `ready`；
- `summary.updated` / `operator.alerted` 说明 dashboard 该怎样说人话；
- `task.failed` 则把系统终态固定下来。

没有这类最小事件序列，很多系统也能“看起来运行”。但只要出一次事故，团队就会发现自己没有真正的运行时事实，只剩聊天记录和猜测。

### 15.6 可直接复用的事故复盘 Markdown 模板

下面这份模板可以直接作为团队的复盘章节骨架使用。它的重点不是格式统一，而是强制每一次事故都沿着同一条控制链写清楚。

```md
## 事故标题

### 1. 事故摘要

- 事故编号：
- 首次发生时间：
- 首次发现时间：
- 当前状态：进行中 / 已缓解 / 已修复 / 已验证
- 一句话摘要：
  - 例如：root task 被错误标记为 `ready`，但交付的 `slides.pptx` 实际是旧模板文件。

### 4. 用户影响与业务影响

- 受影响用户 / 项目：
- 受影响时间窗：
- 用户表面症状：
- 错误交付 / 重复执行 / 数据污染 / 合规风险：
- 是否需要外部沟通或补偿：

### 5. 时间线

| 时间（绝对时间） | 事件 | 证据 |
|---|---|---|
| 2026-04-23 10:02 | 用户提交任务 | session id / request id |
| 2026-04-23 10:05 | child task 开始拉资料 | event id / log path |
| 2026-04-23 10:12 | root task 被标记为 `ready` | task snapshot |
| 2026-04-23 10:18 | 用户报告交付文件错误 | support ticket |

### 6. 任务 / Agent 拓扑

- root task：
- coordinator：
- child tasks：
  - child A：role / owner / worktree / expected artifact
  - child B：role / owner / worktree / expected artifact
- 外部能力：
  - shell / MCP / Python / Node / browser / API
- 人工介入点：

### 7. 用户面与系统面如何分叉

- 用户看到的事实：
- UI / replay 呈现的事实：
- operator dashboard 呈现的事实：
- 底层运行时实际发生的事实：
- 第一次分叉发生在哪个时刻：

### 8. 五层断裂点解剖

#### 8.1 Session

- root / child task 关系是否被显式持久化：
- primary artifact 是否被显式声明：
- scope / owner / role / worktree 是否完整：
- 这里的缺口是什么：

#### 8.2 Capability Plane

- 实际调用了哪些能力：
- Python / Node / shell / MCP 是否走统一事件入口：
- artifact / citation / temp file 是否按契约回传：
- 这里的缺口是什么：

#### 8.3 Verifier

- 哪些 validator 本应拦住问题：
- 实际运行了哪些 validator：
- 为什么没有阻断终态：
- 证据路径：

#### 8.4 Operator Dashboard

- 值班同学是否能直接看到 root/child 关系、artifact、validator 结果：
- 哪些关键信息缺失：
- 哪些状态只是影子状态：

#### 8.5 Swarm / Coordinator

- coordinator 的职责是否越界：
- child agent 是否回传了可验证 summary：
- 是否存在局部成功伪装成系统成功：

### 9. 证据包

- session / task 快照：
- 关键事件序列：
- artifact 路径：
- validator 输出：
- dashboard 截图：
- 相关 commit / deploy / feature flag：

### 10. 根因归类

- 四支柱归类：
  - Session / Harness / Tools / Verification
- 九维度归类：
  - 事实流 / 生命周期 / 能力平面 / 产物与验证 / 回放 / 隔离与恢复 / 协作 / 知识分层 / 操作员面
- 最终根因一句话：

### 11. 为什么现有防线没有拦住

- 哪个 validator 缺失：
- 哪个门禁没有覆盖：
- 哪个 dashboard 信号不够：
- 哪个 runbook 或 skill 没有晋升：

### 12. 修复动作

#### 12.1 已执行 Hotfix

- [ ] 修复项
- [ ] 影响范围
- [ ] 回滚策略

#### 12.2 结构修复

- [ ] session / schema 修复
- [ ] capability plane 修复
- [ ] validator 修复
- [ ] dashboard / replay 修复
- [ ] swarm / coordinator 修复

#### 12.3 发布门禁补强

- [ ] mini-fleet case
- [ ] replay fixture
- [ ] validator evidence assertion
- [ ] cross-session contamination check

### 13. 组织沉淀

- 会新增哪些 validator：
- 会新增哪些 dashboard 信号：
- 会新增哪些 runbook：
- 会晋升哪些 `AGENTS.md` / docs / skills 规则：
- 下次同类事故应被什么机制更早拦住：

### 14. 完成定义

- [ ] 用户面症状已消失
- [ ] 根因层修复已上线
- [ ] 对应 validator / gate / dashboard 已补齐
- [ ] mini-fleet 已复现并验证通过
- [ ] 复盘已归档到 failure museum
```

这个模板最重要的价值，不是让复盘文档更整齐，而是避免团队把 harness 事故再次写成“一个人记得的故事”。只要每次都沿着这份模板写，事故就会持续沉进 session 模型、能力平面、validator、dashboard 和 swarm 纪律里。

---

## 16. 结语：下一阶段的工程姿态

到这里，整本书的主线也就闭合了：从长上下文和长任务的根因出发，经由 Claude Code / Codex 反推出来的架构总纲，穿过真实失败案例、运行时总图、能力平面、回放、操作员控制面、多 agent 编排与治理原则，最后落回一套可执行的工程姿态。

把 harness 工作当作产品可靠性工程，而不是抽象框架建设。

对任何还在从 demo 走向系统的 agent 团队，更合理的胜利模式是：

1. 识别具体用户可见失败类别
2. 编码显式契约不变量
3. 把运行时/UI/操作员表面绑定到同一个事实模型
4. 合并前在小型 fleet 线上门禁上证明
5. 之后再扩展抽象和外部平台表面

这就是从“今天看起来很聪明”走向“每天都能正确交付”的路径。真正的关键，不是复制 Claude Code 或 Codex 的目录结构，而是学会像它们那样，把模型能力包进一个会说真话、会积累免疫力、会被团队长期维护的控制系统里。

---

## 17. 附录 A：源文本与研究流程

本书论证建立在三类材料之上：第一类是 harness / agent / context engineering 的奠基文本，第二类是 Claude Code、Codex、OpenClaw、Hermes 这类系统样本，第三类是长上下文、控制论、memory hierarchy 和负反馈这些理论支撑。它们可以聚成四个实践组：

- 第 1 层谱系：Fowler、OpenAI、Fisher Zhang、NxCode
- 第 2 层谱系：Anthropic、Anthropic 长任务应用、Milvus、Stanford Meta-Harness
- 桥接文本：Neo4j 的上下文工程，Karpathy 的 wiki 纪律
- 系统解剖：Claude Code / Codex 源码审读、*Dive into Claude Code*、OpenClaw / Hermes 对照

保留这些材料的理由很具体：第 5 节中的失败样本属于 Layer 2 failure，而这本书本身的写作与重构过程又位于 Layer 1 谱系中。把理论、系统样本和失败案例放在一起读，能让控制系统视角保持诚实，避免把某个产品实现误当成普遍原则。

### 17.1 研究流程

1. 从一个真实失败模式或真实设计选择出发。
2. 选择与你正在处理的层次匹配的源文本集群。
3. 抽取不变量，而不只是引文，并写入 wiki 页面、schema 或 checklist。
4. 在下一次事故前，把不变量变成测试、门禁或评审规则。
5. 当系统行为变化时，重新审视章节问题。

### 17.2 核心研究问题

- 这篇文本属于哪一层？
- 哪个不变量本可以防止我正在研究的失败样本？
- 当模型变化时，什么必须保持稳定？
- 哪些契约属于 runtime，哪些属于 policy？

---

## 18. 附录 B：Harness 自查矩阵

使用下面的矩阵为团队或产品打分。每一行标记为 `❌`、`⚠️` 或 `✅`。

### 18.1 Session 支柱

| # | 检查项 |
|---|---|
| S1 | Session 数据与聊天历史分开存储。 |
| S2 | Session 日志只追加。 |
| S3 | Session 可以通过 ID 恢复。 |
| S4 | 事件流对人可读且可比较差异。 |
| S5 | 新队友可以从 session 产物重建工作过程。 |

### 18.2 Harness 支柱

| # | 检查项 |
|---|---|
| H1 | Harness 状态存在于 harness 进程之外。 |
| H2 | Harness 接口小而稳定。 |
| H3 | 循环变体可以变化，而不用重写 session 模型。 |
| H4 | 模型升级不会迫使大范围 harness 重写。 |
| H5 | 每个 harness 变更都明确属于缺陷修复或协议执行。 |

### 18.3 Tools 支柱

| # | 检查项 |
|---|---|
| T1 | 工具职责是正交的。 |
| T2 | 调用和结果记录到 session 日志。 |
| T3 | 无效调用可以回滚或纠正。 |
| T4 | 凭据不进入沙箱。 |
| T5 | 有效工具组合不能静默逃逸策略。 |

### 18.4 Verification 支柱

| # | 检查项 |
|---|---|
| V1 | 生成器和评估器是分离的。 |
| V2 | 规格自动或半自动流入性质测试。 |
| V3 | 每个裁决都持久化到审计轨迹。 |
| V4 | Linting 能抵抗自利或迎合式输出。 |
| V5 | 外部证据可以证明正确性，而不必信任验证器自己的输出。 |

### 18.5 评分

- 16+ 个 `✅`：L4，强成熟度
- 12-15 个 `✅`：L3，已有独立验证层
- 8-11 个 `✅`：L2，session 协议真实存在但不完整
- 4-7 个 `✅`：L1，session 存在但协议较弱
- 低于 4 个 `✅`：L0，仍然以 prompt 为中心

---

## 19. 附录 C：精选术语表

这是全书最常出现术语的紧凑节选。

| 术语 | 含义 |
|---|---|
| Agent 循环 | 重复的生成、行动、观察循环。 |
| 追加式日志 | 永不重写历史的日志。 |
| 上下文工程 | 组织输入，使模型停留在有用区间。 |
| 事实流 | 系统承认真实发生过的 append-only 任务记录。 |
| 生命周期 | 任务从 queued 到 ready / failed 的公开、单调状态阶梯。 |
| 能力平面 | shell、文件系统、MCP、外部 API、人工输入和子 agent 的统一调度面。 |
| 产物与验证 | 把 primary artifact、validator、evidence 和终态裁决绑定在一起的契约。 |
| 回放 | 从同一事实流重建实时状态、历史状态和 UI 投影的能力。 |
| 隔离与恢复 | 用 worktree、scope、resume、background task 和 disk output 控制副作用与中断。 |
| 协作 | coordinator、worker、verifier、summarizer 等多 agent 角色之间的受控分工。 |
| 知识分层 | 把经验按 wiki、skills、docs、`AGENTS.md`、CI / validator 分层治理。 |
| 操作员面 | dashboard、门禁、回滚和事故归因共享的运行时控制面。 |
| 前馈 / 反馈 | 行动前的引导，行动后的感知。 |
| Harness | 约束并解释模型行为的运行时框架。 |
| Harness 工程 | 围绕模型设计控制层的工程实践。 |
| 意图 | 必须被明确表达、不能靠猜的人类目标。 |
| 元 Harness | 可以被优化或重新配置的 harness。 |
| Prompt 工程 | 通过 prompt 调整单轮行为。 |
| Session | 任务的持久、可恢复事实流。 |
| 稳定抽象 | 跨模型变化仍然有用的接口。 |
| 工具词汇表 | 系统可以采取的有边界动作集合。 |
| 验证独立性 | 验证不能与生成是同一件事。 |
| Wiki | 维护过的、结构化历史工作记忆。 |

---

## 20. 附录 D：按角色阅读路径

如果你把这本书作为团队资料阅读，请使用与你职责最匹配的最短路径。

| 角色 | 先读 | 然后读 |
|---|---|---|
| 工程负责人 | 1, 2, 3 | 5, 10, 11, 13 |
| Agent 产品构建者 | 1, 2, 6 | 7, 8, 9, 12 |
| 架构师 | 1, 4, 7 | 12, 13, 14 |
| CTO 或操作负责人 | 前言, 1, 9 | 13, 14, 19 |
| 研究者 | 1, 3, 4 | 9, 10, 11, 12, 15 |

---

## 21. 参考文献与研究轨迹

### 21.1 奠基来源

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
11. Nelson F. Liu et al. *Lost in the Middle: How Language Models Use Long Contexts.* TACL 2024. https://direct.mit.edu/tacl/article/doi/10.1162/tacl_a_00638/119630/Lost-in-the-Middle-How-Language-Models-Use-Long
12. Cheng-Yu Hsieh et al. *Found in the Middle: Calibrating Positional Attention Bias Improves Long Context Utilization.* ACL Findings 2024. https://aclanthology.org/2024.findings-acl.890/
13. Anthropic. *Prompting best practices: Long context prompting.* https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices#long-context-prompting
14. Google. *Introducing Gemini 1.5, Google's next-generation AI model.* 2024-02-15. https://blog.google/innovation-and-ai/products/google-gemini-next-generation-model-february-2024/
15. Google AI for Developers. *Long context.* https://ai.google.dev/gemini-api/docs/long-context
16. Ali Modarressi et al. *NoLiMa: Long-Context Evaluation Beyond Literal Matching.* ICML 2025. https://proceedings.mlr.press/v267/modarressi25a.html
17. Stefano Rando et al. *LongCodeBench: Evaluating Coding LLMs at 1M Context Windows.* COLM 2025. https://openreview.net/forum?id=GFPoM8Ylp8
18. Huiqiang Jiang et al. *LongLLMLingua: Accelerating and Enhancing LLMs in Long Context Scenarios via Prompt Compression.* ACL 2024. https://aclanthology.org/2024.acl-long.91/
19. Huiqiang Jiang et al. *MInference: Accelerating Pre-filling for Long-Context LLMs via Dynamic Sparse Attention.* 2024. https://openreview.net/forum?id=C5Nh2UFJ9S
20. OpenAI. *API Pricing.* Accessed 2026-04-23. https://openai.com/api/pricing/
21. OpenAI. *openai/codex* repository, especially `codex-rs/cli`、`codex-rs/app-server`、`codex-rs/app-server-protocol`、`codex-rs/tools`、`codex-rs/thread-store`、`codex-rs/rollout`、仓库根 `AGENTS.md` 与 `docs/agents_md.md`。Accessed 2026-04-23. https://github.com/openai/codex
22. OpenClaw. *openclaw/openclaw* repository README and docs. Accessed 2026-04-23. https://github.com/openclaw/openclaw
23. Nous Research. *NousResearch/hermes-agent* repository README and developer guide. Accessed 2026-04-23. https://github.com/NousResearch/hermes-agent
24. Claude Code 本地源码镜像审读，关键模块包括 `Tool.ts`、`query.ts`、`main.tsx`、`services/tools/StreamingToolExecutor.ts`、`services/compact/{microCompact,compact,apiMicrocompact}.ts`、`tools/AgentTool/{AgentTool.tsx,loadAgentsDir.ts,resumeAgent.ts}`、`utils/{sessionStorage.ts,fileStateCache.ts,worktree.ts,teammateMailbox.ts}`、`utils/task/diskOutput.ts`、`services/AgentSummary/agentSummary.ts`。审读日期 2026-04-23。
25. Norbert Wiener. *Cybernetics or Control and Communication in the Animal and the Machine.* MIT Press edition page and open-access description. Accessed 2026-04-23. https://mitpress.mit.edu/9780262537841/cybernetics-or-control-and-communication-in-the-animal-and-the-machine/
26. Stan Franklin, Art Graesser. *Is it an Agent, or Just a Program?: A Taxonomy for Autonomous Agents.* 1996. Accessed 2026-04-23. https://faculty.sites.iastate.edu/tesfatsi/archive/tesfatsi/AgentOrProgram.SFranklin1996.htm
27. Michael Wooldridge, Nicholas R. Jennings. *Intelligent Agents: Theory and Practice.* 1995. Accessed 2026-04-23. https://citeseerx.ist.psu.edu/document?doi=181e0a027acc7f1e5fbfc35958985e0aa2207588&repid=rep1&type=pdf
28. Chris Terman. *Computation Structures*, especially *L14: The Memory Hierarchy* and *L16: Virtual Memory.* Accessed 2026-04-23. https://computationstructures.org/lectures/caches/caches.html and https://computationstructures.org/lectures/vm/vm.html
29. H. S. Black. *Stabilized Feedback Amplifiers.* Bell System Technical Journal / Bell Labs archive, 1934. Accessed 2026-04-23. https://www.nokia.com/bell-labs/publications-and-media/publications/stabilized-feedback-amplifiers/
30. Encyclopaedia Britannica. *Norbert Wiener.* Accessed 2026-04-23. https://www.britannica.com/biography/Norbert-Wiener
31. Steve Joshua Heims. *The Cybernetics Group.* MIT Press page for the Macy Conferences history. Accessed 2026-04-23. https://mitpress.mit.edu/9780262082006/the-cybernetics-group/
32. Computer History Museum. *Main Memory*; *Delay Lines*; *Magnetic Core Memory.* Accessed 2026-04-23. https://www.computerhistory.org/revolution/memory-storage/8/251 , https://www.computerhistory.org/revolution/memory-storage/8/309 , https://www.computerhistory.org/revolution/memory-storage/8/253
33. IBM. *The IBM System/370.* Accessed 2026-04-23. https://www.ibm.com/us-en/history/system-370
34. Computer History Museum. *Bipolar RAMs in High Speed Applications.* Accessed 2026-04-23. https://www.computerhistory.org/revolution/memory-storage/8/313
35. National Inventors Hall of Fame. *Harold Stephen Black and the Negative Feedback Amplifier.* Accessed 2026-04-23. https://www.invent.org/inductees/harold-stephen-black
36. Anthropic. *Claude Code by Anthropic.* Accessed 2026-04-23. https://www.anthropic.com/product/claude-code
37. Anthropic. *How Anthropic teams use Claude Code.* 2025-07-24. Accessed 2026-04-23. https://www.anthropic.com/news/how-anthropic-teams-use-claude-code
38. Kief Morris. *Humans and Agents in Software Engineering Loops.* Martin Fowler, 2026-03-04. Accessed 2026-04-23. https://martinfowler.com/articles/exploring-gen-ai/humans-and-agents.html
39. OpenAI. *Introducing Codex.* 2025-05-16. Accessed 2026-04-23. https://openai.com/index/introducing-codex/
40. OpenAI. *Introducing the Codex app.* 2026-02-02. Accessed 2026-04-23. https://openai.com/index/introducing-the-codex-app/
41. Jiacheng Liu, Xiaohan Zhao, Xinyi Shang, Zhiqiang Shen. *Dive into Claude Code: The Design Space of Today's and Future AI Agent Systems.* arXiv:2604.14228, 2026-04-14. Local PDF reviewed 2026-04-27. https://arxiv.org/abs/2604.14228
42. Shunyu Yao et al. *ReAct: Synergizing Reasoning and Acting in Language Models.* ICLR 2023 / arXiv 2022. https://arxiv.org/abs/2210.03629
43. Petar Veličković et al. *Softmax is not Enough (for Sharp Size Generalisation).* arXiv:2410.01104. https://arxiv.org/abs/2410.01104
44. Jianlin Su et al. *RoFormer: Enhanced Transformer with Rotary Position Embedding.* arXiv:2104.09864. https://arxiv.org/abs/2104.09864
45. Federico Barbero et al. *Round and Round We Go! What makes Rotary Positional Encodings useful?* arXiv:2410.06205. https://arxiv.org/abs/2410.06205
46. Federico Barbero et al. *Transformers need glasses! Information over-squashing in language tasks.* NeurIPS 2024 / arXiv:2406.04267. https://arxiv.org/abs/2406.04267
47. Kimi Team. *Kimi K2 Technical Report.*（QK-Clip 与 attention-logit explosion；本书写作期审读其报告 PDF。）https://github.com/MoonshotAI/Kimi-K2
48. DeepSeek-AI. *DeepSeek-V4 Technical Report.*（CSA/HCA 混合压缩注意力；异构与 on-disk KV cache；本书写作期审读其报告 PDF。）https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro
49. MiniMax. *MiniMax M3.*（MiniMax Sparse Attention / 线性注意力，面向 1M token 上下文。）https://www.minimax.io/blog/minimax-m3
50. Chroma Research. *Context Rot: How Increasing Input Tokens Impacts LLM Performance.* 2025. https://www.trychroma.com/research/context-rot
51. Anthropic. *Effective context engineering for AI agents.* https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents

### 21.2 支持性参考

- Kai Mei et al. *AIOS: LLM Agent Operating System.*
- Bertrand Meyer. *Object-Oriented Software Construction.*
- Dan Ariely 2013 年关于 big data 的那句话，它既是本书反复出现的玩笑，也是警告。
- EU AI Act、SEC disclosure expectations、FDA SaMD guidance 等治理压力。

### 21.3 研究轨迹

底层研究材料位于写作本书时使用的 `ascent-research` session tree，包括 `session.md`、`session.jsonl`、`SCHEMA.md`、`wiki/`、`diagrams/`、`raw/` 和 `drafts/`。

这条轨迹本身也是本书论点的一部分：写作过程就是一次被 harness 化、可恢复、可回放的工作。
