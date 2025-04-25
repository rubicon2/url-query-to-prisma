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

  it('should add a skip property and value of type Number if present in url', () => {
    const req = httpMocks.createRequest({
      ...basicRequest,
      query: {
        skip: '5',
      },
    });
    const middleware = urlQueryToPrisma();
    middleware(req, res, next);
    expect(req.prismaQueryParams.skip).toBe(5);
    expect(typeof req.prismaQueryParams.skip).toBe('number');
  });

  it('should add a take property and value of type Number if present in url', () => {
    const req = httpMocks.createRequest({
      ...basicRequest,
      query: {
        take: '3',
      },
    });
    const middleware = urlQueryToPrisma();
    middleware(req, res, next);
    expect(req.prismaQueryParams.take).toBe(3);
    expect(typeof req.prismaQueryParams.take).toBe('number');
  });

  it('should add a cursor property which is of type object which contains property id', () => {
    const req = httpMocks.createRequest({
      ...basicRequest,
      query: {
        cursor: '97',
      },
    });
    const middleware = urlQueryToPrisma();
    middleware(req, res, next);
    expect(req.prismaQueryParams.cursor).toEqual({
      id: 97,
    });
  });

  it('should add a orderBy property and value of type object if present in url', () => {
    const req = httpMocks.createRequest({
      ...basicRequest,
      query: {
        orderBy: 'name',
      },
    });
    const middleware = urlQueryToPrisma();
    middleware(req, res, next);
    expect(req.prismaQueryParams.orderBy).toEqual({ name: 'asc' });
    expect(typeof req.prismaQueryParams.orderBy).toBe('object');
  });

  it('should set orderBy[fieldName] property value to that of sortOrder if present in url', () => {
    const req = httpMocks.createRequest({
      ...basicRequest,
      query: {
        orderBy: 'name',
        sortOrder: 'desc',
      },
    });
    const middleware = urlQueryToPrisma();
    middleware(req, res, next);
    expect(req.prismaQueryParams.orderBy).toEqual({ name: 'desc' });
  });

  it('should include any other fields on the where object', () => {
    const req = httpMocks.createRequest({
      ...basicRequest,
      query: {
        name: 'billy',
        email: 'billy@billyzone.com',
      },
    });
    const middleware = urlQueryToPrisma();
    middleware(req, res, next);
    expect(req.prismaQueryParams.where).toEqual({
      name: 'billy',
      email: 'billy@billyzone.com',
    });
  });

  it('should convert any numbers in the query string into actual numbers on the where object', () => {
    const req = httpMocks.createRequest({
      ...basicRequest,
      query: {
        age: '32',
        mentalAge: '17',
      },
    });
    const middleware = urlQueryToPrisma();
    middleware(req, res, next);
    expect(req.prismaQueryParams.where).toEqual({
      age: 32,
      mentalAge: 17,
    });
  });

  it('should produce a coherent query object with take, skip, orderBy and where objects in a prisma-friendly format', () => {
    const req = httpMocks.createRequest({
      ...basicRequest,
      query: {
        skip: '5',
        take: '10',
        orderBy: 'publishedDate',
        sortOrder: 'desc',
        author: 'billy',
      },
    });
    const middleware = urlQueryToPrisma();
    middleware(req, res, next);
    expect(req.prismaQueryParams).toEqual({
      skip: 5,
      take: 10,
      orderBy: {
        publishedDate: 'desc',
      },
      where: {
        author: 'billy',
      },
    });
  });

  it('should work with multiple orderBy and sortOrder params', () => {
    const req = httpMocks.createRequest({
      ...basicRequest,
      query: {
        orderBy: ['author', 'publishedDate'],
        sortOrder: ['desc', 'asc'],
      },
    });
    const middleware = urlQueryToPrisma();
    middleware(req, res, next);
    expect(req.prismaQueryParams).toEqual({
      orderBy: {
        author: 'desc',
        publishedDate: 'asc',
      },
    });
  });

  it('should not break if there are more orderBy params than sortOrder params', () => {
    const req = httpMocks.createRequest({
      ...basicRequest,
      query: {
        orderBy: ['author', 'publishedDate'],
        sortOrder: 'desc',
      },
    });
    const middleware = urlQueryToPrisma();
    middleware(req, res, next);
    expect(req.prismaQueryParams).toEqual({
      orderBy: {
        author: 'desc',
        publishedDate: 'asc',
      },
    });
  });

  it('should not break if there are less orderBy params than sortOrder params', () => {
    const req = httpMocks.createRequest({
      ...basicRequest,
      query: {
        orderBy: ['author'],
        sortOrder: ['desc', 'desc'],
      },
    });
    const middleware = urlQueryToPrisma();
    middleware(req, res, next);
    expect(req.prismaQueryParams).toEqual({
      orderBy: {
        author: 'desc',
      },
    });
  });

  it('should not break if there is a sortOrder param with no orderBy params', () => {
    const req = httpMocks.createRequest({
      ...basicRequest,
      query: {
        sortOrder: 'desc',
      },
    });
    const middleware = urlQueryToPrisma();
    middleware(req, res, next);
    expect(req.prismaQueryParams).toEqual({});
  });

  it('should not break if there is a sortOrder params array with no orderBy params', () => {
    const req = httpMocks.createRequest({
      ...basicRequest,
      query: {
        sortOrder: ['desc', 'desc'],
      },
    });
    const middleware = urlQueryToPrisma();
    middleware(req, res, next);
    expect(req.prismaQueryParams).toEqual({});
  });

  it('should be able to add custom formatting to entries on the where property', () => {
    const req = httpMocks.createRequest({
      ...basicRequest,
      query: {
        firstParam: 'jimbo',
        myParam: 'bilbo',
      },
    });
    const middleware = urlQueryToPrisma({
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
        firstParam: 'jimbo',
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
    const middleware = urlQueryToPrisma({
      setup: (obj) => {
        obj.temp = 'Added in setup function';
      },
    });
    middleware(req, res, next);
    expect(req.prismaQueryParams.temp).toBe('Added in setup function');
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
});
