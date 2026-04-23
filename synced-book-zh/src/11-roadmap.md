# 10. 工作流到里程碑映射：务实路线图

这份映射对齐当前 M4 方向和剩余平台化缺口。

## M4.1A — 父级可见的结构化进度 ABI

- 类型化 `octos.harness.event.v1`
- sink + consumer + task_status bridge
- deep-search 从 stderr status 迁移
- UI/API replay 一致性
- mini fleet live gate
- 非 Rust emitters

## M4.2 — 开发者契约产品化

- manifest/policy/task 字段的稳定文档
- 面向各类产物的入门应用模板
- 带失败模式的契约示例

## M4.3 — 类型化验证器运行器

- 带类型化结果的声明式验证器
- 超时分类和失败类别
- 可回放证据与面向操作员的来源记录

## M4.4 — 第三方 app/skill 兼容性门禁

- 从 git 安装
- 运行 harness 流程
- 验证产物
- 重载并验证持久化
- 卸载并验证没有状态串扰

## M4.5 — 操作员仪表盘成熟化

- 生命周期 + 阶段 + 验证器 + 产物表面
- 重试/超时/孤儿任务诊断
- 由规范任务摘要支撑的紧凑事故视图

## M4.6 — 显式 ABI 版本化和迁移策略

- events/hooks/policy/task 字段的 schema 版本
- 兼容性测试和废弃窗口
- 外部采用前的破坏性变更协议

这条路线图按上面的失败排序，而不是按 backlog 美观排序。前几项修复事实传播；后几项在事实模型稳定后加强兼容性和治理。下一章是必要的停顿：harness 修复编排正确性，但它不能完成整个产品。

---

### 同步说明

本节以 Octos 短纲要为准。较大的 mdBook 源材料中暂时没有直接映射到本节的章节，所以本节目前保留为纲要主导内容。
