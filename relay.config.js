module.exports = {
  ...require('./relay.config.base'),
  projects: {
    azzapp: {
      ...require('./relay.config.base').projects.azzapp,
      persist: {
        file: 'packages/api/src/persisted-query-map.json',
      },
    },
  },
};
