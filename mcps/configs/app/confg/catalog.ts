export const catalog = [
  {
    name: 'gitignore',
    description: 'Update .gitignore files',
    github_repo_path: 'ghostmind-dev/config/config/git',
    github_token: Deno.env.get('GITHUB_TOKEN') || '',
  },
  {
    name: 'devcontainer',
    description: 'Update devcontainer template configuration',
    github_repo_path: 'ghostmind-dev/config/config/devcontainer/',
    github_token: Deno.env.get('GITHUB_TOKEN') || '',
  },
  {
    name: 'meta',
    description: 'json schema for meta.json',
    github_repo_path: 'ghostmind-dev/config/config/meta',
    github_token: Deno.env.get('GITHUB_TOKEN') || '',
  },
  {
    name: 'vscode_settings_dynamic',
    description: 'vscode settings for dynamic properties',
    github_repo_path: 'ghostmind-dev/config/config/vscode',
    github_token: Deno.env.get('GITHUB_TOKEN') || '',
  },
  {
    name: 'vscode_settings_static',
    description: 'vscode settings for static properties',
    github_repo_path: 'ghostmind-dev/features/features/src/settings',
    github_token: Deno.env.get('GITHUB_TOKEN') || '',
  },
  {
    name: 'vscode_extensions',
    description: 'vscode extensions',
    github_repo_path: 'ghostmind-dev/features/features/src/extensions',
    github_token: Deno.env.get('GITHUB_TOKEN') || '',
  },
  {
    name: 'vscode_themes',
    description: 'vscode themes',
    github_repo_path: 'ghostmind-dev/features/features/src/themes',
    github_token: Deno.env.get('GITHUB_TOKEN') || '',
  },
  {
    name: 'init',
    description: 'init settings for the devcontainer',
    github_repo_path: 'ghostmind-dev/features/features/src/init',
    github_token: Deno.env.get('GITHUB_TOKEN') || '',
  },
  {
    name: 'zsh',
    description: 'zsh settings',
    github_repo_path: 'ghostmind-dev/config/config/zsh',
    github_token: Deno.env.get('GITHUB_TOKEN') || '',
  },
];
