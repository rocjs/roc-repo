import Listr from 'listr';
import execa from 'execa';
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
import scriptRunner from './utils/scriptRunner';

export default projects => ({
  arguments: { managed: { projects: selectedProjects } },
  options: {
    managed: {
      'dist-tag': distTag,
      'git-name': gitName,
      'git-email': gitEmail,
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
  const noVerify = settings.runGitHooks ? '' : '--no-verify';
  const gitUserEnv = {
    ...(gitName
      ? {
          GIT_COMMITTER_NAME: gitName,
          GIT_AUTHOR_NAME: gitName,
        }
      : {}),
    ...(gitEmail
      ? {
          GIT_COMMITTER_EMAIL: gitEmail,
          GIT_AUTHOR_EMAIL: gitEmail,
        }
      : {}),
  };
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

    if (!automatic) {
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
    } else {
      // Show a list of the projects that we will release
      log.info(
        `The following projects will be released:\n${Object.keys(status)
          .map(
            project =>
              `- ${project} - ${status[project].packageJSON
                .version} -> ${status[project].newVersion}${extraInfo(
                project,
              )}`,
          )
          .join('\n')}\n`,
      );
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
                          // This check might fail on CI server that checkout using deatached HEAD
                          // We have added support for Travis here and other CI server might need extra care as well
                          task: () =>
                            execa
                              .shell(
                                `git fetch && git rev-list --count --left-only ${isCI &&
                                process.env.TRAVIS_BRANCH
                                  ? process.env.TRAVIS_BRANCH
                                  : ''}@{u}...HEAD`,
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
                  skip: () =>
                    !isMonorepo ? 'Will only remove for monorepos' : false,
                  task: () =>
                    execa.shell(`roc repo rnm ${toRelease}`, {
                      cwd: context.directory,
                    }),
                },
                {
                  title: 'Cleaning projects',
                  task: () =>
                    execa.shell(`roc repo clean ${toRelease}`, {
                      cwd: context.directory,
                    }),
                },
              ],
              { concurrent: true },
            ),
        },
        {
          title: 'Installing dependencies',
          task: () =>
            execa.shell(`roc repo bootstrap ${toRelease}`, {
              cwd: context.directory,
            }),
        },
        {
          title: 'Linting',
          task: () =>
            execa.shell(`roc repo lint ${toRelease}`, {
              cwd: context.directory,
              env: {
                FORCE_COLOR: true,
              },
            }),
        },
        {
          title: 'Building',
          task: () =>
            execa
              .shell(`roc repo build ${toRelease}`, {
                cwd: context.directory,
                env: {
                  NODE_ENV: 'production',
                  FORCE_COLOR: true,
                },
              })
              .catch(error => {
                // We only want to see the Babel error here
                error.message = error.stderr; // eslint-disable-line no-param-reassign
                throw error;
              }),
        },
        ...invokeHook('release-after-build', Object.keys(status), Listr),
        {
          title: 'Testing',
          task: () =>
            execa.shell(`roc repo test ${toRelease}`, {
              cwd: context.directory,
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
                      execa.shell(
                        `npm version ${status[project]
                          .newVersion} --no-git-tag-version`,
                        { cwd: status[project].path },
                      ),
                    ),
                  ),
              },
              {
                title: 'Updating CHANGELOG.md',
                task: () =>
                  updateChangelogs(
                    selectedToBeReleased,
                    !!settings.mono,
                    from,
                    prereleaseTag,
                  ),
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
                          status,
                          isMonorepo,
                          individual,
                          from,
                          prereleaseTag,
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
                    status,
                    isMonorepo,
                    individual,
                    from,
                    prereleaseTag,
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
                        execa
                          .shell(
                            `git add . && git commit ${noVerify} -m "${prereleaseTag
                              ? 'pre'
                              : ''}release${isMonorepo
                              ? `(${project.name})`
                              : ''}: ${status[project.name].newVersion}"`,
                            {
                              cwd: project.path,
                              preferLocal: false,
                              env: gitUserEnv,
                            },
                          )
                          .then(async () => {
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
                        return execa.shell(
                          `git tag ${project.tag} ${project.releaseCommitHash} -a -m ${project.tag}`,
                          {
                            cwd: context.directory,
                          },
                        );
                      }),
                    ).then(async () => {
                      if (collectedRelease) {
                        const releaseTag = await getTag(collectedRelease);
                        ctx.releaseTag = releaseTag;
                        return execa.shell(
                          `git tag ${releaseTag} -a -m ${releaseTag}`,
                          {
                            cwd: context.directory,
                          },
                        );
                      }

                      return Promise.resolve();
                    });
                  }

                  ctx.releaseTag = `v${status[selectedToBeReleased[0].name]
                    .newVersion}`;
                  return execa.shell(
                    `git tag ${ctx.releaseTag} -a -m ${ctx.releaseTag}`,
                    {
                      cwd: context.directory,
                    },
                  );
                },
              },
            ]),
        },
        {
          title: 'Publishing',
          skip: () => !git || !publish,
          task: () =>
            new Listr(
              selectedToBeReleased.map(project => ({
                title: `${project.name}@${status[project.name].newVersion}`,
                task: () =>
                  scriptRunner('publish')([project], settings, false, {
                    distTag,
                  }),
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
                  execa.shell(
                    `git push ${isCI && process.env.TRAVIS_BRANCH
                      ? `origin HEAD:${process.env.TRAVIS_BRANCH}`
                      : ''} ${noVerify}`,
                    {
                      cwd: context.directory,
                    },
                  ),
              },
              {
                title: 'Tags',
                skip: () => !tag,
                task: () =>
                  execa.shell(
                    `git push ${isCI && process.env.TRAVIS_BRANCH
                      ? `origin HEAD:${process.env.TRAVIS_BRANCH}`
                      : ''} ${noVerify} --tags`,
                    {
                      cwd: context.directory,
                    },
                  ),
              },
            ]),
        },
        {
          title: 'Creating GitHub release',
          skip: () =>
            !token || !git || !tag || !github || !push || !hasRepositoryLink,
          task: ctx => {
            if (individual && isMonorepo) {
              return Promise.all(
                selectedToBeReleased.map(project =>
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
        if (ctx.releaseText && (!token || !hasRepositoryLink)) {
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
