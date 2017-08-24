import log from 'roc/log/default';
import generateTable from 'roc/lib/documentation/generateTable';
import { underline, green, red } from 'chalk';

import generateStatus from '../semver/generateStatus';
import { getNextVersions, createVersionsDoesNotMatch } from '../semver/utils';

export default projects => async ({
  arguments: { managed: { projects: selectedProjects } },
}) => {
  const selected = projects.filter(
    ({ name }) => !selectedProjects || selectedProjects.includes(name),
  );

  const status = await generateStatus(projects, true);
  const projectsWithVersions = getNextVersions(status, projects);

  const noLocalDependencies = [];

  selected.forEach(project => {
    const dependencies = {
      ...(project.packageJSON.dependencies || {}),
      ...(project.packageJSON.devDependencies || {}),
    };

    const versionsDoesNotMatch = createVersionsDoesNotMatch(
      projectsWithVersions,
      dependencies,
      false,
    );

    const local = Object.keys(dependencies)
      .filter(dependency =>
        projects.map(({ name }) => name).includes(dependency),
      )
      .map(dependency => ({
        current: projects.find(({ name }) => name === dependency).packageJSON
          .version,
        development: !project.packageJSON.dependencies[dependency],
        name: dependency,
        next: projectsWithVersions[dependency].version,
        requested: dependencies[dependency],
        satisfies: !versionsDoesNotMatch(dependency),
      }));

    const header = {
      name: {
        name: 'Dependency',
      },
      current: {
        name: 'Current version',
      },
      next: {
        name: 'Next stable version',
      },
      requested: {
        name: 'Requested version',
      },
      satisfies: {
        name: 'Matches and will be linked',
        renderer: input => (input ? green('Yes') : red('No')),
      },
      development: {
        name: 'Development dependency',
        renderer: input => (input ? green('Yes') : red('No')),
      },
    };

    const body = [
      {
        objects: local,
        name: underline(project.name),
        level: 0,
      },
    ];

    if (local.length > 0) {
      log.small.log(generateTable(body, header));
    } else {
      noLocalDependencies.push(project.name);
    }
  });

  if (noLocalDependencies.length > 0) {
    log.small.log(
      `The following projects don't have any local dependencies:\n${noLocalDependencies
        .map(projectName => ` — ${projectName}`)
        .join('\n')}`,
    );
  }
};
