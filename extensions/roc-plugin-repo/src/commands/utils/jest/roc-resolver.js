// This version of Roc might not be the same version as is used in the project to launch the CLI
require('roc').runCli({
  invoke: false,
  argv: JSON.parse(process.env.ROC_INITAL_ARGV),
});

const rocResolver = require('roc').getResolveRequest('Jest');
const resolve = require('resolve');
const browserResolve = require('browser-resolve');

export default function customJestResolver(path, options) {
  const defaultResolver = options.browser ? browserResolve : resolve;
  const resolver = (request, context) =>
    defaultResolver.sync(request, { basedir: context });

  try {
    return defaultResolver.sync(
      rocResolver(path, options.basedir, { resolver }),
      {
        basedir: options.basedir,
        extensions: options.extensions,
        moduleDirectory: options.moduleDirectory,
        paths: options.paths,
      },
    );
  } catch (_error) {
    // Ignore errors happening here and manage potential ones below
  }

  return defaultResolver.sync(
    rocResolver(path, options.basedir, { fallback: true, resolver }),
    {
      basedir: options.basedir,
      extensions: options.extensions,
      moduleDirectory: options.moduleDirectory,
      paths: options.paths,
    },
  );
}
