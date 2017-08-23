import conventionalChangelog from 'conventional-changelog';
import semver from 'semver';

import { isBreakingChange, versions, incrementToString } from './utils';

export default function generateStatus(projects, isMonorepo, from, prerelease) {
  return new Promise(resolve => {
    const status = {};

    projects.forEach(project => {
      status[project.name] = {
        increment: versions.NOTHING,
        commits: [],
        path: project.path,
        newVersion: undefined,
        packageJSON: project.packageJSON,
        currentVersion: project.packageJSON.version,
        currentVersionPrerelease: undefined,
        currentPrerelease: undefined,
      };
    });

    conventionalChangelog(
      {
        preset: 'angular',
        append: true,
        transform(commit, cb) {
          // We are only interested in commits which scope is one of our projects
          if (
            isMonorepo &&
            !projects.find(({ name }) => name === commit.scope)
          ) {
            cb();
            return;
          }

          const project = isMonorepo ? commit.scope : projects[0].name;
          let toPush = null;
          if (commit.type === 'fix' || commit.type === 'perf') {
            // TODO Documented
            status[project].increment = Math.max(
              status[project].increment,
              versions.PATCH,
            );
            toPush = commit;
          }
          if (commit.type === 'feat' || commit.type === 'revert') {
            status[project].increment = Math.max(
              status[project].increment,
              versions.MINOR,
            );
            toPush = commit;
          }
          if (isBreakingChange(commit)) {
            status[project].increment = Math.max(
              status[project].increment,
              versions.MAJOR,
            );
            toPush = commit;
          }
          if (toPush) {
            status[project].commits.push(commit);
          }
          if (commit.type === 'release' && commit.scope === project) {
            status[project].increment = versions.NOTHING;
            status[project].currentVersion = commit.subject;
            status[project].commits = [];

            // If we hit a release we also want to reset the prerelease
            status[project].currentVersionPrerelease = undefined;
            status[project].currentPrerelease = undefined;
          }
          if (commit.type === 'prerelease' && commit.scope === project) {
            status[project].currentVersionPrerelease = commit.subject;
            status[project].currentPrerelease = semver.prerelease(
              commit.subject,
            )[0];

            if (prerelease) {
              status[project].commits = [];
            }
          }
          cb();
        },
      },
      {},
      { reverse: true, from },
    )
      .on('end', () => {
        Object.keys(status).forEach(project => {
          if (status[project].commits.length === 0) {
            delete status[project];
          } else if (prerelease && status[project].currentVersionPrerelease) {
            // If we have a previous prerelease we want to find out if we have made a larger change
            const difference = semver.diff(
              status[project].currentVersion,
              semver.inc(status[project].currentVersionPrerelease, 'patch'),
            );
            // If the range has changed we will need to make a new prerelease
            if (incrementToString(status[project].increment) !== difference) {
              status[project].newVersion = semver.inc(
                status[project].currentVersion,
                `pre${incrementToString(status[project].increment)}`,
                prerelease,
              );
            } else {
              status[project].newVersion = semver.inc(
                status[project].currentVersionPrerelease,
                'prerelease',
                prerelease,
              );
            }
          } else {
            status[project].newVersion = semver.inc(
              status[project].currentVersion,
              prerelease
                ? `pre${incrementToString(status[project].increment)}`
                : incrementToString(status[project].increment),
              prerelease,
            );
          }
        });
        resolve(status);
      })
      .resume();
  });
}
