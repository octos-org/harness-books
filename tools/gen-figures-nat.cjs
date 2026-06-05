// 驾驭工程 配图 · Nature/Science 专业科学概念图 · Nano Banana Pro 2K · 带中文标注
// 用法： FIG_OUT=img GEMINI_API_KEY=<key> NODE_PATH=~/home/cc-ppt/node_modules node tools/gen-figures-nat.cjs [id ...]
// 密钥只从环境读取，绝不写入文件。
const { GoogleGenAI } = require("@google/genai");
const fs = require("fs"); const path = require("path");
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error("缺少 GEMINI_API_KEY"); process.exit(1); }
const ai = new GoogleGenAI({ apiKey: API_KEY });
const MODEL = "gemini-3-pro-image-preview";
const OUT = process.env.FIG_OUT === "img"
  ? path.join(__dirname, "..", "synced-book-zh", "src", "img")
  : path.join(__dirname, "..", "figures-nat-test");
fs.mkdirSync(OUT, { recursive: true });

const NATURE = `A professional scientific concept illustration with the visual sophistication of a top-tier science journal's feature graphic. Sophisticated, polished, publication-grade editorial science visualization. A refined restrained palette — deep teal and slate with a single warm-amber accent — on a deep, subtly graded near-black background. Elegant glowing vector line-work and luminous nodes, tasteful depth and soft glow, rigorous information design, clear visual hierarchy, generous negative space. Include clean, legible, correctly-spelled Chinese sans-serif LABELS exactly as specified (and the few English/technical tokens as written), set like real figure annotations. Extremely high craft, calm and authoritative; NOT cartoonish, NOT cluttered, NOT neon. IMPORTANT — do NOT add any journal name, logo, masthead, watermark, figure number, title bar, header band, or any extra caption/title text of your own; render ONLY the specific labels listed below and nothing else.`;

const F = {
 // ===== 现有 11（同名覆盖，章节引用不变）=====
 "wf-softmax-dilution": {ar:"16:9", s:`A glowing focal point on the LEFT labeled "注意力源" emits one fixed bundle of fine rays. UPPER: rays reach a FEW nearby bright nodes, sharp — labeled "近端：注意力集中、检索锐利". LOWER: the SAME bundle fans across a VAST field of MANY faint dim points, each ray barely visible — labeled "远端：被摊薄、稀释到几乎看不见". One faint amber node far lower-right, labeled "真正目标(被淹没)". Subject: fixed attention spread ever thinner as competitors grow.`},
 "wf-attention-mixing": {ar:"16:9", s:`Weighted-mixing diagram. LEFT: a node labeled "query". MIDDLE: four luminous nodes in a column labeled "key"; lines from query to each with DIFFERENT thickness, thickest labeled "权重 w". RIGHT: lines converge into one node labeled "加权输出". Title: "注意力 = 软查找 + 按权重混合".`},
 "wf-nonuniform-window": {ar:"16:9", s:`A long horizontal band labeled "上下文窗口", made of cells: fine sharp cells on the RIGHT labeled "近端：高分辨率", growing coarse toward the LEFT labeled "远端：被压缩", fading to a faint outline at far left. A small amber marker at the right end labeled "光标".`},
 "wf-capacity-window": {ar:"16:9", s:`A data chart. X-axis labeled "上下文长度". A glowing curve rises to a plateau then falls (a hump); the plateau softly highlighted and labeled "有效工作区间". A tall dashed vertical line near the far right, to the right of the fallen curve, labeled "容量上限". Caption note: "容量上限 ≠ 有效工作区间".`},
 "wf-error-compounding": {ar:"16:9", s:`A data chart. X-axis labeled "任务步数 T", y-axis labeled "全程正确率 (1-ε)^T". A glowing curve descends in a downward staircase / exponential decay from top-left to bottom-right; the lowest step is the amber node. Note: "链越长越难全程不出错".`},
 "wf-recall-ucurve": {ar:"16:9", s:`A data figure: a smooth glowing U-shaped (bathtub) curve, high at both ends, low in the middle, over a subtle grid. X-axis labeled "信息所在深度（近端→远端）", y-axis labeled "命中率". Scattered glowing data points follow it. The low middle highlighted, labeled "中段最易被冷落（lost in the middle）".`},
 "wf-feedback-loop": {ar:"16:9", s:`A control-loop system. A luminous node LEFT labeled "参考值(目标)" → a chain of two glowing modules labeled "控制器 (harness)" and "执行器 (工具)" → a bright node "环境". A graceful amber arc loops back from 环境 through a node "传感器 (验证器)" to a summing junction at the input; return path labeled "误差".`},
 "wf-factstream-fold": {ar:"16:9", s:`Data-flow figure. LEFT: a vertical stack of glowing bars labeled "事实流 (append-only 事件)". Arrows into a luminous funnel in the middle labeled "fold". From the funnel, arrows to three nodes RIGHT labeled "UI"、"API"、"dashboard". Title: "同一条事实流 → 多个投影".`},
 "wf-artifact-gating": {ar:"16:9", s:`Flow figure. LEFT: three glowing checkmark boxes labeled "required artifact". Arrows right into a luminous vertical gate labeled "gating 门禁". After it the path splits: upper arrow to a node labeled "ready", lower arrow with an amber ✗ labeled "failed". Note: "全部就绪才放行".`},
 "wf-context-economics": {ar:"16:9", s:`A balance-scale. LEFT pan: one large dense fine-grid block labeled "1×1M (稠密)" tips DOWN (heavy). RIGHT pan: five small sparse blocks labeled "5×200K (分片)" rise UP (light). Note under fulcrum: "attention 量级 ≈ 5×".`},
 "wf-closability-curve": {ar:"16:9", s:`A data chart. X-axis labeled "独立采样次数 k", y-axis labeled "至少一次通过的概率". A glowing curve rises and saturates toward a dashed asymptote near the top labeled "1（近乎必成）". On-chart formula note: "1-(1-p)^k". Glowing points along the rise.`},
 // ===== 新增 9 =====
 "wf-residual-stream": {ar:"16:9", s:`A token's residual stream. A single horizontal luminous lane runs left→right through several stacked identical layer-blocks labeled "层 1"、"层 2"、"层 N"; at each block a small "+Δ" glowing increment is added onto the SAME fixed-height lane (label one "x += 这一层的贡献"). The lane height is constant throughout, labeled "定宽工作记忆（宽度固定）". Subject: fixed-width state carried and updated layer by layer.`},
 "wf-kv-cache": {ar:"16:9", s:`KV cache reuse. A row of past positions, each a small node holding a "k,v" pair, enclosed in a glowing box labeled "KV cache（对过去的唯一留存）". A new token on the right labeled "新 token" draws thin attention lines back to all cached nodes (reuse, not recompute). A side note: "随上下文线性增长". Clean scientific schematic.`},
 "wf-autoregressive": {ar:"16:9", s:`Autoregressive feedback. A model block labeled "模型" outputs a token on the right labeled "输出 token"; a glowing curved arrow feeds that output back to become part of the input on the left, labeled "回灌为下一步输入". A small caption: "把自己的输出当成既成事实". Subject: output-fed-back-as-input loop.`},
 "wf-three-layer-stack": {ar:"16:9", s:`Three stacked horizontal layers (a control stack), bottom to top: "Prompt 工程：稳单轮", "上下文工程：稳多轮（AGENTS.md / skills / memory）", "Harness 工程：确定性控制循环（事实流 / 验证 / 回放）". Each layer a glowing slab, the top one (Harness) emphasized in amber. Right-side bracket labeled "能力递进，逐层叠加而非替代".`},
 "wf-lifecycle": {ar:"16:9", s:`A state-machine diagram with glowing state nodes and arrows: "queued" → "running" → "verifying" → splitting to "ready" and "failed". A back-arrow from any state labeled "resume". The edge "verifying → ready" labeled "需所有 gating validator 通过". Note: "模型只能把任务推进到 verifying，无权宣布 ready". Nature-style schematic.`},
 "wf-runtime-overview": {ar:"16:9", s:`A runtime architecture overview, vertical flow. Top: "用户任务 / 外部触发" → a central spine labeled "Session 事实流" → four branches: "调度循环"、"能力平面"、"产物与验证"、"回放与摘要" → bottom "终态裁决 (ready/failed) 与可追责证据". A side caption: "任何用户可见状态都能回溯到同一条事实流". Elegant glowing system map.`},
 "wf-swarm-roles": {ar:"16:9", s:`A multi-agent role diagram with three glowing lanes: "coordinator"、"worker"、"verifier". Small event tags show write-permission: worker writes "subagent.reported", verifier writes "validator.result", and ONLY coordinator writes the highlighted amber "task.settled". Note: "唯有 coordinator 能宣布终态".`},
 "wf-five-layer-failure": {ar:"16:9", s:`A "假成功" five-layer break. Five stacked horizontal layers labeled bottom-to-top: "session"、"能力平面"、"verifier"、"dashboard"、"swarm". Each layer has a small amber crack/gap glyph (a slightly-loosened buckle). At the top, the gaps align into one path producing an amber output labeled "用户面前的‘假成功’". Note: "每层只松一扣，叠起来合成一次完整的谎言".`},
 "wf-governance-lenses": {ar:"16:9", s:`One central horizontal fact-stream lane labeled "同一条事实流". Four glowing lenses above it, each focusing on the stream, labeled "安全 (scope/approval)"、"合规 (actor/args_digest)"、"成本 (budget)"、"路由 (model.selected)". Caption: "治理不是第五层，是同一条事实流被多读四遍".`},
};

async function gen(id){
 const f=F[id]; if(!f){console.error("未知 id:",id);return;}
 const prompt=`${NATURE}\n\nFIGURE: ${f.s}\n\nComposition: ${f.ar}, 2K, single cohesive figure.`;
 for(let a=1;a<=3;a++){try{
   const res=await ai.models.generateContent({model:MODEL,contents:[{role:"user",parts:[{text:prompt}]}],
     config:{responseModalities:["IMAGE","TEXT"],imageConfig:{aspectRatio:f.ar,imageSize:"2K"}}});
   const img=(res.candidates?.[0]?.content?.parts||[]).find(p=>p.inlineData);
   if(img){const buf=Buffer.from(img.inlineData.data,"base64");fs.writeFileSync(path.join(OUT,`${id}.png`),buf);
     console.log(`✓ ${id} ${(buf.length/1048576).toFixed(2)}MB`);return;}
   console.log(`… ${id} #${a} 无图 ${res.candidates?.[0]?.finishReason}`);
 }catch(e){console.log(`… ${id} #${a} 错 ${(e.message||e).toString().slice(0,120)}`);}}
 console.error(`✗ ${id} 失败`);
}
(async()=>{const ids=process.argv.slice(2);const list=ids.length?ids:Object.keys(F);
 console.log(`NATURE 2K → ${OUT}:`,list.join(", "));
 for(const id of list) await gen(id);})();
