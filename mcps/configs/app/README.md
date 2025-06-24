# GitHub MCP Server

A specialized Model Context Protocol (MCP) server for GitHub repository interactions.

## Quick Start

1. **Set environment variables:**
   ```bash
   export SERVER_TOKEN=your-mcp-server-secret-token
   export GITHUB_TOKEN=ghp_your_github_personal_access_token
   export PORT=3008
   ```

2. **Start the server:**
   ```bash
   deno run --allow-net --allow-env server.ts
   ```

**GitHub Token Setup:**
- Go to [GitHub Settings > Personal Access Tokens](https://github.com/settings/personal-access-tokens/tokens)
- Create a new token with `repo` scope for full organization access
- Set it as the `GITHUB_TOKEN` environment variable

## Available Tools

### `get_repo_structure`
Get the complete structure of any GitHub repository.

**Required Parameters:**
- `owner`: Repository owner (username/organization)
- `repo`: Repository name  
- `path`: (optional) Specific directory path

**Example:**
```json
{
  "name": "get_repo_structure",
  "arguments": {
    "owner": "your-org",
    "repo": "your-repo"
  }

}
```

**Note**: GitHub authentication is handled automatically via the `GITHUB_TOKEN` environment variable.

## Documentation

See [docs/app.md](../docs/app.md) for complete documentation including:
- Authentication setup
- API usage examples
- Adding new tools
- Security considerations 
- Security considerations 