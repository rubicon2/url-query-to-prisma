const deepMerge = require('@rubicon2/deep-merge');
const pathToNestedObj = require('path-to-nested-obj');

// Basically, the properties on the formatter should correspond to params in the url query string.
// So if you have url.com?take=5&skip=10, the take function will be called with a value of 5,
// and the skip function called with a value of 10, modifying queryObj with whatever properties you add to it.
const defaultFormatter = {
  take: (queryObj, key, value) => (queryObj.take = Number(value)),
  skip: (queryObj, key, value) => (queryObj.skip = Number(value)),
  cursor: (queryObj, key, value) => (queryObj.cursor = { id: Number(value) }),
  orderBy: (queryObj, key, value, options) => {
    // Works with string and arrays of strings, and paths like you would use with sql, e.g. owner.name.
    if (Array.isArray(value)) {
      queryObj.orderBy = {};
      value.forEach((e) => {
        queryObj.orderBy = deepMerge(
          queryObj.orderBy,
          pathToNestedObj(e, options.pathSeparator, 'asc'),
        );
        // Save keys to an array for use in sortOrder later. In sortOrder function,
        // an updated version of the orderBy obj value will be constructed out of the
        // saved paths, and assigned the updated value.
        const orderByPaths = queryObj.temp.orderByPaths;
        queryObj.temp.orderByPaths = orderByPaths ? [...orderByPaths, e] : [e];
      });
    } else {
      queryObj.orderBy = pathToNestedObj(value, options.pathSeparator, 'asc');
      queryObj.temp.orderByPaths = [value];
    }
  },
  sortOrder: (queryObj, key, value, options) => {
    // Works with string and arrays of strings.
    // Assumes the first key in orderByKeys corresponds to the first value in sortOrder.
    const orderByPaths = queryObj.temp.orderByPaths;
    if (Array.isArray(value)) {
      value.forEach((e) => {
        const savedPath = orderByPaths?.shift();
        if (savedPath) {
          const mega = pathToNestedObj(savedPath, options.pathSeparator, e);
          queryObj.orderBy = {
            ...queryObj.orderBy,
            ...mega,
          };
        }
      });
    } else {
      const savedPath = orderByPaths?.shift();
      if (savedPath) {
        const obj = pathToNestedObj(savedPath, options.pathSeparator, value);
        queryObj.orderBy = {
          ...queryObj.orderBy,
          ...obj,
        };
      }
    }
  },
  setup: () => {
    // For setup user may want to do in prep for their custom formatter functions.
    return;
  },
  cleanup: () => {
    // For any cleanup use may want to do after their custom formatter functions.
    return;
  },
};

module.exports = defaultFormatter;
