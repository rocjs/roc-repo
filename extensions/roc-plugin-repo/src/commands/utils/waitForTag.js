import exec from './execute';
import wait from './wait';

export default async function waitForTag({
  github,
  tag,
  owner,
  repo,
  tries,
  delay,
}) {
  const { stdout } = await exec(`git show-ref -s ${tag}`);
  const hash = stdout.trim();

  const checkTag = async triesLeft => {
    if (triesLeft === 0) {
      throw new Error(
        'Could not find the tag on GitHub needed to create the release',
      );
    }

    try {
      const response = await github.gitdata.getTag({
        owner,
        repo,
        sha: hash,
      });

      // If the status we get
      if (response.meta.status !== '200 OK') {
        await wait(delay);
        return checkTag(triesLeft - 1);
      }

      return Promise.resolve();
    } catch (_error) {
      await wait(delay);
      return checkTag(triesLeft - 1);
    }
  };

  return checkTag(tries);
}
