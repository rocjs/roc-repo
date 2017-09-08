import GitHubAPI from 'github';
import getPkgRepo from 'get-pkg-repo';
import url from 'url';

import waitForTag from './waitForTag';

const pkg = require('../../../package.json');

export default async function createGitHubRelease(
  packageJSON,
  text,
  tag,
  AUTH_TOKEN,
  draft = true,
  prerelease = false,
) {
  const repoInfo = getPkgRepo(packageJSON);
  const browse = url.parse(repoInfo.browse());

  const host = repoInfo.domain ? repoInfo.domain : browse.host;
  const owner = repoInfo.user || browse.path.split('/')[1];
  const repo = repoInfo.project || browse.path.split('/')[2];

  const github = new GitHubAPI({
    host: host === 'github.com' ? undefined : host,
    protocol: 'https',
    pathPrefix: host === 'github.com' ? undefined : '/api/v3',
    headers: {
      'user-agent': `${pkg.name} v${pkg.version}`,
    },
  });

  github.authenticate({
    type: 'oauth',
    token: AUTH_TOKEN,
  });

  // Make sure the tag exists from the point of view of the GitHUb API
  // Can take a while for it to be synced after we have pushed the tags
  await waitForTag({
    github,
    tag,
    owner,
    repo,
    tries: 4,
    delay: 500, // ms
  });

  return github.repos.createRelease({
    tag_name: tag,
    owner,
    repo,
    name: tag,
    body: text,
    draft,
    prerelease,
  });
}
