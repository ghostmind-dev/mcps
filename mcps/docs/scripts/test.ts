import type { CustomArgs, CustomOptions } from 'jsr:@ghostmind/run';
import { $ } from 'npm:zx@8.1.3';

export default async function (_arg: CustomArgs, opts: CustomOptions) {
  $.verbose = true;

  const SERVER_URL = Deno.env.get('SERVER_URL') || 'http://localhost:3008/mcp';
  const BEARER_TOKEN = Deno.env.get('SERVER_TOKEN') || 'dev-token';

  console.log('\n🧪 Testing MCP client with Bearer token...');
  await $`npx -p mcp-remote@latest mcp-remote-client ${SERVER_URL} --header "Authorization:Bearer ${BEARER_TOKEN}"`;
}
