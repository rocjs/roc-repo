import { execute } from 'roc';
import log from 'roc/log/default/small';
import Listr from 'listr';

const unlink = (project, binary) =>
  execute(`${binary} unlink`, {
    silent: true,
    cwd: project.path,
  });

export default projects => ({
  arguments: { managed: { projects: selectedProjects } },
  context,
}) => {
  const settings = context.config.settings.repo;
  const selected = projects.filter(
    ({ name }) => !selectedProjects || selectedProjects.includes(name),
  );

  if (selected.length === 0) {
    return log.warn('No projects were found');
  }

  return new Listr(
    selected.map(project => ({
      title: `Unlinking ${project.name}`,
      task: () => unlink(project, settings.npmBinary),
    })),
    { concurrent: false },
  ).run();
};
