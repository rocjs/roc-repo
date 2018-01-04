import execa from 'execa';
import chalk from 'chalk';
import log from 'roc/log/default';
import pAll from 'p-all';
import logTransformer from 'strong-log-transformer';

import { invokeHook } from '../../util';

export default function scriptRunner(script) {
  const scriptName = script.charAt(0).toUpperCase() + script.slice(1);

  return (
    selectedProjects,
    settings,
    concurrent = 1,
    options = {},
    extraArguments,
  ) => {
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
      ({ packageJSON }) => packageJSON.scripts && packageJSON.scripts[script],
    );

    // Projects without custom scripts
    const projectsWithoutCustomScript = selected.filter(
      ({ packageJSON }) => !packageJSON.scripts || !packageJSON.scripts[script],
    );

    const colorWheel = ['cyan', 'magenta', 'blue', 'yellow', 'green', 'red'];
    let tasks = [];

    let index = 0;
    const createLogger = projectName => {
      const color = chalk[colorWheel[index++ % colorWheel.length]]; // eslint-disable-line no-plusplus
      const tag = `${color(projectName)}:`;
      return {
        logger: (msg, error) => log.small.log(`${tag} ${msg}`, error),
        tag,
      };
    };

    // We don't want to run "repo XXXX" again if we are in a non-monorepo
    // and we where already launched using the "XXXX" npm script.
    // This because we would create a loop otherwise
    if (
      projectsWithCustomScript.length !== 0 &&
      (!!settings.mono || process.env.npm_lifecycle_event !== script)
    ) {
      const children = projectsWithCustomScript.length;
      tasks = tasks.concat(
        projectsWithCustomScript.map(project => () => {
          const tag = createLogger(project.name).tag;
          const prefixedStdout = logTransformer({
            tag,
          });
          const prefixedStderr = logTransformer({
            tag,
            mergeMultiline: true,
          });

          // TODO Should we pass in the arguments here, like watch?
          log.small.log(`${tag} Using custom script for ${script}`);
          const child = execa(settings.npmBinary, ['run', script], {
            cwd: project.path,
          });

          // Avoid "Possible EventEmitter memory leak detected" warning due to piped stdio
          if (children > process.stdout.listenerCount('close')) {
            process.stdout.setMaxListeners(children);
            process.stderr.setMaxListeners(children);
          }

          child.stdout.pipe(prefixedStdout).pipe(process.stdout);
          child.stderr.pipe(prefixedStderr).pipe(process.stderr);

          // Return the child process and enhance potential errors
          return child.catch(error => {
            error.message = error.stderr; // eslint-disable-line no-param-reassign
            error.projectName = project.name; // eslint-disable-line no-param-reassign
            throw error;
          });
        }),
      );
    }

    // Allow integrations for different kinds of projects
    invokeHook('run-script', script, projectsWithoutCustomScript, {
      options,
      extraArguments,
      createLogger,
    })(task => {
      tasks = tasks.concat(task);
    });

    return pAll(tasks, { concurrency: concurrent || 1 })
      .then(() => {
        if (process.exitCode === 1) {
          log.small.error(`${scriptName} failed.`);
        }

        // Special handling of watch mode
        if (!options.watch) {
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
      });
  };
}
