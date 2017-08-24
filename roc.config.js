module.exports = {
  settings: {
    repo: {
      targets: ['cjs'],
      babelPresetEnv: {
        targets: {
          node: 6,
        },
      },
      release: {
        collectedRelease: false,
      },
    },
  },
};
