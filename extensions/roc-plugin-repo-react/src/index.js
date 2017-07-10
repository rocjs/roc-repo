import * as validators from 'roc/validators';
import { lazyFunctionRequire } from 'roc';

import { invokeHook } from './util';

const lazyRequire = lazyFunctionRequire(require);

function fetchProjects(command) {
  return command(invokeHook('get-projects'));
}

module.exports.roc = {
  actions: [
    {
      hook: 'babel-config',
      description: 'Add react specific plugins and presets',
      action: () => () => babelConfig => ({
        ...babelConfig,
        plugins: [
          ...babelConfig.plugins,
          require.resolve('babel-plugin-transform-class-properties'),
        ],
        presets: [
          ...babelConfig.presets,
          require.resolve('babel-preset-react'),
        ],
      }),
    },
  ],
  required: {
    'roc-plugin-repo': '*',
  },
  hooks: {
    'get-projects': {
      description: 'Gets all projects.',
      returns: validators.isArray(validators.isObject()),
    },
    'babel-config': {
      description: 'Used to create a Babel configuration to be used.',
      initialValue: {},
      returns: validators.isObject(),
      arguments: {
        target: {
          validator: validators.isString,
          description: 'The target, will by default be either "cjs" or "esm".',
        },
      },
    },
  },
  dependencies: {
    exports: {
      '@storybook/react': '^3.0.1',
      react: '^15.6.1',
      'react-dom': '^15.6.1',
    },
  },
  commands: {
    repo: {
      storybook: {
        command: args =>
          fetchProjects(lazyRequire('./commands/storybook'))(args),
        description: 'Used to interact with React Storybook',
        arguments: {
          projects: {
            validator: validators.isArray(validators.isString),
            description: 'Projects to use',
          },
        },
        options: {
          publish: {
            validator: validators.isBoolean,
            description: 'If the Storybook should be published to GitHub pages',
            default: false,
          },
          port: {
            validator: validators.isInteger,
            description: 'The port to start React Storybook on',
            default: 9001,
          },
        },
      },
    },
  },
};
