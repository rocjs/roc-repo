import path from 'path';
import fs from 'fs-extra';

import execa from 'execa';
import { fileExists } from 'roc';
import log from 'roc/log/default/small';
import xml2js from 'xml2js';
import pify from 'pify';

const eslint = require.resolve('eslint/bin/eslint');

const eslintCommand = (
  project,
  fix,
  config,
  ignorePattern,
  ignoreFile,
  checkstyle,
) =>
  `${eslint} ${config}${project.path} --ignore-path '${ignoreFile}' --ignore-pattern '${ignorePattern}' ${fix
    ? '--fix'
    : ''} ${checkstyle ? `-f checkstyle` : ''}`;

export default (
  context,
  projects,
  { options: { fix, forceDefault, checkstyle } },
) => {
  let config;
  if (fileExists('.eslintrc', context.directory) && !forceDefault) {
    log.info(
      'A local ESLint configuration was detected and will be used over the default.\n',
    );
    config = '';
  } else {
    config = `--config ${require.resolve('../configuration/eslintrc.js')} `;
  }

  let ignoreFile;
  if (fileExists('.eslintignore', context.directory) && !forceDefault) {
    log.info(
      'A local ESLint ignore file was detected and will be used over the default.\n',
    );
    ignoreFile = path.join(context.directory, '.eslintignore');
  } else {
    ignoreFile = require.resolve('../configuration/eslintignore');
  }

  return () =>
    Promise.all(
      projects
        .map(project => {
          const ignorePattern = path.join(
            path.relative(
              context.directory,
              path.resolve(project.path, context.config.settings.repo.output),
            ),
            '*',
          );

          return execa.shell(
            eslintCommand(
              project,
              fix,
              config,
              ignorePattern,
              ignoreFile,
              !!checkstyle,
            ),
            { stdio: checkstyle ? undefined : 'inherit' },
          );
        })
        .map(promise =>
          promise.then(
            results => ({
              xmlData: results.stdout,
              code: 0,
            }),
            results => ({
              xmlData: results.stdout,
              code: 1,
            }),
          ),
        ),
    ).then(async results => {
      const status = results.reduce(
        (previous, { code }) => Math.max(previous, code),
        0,
      );

      // Only care if it failed when not runing with --checkstyle
      if (!checkstyle && status === 1) {
        process.exitCode = 1;
      }

      // Clean paths and merge files if monorepo
      if (checkstyle) {
        let newXML = {
          checkstyle: {
            file: [],
          },
        };
        const parser = new xml2js.Parser();
        const parseString = pify(parser.parseString);
        await Promise.all(
          results.map(async ({ xmlData }) => {
            const checkstyleXML = await parseString(xmlData);
            // Merge
            newXML = {
              ...newXML,
              ...checkstyleXML,
              checkstyle: {
                ...checkstyleXML.checkstyle,
                file: [
                  ...newXML.checkstyle.file,
                  ...checkstyleXML.checkstyle.file,
                ],
              },
            };
          }),
        );

        const builder = new xml2js.Builder();
        await fs.ensureDir(path.join(context.directory, 'reports'));
        return fs.writeFile(
          path.join(context.directory, 'reports', 'lint.xml'),
          builder.buildObject(newXML),
        );
      }

      return Promise.resolve();
    });
};
