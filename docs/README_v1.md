# url-query-to-prisma

Middleware to turn a URL query into an object formatted to match the object shape to filter a Prisma ORM client query.

Suitable for something like a blogs page where you want the user to be able to search for blogs by a particular user, date range or sort them into date order, etc. Generally this is only intended for pretty basic queries encoded in the URL, but you may be able to extend it with custom formatters to fit your needs. How to do so is explained below.

The prisma query object ends up on ```req.prismaQueryParams```. The idea is, when you eventually get to your query you can just put something like:

```js
prismaClient.modelName.find(req.prismaQueryParams)
```

## Install

```bash
npm install url-query-to-prisma
```

## Usage

Here's an example of a custom formatter made with the formatter helper functions and the output it generates. Values of foreign relations can be accessed with dots in the key, e.g. 'blogAuthor.name'. With formatters.where, the url query parameter name must match the table column name you are trying to compare against, although I plan to change this at a later date.

```js
import { urlQueryToPrisma, formatters, processors } from 'urlQueryToPrisma';

const customFormatter = {
  title: formatters.where('contains', { mode: 'insensitive' })
  'author.name': formatters.where('contains', { mode: 'insensitive' })
  fromDate: formatters.groupWhere('author.createdAt', 'gte', processors.date)
  toDate: formatters.groupWhere('author.createdAt', 'lte', processors.date)
}

app.use('/blogs', 
  urlQueryToPrisma('query', customFormatter), 
  async (req, res, next) => {
    const blogs = await prisma.blogs.findMany(req.prismaQueryObj);
    res.send(blogs);
});

// A request with the following url will give this result... 
// /blogs?blogTitle=myBlog&blogAuthor.name=jimbo&authorCreatedFromDate=2020-01-01&authorCreatedToDate=2020-12-31
const result = {
  where: {
    title: 'myBlog',
    author: {
      name: {
        contains: 'jimbo',
        mode: 'insensitive'
      },
      createdAt: {
        gte: '2020-01-01', // Date object representing this date.
        lte: '2020-12-31'  // Date object representing this date.
      }
    }
  }
}
```

An instance of the middleware is created by calling urlQueryToPrisma as a function.

The first parameter defines the query source. So if the query information is on req.query, you should put 'query'. If it is on the req.body, then this should be 'body'. It defaults to 'query'.

You will need to provide a customFormatter as the second parameter, to tell the middleware what query keys you want included on your prisma query, in what format and how the query values should be processed. Any query keys sent by the client which are not defined on the formatter will be ignored. This way, a bad actor will not be able to include different keys to the ones we are expecting.

The customFormatter should be of type object. The middleware will match each query key to a property in the formatter object - which will contain a function - and then use that function to add that query key and value into the prisma query object in the desired format.

The middleware will automatically add standard prisma stuff to the output, like take, skip, and orderBy. But it will not take any other query parameters unless explicitly told to in your custom formatter.

A third parameter of customOptions can be provided for middleware-wide options. Currently the only purpose for this is to change the default pathSeparator (the thing that allows accessing foreign relations values).

```js
urlQueryToPrisma('query', myCustomFormatter, { pathSeparator: '-' });
```

At some point I will move querySource from the first parameter into the customOptions object, as the query source is probably going to be 'query' most of the time.

## Examples

### Mapping query params and values to the prisma query object

```js
import express from 'express';
import { urlQueryToPrisma, formatters } from 'url-query-to-prisma';

// Manually... it's a bit long, but you can alter the query object and process your value in any way you want.
const manualFormatter = {
  name: (obj, key, value, options) => {
    obj.where = {
      ...obj.where,
      name: {
        contains: value,
        mode: 'insensitive'
      }
    }
  },
  age: (obj, key, value, options) => {
    obj.where = {
      ...obj.where,
      age: Number(value)
    }
  }
}

// With the convenient where function, it is a lot cleaner,
// although it has still ended up a bit overcomplicated, I think.
const customFormatter = {
  name: formatters.where('contains', { mode: 'insensitive' }),
  age: formatters.where(null, {}, (value) => Number(value))
}

const app = express();
app.use(urlQueryToPrisma('query', customFormatter));

app.listen(8080, () => console.log('Listening on port 8080'));
```

Given a url of: ```http://localhost:8080?name=jimbo&age=23```, the req.prismaQueryParams will end up in the following format:

```js
req.prismaQueryParams = {
  where: {
    name: {
      contains: 'jimbo',
      mode: 'insensitive'
    },
    age: 23
  }
};
```

### Writing a custom formatter

Every formatter function is called with the prismaQueryParams object, the key (i.e. the name of the query parameter in the URL), and its value, and an options object (the user can add custom options upon instantiating an instance of the urlQueryToPrisma middleware, for example to use different path separators). The prismaQueryParams object is directly modified by each formatter function, to gradually build up the final query object. The spread syntax (...obj.where) is used to stop existing object properties from being deleted.

The default formatters use the pathToQueryObj package to turn a path separated by a special character (by default, a dot) into a nested object, which can be used to access the columns of foreign relations. For example, if a blog has a foreign relation of an owner, you could access any of the owner's values by using 'owner.name', as the key, for instance. You can also use pathToQueryObj in your custom formatters in the same manner.

The special character can be changed from the default '.' by supplying a 'pathSeparator' property on the customOptions object when urlQueryToPrisma is instantiated.

```js
const myCustomFormatter = {
  // myOptions passed from urlQueryToPrisma to this function!
  myUrlParam: (obj, key, value, options) => {
    obj.where ={
      ...obj.where,
      ...pathToNestedObj('owner-name', options.pathSeparator, value)
    }
  }
}

const myOptions = {
  pathSeparator: '-'
}

app.use(urlQueryToPrisma('query', myCustomFormatter, myOptions))
```

```js
import express from 'express';
import { urlQueryToPrisma } from 'url-query-to-prisma';

const customFormatter = {
  // Where author contains value - case-insensitive partial match.
  author: (obj, key, value, options) => {
    obj.where = {
      ...obj.where,
      [key]: {
        contains: value,
        mode: 'insensitive'
      }
    }
  },
  // Where startDate is greater than or equal to value.
  startDate: (obj, key, value, options) => {
    obj.where = {
      ...obj.where,
      startDate: {
        gte: new Date(value)
      }
    }
  },
  // Where endDate is less than or equal to value.
  endDate: (obj, key, value, options) => {
    obj.where = {
      ...obj.where,
      endDate: {
        lte: new Date(value)
      }
    }
  }
};

const app = express();
app.use(urlQueryToPrisma('query', customFormatter));
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
      gte: '2025-01-01' // Date obj representing this date.
    },
    endDate: {
      lte: '2025-02-28' // Date obj representing this date.
    }
  }
};
```

### Using formatter functions to easily create a customFormatter

#### Where

Instead of creating your own functions as in the above example, you can use the where formatter function as below.

```js
import { urlQueryToPrisma, formatters } from 'url-to-prisma-query';

// Blah blah express setup

const customFormatter = {
  author: formatters.where('contains', { mode: 'insensitive' });
  startDate: formatters.where('gte'),
  endDate: formatters.where('lte')
};

app.use(urlQueryToPrisma('query', customFormatter));
```

The where function can take a filterType (i.e. 'contains', 'lte', 'gt', 'not'), an options object and a valueFormatter parameter which is a function that will process the value before adding it into the prismaQueryParams object. For example, turning a string into a date.

If the filterType is null, the query key and value will just be added to the base where object.

```js
formatters.where('lte', {}, (value) => new Date(value));
```

There are also some convenience methods on the processors object that can make this a bit less annoying to type.

```js
const { urlQueryToPrisma, formatters, processors } = require('url-query-to-prisma');

formatters.where('lte', {}, processors.date);
```

#### Group where

There is also a formatter function for grouping input query parameters and combining them into one object property. An example of where this might be useful is combining a fromDate and a toDate to get all database table entries with a publishedAt date between the two.

The groupWhere function can take a groupKey (the name of the whole group, i.e. the name of the db table column you want to match against), a key ('gte', 'lte', etc.) and a valueFormatter function for doing any necessary processing to the value before adding it onto the prismaQueryParams object.

```js
import { urlQueryToPrisma, formatters, processors } from 'url-to-prisma-query';

// Blah blah express setup

// An optional function is given to the groupWhere function to apply any required processing to the
// values assigned to gte and lte. In this case the url query param string will get turned into a date.
const customFormatter = {
  fromDate: formatters.groupWhere('publishedAt', 'gte', processors.date),
  toDate: formatters.groupWhere('publishedAt', 'lte', processors.date)
}

app.use(urlQueryToPrisma('query', customFormatter));

// Resulting object when given a query string of ?fromDate=2025-01-01&toDate=2025-12-31
const prismaQueryParams = {
  publishedAt: {
    gte: '2025-01-01' // Date object representing this date.
    lte: '2025-12-31' // Date object representing this date.
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
}
```

If you want any of these to be excluded, you can do so by putting a null function for that query key on your customFormatter:

```js
app.use(urlQueryToPrisma('query', {
  cursor: null,
}))
```
