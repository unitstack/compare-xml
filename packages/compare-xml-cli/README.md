# @compare-xml/cli

A command-line tool and [MCP](https://modelcontextprotocol.io) server for comparing XML files or strings. Built on top of [@compare-xml/core](https://www.npmjs.com/package/@compare-xml/core).

## Online Playground

Try it out at [https://comparexml.com](https://comparexml.com)

## Installation

```bash
# npm
npm install -g @compare-xml/cli

# yarn
yarn global add @compare-xml/cli

# pnpm
pnpm add -g @compare-xml/cli
```

## CLI

### Quick Start

```bash
# View help
compare-xml --help

# Compare two XML strings
compare-xml '<root><a>1</a></root>' '<root><a>2</a></root>'

# Compare two XML files
compare-xml file1.xml file2.xml

# Output as JSON format
compare-xml file1.xml file2.xml --json-export

# Save output to file
compare-xml file1.xml file2.xml -o output.txt

# Start the MCP server (stdio transport)
compare-xml --mcp
```

### Usage

```
compare-xml [base] [contrast] [options]
```

Each positional argument can be either an inline XML string or a path to an XML file. The CLI inspects the value: if it resolves to an existing file, the file content is parsed; otherwise the argument itself is parsed as XML. If neither `base` nor `contrast` is provided (and `--mcp` is not set), help is printed.

#### Arguments

| Argument | Description |
|----------|-------------|
| `[base]` | Base XML string or file path |
| `[contrast]` | Contrast XML string or file path |

#### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--array-compare-method <method>` | `-a` | Array compare method: `byIndex`, `lcs`, `unordered` | `byIndex` |
| `--key-case-insensitive` | `-k` | Case-insensitive key comparison | `false` |
| `--value-case-insensitive` | `-v` | Case-insensitive value comparison | `false` |
| `--json-export` | `-j` | Output as JSON format | `false` |
| `--output <file>` | `-o` | Write output to a file instead of stdout | – |
| `--mcp` | – | Run as an MCP server via stdio | `false` |
| `--version` | `-V` | Print the CLI version | – |
| `--help` | `-h` | Print help | – |

### Examples

#### Basic Comparison

```bash
compare-xml '<root><name>Alice</name><age>30</age></root>' '<root><name>Bob</name><age>30</age></root>'
```

Output:
```
┌──────────────────┬──────────────┐
│ Key              │ Change Type  │
├──────────────────┼──────────────┤
│ (Base) root.name │ valueChanged │
└──────────────────┴──────────────┘
```

#### Compare Files

```bash
compare-xml base.xml contrast.xml
```

#### Array Comparison Methods

```bash
# By index (default)
compare-xml '<root><items><item>1</item><item>2</item><item>3</item></items></root>' '<root><items><item>2</item><item>3</item><item>4</item></items></root>'

# LCS — minimal diff for ordered arrays
compare-xml '<root><items><item>1</item><item>2</item><item>3</item></items></root>' '<root><items><item>2</item><item>3</item><item>4</item></items></root>' -a lcs
compare-xml '<root><items><item>1</item><item>2</item><item>3</item></items></root>' '<root><items><item>2</item><item>3</item><item>4</item></items></root>' --array-compare-method lcs

# Unordered — treat as multisets
compare-xml '<root><items><item>1</item><item>2</item><item>3</item></items></root>' '<root><items><item>3</item><item>2</item><item>1</item></items></root>' -a unordered
compare-xml '<root><items><item>1</item><item>2</item><item>3</item></items></root>' '<root><items><item>3</item><item>2</item><item>1</item></items></root>' --array-compare-method unordered
```

#### Case-Insensitive Comparison

```bash
# Case-insensitive keys
compare-xml '<root><Name>Alice</Name></root>' '<root><name>Alice</name></root>' -k
compare-xml '<root><Name>Alice</Name></root>' '<root><name>Alice</name></root>' --key-case-insensitive

# Case-insensitive values
compare-xml '<root><status>OK</status></root>' '<root><status>ok</status></root>' -v
compare-xml '<root><status>OK</status></root>' '<root><status>ok</status></root>' --value-case-insensitive
```

#### JSON Output

```bash
compare-xml file1.xml file2.xml -j
compare-xml file1.xml file2.xml --json-export
```

Output:
```json
[
  {
    "pathSegments": ["root", "name"],
    "pathString": "root.name",
    "pathBelongsTo": "both",
    "diffType": "valueChanged"
  }
]
```

#### Save to File

```bash
# Save table format
compare-xml file1.xml file2.xml -o diff.txt

# Save JSON format
compare-xml file1.xml file2.xml -j -o diff.json
```

When `-o` is set, the CLI writes the formatted result to the file and prints `Output written to <path>` to stdout.

### Output Format

#### Table Format (Default)

A Unicode box-drawn table. Each row is labeled with the side that owns the path:

- `(Base) <path>` — the path exists on the base side (value changes, deletions).
- `(Contrast) <path>` — the path exists only on the contrast side (additions).
- `(Root)` — used when the top-level value itself differs.

```
┌───────────────────┬──────────────┐
│ Key               │ Change Type  │
├───────────────────┼──────────────┤
│ (Base) root.a     │ valueChanged │
│ (Base) root.b     │ deleted      │
│ (Contrast) root.c │ added        │
└───────────────────┴──────────────┘
```

When the two inputs match exactly, the output is simply:

```
No differences found
```

#### JSON Format

```json
[
  {
    "pathSegments": ["root", "name"],
    "pathString": "root.name",
    "pathBelongsTo": "both",
    "diffType": "valueChanged"
  },
  {
    "pathSegments": ["root", "age"],
    "pathString": "root.age",
    "pathBelongsTo": "base",
    "diffType": "deleted"
  },
  {
    "pathSegments": ["root", "email"],
    "pathString": "root.email",
    "pathBelongsTo": "contrast",
    "diffType": "added"
  }
]
```

See [`XMLValueDifference`](https://www.npmjs.com/package/@compare-xml/core#xmlvaluedifference) in `@compare-xml/core` for the full shape.

### Difference Types

| Type | Description |
|------|-------------|
| `added` | Value exists in `contrast` but not in `base`. |
| `deleted` | Value exists in `base` but not in `contrast`. |
| `valueChanged` | Value changed between base and contrast. |

## MCP Server

`@compare-xml/cli` also ships an [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that exposes the comparison engine as a tool for AI assistants.

### Start the MCP Server

```bash
# from a global install
compare-xml --mcp

# or via npx
npx @compare-xml/cli --mcp
```

The server communicates over stdio.

### Available Tools

#### `compare_xml`

Compare two XML values and return their differences.

**Input parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `baseXML` | `string` | conditional | Base XML string. |
| `baseXMLString` | `string` | conditional | Base XML as a string (same as `baseXML`). |
| `baseXMLFilePath` | `string` | conditional | Path to a base XML file (read and parsed by the server). |
| `contrastXML` | `string` | conditional | Contrast XML string. |
| `contrastXMLString` | `string` | conditional | Contrast XML as a string (same as `contrastXML`). |
| `contrastXMLFilePath` | `string` | conditional | Path to a contrast XML file. |
| `options` | `object` | No | Comparison options (see below). |

At least one of `baseXML` / `baseXMLString` / `baseXMLFilePath` must be provided, and at least one of `contrastXML` / `contrastXMLString` / `contrastXMLFilePath`. When more than one is set for a side, file path takes precedence, then string, then raw value.

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `arrayCompareMethod` | `'byIndex' \| 'lcs' \| 'unordered'` | `'byIndex'` | Array comparison strategy. |
| `keyCaseInsensitive` | `boolean` | `false` | Case-insensitive key comparison. |
| `valueCaseInsensitive` | `boolean` | `false` | Case-insensitive value comparison. |

**Output:**

Returns `structuredContent.differences` — an array of `XMLValueDifference` objects — and a `content[0].text` mirror of the same data as JSON text.

```json
{
  "differences": [
    {
      "pathSegments": ["root", "name"],
      "pathString": "root.name",
      "pathBelongsTo": "both",
      "diffType": "valueChanged"
    }
  ]
}
```

### MCP Client Configuration

Add the following to your MCP client config (e.g. `mcp.json`):

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

## License

MIT
