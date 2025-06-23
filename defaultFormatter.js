const deepMerge = require('@rubicon2/deep-merge');
const pathToNestedObj = require('path-to-nested-obj');
const mergeArraysInPlace = require('merge-arrays-in-place');

function objToArray(obj) {
  return Object.entries(obj).map(([key, value]) => {
    return { [key]: value };
  });
}

// Basically, the properties on the formatter should correspond to params in the url query string.
// So if you have url.com?take=5&skip=10, the take function will be called with a value of 5,
// and the skip function called with a value of 10, modifying queryObj with whatever properties you add to it.
const defaultFormatter = {
  take: (queryObj, key, value) => (queryObj.take = Number(value)),
  skip: (queryObj, key, value) => (queryObj.skip = Number(value)),
  cursor: (queryObj, key, value) => (queryObj.cursor = { id: Number(value) }),
  orderBy: (queryObj, key, value, options) => {
    // Throw it into an array even if there is only one value. Makes everything simpler.
    const orderByValues = Array.isArray(value) ? value : [value];
    const orderByPaths = [];
    // Need to do as an object to allow deep merging, turn into an array later for prisma use.
    let orderBy = {};
    for (const path of orderByValues) {
      const existingSort = queryObj?.temp?.sortOrder?.shift();
      orderBy = deepMerge(
        orderBy,
        pathToNestedObj(path, options.pathSeparator, existingSort || 'asc'),
      );
      orderByPaths.push(path);
    }
    // Prisma expects an array for orderBy.
    queryObj.orderBy = objToArray(orderBy);
    // Save paths so object structure can be re-created by sortOrder if that query param is used.
    queryObj.temp.orderByPaths = orderByPaths;
  },
  sortOrder: (queryObj, key, value, options) => {
    const discardOldValue = (x, y) => y;

    // If sortOrder runs before orderBy, just store the values for orderBy to use.
    if (!queryObj.temp.orderByPaths) {
      queryObj.temp.sortOrder = [value].flat();
      return;
    }

    const sortValues = Array.isArray(value) ? value : [value];
    // Use stored paths to create new object with new sortOrder values.
    let updatedOrderBy = {};
    for (let i = 0; i < sortValues.length; i++) {
      const currentPath = queryObj.temp.orderByPaths[i];
      const currentValue = sortValues[i];
      if (currentPath) {
        updatedOrderBy = deepMerge(
          updatedOrderBy,
          pathToNestedObj(currentPath, options.pathSeparator, currentValue),
          discardOldValue,
        );
      } else {
        // If we have run out of orderByPaths, that means we have a sortOrder value and no more paths to match to.
        // No point continuing the loop, so break out.
        break;
      }
    }
    // Use mergeArraysInPlace to merge into existing orderBy array on queryObj.
    const updatedOrderByArray = objToArray(updatedOrderBy);

    queryObj.orderBy = mergeArraysInPlace(
      queryObj.orderBy,
      updatedOrderByArray,
      // Use deepMerge on each pair of elements to allow nested objects, fields, etc.
      (a, b) => deepMerge(a, b, discardOldValue),
    );
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
