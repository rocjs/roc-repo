import fs from 'fs';
import path from 'path';

import Listr from 'listr';
import execa from 'execa';
import { execute } from 'roc';
import log from 'roc/log/default/small';

import { incrementToString, versions } from '../semver/utils';
import updateChangelogs from '../semver/updateChangelogs';
import generateStatus from '../semver/generateStatus';
import { invokeHook } from '../util';

export default projects => ({
  arguments: { managed: { projects: selectedProjects } },
  options: { managed: { publish, tag, git, push, clean } },
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
    log.info(
      `The following projects are set as private and will not be released:\n${privateProjects
        .map(project => ` — ${project}`)
        .join('\n')}\n`,
    );
  }

  if (selected.length === 0) {
    return log.warn('No projects were found');
  }

  return generateStatus(selected, !!settings.mono).then(status => {
    if (Object.keys(status).length === 0) {
      return log.success('Nothing to release.');
    }

    const toRelease = Object.keys(status).join(',');

    return new Listr([
      {
        title: 'Check preconditions',
        task: () =>
          new Listr(
            [
              {
                title: 'Git',
                task: () =>
                  new Listr(
                    [
                      {
                        title: 'Checking git status',
                        task: () =>
                          execa
                            .shell('git status --porcelain')
                            .then(({ stdout }) => {
                              if (stdout !== '') {
                                throw new Error(
                                  'Unclean working tree. Commit or stash changes first.',
                                );
                              }
                            }),
                      },
                      {
                        title: 'Checking remote history',
                        task: () =>
                          execa
                            .shell(
                              'git rev-list --count --left-only @{u}...HEAD',
                            )
                            .then(({ stdout }) => {
                              if (stdout !== '0') {
                                throw new Error(
                                  'Remote history differ. Please pull changes.',
                                );
                              }
                            }),
                      },
                    ],
                    { concurrent: true },
                  ),
              },
              ...invokeHook(
                'release-preconditions',
                Object.keys(status),
                Listr,
              ),
            ],
            { concurrent: true },
          ),
      },
      {
        title: 'Cleaning',
        skip: () => !clean,
        task: () =>
          new Listr(
            [
              {
                title: 'Removing node_modules',
                task: () => execa.shell(`roc rnm ${toRelease}`),
              },
              {
                title: 'Cleaning projects',
                task: () => execa.shell(`roc clean ${toRelease}`),
              },
            ],
            { concurrent: true },
          ),
      },
      {
        title: 'Installing dependencies',
        task: () =>
          execute(`roc bootstrap ${toRelease}`, {
            silent: true,
            context: context.directory,
          }),
      },
      {
        title: 'Linting',
        task: () =>
          execute(`roc lint ${toRelease}`, {
            silent: true,
            context: context.directory,
          }),
      },
      {
        title: 'Building',
        task: () =>
          execute(`roc build ${toRelease}`, {
            silent: true,
            context: context.directory,
          }),
      },
      ...invokeHook('release-after-build', Object.keys(status), Listr),
      {
        title: 'Testing',
        task: () =>
          execute(`roc test ${toRelease}`, {
            silent: true,
            context: context.directory,
          }),
      },
      {
        title: 'Prepare for release',
        task: () =>
          new Listr([
            {
              title: 'Updating versions',
              task: () =>
                Promise.all(
                  Object.keys(status).map(project => {
                    if (status[project].increment > versions.NOTHING) {
                      return execute(
                        `npm version ${incrementToString(
                          status[project].increment,
                        )} --no-git-tag-version`,
                        { silent: true, cwd: status[project].path },
                      );
                    }

                    return Promise.resolve();
                  }),
                ),
            },
            {
              title: 'Updating CHANGELOG.md',
              task: () =>
                updateChangelogs(
                  projects.filter(({ name }) =>
                    Object.keys(status).includes(name),
                  ),
                  !!settings.mono,
                ),
            },
            {
              title: 'Creating commits',
              skip: () => !git,
              task: () =>
                Object.keys(status).reduce(
                  (previous, project) =>
                    previous.then(() => {
                      const newVersion = JSON.parse(
                        fs.readFileSync(
                          path.resolve(status[project].path, 'package.json'),
                        ),
                      ).version;
                      // eslint-disable-next-line no-param-reassign
                      status[project].version = newVersion;
                      return execute(
                        `git add . && git commit -m "release(${project}): ${newVersion}"`,
                        {
                          silent: true,
                          cwd: status[project].path,
                        },
                      );
                    }),
                  Promise.resolve(),
                ),
            },
          ]),
      },
      {
        title: 'Publishing to npm',
        skip: () => !git || !publish,
        task: () => {
          const newTasks = Object.keys(status)
            .map(projectName => {
              if (status[projectName].increment > versions.NOTHING) {
                return {
                  title: `${projectName}@${status[projectName].version}`,
                  task: () => {
                    let registry = '';
                    const publishConfig =
                      status[projectName].packageJSON.publishConfig;
                    if (publishConfig && publishConfig.registry) {
                      registry = `--registry='${publishConfig.registry}'`;
                    }

                    const publishCommand = `npm publish ${registry} --tag ${tag}`;

                    return execute(publishCommand, {
                      cwd: status[projectName].path,
                    });
                  },
                };
              }
              return undefined;
            })
            .filter(Boolean);
          return new Listr(newTasks);
        },
      },
      {
        title: 'Pushing to remote',
        skip: () => !git || !push,
        task: () =>
          execute(`git push`, {
            silent: true,
            context: context.directory,
          }),
      },
    ]).run();
  });
};
