import babelJest from 'babel-jest';

import { invokeHook } from '../../../util';

// This version of Roc might not be the same version as is used in the project to launch the CLI
if (!global.roc) {
  require('roc').runCli({
    invoke: false,
    argv: JSON.parse(process.env.ROC_INITAL_ARGV),
  });
}

module.exports = babelJest.createTransformer(invokeHook('babel-config', 'cjs'));
