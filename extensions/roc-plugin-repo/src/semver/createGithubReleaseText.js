import path from 'path';
import fs from 'fs-extra';
import conventionalChangelog from 'conventional-changelog';
import dateFormat from 'dateformat';

import {
  getLatestCommitsSinceRelease,
  conventionalChangelogOptions,
} from './utils';

export default async function createGithubReleaseText(
  projects,
  isMonorepo,
  individual,
  from,
  prerelease,
) {
  individual = !isMonorepo ? true : individual; // eslint-disable-line no-param-reassign

  const angular = require('conventional-changelog-angular');
  const { writerOpts: { transform } } = await angular;

  const latest = await getLatestCommitsSinceRelease(
    'angular',
    from,
    projects,
    isMonorepo,
  );
  const templates = await getTemplates(individual);
  const generateReleaseNotesForProject = createGenerateReleaseNotesForProject(
    templates,
    transform,
    isMonorepo,
    projects,
  );
  const projectTable = individual ? '' : createTable(projects);
  const fromRelease = project =>
    prerelease && latest[project].prerelease.hash
      ? latest[project].prerelease.hash
      : latest[project].release.hash;

  return Promise.all(
    projects.map(project =>
      generateReleaseNotesForProject(
        project,
        from || fromRelease(project.name),
      ),
    ),
  ).then(
    releaseNotes =>
      `## ${dateFormat(
        Date.now(),
        'mmmm d, yyyy',
      )}\n${projectTable}${releaseNotes.join('')}`,
  );
}

function createGenerateReleaseNotesForProject(
  templates,
  transform,
  isMonorepo,
  projects,
) {
  return (project, from) =>
    new Promise(resolve => {
      let releaseText = '';
      conventionalChangelog(
        conventionalChangelogOptions('angular', isMonorepo, projects)(project),
        {
          title: project.name,
          directory: `${project.directory}/${project.folder}`,
        },
        { from, reverse: true },
        {
          noteKeywords: [
            'SCOPE',
            'SCOPES',
            'BREAKING CHANGE',
            'BREAKING CHANGES',
          ],
        },
        {
          transform: angularTransformerOverride(transform),
          ...templates,
        },
      )
        .on('data', chunk => {
          releaseText += chunk.toString('utf8');
        })
        .on('end', () => resolve(releaseText));
    });
}

function angularTransformerOverride(transformer) {
  return (commit, context) => {
    const newCommit = transformer(commit, context);

    if (newCommit) {
      const mapping = {
        Features: ':sparkles: Features', // ✨
        'Bug Fixes': ':bug: Bug Fixes', // 🐛
        'Performance Improvements': ':rocket: Performance Improvements', // 🚀
        Reverts: ':leftwards_arrow_with_hook: Reverts', // ↩️
        Documentation: ':books: Documentation', // 📚
        Styles: ':nail_care: Styles', // 💅
        'Code Refactoring': ':recycle: Code Refactoring', // ♻️
        Tests: ':white_check_mark: Tests', // ✅
        Chores: ':wrench: Chores', // 🔧
      };

      newCommit.type = mapping[newCommit.type] || newCommit.type;

      newCommit.notes.forEach(note => {
        if (note.title === 'BREAKING CHANGES') {
          // eslint-disable-next-line no-param-reassign
          note.title = ':boom: Breaking Changes'; // 💥
        }
      });
    }

    return newCommit;
  };
}

function getTemplates(individual) {
  return Promise.all([
    fs.readFile(path.join(__dirname, 'templates', 'template.hbs'), 'utf-8'),
    fs.readFile(path.join(__dirname, 'templates', 'header.hbs'), 'utf-8'),
    fs.readFile(path.join(__dirname, 'templates', 'commit.hbs'), 'utf-8'),
    fs.readFile(path.join(__dirname, 'templates', 'footer.hbs'), 'utf-8'),
  ]).then(([template, header, commit, footer]) => ({
    mainTemplate: template,
    headerPartial: individual ? '' : header,
    commitPartial: commit,
    footerPartial: footer,
  }));
}

function createTable(projects) {
  return `${projects.reduce(
    (table, project) =>
      `${table}\n| ${project.name} | ${project.packageJSON.version} |`,
    '| Package | Version |\n|---------|---------|',
  )}\n\n`;
}
