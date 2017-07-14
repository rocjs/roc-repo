import log from 'roc/log/default';

import { invokeHook } from '../util';
import babel from './utils/babel';

export default projects => ({
  arguments: { managed: { projects: selectedProjects } },
  options: { managed: { watch } },
  context,
}) => {
  const settings = context.config.settings.repo;
  const selected = projects.filter(
    ({ name }) => !selectedProjects || selectedProjects.includes(name),
  );

  if (selected.length === 0) {
    return log.small.warn('No projects were found');
  }

  return Promise.all(
    settings.targets.map(mode =>
      Promise.all(
        selected
          .map(
            project =>
              new Promise((resolve, reject) => {
                const config = invokeHook('babel-config', mode, project);
                try {
                  babel(
                    {
                      identifier: project.name,
                      mode,
                      path: project.path,
                      src: `${project.path}/${settings.input}`,
                      out:
                        settings.targets.length === 1
                          ? `${project.path}/${settings.output}`
                          : `${project.path}/${settings.output}/${mode}`,
                      // We want to ignore potential __snapshots__ directories
                      ignore: settings.test.concat('**/__snapshots__/**'),
                      copyFiles: true,
                      sourceMaps: true,
                      babelrc: false,
                      watch,
                    },
                    config,
                  );
                } catch (err) {
                  if (err._babel && err instanceof SyntaxError) {
                    // Display codeFrame if it is an Babel Error
                    err.message = `${err.message}\n${err.codeFrame}`;
                    log.large.warn(project.name, 'Build Error', err);
                  }
                  reject(err);
                }
                resolve();
              }),
          )
          .map(promise => promise.then(() => 0, () => 1)),
      ).then(results =>
        results.reduce((previous, current) => Math.max(previous, current)),
      ),
    ),
  ).then(results => {
    const status = results.reduce((previous, current) =>
      Math.max(previous, current),
    );
    if (status === 1) {
      process.exitCode = 1;
      log.small.log(); // Create a new line for padding purposes
      log.small.error('Build failed.');
    } else if (!watch) {
      log.small.log(); // Create a new line for padding purposes
      log.small.success('Build succeeded.');
    }
  });
};
