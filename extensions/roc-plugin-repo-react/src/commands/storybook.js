import path from 'path';

import { execute } from 'roc';
import log from 'roc/log/default/small';
import ghpages from 'gh-pages';

const buildStorybook = require.resolve('@storybook/react/dist/server/build');
const startStorybook = require.resolve('@storybook/react/dist/server/index');

module.exports = projects => ({
  arguments: { managed: { projects: selectedProjects } },
  options: { managed: { build, port, publish } },
  context: { directory },
}) => {
  const configDirectory = path.resolve(__dirname, '../configuration/storybook');
  const selected = projects.filter(
    ({ name }) => !selectedProjects || selectedProjects.includes(name),
  );

  if (selected.length === 0) {
    return log.small.warn('No projects were found');
  }

  process.env.PROJECT_ROOT = directory;
  process.env.SELECTED_PROJECTS = JSON.stringify(selected);

  if (build || publish) {
    const outputDirectory = '.out';

    const building = execute(
      `roc build ${selected
        .map(({ name }) => name)
        .join(
          ',',
        )} && node ${buildStorybook} -c ${configDirectory} -o ${outputDirectory} `,
      {
        cwd: directory,
      },
    );

    if (publish) {
      return building.then(() =>
        ghpages.publish(
          outputDirectory,
          {
            message: `Released at ${Date().toString()}`,
          },
          () => {
            log.log(); // Create a new line for padding purposes
            log.success('Storybook published.');
          },
        ),
      );
    }
    return building;
  }

  return execute(`roc build ${selected.map(({ name }) => name).join(',')}`, {
    context: path.resolve(__dirname, '..', '..'),
    cwd: directory,
  }).then(() =>
    Promise.all([
      execute(`node ${startStorybook} -p ${port} -c ${configDirectory}`, {
        cwd: directory,
      }),
      execute(
        `roc build ${selected.map(({ name }) => name).join(',')} --watch`,
        {
          cwd: directory,
          silent: true,
        },
      ),
    ]),
  );
};
