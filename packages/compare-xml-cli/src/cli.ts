#!/usr/bin/env node
import { Command } from 'commander';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { CompareOptions } from './compare';
import { compare } from './compare';
import { createServer } from './mcp/server';
import { getPkgVersion } from './utils';

const program = new Command();

program
  .name('compare-xml')
  .version(getPkgVersion())
  .description('Compare two XML files or strings')
  .argument('[base]', 'Base XML string or file path')
  .argument('[contrast]', 'Contrast XML string or file path')
  .option(
    '-a, --array-compare-method <method>',
    'Array compare method: byIndex, lcs, unordered',
    'byIndex',
  )
  .option('-k, --key-case-insensitive', 'Case insensitive key comparison')
  .option('-v, --value-case-insensitive', 'Case insensitive value comparison')
  .option('-j, --json-export', 'Output as JSON format')
  .option('-o, --output <file>', 'Output to file')
  .option('--mcp', 'Run as an MCP server via stdio')
  .action(async (base, contrast, options) => {
    if (options.mcp) {
      const server = createServer();
      const transport = new StdioServerTransport();
      await server.connect(transport);
      return;
    }

    if (base === undefined || contrast === undefined) {
      program.help();
      return;
    }

    compare(base as string, contrast as string, options as CompareOptions);
  });

program.parse();
