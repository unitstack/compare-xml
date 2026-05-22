import { describe, it, expect, vi, beforeEach } from 'vitest';

const helpFn = vi.fn();
const compareMock = vi.fn();
const serverConnectMock = vi.fn();
const createServerMock = vi.fn(() => ({
  connect: serverConnectMock,
}));
const StdioServerTransportMock = vi.fn();

let mockCommand: Record<string, ReturnType<typeof vi.fn>>;

function createMockCommand() {
  const cmd = {
    name: vi.fn().mockReturnThis(),
    version: vi.fn().mockReturnThis(),
    description: vi.fn().mockReturnThis(),
    argument: vi.fn().mockReturnThis(),
    option: vi.fn().mockReturnThis(),
    action: vi.fn().mockReturnThis(),
    parse: vi.fn(),
    help: helpFn,
  };
  return cmd;
}

vi.mock('commander', () => ({
  Command: vi.fn(function () {
    mockCommand = createMockCommand();
    return mockCommand;
  }),
}));

vi.mock('../compare', () => ({
  compare: (...args: unknown[]) => compareMock(...args) as void,
}));

vi.mock('../mcp/server', () => ({
  createServer: () => createServerMock(),
}));

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: StdioServerTransportMock,
}));

vi.mock('../utils', () => ({
  getPkgVersion: () => '1.2.3',
}));

describe('cli', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should configure program with correct metadata', async () => {
    await import('../cli');

    expect(mockCommand.name).toHaveBeenCalledWith('compare-xml');
    expect(mockCommand.version).toHaveBeenCalledWith('1.2.3');
    expect(mockCommand.description).toHaveBeenCalledWith(
      'Compare two XML files or strings',
    );
    expect(mockCommand.argument).toHaveBeenCalledWith(
      '[base]',
      'Base XML string or file path',
    );
    expect(mockCommand.argument).toHaveBeenCalledWith(
      '[contrast]',
      'Contrast XML string or file path',
    );
    expect(mockCommand.parse).toHaveBeenCalled();
  });

  it('should register action callback', async () => {
    await import('../cli');

    expect(mockCommand.action).toHaveBeenCalledTimes(1);
    expect(typeof mockCommand.action.mock.calls[0][0]).toBe('function');
  });

  it('should run MCP server when --mcp option is set', async () => {
    await import('../cli');

    const cb = mockCommand.action.mock.calls[0][0] as (
      base: string,
      contrast: string,
      options: Record<string, unknown>,
    ) => Promise<void>;
    await cb('src', 'tgt', { mcp: true });

    expect(createServerMock).toHaveBeenCalled();
    expect(StdioServerTransportMock).toHaveBeenCalled();
    expect(serverConnectMock).toHaveBeenCalled();
  });

  it('should show help when source is undefined', async () => {
    await import('../cli');

    const cb = mockCommand.action.mock.calls[0][0] as (
      base: string | undefined,
      contrast: string | undefined,
      options: Record<string, unknown>,
    ) => void;
    cb(undefined, 'tgt', {});

    expect(helpFn).toHaveBeenCalled();
    expect(compareMock).not.toHaveBeenCalled();
  });

  it('should show help when contrast is undefined', async () => {
    await import('../cli');

    const cb = mockCommand.action.mock.calls[0][0] as (
      base: string | undefined,
      contrast: string | undefined,
      options: Record<string, unknown>,
    ) => void;
    cb('src', undefined, {});

    expect(helpFn).toHaveBeenCalled();
    expect(compareMock).not.toHaveBeenCalled();
  });

  it('should call compare with base, contrast, and options', async () => {
    await import('../cli');

    const cb = mockCommand.action.mock.calls[0][0] as (
      base: string,
      contrast: string,
      options: Record<string, unknown>,
    ) => void;
    cb('<root><a>1</a></root>', '<root><a>2</a></root>', { jsonExport: true });

    expect(compareMock).toHaveBeenCalledWith(
      '<root><a>1</a></root>',
      '<root><a>2</a></root>',
      {
        jsonExport: true,
      },
    );
    expect(helpFn).not.toHaveBeenCalled();
  });
});
