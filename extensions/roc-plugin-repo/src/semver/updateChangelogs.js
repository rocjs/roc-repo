import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import addStream from 'add-stream';
import conventionalChangelog from 'conventional-changelog';
import tempfile from 'tempfile';

import {
  getLatestCommitsSinceRelease,
  conventionalChangelogOptions,
} from './utils';

export default async function updateChangelogs(
  projects,
  isMonorepo,
  from,
  prerelease,
) {
  const latest = await getLatestCommitsSinceRelease(
    'angular',
    from,
    projects,
    isMonorepo,
  );
  const generateChangelogForProject = createGenerateChangelogForProject(
    isMonorepo,
    projects,
  );

  const fromRelease = project =>
    prerelease && latest[project].prerelease.hash
      ? latest[project].prerelease.hash
      : latest[project].release.hash;

  return Promise.all(
    projects.map(project =>
      generateChangelogForProject(project, from || fromRelease(project.name)),
    ),
  );
}

function createGenerateChangelogForProject(isMonorepo, projects) {
  return (project, from) =>
    new Promise(resolve => {
      const changelog = path.join(project.path, 'CHANGELOG.md');
      const tmp = tempfile();
      return readStream(changelog).then(changelogReadStream => {
        conventionalChangelog(
          conventionalChangelogOptions('angular', isMonorepo, projects)(
            project,
          ),
          {},
          { from, reverse: true },
          {
            noteKeywords: [
              'SCOPE',
              'SCOPES',
              'BREAKING CHANGE',
              'BREAKING CHANGES',
            ],
          },
        )
          .pipe(addStream(changelogReadStream))
          .pipe(fs.createWriteStream(tmp))
          .on('finish', () => {
            fs
              .createReadStream(tmp)
              .pipe(fs.createWriteStream(changelog))
              .on('finish', () => resolve());
          });
      });
    });
}

function emptyStream() {
  return new Readable({
    read() {
      this.push(null);
    },
  });
}

function readStream(filepath) {
  return new Promise(resolve => {
    const stream = fs.createReadStream(filepath);
    stream
      .once('readable', () => resolve(stream))
      .once('error', () => resolve(emptyStream()));
  });
}
