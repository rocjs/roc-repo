import log from 'roc/log/default/small';

import run from './utils/run';

export default projects => ({
  context,
  arguments: { managed: { projects: selectedProjects } },
  options: { managed: { concurrent } },
  extraArguments,
}) => {
  const selected = projects.filter(
    ({ name }) => !selectedProjects || selectedProjects.includes(name),
  );

  if (selected.length === 0) {
    return log.warn('No projects were found');
  }

  const command = extraArguments.join(' ');

  if (command.length === 0) {
    return log.warn('No command was given');
  }

  return run(selected, {
    command,
    concurrent,
    isMonorepo: !!context.config.settings.repo.mono,
  })();
};
