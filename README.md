# url-query-to-prisma

Express middleware to turn a URL query/body into an object formatted to match the object shape to filter a Prisma ORM client query.

Suitable for something like a blogs page where you want the user to be able to search for blogs by a particular user, date range or sort them into date order, etc.

The prisma query object ends up on ```req.prismaQueryParams```. The idea is, when you eventually get to your query you can just put something like:

```js
prismaClient.modelName.find(req.prismaQueryParams)
```

## Install

```bash
npm install url-query-to-prisma
```

## Usage

Here's an example of a custom formatter made with the formatter helper functions and the output it generates. By default, values of foreign relations can be accessed with dots in the key, e.g. 'blogAuthor.name'.

```js
import express from 'express';
import { PrismaClient } from '../generated/prisma/client.js';
import { urlQueryToPrisma, formatters, processors } from 'urlQueryToPrisma';

const app = express();
const prisma = new PrismaClient();

const customFormatter = {
  title: formatters.where({ filterType: 'contains', filterOptions: { mode: 'insensitive' } }),
  author: formatters.where({ filterType: 'contains', filterOptions: { mode: 'insensitive' }, formatterOptions: { tableColName: 'owner.name' } }),
  fromDate: formatters.where({ 
    filterType: 'gte', 
    valueProcessor: processors.date, 
    formatterOptions: { tableColName: 'publishedAt' }
  }),
  toDate: formatters.where({ 
    filterType: 'lte', 
    valueProcessor: processors.date, 
    formatterOptions: { tableColName: 'publishedAt' }
  }),
}

app.use(
  '/blogs', 
  urlQueryToPrisma(customFormatter), 
  async (req, res, next) => {
    try {
      const blogs = await prisma.blog.findMany(req.prismaQueryParams);
      res.send(blogs);
    } catch (error) {
      next(error);
    }
});

// A request with the following url will give this result... 
// /blogs?title=myBlog&author=jimbo&fromDate=2020-01-01&toDate=2020-12-31
const result = {
  where: {
    title: {
      contains: 'myBlog',
      mode: 'insensitive'
    },
    owner: {
      name: {
        contains: 'jimbo',
        mode: 'insensitive'
      },
    },
    publishedAt: {
      gte: '2020-01-01', // Date object representing this date.
      lte: '2020-12-31'  // Date object representing this date.
    }
  }
}
```

An instance of the middleware is created by calling urlQueryToPrisma as a function. It takes a customFormatter parameter and a customOptions parameter.

## Custom Formatters

The custom formatter is an object that tells the middleware what to do with each parameter in the url query. Each object key in the custom formatter relates to the respective url query parameter, and its corresponding value should be a function that takes four parameters: the query object, query key, value, and an options object. As the middleware runs through each formatter it will directly modify the properties on the query object, building it up into its final form.

By default, the middleware will take the following url parameters and turn them into a prismaQueryParams object:

- skip
- take
- cursor
- orderBy
- sortOrder

If you want to change any of these behaviours, you can define your own in your custom formatter which will overwrite the defaults. If you want one of the default parameters to be ignored, assign null to it instead of a function.

```js
const customFormatter = {
  cursor: null
}

urlQueryToPrisma(customFormatter);
```

## Custom Options

The custom options parameter is an optional parameter of type object. This object is passed to all formatter functions, so if you have some option you want to set once and use in multiple formatters, this is the place to do it. The middleware and defaultFormatter use the following properties:

|Property|Purpose|
|-|-|
|querySource|Defaults to 'query'. This is where the middleware will look for the url query. You can change this to access any property on the req object, e.g. 'body' after a form has been submitted.|
|pathSeparator|Defaults to '.' but can be changed to anything you want. This character is used to structure the prismaQueryParams object to allow access to fields of foreign relations.|

## Formatters.where

Each formatter can be written manually but generally it is easier to use the provided where formatter, as in the above example. It takes a single parameter of type object: customOptions. Here is an explanation of the different properties that can be set on the customOptions object.

|Property|Purpose|
|-|-|
|filterType|Defaults to null. A string that determines a specific prisma where filter type, e.g. 'includes', 'lte', etc.|
|filterOptions|Defaults to an empty object. This is an object that is added onto the where filter. Useful to include { mode: 'insensitive' } on the filter, which is required to run case-insensitive string queries on PostgreSQL and MongoDB databases.|
|valueProcessor|Defaults to a function that returns the query value in its raw form. A function that takes a value parameter and should return a value. This is for applying any processing on the value we are going to match against the database. Since a http url query or body always has string values, this is useful for turning the string into a number or a date. Import processors as shown in the usage section to get some convenient functions to do this (since typing these functions over and over gets boring).|
|formatterOptions|Defaults to an object with a querySource of 'query' and a pathSeparator of '.'. Currently this is just to set a tableColName. By default, the where formatter will create a prismaQueryParams object which will match against a table column that has the same name as the url query parameter. By setting tableColumnName on the formatterOptions, you can match a url query parameter against a differently named table column. This is also necessary to group multiple url query parameters on a filter for a single table column.|

## Processors

These are tiny functions for turning the url query parameter values from their default strings into other kinds of data. Added purely for convenience since writing stuff like ```(value) => new Date(value)``` for various formatters gets old quickly.

## Writing a custom formatter

If you want to write your own formatter for a query parameter without using formatters.where(), the function should look something like this:

```js
const myFormatter = {
  myQueryParam: (obj, key, value, options) => {
    obj.where = {
      ...obj.where,
      [key]: value,
    };
  },
};
```

This is a simple function that just adds the key value pair onto the where object. However, formatters.where() uses the deepMerge package to allow for cumulative queries like in the usage example, where two different url query parameters were mapped to 'lte' and 'gte' filters on one table column. It also uses the pathToNestedObj package to allow accessing the values of foreign relations.

At the start of processing, an empty temp object on the prismaQueryParams object can be used if information needs to be stored from one formatting function to another, as is the case with the defaultFormatter formatters for orderBy and sortOrder. The temp object gets deleted at the end of the middleware function.

## Previous versions

Docs for v1 are in docs/README_v1.md.
