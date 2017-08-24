import dateFormat from 'dateformat';
import projectNameGenerator from 'project-name-generator';

import execute from './execute';

export default async function getTag(tagTemplate) {
  const { stdout: tagsOutput } = await execute('git fetch && git tag -l');
  const existingTags = tagsOutput.trim().split('\n');

  const { stdout: hashOutput } = await execute('git rev-parse HEAD');
  const hash = hashOutput.trim();

  const generateTag = (tries = 0) => {
    const tag = tagTemplate
      .replace(
        /\[name(?::([0-9]))?(?::(a))?\]/,
        (all, words = 2, alliterative = false) =>
          projectNameGenerator({ words, alliterative: !!alliterative }).dashed,
      )
      .replace(/\[hash(?::([0-9]))?\]/, (all, length = 6) =>
        hash.substring(0, length),
      )
      .replace(/\[date(?::(.*))?\]/, (all, template) =>
        dateFormat(Date.now(), template),
      );

    if (existingTags.includes(tag) && tries < 10) {
      return generateTag(tries + 1);
    } else if (tries === 10) {
      throw new Error(
        `Could not get a tag name using provided template: ${tag}`,
      );
    }

    return tag;
  };

  return generateTag();
}
