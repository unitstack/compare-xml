import * as vscode from 'vscode';
import type { XMLValueDifference, XMLValueDiffType } from '@compare-xml/core';
import type { SessionManager } from './session';

const CATEGORY_ORDER: readonly XMLValueDiffType[] = [
  'added',
  'deleted',
  'valueChanged',
];

const CATEGORY_LABELS: Record<XMLValueDiffType, string> = {
  added: 'Added',
  deleted: 'Deleted',
  valueChanged: 'Value Changed',
};

const CATEGORY_ICONS: Record<XMLValueDiffType, string> = {
  added: 'diff-added',
  deleted: 'diff-removed',
  valueChanged: 'diff-modified',
};

type Node =
  | {
      kind: 'category';
      diffType: XMLValueDiffType;
      diffs: XMLValueDifference[];
    }
  | { kind: 'diff'; diff: XMLValueDifference };

export class DiffTreeProvider implements vscode.TreeDataProvider<Node> {
  constructor(private readonly sessions: SessionManager) {}

  get onDidChangeTreeData(): vscode.Event<void> {
    return this.sessions.onDidChange;
  }

  getTreeItem(node: Node): vscode.TreeItem {
    if (node.kind === 'category') {
      const item = new vscode.TreeItem(
        `${CATEGORY_LABELS[node.diffType]} (${node.diffs.length})`,
        vscode.TreeItemCollapsibleState.Expanded,
      );
      item.iconPath = new vscode.ThemeIcon(CATEGORY_ICONS[node.diffType]);
      return item;
    }

    const item = new vscode.TreeItem(
      node.diff.pathString || '(root)',
      vscode.TreeItemCollapsibleState.None,
    );
    item.description =
      node.diff.pathBelongsTo === 'both' ? undefined : node.diff.pathBelongsTo;
    item.iconPath = new vscode.ThemeIcon(CATEGORY_ICONS[node.diff.diffType]);
    item.command = {
      command: 'compare-xml.revealDiff',
      title: 'Reveal Difference',
      arguments: [node.diff.pathString],
    };
    return item;
  }

  getChildren(node?: Node): Node[] {
    const session = this.sessions.current;

    if (!session) {
      return [];
    }

    if (!node) {
      return CATEGORY_ORDER.map((diffType) => ({
        diffType,
        diffs: session.data.differences.filter(
          (diff) => diff.diffType === diffType,
        ),
      }))
        .filter((category) => category.diffs.length > 0)
        .map((category) => ({
          kind: 'category' as const,
          diffType: category.diffType,
          diffs: category.diffs,
        }));
    }

    if (node.kind === 'category') {
      return node.diffs.map((diff) => ({ kind: 'diff' as const, diff }));
    }

    return [];
  }
}
