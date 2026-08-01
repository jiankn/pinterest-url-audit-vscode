import * as vscode from "vscode";

import { auditText, type AuditFinding } from "./audit.js";

const DIAGNOSTIC_SOURCE = "Pinterest URL Audit";
const NON_CANONICAL_CODE = "non-canonical";
const MAX_DOCUMENT_LENGTH = 1_000_000;

function findingRange(
  document: vscode.TextDocument,
  finding: AuditFinding,
): vscode.Range {
  return new vscode.Range(
    document.positionAt(finding.start),
    document.positionAt(finding.end),
  );
}

function diagnosticsFor(document: vscode.TextDocument): vscode.Diagnostic[] {
  const text = document.getText();
  if (text.length > MAX_DOCUMENT_LENGTH) return [];

  return auditText(text).flatMap((finding) => {
    const range = findingRange(document, finding);

    if (finding.status === "invalid") {
      const diagnostic = new vscode.Diagnostic(
        range,
        `Invalid or unsupported Pinterest URL: ${finding.message}`,
        vscode.DiagnosticSeverity.Error,
      );
      diagnostic.source = DIAGNOSTIC_SOURCE;
      diagnostic.code = "invalid-url";
      return [diagnostic];
    }

    if (finding.value === finding.normalizedUrl) return [];

    const diagnostic = new vscode.Diagnostic(
      range,
      `Use canonical Pinterest URL: ${finding.normalizedUrl}`,
      vscode.DiagnosticSeverity.Warning,
    );
    diagnostic.source = DIAGNOSTIC_SOURCE;
    diagnostic.code = NON_CANONICAL_CODE;
    return [diagnostic];
  });
}

function isAuditable(document: vscode.TextDocument): boolean {
  return document.uri.scheme === "file" || document.uri.scheme === "untitled";
}

class PinterestUrlQuickFixProvider implements vscode.CodeActionProvider {
  static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

  provideCodeActions(
    document: vscode.TextDocument,
    _range: vscode.Range,
    context: vscode.CodeActionContext,
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];

    for (const diagnostic of context.diagnostics) {
      if (
        diagnostic.source !== DIAGNOSTIC_SOURCE ||
        diagnostic.code !== NON_CANONICAL_CODE
      ) {
        continue;
      }

      const value = document.getText(diagnostic.range);
      const finding = auditText(value)[0];
      if (!finding || finding.status !== "valid") continue;

      const action = new vscode.CodeAction(
        "Replace with canonical Pinterest URL",
        vscode.CodeActionKind.QuickFix,
      );
      action.diagnostics = [diagnostic];
      action.isPreferred = true;
      action.edit = new vscode.WorkspaceEdit();
      action.edit.replace(document.uri, diagnostic.range, finding.normalizedUrl);
      actions.push(action);
    }

    return actions;
  }
}

export function activate(context: vscode.ExtensionContext): void {
  const diagnostics = vscode.languages.createDiagnosticCollection(
    "pinterestUrlAudit",
  );
  context.subscriptions.push(diagnostics);

  const refresh = (document: vscode.TextDocument): void => {
    if (!isAuditable(document)) return;
    const enabled = vscode.workspace
      .getConfiguration("pinterestUrlAudit", document.uri)
      .get<boolean>("enableDiagnostics", true);
    diagnostics.set(document.uri, enabled ? diagnosticsFor(document) : []);
  };

  const refreshVisibleDocuments = (): void => {
    for (const editor of vscode.window.visibleTextEditors) {
      refresh(editor.document);
    }
  };

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(refresh),
    vscode.workspace.onDidChangeTextDocument(({ document }) => refresh(document)),
    vscode.workspace.onDidCloseTextDocument((document) =>
      diagnostics.delete(document.uri),
    ),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("pinterestUrlAudit.enableDiagnostics")) {
        refreshVisibleDocuments();
      }
    }),
    vscode.commands.registerCommand("pinterestUrlAudit.scanDocument", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        void vscode.window.showInformationMessage("Open a text file to scan.");
        return;
      }

      refresh(editor.document);
      const count = diagnostics.get(editor.document.uri)?.length ?? 0;
      void vscode.window.showInformationMessage(
        count === 0
          ? "Pinterest URL Audit found no issues."
          : `Pinterest URL Audit found ${count} issue${count === 1 ? "" : "s"}.`,
      );
    }),
    vscode.commands.registerCommand("pinterestUrlAudit.normalizeAtCursor", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const offset = editor.document.offsetAt(editor.selection.active);
      const finding = auditText(editor.document.getText()).find(
        (candidate) =>
          candidate.status === "valid" &&
          candidate.start <= offset &&
          offset <= candidate.end,
      );

      if (!finding || finding.status !== "valid") {
        void vscode.window.showInformationMessage(
          "Place the cursor inside a supported Pinterest URL.",
        );
        return;
      }

      if (finding.value === finding.normalizedUrl) {
        void vscode.window.showInformationMessage(
          "This Pinterest URL is already canonical.",
        );
        return;
      }

      await editor.edit((edit) => {
        edit.replace(findingRange(editor.document, finding), finding.normalizedUrl);
      });
    }),
    vscode.languages.registerCodeActionsProvider(
      [{ scheme: "file" }, { scheme: "untitled" }],
      new PinterestUrlQuickFixProvider(),
      { providedCodeActionKinds: PinterestUrlQuickFixProvider.providedCodeActionKinds },
    ),
  );

  refreshVisibleDocuments();
}

export function deactivate(): void {}
