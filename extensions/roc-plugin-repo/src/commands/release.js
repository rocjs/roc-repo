import path from 'path';

import Listr from 'listr';
import execa from 'execa';
import { execute } from 'roc';
import log from 'roc/log/default/small';
import readPkg from 'read-pkg';

import { incrementToString, versions } from '../semver/utils';
import updateChangelogs from '../semver/updateChangelogs';
import createGithubReleaseText from '../semver/createGithubReleaseText';
import generateStatus from '../semver/generateStatus';
import { invokeHook } from '../util';
import createGitHubRelease from './utils/createGitHubRelease';
import getTag from './utils/getTag';

export default projects => ({
  arguments: { managed: { projects: selectedProjects } },
  options: {
    managed: {
      'dist-tag': distTag,
      clean,
      draft,
      from,
      git,
      github,
      publish,
      push,
      tag,
    },
  },
  context,
}) => {
  const privateProjects = [];
  const settings = context.config.settings.repo;
  const isMonorepo = !!settings.mono;
  const collectedRelease = settings.release.collectedRelease;
  const individual = !collectedRelease;
  const token = github === true ? process.env.GITHUB_AUTH : github;
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

    const selectedToBeReleased = selected.filter(({ name }) =>
      Object.keys(status).includes(name),
    );

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
                task: () => execa.shell(`roc repo rnm ${toRelease}`),
              },
              {
                title: 'Cleaning projects',
                task: () => execa.shell(`roc repo clean ${toRelease}`),
              },
            ],
            { concurrent: true },
          ),
      },
      {
        title: 'Installing dependencies',
        task: () =>
          execute(`roc repo bootstrap ${toRelease}`, {
            silent: true,
            context: context.directory,
          }),
      },
      {
        title: 'Linting',
        task: () =>
          execute(`roc repo lint ${toRelease}`, {
            silent: true,
            context: context.directory,
          }),
      },
      {
        title: 'Building',
        task: () =>
          execute(`roc repo build ${toRelease}`, {
            silent: true,
            context: context.directory,
          }),
      },
      ...invokeHook('release-after-build', Object.keys(status), Listr),
      {
        title: 'Testing',
        task: () =>
          execute(`roc repo test ${toRelease}`, {
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
                ).then(() => {
                  // Update the projects with the modified package.json, primarly the new version
                  selectedToBeReleased.forEach(project => {
                    // eslint-disable-next-line no-param-reassign
                    project.packageJSON = readPkg.sync(
                      path.join(project.path, 'package.json'),
                    );
                  });
                }),
            },
            {
              title: 'Updating CHANGELOG.md',
              task: () =>
                updateChangelogs(selectedToBeReleased, !!settings.mono, from),
            },
            {
              title: 'Prepare GitHub release',
              skip: () => !git || !tag || !github,
              task: async ctx => {
                ctx.releaseText = '';
                if (individual && isMonorepo) {
                  return Promise.all(
                    selectedToBeReleased.map(async project => {
                      const releaseText = await createGithubReleaseText(
                        [project],
                        isMonorepo,
                        individual,
                      );

                      if (!token) {
                        ctx.releaseText += `${releaseText}\n-----------------------------------\n`;
                      } else {
                        // eslint-disable-next-line no-param-reassign
                        project.releaseText = releaseText;
                      }
                    }),
                  );
                }

                ctx.releaseText = await createGithubReleaseText(
                  selectedToBeReleased,
                  isMonorepo,
                  individual,
                );

                return Promise.resolve();
              },
            },
            {
              title: 'Creating commits',
              skip: () => !git,
              task: () =>
                selectedToBeReleased.reduce(
                  (previous, project) =>
                    previous.then(() =>
                      execute(
                        `git add . && git commit -m "release(${project.name}): ${project
                          .packageJSON.version}"`,
                        {
                          silent: true,
                          cwd: project.path,
                        },
                      ).then(async () => {
                        const {
                          stdout,
                        } = await require('./utils/execute').default(
                          'git rev-parse HEAD',
                        );
                        const hash = stdout.trim();
                        // eslint-disable-next-line no-param-reassign
                        project.releaseCommitHash = hash;
                      }),
                    ),
                  Promise.resolve(),
                ),
            },
            {
              title: 'Creating tags',
              skip: () => !git || !tag,
              task: async ctx => {
                // Always create individual tags for each package on release
                if (isMonorepo) {
                  return Promise.all(
                    selectedToBeReleased.map(project => {
                      // eslint-disable-next-line no-param-reassign
                      project.tag = `${project.name}@${project.packageJSON
                        .version}`;
                      return execute(
                        `git tag ${project.name}@${project.packageJSON
                          .version} ${project.releaseCommitHash}`,
                        { silent: true },
                      );
                    }),
                  ).then(async () => {
                    if (collectedRelease) {
                      const releaseTag = await getTag(collectedRelease);
                      ctx.releaseTag = releaseTag;
                      return execute(`git tag ${releaseTag}`, { silent: true });
                    }

                    return Promise.resolve();
                  });
                }

                selectedToBeReleased[0].tag = `v${selectedToBeReleased[0]
                  .packageJSON.version}`;
                return execute(
                  `git tag v${selectedToBeReleased[0].packageJSON.version}`,
                  {
                    silent: true,
                  },
                );
              },
            },
          ]),
      },
      {
        title: 'Publishing to npm',
        skip: () => !git || !publish,
        task: () =>
          new Listr(
            selectedToBeReleased.map(project => ({
              title: `${project.name}@${project.packageJSON.version}`,
              task: () => {
                let registry = '';
                const publishConfig = project.packageJSON.publishConfig;
                if (publishConfig && publishConfig.registry) {
                  registry = `--registry='${publishConfig.registry}'`;
                }

                const publishCommand = `npm publish ${registry} --tag ${distTag}`;

                return execute(publishCommand, {
                  cwd: project.path,
                });
              },
            })),
          ),
      },
      {
        title: 'Pushing to remote',
        skip: () => !git || !push,
        task: () =>
          new Listr([
            {
              title: 'Commits',
              task: () =>
                execute('git push', {
                  silent: true,
                  context: context.directory,
                }),
            },
            {
              title: 'Tags',
              skip: () => !tag,
              task: () =>
                execute('git push --tags', {
                  silent: true,
                  context: context.directory,
                }),
            },
          ]),
      },
      {
        title: 'Creating GitHub release',
        skip: () => !token || !git || !tag || !github || !push,
        task: async ctx => {
          if (individual && isMonorepo) {
            return Promise.all(
              selectedToBeReleased.map(async project =>
                createGitHubRelease(
                  context.packageJSON,
                  project.releaseText,
                  project.tag,
                  token,
                  draft,
                ),
              ),
            );
          }
          return createGitHubRelease(
            context.packageJSON,
            ctx.releaseText,
            ctx.releaseTag,
            token,
            draft,
          );
        },
      },
    ])
      .run()
      .then(ctx => {
        if (!token) {
          log.log('');
          log.info(
            'Could not publish a GitHub release since no token was defined. You can manually post it using the output below.\n',
          );
          log.log(ctx.releaseText);
        }
      });
  });
};
