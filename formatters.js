const deepMerge = require('@rubicon2/deep-merge');
const pathToNestedObj = require('path-to-nested-obj');

// Helper functions for customizing with customFormatter parameter.
// filterOptions is basically just to allow mode: 'insensitive',
// which is required on postgreSQL or mongoDB to case-insensitive filtering.
// valueProcessor is a function that can be used to transform the query value.
// All query values are strings by default but prisma will expect real numbers
// and date objects for making comparisons to db table values. So you can use
// the valueProcessor to turn the string into a number, or a date, etc.
const defaultOptions = {
  filterType: null,
  filterOptions: {},
  valueProcessor: (value) => value,
  formatterOptions: {},
};

function where(customOptions = {}) {
  const options = {
    ...defaultOptions,
    ...customOptions,
  };
  const { filterType, filterOptions, valueProcessor, formatterOptions } =
    options;

  if (filterType) {
    return (queryObj, key, value, options) => {
      queryObj.where = deepMerge(
        queryObj.where,
        pathToNestedObj(
          formatterOptions.tableColName || key,
          options.pathSeparator,
          {
            [filterType]: valueProcessor(value),
            ...filterOptions,
          },
        ),
      );
    };
  } else {
    return (queryObj, key, value, options) => {
      queryObj.where = deepMerge(
        queryObj.where,
        pathToNestedObj(
          formatterOptions.tableColName || key,
          options.pathSeparator,
          valueProcessor(value),
        ),
      );
    };
  }
}

module.exports = {
  where,
};
