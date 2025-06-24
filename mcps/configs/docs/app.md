# GitHub MCP Server Application

## Overview

This is a **Model Context Protocol (MCP) Server** implementation specifically designed for **GitHub repository interactions**. The server provides AI models with secure access to GitHub repositories through a standardized protocol, enabling structured interactions with GitHub's API.

## Application Structure

```
app/
├── server.ts          # Main MCP server implementation
├── tools/             # Directory containing all available tools
│   └── github.ts      # GitHub repository interaction tools
├── deno.json         # Deno configuration and dependencies
└── README.md         # Basic project information
```

## GitHub Personal Access Token Setup

This MCP server is designed for **internal organization use** and requires a GitHub Personal Access Token to be configured as an environment variable.

### Creating a GitHub Personal Access Token

1. **Go to GitHub Settings**
   - Navigate to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/personal-access-tokens/tokens)

2. **Generate a new token (classic)**
   - Click "Generate new token (classic)"
   - Give it a descriptive name like "Organization MCP GitHub Tool"

3. **Select Required Scopes**
   - For **organization repositories**: `repo` (full control of private repositories)
   - For **public repositories only**: `public_repo` (if you only need public access)
   - **Recommended**: Use `repo` scope for full access to all your organization's repositories

4. **Set as Environment Variable**
   - Copy the token and set it as `GITHUB_TOKEN` environment variable
   - The server will automatically use this token for all GitHub API calls

### Token Permissions Needed

| Access Level | Required Scope | Description |
|-------------|---------------|-------------|
| **Recommended** | `repo` | Full access to all repositories (public & private) |
| Public only | `public_repo` | Access to public repositories only |
| Organization | `repo` + org permissions | Full organization repository access |

## Available GitHub Tools

### 1. `get_repo_structure`
**Description**: Get the complete structure of a GitHub repository

**Parameters**:
- `owner` (required): GitHub repository owner (username or organization)
- `repo` (required): GitHub repository name
- `path` (optional): Specific path within the repository (defaults to root)

**Example Usage**:
```json
{
  "name": "get_repo_structure",
  "arguments": {
    "owner": "your-org",
    "repo": "your-repo",
    "path": "src"
  }
}
```

**Note**: The GitHub token is automatically loaded from the `GITHUB_TOKEN` environment variable.

## How It Works

### 1. **MCP Protocol Implementation**
- Implements MCP (Model Context Protocol) specification for GitHub interactions
- Handles JSON-RPC 2.0 requests over HTTP
- Provides standardized endpoints for GitHub tool discovery and execution

### 2. **Authentication & Security**
- **Server Authentication**: Uses Bearer token authentication for MCP server access
- **GitHub Authentication**: Uses GitHub Personal Access Tokens for API access
- Validates tokens against the `SERVER_TOKEN` environment variable
- Implements CORS headers for web client compatibility

### 3. **GitHub API Integration**
- Direct integration with GitHub REST API v3
- Proper error handling for API rate limits and permissions
- Structured response formatting for repository data

### 4. **Core Endpoints**
- `/mcp` - Main MCP protocol endpoint
- `/.well-known/oauth-protected-resource` - OAuth 2.0 metadata
- `/.well-known/oauth-authorization-server` - OAuth 2.0 server metadata

## Available MCP Methods

| Method | Description |
|--------|-------------|
| `initialize` | Establishes connection and exchanges capabilities |
| `tools/list` | Returns all available GitHub tools |
| `tools/call` | Executes a specific GitHub tool with parameters |
| `resources/list` | Lists available resources |
| `resources/read` | Reads content from a resource |

## Getting Started

### 1. **Set up Environment Variables**
```bash
export SERVER_TOKEN=your-mcp-server-secret-token
export GITHUB_TOKEN=ghp_your_github_personal_access_token
export PORT=3008
```

### 2. **Start the Server**
```bash
deno run --allow-net --allow-env server.ts
```

### 3. **Test the GitHub Tool**
```bash
# List available tools
curl -X POST http://localhost:3008/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-mcp-server-secret-token" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Get repository structure
curl -X POST http://localhost:3008/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-mcp-server-secret-token" \
  -d '{
    "jsonrpc":"2.0",
    "id":2,
    "method":"tools/call",
    "params":{
      "name":"get_repo_structure",
      "arguments":{
        "owner":"your-org",
        "repo":"your-repo"
      }
    }
  }'
```

## Adding New GitHub Tools - Developer Guide

### Step 1: Extend the GitHub Tools File

Add new tools to `tools/github.ts`:

```typescript
// Add to the tools array
export const tools: Tool[] = [
  // ... existing tools
  {
    name: 'update_config_file',
    description: 'Update a configuration file in a GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
                 owner: { type: 'string', description: 'Repository owner' },
         repo: { type: 'string', description: 'Repository name' },
         path: { type: 'string', description: 'File path to update' },
         content: { type: 'string', description: 'New file content' },
         message: { type: 'string', description: 'Commit message' }
       },
       required: ['owner', 'repo', 'path', 'content', 'message']
    }
  }
];

// Add to the toolExecutors
export const toolExecutors = {
  // ... existing executors
  update_config_file: async (args: any): Promise<ToolCallResult> => {
    console.log('🔧 Updating configuration file...');
    // Implementation here
    return {
      content: [{ type: 'text', text: 'Configuration updated successfully' }]
    };
  }
};
```

### Step 2: GitHub API Integration Patterns

```typescript
// GET request example
const data = await fetchGitHubAPI(
  `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
  token
);

// PUT request example (for file updates)
const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: commitMessage,
    content: btoa(newContent), // Base64 encode
    sha: currentFileSha // Required for updates
  })
});
```

## Security Considerations

### 1. **Token Management**
- Never log or expose GitHub Personal Access Tokens
- Use environment variables for sensitive data
- Implement proper token validation

### 2. **API Rate Limits**
- GitHub API has rate limits (5000 requests/hour for authenticated users)
- Implement proper error handling for rate limit responses
- Consider caching for frequently accessed data

### 3. **Repository Access**
- Validate repository permissions before operations
- Handle private repository access appropriately
- Implement proper error messages for access denied scenarios

## Error Handling

The server implements comprehensive error handling for:
- Invalid GitHub tokens
- Repository not found
- Insufficient permissions
- API rate limits
- Network connectivity issues
- Malformed requests

## Future Enhancements

Planned features for future versions:
- File content reading and updating
- Commit history access
- Branch management
- Pull request interactions
- Issue management
- Repository configuration updates

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SERVER_TOKEN` | Bearer token for authentication | Yes |
| `PORT` | Server port (default: 3008) | No |

## Deployment

The application can be deployed using:
- Docker containers (see `docker/` directory)
- Cloud platforms with Deno runtime support
- Local development with Deno

For production deployment, ensure:
- Secure token generation and management
- Proper CORS configuration
- SSL/TLS termination
- Monitoring and logging setup

## Contributing

When adding new tools:
1. Follow the established patterns
2. Include comprehensive documentation
3. Add appropriate tests
4. Update this documentation if needed

## Resources

- [MCP Specification](https://modelcontextprotocol.io/)
- [Deno Documentation](https://deno.land/)
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification) 