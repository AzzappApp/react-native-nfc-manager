# @azzapp/data

This modules handle the connection with the database and expose a graphql schema.
We use [Drizzle](https://github.com/drizzle-team/drizzle-orm) as a query builder.

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

To update the schema of your dev branch : 

You need to set the branch url in .env file
```
mysql://usnermae:passwordj@eu-central.connect.psdb.cloud:3306/azzapp?sslaccept={"rejectUnauthorized":true}
```

To generate a sql migration file based on the schema modifications you made, run:

```
yarn generate-migration
```