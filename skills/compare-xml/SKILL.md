---
name: compare-xml
description: Compare two XML files or strings and identify the differences (added, deleted, value-changed) at each path. Use when the user wants to diff XML documents, find what changed between two configs, fixtures, or API responses.
---

# compare-xml

Use `npx @compare-xml/cli` to compare two XML values and identify their differences.

## Usage

```bash
npx @compare-xml/cli <base> <contrast> [options]
```

Each positional argument can be either an inline XML string or a path to an XML file. The CLI resolves the value at runtime: if it matches an existing file, the file is read and parsed; otherwise the argument itself is parsed as XML.

## Arguments

- `<base>` — Base XML string or file path
- `<contrast>` — Contrast XML string or file path

## Options

- `-a, --array-compare-method <method>` — Array compare method, one of `byIndex` (default), `lcs`, `unordered`
  - `byIndex` — Compare arrays by index position
  - `lcs` — Minimal diff for ordered arrays via Longest Common Subsequence
  - `unordered` — Treat arrays as multisets
- `-k, --key-case-insensitive` — Case-insensitive key comparison
- `-v, --value-case-insensitive` — Case-insensitive value comparison
- `-j, --json-export` — Output as JSON instead of the default table
- `-o, --output <file>` — Write the output to a file instead of stdout

## Examples

Compare two XML strings:

```bash
npx @compare-xml/cli '<root><name>Alice</name></root>' '<root><name>Bob</name></root>'
```

Compare two XML files:

```bash
npx @compare-xml/cli base.xml contrast.xml
```

Case-insensitive keys:

```bash
npx @compare-xml/cli '<root><Name>Alice</Name></root>' '<root><name>Alice</name></root>' -k
```

LCS array comparison — minimal diff for ordered arrays:

```bash
npx @compare-xml/cli '<root><items><item>1</item><item>2</item><item>3</item></items></root>' '<root><items><item>2</item><item>3</item><item>4</item></items></root>' -a lcs
```

JSON output:

```bash
npx @compare-xml/cli base.xml contrast.xml -j
```

Save output to a file:

```bash
npx @compare-xml/cli base.xml contrast.xml -o diff.txt
```

Combine tolerance options:

```bash
npx @compare-xml/cli '<root><Name>Alice</Name></root>' '<root><name>ALICE</name></root>' -k -v
```

## Output Format

By default, results are printed as a Unicode box-drawn table. Each row is labeled with the side that owns the path: `(Base)` for value changes and deletions, `(Contrast)` for additions, and `(Root)` when the top-level value itself differs.

```
┌──────────────┬──────────────┐
│ Key          │ Change Type  │
├──────────────┼──────────────┤
│ (Base) a     │ valueChanged │
│ (Base) b     │ deleted      │
│ (Contrast) c │ added        │
└──────────────┴──────────────┘
```

When the two inputs match exactly, the output is simply `No differences found`.

With `--json-export` (`-j`), the same data is emitted as JSON:

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

## Difference Types

- `added` — Value exists in `contrast` but not in `base`
- `deleted` — Value exists in `base` but not in `contrast`
- `valueChanged` — Value changed between base and contrast
