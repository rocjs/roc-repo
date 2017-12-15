import log from 'roc/log/default';
import compareFunc from 'compare-func';

import generateStatus from '../semver/generateStatus';

import {
  isBreakingChange,
  incrementToString,
  getDefaultPrerelease,
} from '../semver/utils';

const report = (status, isMonorepo, prerelease) => {
  const projects = Object.keys(status);
  if (projects.length === 0) {
    return log.small.success('Nothing to release');
  }

  return projects.forEach(project => {
    const changes = status[project].commits
      .sort(compareFunc('type'))
      .map(
        commit =>
          `  — ${isMonorepo
            ? `${commit.type}: ${commit.subject}`
            : commit.header}${isBreakingChange(commit)
            ? '\n    BREAKING CHANGE'
            : ''}`,
      )
      .join('\n');
    log.large.raw(
      'log',
      incrementToString(status[project].increment).toUpperCase(),
    )(
      changes,
      `${project} - ${prerelease
        ? status[project].packageJSON.version
        : status[project].currentVersion} -> ${status[project]
        .newVersion}${!prerelease
        ? ` (current: ${status[project].packageJSON.version})`
        : ''}`,
    );
  });
};

export default projects => ({
  arguments: { managed: { projects: selectedProjects } },
  options: { managed: { from, prerelease } },
  context,
}) => {
  const privateProjects = [];
  const settings = context.config.settings.repo;
  const prereleaseTag = getDefaultPrerelease(prerelease);
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

  return generateStatus(
    selected,
    !!settings.mono,
    from,
    prereleaseTag,
  ).then(status => report(status, !!settings.mono, prereleaseTag));
};
