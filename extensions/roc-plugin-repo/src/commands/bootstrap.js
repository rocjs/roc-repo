import fs from 'fs';
import path from 'path';
import { execute } from 'roc';
import log from 'roc/log/default/small';

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

const install = (project, extra, binary, localDependencies) => {
  const pathToPackageJSON = path.join(project.path, 'package.json');
  const packageJSON = require(pathToPackageJSON); // eslint-disable-line
  const newPackageJSON = Object.assign({}, packageJSON);

  newPackageJSON.dependencies = removeDependencies(
    packageJSON.dependencies,
    localDependencies,
  );
  newPackageJSON.devDependencies = removeDependencies(
    packageJSON.devDependencies,
    localDependencies,
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
    )} && ${binary} install && ${binary} link`,
  ).then(restorePackageJSON, error => {
    restorePackageJSON();
    throw error;
  });
};

const link = (project, binary, localDependencies) => {
  const pathToPackageJSON = path.join(project.path, 'package.json');

  const packageJSON = require(pathToPackageJSON); // eslint-disable-line
  const toLink = Object.keys(
    Object.assign({}, packageJSON.dependencies, packageJSON.devDependencies),
  )
    .filter(dependency => localDependencies.includes(dependency))
    .map(previous => `${binary} link ${previous}`);

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
  const settings = context.config.settings.repo;
  const selected = projects.filter(
    ({ name }) => !selectedProjects || selectedProjects.includes(name),
  );

  if (selected.length === 0) {
    return log.small.warn('No projects were found');
  }

  const localDependencies = projects.map(({ name }) => name);

  return selected
    .reduce(
      (previous, project) =>
        previous.then(() =>
          install(project, extra, settings.npmBinary, localDependencies),
        ),
      Promise.resolve(),
    )
    .then(() =>
      selected.reduce(
        (previous, project) =>
          previous.then(() =>
            link(project, settings.npmBinary, localDependencies),
          ),
        Promise.resolve(),
      ),
    );
};
