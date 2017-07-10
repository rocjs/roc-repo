import * as validators from 'roc/validators';
import { lazyFunctionRequire, execute } from 'roc';

import { invokeHook } from './util';

const lazyRequire = lazyFunctionRequire(require);

function fetchProjects(command) {
  return command(invokeHook('get-projects'));
}

module.exports.roc = {
  required: {
    'roc-plugin-repo': '*',
  },
  hooks: {
    'get-projects': {
      description: 'Gets all projects.',
      returns: validators.isArray(validators.isObject()),
    },
  },
  actions: [
    {
      hook: 'release-after-build',
      action: ({ directory }) => toRelease => previous => [
        ...previous,
        {
          title: 'Generate documentation',
          task: () =>
            execute(`roc docs ${toRelease.join(',')}`, {
              silent: true,
              context: directory,
            }),
        },
      ],
    },
  ],
  commands: {
    repo: {
      docs: {
        command: args => fetchProjects(lazyRequire('./commands/docs'))(args),
        description: 'Generates markdown documentation',
        arguments: {
          projects: {
            validator: validators.isArray(validators.isString),
            description: 'Projects to use',
          },
        },
      },
    },
  },
};
