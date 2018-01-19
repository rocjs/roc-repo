import { join } from 'path';
import resolveFrom from 'resolve-from';
import jest from 'jest'; // eslint-disable-line import/no-extraneous-dependencies
import yargs from 'yargs';
import { merge, fileExists } from 'roc';
import log from 'roc/log/default/small';

const jestCli = require(resolveFrom(
  require.resolve('jest'),
  'jest-cli/build/cli/args',
));

export default (context, projects, { options, extraArguments }) => {
  // Enforce test
  process.env.NODE_ENV = 'test';

  process.env.ROC_INITAL_ARGV = JSON.stringify(process.argv);

  let jestConfig = {
    resolver: require.resolve('../commands/utils/jest/roc-resolver.js'),
    testPathIgnorePatterns: projects.map(
      ({ path }) =>
        `${path}/(${context.config.settings.repo.output}|node_modules)/`,
    ),
    transform: {
      '^.+\\.js$': require.resolve(
        '../commands/utils/jest/babel-jest-transformer.js',
      ),
    },
    testMatch: [].concat(
      ...projects.map(({ path }) =>
        context.config.settings.repo.test.map(pattern => `${path}/${pattern}`),
      ),
    ),
  };

  /**
  Merge Jest config

  TODO: To be moved into a standalone module for better reuse

  The priority when Roc loads Jest configuration.
  1. "jest" inside roc.config.js
  2. jest.config.js TODO: Manage --config path/to/js|json
  3. "jest" inside package.json
  */
  if (context.config.jest) {
    if (fileExists('jest.config.js', context.directory)) {
      log.warn(
        'You have defined a Jest configuration in the roc.config.js file that will be used over the existing jest.config.js file.',
      );
    } else if (context.packageJSON.jest) {
      log.warn(
        'You have defined a Jest configuration in the roc.config.js file that will be used over the configuration inside package.json.',
      );
    }
    jestConfig = merge(jestConfig, context.config.jest);
  } else if (fileExists('jest.config.js', context.directory)) {
    jestConfig = merge(
      jestConfig,
      require(join(context.directory, 'jest.config.js')),
    );
  } else if (context.packageJSON.jest) {
    jestConfig = merge(jestConfig, context.packageJSON.jest);
  }

  // Parse extra arguments in the same way as Jest does
  const jestArgv = yargs(extraArguments).options(jestCli.options).argv;

  // Remove empty keys
  Object.keys(jestArgv).forEach(
    key => jestArgv[key] === undefined && delete jestArgv[key],
  );
  Object.keys(options).forEach(
    key => options[key] === undefined && delete options[key], // eslint-disable-line no-param-reassign
  );

  const jestOptions = {
    ...jestArgv,
    ...options,
  };

  // Verify the options
  jestCli.check(jestOptions);

  return () =>
    jest
      .runCLI(
        {
          ...jestOptions,
          // We don't want to fail if there are no tests currently
          passWithNoTests: true,
          config: JSON.stringify(jestConfig),
        },
        [context.directory],
      )
      .then(
        ({ results }) =>
          results && results.success
            ? Promise.resolve(results)
            : Promise.reject(
                new Error(
                  results.testResults
                    .map(({ failureMessage }) => failureMessage)
                    .join(''),
                ),
              ),
      );
};
