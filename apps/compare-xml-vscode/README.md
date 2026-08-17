# Compare XML for VSCode

Semantic XML comparison inside your editor — find what changed between two XML documents, with control over how elements, attributes, values, and repeated child elements are matched. Powered by [`@compare-xml/core`](https://github.com/unitstack/compare-xml).

> Online playground: **[comparexml.com](https://comparexml.com)**

## Features

- **Compare anything XML**: the active editor against another open editor, a file on disk, or the clipboard.
- **Aligned diff view**: results open in VSCode's native diff editor, with both sides padded so corresponding elements line up — even when whole blocks were added or removed.
- **Difference navigator**: a sidebar view groups every difference by kind — Added, Deleted, Value Changed — and jumps to it on click.
- **Semantic options** (from the command `Compare XML: Configure Comparison Options`, or as workspace defaults):
  - `compare-xml.arrayCompareMethod` — `byIndex` (default), `lcs` (minimal diff), or `unordered` (multiset match)
  - `compare-xml.keyCaseInsensitive` — ignore element/attribute name case (default `false`)
  - `compare-xml.valueCaseInsensitive` — ignore text/attribute value case (default `false`)

## Usage

1. Open an XML file.
2. Run **Compare XML: Compare Active Editor with...** from the command palette (or the editor title menu) and pick what to compare against.
3. Browse the differences in the **Compare XML** sidebar; click one to jump to it.

You can also right-click a `.xml` file in the explorer and use **Select for Compare**, then **Compare with Selected** on the second file — the same flow as VSCode's built-in file compare.

## License

MIT
