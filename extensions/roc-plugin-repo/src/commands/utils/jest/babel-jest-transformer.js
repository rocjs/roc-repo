import babelJest from 'babel-jest';

import { invokeHook } from '../../../util';

module.exports = babelJest.createTransformer(invokeHook('babel-config', 'cjs'));
