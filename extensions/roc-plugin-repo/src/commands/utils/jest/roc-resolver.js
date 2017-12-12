// This version of Roc might not be the same version as is used in the project to launch the CLI
import resolveFrom from 'resolve-from';

require('roc').runCli({
  invoke: false,
  argv: JSON.parse(process.env.ROC_INITAL_ARGV),
});

const rocResolver = require('roc').getResolveRequest('Jest');

const jestDefaultResolver = require(resolveFrom(
  require.resolve('jest'),
  'jest-resolve/build/default_resolver',
)).default;
const callsites = require('callsites');

module.exports = function customJestResolver(path, options) {
  // This logic manages a bug in Jest that makes mocking fail and should be removed
  // as soon as this problem is addressed. What we are doing here is that we disable
  // the custom resolver when it's called from a specific function that currently
  // creates problems where mocked files would not be mocked.
  //
  // This will probably affect performace negativly.
  //
  // A downside of this is that we will short-circuit the resolver when called from
  // the moduleNameMapper branch in _resolveStubModuleName, something we actually
  // don't want but adding detection on line number is too fragile.
  //
  // https://github.com/facebook/jest/issues/4985
  if (callsites()[2].getMethodName() === '_resolveStubModuleName') {
    return null;
  }
  // return jestDefaultResolver(path, options);
  const resolver = (request, context) =>
    jestDefaultResolver(request, {
      ...options,
      basedir: context,
    });
  try {
    return jestDefaultResolver(
      rocResolver(path, options.basedir, { resolver }),
      options,
    );
  } catch (_error) {
    // Ignore errors happening here and manage potential ones below
  }

  return jestDefaultResolver(
    rocResolver(path, options.basedir, { fallback: true, resolver }),
    options,
  );
};
