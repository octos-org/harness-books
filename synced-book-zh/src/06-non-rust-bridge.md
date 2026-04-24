# 5. 能力平面与生态桥接：不要把 agent 关在单一语言里

第 4 章那张总图里，最容易被低估的是“能力平面”。很多团队把它理解成“再接几个工具”，但 Claude Code 和 Codex 给出的实际信号更强：想做万用 agent，就必须默认系统会不断越出本语言、越出本进程、越出本仓库，去调用 shell、浏览器、MCP、外部 API、第三方脚本，甚至别的 agent。

## 5.1 为什么万用 agent 必然走向能力平面

Claude Code 之所以能既写代码、又写文章、写 slide、做研究、驱动外部 MCP 服务，不是因为它为每个场景单独训练了一套 prompt，而是因为这些场景都能被还原成一组相对稳定的动作原语：

- 读写本地产物；
- 运行命令和脚本；
- 访问网络与外部服务；
- 读取外部资源；
- 派工给别的 agent；
- 在必要时向人类请求输入或确认。

Codex 也在公开协议面上把同样的能力列得很清楚：`command/exec`、`fs/*`、`mcpServer/tool/call`、`mcpServer/resource/read`、`tool/requestUserInput`、`spawn_agent` 等都不是附属功能，而是 runtime 的原生动作词汇表。两套系统说明的是同一件事：所谓“万用 agent”，本质上是一个能编排多种能力源的运行时，不是一个更长的 system prompt。[^capability-plane-ch5]

## 5.2 Claude Code / Codex 如何把外部能力接进来

Claude Code 在 `ToolUseContext` 里直接持有 `mcpClients`、`mcpResources`、`agentDefinitions`、`commands`、`tools`、权限上下文与 `AppState`。这说明它的核心对象不是“当前正在编辑的代码文件”，而是“当前正在推进的任务线程”。任务线程会拿着同一套身份、权限、记忆与摘要机制，去调用不同来源的能力。

Codex 的路线更偏协议化。它把文件系统、命令执行、MCP、人工输入、多 agent 工具统一暴露在工具注册面和 app-server 协议上。这样做的意义在于，CLI、桌面端、Web 或未来的别的客户端，不需要各自重新发明一遍“怎么执行 shell、怎么继续 thread、怎么向外部 agent 派工”。能力面已经先在内核层被抽象出来。[^capability-plane-ch5]

这里真正值得学习的不是具体模块名，而是一个架构判断：外部能力不是插件尾巴，而是运行时主干的一部分。

## 5.3 失败案例怎样倒逼出协议化接入

一旦外部能力没有进入统一协议面，第 3 章那几类事故会立刻重新出现：

- 某个 Python skill 用 stderr 表达进度，父任务就会回到 3.1 的进度漂移；
- 某个 Node 脚本自己猜主产物路径，就会回到 3.4 的产物契约缺口；
- 某个 shell job 不带 session / topic scope，就会回到 3.3 的会话污染；
- 某个外部 verifier 只返回一行字符串，就会回到 3.5 的验证器不完整；
- 某个集成只在自己的日志里留证据，操作员就会回到 3.6 的盲区。

所以“桥接”绝不只是 SDK 便利性问题。它的本质是：所有外部能力都要在进入系统时就被收口到同一套 session、scope、artifact、validator、evidence 规则里。

## 5.4 落地模式：入口允许多样，消费端必须强约束

更稳妥的落地方式通常是下面这组组合：

- 为 Python / Node / shell / 外部服务提供轻量事件发射辅助层；
- 提供 CLI 或环境变量形式的兜底桥接，例如 `HARNESS_EVENT_SINK`；
- 允许 sink 缺失时 no-op，但不允许跳过结果契约和终态验证；
- 在消费端统一校验 schema、session/topic scope、phase、artifact 引用与 validator 证据。

这条原则可以压成一句话：发射端允许语言和生态多样性，消费端必须保持运行时真相的唯一性。

如果系统以后还要接插件市场、第三方 workflow 或外部 agent，这一章讲的能力平面就是最先要守住的边界。否则平台每开放一步，事实协议就会被侵蚀一步。

[^capability-plane-ch5]: 本章在此处综合 Claude Code `ToolUseContext`、MCP 与 agent 定义相关实现，以及 Codex `tools` 与 `app-server` 协议面中关于 command、fs、MCP、human input、多 agent 工具的公开边界，用来说明万用 agent 必须先拥有统一的能力平面；对应第 19 章参考文献 21、24。

---
