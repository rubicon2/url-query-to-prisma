const defaultFormatter = require('./defaultFormatter');
const formatters = require('./formatters');
const processors = require('./processors');

function urlQueryToPrisma(customFormatter = {}) {
  // With custom formatter, user can customise how a property is formatted on the prismaQueryParams.
  const formatter = {
    ...defaultFormatter,
    ...customFormatter,
  };

  return (req, res, next) => {
    req.prismaQueryParams = {};
    const { query } = req;

    formatter.setup(req.prismaQueryParams);

    for (const key in query) {
      const value = query[key];
      // If there is a formatter defined for that key, use the function to build a properly formatted object.
      // If there is no formatter defined for that key, then the query param will be ignored.
      if (formatter[key]) {
        formatter[key](req.prismaQueryParams, key, value);
      }
    }

    formatter.cleanup(req.prismaQueryParams);

    return next();
  };
}

module.exports = { urlQueryToPrisma, formatters, processors };
