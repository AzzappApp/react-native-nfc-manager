module.exports = {
  ...require('./relay.config.base'),
  projects: {
    azzapp: {
      ...require('./relay.config.base').projects.azzapp,
      persist: {
        file: 'packages/web/src/persisted-query-map.json',
      },
    },
  },
};
