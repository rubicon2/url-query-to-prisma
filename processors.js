// Processors are used to do simple stuff like turn a query value into a number, or a date.
// Just convenience functions to save having to write (value) => new Date(value) and stuff
// like that, over and over again when creating a custom formatter.
function date(str) {
  return new Date(str);
}

function number(str) {
  return Number(str);
}

module.exports = { date, number };
