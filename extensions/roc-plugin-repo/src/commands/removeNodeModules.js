import path from 'path';

import { execute } from 'roc';
import log from 'roc/log/default/small';
import Listr from 'listr';

const rimraf = require.resolve('rimraf/bin');

const remove = project =>
  `${rimraf} ${path.join(project.path, 'node_modules')}`;

export default projects => ({
  arguments: { managed: { projects: selectedProjects } },
}) => {
  const selected = projects.filter(
    ({ name }) => !selectedProjects || selectedProjects.includes(name),
  );

  if (selected.length === 0) {
    return log.warn('No projects were found');
  }

  return new Listr(
    selected.map(project => ({
      title: `Removing node_modules for ${project.name}`,
      task: () => execute(remove(project)),
    })),
  ).run();
};
