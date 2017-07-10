/**
 Parts of the code taken from babel-cli
*/

import fs from 'fs';
import path from 'path';

import { uniq, each } from 'lodash';
import glob from 'glob';
import outputFileSync from 'output-file-sync';
import pathExists from 'path-exists';
import readdir from 'fs-readdir-recursive';
import slash from 'slash';
import log from 'roc/log/default';
import { bold } from 'chalk';

import * as util from './utils';

export default function babelBuilder(cliOptions, babelOptions) {
  let filenames = [cliOptions.src].reduce((globbed, input) => {
    let files = glob.sync(input);
    if (!files.length) files = [input];

    return globbed.concat(files);
  }, []);

  filenames = uniq(filenames);

  filenames.forEach(filename => handle(cliOptions.identifier, filename));

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
            handleFile(cliOptions.identifier, filename, relative);
          } catch (err) {
            console.error(err.stack); // eslint-disable-line no-console
          }
        });
      });
    });
  }

  function write(identifier, src, relative) {
    // remove extension and then append back on .js
    relative = `${relative.replace(/\.(\w*?)$/, '')}.js`; // eslint-disable-line no-param-reassign

    const dest = path.join(cliOptions.out, relative);

    const data = util.compile(
      identifier,
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
      outputFileSync(mapLoc, JSON.stringify(data.map));
    }

    outputFileSync(dest, data.code);
    util.chmod(src, dest);

    log.small.log(
      `${bold(identifier)}(${cliOptions.mode}): ${src.slice(
        cliOptions.path.length + 1,
      )} -> ${dest.slice(cliOptions.path.length + 1)}`,
    );
  }

  function handleFile(identifier, src, filename) {
    if (util.shouldIgnore(src, cliOptions.ignore)) return;

    if (util.canCompile(filename, ['.js', '.jsx', '.es6', '.es'])) {
      write(identifier, src, filename);
    } else if (cliOptions.copyFiles) {
      const dest = path.join(cliOptions.out, filename);
      outputFileSync(dest, fs.readFileSync(src));
      util.chmod(src, dest);
    }
  }

  function handle(identifier, filename) {
    if (!pathExists.sync(filename)) return;

    const stat = fs.statSync(filename);

    if (stat.isDirectory(filename)) {
      const dirname = filename;

      each(readdir(dirname), currentFilename => {
        const src = path.join(dirname, currentFilename);
        handleFile(identifier, src, currentFilename);
      });
    } else {
      write(identifier, filename, filename);
    }
  }
}
