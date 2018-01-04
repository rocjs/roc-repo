import execa from 'execa';
import log from 'roc/log/default/small';
import Listr from 'listr';
import isCI from 'is-ci';

export default projects => ({
  arguments: { managed: { projects: selectedProjects } },
  options: { managed: { silent, concurrent } },
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

  return new Listr(
    selected.map(project => ({
      title: `Running "${command}" in ${project.name}`,
      task: () =>
        execa.shell(command, {
          stdout: silent ? undefined : 'inherit',
          cwd: project.path,
        }),
    })),
    { concurrent, renderer: isCI ? 'verbose' : 'default' },
  ).run();
};
