/* global STORIES */
const { configure } = require('@storybook/react');

function loadStories() {
  require(STORIES);
}

configure(loadStories, module);
