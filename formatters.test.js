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

  it('should be able to group multiple filter types for the same table column', () => {
    const fromDate = formatters.where({
      filterType: 'gte',
      formatterOptions: { tableColName: 'publishedAt' },
      valueProcessor: (v) => new Date(v),
    });
    const toDate = formatters.where({
      filterType: 'lte',
      formatterOptions: { tableColName: 'publishedAt' },
      valueProcessor: (v) => new Date(v),
    });

    fromDate(queryObj, 'fromDate', '1992-01-01', options);
    toDate(queryObj, 'toDate', '1992-12-25', options);
    expect(queryObj).toEqual({
      where: {
        publishedAt: {
          gte: new Date('1992-01-01'),
          lte: new Date('1992-12-25'),
        },
      },
    });
  });

  it('should work with different path separators passed in the formatterOptions of a grouped query', () => {
    const lte = formatters.where({
      filterType: 'lte',
      formatterOptions: {
        tableColName: 'one/two/three/myTableColName',
      },
    });

    const gte = formatters.where({
      filterType: 'gte',
      formatterOptions: {
        tableColName: 'one/two/three/myTableColName',
      },
    });

    const newOptions = { pathSeparator: '/' };
    lte(queryObj, 'to', '9999', newOptions);
    gte(queryObj, 'from', '-9999', newOptions);
    expect(queryObj).toEqual({
      where: {
        one: {
          two: {
            three: {
              myTableColName: {
                gte: '-9999',
                lte: '9999',
              },
            },
          },
        },
      },
    });
  });
});
