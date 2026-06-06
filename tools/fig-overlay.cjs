// 图+文字叠加 生产线：nb 生成无字白底插画(构图受控) → sharp 叠 SVG 中文文字层(Manrope/Noto Sans SC)
// 用法： FIG_OUT=img GEMINI_API_KEY=<key> NODE_PATH=~/home/cc-ppt/node_modules node tools/fig-overlay.cjs [id ...]
const { GoogleGenAI } = require("@google/genai");
const sharp = require("sharp"); const fs = require("fs"); const path = require("path");
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const OUT = process.env.FIG_OUT === "img"
  ? path.join(__dirname, "..", "synced-book-zh", "src", "img")
  : path.join(__dirname, "..", "figures-overlay");
const ART = path.join(__dirname, "..", "figures-overlay", "_art"); // 无字原图(本地)
fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(ART, { recursive: true });

const STYLE = `A professional scientific data figure of Nature / Quanta magazine caliber, on a PURE WHITE background. Refined flat vector, thin deep-teal and slate axes/curves with a single warm amber/coral accent, subtle soft shadows, NO dark background, NO glow, NO neon. Generous white space, calm and rigorous. CRITICAL: render ABSOLUTELY NO text, no numbers, no axis labels, no words, no letters anywhere — pure shapes, axes, curves and dots only (text is added separately). Composition 16:9.`;

// 文字层：文本(中文 Noto Sans SC / 英文数字 Manrope)、可旋转、可引线
function svgLayer(W, H, labels) {
  const k = W / 1536;
  const el = labels.map(l => {
    const x = Math.round((l.xp ?? 0) * W), y = Math.round((l.yp ?? 0) * H);
    const fs2 = Math.round((l.size || 30) * k);
    const fam = `Manrope, 'Noto Sans SC', sans-serif`;
    let s = "";
    if (l.leader) { const lx = Math.round(l.leader.xp * W), ly = Math.round(l.leader.yp * H);
      s += `<line x1="${x}" y1="${y + 6}" x2="${lx}" y2="${ly}" stroke="${l.color || '#5a6b78'}" stroke-width="${Math.max(1, 1.5 * k)}" opacity="0.7"/>`; }
    const tr = l.rot ? ` transform="rotate(${l.rot} ${x} ${y})"` : "";
    s += `<text x="${x}" y="${y}" font-family="${fam}" font-weight="${l.weight || 600}" font-size="${fs2}" fill="${l.color || '#0f3a4a'}" text-anchor="${l.anchor || 'start'}"${tr}>${l.t}</text>`;
    return s;
  }).join("");
  return Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${el}</svg>`);
}

const FIGS = {
  "wf-capacity-window": {
    art: `${STYLE} SUBJECT: a 2D chart. A horizontal axis along the bottom (at ~88% height) and a vertical axis on the left (at ~12% width), thin black with small arrowheads. A smooth teal curve that rises from the lower-left to a rounded PLATEAU in the upper-middle then falls back down toward the axis on the right (a hump). The plateau region softly shaded pale blue. A tall vertical DASHED line near the far right (~85% width), standing to the RIGHT of where the curve has already fallen.`,
    labels: [
      { t: "上下文长度", xp: 0.5, yp: 0.96, anchor: "middle", size: 30 },
      { t: "可用性 / 命中率", xp: 0.04, yp: 0.5, anchor: "middle", size: 30, rot: -90 },
      { t: "有效工作区间", xp: 0.46, yp: 0.30, anchor: "middle", color: "#2a6f8a", size: 30 },
      { t: "容量上限", xp: 0.86, yp: 0.34, anchor: "middle", color: "#b5532a", size: 30 },
      { t: "容量上限 ≠ 有效工作区间", xp: 0.5, yp: 0.08, anchor: "middle", color: "#0f3a4a", size: 32, weight: 700 },
    ],
  },
  "wf-error-compounding": {
    art: `${STYLE} SUBJECT: a 2D chart with bottom horizontal axis and left vertical axis (thin black, arrowheads). A teal curve descending from top-left to bottom-right as a downward STAIRCASE following an exponential-decay envelope (several descending steps). The lowest, rightmost step ends in a small amber dot.`,
    labels: [
      { t: "任务步数 T", xp: 0.5, yp: 0.96, anchor: "middle", size: 30 },
      { t: "全程正确率 (1−ε)ᵀ", xp: 0.04, yp: 0.5, anchor: "middle", size: 30, rot: -90 },
      { t: "链越长，越难全程不出错", xp: 0.6, yp: 0.2, anchor: "middle", color: "#0f3a4a", size: 32, weight: 700 },
    ],
  },
  "wf-recall-ucurve": {
    art: `${STYLE} SUBJECT: a 2D chart with bottom and left axes (thin black, arrowheads). A single smooth teal U-shaped (bathtub) curve: high at the far-left and far-right ends, dipping low through the middle. A scatter of small teal dots loosely follows the curve. The low middle area softly shaded.`,
    labels: [
      { t: "信息所在深度（近端 → 远端）", xp: 0.5, yp: 0.96, anchor: "middle", size: 30 },
      { t: "命中率", xp: 0.04, yp: 0.5, anchor: "middle", size: 30, rot: -90 },
      { t: "中段最易被冷落", xp: 0.5, yp: 0.5, anchor: "middle", color: "#b5532a", size: 32, weight: 700, leader: { xp: 0.5, yp: 0.78 } },
    ],
  },
  "wf-closability-curve": {
    art: `${STYLE} SUBJECT: a 2D chart with bottom and left axes (thin black, arrowheads). A teal curve rising from the lower-left and bending to FLATTEN as it approaches a horizontal DASHED line near the top (saturating rise toward an upper bound). Small teal dots along the rising curve. The point where it nearly meets the dashed line ends in an amber dot.`,
    labels: [
      { t: "独立采样次数 k", xp: 0.5, yp: 0.96, anchor: "middle", size: 30 },
      { t: "至少一次通过的概率", xp: 0.04, yp: 0.5, anchor: "middle", size: 30, rot: -90 },
      { t: "1（近乎必成）", xp: 0.8, yp: 0.13, anchor: "middle", color: "#5a6b78", size: 28 },
      { t: "P = 1 − (1 − p)ᵏ", xp: 0.62, yp: 0.6, anchor: "middle", color: "#0f3a4a", size: 32, weight: 700 },
    ],
  },

  // ===== 批2：概念图 =====
  "wf-softmax-dilution": {
    style: true,
    art: `A professional scientific concept illustration of Nature/Quanta caliber on a PURE WHITE background. Refined flat vector, deep-teal lines with a single warm coral accent, subtle soft shadows, NO dark background, NO glow. SUBJECT: one teal source node at LEFT-CENTER (~12% width, 50% height) emits a fixed bundle of fine rays. The rays split: UPPER-RIGHT a tight cluster of a FEW bright teal nodes (~68% width, 22% height) with dense sharp lines; and LOWER-RIGHT a VAST field of MANY faint pale dots (spread across 35–95% width, 60–95% height) with thin faint lines. One small coral node sits ALONE at the far lower-right (~80% width, 82% height). Generous white space. ABSOLUTELY NO text, letters, numbers or labels anywhere. 16:9.`,
    labels: [
      { t: "注意力源", xp: 0.10, yp: 0.44, anchor: "middle", size: 30 },
      { t: "近端：注意力集中、检索锐利", xp: 0.50, yp: 0.12, anchor: "start", size: 30 },
      { t: "远端：被摊薄、稀释到几乎看不见", xp: 0.34, yp: 0.78, anchor: "start", color: "#5a6b78", size: 30 },
      { t: "真正目标（被淹没）", xp: 0.80, yp: 0.90, anchor: "middle", color: "#b5532a", size: 30, weight: 700 },
    ],
  },
  "wf-attention-mixing": {
    style: true,
    art: `Nature/Quanta caliber scientific diagram on PURE WHITE. Refined flat vector, deep-teal with one coral accent, NO dark background, NO glow. SUBJECT: on the LEFT (~15% width, 50% height) one rounded square node. From it, thin lines fan to FOUR small circle nodes stacked in a vertical column at the CENTER (~48% width, between 25% and 75% height); the four lines have clearly DIFFERENT thickness (one much thicker). The four circles then send lines that converge into ONE rounded square node on the RIGHT (~82% width, 50% height), drawn in coral. Airy, generous white space. ABSOLUTELY NO text, letters, numbers, labels. 16:9.`,
    labels: [
      { t: "查询向量", xp: 0.15, yp: 0.70, anchor: "middle", size: 28 },
      { t: "键向量（多个）", xp: 0.48, yp: 0.96, anchor: "middle", size: 28 },
      { t: "权重（连线越粗越大）", xp: 0.20, yp: 0.24, anchor: "start", color: "#2a6f8a", size: 28 },
      { t: "加权输出", xp: 0.82, yp: 0.70, anchor: "middle", color: "#b5532a", size: 28, weight: 700 },
      { t: "注意力：软查找后按权重混合", xp: 0.5, yp: 0.06, anchor: "middle", size: 32, weight: 700 },
    ],
  },
  "wf-nonuniform-window": {
    style: true,
    art: `Nature/Quanta caliber scientific diagram on PURE WHITE. Refined flat vector, deep-teal with one coral accent, NO dark background, NO glow. SUBJECT: one long horizontal rectangular band spanning the middle (from 8% to 92% width, centered vertically). The band is divided into cells: at the RIGHT end small, many, sharp fine cells (high resolution); moving LEFT the cells progressively grow larger, fewer and coarser; the far-LEFT portion dissolves into a faint dashed outline. A small coral triangle marker sits just outside the RIGHT end. Generous white space above and below. ABSOLUTELY NO text, letters, numbers, labels. 16:9.`,
    labels: [
      { t: "上下文窗口", xp: 0.5, yp: 0.16, anchor: "middle", size: 32, weight: 700 },
      { t: "近端 · 高分辨率", xp: 0.82, yp: 0.80, anchor: "middle", color: "#2a6f8a", size: 28 },
      { t: "远端 · 被压缩成轮廓", xp: 0.20, yp: 0.80, anchor: "middle", color: "#5a6b78", size: 28 },
      { t: "光标", xp: 0.95, yp: 0.40, anchor: "middle", color: "#b5532a", size: 26 },
    ],
  },
  "wf-context-economics": {
    style: true,
    art: `Nature/Quanta caliber scientific diagram on PURE WHITE. Refined flat vector, deep-teal with one coral accent, NO dark background, NO glow. SUBJECT: a balance scale / seesaw with a central triangular fulcrum at the bottom-center. The LEFT pan (tipped DOWN, heavy) holds ONE large square filled with a very fine dense grid. The RIGHT pan (tipped UP, light) holds FIVE small separate squares in a row, each with only a few sparse cells. A small down-arrow over the left, a small up-arrow over the right. Generous white space. ABSOLUTELY NO text, letters, numbers, labels. 16:9.`,
    labels: [
      { t: "单条 100万（稠密）", xp: 0.22, yp: 0.86, anchor: "middle", size: 30, weight: 700 },
      { t: "五段 20万（分片）", xp: 0.76, yp: 0.62, anchor: "middle", size: 30, weight: 700 },
      { t: "注意力量级 ≈ 5×", xp: 0.5, yp: 0.96, anchor: "middle", color: "#b5532a", size: 30 },
    ],
  },

  // ===== 批3：概念图（续）=====
  "wf-residual-stream": {
    style: true,
    art: `Nature/Quanta caliber scientific diagram on PURE WHITE. Refined flat vector, deep-teal with one coral accent, NO dark background, NO glow. SUBJECT: one horizontal lane (a flat rounded bar of CONSTANT height) running left-to-right across the middle, passing THROUGH four identical thin-outlined square layer-blocks evenly spaced at about 22%, 42%, 62% and 82% width. At each block a small coral "+" increment merges onto the lane. The lane's height never changes from left to right. Generous white space. ABSOLUTELY NO text, letters, numbers, labels. 16:9.`,
    labels: [
      { t: "定宽工作记忆（宽度始终固定）", xp: 0.5, yp: 0.18, anchor: "middle", size: 30, weight: 700 },
      { t: "第 1 层", xp: 0.22, yp: 0.74, anchor: "middle", size: 26, color: "#5a6b78" },
      { t: "第 2 层", xp: 0.42, yp: 0.74, anchor: "middle", size: 26, color: "#5a6b78" },
      { t: "第 3 层", xp: 0.62, yp: 0.74, anchor: "middle", size: 26, color: "#5a6b78" },
      { t: "第 N 层", xp: 0.82, yp: 0.74, anchor: "middle", size: 26, color: "#5a6b78" },
      { t: "每层只叠加一点贡献", xp: 0.5, yp: 0.90, anchor: "middle", size: 28, color: "#b5532a" },
    ],
  },
  "wf-kv-cache": {
    style: true,
    art: `Nature/Quanta caliber scientific diagram on PURE WHITE. Refined flat vector, deep-teal with one coral accent, NO dark background, NO glow. SUBJECT: on the LEFT and center, a long rounded rectangle CONTAINER spanning ~10% to ~70% width (vertically centered) that holds a horizontal row of SIX small identical node cells inside it. On the RIGHT (~84% width, 50% height) one coral node. From the coral node, several thin lines reach back leftward to each of the six cached cells inside the container. Generous white space. ABSOLUTELY NO text, letters, numbers, labels. 16:9.`,
    labels: [
      { t: "键值缓存（对过去的唯一留存）", xp: 0.40, yp: 0.22, anchor: "middle", size: 30, weight: 700 },
      { t: "已算好的「键、值」", xp: 0.40, yp: 0.78, anchor: "middle", size: 28, color: "#5a6b78" },
      { t: "新词元", xp: 0.84, yp: 0.70, anchor: "middle", size: 28, color: "#b5532a", weight: 700 },
      { t: "随上下文线性增长", xp: 0.40, yp: 0.90, anchor: "middle", size: 26, color: "#5a6b78" },
    ],
  },
  "wf-autoregressive": {
    style: true,
    art: `Nature/Quanta caliber scientific diagram on PURE WHITE. Refined flat vector, deep-teal with one coral accent, NO dark background, NO glow. SUBJECT: a rounded rectangle block at center-left (~30% width, 42% height). An arrow exits its right side to a node on the RIGHT (~78% width, 42% height). From that right node, a graceful curved arrow loops DOWN and back LEFT to re-enter the left side of the block (a feedback loop), the curved return path drawn in coral. Generous white space. ABSOLUTELY NO text, letters, numbers, labels. 16:9.`,
    labels: [
      { t: "模型", xp: 0.30, yp: 0.44, anchor: "middle", size: 30, weight: 700 },
      { t: "输出词元", xp: 0.78, yp: 0.34, anchor: "middle", size: 28 },
      { t: "回灌为下一步输入", xp: 0.5, yp: 0.82, anchor: "middle", size: 28, color: "#b5532a" },
      { t: "把自己的输出当成既成事实", xp: 0.5, yp: 0.12, anchor: "middle", size: 28, color: "#5a6b78" },
    ],
  },
  "wf-five-layer-failure": {
    style: true,
    art: `Nature/Quanta caliber scientific concept illustration on PURE WHITE. Refined flat vector, deep-teal slabs with one coral accent, NO dark background, NO glow. SUBJECT: FIVE thin horizontal slab panels stacked with gaps between them, centered, at about 78%, 64%, 50%, 36% and 22% height (bottom to top). A jagged CORAL crack runs vertically upward through a small gap in each slab, the gaps roughly aligned. At the very TOP (~12% height) the crack ends in a small rounded speech-bubble outline. Generous white space on the left for labels. ABSOLUTELY NO text, letters, numbers, labels. 16:9.`,
    labels: [
      { t: "会话层", xp: 0.15, yp: 0.88, anchor: "middle", size: 26 },
      { t: "能力平面", xp: 0.15, yp: 0.72, anchor: "middle", size: 26 },
      { t: "验证器", xp: 0.15, yp: 0.58, anchor: "middle", size: 26 },
      { t: "仪表盘", xp: 0.15, yp: 0.46, anchor: "middle", size: 26 },
      { t: "群体编排", xp: 0.15, yp: 0.30, anchor: "middle", size: 26 },
      { t: "用户面前的「假成功」", xp: 0.62, yp: 0.10, anchor: "middle", size: 28, color: "#b5532a", weight: 700 },
    ],
  },

  // ===== 批4：流程图 =====
  "wf-feedback-loop": {
    style: true,
    art: `Nature/Quanta caliber scientific diagram on PURE WHITE. Refined flat vector, deep-teal with one coral accent, NO dark background, NO glow. SUBJECT: a horizontal control loop. A small teal filled dot at (~10% width, 42% height); a small empty circle (summing junction) at (~22% width, 42% height); then TWO identical empty rounded-rectangle blocks centered at (~40% width, 42% height) and (~58% width, 42% height); then a larger empty circle node at (~80% width, 42% height). From that right node a smooth CORAL curved arrow loops DOWN and back LEFT, passing through a small empty circle at (~50% width, 72% height), and returns to the summing junction. Thin arrows connect left-to-right along the top row. The two rectangle blocks are EMPTY (no icons). Generous white space. ABSOLUTELY NO text, letters, numbers, labels. 16:9.`,
    labels: [
      { t: "参考值（目标）", xp: 0.10, yp: 0.30, anchor: "middle", size: 26 },
      { t: "控制器（驾驭层）", xp: 0.40, yp: 0.50, anchor: "middle", size: 26 },
      { t: "执行器（工具）", xp: 0.61, yp: 0.50, anchor: "middle", size: 26 },
      { t: "环境", xp: 0.80, yp: 0.29, anchor: "middle", size: 26 },
      { t: "传感器（验证器）", xp: 0.50, yp: 0.88, anchor: "middle", size: 26 },
      { t: "误差", xp: 0.29, yp: 0.66, anchor: "middle", size: 26, color: "#b5532a" },
    ],
  },
  "wf-three-layer-stack": {
    style: true,
    art: `Nature/Quanta caliber scientific diagram on PURE WHITE. Refined flat vector, deep-teal with one coral accent, NO dark background, NO glow. SUBJECT: THREE identical wide horizontal rounded-rectangle slab layers stacked vertically, each spanning ~22% to ~72% width, centered at ~30% (top), ~50% (middle) and ~70% (bottom) height, with a small gap between them. The TOP slab is outlined in CORAL; the other two in teal. On the far RIGHT a thin vertical bracket spans all three slabs. The slabs are EMPTY. Generous white space. ABSOLUTELY NO text, letters, numbers, labels. 16:9.`,
    labels: [
      { t: "驾驭工程：确定性控制循环", xp: 0.47, yp: 0.31, anchor: "middle", size: 26, color: "#b5532a", weight: 700 },
      { t: "上下文工程：稳住多轮", xp: 0.47, yp: 0.51, anchor: "middle", size: 26 },
      { t: "提示词工程：稳住单轮", xp: 0.47, yp: 0.71, anchor: "middle", size: 26 },
      { t: "能力递进，逐层叠加而非替代", xp: 0.86, yp: 0.5, anchor: "middle", size: 24, color: "#5a6b78", rot: -90 },
    ],
  },
  "wf-governance-lenses": {
    style: true,
    art: `Nature/Quanta caliber scientific diagram on PURE WHITE. Refined flat vector, deep-teal with one coral accent, NO dark background, NO glow. SUBJECT: one central horizontal "stream" lane (a long thin pill-shaped track with small branching nodes inside it) at ~64% height, spanning 10% to 90% width. ABOVE it, FOUR identical lens / ring shapes at x ≈ 22%, 42%, 58%, 78% (y ≈ 32%), each casting a soft light cone downward onto the stream. The lenses are EMPTY rings. Generous white space. ABSOLUTELY NO text, letters, numbers, labels. 16:9.`,
    labels: [
      { t: "安全", xp: 0.25, yp: 0.24, anchor: "middle", size: 26, weight: 700 },
      { t: "合规", xp: 0.42, yp: 0.24, anchor: "middle", size: 26, weight: 700 },
      { t: "成本", xp: 0.57, yp: 0.24, anchor: "middle", size: 26, weight: 700 },
      { t: "路由", xp: 0.74, yp: 0.24, anchor: "middle", size: 26, weight: 700 },
      { t: "同一条事实流", xp: 0.5, yp: 0.78, anchor: "middle", size: 26, color: "#5a6b78" },
      { t: "治理不是第五层，是同一条事实流被多读四遍", xp: 0.5, yp: 0.93, anchor: "middle", size: 28, weight: 700 },
    ],
  },
  "wf-artifact-gating": {
    style: true,
    art: `Nature/Quanta caliber scientific diagram on PURE WHITE. Refined flat vector, deep-teal with one coral accent, NO dark background, NO glow. SUBJECT: on the LEFT, THREE small empty squares each containing a small check-mark, stacked vertically at x ≈ 18% (y ≈ 30%, 50%, 70%). Thin arrows go RIGHT from each to a single vertical CORAL bar (a gate) at x ≈ 52% (spanning the middle height). After the gate the path splits: an UPPER thin arrow to a small empty circle at (~80% width, 35% height); a LOWER thin arrow that is crossed by a short perpendicular stroke (✗) ending near (~80% width, 68% height). Generous white space. ABSOLUTELY NO text, letters, numbers, labels. 16:9.`,
    labels: [
      { t: "必需产物", xp: 0.18, yp: 0.86, anchor: "middle", size: 26 },
      { t: "门禁", xp: 0.52, yp: 0.16, anchor: "middle", size: 26, color: "#b5532a", weight: 700 },
      { t: "就绪", xp: 0.82, yp: 0.35, anchor: "middle", size: 26 },
      { t: "失败", xp: 0.82, yp: 0.68, anchor: "middle", size: 26, color: "#b5532a" },
      { t: "全部就绪才放行", xp: 0.5, yp: 0.93, anchor: "middle", size: 26 },
    ],
  },

  // ===== 批5：流程图（续，最复杂）=====
  "wf-factstream-fold": {
    style: true,
    art: `Nature/Quanta caliber scientific diagram on PURE WHITE. Refined flat vector, deep-teal with one coral accent, NO dark background, NO glow. SUBJECT: on the LEFT, a vertical stack of FIVE identical thin horizontal bars at x ≈ 14% (evenly between y 32% and 68%). Thin arrows go RIGHT from the stack converging into a CORAL funnel / triangle shape pointing right at the CENTER (~50% width, 50% height). From the funnel tip, THREE thin arrows fan out to THREE small empty rounded-rectangles on the RIGHT at x ≈ 86% (y ≈ 34%, 50%, 66%). Generous white space. ABSOLUTELY NO text, letters, numbers, labels. 16:9.`,
    labels: [
      { t: "同一条事实流 → 多个投影", xp: 0.5, yp: 0.10, anchor: "middle", size: 30, weight: 700 },
      { t: "事实流（只追加事件）", xp: 0.14, yp: 0.80, anchor: "middle", size: 26 },
      { t: "折叠", xp: 0.50, yp: 0.82, anchor: "middle", size: 26, color: "#b5532a", weight: 700 },
      { t: "界面", xp: 0.84, yp: 0.33, anchor: "middle", size: 24 },
      { t: "接口", xp: 0.84, yp: 0.52, anchor: "middle", size: 24 },
      { t: "仪表盘", xp: 0.84, yp: 0.71, anchor: "middle", size: 24 },
    ],
  },
  "wf-lifecycle": {
    style: true,
    art: `Nature/Quanta caliber scientific diagram on PURE WHITE. Refined flat vector, deep-teal with one coral accent, NO dark background, NO glow. SUBJECT: a state machine. THREE empty circles in a row at (15% width,50% height), (35%,50%), (55%,50%), connected left-to-right by thin arrows. From the third circle, TWO arrows split to a circle at (80%,30%) and a circle at (80%,72%). The arrow to the upper circle is CORAL. A long thin curved arrow runs along the BOTTOM from the right side back to the first circle (a return loop). All circles are EMPTY. Generous white space. ABSOLUTELY NO text, letters, numbers, labels. 16:9.`,
    labels: [
      { t: "排队", xp: 0.15, yp: 0.50, anchor: "middle", size: 24 },
      { t: "运行中", xp: 0.35, yp: 0.50, anchor: "middle", size: 24 },
      { t: "验证中", xp: 0.62, yp: 0.50, anchor: "middle", size: 24 },
      { t: "就绪", xp: 0.85, yp: 0.24, anchor: "middle", size: 24 },
      { t: "失败", xp: 0.85, yp: 0.66, anchor: "middle", size: 24 },
      { t: "需所有验证器通过", xp: 0.69, yp: 0.34, anchor: "middle", size: 22, color: "#b5532a" },
      { t: "续跑", xp: 0.45, yp: 0.90, anchor: "middle", size: 22, color: "#5a6b78" },
      { t: "模型只能推进到「验证中」，无权宣布「就绪」", xp: 0.5, yp: 0.07, anchor: "middle", size: 26, weight: 700 },
    ],
  },
  "wf-runtime-overview": {
    style: true,
    art: `Nature/Quanta caliber scientific diagram on PURE WHITE. Refined flat vector, deep-teal with one coral accent, NO dark background, NO glow. SUBJECT: a vertical central spine — a thick CORAL vertical line running from a node at the TOP-CENTER (~50% width, 12% height) straight down to a node at the BOTTOM-CENTER (~50% width, 88% height). FOUR empty rounded-rectangle module boxes branch off the spine with thin connectors: left-upper at (24% width, 38% height), right-upper at (76%, 38%), left-lower at (24%, 62%), right-lower at (76%, 62%). Generous white space. ABSOLUTELY NO text, letters, numbers, labels. 16:9.`,
    labels: [
      { t: "用户任务 / 外部触发", xp: 0.5, yp: 0.07, anchor: "middle", size: 26, weight: 700 },
      { t: "会话事实流", xp: 0.56, yp: 0.50, anchor: "start", size: 26, color: "#b5532a", weight: 700 },
      { t: "调度循环", xp: 0.24, yp: 0.38, anchor: "middle", size: 24 },
      { t: "能力平面", xp: 0.76, yp: 0.38, anchor: "middle", size: 24 },
      { t: "产物与验证", xp: 0.24, yp: 0.62, anchor: "middle", size: 24 },
      { t: "回放与摘要", xp: 0.76, yp: 0.62, anchor: "middle", size: 24 },
      { t: "终态裁决（就绪 / 失败）", xp: 0.5, yp: 0.95, anchor: "middle", size: 26, weight: 700 },
    ],
  },
  "wf-swarm-roles": {
    style: true,
    art: `Nature/Quanta caliber scientific diagram on PURE WHITE. Refined flat vector, deep-teal with one coral accent, NO dark background, NO glow. SUBJECT: THREE vertical lanes separated by thin light vertical divider lines, centered at x ≈ 22%, 50%, 78%. Each lane has a vertical sequence of small empty nodes connected top-to-bottom. A few thin horizontal dashed arrows cross between lanes. In the LEFT lane (~22% width, ~50% height) one node is filled CORAL (emphasized). Generous white space at the top of each lane for a header. ABSOLUTELY NO text, letters, numbers, labels. 16:9.`,
    labels: [
      { t: "协调者", xp: 0.22, yp: 0.10, anchor: "middle", size: 28, weight: 700 },
      { t: "工作者", xp: 0.50, yp: 0.10, anchor: "middle", size: 28, weight: 700 },
      { t: "验证者", xp: 0.78, yp: 0.10, anchor: "middle", size: 28, weight: 700 },
      { t: "唯有协调者能写「终态」", xp: 0.22, yp: 0.62, anchor: "middle", size: 22, color: "#b5532a" },
      { t: "只写「子任务汇报」", xp: 0.50, yp: 0.90, anchor: "middle", size: 22, color: "#5a6b78" },
      { t: "只写「验证结果」", xp: 0.78, yp: 0.90, anchor: "middle", size: 22, color: "#5a6b78" },
    ],
  },
};

async function genArt(id, prompt) {
  const cached = path.join(ART, `${id}.png`);
  if (process.env.REUSE_ART && fs.existsSync(cached)) return fs.readFileSync(cached);
  for (let a = 1; a <= 3; a++) {
    try {
      const res = await ai.models.generateContent({ model: "gemini-3-pro-image-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { responseModalities: ["IMAGE", "TEXT"], imageConfig: { aspectRatio: "16:9", imageSize: "2K" } } });
      const img = (res.candidates?.[0]?.content?.parts || []).find(p => p.inlineData);
      if (img) { const b = Buffer.from(img.inlineData.data, "base64"); fs.writeFileSync(cached, b); return b; }
    } catch (e) { console.log(`  ${id} art #${a} err ${(e.message||e).toString().slice(0,100)}`); }
  }
  return null;
}
async function build(id) {
  const f = FIGS[id]; if (!f) { console.error("未知", id); return; }
  const base = await genArt(id, f.art); if (!base) { console.error("✗ art", id); return; }
  const m = await sharp(base).metadata();
  const out = path.join(OUT, `${id}.jpg`);
  const layer = await sharp(svgLayer(m.width, m.height, f.labels))
    .resize(m.width, m.height, { fit: "fill" }).png().toBuffer();
  // 注意：sharp 流水线把 resize 排在 composite 之前，故必须先 composite 成 buffer，再单独 resize
  const composed = await sharp(base).composite([{ input: layer, top: 0, left: 0 }]).png().toBuffer();
  await sharp(composed).resize({ width: 1600, withoutEnlargement: true })
    .jpeg({ quality: 92, mozjpeg: true }).toFile(out);
  console.log(`✓ ${id}.jpg (art ${m.width}x${m.height})`);
}
(async () => { const ids = process.argv.slice(2); const list = ids.length ? ids : Object.keys(FIGS);
  console.log(`overlay → ${OUT}:`, list.join(", "));
  for (const id of list) await build(id); })();
