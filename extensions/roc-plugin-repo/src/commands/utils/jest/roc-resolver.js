import fs from 'fs';
import resolveFrom from 'resolve-from';

// This version of Roc might not be the same version as is used in the project to launch the CLI
if (!global.roc) {
  require('roc').runCli({
    invoke: false,
    argv: JSON.parse(process.env.ROC_INITAL_ARGV),
  });
}

const rocResolver = require('roc').getResolveRequest('Jest');

const jestDefaultResolver = require(resolveFrom(
  require.resolve('jest'),
  'jest-resolve/build/default_resolver',
)).default;
const callsites = require('callsites');

// This finds the line number for an error that Jest throws when there is a problem
// with moduleNameMapper resolving. We use this to find a reference for when we should
// short-circuit the resolver since it is called in two places for  _resolveStubModuleName
const lineNumberForModuleMapperError =
  fs
    .readFileSync(
      resolveFrom(require.resolve('jest'), 'jest-resolve/build/index.js'),
      'utf8',
    )
    .split('\n')
    .findIndex(row => /Could not locate module/.test(row)) + 1;

if (lineNumberForModuleMapperError === 0) {
  throw new Error(
    'The integration between Jest and roc-plugin-repo is out of date, please update roc-plugin-repo.',
  );
}

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
  const cs = callsites()[2];
  if (
    cs.getMethodName() === '_resolveStubModuleName' &&
    cs.getLineNumber() > lineNumberForModuleMapperError
  ) {
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
