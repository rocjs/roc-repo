import path from 'path';

import execa from 'execa';
import log from 'roc/log/default/small';
import Listr from 'listr';
import isCI from 'is-ci';

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
      task: () => execa.shell(remove(project)),
    })),
    { renderer: isCI ? 'verbose' : 'default' },
  ).run();
};
