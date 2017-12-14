import execa from 'execa';

/**
 * By default all projects will be published using npm something that we might want to go away from.
 * The question is if there is anything that can be used to detect if a project should be published
 * using npm.
 *
 * One alternative would have been to use "private: true" but that is already used for other
 * purposes, mainly making sure we don't do anything in terms of releasing for them.
 */
export default (context, projects, { options: { distTag } }) => () =>
  Promise.all(
    projects.map(project => {
      let registry = '';
      const publishConfig = project.packageJSON.publishConfig;
      if (publishConfig && publishConfig.registry) {
        registry = `--registry='${publishConfig.registry}'`;
      }

      return execa.shell(`npm publish ${registry} --tag ${distTag}`, {
        cwd: project.path,
      });
    }),
  );
