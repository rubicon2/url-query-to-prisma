const urlQueryToPrisma = require('./index.js');
const httpMocks = require('node-mocks-http');

const basicRequest = {
  method: 'GET',
  url: 'http://test.com/blogs/97',
  params: {
    id: '97',
  },
};

describe('urlQueryToPrisma', () => {
  it('should call next once the middleware is complete', () => {
    const req = httpMocks.createRequest(basicRequest);
    const res = httpMocks.createResponse();
    const next = jest.fn();

    urlQueryToPrisma(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should add an empty object if there is no url query', () => {
    const req = httpMocks.createRequest(basicRequest);
    const res = httpMocks.createResponse();
    const next = jest.fn();

    urlQueryToPrisma(req, res, next);
    expect(req.prismaQueryParams).toEqual({});
  });

  it('should add a skip property and value of type Number if present in url', () => {
    const req = httpMocks.createRequest({
      ...basicRequest,
      query: {
        skip: '5',
      },
    });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    urlQueryToPrisma(req, res, next);
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
    const res = httpMocks.createResponse();
    const next = jest.fn();

    urlQueryToPrisma(req, res, next);
    expect(req.prismaQueryParams.take).toBe(3);
    expect(typeof req.prismaQueryParams.take).toBe('number');
  });

  it('should add a orderBy property and value of type object if present in url', () => {
    const req = httpMocks.createRequest({
      ...basicRequest,
      query: {
        orderBy: 'name',
      },
    });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    urlQueryToPrisma(req, res, next);
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
    const res = httpMocks.createResponse();
    const next = jest.fn();

    urlQueryToPrisma(req, res, next);
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
    const res = httpMocks.createResponse();
    const next = jest.fn();

    urlQueryToPrisma(req, res, next);
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
    const res = httpMocks.createResponse();
    const next = jest.fn();

    urlQueryToPrisma(req, res, next);
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
    const res = httpMocks.createResponse();
    const next = jest.fn();

    urlQueryToPrisma(req, res, next);
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
});
