# Global Config MCP Server

A specialized **Model Context Protocol (MCP) Server** implementation for managing **global configurations** in remote GitHub repositories. This server provides AI models with access to predefined GitHub repository configurations through hardcoded settings, enabling structured interactions with GitHub's API while maintaining security.

## Application Structure

```
app/
├── server.ts          # Main MCP server implementation with hardcoded configs
├── tools/             # Directory containing all available tools
│   └── github.ts      # GitHub repository interaction tools
├── deno.json         # Deno configuration and dependencies
└── README.md         # This documentation
```

## Quick Start

### 1. GitHub Personal Access Token Setup

This MCP server requires a GitHub Personal Access Token configured as an environment variable.

**Creating a GitHub Personal Access Token:**

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/personal-access-tokens/tokens)
2. Click "Generate new token (classic)"
3. Give it a descriptive name like "Global Config MCP Server"
4. Select required scopes:
   - **Recommended**: `repo` (full control of private repositories)
   - **Public only**: `public_repo` (if you only need public access)
5. Copy the token and set it as `GITHUB_TOKEN` environment variable

### 2. Environment Setup

```bash
export SERVER_TOKEN=your-mcp-server-secret-token
export GITHUB_TOKEN=ghp_your_github_personal_access_token
export PORT=3008
```

### 3. Start the Server

```bash
deno run --allow-net --allow-env server.ts
```

## 🔧 Hardcoded Configuration List

The server comes with predefined configurations hardcoded in `server.ts`:

```typescript
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
    github_repo_path: 'ghostmind-dev/config/features/src/settings',
    github_token: Deno.env.get('GITHUB_TOKEN') || '',
  },
];
```

## 🛠️ Available Tools

### Configuration Management Tools

- **`list_available_configs`**: List all available global configurations
- **`get_config_info`**: Get detailed information about a specific configuration

### Dynamic GitHub Tools

For each configuration, the server automatically generates GitHub tools with prefixed names:

**For "gitignore" config:**

- `mcp_update_global_gitignore_remote_repo_list_contents`
- `mcp_update_global_gitignore_remote_repo_check_file_exists`
- `mcp_update_global_gitignore_remote_repo_get_file_content`
- `mcp_update_global_gitignore_remote_repo_add_file`
- `mcp_update_global_gitignore_remote_repo_smart_add_file`

**For "settings" config:**

- `mcp_update_global_settings_remote_repo_list_contents`
- `mcp_update_global_settings_remote_repo_check_file_exists`
- `mcp_update_global_settings_remote_repo_get_file_content`
- `mcp_update_global_settings_remote_repo_add_file`
- `mcp_update_global_settings_remote_repo_smart_add_file`

## How It Works

### 1. **MCP Protocol Implementation**

- Implements MCP (Model Context Protocol) specification for GitHub interactions
- Handles JSON-RPC 2.0 requests over HTTP
- Provides standardized endpoints for GitHub tool discovery and execution
- Automatic tool generation based on hardcoded configurations

### 2. **Authentication & Security**

- **Server Authentication**: Uses Bearer token authentication for MCP server access
- **GitHub Authentication**: Uses GitHub Personal Access Tokens from environment variables
- **Configuration Security**: All GitHub operations are restricted to predefined repositories
- **Path Validation**: Prevents access to files outside the specified folders
- Validates tokens against the `SERVER_TOKEN` environment variable

### 3. **Configuration Management**

- Hardcoded configuration list in server code
- Each configuration specifies GitHub repository path and description
- Automatic tool generation with unique prefixes
- Folder-aware file operations based on repository paths

## API Testing

### Test Available Configurations

```bash
curl -X POST http://localhost:3008/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-mcp-server-secret-token" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### Test List Configurations

```bash
curl -X POST http://localhost:3008/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-mcp-server-secret-token" \
  -d '{
    "jsonrpc":"2.0",
    "id":2,
    "method":"tools/call",
    "params":{
      "name":"list_available_configs",
      "arguments":{}
    }
  }'
```

### Test Get Config Info

```bash
curl -X POST http://localhost:3008/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-mcp-server-secret-token" \
  -d '{
    "jsonrpc":"2.0",
    "id":3,
    "method":"tools/call",
    "params":{
      "name":"get_config_info",
      "arguments":{"config_name":"gitignore"}
    }
  }'
```

### Test GitHub Operations

```bash
curl -X POST http://localhost:3008/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-mcp-server-secret-token" \
  -d '{
    "jsonrpc":"2.0",
    "id":4,
    "method":"tools/call",
    "params":{
      "name":"mcp_update_global_gitignore_remote_repo_list_contents",
      "arguments":{"path":""}
    }
  }'
```

## Environment Variables

| Variable       | Description                                | Required |
| -------------- | ------------------------------------------ | -------- |
| `SERVER_TOKEN` | Bearer token for MCP server authentication | Yes      |
| `GITHUB_TOKEN` | GitHub Personal Access Token               | Yes      |
| `PORT`         | Server port (default: 3008)                | No       |

## Request Headers

| Header          | Description                            | Required |
| --------------- | -------------------------------------- | -------- |
| `Authorization` | Bearer token for server authentication | Yes      |

## Security Considerations

### 1. **Token Management**

- Never log or expose GitHub Personal Access Tokens
- Use environment variables for sensitive data
- Implement proper token validation

### 2. **Configuration Security**

- All GitHub operations are restricted to predefined repositories
- Configuration list is hardcoded in server code
- Path traversal attempts are blocked by GitHub API path validation
- Security errors are logged for monitoring

### 3. **API Rate Limits**

- GitHub API has rate limits (5000 requests/hour for authenticated users)
- Implement proper error handling for rate limit responses
- Consider caching for frequently accessed data

### 4. **Repository Access**

- Validate repository permissions before operations
- Handle private repository access appropriately
- Implement proper error messages for access denied scenarios

## Error Handling

The server implements comprehensive error handling for:

- Invalid GitHub tokens
- Repository not found
- Insufficient permissions
- Invalid configuration names
- API rate limits
- Network connectivity issues
- Malformed requests

## Adding New Configurations

To add a new configuration:

1. Add the configuration to the `configList` array in `server.ts`:

   ```typescript
   {
     "name": "new_config",
     "description": "Description of the new configuration",
     "github_repo_path": "owner/repo/path/to/folder",
     "github_token": Deno.env.get('GITHUB_TOKEN') || ''
   }
   ```

2. Restart the server to load the new configuration

3. The server will automatically generate tools with the prefix `mcp_update_global_new_config_*`

## Contributing

When adding new configurations:

1. Follow the established naming conventions
2. Ensure the GitHub repository path is valid
3. Add appropriate descriptions
4. Test the configuration thoroughly
5. Update this documentation

## Resources

- [MCP Specification](https://modelcontextprotocol.io/)
- [GitHub API Documentation](https://docs.github.com/en/rest)
- [Deno Documentation](https://deno.land/)
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)
