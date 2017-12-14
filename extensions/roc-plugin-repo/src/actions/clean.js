import execa from 'execa';
import Listr from 'listr';
import isCI from 'is-ci';

const rimraf = require.resolve('rimraf/bin');

const clean = (project, output) => `${rimraf} ${project.path}/${output}`;

export default (context, projects) => () =>
  new Listr(
    projects.map(project => ({
      title: `Cleaning ${project.name}`,
      task: () =>
        execa.shell(clean(project, context.config.settings.repo.output)),
    })),
    { concurrent: true, renderer: isCI ? 'verbose' : 'default' },
  ).run();
