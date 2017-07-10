import { execute } from 'roc';
import log from 'roc/log/default/small';

function makeList(elements) {
  return `${elements.map(element => ` - ${element}`).join('\n')}\n`;
}

export default projects => ({
  context,
  arguments: { managed: { command, projects: selectedProjects } },
  options: { managed: { list } },
  extraArguments,
}) => {
  const binary = context.config.settings.repo.npmBinary;

  const selected = projects.filter(
    ({ name }) => !selectedProjects || selectedProjects.includes(name),
  );

  if (selected.length === 0) {
    return log.warn('No projects were found');
  }

  if (list || !command) {
    const toList = selected
      .map(({ name, packageJSON }) => {
        if (
          packageJSON.scripts &&
          Object.keys(packageJSON.scripts).length > 0
        ) {
          return {
            name,
            scripts: makeList(Object.keys(packageJSON.scripts)),
          };
        }

        return undefined;
      })
      .filter(Boolean);

    if (toList.length === 0) {
      return log.warn('No scripts found');
    }

    return toList.forEach(({ name, scripts }) => {
      log.info(name);
      log.log(scripts);
    });
  }

  const toRun = selected
    .map(({ name, packageJSON, path }) => {
      if (packageJSON.scripts && packageJSON.scripts[command]) {
        return {
          name,
          path,
        };
      }

      return undefined;
    })
    .filter(Boolean);

  // TODO Should we give suggestions?
  if (toRun.length === 0) {
    return log.warn('Nothing matched the selected script');
  }

  return Promise.all(
    toRun.map(({ name, path }) => {
      log.info(`Running "${command}" using ${binary} in ${name}`);
      return execute(`${binary} run ${command}`, {
        args: extraArguments,
        cwd: path,
      });
    }),
  );
};
