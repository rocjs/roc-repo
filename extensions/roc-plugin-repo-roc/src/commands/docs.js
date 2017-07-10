import buildContext from 'roc/lib/context/buildContext';
import generateDocumentation from 'roc/lib/documentation/markdown/generateDocumentation';
import log from 'roc/log/default/small';

module.exports = projects => ({
  arguments: { managed: { projects: selectedProjects } },
}) => {
  const selected = projects.filter(
    ({ name, packageJSON }) =>
      !!packageJSON.roc &&
      (!selectedProjects || selectedProjects.includes(name)),
  );

  if (selected.length === 0) {
    return log.warn('No valid projects were found');
  }

  return Promise.all(
    selected.map(project => {
      log.info(`Generating Roc documentation for ${project.name}`);
      return generateDocumentation({
        commandObject: {
          context: buildContext(project.path, undefined, false),
          directory: project.path,
        },
        extension: true,
      });
    }),
  );
};
