# compare-xml

A toolkit for **structured XML comparison** — find what changed between two XML documents, with control over how keys, values, and arrays are matched.

> Online playground: **[comparexml.com](https://comparexml.com)**

## Why

Most XML diff tools either output unstructured text or hide the parts that matter (where an element was added, whether an array differs in order or in content). `compare-xml` parses XML into a structured representation and returns a list of differences — every entry carries a path, the side it belongs to (`base` / `contrast` / `both`), and the kind of change (`added`, `deleted`, `valueChanged`) — so you can render, filter, or program against it.

## Features

- **Deep comparison** of XML elements, attributes, arrays, and text values.
- **Three array comparison strategies**: `byIndex` (default), `lcs` (minimal diff via Longest Common Subsequence), and `unordered` (multiset match).
- **Case-insensitive** key and/or value matching.
- **Path tracking** with both segment-array and dot-notation forms.
- **CLI** with table or JSON output, reading from inline strings or files.
- **MCP server** built in — drop the CLI into any MCP-aware AI assistant.
- **Agent Skill** — a single skill that works in Claude Code, OpenAI Codex CLI, and OpenCode.
- Full **TypeScript** types.

## Packages

This is a pnpm workspace:

| Package | Description |
|---------|-------------|
| [`@compare-xml/core`](./packages/compare-xml-core) | Core comparison library (programmatic API). |
| [`@compare-xml/cli`](./packages/compare-xml-cli) | Command-line tool & MCP server, built on top of `core`. |

## Quick Start

### Library

```bash
npm install @compare-xml/core
```

```typescript
import { compareXML } from '@compare-xml/core';

const differences = compareXML({
  baseXML: '<user><name>Alice</name><age>30</age></user>',
  contrastXML: '<user><name>Bob</name><age>30</age><email>bob@test.com</email></user>',
});

// [
//   { pathString: 'user.name',  pathBelongsTo: 'both',     diffType: 'valueChanged', ... },
//   { pathString: 'user.email', pathBelongsTo: 'contrast', diffType: 'added',        ... },
// ]
```

See the [core README](./packages/compare-xml-core/README.md) for the full API.

### CLI

```bash
npm install -g @compare-xml/cli

compare-xml base.xml contrast.xml
```

```
┌──────────────┬──────────────┐
│ Key          │ Change Type  │
├──────────────┼──────────────┤
│ (Base) a     │ valueChanged │
│ (Base) b     │ deleted      │
│ (Contrast) c │ added        │
└──────────────┴──────────────┘
```

Use `--json-export` for machine-readable output, or `--mcp` to launch as an MCP server. See the [CLI README](./packages/compare-xml-cli/README.md) for all flags and the MCP tool schema.

### MCP

```json
{
  "mcpServers": {
    "compare-xml": {
      "command": "npx",
      "args": ["@compare-xml/cli@latest", "--mcp"]
    }
  }
}
```

### Skill

A single [`SKILL.md`](./skills/compare-xml/SKILL.md) teaches AI coding assistants how to invoke the CLI on demand. The file follows the open [Agent Skills](https://github.com/anthropics/skills) format and works across Claude Code, OpenAI Codex CLI, OpenCode, Cursor, and 50+ others.

The fastest install is [`npx skills`](https://github.com/vercel-labs/skills) — it auto-detects every agent you have installed and drops the skill into each one:

```bash
npx skills add unitstack/compare-xml
```

## Development

Requires Node.js ≥ 20 and pnpm.

```bash
# install dependencies
pnpm install

# build all packages
pnpm -r build

# run tests across the workspace
pnpm -r test

# lint
pnpm -r lint
```

The repo layout:

```
packages/
├── compare-xml-core/     # @compare-xml/core — library
├── compare-xml-cli/      # @compare-xml/cli  — CLI + MCP server
└── internal/             # shared eslint/tsconfig (not published)
skills/
└── compare-xml/          # SKILL.md for Claude Code / Codex CLI / OpenCode
```

## License

MIT
