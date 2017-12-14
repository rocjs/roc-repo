import babel from '../commands/utils/babel';
import { invokeHook } from '../util';

function buildWithBabel(config, watch, createLogger) {
  const settings = config.settings.repo;

  return (projects, mode, multipleTargets) =>
    Promise.all(
      projects.map(project => {
        const logger = createLogger(project.name).logger;
        const babelConfig = invokeHook('babel-config', mode, project);
        try {
          logger(`Building for ${mode} with Babel`);
          return babel(
            {
              mode,
              path: project.path,
              src: `${project.path}/${settings.input}`,
              out: multipleTargets
                ? `${project.path}/${settings.output}/${mode}`
                : `${project.path}/${settings.output}`,
              // We want to ignore potential __snapshots__ and __mocks__ directories
              ignore: settings.test.concat([
                '**/__snapshots__/**',
                '**/__mocks__/**',
              ]),
              copyFiles: true,
              sourceMaps: true,
              babelrc: false,
              watch,
              log: logger,
            },
            babelConfig,
          );
        } catch (err) {
          err.projectName = project.name;
          if (err._babel && err instanceof SyntaxError) {
            // Display codeFrame if it is an Babel Error
            err.message = `${err.message}\n${err.codeFrame}`;
          }
          throw err;
        }
      }),
    );
}

export default (context, projects, { options: { watch }, createLogger }) => {
  const esmJavaScriptBuild = projects.filter(
    ({ packageJSON }) =>
      packageJSON.module && packageJSON.module.endsWith('.js'),
  );
  const cjsJavaScriptBuild = projects.filter(
    ({ packageJSON }) => packageJSON.main && packageJSON.main.endsWith('.js'),
  );

  return async () => {
    if (cjsJavaScriptBuild.length > 0) {
      await buildWithBabel(context.config, watch, createLogger)(
        cjsJavaScriptBuild,
        'cjs',
        esmJavaScriptBuild.length > 0,
      );
    }

    if (esmJavaScriptBuild.length > 0) {
      await buildWithBabel(context.config, watch, createLogger)(
        esmJavaScriptBuild,
        'esm',
        cjsJavaScriptBuild.length > 0,
      );
    }
  };
};
