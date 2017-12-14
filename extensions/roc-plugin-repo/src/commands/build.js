import scriptRunner from './utils/scriptRunner';

export default projects => ({
  arguments: { managed: { projects: selectedProjects } },
  options: { managed: { watch, concurrent } },
  context,
}) => {
  const settings = context.config.settings.repo;
  const selected = projects.filter(
    ({ name }) => !selectedProjects || selectedProjects.includes(name),
  );

  return scriptRunner('build')(selected, settings, concurrent, { watch });
};
