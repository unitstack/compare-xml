import * as path from 'path';
import * as vscode from 'vscode';
import type {
  XMLArrayCompareMethod,
  XMLCompareOptions,
} from '@compare-xml/core';
import type { SourceText } from './core/compareSession';
import type { SessionManager } from './session';

const HAS_SELECTED_CONTEXT = 'compare-xml.hasSelected';

export class CompareCommands {
  private selectedForCompare?: vscode.Uri;

  constructor(private readonly sessions: SessionManager) {}

  async compareWith(uri?: vscode.Uri): Promise<void> {
    const baseUri = uri ?? vscode.window.activeTextEditor?.document.uri;

    if (!baseUri) {
      vscode.window.showWarningMessage(
        'Compare XML: no active editor to compare.',
      );
      return;
    }

    const base = await this.sourceFromUri(baseUri);

    if (!base) {
      return;
    }

    const contrast = await this.pickContrastSource(base.label, baseUri);

    if (contrast) {
      await this.runCompare(base, contrast);
    }
  }

  async selectForCompare(uri?: vscode.Uri): Promise<void> {
    this.selectedForCompare =
      uri ?? vscode.window.activeTextEditor?.document.uri;
    await vscode.commands.executeCommand(
      'setContext',
      HAS_SELECTED_CONTEXT,
      true,
    );

    if (this.selectedForCompare) {
      vscode.window.showInformationMessage(
        `Compare XML: selected ${path.basename(this.selectedForCompare.path)} for comparison.`,
      );
    }
  }

  async compareWithSelected(uri?: vscode.Uri): Promise<void> {
    const contrastUri = uri ?? vscode.window.activeTextEditor?.document.uri;

    if (!this.selectedForCompare || !contrastUri) {
      vscode.window.showWarningMessage(
        'Compare XML: select a file for comparison first.',
      );
      return;
    }

    const base = await this.sourceFromUri(this.selectedForCompare);
    const contrast = await this.sourceFromUri(contrastUri);

    if (base && contrast) {
      await this.runCompare(base, contrast);
    }
  }

  async configureOptions(): Promise<void> {
    const session = this.sessions.current;

    if (!session) {
      vscode.window.showInformationMessage(
        'Compare XML: no active comparison.',
      );
      return;
    }

    const current = session.data.options;
    type OptionKey = keyof Required<XMLCompareOptions>;
    interface OptionPick extends vscode.QuickPickItem {
      key: OptionKey;
    }

    const picks: OptionPick[] = [
      {
        label: 'Array compare method',
        description: current.arrayCompareMethod,
        key: 'arrayCompareMethod',
      },
      {
        label: 'Ignore key case',
        description: String(current.keyCaseInsensitive),
        key: 'keyCaseInsensitive',
      },
      {
        label: 'Ignore value case',
        description: String(current.valueCaseInsensitive),
        key: 'valueCaseInsensitive',
      },
    ];

    const picked = await vscode.window.showQuickPick(picks, {
      placeHolder: 'Select an option to change',
    });

    if (!picked) {
      return;
    }

    let options: Required<XMLCompareOptions>;

    if (picked.key === 'arrayCompareMethod') {
      const method = await vscode.window.showQuickPick(
        ['byIndex', 'lcs', 'unordered'],
        {
          placeHolder: 'Array compare method',
        },
      );

      if (!method) {
        return;
      }

      options = {
        ...current,
        arrayCompareMethod: method as XMLArrayCompareMethod,
      };
    } else {
      options = { ...current, [picked.key]: !current[picked.key] };
    }

    await this.sessions.updateOptions(options);
  }

  async revealDiff(pathString: string): Promise<void> {
    const session = this.sessions.current;
    const line = session?.data.lineMap.get(pathString);

    if (!session || !line) {
      return;
    }

    const selection = new vscode.Range(line - 1, 0, line - 1, 0);
    await vscode.commands.executeCommand(
      'vscode.diff',
      session.baseUri,
      session.contrastUri,
      session.title,
      { selection },
    );
  }

  private async runCompare(
    base: SourceText,
    contrast: SourceText,
  ): Promise<void> {
    try {
      await this.sessions.compare(base, contrast);
    } catch (error) {
      vscode.window.showErrorMessage(
        `Compare XML: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async sourceFromUri(
    uri: vscode.Uri | undefined,
  ): Promise<SourceText | undefined> {
    if (!uri) {
      return undefined;
    }

    const label = path.basename(uri.path);
    const openDocument = vscode.workspace.textDocuments.find(
      (doc) => doc.uri.toString() === uri.toString(),
    );

    if (openDocument) {
      return { label, text: openDocument.getText() };
    }

    try {
      const bytes = await vscode.workspace.fs.readFile(uri);
      return { label, text: Buffer.from(bytes).toString('utf8') };
    } catch {
      vscode.window.showErrorMessage(`Compare XML: cannot read ${label}.`);
      return undefined;
    }
  }

  private async pickContrastSource(
    baseLabel: string,
    baseUri: vscode.Uri,
  ): Promise<SourceText | undefined> {
    interface SourcePick extends vscode.QuickPickItem {
      action: 'editor' | 'file' | 'clipboard';
      uri?: vscode.Uri;
    }

    const editorItems: SourcePick[] = vscode.workspace.textDocuments
      .filter(
        (doc) =>
          (doc.uri.scheme === 'file' || doc.uri.scheme === 'untitled') &&
          doc.uri.toString() !== baseUri.toString(),
      )
      .map((doc) => ({
        label:
          doc.uri.scheme === 'untitled'
            ? `Untitled (${path.basename(doc.uri.path)})`
            : path.basename(doc.uri.path),
        description:
          doc.uri.scheme === 'file' ? doc.uri.fsPath : doc.uri.toString(),
        action: 'editor' as const,
        uri: doc.uri,
      }));

    const picked = await vscode.window.showQuickPick<SourcePick>(
      [
        ...editorItems,
        { label: '$(file) Browse for file...', action: 'file' },
        { label: '$(clippy) Clipboard', action: 'clipboard' },
      ],
      { placeHolder: `Compare ${baseLabel} with...` },
    );

    if (!picked) {
      return undefined;
    }

    if (picked.action === 'editor' && picked.uri) {
      return this.sourceFromUri(picked.uri);
    }

    if (picked.action === 'file') {
      const uris = await vscode.window.showOpenDialog({
        canSelectMany: false,
        filters: { XML: ['xml'] },
      });

      return uris?.[0] ? this.sourceFromUri(uris[0]) : undefined;
    }

    const text = await vscode.env.clipboard.readText();

    if (!text.trim()) {
      vscode.window.showWarningMessage('Compare XML: clipboard is empty.');
      return undefined;
    }

    return { label: 'Clipboard', text };
  }
}
