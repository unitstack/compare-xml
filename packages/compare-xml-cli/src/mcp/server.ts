import { Server } from '@modelcontextprotocol/sdk/server';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import {
  compareXML,
  type XMLValueDifference,
  type XMLCompareOptions,
} from '@compare-xml/core';
import { getPkgVersion, parseInput } from './utils';

let cachedInputSchema:
  | ReturnType<typeof createCompareXMLInputSchema>
  | undefined;
let cachedOutputSchema:
  | ReturnType<typeof createCompareXMLOutputSchema>
  | undefined;

export function createServer() {
  const server = new Server(
    {
      name: 'compare-xml-mcp',
      version: getPkgVersion(),
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  if (!cachedInputSchema) {
    cachedInputSchema = createCompareXMLInputSchema();
  }
  if (!cachedOutputSchema) {
    cachedOutputSchema = createCompareXMLOutputSchema();
  }

  server.setRequestHandler(ListToolsRequestSchema, () => {
    return {
      tools: [
        {
          name: 'compare_xml',
          description:
            'Compare two XML values and return differences. Supports various comparison options including case-insensitive comparisons.',
          inputSchema: cachedInputSchema!.toJSONSchema() as Record<
            string,
            unknown
          >,
          outputSchema: cachedOutputSchema!.toJSONSchema() as Record<
            string,
            unknown
          >,
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, (request) => {
    if (request.params.name === 'compare_xml') {
      if (!cachedInputSchema) {
        cachedInputSchema = createCompareXMLInputSchema();
      }
      const args = cachedInputSchema.parse(request.params.arguments);

      try {
        const differences = compareXMLTool(args);
        return {
          structuredContent: { differences },
          content: [
            { type: 'text', text: JSON.stringify(differences, null, 2) },
          ],
        };
      } catch (error) {
        if ((error as Error).name === 'XMLValidationError') {
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: `XML validation error: ${(error as Error).message}`,
              },
            ],
          };
        }
        return {
          isError: true,
          content: [
            { type: 'text', text: `Error: ${(error as Error).message}` },
          ],
        };
      }
    }
    throw new Error(`Unknown tool: ${request.params.name}`);
  });

  return server;
}

export function createCompareXMLInputSchema() {
  return z.object({
    baseXML: z.string().describe('Base XML string').optional(),
    baseXMLString: z.string().describe('Base XML string').optional(),
    baseXMLFilePath: z.string().describe('Base XML file path').optional(),
    contrastXML: z.string().describe('Contrast XML string').optional(),
    contrastXMLString: z.string().describe('Contrast XML string').optional(),
    contrastXMLFilePath: z
      .string()
      .describe('Contrast XML file path')
      .optional(),
    options: z
      .object({
        arrayCompareMethod: z
          .enum(['byIndex', 'lcs', 'unordered'])
          .default('byIndex')
          .describe('Array comparison method'),
        keyCaseInsensitive: z
          .boolean()
          .default(false)
          .describe('Case insensitive key comparison'),
        valueCaseInsensitive: z
          .boolean()
          .default(false)
          .describe('Case insensitive value comparison'),
      })
      .optional(),
  });
}

export function createCompareXMLOutputSchema() {
  return z.object({
    differences: z.array(
      z.object({
        pathString: z.string(),
        pathSegments: z.array(z.string()),
        pathBelongsTo: z.enum(['base', 'contrast', 'both']),
        diffType: z.enum(['added', 'deleted', 'valueChanged']),
      }),
    ),
  });
}

export function compareXMLTool(args: {
  baseXML?: string;
  baseXMLString?: string;
  baseXMLFilePath?: string;
  contrastXML?: string;
  contrastXMLString?: string;
  contrastXMLFilePath?: string;
  options?: XMLCompareOptions;
}): XMLValueDifference[] {
  return compareXML({
    baseXML: parseInput(
      args.baseXML,
      args.baseXMLString,
      args.baseXMLFilePath,
      'base',
    ),
    contrastXML: parseInput(
      args.contrastXML,
      args.contrastXMLString,
      args.contrastXMLFilePath,
      'contrast',
    ),
    options: args.options,
  });
}
