import * as vscode from 'vscode';

export const DIFF_SCHEME = 'compare-xml';

export class DiffContentProvider implements vscode.TextDocumentContentProvider {
  private readonly contents = new Map<string, string>();
  private readonly onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();

  readonly onDidChange = this.onDidChangeEmitter.event;

  set(uri: vscode.Uri, text: string): void {
    this.contents.set(uri.toString(), text);
    this.onDidChangeEmitter.fire(uri);
  }

  provideTextDocumentContent(uri: vscode.Uri): string {
    return this.contents.get(uri.toString()) ?? '';
  }
}
