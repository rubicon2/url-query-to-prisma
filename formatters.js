// Helper functions for customizing with customFormatter parameter.
// Options on the text is basically just to allow mode: 'insensitive',
// which is required on postgreSQL or mongoDB to case-insensitive filtering.
function where(filterType, options = {}, valueFormatter = (value) => value) {
  if (filterType) {
    return (queryObj, key, value) => {
      queryObj.where = {
        ...queryObj.where,
        [key]: {
          [filterType]: valueFormatter(value),
          ...options,
        },
      };
    };
  } else {
    return (queryObj, key, value) => {
      queryObj.where = {
        ...queryObj.where,
        [key]: valueFormatter(value),
      };
    };
  }
}

function groupWhere(groupKey, key, valueFormatter = (value) => value) {
  // inputQueryParam is not used - we want the value to relate to the groupKey, not the req.query input param.
  return (queryObj, inputQueryParam, value) => {
    queryObj.where = {
      ...queryObj.where,
      [groupKey]: {
        ...queryObj.where?.[groupKey],
        [key]: valueFormatter(value),
      },
    };
  };
}

module.exports = {
  where,
  groupWhere,
};
