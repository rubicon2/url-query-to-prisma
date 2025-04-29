# url-query-to-prisma

Middleware to turn a URL query into an object formatted to match the requirements to filter a Prisma ORM client query.

Suitable for something like a blogs page where you want the user to be able to search for blogs by a particular user, date range or sort them into date order, etc. Generally this is only intended for pretty basic queries encoded in the URL, but you may be able to extend it with custom formatters to fit your needs. How to do so is explained below.

The prisma query object ends up on ```req.prismaQueryParams```. The idea is, when you eventually get to your query you can just put something like:

```js
prismaClient.modelName.find(req.prismaQueryParams)
```

Or if you want to programmatically define certain options in your route and take others from the URL (e.g. something as simple as orderBy, or a date range):

```js
prismaClient.modelName.find({
  ...req.prismaQueryParams,
  where: {
    ownerId: req.params.ownerId
  }
})
```

## Install

```bash
npm install url-query-to-prisma
```

## Usage

An instance of the middleware is created by calling urlQueryToPrisma as a function. How each instance behaves can be customized by providing a customFormatter parameter. It should be of type object, and the middleware will match each query parameter to a property in the formatter object - which will contain a function - and then use that function to add that query parameter and value into the prisma query object in the desired format.

All params that can be automatically cast into numbers are, to save having to convert it later during the query.

## Examples

### Using the default formatter

```js
import express from 'express';
import { urlQueryToPrisma } from 'url-query-to-prisma';

const app = express();
app.use(urlQueryToPrisma());

app.listen(8080, () => console.log('Listening on port 8080'));
```

Given a url of: ```http://localhost:8080?name=jimbo&age=23```, the req.prismaQueryParams will end up in the following format:

```js
req.prismaQueryParams = {
  where: {
    name: 'jimbo',
    age: 23
  }
};
```

### Writing a custom formatter

Every formatter function is called with the prismaQueryParams object, the key (i.e. the name of the query parameter in the URL), and its value. The prismaQueryParams object is directly modified by each formatter function, to gradually build up the final query object. The spread syntax (...obj.where) is used to stop existing object properties from being deleted.

```js
import express from 'express';
import { urlQueryToPrisma } from 'url-query-to-prisma';

const customFormatter = {
  // Where author contains value - case-insensitive partial match.
  author: (obj, key, value) => {
    obj.where = {
      ...obj.where,
      [key]: {
        contains: value,
        mode: 'insensitive'
      }
    }
  },
  // Where startDate is greater than or equal to value.
  startDate: (obj, key, value) => {
    obj.where = {
      ...obj.where,
      [key]: {
        gte: value
      }
    }
  },
  // Where endDate is less than or equal to value.
  endDate: (obj, key, value) => {
    obj.where = {
      ...obj.where,
      [key]: {
        lte: value
      }
    }
  }
};

const app = express();
app.use(urlQueryToPrisma(customFormatter));
app.listen(8080, () => console.log('Listening on port 8080'));
```

Given a url of: ```http://localhost:8080?author=billy&startDate=2025-01-01&endDate=2025-02-28```, the req.prismaQueryParams will end up in the following format:

```js
req.prismaQueryParams = {
  where: {
    author: {
      contains: 'billy'
    }
    startDate: {
      gte: '2025-01-01'
    },
    endDate: {
      lte: '2025-02-28'
    }
  }
};
```

### Using formatter functions to easily customise formatters

Instead of creating your own functions as in the above example, you can use the where formatter function as below.

```js
import { urlQueryToPrisma, formatters } from 'url-to-prisma-query';

// Blah blah express setup

const customFormatter = {
  author: formatters.where('contains', { mode: 'insensitive' });
  startDate: formatters.where('gte'),
  endDate: formatters.where('lte')
};

app.use(urlQueryToPrisma(customFormatter));
```

There is also a formatter function for grouping input query parameters and combining them into one object property. An example of where this might be useful is combining a fromDate and a toDate to get all database table entries with a publishedAt date between the two.

```js
import { urlQueryToPrisma, formatters } from 'url-to-prisma-query';

// Blah blah express setup

// An optional function is given to the groupWhere function to apply any required processing to the
// values assigned to gte and lte. In this case the url query param string will get turned into a date.
const customFormatter = {
  fromDate: formatters.groupWhere('publishedAt', 'gte', (value) => new Date(value)),
  toDate: formatters.groupWhere('publishedAt', 'lte', (value) => new Date(value))
}

app.use(urlQueryToPrisma(customFormatter));

// Resulting object when given a query string of ?fromDate=2025-01-01&toDate=2025-12-31
const prismaQueryParams = {
  publishedAt: {
    gte: // Date object containing fromDate.
    lte: // Date object containing toDate.
  }
}
```

## Default behaviour

Using all the included supported query parameters will result in an object in the following format (with example values):

```js
const prismaQueryParams = {
  skip: 5,
  take: 5,
  cursor: 5,
  // Can have multiple orderBy and sortOrder query parameters. 
  orderBy: {
    // 'asc' is default, but sortOrder can be a parameter to choose between 'asc' or 'desc'.
    author: 'asc',
    publishedDate: 'desc'
  }
  where: {
    // Query params with any other name go in here.
  }
}
```
