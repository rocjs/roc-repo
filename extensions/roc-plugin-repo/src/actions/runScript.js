import { lazyFunctionRequire } from 'roc';

const lazyRequire = lazyFunctionRequire(require);

export default ({ context }) => (script, projects, extra) => () => {
  if (script === 'build') {
    return lazyRequire('./build')(context, projects, extra);
  } else if (script === 'clean') {
    return lazyRequire('./clean')(context, projects, extra);
  } else if (script === 'lint') {
    return lazyRequire('./lint')(context, projects, extra);
  } else if (script === 'publish') {
    return lazyRequire('./publish')(context, projects, extra);
  } else if (script === 'test') {
    return lazyRequire('./test')(context, projects, extra);
  }

  return [];
};
