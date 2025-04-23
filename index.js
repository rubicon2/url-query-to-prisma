function urlQueryToPrisma(req, res, next) {
  req.prismaQueryParams = {};
  return next();
}

module.exports = urlQueryToPrisma;
