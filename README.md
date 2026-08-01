# Pinterest URL Audit

Find unsafe or non-canonical Pinterest URLs directly in VS Code, then replace non-canonical links with one quick fix. All analysis runs locally without network requests.

[SavePinner](https://savepinner.com/pinterest-downloader/) · [GitHub Action](https://github.com/marketplace/actions/pinterest-url-audit) · [Python package](https://pypi.org/project/pinterest-url-normalizer/) · [TypeScript package](https://jsr.io/@savepinner/pinterest-url-normalizer)

## What it detects

- Pinterest lookalike domains such as `pinterest.com.evil.example`
- HTTP Pinterest URLs and URLs containing credentials or non-standard ports
- Unsupported Pinterest paths
- Valid URLs that contain tracking parameters or use a country domain instead of the canonical host

Supported URL kinds include Pins, `pin.it` short links, profiles, boards, and Ideas pages.

## Commands

- **Pinterest URL Audit: Scan Current File** refreshes diagnostics and reports the issue count.
- **Pinterest URL Audit: Normalize URL at Cursor** replaces the supported URL under the cursor with its canonical form.

For non-canonical URLs, VS Code also offers **Replace with canonical Pinterest URL** as a preferred quick fix.

## Example

```text
https://de.pinterest.com/pin/987654321/?utm_source=share
```

becomes:

```text
https://www.pinterest.com/pin/987654321/
```

## Privacy and security

The extension does not fetch, resolve, download, or transmit URLs. It contains no telemetry, browser automation, or remote code. Documents larger than 1 MB are skipped to keep editing responsive.

This extension is maintained by the team behind [SavePinner](https://savepinner.com/pinterest-downloader/), a browser tool for inspecting media exposed by public Pinterest Pin URLs.

Pinterest is a trademark of Pinterest, Inc. This project is independent and is not affiliated with or endorsed by Pinterest.

## License

MIT
