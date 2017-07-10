import { readFileSync } from 'fs';
import { join } from 'path';
import { merge, fileExists } from 'roc';
import log from 'roc/log/default/small';

import babelResolve from './babelResolve';

function resolve(type, directory) {
  return val => {
    // A Babel plugin/preset can be an array where the first value is the plugin/preset
    const pluginOrPreset = Array.isArray(val) ? val[0] : val;
    const babel =
      babelResolve(`babel-${type}-${pluginOrPreset}`, directory) ||
      babelResolve(pluginOrPreset, directory);
    if (!babel) {
      throw new Error(
        `Babel: Couldn't find ${type} ${JSON.stringify(
          pluginOrPreset,
        )} relative to directory ${JSON.stringify(directory)}`,
      );
    }

    return Array.isArray(val) ? [babel, val[1]] : babel;
  };
}

function getProjectConfig(babelConfig, target, { name, path, packageJSON }) {
  let userBabelConfig;
  if (fileExists('.babelrc', path)) {
    userBabelConfig = JSON.parse(readFileSync(join(path, '.babelrc'), 'utf-8'));
  } else if (packageJSON.babel) {
    userBabelConfig = packageJSON.babel;
  }

  if (userBabelConfig) {
    if (userBabelConfig.extends === false) {
      log.info(`${name}(${target}): Using only project Babel configuration.`);
      return userBabelConfig;
    }

    const newBabelConfig = merge(babelConfig, userBabelConfig);
    newBabelConfig.plugins = [
      ...(userBabelConfig.plugins || []).map(resolve('plugin', path)),
      ...(babelConfig.plugins || []),
    ];

    // We need to flip the order here because of the way that Babel processes presets
    newBabelConfig.presets = [
      ...(babelConfig.presets || []),
      ...(userBabelConfig.presets || []).map(resolve('preset', path)),
    ];

    // Merge env configuration with special consideration for plugins & presets
    Object.keys(newBabelConfig.env).forEach(env => {
      const babelConfigEnv = babelConfig.env[env] || {};
      const userBabelConfigEnv = (userBabelConfig.env || {})[env] || {};

      const envPresets = [
        ...(babelConfigEnv.presets || []),
        ...(userBabelConfigEnv.presets || []).map(resolve('preset', path)),
      ];

      newBabelConfig.env[env].presets = envPresets;

      const envPlugins = [
        ...(userBabelConfigEnv.plugins || []).map(resolve('plugin', path)),
        ...(babelConfigEnv.plugins || []),
      ];

      newBabelConfig.env[env].plugins = envPlugins;
    });

    return newBabelConfig;
  }

  return babelConfig;
}

export default ({ context }) => (target, project) => {
  const settings = context.config.settings.repo;

  if (settings.mono !== false) {
    return babelConfig => getProjectConfig(babelConfig, target, project);
  }

  return undefined;
};
