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
) {
  individual = !isMonorepo ? true : individual; // eslint-disable-line no-param-reassign

  // Replace with this when the latest changes have been merged for this package
  // const angular = require('conventional-changelog-angular');
  // const { writerOpts: { transform } } = await angular;
  const transform = require('./conventional-changelog-angular-transformer')
    .default;

  const latest = await getLatestCommitsSinceRelease('angular');
  const templates = await getTemplates(individual);
  const generateReleaseNotesForProject = createGenerateReleaseNotesForProject(
    templates,
    transform,
    isMonorepo,
  );
  const projectTable = individual ? '' : createTable(projects);

  return Promise.all(
    projects.map(project =>
      generateReleaseNotesForProject(project, latest[project.name]),
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
) {
  return (project, from) =>
    new Promise(resolve => {
      let releaseText = '';
      conventionalChangelog(
        conventionalChangelogOptions('angular', isMonorepo)(project),
        {
          title: project.name,
          directory: `${project.directory}/${project.folder}`,
        },
        { from, reverse: true },
        undefined,
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
      if (newCommit.type === 'Features') {
        newCommit.type = ':sparkles: Features';
      } else if (newCommit.type === 'Bug Fixes') {
        newCommit.type = ':bug: Bug Fixes';
      } else if (newCommit.type === 'Performance Improvements') {
        newCommit.type = ':rocket: Performance Improvements';
      } else if (newCommit.type === 'Reverts') {
        newCommit.type = ':leftwards_arrow_with_hook: Reverts';
      } else if (newCommit.type === 'Documentation') {
        newCommit.type = ':books: Documentation';
      } else if (newCommit.type === 'Styles') {
        newCommit.type = ':nail_care: Styles';
      } else if (newCommit.type === 'Code Refactoring') {
        newCommit.type = ':recycle: Code Refactoring';
      } else if (newCommit.type === 'Tests') {
        newCommit.type = ':white_check_mark: Tests';
      } else if (newCommit.type === 'Chores') {
        newCommit.type = ':wrench: Chores';
      }

      newCommit.notes.forEach(note => {
        if (note.title === 'BREAKING CHANGES') {
          note.title = ':boom: Breaking Changes'; // eslint-disable-line no-param-reassign
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
