import assert from "node:assert/strict";
import test from "node:test";

import { auditText } from "../src/audit.js";

test("finds a non-canonical URL and its replacement offsets", () => {
  const [finding] = auditText(
    "See https://de.pinterest.com/pin/987654321/?utm_source=share for details.",
  );

  assert.deepEqual(finding, {
    status: "valid",
    value: "https://de.pinterest.com/pin/987654321/?utm_source=share",
    start: 4,
    end: 60,
    kind: "pin",
    normalizedUrl: "https://www.pinterest.com/pin/987654321/",
  });
});

test("flags lookalike domains and insecure Pinterest URLs", () => {
  const findings = auditText(
    "https://www.pinterest.com.evil.example/pin/123/\nhttp://pinterest.com/pin/123/",
  );

  assert.equal(findings.length, 2);
  assert.equal(findings[0]?.status, "invalid");
  assert.equal(findings[1]?.status, "invalid");
});

test("recognizes already canonical URLs", () => {
  const [finding] = auditText("https://www.pinterest.com/pin/123/");

  assert.equal(finding?.status, "valid");
  if (finding?.status === "valid") {
    assert.equal(finding.value, finding.normalizedUrl);
  }
});

test("strips prose punctuation without changing the replacement range", () => {
  const [finding] = auditText("(https://pin.it/AbC123). Next");

  assert.equal(finding?.status, "valid");
  assert.equal(finding?.value, "https://pin.it/AbC123");
  assert.equal(finding?.start, 1);
  assert.equal(finding?.end, 22);
});

test("ignores unrelated URLs", () => {
  assert.deepEqual(
    auditText("https://savepinner.com/pinterest-downloader/"),
    [],
  );
});
