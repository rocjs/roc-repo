/**
 Parts of the code taken from babel-cli
*/

import fs from 'fs-extra';
import path from 'path';

import { uniq, each } from 'lodash';
import glob from 'glob';

import pathExists from 'path-exists';
import readdir from 'fs-readdir-recursive';
import slash from 'slash';

import * as util from './utils';

export default async function babelBuilder(cliOptions, babelOptions) {
  let filenames = [cliOptions.src].reduce((globbed, input) => {
    let files = glob.sync(input);
    if (!files.length) files = [input];

    return globbed.concat(files);
  }, []);

  filenames = uniq(filenames);

  await Promise.all(filenames.map(filename => handle(filename)));

  if (cliOptions.watch) {
    const chokidar = require('chokidar'); // eslint-disable-line global-require

    each(filenames, dirname => {
      const watcher = chokidar.watch(dirname, {
        persistent: true,
        ignoreInitial: true,
      });

      each(['add', 'change'], type => {
        watcher.on(type, filename => {
          const relative = path.relative(dirname, filename) || filename;
          try {
            handleFile(filename, relative);
          } catch (err) {
            console.error(err.stack); // eslint-disable-line no-console
          }
        });
      });
    });
  }

  async function write(src, relative) {
    // remove extension and then append back on .js
    relative = `${relative.replace(/\.(\w*?)$/, '')}.js`; // eslint-disable-line no-param-reassign

    const dest = path.join(cliOptions.out, relative);

    const data = await util.compile(
      cliOptions.log,
      src,
      {
        sourceMaps: cliOptions.sourceMaps,
        sourceFileName: slash(path.relative(`${dest}/..`, src)),
        sourceMapTarget: path.basename(relative),
        ...babelOptions,
        babelrc: cliOptions.babelrc,
      },
      cliOptions.watch,
    );
    if (data.ignored) return;

    // we've requested explicit sourcemaps to be written to disk
    if (
      data.map &&
      cliOptions.sourceMaps &&
      cliOptions.sourceMaps !== 'inline'
    ) {
      const mapLoc = `${dest}.map`;
      data.code = util.addSourceMappingUrl(data.code, mapLoc);
      await fs.outputFile(mapLoc, JSON.stringify(data.map));
    }

    await fs.outputFile(dest, data.code);
    await util.chmod(src, dest);

    cliOptions.log(
      `${src.slice(cliOptions.path.length + 1)} -> ${dest.slice(
        cliOptions.path.length + 1,
      )}`,
    );
  }

  async function handleFile(src, filename) {
    if (util.shouldIgnore(src, cliOptions.ignore)) return;

    if (util.canCompile(filename, ['.js', '.jsx', '.es6', '.es'])) {
      await write(src, filename);
    } else if (cliOptions.copyFiles) {
      const dest = path.join(cliOptions.out, filename);
      await fs.copy(src, dest);
      await util.chmod(src, dest);
    }
  }

  async function handle(filename) {
    if (!pathExists.sync(filename)) return;

    const stat = await fs.stat(filename);

    if (stat.isDirectory(filename)) {
      const dirname = filename;

      await Promise.all(
        readdir(dirname).map(currentFilename => {
          const src = path.join(dirname, currentFilename);
          return handleFile(src, currentFilename);
        }),
      );
    } else {
      await write(filename, filename);
    }
  }
}
