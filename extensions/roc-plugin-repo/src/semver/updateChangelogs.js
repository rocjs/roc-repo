import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

import addStream from 'add-stream';
import conventionalChangelog from 'conventional-changelog';
import tempfile from 'tempfile';

const emptyStream = () =>
  new Readable({
    read() {
      this.push(null);
    },
  });

const readStream = filepath =>
  new Promise(resolve => {
    const stream = fs.createReadStream(filepath);
    stream
      .once('readable', () => resolve(stream))
      .once('error', () => resolve(emptyStream()));
  });

const generateChangelogForProject = ({ project, from }, isMonorepo) =>
  new Promise(resolve => {
    const changelog = path.join(project.path, 'CHANGELOG.md');
    const tmp = tempfile();
    return readStream(changelog).then(changelogReadStream => {
      conventionalChangelog(
        {
          preset: 'angular',
          append: true,
          pkg: {
            path: path.join(project.path, 'package.json'),
          },
          transform(commit, cb) {
            return isMonorepo && commit.scope === project.name
              ? cb(null, commit)
              : cb();
          },
        },
        {},
        { from, reverse: true },
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

export default function updateChangelogs(projects, isMonorepo) {
  return new Promise((resolve, reject) => {
    const latest = {};

    conventionalChangelog(
      {
        preset: 'angular',
        append: true,
        transform(commit, cb) {
          if (commit.type === 'release') {
            latest[commit.scope] = commit.hash;
          }
          cb();
        },
      },
      {},
      { reverse: true },
    )
      .on('end', () => {
        Promise.all(
          projects.map(project =>
            generateChangelogForProject(
              {
                project,
                from: latest[project.name],
              },
              isMonorepo,
            ),
          ),
        ).then(resolve, reject);
      })
      .resume();
  });
}
