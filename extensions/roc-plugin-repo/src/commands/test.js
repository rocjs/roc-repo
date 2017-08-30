import log from 'roc/log/default/small';
import jest from 'jest';

export default projects => ({
  arguments: { managed: { projects: selectedProjects } },
  options: { managed: managedOptions },
  extraArguments,
  context,
}) => {
  const settings = context.config.settings.repo;
  const selected = projects.filter(
    ({ name }) => !selectedProjects || selectedProjects.includes(name),
  );

  if (selected.length === 0) {
    return log.warn('No projects were found');
  }

  // Enforce test
  process.env.NODE_ENV = 'test';

  process.env.ROC_INITAL_ARGV = JSON.stringify(process.argv);

  let argv = [...extraArguments];

  const jestConfig = {
    resolver: require.resolve('./utils/jest/roc-resolver.js'),
    testPathIgnorePatterns: selected.map(
      ({ path }) => `${path}/(${settings.output}|node_modules)/`,
    ),
    transform: {
      '^.+\\.js$': require.resolve('./utils/jest/babel-jest-transformer.js'),
    },
    testMatch: [].concat(
      ...selected.map(({ path }) =>
        settings.test.map(pattern => `${path}/${pattern}`),
      ),
    ),
  };

  argv.push('--config', JSON.stringify(jestConfig));
  argv = argv
    .concat(
      Object.keys(managedOptions).map(
        key =>
          managedOptions[key] !== undefined &&
          `--${key}=${managedOptions[key]}`,
      ),
    )
    .filter(Boolean);

  return jest.run(argv);
};
