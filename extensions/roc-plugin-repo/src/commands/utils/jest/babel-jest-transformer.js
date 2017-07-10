import babelJest from 'babel-jest';

import { invokeHook } from '../../../util';

export default babelJest.createTransformer(invokeHook('babel-config', 'cjs'));
