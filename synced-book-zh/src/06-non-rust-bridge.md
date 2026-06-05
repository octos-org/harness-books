# 7. 能力平面与生态桥接：不要把 agent 关在单一语言里

给 agent 一句话：“把这个月的销售数据画成趋势图，贴进周报。”

它在文本上能想得很清楚——该取哪段时间、画折线还是柱状、放周报哪一节。可这件事真要落地，没有一步是“生成文本”：取数据要打内部那个 SQL 服务，画图要跑一段 matplotlib（Python），“贴进周报”要往一个文件里写。模型再聪明，只要够不到自己语言、自己进程、自己仓库之外的那些东西，这句话就只能停在“我建议你这样做”。

第 6 章那张总图里，最容易被低估的就是这块“能力平面”。很多团队把它理解成“再接几个工具”，但 Claude Code 和 Codex 给的信号要强得多：想做万用 agent，就得默认系统会**不断越出本语言、越出本进程、越出本仓库**，去调 shell、浏览器、MCP、外部 API、第三方脚本，甚至别的 agent。这一章讲的，就是怎么让它伸得出手，又不让伸出去的每只手都变成一个新的事实漏洞。

## 7.1 万用 agent 为什么必然长出能力平面

Claude Code 能既写代码、又写文章、做 slide、跑研究、驱动外部服务，靠的不是给每个场景单独调一套 prompt。真要那样，场景一多就维护不动了。它靠的是把这些花样各异的任务，**还原成同一组相对稳定的动作原语**：读写本地产物、运行命令和脚本、访问网络与外部服务、读取外部资源、把活派给别的 agent、必要时向人请求输入或确认。写周报那句话之所以能落地，正是因为它被拆成了这几样原语的组合——查询是“访问外部服务”，画图是“运行脚本”，贴进去是“写本地产物”。

Codex 把同一份清单摆到了公开协议面上：`command/exec`、`fs/*`、`mcpServer/tool/call`、`mcpServer/resource/read`、`tool/requestUserInput`、`spawn_agent`——这些不是附属功能，而是 runtime 原生的动作词汇表。这里得给不熟的读者补一句 MCP 是什么：`Model Context Protocol` 是一套标准协议，让模型能以统一方式去发现、调用外部的工具和资源——你可以把它想成工具世界的“USB-C”，有了这个统一口，任何模型、任何客户端都能插上任何一个合规的工具，而不必为每一对组合单独焊一根线。

两套系统说的是同一件事：所谓“万用 agent”，本质是**一个能编排多种能力源的运行时，而不是一句更长的 system prompt**。把这点想反了，团队就会一直在“再调几行提示词”里打转，而真正该建的是那张能力平面。

## 7.2 Claude Code / Codex 怎么把外部能力接进来

把视角拉近到对象层，会看到一个很说明问题的细节。Claude Code 的 `ToolUseContext` 里，直接攥着 `mcpClients`、`mcpResources`、`agentDefinitions`、`commands`、`tools`，还有权限上下文和 `AppState`。注意它**没把“当前正在编辑的代码文件”当成核心对象**——核心对象是“当前正在推进的那条任务线程”。这条线程拿着同一套身份、权限、记忆和摘要机制，去调不同来源的能力；调 shell、调 MCP、派子 agent，对它而言都是同一个主体在伸不同的手，而不是几个互不相识的工具各自为政。

Codex 走的是更偏协议的那条路。它把文件系统、命令执行、MCP、人工输入、多 agent 工具，统一暴露在工具注册面和 app-server 协议上。这样做的好处是：CLI、桌面端、Web、乃至未来某个还没出现的客户端，都**不必各自重新发明一遍**“怎么执行 shell、怎么续 thread、怎么向外部 agent 派工”——能力面已经先在内核层被抽象好了，客户端只是它的不同前脸。[^capability-plane-ch7]

值得学的不是这些模块名，而是它们共同体现的那个架构判断：**外部能力不是插在系统屁股上的插件尾巴，而是运行时主干的一部分。** 这个判断决定了下面一整节的成败。

## 7.3 一个 Python 脚本，怎样一路污染父任务

把上面那句架构判断反过来说会更有杀伤力：外部能力一旦**没有**进入统一协议面，第 5 章那几类事故就会一条条排着队回来。挑最常见的一种追到底——团队图快，把一段现成的 Python 数据脚本当工具挂了进去，没怎么改造。

它跑起来了。脚本一边处理，一边往 stderr 打进度：`Processing row 4000/10000...`。在写脚本的人看来这很贴心。可父任务那头，期待的是从一个约定的事件汇流处收到结构化的进度事件；它看 stderr，只看到一坨它无法解析的文本日志。于是父任务的进度，**停在了脚本启动前的那一刻**——这正是第 5.1 节那种进度漂移：活在干，进度却是死的。

脚本算完，把结果写到了 `./out/result.csv`——这个路径是它自己猜的。父任务的 artifact 契约里，压根没有这条路径的位置；它不知道主产物已经生成、在哪、该不该送去验证。第 5.4 节那个产物契约缺口，就这么开了。更别提这段脚本是用一个不带 session/topic scope 的 shell 起的，它产生的副作用落不进当前会话的边界里，于是又有了第 5.3 节那种串扰的温床；而如果它顺手还调了个外部 verifier、对方只回一行 `OK`，那第 5.5 节的验证器不完整也一并凑齐了。

看清这条链：**每一种没被收口进协议的能力，都精准地重新打开了一条具体的失效机理。** 进度漂移、产物缺口、会话串扰、验证空洞——它们不是各自独立的 bug，而是同一个根因（能力没进统一事实面）在四个出口上的四种症状。所以“桥接”绝不只是 SDK 用着方不方便的问题，它的本质是：**所有外部能力，都要在进入系统的那一刻，就被收口到同一套 session、scope、artifact、validator、evidence 规则里。**

## 7.4 入口允许多样，消费端必须强约束

那条链也指明了正确的落地姿势，可以压成一句话：**发射端允许语言和生态的多样性，消费端必须保持运行时真相的唯一性。**

发射端要宽容，因为你拦不住生态。给 Python、Node、shell、外部服务各提供一个轻量的事件发射辅助层，让它们能方便地把进度、产物、证据按规矩报上来；再提供一个 CLI 或环境变量形式的兜底桥（比如一个 `HARNESS_EVENT_SINK`），连辅助层都来不及接的脚本，也能靠它把关键事实喷进同一条流。这里有个分寸：sink 缺失时可以 no-op（脚本照跑，只是这次没报结构化进度），但**绝不允许因为 sink 缺失就跳过结果契约和终态验证**——宽容的是“怎么报”，不容商量的是“报上来的东西必须过同一道关”。

消费端则必须铁面。无论事实从哪种语言、哪个进程喷进来，它在进入系统时都要被同一套规则校验一遍：schema 对不对、带没带 session/topic scope、phase 合不合法、artifact 引用指向哪、validator 证据齐不齐。回到 §7.3 那段 Python 脚本——只要消费端这道关在，它那条 stderr 进度会被判为“无结构、不计入”，它猜的那条产物路径会因为不在契约里而被打回，串扰会因为缺 scope 而被拦下。同一段脚本，接法没变，但因为消费端不松口，它再也污染不了父任务的事实。

这一章守的边界，会在平台越做越开放时变得越来越重要。等到要接插件市场、第三方 workflow、外部 agent，能力平面就是最先要守住的那道线——否则平台每开放一步，事实协议就被侵蚀一步，最后退回到谁也说不清“现在到底是什么状态”的那种系统。

## 7.5 把那次 Slack 上传，做成一个合规的桥接能力

抽象讲到这儿，正好可以拿第 6 章那条任务来对质。那次把 `q2-weekly.pdf` 发到 `#finance` 的失败，根子就在 `slack.upload` 这个能力是怎么接进系统的。如果它只是 prompt 里一段顺手写的 `curl`，那 §7.3 那条污染链会原样上演；而如果它是一个有契约的桥接能力，长相是这样的：

```json
{
  "name": "slack.upload",
  "scopes": ["slack:files.write", "slack:channel:#finance"],
  "args_schema": {"channel": "string", "file_path": "string", "title": "string?"},
  "result_contract": {
    "success_means": "files.completeUpload 返回 2xx 且 file_id 可回查",
    "on_success": {"emit_artifact": {"kind": "delivery.receipt",
                                     "fields": ["channel", "file_id", "permalink", "ts"]}}
  }
}
```

这份契约里最要命的一行是 `success_means`。Slack 的上传分两段——先 `files.getUploadURLExternal` 拿通道，再 `files.completeUpload` 落盘——而契约明确把“成功”钉在第二段的确认上，外加一个“`file_id` 可回查”的硬条件。第一段那个 2xx，在这份契约里什么都不算。于是那次 `completeUpload` 超时，桥接层根本没有“乐观上报”的接口可用：按契约，它只能往事实流写第 6 章里那条 `seq:7`——`ok:false`，并且**不**产生 `delivery.receipt` 这件产物。

把这件事说穿：第 6 章里状态机之所以能看见那次失败，不是因为模型诚实，而是因为工具契约根本不给它撒谎的入口。`success_means` 把“成功”的定义从模型的语义直觉、从 HTTP 状态码，挪到了一个可回查的客观事实上；`on_success.emit_artifact` 又规定了“成功必须留下一件具名产物”。这两条合起来，正好喂饱了第 6.9 节那条 `slack.delivered` 验证器——它要找的 `delivery.receipt` 没出现，于是 gating 失败，终态落到 `failed`。能力契约和验证契约，在这里严丝合缝地咬上了。

## 7.6 事件汇流口的具体协议：一段脚本怎样把事实喷回主流

§7.4 给了一个名字叫 `HARNESS_EVENT_SINK` 的兜底桥，这里把它摊开成可以照抄的协议。它其实简单到近乎朴素：harness 在拉起桥接进程前，打开一个汇流口（一个 unix domain socket 或具名管道），把它的地址塞进环境变量 `HARNESS_EVENT_SINK`，再把任务标识塞进 `HARNESS_TASK_ID`。桥接进程要做的，就一件事——把自己产生的事实，按和原生事件**一模一样**的 schema，逐行 JSON 写进这个口。

Python 那段在 §7.3 里闯过祸的脚本，接上协议之后是这样：

```python
import os, json, socket
SINK = os.environ.get("HARNESS_EVENT_SINK")

def emit(ev):
    if not SINK:                       # sink 缺失 → no-op，脚本照常算完
        return
    ev.setdefault("task_id", os.environ["HARNESS_TASK_ID"])
    with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as s:
        s.connect(SINK)
        s.sendall((json.dumps(ev, ensure_ascii=False) + "\n").encode())

emit({"type": "tool.progress", "tool": "report.render", "pct": 40})
# … 生成 PDF …
emit({"type": "artifact.written", "kind": "report.pdf",
      "path": "out/q2-weekly.pdf", "sha256": sha256_of("out/q2-weekly.pdf")})
```

换成 Node，逻辑一字不差，只是语言皮肤不同：

```js
const net = require("net");
const SINK = process.env.HARNESS_EVENT_SINK;
function emit(ev) {
  if (!SINK) return;
  ev.task_id ??= process.env.HARNESS_TASK_ID;
  const c = net.createConnection(SINK, () => c.end(JSON.stringify(ev) + "\n"));
}
emit({ type: "artifact.written", kind: "delivery.receipt",
       channel: "#finance", file_id: "F0xyz", permalink: "https://slack/…" });
```

连辅助层都来不及接的场景——比如一段临时 shell——也有最后一道兜底：

```bash
emit() { [ -n "$HARNESS_EVENT_SINK" ] && printf '%s\n' "$1" | nc -U "$HARNESS_EVENT_SINK"; }
emit '{"type":"tool.progress","tool":"slack.upload","pct":100}'
```

三段代码长得不一样，喷出来的事件却落进同一条流、过同一道 schema 校验、被同一个 fold 折叠——这就是“发射端允许多样、消费端保持唯一”那句话的字面实现。也正因如此，§7.3 里那条 stderr 进度漂移有了正解：进度不再靠父任务去猜 stderr，而是脚本主动 `emit` 一条 `tool.progress`；产物不再靠文件名猜，而是 `emit` 一条带 `sha256` 的 `artifact.written`。再回到那条分寸线——`SINK` 缺失时 `emit` 直接 no-op，脚本照样把活算完，宽容的只是“这次没报进度”；可消费端那边，artifact 契约和 gating validator 一个都不会因为 sink 缺席而豁免。一个闷头不报进度的脚本，顶多让 UI 少几行进度条，绝不会因此被偷偷判成 `ready`。

## 7.7 权限不是一个开关，是能力契约的一部分

还剩最后一个问题：既然桥接能力能往外发文件、能花钱、能删东西，凭什么信得过它？答案不在“给不给 agent 权限”这个开关上，而在权限被建模成能力契约的一部分。回看 §7.5 那份 schema，`slack.upload` 带着 `scopes: ["slack:files.write", "slack:channel:#finance"]`——它要的不是“能用 Slack”，而是“能往 `#finance` 这一个频道写文件”。这是最小权限：能力的边界被写进契约，由消费端在调用前核对，而不是靠 agent 自觉。

这也顺手堵死了一种本可以更阴险的“假成功”。设想模型不老实，直接在聊天里编一句“已生成回执 `F0xyz`”——它伪造不出第 6 章那件 `delivery.receipt` 产物，因为写这件产物的前提，是 `slack.upload` 真的握着 `slack:files.write` 的 scope、真的拿回了一个可回查的 `file_id`。权限和产物在这里互为锁扣：没有 scope，调用根本发不出去；没有真实回执，产物根本写不进流。模型能说的，永远只是一条 `model.claim`。

更危险的动作，则要把人重新请回决策里。我们这条任务里，`slack:channel:#finance` 是预先授权的，所以一路无需打断；但假如它要做的是“给外部地址 `cfo@` 发一封带附件的邮件”，触到的就是 `email:send_external` 这类特权 scope——这时合理的设计不是放行，而是先在事实流里落一条 `approval.requested`，把任务挂起，等一条 `approval.decided` 回来再继续。这正是 Codex 那套 sandbox 加 approval 模型的用意：权限的授予、特权动作的审批、人工的放行或拒绝，全都是事实流里的一等事件，而不是某处代码里一个无人留痕的 `if`。[^bridge-contract-ch7] 把这一节连起来看就清楚了——能力平面之所以敢“伸得出手”，正是因为每只手伸出去时，都被 scope 框住、被产物契约盯住、被特权审批拦住，伸出去的每一下都在事实流里留着痕。

[^capability-plane-ch7]: 本章在此处综合 Claude Code `ToolUseContext`、MCP 与 agent 定义相关实现，以及 Codex `tools` 与 `app-server` 协议面中关于 command、fs、MCP、human input、多 agent 工具的公开边界，用来说明万用 agent 必须先拥有统一的能力平面；对应第 22 章参考文献 21、24。
[^bridge-contract-ch7]: 本章在此处综合 Codex 开源仓库中 sandbox、approval 与工具 scope 的公开边界，以及 MCP 关于工具调用与资源读取的标准约定，用来说明桥接能力的结果契约、事件回流协议与权限模型；对应第 22 章参考文献 24、41。

---
