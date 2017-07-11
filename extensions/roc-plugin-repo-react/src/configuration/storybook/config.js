/* global STORIES HAS_PROJECT_ENTRY PROJECT_ENTRY */
const { configure } = require('@storybook/react');

function loadStories() {
  require(STORIES);
}

if (HAS_PROJECT_ENTRY) {
  require(PROJECT_ENTRY);
}

configure(loadStories, module);
