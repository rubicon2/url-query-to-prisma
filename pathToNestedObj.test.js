const pathToNestedObj = require('./pathToNestedObj');

describe('pathToNestedObj', () => {
  it('should create a nested object with keys corresponding to the path elements', () => {
    expect(pathToNestedObj('owner.name', '.', 'jimbo')).toEqual({
      owner: {
        name: 'jimbo',
      },
    });

    expect(pathToNestedObj('planet.continent.country', '.', 'england')).toEqual(
      {
        planet: {
          continent: {
            country: 'england',
          },
        },
      },
    );
  });

  it('should work with whatever separator is supplied as the second parameter', () => {
    expect(pathToNestedObj('person/hand/finger', '/', null)).toEqual({
      person: {
        hand: {
          finger: null,
        },
      },
    });

    expect(pathToNestedObj('person-hand-finger', '-', null)).toEqual({
      person: {
        hand: {
          finger: null,
        },
      },
    });
  });

  it('should use whatever value is supplied as the third parameter for the value at the deepest level', () => {
    expect(
      pathToNestedObj('person.hand.finger', '.', 'myAmazingValue'),
    ).toEqual({
      person: {
        hand: {
          finger: 'myAmazingValue',
        },
      },
    });
  });

  it('should be able to use an object for the third parameter, which will become the value at the deepest level', () => {
    expect(
      pathToNestedObj('person.hand.finger', '.', {
        mega: 'megaValue',
        ultra: 'ultraValue',
      }),
    ).toEqual({
      person: {
        hand: {
          finger: {
            mega: 'megaValue',
            ultra: 'ultraValue',
          },
        },
      },
    });
  });
});
