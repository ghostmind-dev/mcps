import { dockerComposeBuild, dockerComposeUp } from 'jsr:@ghostmind/run';
import type { CustomArgs, CustomOptions } from 'jsr:@ghostmind/run';

export default async function (args: CustomArgs, opts: CustomOptions) {
  const { run, has } = opts;

  if (has('build')) {
    await dockerComposeBuild({});
  }

  if (has('up')) {
    await dockerComposeUp({
      forceRecreate: true,
    });
  }
}
