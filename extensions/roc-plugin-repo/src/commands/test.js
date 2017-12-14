import scriptRunner from './utils/scriptRunner';

export default projects => ({
  arguments: { managed: { projects: selectedProjects } },
  options: { managed: managedOptions },
  extraArguments,
  context,
}) => {
  const settings = context.config.settings.repo;
  const selected = projects.filter(
    ({ name }) => !selectedProjects || selectedProjects.includes(name),
  );

  return scriptRunner('test')(
    selected,
    settings,
    1,
    managedOptions,
    extraArguments,
  );
};
