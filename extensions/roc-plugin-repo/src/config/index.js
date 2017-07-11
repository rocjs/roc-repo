import { oneOf, isArray, isPath, isString, isObject } from 'roc/validators';

export const config = {
  settings: {
    repo: {
      // This makes the plugin work with existing roc repos as well as the default
      // convention for most monorepos
      mono: ['packages', 'extensions'],
      targets: ['cjs', 'esm'],
      input: 'src',
      output: 'lib',
      test: ['**/__tests__/**/*.js?(x)', '**/(*.)(spec|test).js?(x)'],
      npmBinary: 'npm',
      babelPresetEnv: {},
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
      targets: {
        description: 'The possible build targets.',
        validator: isArray(/cjs|esm/),
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
    },
  },
};
