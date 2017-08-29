import Listr from 'listr';
import execa from 'execa';
import { execute } from 'roc';
import log from 'roc/log/default/small';
import inquirer from 'inquirer';
import { yellow } from 'chalk';
import isCI from 'is-ci';

import { getDefaultPrerelease } from '../semver/utils';
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
      automatic,
      clean,
      draft,
      from,
      git,
      github,
      prerelease,
      publish,
      push,
      tag,
    },
  },
  context,
}) => {
  const privateProjects = [];
  const settings = context.config.settings.repo;
  const prereleaseTag = getDefaultPrerelease(prerelease);
  const isMonorepo = !!settings.mono;
  const collectedRelease = settings.release.collectedRelease;
  const individual = !collectedRelease;
  const token = github === true ? process.env.GITHUB_AUTH : github;
  const hasRepositoryLink = !!context.packageJSON.repository;
  let selected = projects
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

  return generateStatus(
    selected,
    !!settings.mono,
    from,
    prereleaseTag,
  ).then(async status => {
    if (Object.keys(status).length === 0) {
      return log.success('Nothing to release.');
    }

    if (!automatic) {
      const previousPrerelease = Object.keys(status).filter(
        project => !!status[project].currentVersionPrerelease,
      );
      const previousNotPrerelease = Object.keys(status).filter(
        project => !status[project].currentVersionPrerelease,
      );
      const notMatchPrerelease = previousPrerelease.filter(
        project => status[project].currentPrerelease !== prereleaseTag,
      );
      const matchPrerelease = previousPrerelease.filter(
        project => status[project].currentPrerelease === prereleaseTag,
      );

      const extraInfo = project => {
        const info = [];
        if (prerelease && notMatchPrerelease.includes(project)) {
          info.push(
            `Prerelease tag changed: ${status[project]
              .currentPrerelease} -> ${prereleaseTag}`,
          );
        }

        if (!prerelease && previousPrerelease.includes(project)) {
          info.push(`Project will be taken out of prerelease`);
        }

        if (prerelease && previousNotPrerelease.includes(project)) {
          info.push(`Project will be put into prerelease`);
        }

        if (info.length > 0) {
          return `  ${yellow(info.join(', '))}`;
        }

        return info;
      };

      const projectAnswers = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'projects',
          message: 'Please verify the projects that should be released',
          default: prerelease ? matchPrerelease : previousNotPrerelease,
          choices: Object.keys(status).map(project => ({
            name: `${project} - ${status[project].packageJSON
              .version} -> ${status[project].newVersion}${extraInfo(project)}`,
            value: project,
            short: project,
          })),
        },
      ]);

      selected = selected.filter(({ name }) =>
        projectAnswers.projects.includes(name),
      );

      if (prerelease && distTag === 'latest') {
        const distTagAnswers = await inquirer.prompt([
          {
            type: 'input',
            name: 'distTag',
            default: distTag,
            message:
              'You have selected to do a prerelease but defined "latest" as dist-tag for npm, make sure this is correct.',
          },
        ]);

        // eslint-disable-next-line no-param-reassign
        distTag = distTagAnswers.distTag;
      }
    }

    const selectedToBeReleased = selected.filter(({ name }) =>
      Object.keys(status).includes(name),
    );

    if (selectedToBeReleased.length === 0) {
      return log.success('Nothing to release.');
    }

    const toRelease = selectedToBeReleased.map(({ name }) => name).join(',');

    return new Listr(
      [
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
                    Object.keys(status).map(project =>
                      execute(
                        `npm version ${status[project]
                          .newVersion} --no-git-tag-version`,
                        { silent: true, cwd: status[project].path },
                      ),
                    ),
                  ),
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
                          `git add . && git commit -m "release(${project.name}): ${status[
                            project.name
                          ].newVersion}"`,
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
                        project.tag = `${project.name}@${status[project.name]
                          .newVersion}`;
                        return execute(
                          `git tag ${project.tag} ${project.releaseCommitHash}`,
                          { silent: true },
                        );
                      }),
                    ).then(async () => {
                      if (collectedRelease) {
                        const releaseTag = await getTag(collectedRelease);
                        ctx.releaseTag = releaseTag;
                        return execute(`git tag ${releaseTag}`, {
                          silent: true,
                        });
                      }

                      return Promise.resolve();
                    });
                  }

                  selectedToBeReleased[0].tag = `v${status[
                    selectedToBeReleased[0].name
                  ].newVersion}`;
                  return execute(`git tag ${selectedToBeReleased[0].tag}`, {
                    silent: true,
                  });
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
                title: `${project.name}@${status[project.name].newVersion}`,
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
          skip: () =>
            !token || !git || !tag || !github || !push || !hasRepositoryLink,
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
                    !!prerelease,
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
              !!prerelease,
            );
          },
        },
      ],
      { renderer: isCI ? 'verbose' : 'default' },
    )
      .run()
      .then(ctx => {
        if (!token || !hasRepositoryLink) {
          log.log('');
          log.info(
            'Could not publish a GitHub for the following reasons:\n' +
              `${!token ? ' — no token was defined\n' : ''}` +
              `${!hasRepositoryLink
                ? ' — no repository field exists in the root package.json\n'
                : ''}` +
              '\nYou can manually create a release using the output below.\n',
          );
          log.log(ctx.releaseText);
        }
      });
  });
};
