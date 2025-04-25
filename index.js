const defaultFormatter = require('./defaultFormatter');
const formatters = require('./formatters');

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
      // Turn value into number if possible.
      let value = isNaN(Number(query[key])) ? query[key] : Number(query[key]);
      // If there is a formatter defined for that key, use the function to build a properly formatted object.
      if (formatter[key]) {
        formatter[key](req.prismaQueryParams, key, value);
      } else {
        // Assume anything else should be on the 'where' object property, as object properties.
        formatter.where(req.prismaQueryParams, key, value);
      }
    }

    formatter.cleanup(req.prismaQueryParams);

    return next();
  };
}

module.exports = { urlQueryToPrisma, formatters };
