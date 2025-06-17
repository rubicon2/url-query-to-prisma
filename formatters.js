const deepMerge = require('@rubicon2/deep-merge');
const pathToNestedObj = require('path-to-nested-obj');

// Helper functions for customizing with customFormatter parameter.
// filterOptions is basically just to allow mode: 'insensitive',
// which is required on postgreSQL or mongoDB to case-insensitive filtering.
// valueProcessor is a function that can be used to transform the query value.
// All query values are strings by default but prisma will expect real numbers
// and date objects for making comparisons to db table values. So you can use
// the valueProcessor to turn the string into a number, or a date, etc.
function where(customOptions = {}) {
  const defaultOptions = {
    filterType: null,
    filterOptions: {},
    valueProcessor: (value) => value,
    formatterOptions: {},
  };

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

function whereContains(customOptions = {}) {
  const defaultOptions = {
    // Some dbs are not case sensitive, in which case this will do nothing.
    caseSensitive: true,
  };

  const options = {
    ...defaultOptions,
    ...customOptions,
  };
  const { caseSensitive, ...rest } = options;

  // When prisma client is generated for certain db types, which are case-insensitive by design,
  // using the mode property will throw an error. Therefore, whereContains will default to not using
  // mode. This means this function will run case-sensitive queries on postgreSQL and mongoDB dbs,
  // unless caseSensitive is set to false, in which case the mode object will be included in the
  // prismaQueryObj.
  const modeOptions = {};
  if (!caseSensitive) modeOptions.mode = 'insensitive';

  return where({
    ...rest,
    filterType: 'contains',
    filterOptions: {
      ...rest.filterOptions,
      ...modeOptions,
    },
  });
}

module.exports = {
  where,
  whereContains,
};
