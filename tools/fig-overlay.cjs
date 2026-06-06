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
