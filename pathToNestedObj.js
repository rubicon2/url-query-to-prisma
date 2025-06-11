function pathToNestedObj(path, pathSeparator, value) {
  const nestedPath = {};
  const pathElements = path.split(pathSeparator);
  let currentLevel = nestedPath;
  for (let i = 0; i < pathElements.length; i++) {
    const nextKey = pathElements[i];
    if (i === pathElements.length - 1) {
      currentLevel[nextKey] = value;
      break;
    }
    const nextLevel = {};
    currentLevel[nextKey] = nextLevel;
    currentLevel = nextLevel;
  }
  return nestedPath;
}

module.exports = pathToNestedObj;
