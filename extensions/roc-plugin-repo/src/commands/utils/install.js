/**
 Parts of the code taken from lerna
*/

import path from 'path';

import cmdShim from 'cmd-shim';
import fs from 'fs-extra';
import pify from 'pify';

export function createLink(src, dest, type) {
  if (process.platform === 'win32') {
    return createWindowsSymlink(src, dest, type);
  }
  return createPosixSymlink(src, dest, type);
}

export async function createBinaryLink(src, dest, name, bin) {
  const safeName =
    name[0] === '@' ? name.substring(name.indexOf('/') + 1) : name;
  const destBinFolder = path.join(dest, '.bin');

  // The `bin` in a package.json may be either a string or an object.
  // Normalize to an object.
  const bins = typeof bin === 'string' ? { [safeName]: bin } : bin;

  const srcBinFiles = [];
  const destBinFiles = [];
  Object.keys(bins).forEach(binName => {
    srcBinFiles.push(path.join(src, bins[binName]));
    destBinFiles.push(path.join(destBinFolder, binName));
  });

  // make sure when have a destination folder (node_modules/.bin)
  await fs.ensureDir(destBinFolder);

  return Promise.all(
    srcBinFiles.map((binFile, idx) =>
      createLink(binFile, destBinFiles[idx], 'exec'),
    ),
  );
}

function createPosixSymlink(origin, dest, type) {
  if (type === 'exec') {
    type = 'file'; // eslint-disable-line
  }
  const src = path.relative(path.dirname(dest), origin);
  return createSymbolicLink(src, dest, type);
}

function createWindowsSymlink(src, dest, type) {
  if (type === 'exec') {
    return pify(cmdShim)(src, dest);
  }
  return createSymbolicLink(src, dest, type);
}

async function createSymbolicLink(src, dest, type) {
  try {
    await fs.lstat(dest);
    // Something exists at `dest`.  Need to remove it first.
    await fs.unlink(dest);
  } catch (_e) {
    /* ignore this situation */
  }

  return fs.symlink(src, dest, type);
}
