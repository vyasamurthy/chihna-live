/*
 * Chihna validation receipt verifier — profile 0.1 (receipt tier).
 *
 * Public artifact of the Chihna proof layer (AVH engine, sprint 45).
 * Dependency-free: runs in the browser and in node. Implements the
 * receipt-tier rules of standards/chihna-receipt-profile-0.1.md — the
 * checks possible WITHOUT the evidence artifacts. Full verification
 * (log replay, pack counts, ledger walk) requires the artifacts:
 * `avh chihna --verify <bundle>` in the AVH engine.
 *
 * The honest-statistics rule is normative here: a receipt without its
 * inconclusive count is non-conformant, and counts that do not sum
 * are non-conformant. No "100% pass" theater.
 */
(function (root) {
  "use strict";

  var PROFILE = "chihna-validation-receipt/0.1";
  var SHA256_RE = /^[0-9a-f]{64}$/;

  function isSha256Hex(v) {
    return typeof v === "string" && SHA256_RE.test(v);
  }

  function isNonNegInt(v) {
    return typeof v === "number" && isFinite(v) &&
      Math.floor(v) === v && v >= 0;
  }

  /**
   * Check a receipt object against profile 0.1 (receipt tier).
   * Returns { ok: boolean, issues: string[] } — each failure names
   * the specific rule, mirroring the engine's validate_receipt.
   */
  function validateReceipt(receipt) {
    var issues = [];
    if (typeof receipt !== "object" || receipt === null ||
        Array.isArray(receipt)) {
      return { ok: false, issues: ["receipt is not a JSON object"] };
    }

    if (receipt.profile !== PROFILE) {
      issues.push("unknown or missing profile version: " +
        JSON.stringify(receipt.profile) + " (expected \"" + PROFILE + "\")");
    }

    var campaign = receipt.campaign;
    if (typeof campaign !== "object" || campaign === null) {
      issues.push("campaign block missing or not an object");
      campaign = {};
    }

    // The honest-statistics rule: counts must include inconclusive
    // and must sum.
    if (!("cases_inconclusive" in campaign)) {
      issues.push("honest-statistics rule: cases_inconclusive is " +
        "missing — a receipt without its inconclusive count is " +
        "non-conformant");
    }
    var total = campaign.cases_total;
    var passed = campaign.cases_passed;
    var failed = campaign.cases_failed;
    var inconclusive = campaign.cases_inconclusive;
    var notSent = campaign.cases_not_sent;
    var counts = [total, passed, failed, inconclusive, notSent];
    if (!counts.every(isNonNegInt)) {
      issues.push("verdict counts must be non-negative integers");
    } else if (total !== undefined &&
        passed + failed + inconclusive + (notSent || 0) !== total) {
      issues.push("honest-statistics rule: counts do not sum (" +
        passed + " + " + failed + " + " + inconclusive + " + " +
        (notSent || 0) + " != " + total + ")");
    }

    ["evidence_pack_sha256", "case_log_sha256"].forEach(function (f) {
      if (!isSha256Hex(campaign[f])) {
        issues.push("campaign." + f + " is not a sha256 hex digest");
      }
    });
    if (!campaign.campaign_id) {
      issues.push("campaign.campaign_id is missing");
    }

    var subject = receipt.subject;
    if (typeof subject !== "object" || subject === null ||
        !subject.model_id) {
      issues.push("subject.model_id is missing — a receipt must name " +
        "what was tested");
    }

    var runtime = receipt.runtime;
    if (runtime !== undefined && runtime !== null) {
      if (typeof runtime !== "object" || Array.isArray(runtime)) {
        issues.push("runtime block present but not an object");
      } else {
        if (!isSha256Hex(runtime.ledger_head_sha256)) {
          issues.push("runtime.ledger_head_sha256 is not a sha256 " +
            "hex digest");
        }
        if (!isNonNegInt(runtime.ledger_entries) ||
            runtime.ledger_entries < 1) {
          issues.push("runtime.ledger_entries must be a positive integer");
        }
      }
    }

    var verification = receipt.verification;
    if (typeof verification !== "object" || verification === null) {
      issues.push("verification block missing — the issuer's own " +
        "result at issuance is required");
    } else {
      if (typeof verification.verified !== "boolean") {
        issues.push("verification.verified must be a boolean");
      }
      if (!Array.isArray(verification.issues)) {
        issues.push("verification.issues must be a list");
      }
    }

    return { ok: issues.length === 0, issues: issues };
  }

  /* ---------------- browser / node wiring ---------------- */

  if (typeof module !== "undefined" && module.exports) {
    // node: CLI mode — node chihna-verifier.js <receipt.json>
    module.exports = { validateReceipt: validateReceipt, PROFILE: PROFILE };
    if (require.main === module) {
      var fs = require("fs");
      var file = process.argv[2];
      if (!file) {
        process.stderr.write(
          "usage: node chihna-verifier.js <receipt.json>\n");
        process.exit(2);
      }
      var receipt;
      try {
        receipt = JSON.parse(fs.readFileSync(file, "utf8"));
      } catch (e) {
        process.stderr.write("error: receipt is not valid JSON: " + e.message + "\n");
        process.exit(2);
      }
      var result = validateReceipt(receipt);
      if (result.ok) {
        process.stdout.write("conformant: yes\n");
        process.exit(0);
      }
      process.stdout.write("conformant: no\n");
      result.issues.forEach(function (i) {
        process.stdout.write("  - " + i + "\n");
      });
      process.exit(1);
    }
  } else {
    // browser: global
    root.ChihnaVerifier = {
      validateReceipt: validateReceipt,
      PROFILE: PROFILE,
    };
  }
})(typeof window !== "undefined" ? window : globalThis);
