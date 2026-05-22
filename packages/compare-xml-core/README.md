# @compare-xml/core

A lightweight TypeScript library for deep comparison of XML documents. Detects additions, deletions, and value changes between two XML structures with fine-grained control over comparison behavior.

## Online Playground

Try it out at [https://comparexml.com](https://comparexml.com)

## Installation

```bash
# npm
npm install @compare-xml/core

# yarn
yarn add @compare-xml/core

# pnpm
pnpm add @compare-xml/core
```

## Quick Start

```typescript
import { compareXML } from '@compare-xml/core';

const baseXML = '<user><name>Alice</name><age>30</age><hobbies><item>reading</item></hobbies></user>';
const contrastXML = '<user><name>Bob</name><age>30</age><hobbies><item>reading</item><item>coding</item></hobbies><email>bob@test.com</email></user>';

const differences = compareXML({ baseXML, contrastXML });

console.log(differences);
// [
//   {
//     pathSegments: ['user', 'name'],
//     pathString: 'user.name',
//     pathBelongsTo: 'both',
//     diffType: 'valueChanged',
//   },
//   {
//     pathSegments: ['user', 'hobbies', 'item', '[1]'],
//     pathString: 'user.hobbies.item[1]',
//     pathBelongsTo: 'contrast',
//     diffType: 'added',
//   },
//   {
//     pathSegments: ['user', 'email'],
//     pathString: 'user.email',
//     pathBelongsTo: 'contrast',
//     diffType: 'added',
//   },
// ]
```

## Examples

### Using Compare Options

```typescript
import { compareXML } from '@compare-xml/core';

// Case-insensitive key comparison
compareXML({
  baseXML: '<root><Name>Alice</Name></root>',
  contrastXML: '<root><name>Alice</name></root>',
  options: { keyCaseInsensitive: true },
});
// [] (no differences)

// Case-insensitive value comparison
compareXML({
  baseXML: '<root><status>OK</status></root>',
  contrastXML: '<root><status>ok</status></root>',
  options: { valueCaseInsensitive: true },
});
// [] (no differences)
```

### Array Comparison Methods

```typescript
import { compareXML } from '@compare-xml/core';

// 'byIndex' (default) — compares elements at the same index
compareXML({
  baseXML: '<root><items><item>1</item><item>2</item><item>3</item></items></root>',
  contrastXML: '<root><items><item>2</item><item>3</item><item>4</item></items></root>',
});

// 'lcs' — uses Longest Common Subsequence for minimal diff
compareXML({
  baseXML: '<root><items><item>1</item><item>2</item><item>3</item></items></root>',
  contrastXML: '<root><items><item>2</item><item>3</item><item>4</item></items></root>',
  options: { arrayCompareMethod: 'lcs' },
});

// 'unordered' — treats arrays as multisets, ignoring element order
compareXML({
  baseXML: '<root><items><item>1</item><item>2</item><item>3</item></items></root>',
  contrastXML: '<root><items><item>3</item><item>2</item><item>1</item></items></root>',
  options: { arrayCompareMethod: 'unordered' },
});
// [] (no differences)
```

### Formatting Paths

```typescript
import { pathSegmentsToString } from '@compare-xml/core';

pathSegmentsToString(['users', '[0]', 'name']);
// 'users[0].name'
```

## API Reference

### `compareXML`

```typescript
function compareXML(params: {
  baseXML: string;
  contrastXML: string;
  options?: XMLCompareOptions;
}): XMLValueDifference[];
```

Parses two XML strings and deeply compares their structures, returning an array of differences. Returns an empty array when the documents are equal.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `baseXML` | `string` | The base XML string (the side considered the original). |
| `contrastXML` | `string` | The XML string compared against the base. |
| `options` | `XMLCompareOptions` | Optional settings to customize comparison behavior. |

**Returns:** `XMLValueDifference[]` — array of difference objects describing each detected change.

---

### `parseXML`

```typescript
function parseXML(xml: string): unknown;
```

Parses an XML string into a JavaScript object using `fast-xml-parser`. Attributes are prefixed with `@`.

---

### `validateXML`

```typescript
function validateXML(xml: string): void;
```

Validates that a string is well-formed XML. Throws `XMLValidationError` if the XML is empty, whitespace-only, or malformed. The error includes `line` and `col` properties when available.

---

### `pathSegmentsToString`

```typescript
function pathSegmentsToString(pathSegments: string[]): string;
```

Converts a path segment array (as found in `XMLValueDifference.pathSegments`) into a human-readable dot-notation string. Array index segments (e.g. `'[0]'`) are appended without a leading dot; object key segments are joined with `.`.

```typescript
pathSegmentsToString([]);                              // ''
pathSegmentsToString(['user', 'name']);                // 'user.name'
pathSegmentsToString(['items', '[2]', 'id']);          // 'items[2].id'
```

---

### `XMLCompareOptions`

```typescript
interface XMLCompareOptions {
  arrayCompareMethod?: XMLArrayCompareMethod;
  keyCaseInsensitive?: boolean;
  valueCaseInsensitive?: boolean;
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `arrayCompareMethod` | `XMLArrayCompareMethod` | `'byIndex'` | Strategy used to compare arrays. |
| `keyCaseInsensitive` | `boolean` | `false` | When `true`, element/attribute keys are compared case-insensitively. |
| `valueCaseInsensitive` | `boolean` | `false` | When `true`, text values are compared case-insensitively. |

---

### `XMLArrayCompareMethod`

```typescript
type XMLArrayCompareMethod = 'byIndex' | 'lcs' | 'unordered';
```

| Value | Description |
|-------|-------------|
| `'byIndex'` | Compares array elements pairwise at the same index. Extra trailing elements are reported as `added`/`deleted`. |
| `'lcs'` | Uses the Longest Common Subsequence algorithm for minimal-diff detection in ordered arrays. |
| `'unordered'` | Treats arrays as multisets, matching equal elements regardless of position. |

---

### `XMLValueDiffType`

```typescript
type XMLValueDiffType = 'added' | 'deleted' | 'valueChanged';
```

| Value | Description |
|-------|-------------|
| `'added'` | Element/attribute exists in `contrastXML` but not in `baseXML`. |
| `'deleted'` | Element/attribute exists in `baseXML` but not in `contrastXML`. |
| `'valueChanged'` | The value changed between base and contrast. |

---

### `XMLValueDifference`

```typescript
interface XMLValueDifference {
  pathSegments: string[];
  pathString: string;
  pathBelongsTo: 'base' | 'contrast' | 'both';
  diffType: XMLValueDiffType;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `pathSegments` | `string[]` | Path to the differing value as segments. Element names appear as-is; array indices appear as `'[n]'` (e.g. `['users', '[0]', 'name']`). |
| `pathString` | `string` | Same path joined into dot-notation, with array indices kept as bracket suffixes (e.g. `'users[0].name'`). Use [`pathSegmentsToString`](#pathsegmentstostring) to reproduce this format. |
| `pathBelongsTo` | `'base' \| 'contrast' \| 'both'` | Side that owns the path. `'base'` for `deleted`, `'contrast'` for `added`, `'both'` for `valueChanged`. |
| `diffType` | `XMLValueDiffType` | Kind of difference detected at this path. |

### `XMLValidationError`

```typescript
class XMLValidationError extends Error {
  line?: number;
  col?: number;
}
```

Thrown by `validateXML` and `compareXML` when XML parsing fails. The `line` and `col` properties are available when the underlying parser provides position information.

## License

MIT
