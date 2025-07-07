export const catalog = [
  {
    name: 'app',
    description:
      'docs for how to build a new app following the organization guidelinea',
    github_repo_path: 'ghostmind-dev/docs/docs/app/app.md',
    github_token: Deno.env.get('GITHUB_TOKEN') || '',
  },
  {
    name: 'base',
    description:
      'base configuration and setup documentation for development environment',
    github_repo_path: 'ghostmind-dev/docs/docs/app/base.md',
    github_token: Deno.env.get('GITHUB_TOKEN') || '',
  },
  {
    name: 'custom',
    description:
      'custom configuration and customization guidelines for projects',
    github_repo_path: 'ghostmind-dev/docs/docs/app/custom.md',
    github_token: Deno.env.get('GITHUB_TOKEN') || '',
  },
  {
    name: 'docker',
    description: 'docker configuration and containerization documentation',
    github_repo_path: 'ghostmind-dev/docs/docs/app/docker.md',
    github_token: Deno.env.get('GITHUB_TOKEN') || '',
  },
  {
    name: 'infra',
    description: 'infrastructure setup and deployment documentation',
    github_repo_path: 'ghostmind-dev/docs/docs/app/infra.md',
    github_token: Deno.env.get('GITHUB_TOKEN') || '',
  },
  {
    name: 'local',
    description: 'local development environment setup and configuration',
    github_repo_path: 'ghostmind-dev/docs/docs/app/local.md',
    github_token: Deno.env.get('GITHUB_TOKEN') || '',
  },
  {
    name: 'rules',
    description: 'global custom rules and guidelines for development practices',
    github_repo_path: 'ghostmind-dev/docs/docs/rules/global-custom.mdc',
    github_token: Deno.env.get('GITHUB_TOKEN') || '',
  },
];
