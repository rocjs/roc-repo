import path from 'path';
import fs from 'fs';

import { execute } from 'roc';
import log from 'roc/log/default/small';
import ghpages from 'gh-pages';
import onExit from 'signal-exit';

const buildStorybook = require.resolve('@storybook/react/dist/server/build');
const startStorybook = require.resolve('@storybook/react/dist/server/index');

module.exports = projects => ({
  arguments: { managed: { projects: selectedProjects } },
  options: {
    managed: {
      build,
      port,
      publish,
      'git-name': gitName,
      'git-email': gitEmail,
    },
  },
  context,
}) => {
  const directory = context.directory;
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
      `roc repo build ${selected
        .map(({ name }) => name)
        .join(
          ',',
        )} && node ${buildStorybook} -c ${configDirectory} -o ${outputDirectory} `,
      {
        cwd: directory,
      },
    );

    if (publish) {
      let unregister;
      const restoreGitHooksDirectory = () => {
        fs.renameSync(
          path.join(context.directory, '.git', 'hooks.backup'),
          path.join(context.directory, '.git', 'hooks'),
        );
      };

      const user = gitName
        ? {
            name: gitName,
            email: gitEmail,
          }
        : null;

      return building.then(() => {
        // Move Git hooks if we don't want to run Git hooks
        if (!context.config.settings.repo.runGitHooks) {
          unregister = onExit(restoreGitHooksDirectory);

          fs.renameSync(
            path.join(context.directory, '.git', 'hooks'),
            path.join(context.directory, '.git', 'hooks.backup'),
          );
        }

        return ghpages.publish(
          outputDirectory,
          {
            user,
            message: `Released at ${Date().toString()}`,
          },
          () => {
            if (!context.config.settings.repo.runGitHooks) {
              restoreGitHooksDirectory();
              unregister();
            }
            log.log(); // Create a new line for padding purposes
            log.success('Storybook published.');
          },
        );
      });
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
