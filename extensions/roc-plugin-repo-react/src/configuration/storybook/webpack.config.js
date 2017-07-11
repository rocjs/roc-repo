import path from 'path';
import webpack from 'webpack';
import { getResolveRequest, fileExists } from 'roc';
import log from 'roc/log/default/small';
import merge from 'webpack-merge';
import { isFunction } from 'lodash';
import genDefaultConfig from '@storybook/react/dist/server/config/defaults/webpack.config';

import { invokeHook } from '../../util';
import RocExportPlugin from '../../utils/rocExportWebpackPlugin';

import createFileMapping from './createFileMapping';

require('roc/runtime/register');

module.exports = (baseConfig, env) => {
  const config = genDefaultConfig(baseConfig, env);

  const babelConfig = invokeHook('babel-config', 'cjs');

  // 0 index is what Storybook uses and it assumed in the internal code of it
  babelConfig.plugins = babelConfig.plugins.concat(
    config.module.rules[0].query.plugins,
    babelConfig.plugins,
  );

  config.module.rules[0].query = {
    ...config.module.rules[0].query,
    ...babelConfig,
  };

  config.plugins.push(
    new webpack.DefinePlugin({
      STORIES: JSON.stringify(
        createFileMapping(JSON.parse(process.env.SELECTED_PROJECTS)),
      ),
    }),
  );

  config.plugins.push(
    new RocExportPlugin(getResolveRequest('Storybook Webpack', true)),
  );

  if (fileExists('.storybook/addons.js', process.env.PROJECT_ROOT)) {
    log.info('Using project addons.');

    config.plugins.push(
      new webpack.DefinePlugin({
        HAS_PROJECT_ADDONS: true,
        PROJECT_ADDONS: JSON.stringify(
          path.join(process.env.PROJECT_ROOT, '.storybook/addons.js'),
        ),
      }),
    );
  } else {
    config.plugins.push(
      new webpack.DefinePlugin({
        HAS_PROJECT_ADDONS: false,
      }),
    );
  }

  if (fileExists('.storybook/entry.js', process.env.PROJECT_ROOT)) {
    log.info('Using project entry.');

    config.plugins.push(
      new webpack.DefinePlugin({
        HAS_PROJECT_ENTRY: true,
        PROJECT_ENTRY: JSON.stringify(
          path.join(process.env.PROJECT_ROOT, '.storybook/entry.js'),
        ),
      }),
    );
  } else {
    config.plugins.push(
      new webpack.DefinePlugin({
        HAS_PROJECT_ENTRY: false,
      }),
    );
  }

  if (fileExists('.storybook/webpack.config.js', process.env.PROJECT_ROOT)) {
    log.info('Using project Webpack configuration.');

    const projectWebpackConfig = require(`${process.env
      .PROJECT_ROOT}/.storybook/webpack.config`);
    return isFunction(projectWebpackConfig)
      ? projectWebpackConfig(config, env)
      : merge(config, projectWebpackConfig);
  }

  return config;
};
