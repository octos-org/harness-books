// 驾驭工程 中文书 · 配图生成器（Nano Banana Pro / gemini-3-pro-image-preview, 4K）
// 用法： GEMINI_API_KEY=<key> NODE_PATH=~/home/cc-ppt/node_modules \
//        node tools/gen-figures.js [id1 id2 ...]   // 不带参数=全部
// 脚本不含密钥；密钥只从环境读取，绝不写入文件。输出到 synced-book-zh/src/img/<id>.png
const { GoogleGenAI } = require("@google/genai");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error("缺少 GEMINI_API_KEY（请内联传入，勿写入文件）"); process.exit(1); }
const ai = new GoogleGenAI({ apiKey: API_KEY });
const MODEL = "gemini-3-pro-image-preview";
const OUT = path.join(__dirname, "..", "synced-book-zh", "src", "img");   // 提交：web 优化版 .jpg
const MASTERS = path.join(__dirname, "..", "figures-4k");                 // 本地：4K 原图（.gitignore）
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(MASTERS, { recursive: true });

// —— 全系列统一风格（纯视觉、零文字）——
const STYLE = `Editorial technical illustration for a serious engineering book about control systems and taming a probabilistic AI generator. Visual language: precise thin mono-line schematic art, like an elegant blueprint and generative-systems diagram. Palette: deep near-black ink-navy background, luminous cyan-teal as the primary line accent, soft cool white for secondary lines, and a single restrained warm-amber highlight reserved for the one "signal of truth" element. Calm, minimal, generous negative space, very high craft, crisp vector-like edges. A faint engineering grid with subtle measurement ticks sits in the background. Absolutely NO text, no words, no letters, no numbers, no mathematical symbols, no labels, no captions — purely visual metaphor. Not photorealistic, no clutter, no neon rainbow, restrained and tasteful.`;

const FIGS = {
  // Ch.1 §1.3 / Ch.2 §2.2 —— softmax 稀释： w_max ≈ e^G/(e^G+n-1)
  "softmax-dilution": {
    ar: "16:9",
    scene: `SCENE: one bright cyan focal point on the left emits a single fixed bundle of fine attention-rays. Show two stacked situations. Upper: the same bundle reaches only a few nearby nodes, so each ray lands bright, thick and sharp. Lower: the identical fixed bundle must fan out across a vast wide field of very many dim nodes, so every individual ray becomes faint, thin and barely visible. The subject is a fixed quantity of attention being spread ever thinner as the field of competing nodes grows. One single far node glows faint amber to suggest the true target getting lost.`,
  },
  // Ch.2 §2.2 / §2.4 —— 非均匀分辨率窗口： 近清远糊
  "nonuniform-window": {
    ar: "16:9",
    scene: `SCENE: a long horizontal band representing a context window. At the right end (nearest the cursor) the band is crisp high-resolution, made of many sharp distinct fine cells. Moving leftward toward the far end, the cells progressively merge, blur and coarsen into soft low-resolution blocks, and finally dissolve into a faint ghostly outline at the far left. A smooth gradient of resolution from sharp-near to blurred-far. The right edge carries a small warm-amber cursor marker.`,
  },
  // Ch.2 §2.5 —— recall–depth U 形曲线
  "recall-depth-ucurve": {
    ar: "16:9",
    scene: `SCENE: a single luminous cyan curve plotted over a dark engineering grid, shaped like a wide shallow valley — high and bright at both the far-left and far-right ends, sagging low through the middle, a clean U / bathtub shape. A scatter of faint amber points hugs the curve. Minimal abstract data-curve aesthetic, an implied horizontal axis line, no axis labels of any kind.`,
  },
  // Ch.2 §2.3 / Ch.3 —— 负反馈控制环（对抗误差复合）
  "feedback-loop": {
    ar: "16:9",
    scene: `SCENE: an elegant closed control loop drawn as a clean circuit. A signal flows left to right along a main horizontal line through a chain of small processing blocks; at the output on the right, a portion is tapped and carried back along a graceful curved return path to a summing junction at the input, where it corrects the incoming signal. One warm-amber node marks the reference setpoint at the entry. The self-correcting feedback ring is the clear subject; faint noise specks along the chain are being pulled back into line.`,
  },
  // Ch.13 §13.4 / Ch.17 —— 可闭合：生成—验证—重试收敛  1-(1-p)^k
  "closability-gate": {
    ar: "16:9",
    scene: `SCENE: several faint cyan candidate streams flow from the left toward a single tall vertical gate/sieve standing in the center. Most candidate streams are stopped and scattered by the gate; only the few that pass through are rendered in bright warm-amber and converge cleanly into one single confident output line exiting to the right. Stacked, slightly offset repeated attempts behind the gate imply many independent tries. The subject is filtering many attempts through one independent gate until a verified one passes.`,
  },
  // Ch.10 §10.3 —— 1×1M vs 5×200K 的量级对比
  "context-economics": {
    ar: "16:9",
    scene: `SCENE: a clear visual mass contrast. On the left, one single massive dense solid block built of a very fine tight grid, glowing heavily and hot, visually heavy. On the right, five small light separate parallel shards arranged in a neat row, each cool, sparse and airy. The dramatic contrast between the one huge dense block and the five small light blocks is the subject — the single block is overwhelmingly heavier than the five small ones combined.`,
  },
};

async function genOne(id) {
  const f = FIGS[id];
  if (!f) { console.error("未知图 id:", id); return; }
  const prompt = `${STYLE}\n\n${f.scene}\n\nComposition: ${f.ar} landscape, 4K, single cohesive illustration.`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await ai.models.generateContent({
        model: MODEL,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { responseModalities: ["IMAGE", "TEXT"], imageConfig: { aspectRatio: f.ar, imageSize: "4K" } },
      });
      const parts = res.candidates?.[0]?.content?.parts || [];
      const img = parts.find(p => p.inlineData);
      if (img) {
        const buf = Buffer.from(img.inlineData.data, "base64");
        const ext = (img.inlineData.mimeType || "").includes("png") ? "png" : "jpg";
        fs.writeFileSync(path.join(MASTERS, `${id}.${ext}`), buf);            // 4K 原图（本地）
        const webOut = path.join(OUT, `${id}.jpg`);
        const meta = await sharp(buf).resize({ width: 2560, withoutEnlargement: true })
          .jpeg({ quality: 84, mozjpeg: true }).toFile(webOut);
        console.log(`✓ ${id}: 4K原图 ${(buf.length/1024/1024).toFixed(2)}MB → web ${webOut.split("/").pop()} ${(meta.size/1024).toFixed(0)}KB ${meta.width}px`);
        return;
      }
      console.log(`… ${id} 第${attempt}次无图，finishReason=${res.candidates?.[0]?.finishReason}`);
    } catch (e) {
      console.log(`… ${id} 第${attempt}次出错: ${(e.message || e).toString().slice(0, 160)}`);
    }
  }
  console.error(`✗ ${id} 三次均失败`);
}

(async () => {
  const ids = process.argv.slice(2);
  const list = ids.length ? ids : Object.keys(FIGS);
  console.log(`生成 ${list.length} 张到 ${OUT} ：`, list.join(", "));
  for (const id of list) await genOne(id);
})();
