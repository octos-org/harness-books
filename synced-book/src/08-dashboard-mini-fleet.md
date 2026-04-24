# 7. Operator dashboard and mini fleet live testing

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

### Sync Note

The outline is canonical for this section. The larger mdBook source has no direct chapter mapped here yet, so this section currently remains outline-led.
