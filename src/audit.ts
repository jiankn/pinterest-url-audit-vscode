import { parsePinterestUrl } from "pinterest-url-normalizer";

const URL_PATTERN = /https?:\/\/[^\s<>"'`]+/giu;
const TRAILING_PUNCTUATION = /[),.;:!?\]}]+$/u;

export interface ValidFinding {
  status: "valid";
  value: string;
  start: number;
  end: number;
  kind: string;
  normalizedUrl: string;
}

export interface InvalidFinding {
  status: "invalid";
  value: string;
  start: number;
  end: number;
  message: string;
}

export type AuditFinding = ValidFinding | InvalidFinding;

function isPinterestLike(value: string): boolean {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname === "pin.it" || hostname.includes("pinterest");
  } catch {
    return value.toLowerCase().includes("pinterest");
  }
}

export function auditText(text: string): AuditFinding[] {
  const findings: AuditFinding[] = [];

  for (const match of text.matchAll(URL_PATTERN)) {
    const value = match[0].replace(TRAILING_PUNCTUATION, "");
    if (!isPinterestLike(value)) continue;

    const start = match.index ?? 0;
    const end = start + value.length;

    try {
      const parsed = parsePinterestUrl(value);
      findings.push({
        status: "valid",
        value,
        start,
        end,
        kind: parsed.kind,
        normalizedUrl: parsed.normalizedUrl,
      });
    } catch (error) {
      findings.push({
        status: "invalid",
        value,
        start,
        end,
        message:
          error instanceof Error ? error.message : "Unsupported Pinterest URL",
      });
    }
  }

  return findings;
}
