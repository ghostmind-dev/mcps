import type { CustomArgs, CustomOptions } from 'jsr:@ghostmind/run';
import { dockerRegister, terraformActivate } from 'jsr:@ghostmind/run';

export default async function (_arg: CustomArgs, opts: CustomOptions) {
  const { start } = opts;

  await start({
    register: {
      command: dockerRegister,
      priority: 997,
      options: {
        amd64: true,
      },
    },
    activate: {
      command: terraformActivate,
      priority: 998,
      options: {
        component: 'run',
        arch: 'amd64',
      },
    },
  });
}
