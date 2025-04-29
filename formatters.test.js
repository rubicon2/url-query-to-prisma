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
});
