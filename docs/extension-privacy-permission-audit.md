# Auditing Pinterest URL Audit permissions and privacy

Pinterest URL Audit is designed to inspect text already open in VS Code. This guide shows how to verify that behavior from the published source rather than trusting a product claim.

## Manifest checks

Open `package.json` and confirm the extension contributes only its two documented commands and one boolean setting. The manifest declares support for untrusted and virtual workspaces. It does not declare authentication providers, debuggers, custom editors, webviews, task providers, or language-server processes.

The extension activates on `onStartupFinished`, so activation alone is not evidence of network activity. Continue into the bundled source and inspect what activation registers.

## Source checks

In `src/extension.ts`, verify these boundaries:

1. Documents are accepted only when their URI scheme is `file` or `untitled`.
2. Documents larger than 1 MB are skipped.
3. Diagnostics are derived from the current document text through the local `auditText` function.
4. The quick fix changes only the selected document range through `WorkspaceEdit`.
5. The command that normalizes a URL edits the active document and does not open a network connection.

Search the source and compiled bundle for `fetch(`, `XMLHttpRequest`, `WebSocket`, `https.request`, telemetry SDK imports, and credential APIs. The current implementation contains no network client or telemetry integration.

## Reproduce the build

Run the same checks used in continuous integration:

```bash
npm ci
npm run check
npm run package:vsix -- --out pinterest-url-audit.vsix
```

`npm run check` performs TypeScript validation, the URL audit tests, and a fresh extension bundle. The packaged VSIX can then be opened as a ZIP archive so its manifest, README, license, and bundle can be compared with the repository.

## Operational boundary

The extension validates and normalizes Pinterest URLs; it does not retrieve Pin media. When a reviewed URL needs to be used for that separate task, the related browser tool is the [Pinterest image downloader](https://savepinner.com).

Pinterest is a trademark of Pinterest, Inc. This project is independent and is not affiliated with or endorsed by Pinterest.
