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
  describe('skip property', () => {
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
  });

  describe('take property', () => {
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
  });

  describe('cursor property', () => {
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
  });

  describe('orderBy property', () => {
    it('should add a orderBy property and value of type array if present in url', () => {
      const req = httpMocks.createRequest({
        ...basicRequest,
        query: {
          orderBy: 'name',
        },
      });
      const middleware = urlQueryToPrisma();
      middleware(req, res, next);
      expect(Array.isArray(req.prismaQueryParams.orderBy)).toBe(true);
      expect(req.prismaQueryParams.orderBy).toEqual([{ name: 'asc' }]);
    });

    it('should be able to use an array of orderBy properties if present in url', () => {
      const req = httpMocks.createRequest({
        ...basicRequest,
        query: {
          orderBy: ['name', 'email'],
        },
      });
      const middleware = urlQueryToPrisma();
      middleware(req, res, next);
      expect(req.prismaQueryParams.orderBy).toEqual([
        { name: 'asc' },
        { email: 'asc' },
      ]);
      expect(typeof req.prismaQueryParams.orderBy).toBe('object');
    });

    it('should be able to sort by nested object value when given a path separated by dots', () => {
      const req = httpMocks.createRequest({
        ...basicRequest,
        query: {
          orderBy: 'owner.name',
        },
      });
      const middleware = urlQueryToPrisma();
      middleware(req, res, next);
      expect(req.prismaQueryParams.orderBy).toEqual([
        {
          owner: {
            name: 'asc',
          },
        },
      ]);
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
      expect(req.prismaQueryParams.orderBy).toEqual([
        { publishedAt: 'asc' },
        {
          owner: {
            name: 'asc',
            email: 'asc',
          },
        },
      ]);
    });
  });

  describe('orderBy and sortOrder properties together', () => {
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
      expect(req.prismaQueryParams.orderBy).toEqual([{ name: 'desc' }]);
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
      expect(req.prismaQueryParams.orderBy).toEqual([
        { author: 'desc' },
        { publishedDate: 'asc' },
      ]);
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
      expect(req.prismaQueryParams.orderBy).toEqual([
        { author: 'desc' },
        { publishedDate: 'asc' },
      ]);
    });

    it('should not break if there are less orderBy params than sortOrder params', () => {
      const req = httpMocks.createRequest({
        ...basicRequest,
        query: {
          orderBy: 'author',
          sortOrder: ['desc', 'desc'],
        },
      });
      const middleware = urlQueryToPrisma();
      middleware(req, res, next);
      expect(req.prismaQueryParams.orderBy).toEqual([
        {
          author: 'desc',
        },
      ]);
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

    it.each([
      {
        query: {
          orderBy: ['publishedAt', 'owner.name'],
          sortOrder: ['asc', 'desc'],
        },
        result: [
          { publishedAt: 'asc' },
          {
            owner: {
              name: 'desc',
            },
          },
        ],
      },
      {
        query: {
          orderBy: ['publishedAt', 'owner.name', 'owner.email'],
          sortOrder: ['desc', 'asc', 'desc'],
        },
        result: [
          { publishedAt: 'desc' },
          {
            owner: {
              name: 'asc',
              email: 'desc',
            },
          },
        ],
      },
    ])(
      'should be able to correctly match orderBy dot paths and sortOrder query params',
      ({ query, result }) => {
        const req = httpMocks.createRequest({
          ...basicRequest,
          query,
        });
        const middleware = urlQueryToPrisma();
        middleware(req, res, next);
        expect(req.prismaQueryParams.orderBy).toEqual(result);
      },
    );

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
      expect(req.prismaQueryParams.orderBy).toEqual([
        {
          owner: {
            name: 'desc',
          },
        },
        {
          publishedAt: 'asc',
        },
      ]);
    });

    it.each([
      {
        query: {
          orderBy: 'publishedDate',
          sortOrder: 'desc',
        },
        result: [
          {
            publishedDate: 'desc',
          },
        ],
      },
      {
        query: {
          sortOrder: 'desc',
          orderBy: 'publishedDate',
        },
        result: [
          {
            publishedDate: 'desc',
          },
        ],
      },
    ])(
      'should work no matter what order the functions run in',
      ({ query, result }) => {
        const req = httpMocks.createRequest({
          ...basicRequest,
          query,
        });
        const middleware = urlQueryToPrisma({}, { pathSeparator: '.' });
        middleware(req, res, next);
        expect(req.prismaQueryParams.orderBy).toEqual(result);
      },
    );
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
      orderBy: [
        {
          publishedDate: 'desc',
        },
      ],
      where: {
        author: 'billy',
      },
    });
  });
});
