// Helper functions for customizing with customFormatter parameter.
// Options on the text is basically just to allow mode: 'insensitive',
// which is required on postgreSQL or mongoDB to case-insensitive filtering.
function where(filterType, options) {
  return (queryObj, key, value) => {
    queryObj.where = {
      ...queryObj.where,
      [key]: {
        [filterType]: value,
        ...options,
      },
    };
  };
}

module.exports = {
  where,
};
