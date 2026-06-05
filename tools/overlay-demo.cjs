// 演示「图 + 文字叠加」：nb 生成无字插画 → sharp 叠加精确中文文字层（AVF 做法）
// 用法： GEMINI_API_KEY=<key> NODE_PATH=~/home/cc-ppt/node_modules node tools/overlay-demo.cjs
const { GoogleGenAI } = require("@google/genai");
const sharp = require("sharp"); const fs = require("fs"); const path = require("path");
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const OUTDIR = path.join(__dirname, "..", "figures-overlay-demo"); fs.mkdirSync(OUTDIR, { recursive: true });

// 1) 生成「完全无文字」的白底 Nature 插画，构图位置固定，便于叠字
const ARTPROMPT = `A professional scientific concept illustration of Nature / Quanta magazine caliber, on a CLEAN WHITE background. Refined flat vector, deep teal and slate line-work with a single warm amber/coral accent, subtle soft shadows, NO dark background, NO glow. SUBJECT: a bright teal source node at the LEFT-CENTER emits a fixed bundle of fine rays. The rays split: a tight cluster of a FEW bright nodes in the UPPER-RIGHT (dense, sharp lines); and a VAST field of MANY faint pale dots spreading across the LOWER-RIGHT (thin faint lines). One small warm coral/amber node sits alone at the FAR LOWER-RIGHT corner. Generous white space. ABSOLUTELY NO text, no words, no letters, no numbers, no labels anywhere — pure visual shapes only. Composition 16:9.`;

const LABELS = [ // {x,y 相对比例, 文本, 锚点, 引线指向}
  { xp:0.10, yp:0.46, t:"注意力源", anchor:"start", color:"#0f3a4a", size:34 },
  { xp:0.50, yp:0.12, t:"近端：注意力集中、检索锐利", anchor:"start", color:"#0f3a4a", size:34 },
  { xp:0.40, yp:0.82, t:"远端：被摊薄、稀释到几乎看不见", anchor:"start", color:"#5a6b78", size:34 },
  { xp:0.74, yp:0.86, t:"真正目标（被淹没）", anchor:"start", color:"#b5532a", size:34 },
];

(async () => {
  console.log("① 生成无字插画…");
  const res = await ai.models.generateContent({ model:"gemini-3-pro-image-preview",
    contents:[{role:"user",parts:[{text:ARTPROMPT}]}],
    config:{responseModalities:["IMAGE","TEXT"], imageConfig:{aspectRatio:"16:9", imageSize:"2K"}} });
  const img=(res.candidates?.[0]?.content?.parts||[]).find(p=>p.inlineData);
  if(!img){console.error("无图");return;}
  const base=Buffer.from(img.inlineData.data,"base64");
  const art=path.join(OUTDIR,"art-nolabel.png"); fs.writeFileSync(art,base);
  const meta=await sharp(base).metadata(); const W=meta.width,H=meta.height;
  console.log(`   无字图 ${W}x${H} 已存 ${art}`);

  console.log("② 叠加中文文字层…");
  const texts=LABELS.map(l=>`<text x="${(l.xp*W).toFixed(0)}" y="${(l.yp*H).toFixed(0)}" font-family="PingFang SC, Heiti SC, sans-serif" font-size="${l.size*(W/1536)}" fill="${l.color}" text-anchor="${l.anchor}" font-weight="500">${l.t}</text>`).join("");
  const svg=`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${texts}</svg>`;
  const out=path.join(OUTDIR,"overlaid.png");
  await sharp(base).composite([{input:Buffer.from(svg),top:0,left:0}]).png().toFile(out);
  console.log(`   叠加完成 → ${out}`);
})().catch(e=>console.error("错:",(e.message||e).toString().slice(0,200)));
