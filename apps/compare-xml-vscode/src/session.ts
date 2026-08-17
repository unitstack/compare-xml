import * as vscode from 'vscode';
import type { XMLCompareOptions } from '@compare-xml/core';
import {
  computeSession,
  type SessionData,
  type SourceText,
} from './core/compareSession';
import type { DiffContentProvider } from './diffContentProvider';
import { DIFF_SCHEME } from './diffContentProvider';

export interface ActiveSession {
  id: number;
  data: SessionData;
  baseUri: vscode.Uri;
  contrastUri: vscode.Uri;
  title: string;
}

export class SessionManager {
  private counter = 0;
  private active?: ActiveSession;
  private readonly onDidChangeEmitter = new vscode.EventEmitter<void>();

  /** Fired whenever the active session changes (new comparison, options change, swap). */
  readonly onDidChange = this.onDidChangeEmitter.event;

  constructor(
    private readonly provider: DiffContentProvider,
    private readonly readDefaultOptions: () => Required<XMLCompareOptions>,
  ) {}

  get current(): ActiveSession | undefined {
    return this.active;
  }

  async compare(
    base: SourceText,
    contrast: SourceText,
    options?: Required<XMLCompareOptions>,
  ): Promise<void> {
    const data = computeSession(
      base,
      contrast,
      options ?? this.readDefaultOptions(),
    );

    this.counter += 1;
    await this.apply(this.counter, data);
  }

  async swapSides(): Promise<void> {
    if (!this.active) {
      return;
    }

    const { id, data } = this.active;
    const swapped = computeSession(data.contrast, data.base, data.options);
    await this.apply(id, swapped);
  }

  async updateOptions(options: Required<XMLCompareOptions>): Promise<void> {
    if (!this.active) {
      return;
    }

    const { id, data } = this.active;
    const updated = computeSession(data.base, data.contrast, options);
    await this.apply(id, updated);
  }

  clear(): void {
    if (!this.active) {
      return;
    }

    this.active = undefined;
    void vscode.commands.executeCommand(
      'setContext',
      'compare-xml.hasActiveSession',
      false,
    );
    this.onDidChangeEmitter.fire();
  }

  private async apply(id: number, data: SessionData): Promise<void> {
    const baseUri = vscode.Uri.parse(`${DIFF_SCHEME}:/session-${id}/base.xml`);
    const contrastUri = vscode.Uri.parse(
      `${DIFF_SCHEME}:/session-${id}/contrast.xml`,
    );
    const title = `${data.base.label} ↔ ${data.contrast.label}`;

    this.provider.set(baseUri, data.baseAlignedText);
    this.provider.set(contrastUri, data.contrastAlignedText);

    this.active = { id, data, baseUri, contrastUri, title };
    await vscode.commands.executeCommand(
      'setContext',
      'compare-xml.hasActiveSession',
      true,
    );
    this.onDidChangeEmitter.fire();

    await vscode.commands.executeCommand(
      'vscode.diff',
      baseUri,
      contrastUri,
      title,
    );
  }
}
