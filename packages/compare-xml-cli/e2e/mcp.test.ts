import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { writeFileSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
import { Client } from '@modelcontextprotocol/sdk/client';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { XMLValueDifference } from '@compare-xml/core';

const CLI_PATH = join(__dirname, '../dist/cli.js');

function createMCPClient() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: [CLI_PATH, '--mcp'],
  });

  const client = new Client(
    { name: 'test-client', version: '1.0.0' },
    { capabilities: {} },
  );

  return { client, transport };
}

beforeAll(() => {
  mkdirSync(join(__dirname, 'temp'), { recursive: true });
});

describe('MCP e2e', () => {
  const testFile = join(__dirname, 'temp', 'mcp-test.xml');

  afterEach(() => {
    try {
      unlinkSync(testFile);
    } catch {
      //
    }
  });

  it('should list tools', async () => {
    const { client, transport } = createMCPClient();

    try {
      await client.connect(transport);
      const tools = await client.listTools();

      expect(tools.tools).toHaveLength(1);
      expect(tools.tools[0].name).toBe('compare_xml');
    } finally {
      await client.close();
    }
  });

  it('should compare XML via tool', async () => {
    const { client, transport } = createMCPClient();

    try {
      await client.connect(transport);
      const result = await client.callTool({
        name: 'compare_xml',
        arguments: {
          baseXML: '<root><a>1</a></root>',
          contrastXML: '<root><a>2</a></root>',
        },
      });

      expect(result.structuredContent).toEqual({
        differences: [
          {
            pathString: 'root.a',
            pathSegments: ['root', 'a'],
            pathBelongsTo: 'both',
            diffType: 'valueChanged',
          },
        ],
      });

      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      const parsed = JSON.parse(text) as XMLValueDifference[];
      expect(parsed).toEqual([
        {
          pathString: 'root.a',
          pathSegments: ['root', 'a'],
          pathBelongsTo: 'both',
          diffType: 'valueChanged',
        },
      ]);
    } finally {
      await client.close();
    }
  });

  it('should compare with file paths via tool', async () => {
    const baseFile = join(__dirname, 'temp', 'base.xml');
    const contrastFile = join(__dirname, 'temp', 'contrast.xml');

    writeFileSync(baseFile, '<root><x>hello</x></root>');
    writeFileSync(contrastFile, '<root><x>world</x></root>');

    const { client, transport } = createMCPClient();

    try {
      await client.connect(transport);
      const result = await client.callTool({
        name: 'compare_xml',
        arguments: {
          baseXMLFilePath: baseFile,
          contrastXMLFilePath: contrastFile,
        },
      });

      expect(result.structuredContent).toEqual({
        differences: [
          {
            pathString: 'root.x',
            pathSegments: ['root', 'x'],
            pathBelongsTo: 'both',
            diffType: 'valueChanged',
          },
        ],
      });
    } finally {
      await client.close();
      try {
        unlinkSync(baseFile);
        unlinkSync(contrastFile);
      } catch {
        //
      }
    }
  });

  it('should compare with XML strings via tool', async () => {
    const { client, transport } = createMCPClient();

    try {
      await client.connect(transport);
      const result = await client.callTool({
        name: 'compare_xml',
        arguments: {
          baseXMLString: '<root><b>true</b></root>',
          contrastXMLString: '<root><b>false</b></root>',
        },
      });

      expect(result.structuredContent).toEqual({
        differences: [
          {
            pathString: 'root.b',
            pathSegments: ['root', 'b'],
            pathBelongsTo: 'both',
            diffType: 'valueChanged',
          },
        ],
      });
    } finally {
      await client.close();
    }
  });

  it('should compare with options via tool', async () => {
    const { client, transport } = createMCPClient();

    try {
      await client.connect(transport);
      const result = await client.callTool({
        name: 'compare_xml',
        arguments: {
          baseXML: '<root><arr><item>1</item><item>2</item></arr></root>',
          contrastXML: '<root><arr><item>2</item><item>1</item></arr></root>',
          options: { arrayCompareMethod: 'unordered' },
        },
      });

      expect(result.structuredContent).toEqual({
        differences: [],
      });
    } finally {
      await client.close();
    }
  });

  it('should error for unknown tool', async () => {
    const { client, transport } = createMCPClient();

    try {
      await client.connect(transport);
      await expect(
        client.callTool({
          name: 'unknown_tool',
          arguments: {},
        }),
      ).rejects.toThrow();
    } finally {
      await client.close();
    }
  });

  it('should error for invalid arguments', async () => {
    const { client, transport } = createMCPClient();

    try {
      await client.connect(transport);
      const result = await client.callTool({
        name: 'compare_xml',
        arguments: {
          baseXML: '<root>1</root>',
          // missing contrastXML
        },
      });
      expect(result.isError).toBe(true);
    } finally {
      await client.close();
    }
  });

  it('should error for non-existent file path', async () => {
    const { client, transport } = createMCPClient();

    try {
      await client.connect(transport);
      const result = await client.callTool({
        name: 'compare_xml',
        arguments: {
          baseXMLFilePath: '/nonexistent/file.xml',
          contrastXML: '<root>1</root>',
        },
      });
      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      expect(text).toMatch(/base file not found/);
    } finally {
      await client.close();
    }
  });

  it('should error for invalid XML string', async () => {
    const { client, transport } = createMCPClient();

    try {
      await client.connect(transport);
      const result = await client.callTool({
        name: 'compare_xml',
        arguments: {
          baseXMLString: 'not valid xml',
          contrastXML: '<root>1</root>',
        },
      });
      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0]
        .text;
      expect(text).toMatch(/Failed to parse base XML string/);
    } finally {
      await client.close();
    }
  });
});
