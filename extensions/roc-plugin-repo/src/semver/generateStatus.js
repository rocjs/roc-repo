import conventionalChangelog from 'conventional-changelog';
import semver from 'semver';
import { upperCase } from 'lodash';

import {
  isBreakingChange,
  versions,
  incrementToString,
  incrementToValue,
  getMultiScopes,
  getAutoScopes,
  getLatestCommitsSinceRelease,
} from './utils';

export default async function generateStatus(
  projects,
  isMonorepo,
  from,
  prerelease,
) {
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

  const latest = await getLatestCommitsSinceRelease(
    'angular',
    from,
    projects,
    isMonorepo,
  );

  return Promise.all(
    Object.keys(status).map(
      project =>
        new Promise(resolve => {
          if (latest[project].release.subject) {
            status[project].currentVersion = latest[project].release.subject;
          }

          if (latest[project].prerelease.subject) {
            status[project].currentVersionPrerelease =
              latest[project].prerelease.subject;
            status[project].currentPrerelease = semver.prerelease(
              latest[project].prerelease.subject,
            )[0];
          }

          const fromRelease =
            prerelease && latest[project].prerelease.hash
              ? latest[project].prerelease.hash
              : latest[project].release.hash;

          conventionalChangelog(
            {
              preset: 'angular',
              append: true,
              transform(commit, cb) {
                const multiScopes = getMultiScopes(commit, isMonorepo);
                const autoScopes = getAutoScopes(commit, isMonorepo, projects);
                // We are only interested in commits which scope is one of our projects
                if (
                  isMonorepo &&
                  upperCase(commit.scope) !== 'ALL' &&
                  !multiScopes.includes(project) &&
                  !autoScopes.includes(project) &&
                  commit.scope !== project
                ) {
                  cb();
                  return;
                }

                let toPush = null;
                if (commit.type === 'fix' || commit.type === 'perf') {
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
                cb();
              },
            },
            {},
            { reverse: true, from: from || fromRelease },
            {
              noteKeywords: [
                'SCOPE',
                'SCOPES',
                'BREAKING CHANGE',
                'BREAKING CHANGES',
              ],
            },
          )
            .on('end', () => {
              resolve();
            })
            .resume();
        }),
    ),
  ).then(() => {
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
        if (status[project].increment > incrementToValue(difference)) {
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

    return status;
  });
}
