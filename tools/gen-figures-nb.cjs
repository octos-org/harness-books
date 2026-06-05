// 驾驭工程 配图 · Nano Banana Pro (gemini-3-pro-image-preview) · 白底 wireframe 教科书风 · 带标注 · 2K
// 用法： GEMINI_API_KEY=<key> NODE_PATH=~/home/cc-ppt/node_modules node tools/gen-figures-nb.cjs [id ...]
// 密钥只从环境读取，绝不写入文件。
const { GoogleGenAI } = require("@google/genai");
const fs = require("fs");
const path = require("path");

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error("缺少 GEMINI_API_KEY（请内联传入，勿写入文件）"); process.exit(1); }
const ai = new GoogleGenAI({ apiKey: API_KEY });
const MODEL = "gemini-3-pro-image-preview";
const TEST = process.env.FIG_OUT === "img"
  ? path.join(__dirname, "..", "synced-book-zh", "src", "img")
  : path.join(__dirname, "..", "figures-nb-test");
fs.mkdirSync(TEST, { recursive: true });

const STYLE = `A clean technical diagram in the style of a TEXTBOOK FIGURE / engineering illustration, drawn as WIREFRAME line art. PURE WHITE background (#ffffff). Thin precise BLACK outlines, lines, arrows and curves only, like a crisp vector schematic. Minimal and uncluttered, generous white space, NOT dense, calm and restrained. At most ONE muted slate-blue accent used sparingly. Flat 2D only: no shading, no gradients, no 3D, no glow, no photorealism, no texture. The figure MUST include clearly legible, neatly typeset LABELS exactly as specified below — clean sans-serif text, correctly spelled, not decorative. Publication-ready, like a figure in a well-made engineering textbook.`;

// 概念可视化风格（聚光灯 / 照射点那类，深色质感 + 加标注）
const CONCEPT = `A striking CONCEPTUAL editorial illustration for a serious engineering book, on a deep near-black ink-navy background. Luminous cyan-teal glowing line art as the primary element, with a single warm-amber highlight reserved for the one focal "signal of truth". Atmospheric, elegant, generous negative space, very high craft — like a refined data-art / generative-systems visualization, NOT a plain schematic, NOT busy. Include a few small, clean, legible Chinese sans-serif TEXT LABELS exactly as specified, placed tastefully and correctly spelled. No clutter, no neon rainbow.`;

// Nature / Science 杂志级 专业科学概念图
const NATURE = `A professional scientific concept illustration in the style of a NATURE / SCIENCE journal feature figure. Sophisticated, polished, publication-grade editorial science visualization. A refined, restrained palette — deep teal and slate with a single warm-amber accent — on a deep, subtly graded near-black background. Elegant glowing vector line-work and luminous nodes, tasteful depth and soft glow, rigorous information design, clear visual hierarchy, generous negative space. Include clean, legible, correctly-spelled Chinese sans-serif LABELS exactly as specified, set like real figure annotations. Extremely high craft, calm and authoritative, NOT cartoonish, NOT cluttered, NOT neon.`;

const FIGS = {
  "wf-softmax-dilution": { ar: "4:3",
    scene: `A 2D line chart. Horizontal axis labeled "窗口 token 数 n". Vertical axis labeled "最大注意力权重 w_max". A single smooth black curve decays from high-left toward the axis on the right (inverse decay). Three open circles on the curve, labeled "0.69"、"0.17"、"0.02" from left to right, each with a dashed guide line to the x-axis tick "10"、"100"、"1000". The lowest point is the blue accent. Clean textbook chart.` },
  "wf-attention-mixing": { ar: "4:3",
    scene: `A wireframe diagram of attention as weighted mixing. Left: a box labeled "query"。Middle: four small circles in a column labeled "key" with values; thin lines from query to each key with DIFFERENT thickness, the thickest line labeled "权重 w". Right: a box labeled "加权输出". The lines converge into the output box. Small title text at top: "注意力 = 软查找 + 按权重混合". Blue accent on the output box.` },
  "wf-nonuniform-window": { ar: "16:9",
    scene: `A long horizontal band labeled "上下文窗口", divided into cells: cells small/fine on the RIGHT end (labeled "近端：高分辨率"), growing larger/coarser toward the LEFT (labeled "远端：被压缩"), fading to a dashed outline at far left. A small blue triangle marker at the right end labeled "光标". Textbook line art.` },
  "wf-capacity-window": { ar: "4:3",
    scene: `A 2D line chart. X-axis labeled "上下文长度". A black curve rises to a rounded plateau then falls (a hump). The plateau region is shaded light blue and labeled "有效工作区间". A tall vertical DASHED line near the far right, to the right of the fallen curve, labeled "容量上限". A small note: "容量上限 ≠ 有效工作区间". Clean textbook chart.` },
  "wf-error-compounding": { ar: "4:3",
    scene: `A 2D line chart. X-axis labeled "任务步数 T". Y-axis labeled "全程正确率 (1-ε)^T". A black curve descends in a downward staircase / exponential decay from top-left to bottom-right. The lowest step is the blue dot. Clean textbook chart with axis labels.` },
  "wf-recall-ucurve": { ar: "4:3",
    scene: `A 2D line chart. X-axis labeled "信息所在深度". Y-axis labeled "命中率". A single smooth black U-shaped (bathtub) curve: high at both ends, low in the middle. Small open circles scattered along it. The middle low region labeled "中段最易被冷落". Clean textbook chart.` },
  "wf-feedback-loop": { ar: "16:9",
    scene: `A control-loop block diagram, left to right. A blue dot labeled "参考值(目标)" → a summing circle "Σ" → a box "控制器 (harness)" → a box "执行器 (工具)" → a node "环境". From the environment node a curved arrow loops back underneath to the Σ, passing through a box labeled "传感器 (验证器)"; the return arrow is labeled "误差". Clean textbook wireframe with all labels.` },
  "wf-factstream-fold": { ar: "16:9",
    scene: `A data-flow diagram. Left: a vertical stack of identical thin bars labeled "事实流 (append-only 事件)". Arrows into a blue funnel shape in the middle labeled "fold". From the funnel, three arrows to three boxes on the right labeled "UI"、"API"、"dashboard". Title: "同一条事实流 → 多个投影". Textbook line art.` },
  "wf-artifact-gating": { ar: "16:9",
    scene: `A flow diagram. Left: three small boxes with checkmarks labeled "required artifact"。Arrows right into a blue vertical bar labeled "gating 门禁". After the gate the path splits: upper arrow to a circle labeled "ready", lower arrow crossed out (✗) labeled "failed". Note: "全部就绪才放行". Clean textbook wireframe.` },
  "wf-context-economics": { ar: "16:9",
    scene: `A balance-scale (seesaw) comparison. Left pan: one large square filled with a fine dense grid, labeled "1×1M (稠密)". Right pan: five small sparse squares labeled "5×200K (分片)". The big dense block tips the balance down (heavier). Note under it: "attention 量级 ≈ 5×". Clean textbook line art with labels.` },
  "wf-closability-curve": { ar: "4:3",
    scene: `A 2D line chart. X-axis labeled "独立采样次数 k". Y-axis labeled "至少一次通过的概率". A black curve rises and saturates toward a horizontal dashed asymptote near the top labeled "1 (近乎必成)". The curve formula noted on the chart: "1-(1-p)^k". Small open circles along the rise. Clean textbook chart.` },

  // —— 概念可视化（聚光灯/照射点风格 + 标注）——
  "nat-feedback-loop": { ar: "16:9", style: NATURE,
    scene: `An elegant control-loop SYSTEM illustration. A luminous reference node on the LEFT labeled "参考值(目标)" sends a glowing signal rightward through a refined horizontal chain of two module blocks labeled "控制器 (harness)" and "执行器 (工具)" into a bright node labeled "环境". From the environment node, a graceful glowing arc loops back underneath, passing through a node labeled "传感器 (验证器)", returning to a summing junction at the input; the return path is labeled "误差". Sophisticated Nature-journal system schematic with soft glow and depth.` },
  "nat-recall-ucurve": { ar: "16:9", style: NATURE,
    scene: `A sophisticated scientific DATA figure: a smooth luminous U-shaped (bathtub) curve over a subtle coordinate grid, high and bright at both the far-left and far-right ends, dipping low through the middle. X-axis labeled "信息所在深度（近端→远端）", y-axis labeled "命中率". A scatter of refined glowing data points loosely follows the curve. The low middle region is softly highlighted and labeled "中段最易被冷落（lost in the middle）". Elegant Nature-journal data-visualization aesthetic.` },

  "cc-softmax-dilution": { ar: "16:9", style: CONCEPT,
    scene: `A bright glowing cyan focal point on the LEFT, labeled "注意力源", emits a single fixed bundle of fine glowing rays. UPPER region: the rays reach only a FEW nearby glowing nodes, each ray bright, thick and sharp — labeled "近端：注意力集中、检索锐利". LOWER region: the SAME fixed bundle must fan out across a VAST wide field of MANY faint dim nodes, so each individual ray becomes barely visible — labeled "远端：被摊薄、稀释到几乎看不见". One single faint warm-amber node far on the lower right glows weakly, labeled "真正目标(被淹没)". The clear subject: a fixed amount of attention spread ever thinner as the field of competing nodes grows.` },
};

async function genOne(id) {
  const f = FIGS[id]; if (!f) { console.error("未知 id:", id); return; }
  const prompt = `${f.style || STYLE}\n\nFIGURE: ${f.scene}\n\nComposition: ${f.ar}, 2K, single cohesive figure.`;
  for (let a = 1; a <= 3; a++) {
    try {
      const res = await ai.models.generateContent({
        model: MODEL,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { responseModalities: ["IMAGE", "TEXT"], imageConfig: { aspectRatio: f.ar, imageSize: "2K" } },
      });
      const img = (res.candidates?.[0]?.content?.parts || []).find(p => p.inlineData);
      if (img) {
        const buf = Buffer.from(img.inlineData.data, "base64");
        const out = path.join(TEST, `${id}.png`);
        fs.writeFileSync(out, buf);
        console.log(`✓ ${id} ${(buf.length/1024/1024).toFixed(2)}MB (${img.inlineData.mimeType})`);
        return;
      }
      console.log(`… ${id} 第${a}次无图 finishReason=${res.candidates?.[0]?.finishReason}`);
    } catch (e) { console.log(`… ${id} 第${a}次错: ${(e.message||e).toString().slice(0,140)}`); }
  }
  console.error(`✗ ${id} 失败`);
}
(async () => {
  const ids = process.argv.slice(2);
  const list = ids.length ? ids : Object.keys(FIGS);
  console.log(`nb-pro 2K → ${TEST}：`, list.join(", "));
  for (const id of list) await genOne(id);
})();
