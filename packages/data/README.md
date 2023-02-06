# @azzapp/data

This modules handle the connection with the database and expose a graphql schema.
We use [Prisma](https://www.prisma.io/) only for the sake of database schema management
and [Kysely](https://github.com/koskimas/kysely) as a query builder.
In the future we might entierly migrate to prisma if this [issue](https://github.com/prisma/prisma/issues/15265) is resolved.

If you need to work with the database schema, first install the [Planet scale CLI](https://planetscale.com/features/cli) : 
```
brew install planetscale/tap/pscale
```

Then connect to your Planetscale dev branch : 
```
pscale connect azzapp [my-dev-branch] --port 3309
```

Finaly create a .env file in this package source with the database url : 
```env
DATABASE_URL= 'mysql://root@127.0.0.1:3309/azzapp'
```

To update the schema of your dev branch use the following command : 

You need to set the branch url in .env file
```
mysql://usnermae:passwordj@eu-central.connect.psdb.cloud:3306/azzapp?sslaccept=strict
```

```
yarn prisma db push 
```

To regenerate the clients types use the following command: 

```
yarn prisma db push 
```