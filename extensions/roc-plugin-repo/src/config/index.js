import {
  createInfoObject,
  isArray,
  isBoolean,
  isObject,
  isPath,
  isString,
  oneOf,
} from 'roc/validators';
import { toBoolean } from 'roc/converters';

export const config = {
  settings: {
    repo: {
      // This makes the plugin work with existing roc repos as well as the default
      // convention for most monorepos
      mono: ['packages', 'extensions'],
      input: 'src',
      output: 'lib',
      test: ['**/__tests__/**/*.js?(x)', '**/(*.)(spec|test).js?(x)'],
      npmBinary: 'npm',
      babelPresetEnv: {},
      runGitHooks: false,
      release: {
        changelogTypes: ['fix', 'perf', 'revert', 'feat'],
        includeBody: false,
        collectedRelease: '[name:2:a].[hash:6].[date:yyyy-mm-dd]',
      },
    },
  },
};

export const meta = {
  settings: {
    repo: {
      mono: {
        description:
          'Directories that should be scanned for projects or false to disable monorepo support.',
        validator: oneOf(isArray(isPath), (input, info) => {
          if (info) {
            return { type: 'false' };
          }

          return input === false;
        }),
      },
      input: {
        description: 'Location of the code that should run through Babel.',
        validator: isPath,
      },
      output: {
        description: 'Location of where the compiled code should be saved.',
        validator: isPath,
      },
      test: {
        description: 'Glob patterns for where tests can be found.',
        validator: isArray(isString),
      },
      npmBinary: {
        description: 'What npm binary to use, can be "yarn" for example.',
        validator: isString,
      },
      babelPresetEnv: {
        description: 'Configuration to be used with babel-preset-env',
        validator: isObject({ unmanaged: true }),
      },
      runGitHooks: {
        description:
          'If Git hooks should be invoked on automatic commit and push creation',
        validator: isBoolean,
      },
      release: {
        changelogTypes: {
          description:
            'Commit message types that always should create an entry in changelogs or true to create for all',
          validator: oneOf((input, info) => {
            if (info) {
              return createInfoObject({
                validator: 'true',
                converter: () => toBoolean,
              });
            }

            return input === true;
          }, isArray(/^(feat|fix|perf|revert|docs|style|refactor|test|chore)$/)),
        },
        includeBody: {
          description:
            'If the body of the commit message should be part of the changelog',
          validator: isBoolean,
        },
        collectedRelease: {
          description: `Should be a template string if collected releases should be performed for monorepos or false if not.`,
          validator: oneOf((input, info) => {
            if (info) {
              return createInfoObject({
                validator: 'false',
                converter: () => toBoolean,
              });
            }

            return input === false;
          }, isString),
        },
      },
    },
  },
};
