import fs from 'fs';
import path from 'path';

import chalk from 'chalk';
import execa from 'execa';
import gitClone from 'git-clone';
import inquirer from 'inquirer';
import log from 'roc/log/default/small';
import ora from 'ora';
import pSeries from 'p-series';
import temp from 'temp';

// Automatically track and cleanup files at exit
temp.track();

function cloneRepo(repoPath) {
  const tmp = path.join(temp.mkdirSync(), path.basename(repoPath, '.git'));

  const spinner = ora('Downloading repository').start();
  return new Promise(resolve => {
    try {
      gitClone(repoPath, tmp, { checkout: 'master' }, error => {
        if (error) {
          spinner.fail();
          log.error(
            `Failed to download the repository from ${chalk.bold(repoPath)}`,
            error,
          );
        }

        spinner.succeed();
        resolve(tmp);
      });
    } catch (error) {
      log.error('An error happened when downloading the repository.', error);
    }
  });
}

function isValidGitRepository(location) {
  return (
    fs.existsSync(path.join(location, '.git')) &&
    fs.readdirSync(path.join(location, '.git', 'refs', 'heads')).length > 0
  );
}

export default projects => async ({
  arguments: { managed: { repository, location } },
  options: { managed: { flatten, subdirectory, prefix, merge } },
  context,
}) => {
  if (!context.config.settings.repo.mono) {
    return log.warn('You can only use the import command for monorepos');
  }

  if (!isValidGitRepository(context.directory)) {
    return log.warn(
      'You must run this command in a git repository with at least one commit',
    );
  }

  // If git repo we will clone in temporary directory and use that
  // Consider using the same logic here as in rocjs/roc - fetchTemplate.js
  const externalRepository = repository.startsWith('git@')
    ? await cloneRepo(repository)
    : path.join(context.directory, repository);

  // Normalize subdirectory if we have one
  if (subdirectory) {
    subdirectory = `${path.normalize(subdirectory)}/`; // eslint-disable-line no-param-reassign
  }

  let packageName;

  // Verify that it is something we can import from
  try {
    const stats = fs.lstatSync(externalRepository);

    if (!stats.isDirectory()) {
      log.error(`The given repository "${repository}" is not a directory`);
    }

    if (!isValidGitRepository(externalRepository)) {
      log.error(
        `The given repository "${repository}" is not a git repository with at least one commit`,
      );
    }

    const packageJson = path.join(externalRepository, 'package.json');
    packageName = require(packageJson).name;
    const alreadyTakenName = projects.some(({ name }) => name === packageName);

    if (!packageName) {
      log.error(`No package name specified in "${packageJson}"`);
    } else if (alreadyTakenName) {
      log.error(
        `A package with the same name, "${packageName}", already exists in this repository`,
      );
    }
  } catch (e) {
    if (e.code === 'ENOENT') {
      log.error(`No repository found at "${repository}"`);
    }

    throw e;
  }

  // Find out where we should move it
  const targetDirectory =
    location ||
    (await inquirer.prompt([
      {
        type: 'input',
        name: 'location',
        default: path.join(
          // Take the first path from the settings as the default location
          context.config.settings.repo.mono[0],
          path.basename(externalRepository),
        ),
        message: 'Where to expand the repository',
      },
    ])).location;

  if (fs.existsSync(path.join(context.directory, targetDirectory))) {
    log.error(`Target directory already exists "${targetDirectory}"`);
  }

  const gitParams = ['log', '--format=%h'];

  if (flatten) {
    gitParams.push('--first-parent');
  }

  if (subdirectory) {
    gitParams.push(subdirectory);
  }

  const { stdout } = await execa('git', gitParams, {
    cwd: externalRepository,
    reject: false,
  });

  const commits = stdout.split('\n').filter(Boolean).reverse();

  if (!commits.length) {
    log.error(`No git commits to import at "${repository}"`);
  }

  // Get hash before for saftey
  const { stdout: preImportHead } = await execa('git', ['rev-parse', 'HEAD'], {
    cwd: context.directory,
  });

  // Check that the current project is clean
  const { stdout: currentStatus } = await execa('git', ['diff-index', 'HEAD']);
  if (currentStatus) {
    log.error('Local repository has un-committed changes, stopping import');
  }

  const message = merge
    ? `You sure you want to import commits from ${repository} into ${targetDirectory}`
    : `You sure you want to import ${commits.length} commits from ${repository} into ${targetDirectory}`;

  const confirmed = (await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message,
    },
  ])).confirmed;

  if (!confirmed) {
    return Promise.resolve();
  }

  if (merge) {
    const spinner = ora(`Importing repository`).start();
    return pSeries([
      () =>
        execa('git', ['fetch', externalRepository], {
          cwd: context.directory,
        }),
      () =>
        execa(
          'git',
          [
            'merge',
            '-s',
            'ours',
            '--no-commit',
            '--allow-unrelated-histories',
            `FETCH_HEAD`,
          ],
          {
            cwd: context.directory,
          },
        ),
      () =>
        execa(
          'git',
          [
            'read-tree',
            '--prefix',
            targetDirectory,
            '-u',
            `FETCH_HEAD:${subdirectory || ''}`,
          ],
          {
            cwd: context.directory,
          },
        ),
      () =>
        execa(
          'git',
          [
            'commit',
            '--no-verify',
            '--allow-empty',
            '--message',
            `Imported ${packageName} into repository`,
          ],
          {
            cwd: context.directory,
          },
        ),
    ])
      .catch(error => {
        spinner.fail('Failed to import repository');
        execa.sync('git', ['reset', '--hard', preImportHead], {
          cwd: context.directory,
        });
        throw error;
      })
      .then(() => spinner.succeed(`Sucessfully imported repository`));
  }

  /* Parts of the logic below has been taken from Lernas import command */
  const createPatchForCommit = async sha => {
    let patch = null;
    if (flatten) {
      const params = [
        'log',
        '--reverse',
        '--first-parent',
        '-p',
        '-m',
        '--pretty=email',
        '--stat',
        '--binary',
        '-1',
        sha,
      ];
      if (subdirectory) {
        params.push(subdirectory);
      }
      const { stdout: diff } = await execa('git', params, {
        cwd: externalRepository,
      });
      const { stdout: version } = await execa('git', ['--version'], {
        cwd: externalRepository,
      });
      const updatedVersion = version.replace(/git version /g, '');
      patch = `${diff}\n--\n${updatedVersion}`;
    } else {
      const params = ['format-patch', '-1', sha, '--stdout'];
      if (subdirectory) {
        params.push(subdirectory);
      }
      const { stdout: stdoutPatch } = await execa('git', params, {
        cwd: externalRepository,
      });
      patch = stdoutPatch;
    }

    const replace = (p1, p2, seperator = '/') =>
      subdirectory && p2.startsWith(subdirectory)
        ? `${p1}${seperator}${targetDirectory}/${p2.slice(subdirectory.length)}`
        : `${p1}${seperator}${targetDirectory}/${p2}`;

    if (prefix) {
      patch = patch.replace(
        /^(Subject: \[PATCH\]) (.*)$/gm,
        `$1 (${packageName}) $2`,
      );
    }

    // Generate patch with rewritten paths
    return patch
      .replace(/^(Subject: \[PATCH\]) (.*)$/gm, `$1 (${packageName}) $2`)
      .replace(/^([-+]{3} [ab])\/(\S*)/gm, (match, p1, p2) => replace(p1, p2))
      .replace(/^(diff --git a)\/(\S*)/gm, (match, p1, p2) => replace(p1, p2))
      .replace(/^(diff --git \S+ b)\/(\S*)/gm, (match, p1, p2) =>
        replace(p1, p2),
      )
      .replace(/^(rename (from|to)) (\S*)/gm, (match, p1, p2, p3) =>
        replace(p1, p3, ' '),
      );
  };

  const spinner = ora(`Importing commits 0/${commits.length}`).start();
  return pSeries(
    commits.map((sha, index) => async () => {
      spinner.text = `Updating commits ${index + 1}/${commits.length} - ${sha}`;
      const patch = await createPatchForCommit(sha);

      // Apply patch generated above with fallback to a three-way merge
      return execa('git', ['am', '-3', '--keep-non-patch'], {
        cwd: context.directory,
        input: patch,
      }).catch(error => {
        if (/^patch is empty/i.test(error.stdout)) {
          // Empty commit cannot be applied by git am, skip it instead
          execa.sync('git', ['am', '--skip', preImportHead], {
            cwd: context.directory,
          });
        } else {
          spinner.fail('Failed to import all commits');
          // eslint-disable-next-line no-param-reassign
          error =
            `Failed to apply commit ${sha}.\n${error}\n` +
            `Rolling back to previous HEAD (commit ${preImportHead}).\n` +
            `You may try with --flatten to import flat history.`;

          // Abort the failed `git am` and roll back to previous HEAD.
          execa.sync('git', ['am', '--abort'], { cwd: context.directory });
          execa.sync('git', ['reset', '--hard', preImportHead], {
            cwd: context.directory,
          });
          throw error;
        }
      });
    }),
  ).then(() => spinner.succeed(`Sucessfully imported all commits`));
};
