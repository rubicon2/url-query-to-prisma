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

describe('defaultFormatter', () => {
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

  it('should set orderBy property value to that of sortOrder if present in url', () => {
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
    const middleware = urlQueryToPrisma({
      author: (obj, key, value) => {
        obj.where = {
          ...obj.where,
          author: value,
        };
      },
    });
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
      orderBy: [{ author: 'desc' }, { publishedDate: 'asc' }],
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
      orderBy: [{ author: 'desc' }, { publishedDate: 'asc' }],
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

  it('should be able to sort by nested object values when given a path separated by dots', () => {
    const req = httpMocks.createRequest({
      ...basicRequest,
      query: {
        orderBy: 'owner.name',
      },
    });
    const middleware = urlQueryToPrisma();
    middleware(req, res, next);
    expect(req.prismaQueryParams).toEqual({
      orderBy: {
        owner: {
          name: 'asc',
        },
      },
    });
  });

  it('should be able to sort by multiple nested object values when given paths separated by dots', () => {
    const req = httpMocks.createRequest({
      ...basicRequest,
      query: {
        orderBy: ['publishedAt', 'owner.name', 'owner.email'],
      },
    });
    const middleware = urlQueryToPrisma();
    middleware(req, res, next);
    expect(req.prismaQueryParams).toEqual({
      orderBy: [
        { publishedAt: 'asc' },
        {
          owner: {
            name: 'asc',
            email: 'asc',
          },
        },
      ],
    });
  });

  it('should be able correctly match orderBy dot paths and sortOrder query params', () => {
    const req = httpMocks.createRequest({
      ...basicRequest,
      query: {
        orderBy: ['publishedAt', 'owner.name'],
        sortOrder: ['asc', 'desc'],
      },
    });
    const middleware = urlQueryToPrisma();
    middleware(req, res, next);
    expect(req.prismaQueryParams).toEqual({
      orderBy: [
        { publishedAt: 'asc' },
        {
          owner: {
            name: 'desc',
          },
        },
      ],
    });
  });

  it('orderBy and sortOrder should use the path separator on the options', () => {
    const req = httpMocks.createRequest({
      ...basicRequest,
      query: {
        orderBy: ['owner/name', 'publishedAt'],
        sortOrder: ['desc', 'asc'],
      },
    });
    const middleware = urlQueryToPrisma({}, { pathSeparator: '/' });
    middleware(req, res, next);
    expect(req.prismaQueryParams).toEqual({
      orderBy: [
        {
          owner: {
            name: 'desc',
          },
        },
        {
          publishedAt: 'asc',
        },
      ],
    });
  });
});
