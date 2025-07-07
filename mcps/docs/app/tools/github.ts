// Remote Repository Tools - contains all tools for interacting with the remote GitHub repository via API calls

import { catalog } from '../config/catalog.ts';

export interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export interface ToolCallResult {
  content: Array<{
    type: string;
    text: string;
  }>;
}

export interface GitHubCredentials {
  token: string;
  owner: string;
  repo: string;
  folder?: string;
  specificFile?: string;
  isFile: boolean;
  description?: string;
}

export interface ConfigInfo {
  name: string;
  url: string;
  description?: string;
}

// Export function to get all configurations
export function getAllConfigurations() {
  return catalog;
}

// Export function to get a specific configuration
export function getConfiguration(configName: string) {
  const config = catalog.find((c) => c.name === configName);
  if (!config) {
    return null;
  }

  if (!config.github_token) {
    console.error(`GitHub token not found for config: ${configName}`);
    return null;
  }

  return config;
}

// Export function to convert config to GitHub credentials format
export function configToGitHubCredentials(config: any): GitHubCredentials {
  const parsed = parseGitHubRepoPath(config.github_repo_path);
  if (!parsed) {
    throw new Error(`Invalid GitHub repo path: ${config.github_repo_path}`);
  }

  return {
    token: config.github_token,
    owner: parsed.owner,
    repo: parsed.repo,
    folder: parsed.folder,
    specificFile: parsed.specificFile,
    isFile: parsed.isFile,
    description: config.description,
  };
}

// Helper function to convert catalog config to ConfigInfo format
function catalogToConfigInfo(catalogConfig: any): ConfigInfo {
  // Extract owner, repo, and folder from github_repo_path
  const parsed = parseGitHubRepoPath(catalogConfig.github_repo_path);
  const baseUrl = `https://github.com/${parsed.owner}/${parsed.repo}`;

  // Check if the original path points to a specific file
  const originalPath = catalogConfig.github_repo_path;
  const pathParts = originalPath.split('/');

  if (pathParts.length > 2) {
    const filePath = pathParts.slice(2).join('/');
    // Check if it's a file (has extension)
    const fileExtensionRegex = /\.[a-zA-Z0-9]+$/;
    if (fileExtensionRegex.test(filePath)) {
      // Point to the specific file
      const url = `${baseUrl}/blob/main/${filePath}`;
      return {
        name: catalogConfig.name,
        url: url,
        description: catalogConfig.description,
      };
    }
  }

  // For folders or repo root
  const url = parsed.folder ? `${baseUrl}/tree/main/${parsed.folder}` : baseUrl;

  return {
    name: catalogConfig.name,
    url: url,
    description: catalogConfig.description,
  };
}

// Security function to validate path is within allowed folder
function validatePath(path: string, allowedFolder?: string): boolean {
  if (!allowedFolder) {
    return true; // No folder restriction
  }

  // Normalize paths
  const normalizedPath = path.replace(/^\/+/, '').replace(/\/+$/, '');
  const normalizedFolder = allowedFolder
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');

  // Check if path is within the allowed folder
  return (
    normalizedPath.startsWith(normalizedFolder + '/') ||
    normalizedPath === normalizedFolder
  );
}

// Security function to enforce folder restrictions
function enforceFolderSecurity(path: string, allowedFolder?: string): string {
  if (!allowedFolder) {
    return path; // No folder restriction
  }

  if (!validatePath(path, allowedFolder)) {
    throw new Error(
      `Access denied: Path "${path}" is outside the allowed folder "${allowedFolder}"`
    );
  }

  return path;
}

// Helper function to ensure path is within allowed folder
function ensurePathInFolder(path: string, allowedFolder?: string): string {
  if (!allowedFolder) {
    return path;
  }

  const normalizedPath = path.replace(/^\/+/, '');
  const normalizedFolder = allowedFolder
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');

  // If path doesn't start with folder, prepend it
  if (
    !normalizedPath.startsWith(normalizedFolder + '/') &&
    normalizedPath !== normalizedFolder
  ) {
    return `${normalizedFolder}/${normalizedPath}`;
  }

  return normalizedPath;
}

// Static tools - no dynamic generation
export const tools: Tool[] = [
  {
    name: 'global_docs_list',
    description:
      'List all available configurations without requiring any parameters - use this when you need to see what configurations are available',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'global_docs_get_info',
    description:
      'Get detailed information about a specific configuration, or list all available configurations when no config_name is provided',
    inputSchema: {
      type: 'object',
      properties: {
        config_name: {
          type: 'string',
          description:
            'Name of the configuration to get information about (optional - if not provided, returns list of all configs)',
        },
      },
      required: [],
    },
  },
  {
    name: 'global_docs_list_contents',
    description:
      'List contents and folders in the remote GitHub repository via API call - use when you need to explore or browse the remote repository structure on GitHub. This tool makes GitHub API calls to fetch repository contents, NOT local file system access. Operations are restricted to the specified folder if provided. Keywords: remote repo, github api, repository contents, browse repo, list files  Use the config_name parameter to specify which configuration to target (gitignore, settings).',
    inputSchema: {
      type: 'object',
      properties: {
        config_name: {
          type: 'string',
          description:
            'Name of the configuration to target (gitignore, settings)',
        },
        path: {
          type: 'string',
          description:
            'Path within the remote GitHub repository (optional, defaults to root or restricted folder)',
          default: '',
        },
      },
      required: ['config_name'],
    },
  },
  {
    name: 'global_docs_check_file_exists',
    description:
      'Check if a specific file exists in the remote GitHub repository via API call - NOT in local file system. This tool makes GitHub API calls to check file existence on GitHub. Operations are restricted to the specified folder if provided. If config points to a specific file, that file will be automatically checked. Keywords: remote repo file, github api, check file exists, file exists  Use the config_name parameter to specify which configuration to target (gitignore, settings).',
    inputSchema: {
      type: 'object',
      properties: {
        config_name: {
          type: 'string',
          description:
            'Name of the configuration to target (gitignore, settings)',
        },
        file_path: {
          type: 'string',
          description:
            'Path to the file to check in the remote GitHub repository (e.g., "configs/my-config.json"). Must be within the allowed folder if specified. Optional if config points to a specific file.',
        },
      },
      required: ['config_name'],
    },
  },
  {
    name: 'global_docs_get_file_content',
    description:
      'Get the content of a file from the remote GitHub repository via API call - NOT from local file system. This tool makes GitHub API calls to fetch file content from GitHub. Operations are restricted to the specified folder if provided. If config points to a specific file, that file will be automatically retrieved. Keywords: remote repo file, github api, read file, view file, file content  Use the config_name parameter to specify which configuration to target (gitignore, settings).',
    inputSchema: {
      type: 'object',
      properties: {
        config_name: {
          type: 'string',
          description:
            'Name of the configuration to target (gitignore, settings)',
        },
        file_path: {
          type: 'string',
          description:
            'Path to the file to retrieve from the remote GitHub repository. Must be within the allowed folder if specified. Optional if config points to a specific file.',
        },
        branch: {
          type: 'string',
          description: 'Branch name (optional, defaults to main)',
          default: 'main',
        },
      },
      required: ['config_name'],
    },
  },
  {
    name: 'global_docs_add_or_update_file',
    description:
      'Add or update a file in the remote GitHub repository via API calls with automatic branch creation and pull request. This tool makes GitHub API calls to create branches and pull requests - NOT direct file editing in local workspace. Operations are restricted to the specified folder if provided. If config points to a specific file, that file will be automatically updated. Use when you want to propose changes to the remote GitHub repository. Keywords: remote repo file, github api, add file, update file, modify file, create file, pull request, new config, add config, config file, configuration, settings, new configuration, save config, store config, manage config  Use the config_name parameter to specify which configuration to target (gitignore, settings).',
    inputSchema: {
      type: 'object',
      properties: {
        config_name: {
          type: 'string',
          description:
            'Name of the configuration to target (gitignore, settings)',
        },
        file_path: {
          type: 'string',
          description:
            'Path where to add the file in the remote GitHub repository (e.g., "configs/extensions/my-extension.json"). Will be automatically placed within the allowed folder if specified. Optional if config points to a specific file.',
        },
        file_content: {
          type: 'string',
          description: 'Content of the file to add or update',
        },
        commit_message: {
          type: 'string',
          description: 'Commit message for the file change',
        },
        pr_title: {
          type: 'string',
          description: 'Title for the pull request',
        },
        pr_description: {
          type: 'string',
          description: 'Description for the pull request (optional)',
          default: '',
        },
        suggested_path: {
          type: 'string',
          description:
            'Suggested path if user is unsure where to place the file (optional)',
          default: '',
        },
      },
      required: ['config_name', 'file_content', 'commit_message', 'pr_title'],
    },
  },
  {
    name: 'global_docs_smart_add_file',
    description:
      'Intelligently add a file to the remote GitHub repository via API calls by analyzing the remote repo structure and suggesting optimal placement. This tool makes GitHub API calls to create branches and pull requests - NOT direct file editing in local workspace. Operations are restricted to the specified folder if provided. Use when you want to propose a new file to the remote GitHub repository but are unsure about placement. Perfect for when users say "I have a new config", "add this configuration", "save this config", or "I want to add a new file". Keywords: remote repo file, github api, smart file placement, auto file placement, intelligent file placement, pull request, new config, add config, config file, configuration, settings, new configuration, save config, store config, manage config, I have a config, add this config, new file, where should this go  Use the config_name parameter to specify which configuration to target (gitignore, settings).',
    inputSchema: {
      type: 'object',
      properties: {
        config_name: {
          type: 'string',
          description:
            'Name of the configuration to target (gitignore, settings)',
        },
        file_name: {
          type: 'string',
          description:
            'Name of the file (e.g., "my-extension", "database-config")',
        },
        file_content: {
          type: 'string',
          description: 'Content of the file',
        },
        file_type: {
          type: 'string',
          description:
            'Type of file (e.g., "config", "extension", "service", "database", "api")',
          default: 'general',
        },
        file_extension: {
          type: 'string',
          description: 'File extension (e.g., "json", "yaml", "toml", "env")',
          default: 'json',
        },
        description: {
          type: 'string',
          description: 'Description of what this file does',
          default: '',
        },
      },
      required: ['config_name', 'file_name', 'file_content'],
    },
  },
];

// Helper function to fetch GitHub API
async function fetchGitHubAPI(url: string, token: string) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'MCP-GitHub-Tool/1.0',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  return await response.json();
}

// Helper function to make GitHub API POST/PUT requests
async function postGitHubAPI(url: string, token: string, data: any) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'MCP-GitHub-Tool/1.0',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  return await response.json();
}

// Helper function to make GitHub API PUT requests
async function putGitHubAPI(url: string, token: string, data: any) {
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'MCP-GitHub-Tool/1.0',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  return await response.json();
}

// Helper function to properly encode UTF-8 strings to base64
function encodeBase64(str: string): string {
  // Use the built-in btoa with proper UTF-8 handling
  // First convert to UTF-8 bytes, then to base64
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary);
}

// Helper function to generate unique branch name with retry logic
function generateBranchName(baseName: string, attempt: number = 0): string {
  const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const sanitized = baseName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const attemptSuffix = attempt > 0 ? `-${attempt}` : '';
  return `update-config-${sanitized}-${timestamp}-${randomSuffix}${attemptSuffix}`;
}

// Helper function to create branch with retry logic
async function createBranchWithRetry(
  owner: string,
  repo: string,
  token: string,
  baseName: string,
  baseSha: string,
  maxAttempts: number = 3
): Promise<string> {
  const createBranchUrl = `https://api.github.com/repos/${owner}/${repo}/git/refs`;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const branchName = generateBranchName(baseName, attempt);

    try {
      await postGitHubAPI(createBranchUrl, token, {
        ref: `refs/heads/${branchName}`,
        sha: baseSha,
      });

      console.log(`✅ Successfully created branch: ${branchName}`);
      return branchName;
    } catch (error: any) {
      if (error.message.includes('Reference already exists')) {
        console.log(
          `⚠️ Branch ${branchName} already exists, trying with new name...`
        );
        if (attempt === maxAttempts - 1) {
          // Last attempt - try to delete existing branch first
          try {
            const deleteBranchUrl = `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branchName}`;
            await fetch(deleteBranchUrl, {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github.v3+json',
                'User-Agent': 'MCP-GitHub-Tool/1.0',
              },
            });
            console.log(`🗑️ Deleted existing branch: ${branchName}`);

            // Try to create again after deletion
            await postGitHubAPI(createBranchUrl, token, {
              ref: `refs/heads/${branchName}`,
              sha: baseSha,
            });

            console.log(
              `✅ Successfully created branch after cleanup: ${branchName}`
            );
            return branchName;
          } catch (deleteError) {
            console.log(`❌ Failed to delete existing branch: ${deleteError}`);
            throw new Error(
              `Failed to create branch after ${maxAttempts} attempts. Last error: ${error.message}`
            );
          }
        }
        continue; // Try next attempt
      } else {
        throw error; // Re-throw non-branch-conflict errors
      }
    }
  }

  throw new Error(`Failed to create branch after ${maxAttempts} attempts`);
}

// Helper function to parse GitHub repository path from various formats
export function parseGitHubRepoPath(repoPath: string): {
  owner: string;
  repo: string;
  folder?: string;
  specificFile?: string;
  isFile: boolean;
} {
  if (!repoPath || typeof repoPath !== 'string') {
    throw new Error('GitHub repo path is required and must be a string');
  }

  // Remove leading/trailing whitespace and slashes
  let cleanPath = repoPath.trim().replace(/^\/+/, '').replace(/\/+$/, '');

  // Remove protocol if present (https:// or http://)
  if (cleanPath.startsWith('https://') || cleanPath.startsWith('http://')) {
    cleanPath = cleanPath.replace(/^https?:\/\//, '');
  }

  // Remove github.com prefix if present
  if (cleanPath.startsWith('github.com/')) {
    cleanPath = cleanPath.substring('github.com/'.length);
  }

  // Remove .git suffix if present
  if (cleanPath.endsWith('.git')) {
    cleanPath = cleanPath.substring(0, cleanPath.length - 4);
  }

  let owner: string;
  let repo: string;
  let folder: string | undefined;
  let specificFile: string | undefined;
  let isFile = false;

  // Handle GitHub tree URLs like "owner/repo/tree/branch/folder/subfolder"
  if (cleanPath.includes('/tree/')) {
    const treeParts = cleanPath.split('/tree/');
    if (treeParts.length !== 2) {
      throw new Error(`Invalid GitHub tree URL format: ${repoPath}`);
    }

    const [repoPathPart, branchAndFolder] = treeParts;
    const repoParts = repoPathPart.split('/');

    if (repoParts.length < 2) {
      throw new Error(`Invalid repo path in tree URL: ${repoPath}`);
    }

    owner = repoParts[0];
    repo = repoParts[1];

    // Extract folder path after branch name
    const branchFolderParts = branchAndFolder.split('/');
    if (branchFolderParts.length > 1) {
      // Skip the branch name (first part) and join the rest as folder path
      const fullPath = branchFolderParts.slice(1).join('/');

      // Check if it's a file
      const fileExtensionRegex = /\.[a-zA-Z0-9]+$/;
      if (fileExtensionRegex.test(fullPath)) {
        isFile = true;
        specificFile = fullPath;
        // Folder is the parent directory of the file
        const pathParts = fullPath.split('/');
        if (pathParts.length > 1) {
          folder = pathParts.slice(0, -1).join('/');
        }
      } else {
        folder = fullPath;
      }
    }
  } else {
    // Handle simple paths like "owner/repo" or "owner/repo/folder/subfolder"
    const parts = cleanPath.split('/');

    if (parts.length < 2) {
      throw new Error(
        `Invalid repo path format: ${repoPath}. Expected format: owner/repo or owner/repo/folder`
      );
    }

    owner = parts[0];
    repo = parts[1];

    // If there are more parts, they form the path
    if (parts.length > 2) {
      const pathParts = parts.slice(2);
      const fullPath = pathParts.join('/');

      // Check if the path ends with a file extension (e.g., .md, .json, .mdc, .yaml, .txt, etc.)
      const fileExtensionRegex = /\.[a-zA-Z0-9]+$/;
      if (fileExtensionRegex.test(fullPath)) {
        // This is a file path
        isFile = true;
        specificFile = fullPath;
        // Folder is the parent directory of the file
        if (pathParts.length > 1) {
          folder = pathParts.slice(0, -1).join('/');
        }
      } else {
        // This is a folder path
        folder = fullPath;
      }
    }
  }

  // Validate owner and repo are not empty
  if (!owner || !repo) {
    throw new Error(
      `Invalid repo path: owner and repo cannot be empty. Got owner="${owner}", repo="${repo}"`
    );
  }

  // Validate owner and repo contain only valid characters
  const validRepoRegex = /^[a-zA-Z0-9._-]+$/;
  if (!validRepoRegex.test(owner)) {
    throw new Error(
      `Invalid owner name: ${owner}. Must contain only alphanumeric characters, dots, underscores, and hyphens.`
    );
  }
  if (!validRepoRegex.test(repo)) {
    throw new Error(
      `Invalid repo name: ${repo}. Must contain only alphanumeric characters, dots, underscores, and hyphens.`
    );
  }

  return { owner, repo, folder, specificFile, isFile };
}

// Helper function to get GitHub config for a specific configuration name
function getGitHubConfig(configName: string, credentials?: GitHubCredentials) {
  if (credentials) {
    return credentials;
  }

  // Find the config in the catalog
  const config = catalog.find((c) => c.name === configName);
  if (!config) {
    throw new Error(
      `Unknown configuration: ${configName}. Available configurations: ${catalog
        .map((c) => c.name)
        .join(', ')}`
    );
  }

  // Parse the GitHub repo path directly from the catalog
  const { owner, repo, folder, specificFile, isFile } = parseGitHubRepoPath(
    config.github_repo_path
  );

  // Get GitHub token from environment or use the one from config
  const token = config.github_token || Deno.env.get('GITHUB_TOKEN');
  if (!token) {
    throw new Error(
      'GitHub token is required - set GITHUB_TOKEN environment variable'
    );
  }

  return {
    token,
    owner,
    repo,
    folder,
    specificFile,
    isFile,
    description: config.description,
  };
}

// Helper function to format repository structure
function formatRepoStructure(contents: any[], path: string = ''): string {
  let structure = '';

  // Sort by type (directories first) then by name
  const sortedContents = contents.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'dir' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  for (const item of sortedContents) {
    const indent = '  '.repeat(path.split('/').filter((p) => p).length);
    const icon = item.type === 'dir' ? '📁' : '📄';
    const size = item.size ? ` (${(item.size / 1024).toFixed(1)}KB)` : '';

    structure += `${indent}${icon} ${item.name}${size}\n`;
  }

  return structure;
}

// Static tool executors - no dynamic generation
export const toolExecutors: Record<
  string,
  (args: any, credentials?: GitHubCredentials) => Promise<ToolCallResult>
> = {
  global_docs_list: async (
    args: {},
    credentials?: GitHubCredentials
  ): Promise<ToolCallResult> => {
    console.log('📋 Listing all available configurations...');

    // Return list of all available configurations
    const configList = catalog
      .map((config) => {
        const configInfo = catalogToConfigInfo(config);
        return `📋 **${config.name}**\n   URL: ${
          configInfo.url
        }\n   Description: ${config.description || 'No description available'}`;
      })
      .join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `📚 Available Configurations:\n\n${configList}`,
        },
      ],
    };
  },

  global_docs_get_info: async (
    args: {
      config_name?: string;
    },
    credentials?: GitHubCredentials
  ): Promise<ToolCallResult> => {
    console.log('ℹ️ Getting configuration info...');
    console.log('Parameters:', { config_name: args?.config_name || 'all' });

    if (!args?.config_name) {
      // Return list of all available configurations
      const configList = catalog
        .map((config) => {
          const configInfo = catalogToConfigInfo(config);
          return `📋 **${config.name}**\n   URL: ${
            configInfo.url
          }\n   Description: ${
            config.description || 'No description available'
          }`;
        })
        .join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `📚 Available Configurations:\n\n${configList}`,
          },
        ],
      };
    }

    // Return specific configuration info
    const config = catalog.find((c) => c.name === args.config_name);
    if (!config) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Configuration '${
              args.config_name
            }' not found.\n\nAvailable configurations: ${catalog
              .map((c) => c.name)
              .join(', ')}`,
          },
        ],
      };
    }

    const configInfo = catalogToConfigInfo(config);
    return {
      content: [
        {
          type: 'text',
          text: `📋 Configuration: **${config.name}**\n🔗 URL: ${
            configInfo.url
          }\n📝 Description: ${
            config.description || 'No description available'
          }`,
        },
      ],
    };
  },

  global_docs_list_contents: async (
    args: {
      config_name: string;
      path?: string;
    },
    credentials?: GitHubCredentials
  ): Promise<ToolCallResult> => {
    console.log('🔍 Listing repository contents...');
    console.log('Parameters:', {
      config_name: args.config_name,
      path: args?.path || 'root',
    });

    const { token, owner, repo, folder } = getGitHubConfig(
      args.config_name,
      credentials
    );
    let path = args?.path || '';

    // Apply folder restrictions
    if (folder) {
      if (!path) {
        path = folder; // Default to the restricted folder
      } else {
        path = enforceFolderSecurity(path, folder);
      }
    }

    const folderContext = folder ? ` (restricted to "${folder}" folder)` : '';
    console.log(
      `📁 Target repository: ${owner}/${repo}${
        path ? ` (path: ${path})` : ' (root)'
      }${folderContext}`
    );

    try {
      // Construct GitHub API URL
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents${
        path ? `/${path}` : ''
      }`;

      console.log(`📡 Fetching from GitHub API: ${apiUrl}`);

      // Fetch repository contents
      const contents = await fetchGitHubAPI(apiUrl, token);

      // Handle single file response
      if (!Array.isArray(contents)) {
        if (contents.type === 'file') {
          return {
            content: [
              {
                type: 'text',
                text:
                  `📄 File: ${contents.name}\n` +
                  `📍 Path: ${contents.path}\n` +
                  `📏 Size: ${(contents.size / 1024).toFixed(1)}KB\n` +
                  `🔗 Download URL: ${contents.download_url}${
                    folderContext ? `\n🔒 Folder Restriction: ${folder}` : ''
                  }`,
              },
            ],
          };
        }
      }

      // Format the repository structure
      const structure = formatRepoStructure(contents, path);

      const resultText = `📁 Repository Contents: ${owner}/${repo}${
        path ? `/${path}` : ''
      }${folderContext}\n\n${structure}`;

      console.log('✅ Repository contents retrieved successfully');

      return {
        content: [
          {
            type: 'text',
            text: resultText,
          },
        ],
      };
    } catch (error) {
      console.error('❌ Error listing repository contents:', error);
      return {
        content: [
          {
            type: 'text',
            text:
              `❌ Error listing repository contents\n` +
              `📁 Repository: ${owner}/${repo}${
                path ? `/${path}` : ' (root)'
              }\n` +
              `${folder ? `🔒 Folder Restriction: ${folder}\n` : ''}` +
              `\n🔧 ${
                error instanceof Error
                  ? error.message
                  : 'Unknown error occurred'
              }\n` +
              `\n💡 Please check your GitHub token permissions and repository access.`,
          },
        ],
      };
    }
  },

  global_docs_check_file_exists: async (
    args: {
      config_name: string;
      file_path?: string;
    },
    credentials?: GitHubCredentials
  ): Promise<ToolCallResult> => {
    console.log('🔍 Checking if file exists...');
    console.log('Parameters:', {
      config_name: args.config_name,
      file_path: args.file_path || 'auto-detect',
    });

    const { token, owner, repo, folder, specificFile, isFile } =
      getGitHubConfig(args.config_name, credentials);

    let filePath: string;

    // Smart file resolution: if config points to specific file, use that
    if (isFile && specificFile) {
      filePath = specificFile;
      console.log(
        `🧠 Smart resolution: Checking specific file from config: ${specificFile}`
      );
    } else if (args.file_path) {
      // Apply folder restrictions
      filePath = enforceFolderSecurity(args.file_path, folder);
      console.log(`📁 Using user-provided file path: ${filePath}`);
    } else {
      throw new Error(
        `No file specified. Config "${args.config_name}" points to a folder, please specify file_path parameter.`
      );
    }

    try {
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

      try {
        const response = await fetchGitHubAPI(apiUrl, token);

        return {
          content: [
            {
              type: 'text',
              text:
                `✅ File exists: ${filePath}\n` +
                `📏 Size: ${(response.size / 1024).toFixed(1)}KB\n` +
                `🔗 URL: ${response.html_url}\n` +
                `${isFile ? '🧠 Auto-detected from configuration\n' : ''}` +
                `${folder ? `🔒 Folder Restriction: ${folder}` : ''}`,
            },
          ],
        };
      } catch (error: any) {
        if (error.message.includes('404')) {
          return {
            content: [
              {
                type: 'text',
                text:
                  `❌ File does not exist: ${filePath}\n` +
                  `${isFile ? '🧠 Auto-detected from configuration\n' : ''}` +
                  `${folder ? `🔒 Folder Restriction: ${folder}` : ''}`,
              },
            ],
          };
        }
        throw error;
      }
    } catch (error) {
      console.error('❌ Error checking file existence:', error);
      return {
        content: [
          {
            type: 'text',
            text:
              `❌ Error checking file: ${filePath}\n` +
              `${isFile ? '🧠 Auto-detected from configuration\n' : ''}` +
              `${folder ? `🔒 Folder Restriction: ${folder}\n` : ''}` +
              `\n🔧 ${
                error instanceof Error
                  ? error.message
                  : 'Unknown error occurred'
              }\n` +
              `\n💡 Please check your GitHub token permissions and repository access.`,
          },
        ],
      };
    }
  },

  global_docs_get_file_content: async (
    args: {
      config_name: string;
      file_path?: string;
      branch?: string;
    },
    credentials?: GitHubCredentials
  ): Promise<ToolCallResult> => {
    console.log('📄 Getting file content...');
    console.log('Parameters:', {
      config_name: args.config_name,
      file_path: args.file_path || 'auto-detect',
      branch: args.branch || 'main',
    });

    const { token, owner, repo, folder, specificFile, isFile } =
      getGitHubConfig(args.config_name, credentials);
    const branch = args.branch || 'main';

    let filePath: string;

    // Smart file resolution: if config points to specific file, use that
    if (isFile && specificFile) {
      filePath = specificFile;
      console.log(
        `🧠 Smart resolution: Using specific file from config: ${specificFile}`
      );
    } else if (args.file_path) {
      // Apply folder restrictions - ensure path is within allowed folder
      filePath = ensurePathInFolder(args.file_path, folder);
      console.log(`📁 Using user-provided file path: ${filePath}`);
    } else {
      throw new Error(
        `No file specified. Config "${args.config_name}" points to a folder, please specify file_path parameter.`
      );
    }

    try {
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;

      try {
        const response = await fetchGitHubAPI(apiUrl, token);

        if (response.type !== 'file') {
          return {
            content: [
              {
                type: 'text',
                text:
                  `❌ Error: "${filePath}" is not a file (it's a ${response.type})\n` +
                  `${isFile ? '🧠 Auto-detected from configuration\n' : ''}` +
                  `${folder ? `🔒 Folder Restriction: ${folder}` : ''}`,
              },
            ],
          };
        }

        // Decode base64 content
        const content = atob(response.content.replace(/\n/g, ''));

        return {
          content: [
            {
              type: 'text',
              text:
                `📄 File: ${filePath}\n` +
                `🌿 Branch: ${branch}\n` +
                `📏 Size: ${(response.size / 1024).toFixed(1)}KB\n` +
                `${isFile ? '🧠 Auto-detected from configuration\n' : ''}` +
                `${folder ? `🔒 Folder Restriction: ${folder}\n` : ''}\n` +
                `📝 Content:\n\`\`\`\n${content}\n\`\`\``,
            },
          ],
        };
      } catch (error: any) {
        if (error.message.includes('404')) {
          return {
            content: [
              {
                type: 'text',
                text:
                  `❌ File not found: ${filePath}\n` +
                  `${isFile ? '🧠 Auto-detected from configuration\n' : ''}` +
                  `${folder ? `🔒 Folder Restriction: ${folder}\n` : ''}` +
                  `\n💡 The file doesn't exist yet. You can create it using the add_file tool.`,
              },
            ],
          };
        }
        throw error;
      }
    } catch (error) {
      console.error('❌ Error getting file content:', error);
      return {
        content: [
          {
            type: 'text',
            text:
              `❌ Error accessing file: ${filePath}\n` +
              `${isFile ? '🧠 Auto-detected from configuration\n' : ''}` +
              `${folder ? `🔒 Folder Restriction: ${folder}\n` : ''}` +
              `\n🔧 ${
                error instanceof Error
                  ? error.message
                  : 'Unknown error occurred'
              }`,
          },
        ],
      };
    }
  },

  global_docs_add_or_update_file: async (
    args: {
      config_name: string;
      file_path?: string;
      file_content: string;
      commit_message: string;
      pr_title: string;
      pr_description?: string;
      suggested_path?: string;
    },
    credentials?: GitHubCredentials
  ): Promise<ToolCallResult> => {
    console.log('🚀 Adding or updating file in repository...');
    console.log('Parameters:', {
      config_name: args.config_name,
      file_path: args.file_path || 'auto-detect',
      commit_message: args.commit_message,
      pr_title: args.pr_title,
    });

    const { token, owner, repo, folder, specificFile, isFile } =
      getGitHubConfig(args.config_name, credentials);

    let filePath: string;

    // Smart file resolution: if config points to specific file, use that
    if (isFile && specificFile) {
      filePath = specificFile;
      console.log(
        `🧠 Smart resolution: Updating specific file from config: ${specificFile}`
      );
    } else if (args.file_path) {
      // Apply folder restrictions - ensure file is placed within allowed folder
      filePath = folder
        ? ensurePathInFolder(args.file_path, folder)
        : args.file_path;
      console.log(`📁 Using user-provided file path: ${filePath}`);
    } else {
      throw new Error(
        `No file specified. Config "${args.config_name}" points to a folder, please specify file_path parameter.`
      );
    }

    try {
      // Step 1: Check if file already exists
      console.log('🔍 Step 1: Checking if file already exists...');
      let fileExists = false;
      let existingSha = '';

      try {
        const checkUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
        const existingFile = await fetchGitHubAPI(checkUrl, token);
        fileExists = true;
        existingSha = existingFile.sha;
        console.log('⚠️ File already exists, will update it');
      } catch (error: any) {
        if (error.message.includes('404')) {
          console.log('✅ File does not exist, will create new');
        } else {
          throw error;
        }
      }

      // Step 2: Get the default branch SHA
      console.log('🔍 Step 2: Getting default branch reference...');
      const refUrl = `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/main`;
      const refResponse = await fetchGitHubAPI(refUrl, token);
      const baseSha = refResponse.object.sha;

      // Step 3: Create new branch with retry logic
      console.log(`🌿 Step 3: Creating branch with retry logic...`);
      const branchName = await createBranchWithRetry(
        owner,
        repo,
        token,
        filePath.split('/').pop() || 'config',
        baseSha
      );

      // Step 4: Create/Update file in the new branch
      console.log('📝 Step 4: Adding file to branch...');
      const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

      const fileData: any = {
        message: args.commit_message,
        content: encodeBase64(args.file_content), // Base64 encode with UTF-8 support
        branch: branchName,
      };

      if (fileExists) {
        fileData.sha = existingSha;
      }

      await putGitHubAPI(fileUrl, token, fileData);

      // Step 5: Create pull request
      console.log('🔄 Step 5: Creating pull request...');
      const prUrl = `https://api.github.com/repos/${owner}/${repo}/pulls`;
      const prResponse = await postGitHubAPI(prUrl, token, {
        title: args.pr_title,
        head: branchName,
        base: 'main',
        body:
          args.pr_description ||
          `Automated ${
            fileExists ? 'update' : 'addition'
          } of configuration file: ${filePath}${
            isFile ? '\n\n🧠 Auto-detected from configuration' : ''
          }${folder ? `\n🔒 Folder Restriction: ${folder}` : ''}`,
        draft: false,
      });

      const resultText =
        `🎉 Successfully ${fileExists ? 'updated' : 'added'} file!\n\n` +
        `📄 File: ${filePath}\n` +
        `🌿 Branch: ${branchName}\n` +
        `🔄 Pull Request: #${prResponse.number}\n` +
        `🔗 PR URL: ${prResponse.html_url}\n` +
        `${isFile ? '🧠 Auto-detected from configuration\n' : ''}` +
        `${folder ? `🔒 Folder Restriction: ${folder}\n` : ''}\n` +
        `The pull request has been created and is ready for review.`;

      console.log('✅ File added/updated successfully');

      return {
        content: [
          {
            type: 'text',
            text: resultText,
          },
        ],
      };
    } catch (error) {
      console.error('❌ Error adding/updating file:', error);
      return {
        content: [
          {
            type: 'text',
            text:
              `❌ Error adding/updating file: ${filePath}\n` +
              `${isFile ? '🧠 Auto-detected from configuration\n' : ''}` +
              `${folder ? `🔒 Folder Restriction: ${folder}\n` : ''}` +
              `\n🔧 ${
                error instanceof Error
                  ? error.message
                  : 'Unknown error occurred'
              }\n` +
              `\n💡 Please check your GitHub token permissions and repository access.`,
          },
        ],
      };
    }
  },

  global_docs_smart_add_file: async (
    args: {
      config_name: string;
      file_name: string;
      file_content: string;
      file_type?: string;
      file_extension?: string;
      description?: string;
    },
    credentials?: GitHubCredentials
  ): Promise<ToolCallResult> => {
    console.log('🧠 Smart file addition...');
    console.log('Parameters:', {
      config_name: args.config_name,
      file_name: args.file_name,
      file_type: args.file_type || 'general',
      file_extension: args.file_extension || 'json',
    });

    const { token, owner, repo, folder } = getGitHubConfig(
      args.config_name,
      credentials
    );
    const fileType = args.file_type || 'general';
    const fileExtension = args.file_extension || 'json';

    try {
      // Step 1: Analyze repository structure (restricted to folder if specified)
      console.log('🔍 Step 1: Analyzing repository structure...');
      const analysisPath = folder || '';
      const rootContents = await fetchGitHubAPI(
        `https://api.github.com/repos/${owner}/${repo}/contents${
          analysisPath ? `/${analysisPath}` : ''
        }`,
        token
      );

      // Look for common config directories
      const configDirs = rootContents.filter(
        (item: any) =>
          item.type === 'dir' &&
          (item.name.toLowerCase().includes('config') ||
            item.name.toLowerCase().includes('settings') ||
            item.name.toLowerCase().includes('env'))
      );

      let suggestedPath = '';
      let analysisResult = '';

      const folderPrefix = folder ? `${folder}/` : '';

      if (configDirs.length > 0) {
        // Found config directories, analyze them
        console.log(
          `📁 Found ${configDirs.length} potential config directories`
        );

        for (const dir of configDirs) {
          try {
            const dirContents = await fetchGitHubAPI(
              `https://api.github.com/repos/${owner}/${repo}/contents/${folderPrefix}${dir.name}`,
              token
            );

            // Look for subdirectories that match the file type
            const typeSpecificDirs = dirContents.filter(
              (item: any) =>
                item.type === 'dir' &&
                (item.name.toLowerCase().includes(fileType.toLowerCase()) ||
                  fileType.toLowerCase().includes(item.name.toLowerCase()))
            );

            if (typeSpecificDirs.length > 0) {
              suggestedPath = `${folderPrefix}${dir.name}/${typeSpecificDirs[0].name}/${args.file_name}.${fileExtension}`;
              analysisResult += `✅ Found specific directory for ${fileType}: ${folderPrefix}${dir.name}/${typeSpecificDirs[0].name}\n`;
              break;
            } else {
              // Check if there's a general subdirectory structure
              const hasSubdirs = dirContents.some(
                (item: any) => item.type === 'dir'
              );
              if (hasSubdirs) {
                suggestedPath = `${folderPrefix}${dir.name}/${fileType}/${args.file_name}.${fileExtension}`;
                analysisResult += `📁 Will create new ${fileType} subdirectory in ${folderPrefix}${dir.name}\n`;
              } else {
                suggestedPath = `${folderPrefix}${dir.name}/${args.file_name}.${fileExtension}`;
                analysisResult += `📄 Will place directly in ${folderPrefix}${dir.name}\n`;
              }
            }
          } catch (error) {
            console.log(`⚠️ Could not analyze ${dir.name}: ${error}`);
          }
        }
      } else {
        // No config directories found, suggest creating one
        suggestedPath = `${folderPrefix}configs/${fileType}/${args.file_name}.${fileExtension}`;
        analysisResult = `📁 No config directories found, will create: ${folderPrefix}configs/${fileType}/\n`;
      }

      // Step 2: Check if suggested file already exists
      console.log(`🔍 Step 2: Checking if ${suggestedPath} already exists...`);
      let fileExists = false;
      try {
        await fetchGitHubAPI(
          `https://api.github.com/repos/${owner}/${repo}/contents/${suggestedPath}`,
          token
        );
        fileExists = true;
        analysisResult += `⚠️ File already exists at ${suggestedPath}\n`;
      } catch (error: any) {
        if (error.message.includes('404')) {
          analysisResult += `✅ Path is available: ${suggestedPath}\n`;
        }
      }

      // Step 3: Proceed with file creation
      console.log('🚀 Step 3: Creating file...');

      const commitMessage = `Add ${args.file_name} ${fileType} file`;
      const prTitle = `Add ${args.file_name} file`;
      const prDescription =
        `## 🔧 File Addition\n\n` +
        `**Type:** ${fileType}\n` +
        `**Name:** ${args.file_name}\n` +
        `**Path:** ${suggestedPath}\n` +
        `${folder ? `**Folder Restriction:** ${folder}\n` : ''}` +
        `${
          args.description ? `**Description:** ${args.description}\n\n` : ''
        }` +
        `### 📊 Repository Analysis\n${analysisResult}\n` +
        `This file was automatically placed based on repository structure analysis.`;

      // Use the existing add_or_update_file function
      const result = await toolExecutors.global_docs_add_or_update_file(
        {
          config_name: args.config_name,
          file_path: suggestedPath,
          file_content: args.file_content,
          commit_message: commitMessage,
          pr_title: prTitle,
          pr_description: prDescription,
        },
        credentials
      );

      // Enhance the result with analysis information
      const enhancedResult =
        `🧠 Smart File Analysis Complete!\n\n` +
        `### 📊 Repository Analysis\n${analysisResult}\n` +
        `### 📍 Suggested Placement\n${suggestedPath}\n` +
        `${folder ? `### 🔒 Folder Restriction\n${folder}\n` : ''}\n` +
        `${result.content[0].text}`;

      return {
        content: [
          {
            type: 'text',
            text: enhancedResult,
          },
        ],
      };
    } catch (error) {
      console.error('❌ Error in smart file addition:', error);
      return {
        content: [
          {
            type: 'text',
            text:
              `❌ Error in smart file addition\n` +
              `${folder ? `🔒 Folder Restriction: ${folder}\n` : ''}` +
              `\n🔧 ${
                error instanceof Error
                  ? error.message
                  : 'Unknown error occurred'
              }\n` +
              `\n💡 Please check your GitHub token permissions and repository access.`,
          },
        ],
      };
    }
  },
};
