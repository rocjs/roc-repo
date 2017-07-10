import path from 'path';
import { bootstrap } from 'commitizen/dist/cli/git-cz';

export default ({ extraArguments }) => {
  process.argv = extraArguments;
  return bootstrap({
    cliPath: path.resolve(path.dirname(require.resolve('commitizen')), '..'),
    config: {
      path: require.resolve('cz-conventional-changelog'),
    },
  });
};
