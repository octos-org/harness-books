# 7. 操作员仪表盘与小型 fleet 实测

## 7.1 Dashboard role

The dashboard is not cosmetic monitoring. It is the daily control plane for:

- lifecycle anomalies
- phase stagnation
- artifact/validator failures
- retries/timeouts/orphaned children
- cross-session bleed signals

## 7.2 Mini fleet as release truth

Unit/integration tests are necessary but insufficient.  
Harness regressions are often temporal and multi-surface, only visible in live canary behavior.

Live gate posture:

- run scripted validation on at least two mini-fleet hosts
- enforce explicit diagnostic kinds (not generic “failed”)
- block merge when invariants break

Canonical examples include:

- missing required phase
- non-monotonic phase sequence
- lifecycle regression
- duplicate research sessions
- cross-session progress bleed

---

### 同步说明

本节以 Octos 短纲要为准。较大的 mdBook 源材料中暂时没有直接映射到本节的章节，所以本节目前保留为纲要主导内容。
