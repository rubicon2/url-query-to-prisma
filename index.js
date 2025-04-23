function urlQueryToPrisma(req, res, next) {
  req.prismaQueryParams = {};
  const { query } = req;
  let orderByKey = null;

  for (const key in query) {
    // Everything from the url is a string. If value is a number in string format, parse it ready for prisma.
    let value = isNaN(Number(query[key])) ? query[key] : Number(query[key]);
    switch (key) {
      case 'take': {
        req.prismaQueryParams.take = value;
        break;
      }

      case 'skip': {
        req.prismaQueryParams.skip = value;
        break;
      }

      case 'orderBy': {
        orderByKey = value;
        req.prismaQueryParams.orderBy = {
          [orderByKey]: 'asc',
        };
        break;
      }

      case 'sortOrder': {
        req.prismaQueryParams.orderBy[orderByKey] = value;
        break;
      }

      default: {
        // Assume anything else should be on the 'where' object property, as object properties.
        if (req.prismaQueryParams.where === undefined) {
          req.prismaQueryParams.where = { [key]: value };
        } else {
          req.prismaQueryParams.where[key] = value;
        }
      }
    }
  }

  return next();
}

module.exports = urlQueryToPrisma;
