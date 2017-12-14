import scriptRunner from './utils/scriptRunner';

export default projects => ({
  arguments: { managed: { projects: selectedProjects } },
  options: { managed: { concurrent } },
  context,
}) => {
  const settings = context.config.settings.repo;
  const selected = projects.filter(
    ({ name }) => !selectedProjects || selectedProjects.includes(name),
  );

  return scriptRunner('clean')(selected, settings, concurrent);
};
