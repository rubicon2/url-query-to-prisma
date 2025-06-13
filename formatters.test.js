const formatters = require('./formatters');

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
    const middleware = formatters.where('contains', {
      someOption: 'someOptionValue',
    });
    middleware(queryObj, 'someKey', 'someValue');
    expect(queryObj.where.someKey.someOption).toEqual('someOptionValue');
  });

  it('should process the value with the valueFormatter parameter, if supplied', () => {
    const middleware = formatters.where('contains', {}, (value) =>
      value.toUpperCase(),
    );
    middleware(queryObj, 'someDate', 'bananas');
    expect(queryObj).toEqual({
      where: {
        someDate: {
          contains: 'BANANAS',
        },
      },
    });
  });

  it('should add the query param to the base where object if filterType is null, and ignore options', () => {
    const middleware = formatters.where(null, { someOption: 'ignoreMe' });
    middleware(queryObj, 'basicWhere', 'basicValue');
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
      const middleware = formatters.where(whereType);
      middleware(queryObj, 'someKey', 'someValue');
      expect(queryObj.where.someKey).toEqual({ [whereType]: 'someValue' });
    },
  );

  it('should create a correctly nested object for accessing the table columns of a foreign relation', () => {
    const middleware = formatters.where(null, {});
    middleware(queryObj, 'blogOwner.name', 'jimmy');
    expect(queryObj).toEqual({
      where: {
        blogOwner: {
          name: 'jimmy',
        },
      },
    });
  });

  it('should add options into nested object results if present in parameters', () => {
    const middleware = formatters.where('contains', {
      someOption: 'someOptionValue',
    });
    middleware(queryObj, 'one.two', 'someValue');
    expect(queryObj.where.one.two.someOption).toEqual('someOptionValue');
  });

  it('should process the value inside a nested object with the valueFormatter parameter, if supplied', () => {
    const middleware = formatters.where('contains', {}, (value) =>
      value.toUpperCase(),
    );
    middleware(queryObj, 'fridge.shelf', 'bananas');
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
    const middleware = formatters.where(null, {
      someOption: 'ignoreMe',
    });
    middleware(queryObj, 'one.two', 'value');
    expect(queryObj).toEqual({
      where: {
        one: {
          two: 'value',
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

    fromDateMiddleware(queryObj, 'unusedKey', '2025-01-01');
    toDateMiddleware(queryObj, 'unusedKey', '2025-12-31');
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

    lte(queryObj, 'unusedKey', 97);
    gte(queryObj, 'unusedKey', 7);
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

    fromDateMiddleware(queryObj, 'unusedKey', '2025-01-01');
    toDateMiddleware(queryObj, 'unusedKey', '2025-12-31');
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
});
