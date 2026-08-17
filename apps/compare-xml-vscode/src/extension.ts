import * as vscode from 'vscode';
import { CompareCommands } from './commands';
import { DIFF_SCHEME, DiffContentProvider } from './diffContentProvider';
import { DiffTreeProvider } from './diffTree';
import { readDefaultOptions } from './options';
import { SessionManager } from './session';

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel('Compare XML');
  const provider = new DiffContentProvider();
  const sessions = new SessionManager(provider, () =>
    readDefaultOptions(output),
  );
  const commands = new CompareCommands(sessions);
  const treeProvider = new DiffTreeProvider(sessions);

  context.subscriptions.push(
    output,
    vscode.workspace.registerTextDocumentContentProvider(DIFF_SCHEME, provider),
    vscode.window.registerTreeDataProvider('compare-xml.diffs', treeProvider),
    vscode.commands.registerCommand(
      'compare-xml.compareWith',
      (uri?: vscode.Uri) => commands.compareWith(uri),
    ),
    vscode.commands.registerCommand(
      'compare-xml.selectForCompare',
      (uri?: vscode.Uri) => commands.selectForCompare(uri),
    ),
    vscode.commands.registerCommand(
      'compare-xml.compareWithSelected',
      (uri?: vscode.Uri) => commands.compareWithSelected(uri),
    ),
    vscode.commands.registerCommand('compare-xml.configureOptions', () =>
      commands.configureOptions(),
    ),
    vscode.commands.registerCommand('compare-xml.swapSides', () =>
      sessions.swapSides(),
    ),
    vscode.commands.registerCommand('compare-xml.clearResults', () =>
      sessions.clear(),
    ),
    vscode.commands.registerCommand(
      'compare-xml.revealDiff',
      (pathString: string) => commands.revealDiff(pathString),
    ),
  );
}

export function deactivate(): void {}
