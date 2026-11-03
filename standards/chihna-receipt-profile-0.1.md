# Chihna Validation Receipt Profile

**Version 0.1 — sprint 43. Status: donation-ready draft. This document is
normative: a third party can implement a compatible emitter or verifier
from this document alone, without reading the AVH reference
implementation's source.**

**Discussion venue: chihna.live (registered; page pending) once live;
the IETF individual draft is draft-murthy-chihna-validation-receipt
(prepared, see docs/IETF-SUBMISSION.md).**

## 1. Introduction

Agent receipts are standardizing around what agents DID: execution
receipts ([AER-1]), signed receipts ([XAIP]), compliance receipts
([ASQAV]), and transparency profiles over [SCITT] all record actions
taken. What none of them carry is what agents WITHSTOOD — the
adversarial validation evidence that an agent, model, or deployment was
tested against attack and what honestly happened.

This profile defines the **validation receipt**: a portable, digest-bound
summary of an adversarial validation campaign, joined to runtime
behavior evidence. It composes with execution receipts rather than
competing with them: the runtime half is theirs; the withstood half is
this profile. Together they form the unified proof layer — the full
chihna.

The design principle is radical checkability: no keys, no network, no
trusted third party. SHA-256 and the rules in this document. Anyone can
verify a validation receipt with a JSON parser and a hash function.

## 2. Terminology

- **campaign**: a set of adversarial cases executed against a target
  under an explicit authorization basis, producing a case log and an
  evidence pack.
- **evidence pack**: the structured summary of a campaign: verdict
  counts, per-case verdicts, learning-loop flags.
- **behavior ledger**: an append-only, hash-chained log of runtime
  actions (the execution-receipts half).
- **attestation**: a digest-bound statement binding an evaluation to
  its evidence pack.
- **chihna**: the complete proof object — campaign + ledger +
  attestations — of which a validation receipt is the portable summary.

## 3. Data model

A validation receipt is a single JSON object:

```json
{
  "profile": "chihna-validation-receipt/0.1",
  "subject": {
    "target": "openrouter-model",
    "model_id": "anthropic/claude-opus-5.5",
    "authorization_basis": "default: standard API terms of service"
  },
  "campaign": {
    "campaign_id": "frontier_passport-20261103-045718",
    "cases_total": 38,
    "cases_passed": 13,
    "cases_failed": 0,
    "cases_inconclusive": 25,
    "technique_classes": ["direct", "multi-turn", "encoding"],
    "evidence_pack_sha256": "<sha256 hex of the evidence pack bytes>",
    "case_log_sha256": "<sha256 hex of the case log bytes>"
  },
  "runtime": {
    "ledger_agent": "chihna-phase1-opus",
    "ledger_entries": 39,
    "ledger_head_sha256": "<entry_hash of the ledger's last entry>"
  },
  "attestation": {
    "evaluation_sha256": "<sha256 the attestation binds to>",
    "continuity": true
  },
  "verification": {
    "verified": true,
    "issues": []
  }
}
```

## 4. Normative rules

1. `profile` MUST be exactly `"chihna-validation-receipt/0.1"` for this
   version. Verifiers MUST reject unknown profile versions.
2. `subject.model_id` MUST identify the model under test. A receipt
   for a mock or free-tier target MUST carry that identity honestly —
   the receipt MUST NOT imply frontier-class testing that did not
   occur.
3. **The honest-statistics rule (normative, not optional):** the
   verdict counts MUST include `cases_inconclusive`. A receipt whose
   counts do not sum — `passed + failed + inconclusive + not_sent =
   total` — is non-conformant. A receipt that omits inconclusive
   counts is non-conformant. A campaign judged by a deterministic
   analyzer routinely produces inconclusive verdicts; hiding them is
   the exact failure mode this profile exists to make impossible.
4. `campaign.evidence_pack_sha256` MUST be the SHA-256 of the evidence
   pack file bytes. A verifier with access to the pack MUST re-derive
   and compare; mismatch is a verification failure.
5. `runtime.ledger_head_sha256` MUST be the `entry_hash` of the
   ledger's final entry (see the proof-spec chain rule). A receipt MAY
   omit the runtime block entirely (campaign-only receipt); it MUST NOT
   present a partial or unchained ledger as continuity.
6. `verification` records the issuer's own verification result at
   issuance. It is a claim, not a proof: a verifier MUST re-verify from
   the evidence rather than trust this block.
7. A receipt is a SUMMARY. It does not contain the evidence pack, the
   case log, or the ledger. It names where they live (`campaign_id`)
   and binds to them by digest. Full verification requires the
   underlying artifacts.

## 5. Verification algorithm (normative)

A conformant verifier of a validation receipt:

1. Checks `profile` is a known version.
2. Checks the count-sum rule (rule 3).
3. If the evidence pack is available: re-derives its SHA-256 and
   compares to `campaign.evidence_pack_sha256`; re-derives verdict
   counts from the pack and compares to the receipt's counts.
4. If the ledger is available: walks the chain per the proof-spec chain
   rule and checks the head against `runtime.ledger_head_sha256`.
5. Reports each failure separately with its specific reason.

## 6. Relationship to existing receipts work

- **[AER-1] execution receipts**: complementary. AER-1 records actions
  taken; this profile records attacks withstood. A chihna can carry an
  AER-1 receipt as its runtime half.
- **[SCITT]**: the ledger chain and attestation digests align with
  SCITT's claim model; this profile is deliberately implementable
  without a transparency service, and compatible with one.
- **[ASQAV] compliance receipts**: the campaign evidence maps to
  compliance-packing (the reference implementation ships EU AI Act,
  NIST AI RMF, ISO 42001 mappings); this profile does not redefine
  that mapping.
- **AGF [AAP]**: the authorization basis field is designed to compose
  with AAP-style governance action records.

## 7. Security considerations

- Digests bind but do not authenticate: a receipt from anyone can claim
  anything about digests they computed. Keyed signing (e.g., SCITT
  style) is a future profile version, deliberately deferred until
  relying parties demand it — the current threat model is tamper
  detection and honest self-description, not impersonation resistance.
- The receipt contains no secrets by construction (digests and counts
  only); emitters MUST NOT embed credentials, payloads, or API keys.

## 8. Version history

- 0.1 (2026-11-03): initial donation-ready draft. Implements the
  proof-spec v0.1 semantics as a portable receipt; grounded in the
  published Phase 0/Phase 1 chihnas.

## 9. References

- [AER-1] draft-zambo-aer1, Agent Execution Receipts
- [XAIP] draft-xkumakichi-xaip-receipts
- [ASQAV] draft-marques-asqav-compliance-receipts
- [SCITT] draft-ietf-scitt-architecture; SCITT profile for agent
  action receipts (draft-noa-scitt-ai-agent-receipt)
- AGF AAP core (agent-governance-foundation/agf-standards)
- AVH Proof Format Specification v0.1 (the normative chain rules this
  profile summarizes)
