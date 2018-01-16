/**
 * Based on the Angular commit message convention from conventional-changelog-angular.
 *
 * Can be used to create changelogs that can be posted to GitHub releases pages or markdown.
 */
import path from 'path';
import fs from 'fs-extra';
import compareFunc from 'compare-func';
import trimNewlines from 'trim-newlines';
import indentString from 'indent-string';

function normalizeString(text, spacing = 2) {
  let currentlyInCodeBlock = false;
  return trimNewlines(
    indentString(
      text.replace(
        // Make sure we respect newlines created in the commit message by adding two spaces
        // on each row, this will give us better formated markdown
        // We will specifically manage codeblocks to not add spaces there
        /^(```)?(.*)([\r\n])/gm,
        (match, code, textWithoutNewline) => {
          if (code && !currentlyInCodeBlock) {
            currentlyInCodeBlock = true;
          } else if (code) {
            currentlyInCodeBlock = false;
          } else if (!currentlyInCodeBlock) {
            return `${textWithoutNewline}  \n`;
          }

          return match;
        },
      ),
      spacing,
    ),
  ).replace(
    // Remove the indentation for the first line using replace
    new RegExp(`^ {${spacing}}`),
    '',
  );
}

module.exports = async (
  {
    type = 'markdown',
    changelogTypes = ['feat', 'revert', 'fix', 'perf'],
    includeBody = false,
    individual = false,
  } = {},
) => {
  const types = ['github', 'markdown'];
  if (types.indexOf(type) === -1) {
    throw new Error(
      `The type specified was not valid. Got: ${type} Allowed: ${types}`,
    );
  }

  return Promise.all([
    fs.readFile(
      path.join(__dirname, 'templates', type, 'template.hbs'),
      'utf-8',
    ),
    fs.readFile(path.join(__dirname, 'templates', type, 'header.hbs'), 'utf-8'),
    fs.readFile(path.join(__dirname, 'templates', type, 'commit.hbs'), 'utf-8'),
    fs.readFile(path.join(__dirname, 'templates', type, 'footer.hbs'), 'utf-8'),
  ]).then(([mainTemplate, headerPartial, commitPartial, footerPartial]) => ({
    parserOpts: {
      headerPattern: /^(\w*)(?:\((.*)\))?: (.*)$/,
      headerCorrespondence: ['type', 'scope', 'subject'],
      noteKeywords: ['SCOPE', 'SCOPES', 'BREAKING CHANGE', 'BREAKING CHANGES'],
      revertPattern: /^revert:\s([\s\S]*?)\s*This reverts commit (\w*)\./,
      revertCorrespondence: ['header', 'hash'],
    },

    writerOpts: {
      mainTemplate,
      headerPartial: individual ? '' : headerPartial,
      commitPartial,
      footerPartial,
      groupBy: 'type',
      commitGroupsSort: 'title',
      commitsSort: ['scope', 'subject'],
      noteGroupsSort: 'title',
      notesSort: compareFunc,
      transform: (commit, context) => {
        let breaking = false;
        const issues = [];

        // We remove the body from the commit message if we have disabled it or it's a revert commit
        if (!includeBody || commit.type === 'revert') {
          commit.body = null; // eslint-disable-line no-param-reassign
        } else if (commit.body) {
          // eslint-disable-next-line no-param-reassign
          commit.body = normalizeString(commit.body, 4);
        }

        commit.notes.forEach(note => {
          if (
            note.title === 'BREAKING CHANGES' ||
            note.title === 'BREAKING CHANGE'
          ) {
            note.title = // eslint-disable-line no-param-reassign
              type === 'github'
                ? ':boom: Breaking Changes' // 💥
                : 'BREAKING CHANGES';

            // eslint-disable-next-line no-param-reassign
            note.text = normalizeString(note.text, 2);
            breaking = true;
          }
        });

        if (
          !breaking &&
          changelogTypes !== true &&
          changelogTypes.indexOf(commit.type) === -1
        ) {
          return undefined;
        }
        const typeMapping =
          type === 'markdown'
            ? {
                feat: 'Features',
                fix: 'Bug Fixes',
                perf: 'Performance Improvements',
                revert: 'Reverts',
                docs: 'Documentation',
                style: 'Styles',
                refactor: 'Code Refactoring',
                test: 'Tests',
                chore: 'Chores',
              }
            : {
                feat: ':sparkles: Features', // ✨
                fix: ':bug: Bug Fixes', // 🐛
                perf: ':rocket: Performance Improvements', // 🚀
                revert: ':leftwards_arrow_with_hook: Reverts', // ↩️
                docs: ':books: Documentation', // 📚
                style: ':nail_care: Styles', // 💅
                refactor: ':recycle: Code Refactoring', // ♻️
                test: ':white_check_mark: Tests', // ✅
                chore: ':wrench: Chores', // 🔧
              };

        commit.type = typeMapping[commit.type] || commit.type; // eslint-disable-line no-param-reassign

        if (commit.scope === '*') {
          commit.scope = ''; // eslint-disable-line no-param-reassign
        }

        if (typeof commit.hash === 'string') {
          commit.hash = commit.hash.substring(0, 7); // eslint-disable-line no-param-reassign
        }

        if (typeof commit.subject === 'string') {
          let url = context.repository
            ? `${context.host}/${context.owner}/${context.repository}`
            : context.repoUrl;
          if (url) {
            url += '/issues/';
            // Issue URLs.
            // eslint-disable-next-line no-param-reassign
            commit.subject = commit.subject.replace(
              /#([0-9]+)/g,
              (_, issue) => {
                issues.push(issue);
                return `[#${issue}](${url}${issue})`;
              },
            );
          }
          if (context.host) {
            // User URLs.
            // eslint-disable-next-line no-param-reassign
            commit.subject = commit.subject.replace(
              /\B@([a-z0-9](?:-?[a-z0-9]){0,38})/g,
              `[@$1](${context.host}/$1)`,
            );
          }
        }

        // remove references that already appear in the subject
        // eslint-disable-next-line no-param-reassign
        commit.references = commit.references.filter(reference => {
          if (issues.indexOf(reference.issue) === -1) {
            return true;
          }

          return false;
        });

        return commit;
      },
    },
  }));
};
