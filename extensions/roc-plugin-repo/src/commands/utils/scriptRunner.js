import chalk from 'chalk';
import log from 'roc/log/default';
import pAll from 'p-all';

import { invokeHook } from '../../util';

import run, { createLogger } from './run';

export default function scriptRunner(script) {
  const scriptName = script.charAt(0).toUpperCase() + script.slice(1);

  return (
    selectedProjects,
    settings,
    concurrent = 1,
    options = {},
    extraArguments = [],
  ) => {
    const isMonorepo = !!settings.mono;
    const selected = selectedProjects.filter(
      // Remove projects that have disabled a command, setting to `"build": false` for example
      ({ name, rawPackageJSON }) => {
        const include =
          !rawPackageJSON.scripts || rawPackageJSON.scripts[script] !== false;
        if (!include) {
          log.small.warn(
            `${scriptName} has been disabled for ${chalk.bold(name)}\n`,
          );
        }
        return include;
      },
    );

    if (selected.length === 0) {
      return log.small.warn('No valid projects were found');
    }

    // Projects with custom scripts
    const projectsWithCustomScript = selected.filter(
      ({ packageJSON }) =>
        packageJSON.scripts &&
        packageJSON.scripts[script] &&
        // This check makes sure that we don't add the project again if we launched
        // it with the same script through npm, only for normal repositories
        (process.env.npm_lifecycle_event !== script || isMonorepo),
    );

    // Projects without custom scripts
    const projectsWithoutCustomScript = selected.filter(
      ({ packageJSON }) =>
        !packageJSON.scripts ||
        !packageJSON.scripts[script] ||
        // This check makes sure that we add it even if it is has a script
        // since we otherwise would miss it, only for normal repositories
        (process.env.npm_lifecycle_event === script && !isMonorepo),
    );

    let tasks = [];

    if (projectsWithCustomScript.length !== 0) {
      tasks = tasks.concat(
        run(projectsWithCustomScript, {
          binary: settings.npmBinary,
          command: ['run', script].concat(extraArguments),
          concurrent,
          isMonorepo,
        }),
      );
    }

    // Allow integrations for different kinds of projects
    if (projectsWithoutCustomScript.length > 0) {
      let rocTasks = [];
      invokeHook('run-script', script, projectsWithoutCustomScript, {
        options,
        extraArguments,
        createLogger,
      })(task => {
        rocTasks = rocTasks.concat(task);
      });

      tasks.push(() =>
        pAll(rocTasks, { concurrency: concurrent || 1 })
          .then(results => {
            // Flatten result and see if any of the jobs have enabled watch: true
            const watchMode = []
              .concat(...results)
              .some(({ watch } = {}) => watch);

            if (process.exitCode >= 1) {
              log.small.error(`${scriptName} failed.`);
            } else if (!watchMode) {
              log.small.log(); // Create a new line for padding purposes
              log.small.success(`${scriptName} succeeded.`);
            }
          })
          .catch(error => {
            if (error.projectName) {
              log.large.error(
                `${scriptName} Problem`,
                error.projectName || error,
                error,
              );
            } else {
              log.large.error(`${scriptName} Problem`, error);
            }
          }),
      );
    }

    return pAll(tasks, { concurrency: 1 });
  };
}
