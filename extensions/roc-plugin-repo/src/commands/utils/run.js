import chalk from 'chalk';
import execa from 'execa';
import log from 'roc/log/default';
import logTransformer from 'strong-log-transformer';
import pAll from 'p-all';

const colorWheel = ['cyan', 'magenta', 'blue', 'yellow', 'green', 'red'];
let index = 0;
const getTag = projectName => {
  const color = chalk[colorWheel[index++ % colorWheel.length]]; // eslint-disable-line no-plusplus
  const tag = `${color(projectName)}:`;
  return tag;
};

export const createLogger = projectName => {
  const tag = getTag(projectName);
  return {
    logger: (msg, error) => log.small.log(`${tag} ${msg}`, error),
    tag,
  };
};

export default function run(
  projects,
  { binary, command, concurrent = 1, isMonorepo = false },
) {
  const commandString = binary ? `${binary} ${command.join(' ')}` : command;

  return () =>
    pAll(
      projects.map(project => () => {
        const tag = getTag(project.name);
        const prefixedStdout = logTransformer({
          tag,
        });
        const prefixedStderr = logTransformer({
          tag,
          mergeMultiline: true,
        });
        log.small.log(`${isMonorepo ? `${tag} ` : ''}${commandString}`);

        const execaOptions = {
          cwd: project.path,
          env: {
            FORCE_COLOR: true,
          },
        };

        const child = binary
          ? execa(binary, command, execaOptions)
          : execa.shell(command, execaOptions);

        if (isMonorepo) {
          if (projects.length > process.stdout.listenerCount('close')) {
            process.stdout.setMaxListeners(projects.length);
            process.stderr.setMaxListeners(projects.length);
          }

          child.stdout.pipe(prefixedStdout).pipe(process.stdout);
          child.stderr.pipe(prefixedStderr).pipe(process.stderr);
        } else {
          child.stdout.pipe(process.stdout);
          child.stderr.pipe(process.stderr);
        }

        return child.catch(error => {
          error.message = error.stderr; // eslint-disable-line no-param-reassign
          error.projectName = project.name; // eslint-disable-line no-param-reassign
          throw error;
        });
      }),
      { concurrency: concurrent },
    ).catch(error => {
      if (error.projectName) {
        log.large.error(
          `Problem when running "${commandString}"`,
          error.projectName || error,
          error,
        );
      } else {
        log.large.error(`Problem when running "${commandString}"`, error);
      }
    });
}
