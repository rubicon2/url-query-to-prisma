const formatters = require('./formatters');

const options = { pathSeparator: '.' };
let queryObj;
beforeEach(() => {
  queryObj = {};
});

test.each(
  Object.keys(formatters).map((key) => {
    return {
      name: key,
      fn: formatters[key],
      expected: 'function',
    };
  }),
)('$name helper function should return a function', ({ fn }) => {
  const middleware = fn();
  expect(typeof middleware).toBe('function');
});

describe('where', () => {
  it('should add options into its results if present in parameters', () => {
    const middleware = formatters.where({
      filterType: 'contains',
      filterOptions: {
        someOption: 'someOptionValue',
      },
    });
    middleware(queryObj, 'someKey', 'someValue', options);
    expect(queryObj.where.someKey.someOption).toEqual('someOptionValue');
  });

  it('should process the value with the valueFormatter parameter, if supplied', () => {
    const middleware = formatters.where({
      filterType: 'contains',
      valueProcessor: (value) => value.toUpperCase(),
    });
    middleware(queryObj, 'someDate', 'bananas', options);
    expect(queryObj).toEqual({
      where: {
        someDate: {
          contains: 'BANANAS',
        },
      },
    });
  });

  it('should add the query param to the base where object if filterType is null, and ignore options', () => {
    const middleware = formatters.where({
      filterOptions: { someOption: 'ignoreMe' },
    });
    middleware(queryObj, 'basicWhere', 'basicValue', options);
    expect(queryObj).toEqual({
      where: {
        basicWhere: 'basicValue',
      },
    });
  });

  test.each([
    { whereType: 'lte' },
    { whereType: 'contains' },
    { whereType: 'gt' },
  ])(
    'should modify the type of where to reflect the first parameter of $type',
    ({ whereType }) => {
      const middleware = formatters.where({ filterType: whereType });
      middleware(queryObj, 'someKey', 'someValue', options);
      expect(queryObj.where.someKey).toEqual({ [whereType]: 'someValue' });
    },
  );

  it('should create a correctly nested object for accessing the table columns of a foreign relation', () => {
    const middleware = formatters.where();
    middleware(queryObj, 'blogOwner.name', 'jimmy', options);
    expect(queryObj).toEqual({
      where: {
        blogOwner: {
          name: 'jimmy',
        },
      },
    });
  });

  it('should add options into nested object results if present in parameters', () => {
    const middleware = formatters.where({
      filterType: 'contains',
      filterOptions: { someOption: 'someOptionValue' },
    });
    middleware(queryObj, 'one.two', 'someValue', options);
    expect(queryObj.where.one.two.someOption).toEqual('someOptionValue');
  });

  it('should process the value inside a nested object with the valueFormatter parameter, if supplied', () => {
    const middleware = formatters.where({
      filterType: 'contains',
      valueProcessor: (value) => value.toUpperCase(),
    });
    middleware(queryObj, 'fridge.shelf', 'bananas', options);
    expect(queryObj).toEqual({
      where: {
        fridge: {
          shelf: {
            contains: 'BANANAS',
          },
        },
      },
    });
  });

  it('should add the query param to the base where object on a nested where if filterType is null, and ignore options', () => {
    const middleware = formatters.where({
      filterOptions: {
        someOption: 'ignoreMe',
      },
    });
    middleware(queryObj, 'one.two', 'value', options);
    expect(queryObj).toEqual({
      where: {
        one: {
          two: 'value',
        },
      },
    });
  });

  it('should be able to change query output table column with formatterOptions.tableColName parameter', () => {
    const middleware = formatters.where({
      filterType: 'includes',
      filterOptions: { mode: 'insensitive' },
      formatterOptions: { tableColName: 'one.two.three' },
    });

    middleware(queryObj, 'ignored.path', 'myNestedValue', options);
    expect(queryObj).toEqual({
      where: {
        one: {
          two: {
            three: {
              includes: 'myNestedValue',
              mode: 'insensitive',
            },
          },
        },
      },
    });
  });

  it('should work with different path separators passed in the formatterOptions', () => {
    const middleware = formatters.where();

    middleware(queryObj, 'one/two/three', 'myNestedValue', {
      pathSeparator: '/',
    });
    expect(queryObj).toEqual({
      where: {
        one: {
          two: {
            three: 'myNestedValue',
          },
        },
      },
    });
  });
});

describe('groupWhere', () => {
  it('should allow user to group query params and output as a single object property', () => {
    const fromDateMiddleware = formatters.groupWhere(
      'dateRange',
      'gte',
      (value) => new Date(value),
    );

    const toDateMiddleware = formatters.groupWhere(
      'dateRange',
      'lte',
      (value) => new Date(value),
    );

    fromDateMiddleware(queryObj, 'unusedKey', '2025-01-01', options);
    toDateMiddleware(queryObj, 'unusedKey', '2025-12-31', options);
    expect(queryObj).toEqual({
      where: {
        dateRange: {
          gte: new Date('2025-01-01'),
          lte: new Date('2025-12-31'),
        },
      },
    });
  });

  it('should have a default valueFormatter function that just returns the value', () => {
    const lte = formatters.groupWhere('count', 'lte');
    const gte = formatters.groupWhere('count', 'gte');

    lte(queryObj, 'unusedKey', 97, options);
    gte(queryObj, 'unusedKey', 7, options);
    expect(queryObj).toEqual({
      where: {
        count: {
          lte: 97,
          gte: 7,
        },
      },
    });
  });

  it('should create a correctly nested object for creating a groupWhere for the table column of a foreign relation', () => {
    const fromDateMiddleware = formatters.groupWhere(
      'user.blogs.createdAt',
      'gte',
      (value) => new Date(value),
    );

    const toDateMiddleware = formatters.groupWhere(
      'user.blogs.createdAt',
      'lte',
      (value) => new Date(value),
    );

    fromDateMiddleware(queryObj, 'unusedKey', '2025-01-01', options);
    toDateMiddleware(queryObj, 'unusedKey', '2025-12-31', options);
    expect(queryObj).toEqual({
      where: {
        user: {
          blogs: {
            createdAt: {
              gte: new Date('2025-01-01'),
              lte: new Date('2025-12-31'),
            },
          },
        },
      },
    });
  });

  it('should work with different path separators passed in the formatterOptions', () => {
    const middleware = formatters.groupWhere(
      'one/two/three/myTableColName',
      'lte',
      (v) => v,
    );

    middleware(queryObj, 'lte', 'myLteValue', {
      pathSeparator: '/',
    });
    expect(queryObj).toEqual({
      where: {
        one: {
          two: {
            three: {
              myTableColName: {
                lte: 'myLteValue',
              },
            },
          },
        },
      },
    });
  });
});
