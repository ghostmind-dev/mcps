// GitHub tools - contains all GitHub repository interaction tools
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

// GitHub repository interaction tools for configuration management
export const tools: Tool[] = [
  {
    name: 'config_list_repo_contents',
    description:
      'List contents and folders in a GitHub repository - use when you need to explore or browse the repository structure. Keywords: github repo, repository contents, browse repo, list files',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description:
            'Path within the repository (optional, defaults to root)',
          default: '',
        },
      },
      required: [],
    },
  },
  {
    name: 'config_check_file_exists',
    description:
      'Check if a specific file exists in the GitHub repository. Keywords: github file, check file exists, file exists',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description:
            'Path to the file to check in the repository (e.g., "configs/my-config.json")',
        },
      },
      required: ['file_path'],
    },
  },
  {
    name: 'config_get_file_content',
    description:
      'Get the content of a file from the GitHub repository. Keywords: github file, read file, view file, file content',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Path to the file to retrieve from the repository',
        },
        branch: {
          type: 'string',
          description: 'Branch name (optional, defaults to main)',
          default: 'main',
        },
      },
      required: ['file_path'],
    },
  },
  {
    name: 'config_add_file',
    description:
      'Add or update a file in the GitHub repository with automatic branch creation and pull request - use when user wants to modify or add files to the repository. Keywords: github file, add file, update file, modify file, create file, new config, add config, config file, configuration, settings, new configuration, save config, store config, manage config',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description:
            'Path where to add the file in the repository (e.g., "configs/extensions/my-extension.json")',
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
      required: ['file_path', 'file_content', 'commit_message', 'pr_title'],
    },
  },
  {
    name: 'config_smart_add_file',
    description:
      'Intelligently add a file to the GitHub repository by analyzing repo structure and suggesting optimal placement - use when user wants to add a new file but is unsure about placement. Perfect for when users say "I have a new config", "add this configuration", "save this config", or "I want to add a new file". Keywords: github file, smart file placement, auto file placement, intelligent file placement, new config, add config, config file, configuration, settings, new configuration, save config, store config, manage config, I have a config, add this config, new file, where should this go',
    inputSchema: {
      type: 'object',
      properties: {
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
      required: ['file_name', 'file_content'],
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

// Helper function to generate branch name
function generateBranchName(baseName: string): string {
  const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '');
  const sanitized = baseName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `add-config-${sanitized}-${timestamp}`;
}

// Helper function to get environment variables with validation
function getGitHubConfig() {
  const token = Deno.env.get('GITHUB_TOKEN');
  const owner = Deno.env.get('GITHUB_OWNER');
  const repo = Deno.env.get('GITHUB_REPO');

  if (!token) {
    throw new Error(
      'GITHUB_TOKEN environment variable is required but not set'
    );
  }
  if (!owner) {
    throw new Error(
      'GITHUB_OWNER environment variable is required but not set'
    );
  }
  if (!repo) {
    throw new Error('GITHUB_REPO environment variable is required but not set');
  }

  return { token, owner, repo };
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

// Tool executors
export const toolExecutors: Record<
  string,
  (args: any) => Promise<ToolCallResult>
> = {
  config_list_repo_contents: async (args: {
    path?: string;
  }): Promise<ToolCallResult> => {
    console.log('🔍 Listing repository contents...');
    console.log('Parameters:', {
      path: args?.path || 'root',
    });

    const { token, owner, repo } = getGitHubConfig();
    const path = args?.path || '';

    console.log(
      `📁 Target repository: ${owner}/${repo}${
        path ? ` (path: ${path})` : ' (root)'
      }`
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
                  `🔗 Download URL: ${contents.download_url}`,
              },
            ],
          };
        }
      }

      // Format the repository structure
      const structure = formatRepoStructure(contents, path);

      const resultText = `📁 Repository Contents: ${owner}/${repo}${
        path ? `/${path}` : ''
      }\n\n${structure}`;

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
      throw new Error(
        `Failed to list repository contents: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  },

  config_check_file_exists: async (args: {
    file_path: string;
  }): Promise<ToolCallResult> => {
    console.log('🔍 Checking if file exists...');
    console.log('Parameters:', { file_path: args.file_path });

    const { token, owner, repo } = getGitHubConfig();

    try {
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${args.file_path}`;

      try {
        const response = await fetchGitHubAPI(apiUrl, token);

        return {
          content: [
            {
              type: 'text',
              text:
                `✅ File exists: ${args.file_path}\n` +
                `📏 Size: ${(response.size / 1024).toFixed(1)}KB\n` +
                `🔗 URL: ${response.html_url}`,
            },
          ],
        };
      } catch (error: any) {
        if (error.message.includes('404')) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ File does not exist: ${args.file_path}`,
              },
            ],
          };
        }
        throw error;
      }
    } catch (error) {
      console.error('❌ Error checking file existence:', error);
      throw new Error(
        `Failed to check file existence: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  },

  config_get_file_content: async (args: {
    file_path: string;
    branch?: string;
  }): Promise<ToolCallResult> => {
    console.log('📄 Getting file content...');
    console.log('Parameters:', {
      file_path: args.file_path,
      branch: args.branch || 'main',
    });

    const { token, owner, repo } = getGitHubConfig();
    const branch = args.branch || 'main';

    try {
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${args.file_path}?ref=${branch}`;
      const response = await fetchGitHubAPI(apiUrl, token);

      if (response.type !== 'file') {
        throw new Error(`Path ${args.file_path} is not a file`);
      }

      // Decode base64 content
      const content = atob(response.content.replace(/\n/g, ''));

      return {
        content: [
          {
            type: 'text',
            text:
              `📄 File: ${args.file_path}\n` +
              `🌿 Branch: ${branch}\n` +
              `📏 Size: ${(response.size / 1024).toFixed(1)}KB\n\n` +
              `📝 Content:\n\`\`\`\n${content}\n\`\`\``,
          },
        ],
      };
    } catch (error) {
      console.error('❌ Error getting file content:', error);
      throw new Error(
        `Failed to get file content: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  },

  config_add_file: async (args: {
    file_path: string;
    file_content: string;
    commit_message: string;
    pr_title: string;
    pr_description?: string;
    suggested_path?: string;
  }): Promise<ToolCallResult> => {
    console.log('🚀 Adding file to repository...');
    console.log('Parameters:', {
      file_path: args.file_path,
      commit_message: args.commit_message,
      pr_title: args.pr_title,
    });

    const { token, owner, repo } = getGitHubConfig();

    try {
      // Step 1: Check if file already exists
      console.log('🔍 Step 1: Checking if file already exists...');
      let fileExists = false;
      let existingSha = '';

      try {
        const checkUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${args.file_path}`;
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

      // Step 3: Create new branch
      const branchName = generateBranchName(
        args.file_path.split('/').pop() || 'config'
      );
      console.log(`🌿 Step 3: Creating branch: ${branchName}`);

      const createBranchUrl = `https://api.github.com/repos/${owner}/${repo}/git/refs`;
      await postGitHubAPI(createBranchUrl, token, {
        ref: `refs/heads/${branchName}`,
        sha: baseSha,
      });

      // Step 4: Create/Update file in the new branch
      console.log('📝 Step 4: Adding file to branch...');
      const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${args.file_path}`;

      const fileData: any = {
        message: args.commit_message,
        content: btoa(args.file_content), // Base64 encode
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
          `Automated addition of configuration file: ${args.file_path}`,
        draft: false,
      });

      const resultText =
        `🎉 Successfully ${fileExists ? 'updated' : 'added'} file!\n\n` +
        `📄 File: ${args.file_path}\n` +
        `🌿 Branch: ${branchName}\n` +
        `🔄 Pull Request: #${prResponse.number}\n` +
        `🔗 PR URL: ${prResponse.html_url}\n\n` +
        `The pull request has been created and is ready for review.`;

      console.log('✅ File added successfully');

      return {
        content: [
          {
            type: 'text',
            text: resultText,
          },
        ],
      };
    } catch (error) {
      console.error('❌ Error adding file:', error);
      throw new Error(
        `Failed to add file: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  },

  config_smart_add_file: async (args: {
    file_name: string;
    file_content: string;
    file_type?: string;
    file_extension?: string;
    description?: string;
  }): Promise<ToolCallResult> => {
    console.log('🧠 Smart file addition...');
    console.log('Parameters:', {
      file_name: args.file_name,
      file_type: args.file_type || 'general',
      file_extension: args.file_extension || 'json',
    });

    const { token, owner, repo } = getGitHubConfig();
    const fileType = args.file_type || 'general';
    const fileExtension = args.file_extension || 'json';

    try {
      // Step 1: Analyze repository structure
      console.log('🔍 Step 1: Analyzing repository structure...');
      const rootContents = await fetchGitHubAPI(
        `https://api.github.com/repos/${owner}/${repo}/contents`,
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

      if (configDirs.length > 0) {
        // Found config directories, analyze them
        console.log(
          `📁 Found ${configDirs.length} potential config directories`
        );

        for (const dir of configDirs) {
          try {
            const dirContents = await fetchGitHubAPI(
              `https://api.github.com/repos/${owner}/${repo}/contents/${dir.name}`,
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
              suggestedPath = `${dir.name}/${typeSpecificDirs[0].name}/${args.file_name}.${fileExtension}`;
              analysisResult += `✅ Found specific directory for ${fileType}: ${dir.name}/${typeSpecificDirs[0].name}\n`;
              break;
            } else {
              // Check if there's a general subdirectory structure
              const hasSubdirs = dirContents.some(
                (item: any) => item.type === 'dir'
              );
              if (hasSubdirs) {
                suggestedPath = `${dir.name}/${fileType}/${args.file_name}.${fileExtension}`;
                analysisResult += `📁 Will create new ${fileType} subdirectory in ${dir.name}\n`;
              } else {
                suggestedPath = `${dir.name}/${args.file_name}.${fileExtension}`;
                analysisResult += `📄 Will place directly in ${dir.name}\n`;
              }
            }
          } catch (error) {
            console.log(`⚠️ Could not analyze ${dir.name}: ${error}`);
          }
        }
      } else {
        // No config directories found, suggest creating one
        suggestedPath = `configs/${fileType}/${args.file_name}.${fileExtension}`;
        analysisResult = `📁 No config directories found, will create: configs/${fileType}/\n`;
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
        `**Path:** ${suggestedPath}\n\n` +
        `${
          args.description ? `**Description:** ${args.description}\n\n` : ''
        }` +
        `### 📊 Repository Analysis\n${analysisResult}\n` +
        `This file was automatically placed based on repository structure analysis.`;

      // Use the existing add_github_file function
      const result = await toolExecutors.config_add_file({
        file_path: suggestedPath,
        file_content: args.file_content,
        commit_message: commitMessage,
        pr_title: prTitle,
        pr_description: prDescription,
      });

      // Enhance the result with analysis information
      const enhancedResult =
        `🧠 Smart File Analysis Complete!\n\n` +
        `### 📊 Repository Analysis\n${analysisResult}\n` +
        `### 📍 Suggested Placement\n${suggestedPath}\n\n` +
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
      throw new Error(
        `Failed to add file intelligently: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  },
};
