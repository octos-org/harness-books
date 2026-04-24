# 12. Actionable checklists

## 12.1 Maintainer pre-merge checklist (harness-affecting PRs)

- [ ] Change maps to explicit user-visible invariant.
- [ ] Contract state is durable across crash/reload/compaction.
- [ ] Lifecycle transitions are monotonic and tested.
- [ ] Artifact selection uses declared policy, not heuristic fallback as primary.
- [ ] Validator failures block terminal success where required.
- [ ] Session/topic scope checks prevent cross-session contamination.
- [ ] API and SSE replay expose identical task truth.
- [ ] Operator summary/dash signals include new failure mode.
- [ ] Mini fleet gate passed on at least two hosts.
- [ ] Docs + fixture + scripts + e2e updated in same slice when contract changed.

## 12.2 Third-party app/skill developer checklist

- [ ] Declare a single canonical `primary` artifact.
- [ ] Define validators for existence, size, and domain constraints.
- [ ] Use stable lifecycle/task API fields only.
- [ ] Emit structured progress through `OCTOS_EVENT_SINK` when available.
- [ ] Keep stderr for diagnostics, not contract status.
- [ ] Ensure hooks are idempotent (`before_spawn_verify` especially).
- [ ] Test reload/session-switch behavior for your workflow.
- [ ] Verify failure paths produce operator-readable evidence.

## 12.3 Incident response checklist (status drift / contamination class)

- [ ] Compare `/api/sessions/:id/tasks` snapshot vs UI bubble/header.
- [ ] Inspect SSE stream for missing or out-of-scope `task_status` events.
- [ ] Confirm session/topic tags on replay and live events.
- [ ] Check duplicate deep-research/run_pipeline tasks in final snapshot.
- [ ] Validate phase order monotonicity and progress range.
- [ ] Capture diagnostic JSON and curl hint before patching.
- [ ] Re-run mini fleet gate after fix; do not accept local-only validation.

---

### Sync Note

The outline is canonical for this section. The larger mdBook source has no direct chapter mapped here yet, so this section currently remains outline-led.
