// Simple MCP Server with Bearer Token Authentication
// This is a basic implementation that handles MCP protocol manually

import { tools, toolExecutors, parseGitHubRepoPath } from './tools/github.ts';

// Hardcoded GitHub configurations
const configList = [
  {
    name: 'gitignore',
    description: 'Update .gitignore files',
    github_repo_path: 'ghostmind-dev/config/config/git',
    github_token: Deno.env.get('GITHUB_TOKEN') || '',
  },
  {
    name: 'settings',
    description: 'Update global settings',
    github_repo_path: 'ghostmind-dev/features/features/src/settings',
    github_token: Deno.env.get('GITHUB_TOKEN') || '',
  },
];

interface ConfigItem {
  name: string;
  description: string;
  github_repo_path: string;
  github_token: string;
}

interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

// Authentication function
function authenticateRequest(req: Request): boolean {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  const serverToken = Deno.env.get('SERVER_TOKEN');

  if (!serverToken) {
    console.error('SERVER_TOKEN environment variable is not set');
    return false;
  }

  return token === serverToken;
}

// Get GitHub credentials from config name
function getGitHubConfig(configName: string): ConfigItem | null {
  const config = configList.find((c) => c.name === configName);
  if (!config) {
    return null;
  }

  if (!config.github_token) {
    console.error(`GitHub token not found for config: ${configName}`);
    return null;
  }

  return config;
}

// Convert config to GitHub credentials format
function configToGitHubCredentials(config: ConfigItem): any {
  const parsed = parseGitHubRepoPath(config.github_repo_path);
  if (!parsed) {
    throw new Error(`Invalid GitHub repo path: ${config.github_repo_path}`);
  }

  return {
    token: config.github_token,
    owner: parsed.owner,
    repo: parsed.repo,
    folder: parsed.folder,
    description: config.description,
  };
}

// Get all available tools (use static tools from github.ts)
function getAllAvailableTools(): any[] {
  return tools;
}

// Handle MCP requests
async function handleMCPRequest(
  request: MCPRequest,
  req: Request
): Promise<MCPResponse> {
  console.log('Handling MCP request:', request.method);

  switch (request.method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
            resources: {},
          },
          serverInfo: {
            name: 'global-config-mcp',
            version: '1.0.0',
            description:
              'MCP server for managing global configurations in remote GitHub repositories',
          },
        },
      };

    case 'tools/list': {
      const allTools = getAllAvailableTools();
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          tools: allTools,
        },
      };
    }

    case 'tools/call': {
      const toolName = request.params?.name;
      const toolArgs = request.params?.arguments;

      // Check if the tool exists in our static toolExecutors
      const executor = toolExecutors[toolName];
      if (!executor) {
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32601,
            message: `Unknown tool: ${toolName}`,
          },
        };
      }

      // For tools that don't require config_name (like global_config_list)
      if (toolName === 'global_config_list') {
        try {
          const result = await executor(toolArgs || {});
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: result,
          };
        } catch (error) {
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32602,
              message:
                error instanceof Error
                  ? error.message
                  : 'Tool execution failed',
            },
          };
        }
      }

      // For tools that require config_name
      const configName = toolArgs?.config_name;
      if (!configName) {
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32602,
            message: `Missing required parameter: config_name. Available configs: ${configList
              .map((c) => c.name)
              .join(', ')}`,
          },
        };
      }

      const config = getGitHubConfig(configName);
      if (!config) {
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32602,
            message: `Configuration not found: ${configName}. Available configs: ${configList
              .map((c) => c.name)
              .join(', ')}`,
          },
        };
      }

      try {
        const githubCredentials = configToGitHubCredentials(config);
        const result = await executor(toolArgs, githubCredentials);
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: result,
        };
      } catch (error) {
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32602,
            message:
              error instanceof Error ? error.message : 'Tool execution failed',
          },
        };
      }
    }

    case 'resources/list':
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          resources: [
            {
              uri: 'test://example',
              name: 'Test Resource',
              description: 'A test resource',
              mimeType: 'text/plain',
            },
          ],
        },
      };

    case 'resources/read': {
      const resourceUri = request.params?.uri;

      if (resourceUri === 'test://example') {
        console.log('Test resource accessed');
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            contents: [
              {
                uri: 'test://example',
                mimeType: 'text/plain',
                text: 'This is a test resource content',
              },
            ],
          },
        };
      }

      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: `Unknown resource: ${resourceUri}`,
        },
      };
    }

    default:
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: `Method not found: ${request.method}`,
        },
      };
  }
}

// Start the HTTP server
Deno.serve(
  {
    port: Number(Deno.env.get('PORT')) || 3008,
    hostname: '0.0.0.0',
  },
  async (req: Request) => {
    console.log(`${req.method} ${req.url}`);

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Handle different endpoints
    const url = new URL(req.url);

    // OAuth 2.0 Protected Resource Metadata endpoint (RFC 9728)
    if (url.pathname === '/.well-known/oauth-protected-resource') {
      return new Response(
        JSON.stringify({
          resource: `${url.origin}/mcp`,
          authorization_servers: [`${url.origin}`],
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // OAuth 2.0 Authorization Server Metadata endpoint (RFC 8414)
    if (url.pathname === '/.well-known/oauth-authorization-server') {
      return new Response(
        JSON.stringify({
          issuer: url.origin,
          authorization_endpoint: `${url.origin}/oauth/authorize`,
          token_endpoint: `${url.origin}/oauth/token`,
          response_types_supported: ['code'],
          grant_types_supported: ['authorization_code'],
          code_challenge_methods_supported: ['S256'],
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Only handle /mcp endpoint for MCP requests
    if (url.pathname !== '/mcp') {
      return new Response('Not Found', { status: 404 });
    }

    // Authenticate the request
    if (!authenticateRequest(req)) {
      return new Response('Unauthorized', {
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'WWW-Authenticate':
            'Bearer realm="MCP Server", error="invalid_token"',
        },
      });
    }

    // Handle POST requests with JSON-RPC
    if (req.method === 'POST') {
      try {
        const body = await req.text();
        console.log('Request body:', body);

        const mcpRequest: MCPRequest = JSON.parse(body);
        const mcpResponse = await handleMCPRequest(mcpRequest, req);

        return new Response(JSON.stringify(mcpResponse), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        });
      } catch (error) {
        console.error('Error processing request:', error);
        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: {
              code: -32700,
              message: 'Parse error',
            },
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
    }

    return new Response('Method not allowed', {
      status: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
);

// Log server startup information
console.log('🚀 Global Config MCP starting...');
console.log('   Available configurations:');
configList.forEach((config) => {
  console.log(
    `   - ${config.name}: ${config.description} (${config.github_repo_path})`
  );
});
console.log('   Required environment variables:');
console.log('   - SERVER_TOKEN: Bearer token for MCP server authentication');
console.log('   - GITHUB_TOKEN: GitHub Personal Access Token');
console.log(`   - PORT: Server port (default: 3008)`);
console.log(
  `🌐 Server will be available at: http://localhost:${
    Number(Deno.env.get('PORT')) || 3008
  }/mcp`
);
