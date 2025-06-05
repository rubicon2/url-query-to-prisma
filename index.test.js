const { urlQueryToPrisma } = require('./index.js');
const httpMocks = require('node-mocks-http');

const basicRequest = {
  method: 'GET',
  url: 'http://test.com/blogs/97',
  params: {
    id: '97',
  },
};

let res;
let next;

beforeEach(() => {
  res = httpMocks.createResponse();
  next = jest.fn();
});

describe('urlQueryToPrisma', () => {
  it('should call next once the middleware is complete', () => {
    const req = httpMocks.createRequest(basicRequest);
    const middleware = urlQueryToPrisma();
    middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should add an empty object if there is no url query', () => {
    const req = httpMocks.createRequest(basicRequest);
    const middleware = urlQueryToPrisma();
    middleware(req, res, next);
    expect(req.prismaQueryParams).toEqual({});
  });

  it('should ignore any other fields not defined by the formatter', () => {
    const req = httpMocks.createRequest({
      ...basicRequest,
      query: {
        name: 'billy',
        email: 'billy@billyzone.com',
      },
    });
    const middleware = urlQueryToPrisma();
    middleware(req, res, next);
    expect(req.prismaQueryParams).toEqual({});
  });

  it('should convert any numbers in the query string into actual numbers on the where object', () => {
    const req = httpMocks.createRequest({
      ...basicRequest,
      query: {
        age: '32',
        mentalAge: '17',
      },
    });
    const middleware = urlQueryToPrisma('query', {
      age: (obj, key, value) => {
        obj.where = {
          ...obj.where,
          age: Number(value),
        };
      },
      mentalAge: (obj, key, value) => {
        obj.where = {
          ...obj.where,
          mentalAge: Number(value),
        };
      },
    });
    middleware(req, res, next);
    expect(req.prismaQueryParams.where).toEqual({
      age: 32,
      mentalAge: 17,
    });
  });

  it('should be able to add custom formatting to entries on the where property', () => {
    const req = httpMocks.createRequest({
      ...basicRequest,
      query: {
        myParam: 'bilbo',
      },
    });
    const middleware = urlQueryToPrisma('query', {
      myParam: (obj, key, value) => {
        obj.where = {
          ...obj.where,
          myParam: {
            contains: value,
          },
        };
      },
    });
    middleware(req, res, next);
    expect(req.prismaQueryParams).toEqual({
      where: {
        myParam: {
          contains: 'bilbo',
        },
      },
    });
  });

  it('should be able to add properties with a custom setup function', () => {
    const req = httpMocks.createRequest({
      query: {
        stuff: '97',
      },
    });
    const middleware = urlQueryToPrisma('query', {
      setup: (obj) => {
        obj.someProperty = 'Added in setup function';
      },
    });
    middleware(req, res, next);
    expect(req.prismaQueryParams.someProperty).toBe('Added in setup function');
  });

  it('should be able to clear properties with a custom cleanup function', () => {
    const req = httpMocks.createRequest({
      query: {
        stuff: '97',
      },
    });
    const middleware = urlQueryToPrisma({
      cleanup: (obj) => {
        delete obj.where;
      },
    });
    middleware(req, res, next);
    expect(req.prismaQueryParams).toEqual({});
  });

  it('should be able to take query keys and values from another source, such as body', () => {
    const req = httpMocks.createRequest({
      body: {
        myParam: '97',
        myDate: '2025-12-25',
      },
    });

    const middleware = urlQueryToPrisma('body', {
      myParam: (obj, key, value) => {
        obj.where = {
          ...obj.where,
          myParam: Number(value),
        };
      },
      myDate: (obj, key, value) => {
        obj.where = {
          ...obj.where,
          myDate: new Date(value),
        };
      },
    });

    middleware(req, res, next);
    expect(req.prismaQueryParams).toEqual({
      where: {
        myParam: 97,
        myDate: new Date('2025-12-25'),
      },
    });
  });

  it('should remove the temp property from the final prismaQueryParams object', () => {
    const req = httpMocks.createRequest({
      body: {
        orderBy: 'someColumn',
      },
    });

    const middleware = urlQueryToPrisma('body', {
      orderBy: (obj, key, value) => {
        obj.where = {
          ...obj.where,
          orderBy: value,
        };
        obj.temp = {
          ...obj.temp,
          toBeRemoved: 'temp object should be gone by the end of the formatter',
        };
      },
    });

    middleware(req, res, next);
    expect(req.prismaQueryParams).toEqual({
      where: {
        orderBy: 'someColumn',
      },
    });
  });
});
