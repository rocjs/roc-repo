/*
  Replace this with a Webpack API if possible.
*/
import path from 'path';
import tempWrite from 'temp-write';
import { fileExists } from 'roc';
import log from 'roc/log/default/small';

export default projects => {
  const projectsWithStories = [];
  let stories = '';

  projects.forEach(project => {
    const story = path.join(project.path, 'stories', 'index.js');

    if (fileExists(story)) {
      projectsWithStories.push(project.name);
      stories = `${stories}\nrequire('${story}');`;
    }
  });

  log.info(
    `Found Storybooks for the following projects:\n${projectsWithStories
      .map(project => ` — ${project}`)
      .join('\n')}\n`,
  );

  return tempWrite.sync(stories, 'roc-plugin-repo-react/storybook-stories.js');
};
