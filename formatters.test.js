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
