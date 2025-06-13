const deepMerge = require('./deepMerge');

describe('objectMerge', () => {
  it('should recursively merge objects', () => {
    const objA = {
      a: {
        b: 'c',
        d: 'e',
      },
    };

    const objB = {
      a: {
        b: 'c',
        f: 'g',
      },
    };

    expect(deepMerge(objA, objB)).toEqual({
      a: {
        b: 'c',
        d: 'e',
        f: 'g',
      },
    });
  });

  it('should put two different values that correspond to the same key at the same level into an array', () => {
    const objA = {
      a: {
        b: {
          c: {
            d: 1,
          },
        },
      },
    };

    const objB = {
      a: {
        b: {
          c: {
            d: 2,
          },
        },
      },
    };

    expect(deepMerge(objA, objB)).toEqual({
      a: {
        b: {
          c: {
            d: [1, 2],
          },
        },
      },
    });
  });

  it('should ignore a duplicated value in objB that corresponds to the same key at the same level', () => {
    const objA = {
      a: 'myValue',
    };

    const objB = {
      a: 'myValue',
    };

    expect(deepMerge(objA, objB)).toEqual({
      a: 'myValue',
    });
  });

  it('should merge values into arrays when encountered asymmetrically', () => {
    const objA = {
      a: [1, 2, 3],
    };

    const objB = {
      a: 4,
    };

    expect(deepMerge(objA, objB)).toEqual({
      a: [1, 2, 3, 4],
    });
  });

  it('should merge values from two arrays into one array', () => {
    const objA = {
      a: [1, 2],
    };

    const objB = {
      a: [3, 4, 5],
    };

    expect(deepMerge(objA, objB)).toEqual({
      a: [1, 2, 3, 4, 5],
    });
  });

  it('should work with null values', () => {
    const objA = {
      a: {
        b: null,
      },
    };

    const objB = {
      a: {
        b: 'myValue',
        c: null,
      },
    };

    expect(deepMerge(objA, objB)).toEqual({
      a: {
        b: [null, 'myValue'],
        c: null,
      },
    });
  });

  it('should ignore undefined values', () => {
    const objA = {
      a: {
        b: undefined,
      },
    };

    const objB = {
      a: {
        b: 'myValue',
        c: undefined,
      },
    };

    expect(deepMerge(objA, objB)).toEqual({
      a: {
        b: 'myValue',
      },
    });
  });
});
