import { describe, it, expect } from 'vitest';
import { parseXML, validateXML, compareXML, XMLValidationError } from '@/index';

describe('parseXML', () => {
  it('should parse simple XML', () => {
    const result = parseXML('<root><name>test</name></root>') as Record<
      string,
      unknown
    >;
    expect(result).toEqual({ root: { name: 'test' } });
  });

  it('should parse XML with attributes', () => {
    const result = parseXML('<root id="1"><name>test</name></root>') as Record<
      string,
      unknown
    >;
    expect(result).toEqual({ root: { '@id': 1, name: 'test' } });
  });

  it('should parse XML with array elements', () => {
    const result = parseXML(
      '<root><items><item>1</item><item>2</item></items></root>',
    ) as Record<string, unknown>;
    expect(result).toEqual({
      root: {
        items: {
          item: [1, 2],
        },
      },
    });
  });

  it('should parse XML declaration', () => {
    const result = parseXML(
      '<?xml version="1.0" encoding="UTF-8"?><root><value>test</value></root>',
    ) as Record<string, unknown>;
    expect(result).toEqual({
      '?xml': { '@version': 1, '@encoding': 'UTF-8' },
      root: { value: 'test' },
    });
  });

  it('should parse XML with CDATA', () => {
    const result = parseXML(
      '<root><content><![CDATA[<html>hello</html>]]></content></root>',
    ) as Record<string, unknown>;
    expect(result).toEqual({
      root: { content: '<html>hello</html>' },
    });
  });

  it('should parse XML with namespaces', () => {
    const result = parseXML(
      '<root xmlns:ns="http://example.com"><ns:name>test</ns:name></root>',
    ) as Record<string, unknown>;
    expect(result).toEqual({
      root: {
        '@xmlns:ns': 'http://example.com',
        'ns:name': 'test',
      },
    });
  });

  it('should parse XML with special characters', () => {
    const result = parseXML(
      '<root><text>hello &amp; world &lt;tag&gt;</text></root>',
    ) as Record<string, unknown>;
    expect(result).toEqual({
      root: { text: 'hello & world <tag>' },
    });
  });

  it('should parse XML with self-closing tags', () => {
    const result = parseXML(
      '<root><item id="1" /><item id="2" /></root>',
    ) as Record<string, unknown>;
    expect(result).toEqual({
      root: {
        item: [{ '@id': 1 }, { '@id': 2 }],
      },
    });
  });

  it('should parse XML with empty elements', () => {
    const result = parseXML('<root><empty></empty></root>') as Record<
      string,
      unknown
    >;
    expect(result).toEqual({ root: { empty: '' } });
  });

  it('should parse XML with mixed content', () => {
    const result = parseXML(
      '<root>text before<child>value</child>text after</root>',
    ) as Record<string, unknown>;
    expect(result).toEqual({
      root: {
        '#text': 'text beforetext after',
        child: 'value',
      },
    });
  });

  it('should parse XML with numeric attributes as numbers', () => {
    const result = parseXML(
      '<root count="42" rate="3.14" flag="true" />',
    ) as Record<string, unknown>;
    expect(result).toEqual({
      root: { '@count': 42, '@rate': 3.14, '@flag': true },
    });
  });

  it('should parse XML with deeply nested structure', () => {
    const result = parseXML(
      '<a><b><c><d><e>deep</e></d></c></b></a>',
    ) as Record<string, unknown>;
    expect(result).toEqual({
      a: { b: { c: { d: { e: 'deep' } } } },
    });
  });
});

describe('validateXML', () => {
  it('should not throw for valid XML', () => {
    expect(() => validateXML('<root><name>test</name></root>')).not.toThrow();
  });

  it('should throw for empty XML', () => {
    expect(() => validateXML('')).toThrow(XMLValidationError);
    expect(() => validateXML('')).toThrow('XML is empty');
  });

  it('should throw for whitespace-only XML', () => {
    expect(() => validateXML('   ')).toThrow(XMLValidationError);
    expect(() => validateXML('   ')).toThrow('XML is empty');
  });

  it('should throw for invalid XML', () => {
    expect(() => validateXML('<root><unclosed>')).toThrow(XMLValidationError);
  });

  it('should include line and col info for invalid XML', () => {
    try {
      validateXML('<root><unclosed>');
    } catch (error) {
      expect(error).toBeInstanceOf(XMLValidationError);
      expect((error as XMLValidationError).name).toBe('XMLValidationError');
      expect((error as XMLValidationError).line).toBeDefined();
      expect((error as XMLValidationError).col).toBeDefined();
    }
  });
});

describe('compareXML', () => {
  it('should return empty for identical XML', () => {
    const result = compareXML({
      baseXML: '<root><name>test</name></root>',
      contrastXML: '<root><name>test</name></root>',
    });
    expect(result).toEqual([]);
  });

  it('should detect added elements', () => {
    const result = compareXML({
      baseXML: '<root><a>1</a></root>',
      contrastXML: '<root><a>1</a><b>2</b></root>',
    });
    expect(result).toEqual([
      {
        pathSegments: ['root', 'b'],
        pathString: 'root.b',
        pathBelongsTo: 'contrast',
        diffType: 'added',
      },
    ]);
  });

  it('should detect removed elements', () => {
    const result = compareXML({
      baseXML: '<root><a>1</a><b>2</b></root>',
      contrastXML: '<root><a>1</a></root>',
    });
    expect(result).toEqual([
      {
        pathSegments: ['root', 'b'],
        pathString: 'root.b',
        pathBelongsTo: 'base',
        diffType: 'deleted',
      },
    ]);
  });

  it('should detect value changes', () => {
    const result = compareXML({
      baseXML: '<root><name>old</name></root>',
      contrastXML: '<root><name>new</name></root>',
    });
    expect(result).toEqual([
      {
        pathSegments: ['root', 'name'],
        pathString: 'root.name',
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
    ]);
  });

  it('should detect attribute changes', () => {
    const result = compareXML({
      baseXML: '<root id="1"><name>test</name></root>',
      contrastXML: '<root id="2"><name>test</name></root>',
    });
    expect(result).toEqual([
      {
        pathSegments: ['root', '@id'],
        pathString: 'root.@id',
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
    ]);
  });

  it('should detect added attributes', () => {
    const result = compareXML({
      baseXML: '<root><name>test</name></root>',
      contrastXML: '<root id="1"><name>test</name></root>',
    });
    expect(result).toEqual([
      {
        pathSegments: ['root', '@id'],
        pathString: 'root.@id',
        pathBelongsTo: 'contrast',
        diffType: 'added',
      },
    ]);
  });

  it('should handle array comparison with byIndex method', () => {
    const result = compareXML({
      baseXML:
        '<root><items><item>1</item><item>2</item><item>3</item></items></root>',
      contrastXML: '<root><items><item>1</item><item>2</item></items></root>',
    });
    expect(result).toEqual([
      {
        pathSegments: ['root', 'items', 'item', '[2]'],
        pathString: 'root.items.item[2]',
        pathBelongsTo: 'base',
        diffType: 'deleted',
      },
    ]);
  });

  it('should work with options', () => {
    const result = compareXML({
      baseXML: '<root><NAME>Alice</NAME></root>',
      contrastXML: '<root><name>alice</name></root>',
      options: {
        keyCaseInsensitive: true,
        valueCaseInsensitive: true,
      },
    });
    expect(result).toEqual([]);
  });

  it('should detect nested differences', () => {
    const result = compareXML({
      baseXML: '<root><user><name>old</name><age>20</age></user></root>',
      contrastXML: '<root><user><name>new</name><age>20</age></user></root>',
    });
    expect(result).toEqual([
      {
        pathSegments: ['root', 'user', 'name'],
        pathString: 'root.user.name',
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
    ]);
  });

  it('should throw XMLValidationError when base XML is invalid', () => {
    expect(() =>
      compareXML({
        baseXML: '<unclosed',
        contrastXML: '<root><a>1</a></root>',
      }),
    ).toThrow(XMLValidationError);
  });

  it('should throw XMLValidationError when contrast XML is invalid', () => {
    expect(() =>
      compareXML({
        baseXML: '<root><a>1</a></root>',
        contrastXML: '<unclosed',
      }),
    ).toThrow(XMLValidationError);
  });

  it('should include parse error details for invalid base XML', () => {
    expect(() =>
      compareXML({
        baseXML: '<unclosed',
        contrastXML: '<root/>',
      }),
    ).toThrow(/Failed to parse base XML/);
  });

  it('should include parse error details for invalid contrast XML', () => {
    expect(() =>
      compareXML({
        baseXML: '<root/>',
        contrastXML: '<unclosed',
      }),
    ).toThrow(/Failed to parse contrast XML/);
  });

  it('should handle XML with CDATA differences', () => {
    const result = compareXML({
      baseXML: '<root><content><![CDATA[old data]]></content></root>',
      contrastXML: '<root><content><![CDATA[new data]]></content></root>',
    });
    expect(result).toEqual([
      {
        pathSegments: ['root', 'content'],
        pathString: 'root.content',
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
    ]);
  });

  it('should handle XML with namespace differences', () => {
    const result = compareXML({
      baseXML: '<root xmlns:ns="http://old.com"><ns:name>test</ns:name></root>',
      contrastXML:
        '<root xmlns:ns="http://new.com"><ns:name>test</ns:name></root>',
    });
    expect(result).toEqual([
      {
        pathSegments: ['root', '@xmlns:ns'],
        pathString: 'root.@xmlns:ns',
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
    ]);
  });
});
