function objectMerge(a, b) {
  // Arrays are objects, so need to deal with separately and before the next base case.
  if (Array.isArray(a) || Array.isArray(b)) {
    return [
      // Merge no matter whether a, or b, or neither, or both are arrays already.
      ...(Array.isArray(a) ? a : [a]),
      ...(Array.isArray(b) ? b : [b]),
    ];
  }

  // If either a or b is not an object or array.
  if (typeof a !== 'object' || typeof b !== 'object') {
    if (typeof a !== 'undefined' && typeof b !== 'undefined') {
      // At this point, a and b are guaranteed to not be arrays, or undefined, but one could be an object.
      if (a === b) return a;
      else
        return [
          // Merge no matter whether a, or b, or neither, or both are arrays already.
          ...(Array.isArray(a) ? a : [a]),
          ...(Array.isArray(b) ? b : [b]),
        ];
    }
    if (typeof a === 'undefined') return b;
    else return a;
  }

  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const merged = {};
  for (const key of allKeys) {
    const av = a[key];
    const bv = b[key];
    merged[key] = objectMerge(av, bv);
  }
  return merged;
}

module.exports = objectMerge;
