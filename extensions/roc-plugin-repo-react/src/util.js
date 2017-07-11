const runHook = require('roc').runHook;

/**
 * The name of the package, for easy consumption.
 */
export const packageJSON = require('../package.json'); // eslint-disable-line global-require

/**
 * Helper function for invoking/running a hook, pre-configured for the current package.
 *
 * @param {...Object} args - The arguments to pass along to the action.
 *
 * @returns {Object|function} - Either a object, the final value from the actions or a function if callback is used.
 */
export function invokeHook(...args) {
  return runHook(packageJSON.name)(...args);
}
