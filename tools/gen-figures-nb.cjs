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
};

async function genOne(id) {
  const f = FIGS[id]; if (!f) { console.error("未知 id:", id); return; }
  const prompt = `${STYLE}\n\nFIGURE: ${f.scene}\n\nComposition: ${f.ar}, 2K, single cohesive textbook figure on pure white.`;
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
