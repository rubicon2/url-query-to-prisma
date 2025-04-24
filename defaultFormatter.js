// Basically, the properties on the formatter should correspond to params in the url query string.
// So if you have url.com?take=5&skip=10, the take function will be called with a value of 5,
// and the skip function called with a value of 10, modifying queryObj with whatever properties you add to it.
const defaultFormatter = {
  take: (queryObj, key, value) => (queryObj.take = value),
  skip: (queryObj, key, value) => (queryObj.skip = value),
  cursor: (queryObj, key, value) => (queryObj.cursor = { id: value }),
  orderBy: (queryObj, key, value) => {
    // Works with string and arrays of strings.
    if (Array.isArray(value)) {
      queryObj.orderBy = {};
      value.forEach((e) => {
        queryObj.orderBy[e] = 'asc';
        // Save keys to an array for use in sortOrder later.
        queryObj.orderByKeys = queryObj.orderByKeys
          ? [...queryObj.orderByKeys, e]
          : [e];
      });
    } else {
      queryObj.orderBy = { [value]: 'asc' };
      queryObj.orderByKeys = [value];
    }
  },
  sortOrder: (queryObj, key, value) => {
    // Works with string and arrays of strings.
    // Assumes the first key in orderByKeys corresponds to the first value in sortOrder.
    if (Array.isArray(value)) {
      value.forEach((e) => {
        const savedKey = queryObj.orderByKeys?.shift();
        if (savedKey) queryObj.orderBy[savedKey] = e;
      });
    } else {
      const savedKey = queryObj.orderByKeys?.shift();
      if (savedKey) queryObj.orderBy[savedKey] = value;
    }
    delete queryObj.orderByKeys;
  },
  where: (queryObj, key, value) => {
    // This is the default function that will be used. If no other formatter function is used, this one will.
    // User can overwrite with a custom function that puts all conditions in 'includes', for instance.
    queryObj.where = {
      ...queryObj.where,
      [key]: value,
    };
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
