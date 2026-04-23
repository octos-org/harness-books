#!/usr/bin/env python3
from __future__ import annotations

import re
import shutil
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTLINE = ROOT / "sources" / "octos-outline" / "OCTOS_HARNESS_ENGINEERING_AI_SOFTWARE_FACTORY.md"
ZH_OUTLINE = ROOT / "sources" / "octos-outline" / "OCTOS_HARNESS_ENGINEERING_AI_SOFTWARE_FACTORY.zh.md"
FULL_SRC = ROOT / "sources" / "large-mdbook-src"
OUT_DIR = ROOT / "synced-book"
SINGLE_OUT = ROOT / "OCTOS_HARNESS_ENGINEERING_AI_SOFTWARE_FACTORY_FULL_SYNCED.md"
MAP_OUT = ROOT / "SYNC_MAP.md"
ZH_OUT_DIR = ROOT / "synced-book-zh"
ZH_SINGLE_OUT = ROOT / "OCTOS_HARNESS_ENGINEERING_AI_SOFTWARE_FACTORY_FULL_SYNCED_ZH.md"
ZH_MAP_OUT = ROOT / "SYNC_MAP_ZH.md"


@dataclass(frozen=True)
class SourceFile:
    path: str
    note: str


SECTION_SOURCES: dict[str, list[SourceFile]] = {
    "Preface: Why this book exists": [
        SourceFile("00-frontmatter.md", "book positioning, audience, and frontmatter"),
        SourceFile("00-prologue.md", "larger-book opening argument and two-layer framing"),
    ],
    "0. Book map and reading guide": [
        SourceFile("00-how-to-read.md", "larger-book reading guide"),
        SourceFile("SUMMARY.md", "original mdBook table of contents for traceability"),
    ],
    "1. LLM operating region and why control systems exist": [
        SourceFile("01-two-layers.md", "Layer 1 / Layer 2 boundary"),
        SourceFile("02-from-prompt-to-harness.md", "prompt -> context -> harness progression"),
        SourceFile("04-oldest-new-idea.md", "stable abstraction and control-system lineage"),
    ],
    "2. The maturity gap: genius moments vs factory output": [
        SourceFile("03-intent-first-engineering.md", "intent/spec/harness loop"),
        SourceFile("05-ai-coding-harness.md", "OpenAI 1M LOC case and AI coding factory mechanics"),
    ],
    "3. Failure classes Octos hit (and why they were expensive)": [
        SourceFile("13-failure-and-antifragility.md", "failure museum, root-cause taxonomy, antifragile repair"),
    ],
    "4. Core harness architecture (current practical model)": [
        SourceFile("06-session-pillar.md", "session as recoverable fact stream"),
        SourceFile("07-harness-pillar.md", "replaceable harness scheduler and runtime interface"),
        SourceFile("08-tools-pillar.md", "tools as accountable action vocabulary"),
        SourceFile("09-verification-pillar.md", "independent verification and audit trail"),
    ],
    "8. Agent swarm orchestration: how harness scales teams, not just code": [
        SourceFile("14-many-brains-many-hands.md", "multi-agent orchestration and terminal vision"),
    ],
    "9. Principles and anti-patterns": [
        SourceFile("10-two-loops.md", "short-loop vs long-loop operating principles"),
        SourceFile("11-knowledge-and-skills.md", "knowledge/skill promotion and anti-patterns"),
        SourceFile("12-reflexive-harness.md", "self-modifying harness boundaries"),
    ],
    "14. Closing: engineering stance for next phases": [
        SourceFile("99-epilogue.md", "larger-book closing argument"),
    ],
    "15. Appendix A: source texts and study workflow": [
        SourceFile("appendix-a-foundation-texts.md", "full foundation-text appendix"),
    ],
    "16. Appendix B: harness self-audit matrix": [
        SourceFile("appendix-b-self-audit-matrix.md", "full four-pillar self-audit matrix"),
    ],
    "17. Appendix C: selected glossary": [
        SourceFile("appendix-c-glossary.md", "full glossary"),
    ],
    "18. Appendix D: role-based reading paths": [
        SourceFile("appendix-d-reading-guide.md", "full role-based reading guide"),
    ],
    "19. References and research trail": [
        SourceFile("99-references.md", "full reference list"),
    ],
}


SECTION_SLUGS: dict[str, str] = {
    "Preface: Why this book exists": "00-preface.md",
    "0. Book map and reading guide": "01-book-map.md",
    "1. LLM operating region and why control systems exist": "02-operating-region.md",
    "2. The maturity gap: genius moments vs factory output": "03-maturity-gap.md",
    "3. Failure classes Octos hit (and why they were expensive)": "04-failure-classes.md",
    "4. Core harness architecture (current practical model)": "05-core-architecture.md",
    "5. Non-Rust bridge: mandatory for platform reality": "06-non-rust-bridge.md",
    "6. UI replay is not a frontend feature; it is a reliability feature": "07-ui-replay.md",
    "7. Operator dashboard and mini fleet live testing": "08-dashboard-mini-fleet.md",
    "8. Agent swarm orchestration: how harness scales teams, not just code": "09-agent-swarm.md",
    "9. Principles and anti-patterns": "10-principles-anti-patterns.md",
    "10. Workstream to milestone mapping (pragmatic roadmap)": "11-roadmap.md",
    "11. Harness is necessary but not sufficient": "12-necessary-not-sufficient.md",
    "12. Actionable checklists": "13-checklists.md",
    "13. Reference architecture snippets": "14-reference-architecture.md",
    "14. Closing: engineering stance for next phases": "15-closing.md",
    "15. Appendix A: source texts and study workflow": "16-appendix-a.md",
    "16. Appendix B: harness self-audit matrix": "17-appendix-b.md",
    "17. Appendix C: selected glossary": "18-appendix-c.md",
    "18. Appendix D: role-based reading paths": "19-appendix-d.md",
    "19. References and research trail": "20-references.md",
}


ZH_HEADINGS: dict[str, str] = {
    "Preface: Why this book exists": "前言：为什么需要这本书",
    "0. Book map and reading guide": "0. 全书地图与阅读指南",
    "1. LLM operating region and why control systems exist": "1. LLM 的工作区间：为什么控制系统必不可少",
    "2. The maturity gap: genius moments vs factory output": "2. 成熟度鸿沟：灵光一闪 vs 工厂化输出",
    "3. Failure classes Octos hit (and why they were expensive)": "3. Octos 遇到的失败类别，以及代价为何高",
    "4. Core harness architecture (current practical model)": "4. 核心 Harness 架构：当前实用模型",
    "5. Non-Rust bridge: mandatory for platform reality": "5. 非 Rust 桥接：平台现实的必需品",
    "6. UI replay is not a frontend feature; it is a reliability feature": "6. UI 回放不是前端功能，而是可靠性功能",
    "7. Operator dashboard and mini fleet live testing": "7. 操作员仪表盘与小型 fleet 实测",
    "8. Agent swarm orchestration: how harness scales teams, not just code": "8. Agent 群体编排：Harness 如何扩展团队而不只是代码",
    "9. Principles and anti-patterns": "9. 原则与反模式",
    "10. Workstream to milestone mapping (pragmatic roadmap)": "10. 工作流到里程碑映射：务实路线图",
    "11. Harness is necessary but not sufficient": "11. Harness 必要但不充分",
    "12. Actionable checklists": "12. 可执行清单",
    "13. Reference architecture snippets": "13. 参考架构片段",
    "14. Closing: engineering stance for next phases": "14. 结语：下一阶段的工程姿态",
    "15. Appendix A: source texts and study workflow": "15. 附录 A：源文本与研究流程",
    "16. Appendix B: harness self-audit matrix": "16. 附录 B：Harness 自查矩阵",
    "17. Appendix C: selected glossary": "17. 附录 C：精选术语表",
    "18. Appendix D: role-based reading paths": "18. 附录 D：按角色阅读路径",
    "19. References and research trail": "19. 参考文献与研究轨迹",
}


ZH_SOURCE_NOTES: dict[str, str] = {
    "book positioning, audience, and frontmatter": "全书定位、读者对象与前置说明",
    "larger-book opening argument and two-layer framing": "大书开场论证与两层框架",
    "larger-book reading guide": "大书阅读指南",
    "original mdBook table of contents for traceability": "原 mdBook 目录，用于可追溯性",
    "Layer 1 / Layer 2 boundary": "Layer 1 / Layer 2 边界",
    "prompt -> context -> harness progression": "prompt -> context -> harness 的演进",
    "stable abstraction and control-system lineage": "稳定抽象与控制系统谱系",
    "intent/spec/harness loop": "intent/spec/harness 闭环",
    "OpenAI 1M LOC case and AI coding factory mechanics": "OpenAI 1M LOC 案例与 AI coding 工厂机制",
    "failure museum, root-cause taxonomy, antifragile repair": "失败模式博物馆、根因分类与反脆弱修复",
    "session as recoverable fact stream": "session 作为可恢复事实流",
    "replaceable harness scheduler and runtime interface": "可替换 harness 调度器与运行时接口",
    "tools as accountable action vocabulary": "tools 作为可问责动作词汇表",
    "independent verification and audit trail": "独立 verification 与 audit trail",
    "multi-agent orchestration and terminal vision": "多 agent 编排与终局愿景",
    "short-loop vs long-loop operating principles": "短循环与长循环的操作原则",
    "knowledge/skill promotion and anti-patterns": "knowledge/skill 晋升与反模式",
    "self-modifying harness boundaries": "自修改 harness 的边界",
    "larger-book closing argument": "大书收束论证",
    "full foundation-text appendix": "完整奠基文本附录",
    "full four-pillar self-audit matrix": "完整四支柱自查矩阵",
    "full glossary": "完整术语表",
    "full role-based reading guide": "完整按角色阅读指南",
    "full reference list": "完整参考文献列表",
}


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def split_outline(text: str) -> tuple[str, list[tuple[str, str]]]:
    lines = text.splitlines()
    title: list[str] = []
    sections: list[tuple[str, list[str]]] = []
    current_heading: str | None = None
    current_lines: list[str] = []

    for line in lines:
        if line.startswith("## "):
            if current_heading is not None:
                sections.append((current_heading, current_lines))
            current_heading = line[3:].strip()
            current_lines = [line]
        elif current_heading is None:
            title.append(line)
        else:
            current_lines.append(line)

    if current_heading is not None:
        sections.append((current_heading, current_lines))

    return "\n".join(title).strip() + "\n", [(heading, "\n".join(body).strip() + "\n") for heading, body in sections]


def shift_headings(markdown: str, delta: int) -> str:
    shifted: list[str] = []
    in_fence = False

    for line in markdown.splitlines():
        stripped = line.lstrip()
        if stripped.startswith("```") or stripped.startswith("~~~"):
            in_fence = not in_fence
            shifted.append(line)
            continue

        if not in_fence:
            match = re.match(r"^(#{1,6})(\s+.*)$", line)
            if match:
                level = min(6, len(match.group(1)) + delta)
                shifted.append("#" * level + match.group(2))
                continue

        shifted.append(line)

    return "\n".join(shifted).strip() + "\n"


def source_title(markdown: str, fallback: str) -> str:
    for line in markdown.splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return fallback


def expansion_for(section_heading: str) -> str:
    sources = SECTION_SOURCES.get(section_heading, [])
    if not sources:
        return (
            "\n### Sync Note\n\n"
            "The short Octos outline is canonical for this section. The larger mdBook source has no direct chapter mapped here yet, so this section currently remains outline-led.\n"
        )

    parts = ["\n### Expanded Source Material\n"]
    for item in sources:
        src_path = FULL_SRC / item.path
        content = read(src_path)
        title = source_title(content, item.path)
        parts.append(f"\n#### From `{item.path}`: {title}\n\n_Source role: {item.note}._\n\n")
        parts.append(shift_headings(content, 3))
    return "\n".join(parts)


def convert_section_for_mdbook(section_body: str) -> str:
    lines = []
    for line in section_body.splitlines():
        if line.startswith("## "):
            lines.append("# " + line[3:])
        elif line.startswith("### "):
            lines.append("## " + line[4:])
        elif line.startswith("#### "):
            lines.append("### " + line[5:])
        else:
            lines.append(line)
    return "\n".join(lines).strip() + "\n"


def write_mdbook(title_block: str, sections: list[tuple[str, str]]) -> None:
    src_dir = OUT_DIR / "src"
    src_dir.mkdir(parents=True, exist_ok=True)
    copy_shared_assets(src_dir)

    (OUT_DIR / "book.toml").write_text(
        "[book]\n"
        "title = \"Harness Engineering: Octos Outline-Synced Edition\"\n"
        "authors = [\"Octos Harness Research\"]\n"
        "language = \"en\"\n"
        "src = \"src\"\n",
        encoding="utf-8",
    )

    frontmatter = (
        "# Harness Engineering: Octos Outline-Synced Edition\n\n"
        "This generated edition uses the Octos outline as the table of contents and folds in expanded material from the larger harness-engineering mdBook source.\n\n"
        "## Original Outline Header\n\n"
        + shift_headings(title_block, 1)
    )
    (src_dir / "00-title.md").write_text(frontmatter, encoding="utf-8")

    summary_lines = ["# Summary", "", "[Title](./00-title.md)", ""]
    for heading, _ in sections:
        slug = SECTION_SLUGS[heading]
        summary_lines.append(f"- [{heading}](./{slug})")
    summary_lines.append("")
    (src_dir / "SUMMARY.md").write_text("\n".join(summary_lines), encoding="utf-8")

    for heading, body in sections:
        section_text = convert_section_for_mdbook(body)
        section_text += expansion_for(heading)
        (src_dir / SECTION_SLUGS[heading]).write_text(section_text, encoding="utf-8")


def write_single_file(title_block: str, sections: list[tuple[str, str]]) -> None:
    parts = [
        title_block.strip(),
        "\n> Sync edition note: this file keeps the short Octos outline as the controlling structure and inserts expanded source material from the larger mdBook under the matching outline sections.\n",
    ]
    for heading, body in sections:
        parts.append(body)
        parts.append(expansion_for(heading))
    SINGLE_OUT.write_text("\n\n".join(part.strip() for part in parts if part.strip()) + "\n", encoding="utf-8")


def write_map(sections: list[tuple[str, str]]) -> None:
    lines = [
        "# Sync Map",
        "",
        "The short Octos outline controls section order. The larger mdBook source is mapped into that outline as follows.",
        "",
        "| Outline section | Expanded source files | Status |",
        "|---|---|---|",
    ]
    for heading, _ in sections:
        sources = SECTION_SOURCES.get(heading, [])
        if sources:
            files = "<br>".join(f"`{item.path}` — {item.note}" for item in sources)
            status = "mapped"
        else:
            files = "_none_"
            status = "outline-led gap"
        lines.append(f"| {heading} | {files} | {status} |")
    lines.append("")
    lines.append("Generated outputs:")
    lines.append(f"- `{SINGLE_OUT.relative_to(ROOT)}`")
    lines.append(f"- `{OUT_DIR.relative_to(ROOT)}/`")
    MAP_OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")


def zh_heading(heading: str) -> str:
    return ZH_HEADINGS.get(heading, heading)


def expansion_for_zh(section_heading: str) -> str:
    # The Chinese edition is an integrated rewrite. Relevant material from the
    # larger mdBook is folded into the Chinese outline source itself, so we do
    # not append raw source chapters here.
    return ""


def write_zh_mdbook(title_block: str, zh_sections: list[tuple[str, str]]) -> None:
    src_dir = ZH_OUT_DIR / "src"
    src_dir.mkdir(parents=True, exist_ok=True)
    copy_shared_assets(src_dir)

    (ZH_OUT_DIR / "book.toml").write_text(
        "[book]\n"
        "title = \"驾驭工程：Octos 纲要同步版\"\n"
        "authors = [\"Octos Harness Research\"]\n"
        "language = \"zh-CN\"\n"
        "src = \"src\"\n",
        encoding="utf-8",
    )

    frontmatter = (
        "# 驾驭工程：Octos 纲要同步版\n\n"
        "这个生成版本以 Octos 短纲要作为目录与结构，把较大的 harness-engineering mdBook 源材料折叠进对应章节。\n\n"
        "## 原始纲要标题块\n\n"
        + shift_headings(title_block, 1)
    )
    (src_dir / "00-title.md").write_text(frontmatter, encoding="utf-8")

    summary_lines = ["# 目录", "", "[标题页](./00-title.md)", ""]
    for heading, _ in zh_sections:
        slug = SECTION_SLUGS[heading]
        summary_lines.append(f"- [{zh_heading(heading)}](./{slug})")
    summary_lines.append("")
    (src_dir / "SUMMARY.md").write_text("\n".join(summary_lines), encoding="utf-8")

    for heading, body in zh_sections:
        section_text = convert_section_for_mdbook(body)
        section_text += expansion_for_zh(heading)
        (src_dir / SECTION_SLUGS[heading]).write_text(section_text, encoding="utf-8")


def write_zh_single_file(title_block: str, zh_sections: list[tuple[str, str]]) -> None:
    parts = [
        title_block.strip(),
        "\n> 同步版说明：本文以 Octos 短纲要作为控制结构，并把较大的 mdBook 源材料插入到匹配章节下。\n",
    ]
    for heading, body in zh_sections:
        parts.append(body)
        parts.append(expansion_for_zh(heading))
    ZH_SINGLE_OUT.write_text("\n\n".join(part.strip() for part in parts if part.strip()) + "\n", encoding="utf-8")


def write_zh_map(sections: list[tuple[str, str]]) -> None:
    lines = [
        "# 同步映射表",
        "",
        "Octos 短纲要控制章节顺序。较大的 mdBook 源材料按下表映射进中文纲要版。",
        "",
        "| 纲要章节 | 扩展源文件 | 状态 |",
        "|---|---|---|",
    ]
    for heading, _ in sections:
        sources = SECTION_SOURCES.get(heading, [])
        if sources:
            files = "<br>".join(f"`{item.path}` — {item.note}" for item in sources)
            status = "已映射"
        else:
            files = "_无_"
            status = "纲要主导缺口"
        lines.append(f"| {zh_heading(heading)} | {files} | {status} |")
    lines.append("")
    lines.append("生成输出：")
    lines.append(f"- `{ZH_SINGLE_OUT.relative_to(ROOT)}`")
    lines.append(f"- `{ZH_OUT_DIR.relative_to(ROOT)}/`")
    ZH_MAP_OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")


def copy_shared_assets(src_dir: Path) -> None:
    for asset in FULL_SRC.glob("*.svg"):
        shutil.copy2(asset, src_dir / asset.name)
    for asset in FULL_SRC.glob("*.png"):
        shutil.copy2(asset, src_dir / asset.name)


def main() -> None:
    title_block, sections = split_outline(read(OUTLINE))
    zh_title_block, zh_raw_sections = split_outline(read(ZH_OUTLINE))
    missing = [heading for heading, _ in sections if heading not in SECTION_SLUGS]
    if missing:
        raise SystemExit(f"Missing output slug mapping for sections: {missing}")
    if len(zh_raw_sections) != len(sections):
        raise SystemExit(
            f"Chinese outline section count mismatch: {len(zh_raw_sections)} != {len(sections)}"
        )
    zh_sections = [
        (heading, zh_body)
        for (heading, _), (_, zh_body) in zip(sections, zh_raw_sections)
    ]

    write_single_file(title_block, sections)
    write_mdbook(title_block, sections)
    write_map(sections)
    write_zh_single_file(zh_title_block, zh_sections)
    write_zh_mdbook(zh_title_block, zh_sections)
    write_zh_map(sections)


if __name__ == "__main__":
    main()
