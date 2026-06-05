// 驾驭工程 配图 · OpenAI ChatGPT Image（gpt-image-1）· 白底/透明 wireframe 教科书风
// 用法： OPENAI_API_KEY=<key> node tools/gen-figures-openai.cjs [id ...]
// 密钥只从环境读取，绝不写入文件。Node 内置 fetch，免装 SDK。
const fs = require("fs");
const path = require("path");

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) { console.error("缺少 OPENAI_API_KEY（请内联传入，勿写入文件）"); process.exit(1); }
const MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
const SAMPLES = path.join(__dirname, "..", "synced-book-zh", "src", "img");  // 正式提交目录
fs.mkdirSync(SAMPLES, { recursive: true });

const STYLE = `A clean technical line diagram in the style of a textbook figure / engineering schematic. PURE WHITE background. Thin, precise BLACK line art only, like a crisp vector wireframe drawing. Minimal and uncluttered, generous white space, calm and restrained, plenty of breathing room — NOT busy, NOT dense. At most ONE restrained accent color, a muted slate blue, used very sparingly for a single emphasized element. Flat 2D only: no shading, no gradients, no 3D, no glow, no photorealism, no texture, no noise. Publication-ready, like a figure in a well-designed engineering textbook. NO text, no words, no letters, no labels, no numbers anywhere — convey everything with pure geometric line shapes, arrows and curves.`;

const FIGS = {
  "wf-softmax-dilution": { size: "1536x1024",
    scene: `SUBJECT: a clean 2D line chart. A horizontal axis and a vertical axis drawn as thin black lines with small arrowheads. A single smooth black curve starts high on the left and decays toward the horizontal axis on the right, approaching it asymptotically (an inverse-decay shape). Three small open circles sit on the curve marking three points along it, each dropping a thin dashed guide line down to the horizontal axis. The single muted-blue accent marks the lowest point near the right. Lots of empty white space around the chart.` },
  "wf-feedback-loop": { size: "1536x1024",
    scene: `SUBJECT: a horizontal feedback control loop drawn as a wireframe block diagram. From left to right: a small circle (summing junction), then three identical thin-outlined rectangular blocks connected by a straight horizontal arrow line, ending in a small node on the right. From that right node, a smooth curved arrow loops back underneath all the way to the summing junction on the left, forming a closed feedback path. One single muted-blue small filled dot marks the entry point at the far left (the reference). Clean, lots of white space, thin black strokes only.` },
  "wf-attention-mixing": { size: "1536x1024",
    scene: `SUBJECT: a wireframe diagram of weighted mixing. On the left, one small open square (a query) with thin straight lines fanning out to four small open circles arranged vertically in the middle (keys). Each of the four lines has a different thickness, suggesting different weights. The four circles then converge with thin lines into a single open square on the right (the mixed output). The thickest connecting line and the output square are the single muted-blue accent. Pure black line art on white, airy and minimal.` },

  // —— 第2章 ——
  "wf-nonuniform-window": { size: "1536x1024",
    scene: `SUBJECT: one long horizontal rectangular band representing a context window, divided into cells. At the right end the cells are small, many and sharp (high resolution); moving left the cells progressively grow larger, fewer and coarser, and the far-left portion fades to a faint dashed outline. A small muted-blue triangular marker sits just outside the right end (the cursor). Thin black line art on white, lots of surrounding white space, calm.` },
  "wf-capacity-window": { size: "1536x1024",
    scene: `SUBJECT: a clean 2D line chart. Thin black horizontal and vertical axes with small arrowheads. A single black curve rises from the left to a rounded plateau, then bends and falls back down toward the axis on the right (a hump shape). A tall vertical DASHED line stands near the far right edge, clearly to the RIGHT of where the curve has already fallen — marking a nominal limit the usable region never reaches. The rounded plateau region is lightly emphasized with the single muted-blue accent. Airy, minimal, no text.` },
  "wf-error-compounding": { size: "1536x1024",
    scene: `SUBJECT: a clean 2D line chart with thin black axes and arrowheads. A black curve starts high near the top-left and decays in a downward staircase toward the bottom-right — drawn as a series of small descending steps following an exponential-decay envelope, so each step sits lower than the last. The last, lowest step is marked with the single muted-blue dot. Generous white space, minimal, no text.` },
  "wf-recall-ucurve": { size: "1536x1024",
    scene: `SUBJECT: a clean 2D line chart. Thin black axes with arrowheads. A single smooth black curve shaped like a wide shallow valley (a U / bathtub): high at the far left, dipping low through the middle, rising again at the far right. A scatter of small open circles loosely follows the curve. The lowest middle point carries the single muted-blue dot. Lots of white space, calm textbook style, no text.` },

  // —— 第6/8章 ——
  "wf-factstream-fold": { size: "1536x1024",
    scene: `SUBJECT: a wireframe data-flow diagram. On the left, a vertical stack of about six identical thin horizontal bars (an append-only event log). Thin arrows lead right from the stack into a single funnel / lens shape in the center (a fold). From the funnel, three separate thin arrows fan out to the right into three small open rectangles arranged vertically (three projections). The funnel is the single muted-blue accent. Pure black lines on white, minimal and airy.` },
  "wf-artifact-gating": { size: "1536x1024",
    scene: `SUBJECT: a wireframe flow diagram. On the left, a short vertical list of two or three small open rectangles (required artifacts), each with a tiny check-mark glyph beside it. Thin arrows flow right toward a single vertical bar standing as a gate in the middle (muted-blue accent). After the gate the path splits into two diverging thin arrows: the upper arrow reaches a small open circle (pass), the lower arrow is crossed by a short perpendicular stroke (blocked). Clean black line art on white, lots of space, no text.` },

  // —— 第10/13章 ——
  "wf-context-economics": { size: "1536x1024",
    scene: `SUBJECT: a wireframe mass-comparison. On the LEFT, one large square completely filled with a very fine dense grid of tiny cells (visually heavy), its outline the single muted-blue accent. On the RIGHT, five small separate squares in a neat row, each containing only a few sparse cells (visually light). A clear contrast between the one big dense block and the five small sparse blocks. Thin black line art on white, balanced negative space, no text.` },
  "wf-closability-curve": { size: "1536x1024",
    scene: `SUBJECT: a clean 2D line chart. Thin black axes with arrowheads. A single black curve rises from the lower-left and bends to flatten as it approaches a horizontal dashed asymptote line near the top (a saturating rise toward an upper bound). Small open circles mark a few points along the rising curve. The point where the curve nearly meets the asymptote carries the single muted-blue dot. Airy, minimal, textbook style, no text.` },
};

async function genOne(id) {
  const f = FIGS[id];
  if (!f) { console.error("未知 id:", id); return; }
  const prompt = `${STYLE}\n\n${f.scene}`;
  const body = { model: MODEL, prompt, size: f.size, quality: "high", n: 1,
                 background: "transparent", output_format: "png" };
  try {
    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Authorization": `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    if (!r.ok) { console.error(`✗ ${id} HTTP ${r.status}: ${JSON.stringify(j).slice(0,200)}`); return; }
    const b64 = j.data?.[0]?.b64_json;
    if (!b64) { console.error(`✗ ${id} 无图: ${JSON.stringify(j).slice(0,200)}`); return; }
    const buf = Buffer.from(b64, "base64");
    const out = path.join(SAMPLES, `${id}.png`);
    fs.writeFileSync(out, buf);
    console.log(`✓ ${id}.png  ${(buf.length/1024).toFixed(0)}KB`);
  } catch (e) { console.error(`✗ ${id} 出错: ${(e.message||e).toString().slice(0,160)}`); }
}

(async () => {
  const ids = process.argv.slice(2);
  const list = ids.length ? ids : Object.keys(FIGS);
  console.log(`OpenAI ${MODEL} → ${SAMPLES}：`, list.join(", "));
  for (const id of list) await genOne(id);
})();
