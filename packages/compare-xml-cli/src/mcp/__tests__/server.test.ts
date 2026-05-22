import { describe, it, afterEach, expect } from 'vitest';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import type { Server } from '@modelcontextprotocol/sdk/server';
import { Client } from '@modelcontextprotocol/sdk/client';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { compareXMLTool, createServer } from '../server';

describe('createServer', () => {
  let server: Server | undefined;
  let client: Client | undefined;

  afterEach(async () => {
    try {
      await server?.close();
    } finally {
      server = undefined;
    }

    try {
      await client?.close();
    } finally {
      client = undefined;
    }
  });

  it('should list tools via client', async () => {
    server = createServer();

    client = new Client(
      { name: 'test-client', version: '1.0.0' },
      { capabilities: {} },
    );

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);

    const tools = await client.listTools();
    expect(tools.tools).toHaveLength(1);
    expect(tools.tools[0].name).toBe('compare_xml');

    await client.close();
    await server.close();
  });

  it('should call tool via client', async () => {
    server = createServer();
    client = new Client(
      { name: 'test-client', version: '1.0.0' },
      { capabilities: {} },
    );

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);

    const result = await client.callTool({
      name: 'compare_xml',
      arguments: {
        baseXML: '<root><a>1</a></root>',
        contrastXML: '<root><a>2</a></root>',
      },
    });

    expect(result.content).toBeDefined();
    expect(Array.isArray(result.content)).toBe(true);
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

    await client.close();
    await server.close();
  });

  it('should throw error for unknown tool', async () => {
    server = createServer();
    client = new Client(
      { name: 'test-client', version: '1.0.0' },
      { capabilities: {} },
    );

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);

    await expect(
      client.callTool({ name: 'unknown_tool', arguments: {} }),
    ).rejects.toThrow();

    await client.close();
    await server.close();
  });

  it('should return error for invalid base XML', async () => {
    server = createServer();
    client = new Client(
      { name: 'test-client', version: '1.0.0' },
      { capabilities: {} },
    );

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);

    const result = await client.callTool({
      name: 'compare_xml',
      arguments: {
        baseXML: '<unclosed',
        contrastXML: '<root><a>1</a></root>',
      },
    });

    expect(result.isError).toBe(true);
    expect(result.content).toBeDefined();
    expect(Array.isArray(result.content)).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toMatch(/XML validation error/);

    await client.close();
    await server.close();
  });

  it('should return error for invalid contrast XML', async () => {
    server = createServer();
    client = new Client(
      { name: 'test-client', version: '1.0.0' },
      { capabilities: {} },
    );

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);

    const result = await client.callTool({
      name: 'compare_xml',
      arguments: {
        baseXML: '<root><a>1</a></root>',
        contrastXML: '<unclosed',
      },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toMatch(/XML validation error/);

    await client.close();
    await server.close();
  });
});

describe('compareXMLTool', () => {
  it('should compare XML strings', () => {
    const result = compareXMLTool({
      baseXML: '<root><a>1</a></root>',
      contrastXML: '<root><a>2</a></root>',
    });
    expect(result).toEqual([
      {
        pathString: 'root.a',
        pathSegments: ['root', 'a'],
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
    ]);
  });

  it('should compare with file paths', () => {
    const baseFile = join(__dirname, 'base.xml');
    const contrastFile = join(__dirname, 'contrast.xml');

    writeFileSync(baseFile, '<root><a>1</a></root>');
    writeFileSync(contrastFile, '<root><a>2</a></root>');

    const result = compareXMLTool({
      baseXMLFilePath: baseFile,
      contrastXMLFilePath: contrastFile,
    });

    expect(result).toEqual([
      {
        pathString: 'root.a',
        pathSegments: ['root', 'a'],
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
    ]);

    unlinkSync(baseFile);
    unlinkSync(contrastFile);
  });

  it('should compare with XML strings', () => {
    const result = compareXMLTool({
      baseXMLString: '<root><a>1</a></root>',
      contrastXMLString: '<root><a>2</a></root>',
    });

    expect(result).toEqual([
      {
        pathString: 'root.a',
        pathSegments: ['root', 'a'],
        pathBelongsTo: 'both',
        diffType: 'valueChanged',
      },
    ]);
  });

  it('should compare with options', () => {
    const result = compareXMLTool({
      baseXML: '<root><arr><item>1</item><item>2</item></arr></root>',
      contrastXML: '<root><arr><item>2</item><item>1</item></arr></root>',
      options: { arrayCompareMethod: 'unordered' },
    });

    expect(result).toEqual([]);
  });

  it('should throw for invalid base XML', () => {
    expect(() =>
      compareXMLTool({
        baseXML: '<unclosed',
        contrastXML: '<root><a>1</a></root>',
      }),
    ).toThrow(/Unclosed tag/);
  });

  it('should throw for invalid contrast XML', () => {
    expect(() =>
      compareXMLTool({
        baseXML: '<root><a>1</a></root>',
        contrastXML: '<unclosed',
      }),
    ).toThrow(/Unclosed tag/);
  });
});
