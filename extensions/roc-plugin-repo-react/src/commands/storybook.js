import path from 'path';

import { execute } from 'roc';
import log from 'roc/log/default/small';
import ghpages from 'gh-pages';

module.exports = projects => ({
  arguments: { managed: { projects: selectedProjects } },
  options: { managed: { port, publish } },
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

  if (publish) {
    const outputDirectory = '.out';

    return execute(
      `roc build ${selected
        .map(({ name }) => name)
        .join(
          ',',
        )} && build-storybook -c ${configDirectory} -o ${outputDirectory} `,
      {
        context: path.resolve(__dirname, '..', '..'),
        cwd: directory,
      },
    ).then(() =>
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

  return execute(`roc build ${selected.map(({ name }) => name).join(',')}`, {
    context: path.resolve(__dirname, '..', '..'),
    cwd: directory,
  }).then(() =>
    Promise.all([
      execute(`start-storybook -p ${port} -c ${configDirectory}`, {
        context: path.resolve(__dirname, '..', '..'),
        cwd: directory,
      }),
      execute(
        `roc build ${selected.map(({ name }) => name).join(',')} --watch`,
        {
          context: path.resolve(__dirname, '..', '..'),
          cwd: directory,
          silent: true,
        },
      ),
    ]),
  );
};
