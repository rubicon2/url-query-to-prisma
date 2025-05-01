const processors = require('./processors');

describe('date function', () => {
  it('should return a date when provided a valid date string', () => {
    const result = processors.date('2025-12-25');
    expect(result).toEqual(new Date('2025-12-25'));
  });
});

describe('number function', () => {
  it('should return a number when provided a castable string', () => {
    const result = processors.number('097');
    expect(result).toBe(97);
  });
});
