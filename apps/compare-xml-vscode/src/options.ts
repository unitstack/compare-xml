import * as vscode from 'vscode';
import type {
  XMLArrayCompareMethod,
  XMLCompareOptions,
} from '@compare-xml/core';

const ARRAY_COMPARE_METHODS: readonly XMLArrayCompareMethod[] = [
  'byIndex',
  'lcs',
  'unordered',
];

export function readDefaultOptions(
  output: vscode.OutputChannel,
): Required<XMLCompareOptions> {
  const config = vscode.workspace.getConfiguration('compare-xml');
  const configuredMethod = config.get<string>('arrayCompareMethod', 'byIndex');
  const isValidMethod = (ARRAY_COMPARE_METHODS as readonly string[]).includes(
    configuredMethod,
  );

  if (!isValidMethod) {
    output.appendLine(
      `[compare-xml] Invalid arrayCompareMethod "${configuredMethod}", falling back to "byIndex".`,
    );
  }

  return {
    arrayCompareMethod: isValidMethod
      ? (configuredMethod as XMLArrayCompareMethod)
      : 'byIndex',
    keyCaseInsensitive: config.get<boolean>('keyCaseInsensitive', false),
    valueCaseInsensitive: config.get<boolean>('valueCaseInsensitive', false),
  };
}
