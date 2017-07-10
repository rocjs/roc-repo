import log from 'roc/log/default';

import generateStatus from '../semver/generateStatus';

import { isBreakingChange, incrementToString } from '../semver/utils';

const report = status => {
  const projects = Object.keys(status);
  if (projects.length === 0) {
    return log.small.success('Nothing to release');
  }

  return projects.forEach(project => {
    const changes = status[project].commits
      .map(
        commit =>
          `  — ${commit.header}${isBreakingChange(commit)
            ? '\n    BREAKING CHANGE'
            : ''}`,
      )
      .join('\n');
    log.large.raw(
      'log',
      incrementToString(status[project].increment).toUpperCase(),
    )(changes, project);
  });
};

export default projects => ({
  arguments: { managed: { projects: selectedProjects } },
  context,
}) => {
  const privateProjects = [];
  const settings = context.config.settings.repo;
  const selected = projects
    .filter(({ name }) => !selectedProjects || selectedProjects.includes(name))
    .filter(({ name, packageJSON }) => {
      if (packageJSON.private === true) {
        privateProjects.push(name);
      }

      return !packageJSON.private || packageJSON.private === false;
    });

  if (privateProjects.length > 0) {
    log.small.info(
      `The following projects are set as private and will not be released:\n${privateProjects
        .map(project => ` — ${project}`)
        .join('\n')}\n`,
    );
  }

  if (selected.length === 0) {
    return log.small.warn('No projects were found');
  }

  return generateStatus(selected, !!settings.mono).then(status =>
    report(status),
  );
};
