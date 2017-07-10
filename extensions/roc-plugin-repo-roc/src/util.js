const runHook = require('roc').runHook;

/**
 * The name of the package, for easy consumption.
 */
const name = require('../package.json').name; // eslint-disable-line global-require

/**
 * Helper function for invoking/running a hook, pre-configured for the current package.
 *
 * @param {...Object} args - The arguments to pass along to the action.
 *
 * @returns {Object|function} - Either a object, the final value from the actions or a function if callback is used.
 */
// eslint-disable-next-line import/prefer-default-export
export function invokeHook(...args) {
  return runHook(name)(...args);
}
