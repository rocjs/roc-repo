import conventionalChangelog from 'conventional-changelog';
import dateFormat from 'dateformat';

import {
  getLatestCommitsSinceRelease,
  conventionalChangelogOptions,
} from './utils';

export default async function createGithubReleaseText(
  projects,
  status,
  isMonorepo,
  individual,
  from,
  prerelease,
  settings,
) {
  individual = !isMonorepo ? true : individual; // eslint-disable-line no-param-reassign

  const latest = await getLatestCommitsSinceRelease(from, projects, isMonorepo);
  const generateReleaseNotesForProject = createGenerateReleaseNotesForProject(
    isMonorepo,
    projects,
    settings.release.changelogTypes,
    settings.release.includeBody,
    individual,
  );
  const projectTable = individual ? '' : createTable(projects, status);
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
  isMonorepo,
  projects,
  changelogTypes,
  includeBody,
  individual,
) {
  return (project, from) =>
    new Promise(resolve => {
      let releaseText = '';
      conventionalChangelog(
        conventionalChangelogOptions(isMonorepo, projects, {
          type: 'github',
          changelogTypes,
          includeBody,
          individual,
        })(project),
        {
          title: project.name,
          directory: `${project.directory}/${project.folder}`,
        },
        { from, reverse: true },
      )
        .on('data', chunk => {
          releaseText += chunk.toString('utf8');
        })
        .on('end', () => resolve(releaseText));
    });
}

function createTable(projects, status) {
  return `${projects.reduce(
    (table, project) =>
      `${table}\n| \`${project.name}\` | \`${status[project.name]
        .newVersion}\` |`,
    '| Package | Version |\n|---------|---------|',
  )}\n\n`;
}
