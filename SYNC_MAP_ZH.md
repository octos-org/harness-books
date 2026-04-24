# 同步映射表

当前提纲控制章节顺序。较大的 mdBook 源材料按下表映射进中文纲要版。

| 纲要章节 | 扩展源文件 | 状态 |
|---|---|---|
| 前言：为什么需要这本书 | `00-frontmatter.md` — book positioning, audience, and frontmatter<br>`00-prologue.md` — larger-book opening argument and two-layer framing | 已映射 |
| 0. 全书地图与阅读指南 | `00-how-to-read.md` — larger-book reading guide<br>`SUMMARY.md` — original mdBook table of contents for traceability | 已映射 |
| 1. LLM 的工作区间：为什么控制系统必不可少 | `01-two-layers.md` — Layer 1 / Layer 2 boundary<br>`02-from-prompt-to-harness.md` — prompt -> context -> harness progression<br>`04-oldest-new-idea.md` — stable abstraction and control-system lineage | 已映射 |
| 2. 成熟度鸿沟：灵光一闪 vs 工厂化输出 | `03-intent-first-engineering.md` — intent/spec/harness loop<br>`05-ai-coding-harness.md` — OpenAI 1M LOC case and AI coding factory mechanics | 已映射 |
| 3. 通用失败类别：一组真实失败案例如何把问题暴露出来 | `13-failure-and-antifragility.md` — failure museum, root-cause taxonomy, antifragile repair | 已映射 |
| 4. 核心 Harness 架构：当前实用模型 | `06-session-pillar.md` — session as recoverable fact stream<br>`07-harness-pillar.md` — replaceable harness scheduler and runtime interface<br>`08-tools-pillar.md` — tools as accountable action vocabulary<br>`09-verification-pillar.md` — independent verification and audit trail | 已映射 |
| 5. 非 Rust 桥接：平台现实的必需品 | _无_ | 纲要主导缺口 |
| 6. UI 回放不是前端功能，而是可靠性功能 | _无_ | 纲要主导缺口 |
| 7. 操作员仪表盘与小型 fleet 实测 | _无_ | 纲要主导缺口 |
| 8. Agent 群体编排：Harness 如何扩展团队而不只是代码 | `14-many-brains-many-hands.md` — multi-agent orchestration and terminal vision | 已映射 |
| 9. 原则与反模式 | `10-two-loops.md` — short-loop vs long-loop operating principles<br>`11-knowledge-and-skills.md` — knowledge/skill promotion and anti-patterns<br>`12-reflexive-harness.md` — self-modifying harness boundaries | 已映射 |
| 10. 工作流到里程碑映射：务实路线图 | _无_ | 纲要主导缺口 |
| 11. Harness 必要但不充分 | _无_ | 纲要主导缺口 |
| 12. 可执行清单 | _无_ | 纲要主导缺口 |
| 13. 参考架构片段 | _无_ | 纲要主导缺口 |
| 14. 结语：下一阶段的工程姿态 | `99-epilogue.md` — larger-book closing argument | 已映射 |
| 15. 附录 A：源文本与研究流程 | `appendix-a-foundation-texts.md` — full foundation-text appendix | 已映射 |
| 16. 附录 B：Harness 自查矩阵 | `appendix-b-self-audit-matrix.md` — full four-pillar self-audit matrix | 已映射 |
| 17. 附录 C：精选术语表 | `appendix-c-glossary.md` — full glossary | 已映射 |
| 18. 附录 D：按角色阅读路径 | `appendix-d-reading-guide.md` — full role-based reading guide | 已映射 |
| 19. 参考文献与研究轨迹 | `99-references.md` — full reference list | 已映射 |

生成输出：
- `OCTOS_HARNESS_ENGINEERING_AI_SOFTWARE_FACTORY_FULL_SYNCED_ZH.md`
- `synced-book-zh/`
