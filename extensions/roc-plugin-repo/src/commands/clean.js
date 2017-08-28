import { execute } from 'roc';
import log from 'roc/log/default/small';
import Listr from 'listr';
import isCI from 'is-ci';

const rimraf = require.resolve('rimraf/bin');

const clean = (project, output) => `${rimraf} ${project.path}/${output}`;

export default projects => ({
  arguments: { managed: { projects: selectedProjects } },
  context,
}) => {
  const selected = projects.filter(
    ({ name }) => !selectedProjects || selectedProjects.includes(name),
  );

  if (selected.length === 0) {
    return log.warn('No projects were found');
  }

  return new Listr(
    selected.map(project => ({
      title: `Cleaning ${project.name}`,
      task: () => execute(clean(project, context.config.settings.repo.output)),
    })),
    { concurrent: true, renderer: isCI ? 'verbose' : 'default' },
  ).run();
};
