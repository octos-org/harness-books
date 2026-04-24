# 11. Harness 必要但不充分

讲完路线图以后，必须立刻收边界。否则团队很容易把 harness 当成万能解释，把所有产品质量问题都往上堆。这一章的任务，就是把 harness 能解决什么、不能解决什么切开。

## 11.1 一个匿名失败链：研究任务“看似完成”，但交付的是错文件

拿一条很典型的匿名失败链来看，会更容易看清 harness 的边界。用户发来一个任务：“读 12 篇材料，生成一份 20 页汇报，并附带可演示的 slides。”系统表面上做了很多对的事情：起了研究 worker，调用了 web / MCP 搜索，写了草稿，最后还返回了一个 `ready` 状态和一份 `pptx`。但用户一打开文件，发现交付的是旧版本模板，引用也不完整，真正的新内容只写进了一个中间 Markdown 文件里。

如果顺着事故往回追，这条失败链通常会长成下面这样：

1. session 层没有把“哪一个 root task、哪几个 child task、哪一个 primary artifact”钉成单一事实；
2. capability plane 层里，研究 worker 用 Python 脚本和 MCP 拉资料，打包 worker 用 shell 生成 slides，但两边只在自由文本里提到产物路径，没有统一的 artifact 引用；
3. verifier 只检查“有没有生成一个 `pptx` 文件”，没有检查引用数量、主文件归属和内容新鲜度，于是错误文件也能通过；
4. operator dashboard 只能看到“任务 ready”，看不到哪个 child worker 报告了哪个产物、哪个 validator 实际没覆盖到关键约束；
5. swarm 层里，coordinator 只拿到一句“slides generated successfully”，没有拿到带证据的 summary，因此把错误结果当成了真实完成。

这条链很有代表性，因为它不是模型单点失误，而是 `session -> capability plane -> verifier -> operator dashboard -> swarm` 五层都少了一点约束，于是最后在用户面前合成了一次“假成功”。

## 11.2 顺着这条失败链，看五层架构如何真正落地

如果要把上面的事故真正修住，不能只在最后补一个“更强提示词”，而要顺着五层架构逐层落地。

`session` 层先做硬事实。root task 创建时，就声明本轮交付物是 `report.md` 与 `slides.pptx`，并把每个 child task 的 owner、role、scope、worktree、expected artifact type 写进事实流。这样 coordinator、replay、dashboard 和 verifier 才是在读同一份任务定义，而不是各自猜测。

`capability plane` 层再做统一入口。研究 worker 无论是用 Python、Node、shell 还是 MCP，都只能通过统一事件和 artifact 报告面回传结果。脚本可以自由实现，但不能自由定义状态协议；外部能力可以多样，但产物引用、scope 绑定和任务归属必须一致。

`verifier` 层负责终态裁决。它不只检查“文件存在”，还要检查：这是不是被声明过的 primary artifact，引用和页数是否达标，slides 是否基于当前 report 生成，证据文件存在哪里。只有通过这些检查，root task 才能进入 `ready`。否则就应该停在 `verifying` 或进入 `failed`，而不是把验证成本甩给用户。

`operator dashboard` 层负责把这条链说清楚。值班同学应该能一眼看到：哪个 coordinator 派出了哪些 child task，每个 child 最近一次 summary 是什么，哪个 artifact 被报告，哪个 validator 成功或失败，证据路径在哪里。这样收到用户投诉时，团队不是从头猜，而是直接沿着事实流定位是哪一层断了。

`swarm` 层最后负责把多 agent 协作收束成单一系统真相。coordinator 只负责拆解、汇总和裁决；research worker 只负责证据搜集；draft worker 只负责文本和 slides 生成；verifier worker 只负责检查。没有任何一个 worker 可以单独宣布整个系统已经成功。只要这条规则还守着，局部成功就不会再轻易伪装成系统成功。

## 11.3 Harness 解决到哪，哪里仍不是 harness 的职责

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
