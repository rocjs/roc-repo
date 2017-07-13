import fs from 'fs';
import path from 'path';
import { execute, executeSyncExit } from 'roc';
import log from 'roc/log/default/small';
import semver from 'semver';

const linkExtra = (extra, binary) => {
  if (extra.length === 0) {
    return '';
  }

  return ` && ${extra
    .map(dependency => `${binary} link ${dependency}`)
    .join(' && ')}`;
};

const removeDependencies = (dependencies = {}, localDependencies) => {
  const newDependencies = {};

  Object.keys(dependencies)
    .filter(dependency => !localDependencies.includes(dependency))
    .forEach(dependency => {
      newDependencies[dependency] = dependencies[dependency];
    });

  return newDependencies;
};

const install = (project, extra, binary, localDependencies, useInstall) => {
  const pathToPackageJSON = path.join(project.path, 'package.json');
  const packageJSON = require(pathToPackageJSON); // eslint-disable-line
  const newPackageJSON = Object.assign({}, packageJSON);

  newPackageJSON.dependencies = removeDependencies(
    packageJSON.dependencies,
    Object.keys(localDependencies),
  );
  newPackageJSON.devDependencies = removeDependencies(
    packageJSON.devDependencies,
    Object.keys(localDependencies),
  );

  fs.writeFileSync(
    pathToPackageJSON,
    `${JSON.stringify(newPackageJSON, null, 2)}\n`,
  );

  log.info(`Installing dependencies and linking ${project.name}`);

  const restorePackageJSON = () =>
    fs.writeFileSync(
      pathToPackageJSON,
      `${JSON.stringify(packageJSON, null, 2)}\n`,
    );

  return execute(
    `cd ${project.path}${linkExtra(
      extra,
      binary,
    )} && ${binary} install${useInstall ? '' : ` && ${binary} link`}`,
  ).then(restorePackageJSON, error => {
    restorePackageJSON();
    throw error;
  });
};

const link = (project, binary, localDependencies, useInstall) => {
  const pathToPackageJSON = path.join(project.path, 'package.json');

  const packageJSON = require(pathToPackageJSON); // eslint-disable-line
  const toLink = Object.keys(
    Object.assign({}, packageJSON.dependencies, packageJSON.devDependencies),
  )
    .filter(dependency => Object.keys(localDependencies).includes(dependency))
    .map(
      previous =>
        useInstall
          ? `${binary} install ${localDependencies[previous]} --no-save`
          : `${binary} link ${previous}`,
    );

  log.info(`Linking dependencies for ${project.name}`);

  if (toLink.length === 0) {
    return Promise.resolve();
  }

  return execute(`cd ${project.path} && ${toLink.join(' && ')}`);
};

export default projects => ({
  arguments: { managed: { projects: selectedProjects } },
  options: { managed: { extra = [] } },
  context,
}) => {
  const binary = context.config.settings.repo.npmBinary;
  const selected = projects.filter(
    ({ name }) => !selectedProjects || selectedProjects.includes(name),
  );

  if (selected.length === 0) {
    return log.small.warn('No projects were found');
  }

  const localDependencies = {};
  projects.forEach(project => (localDependencies[project.name] = project.path));

  // We want to use "npm install" over "npm link" when running with npm 5+
  // This since the behaviour seems to have changed when using "link" and
  // in general direct install seems to be the recommended way for monorepos
  // We only want to do this when using npm, not when using yarn
  const useInstall =
    semver.satisfies(executeSyncExit('npm -v', { silent: true }), '>=5') &&
    (binary === 'npm' || binary === 'npmc');

  return selected
    .reduce(
      (previous, project) =>
        previous.then(() =>
          install(project, extra, binary, localDependencies, useInstall),
        ),
      Promise.resolve(),
    )
    .then(() =>
      selected.reduce(
        (previous, project) =>
          previous.then(() =>
            link(project, binary, localDependencies, useInstall),
          ),
        Promise.resolve(),
      ),
    );
};
