# 4. 核心 Harness 架构：当前实用模型

```text
子工具或技能（Rust/Python/Node/shell）
        |
        | 发出 octos.harness.event.v1（progress/error/info）
        v
事件入口（OCTOS_EVENT_SINK，file/socket/stdio）
        |
        v
运行时消费与校验
        |
        +--> 任务监督器持久状态（task_status, lifecycle_state, detail）
        |
        +--> TaskStatusChanged 事件
        |
        +--> 会话事件流回放
        v
API (/sessions/:id/tasks + /events/stream)
        |
        v
UI 状态气泡、页头与重载回放
```

关键规则：UI 永远是下游，不是权威。

## 4.1 生命周期模型

公开状态机：

- `queued`
- `running`
- `verifying`
- `ready`
- `failed`

内部可以存在更细粒度状态，但产品表面不应依赖不稳定的内部标签。

## 4.2 契约层

```text
第 A 层：能力清单       （app 能做什么）
第 B 层：工作区策略     （产物、验证器、spawn 契约）
第 C 层：运行时结果模型 （生命周期、任务状态、交付证据）
```

## 4.3 为什么类型化事件重要

没有类型化事件，进度只是“类似聊天的提示”。  
有了类型化事件，进度就是可以验证、回放和审计的数据产品。

## 4.4 四支柱：Session、Harness、Tools、Verification

原书把 Layer 2 的稳定基础拆成四根支柱，这正好可以解释 Octos 当前架构为什么要这样设计。

Session 是可恢复的事实流。它不是聊天历史，也不是模型上下文，而是 append-only 的任务事实记录。一个好的 session 让新 teammate、重启后的 worker、dashboard 和审计系统都能从同一条事实流重建发生了什么。

Harness 是可替换的调度脑干。它负责读取 session、驱动 agent 循环、调度工具、处理失败和升级。它应该尽量小而稳定，避免把一次产品补丁写成永久运行时协议。

Tools 是可问责的动作词汇表。每个工具调用都应该有明确职责、权限边界、输入输出 schema 和审计记录。工具不是“模型想干什么就给什么”，而是系统允许它采取的有边界动作。

Verification 是独立于生成的判断层。生成器说“完成”不等于完成；验证器、产物策略、性质测试、验证器运行器和外部证据才决定能否进入终态成功。

## 4.5 为什么 session.jsonl 这类朴素设计仍然重要

原书借 Karpathy 的 autoresearch 思路强调：长期知识系统最难的不是“让模型想起来”，而是 bookkeeping。`session.md` 提供人类可读的叙事，`session.jsonl` 提供机器可回放的事件。这个组合朴素，但非常抗变化：模型会换，前端会换，工具会换，事实流不应该轻易换。[^karpathy-bookkeeping-ch4]

Octos 的任务状态、SSE 回放、操作员仪表盘，本质上都应该从这个事实流派生，而不是各自维护一份“看起来差不多”的状态。

[^karpathy-bookkeeping-ch4]: Andrej Karpathy, *LLM Wiki.* 本章在此处使用其关于 autoresearch 双文件与 bookkeeping 的思路，说明 `session.md` + `session.jsonl` 这类事实流设计的价值；对应第 19 章参考文献 9。

---
