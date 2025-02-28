# Azzapp

This is the main repository of the *Azzapp* application source code.

## Development environment

Developing and building the project requires **MacOS version 15+**.
In addition developers should install the followings dependencies:

- [Node.js](https://nodejs.org/en/) version **20** (recommended install through [nvm](https://github.com/nvm-sh/nvm))
- [yarn](https://yarnpkg.com/) v4 (embedded)
- [XCode](https://apps.apple.com/fr/app/xcode/id497799835?mt=12) version **16+**
- [Android Studio](https://developer.android.com/studio)
- [watchman](https://facebook.github.io/watchman/)
- [ruby](https://www.ruby-lang.org/fr/) version **2.7.6** (recommended install through **brew**)
- [bundler](https://bundler.io/) (should come along **ruby**)

In addition one should follow the *react-native-cli* setup instruction of the [React Native documentation](https://reactnative.dev/docs/0.69/getting-started).

The sources of this project should be edited through [Visual Studio Code](https://code.visualstudio.com/). A recommended extensions list has been committed in the sources and should be prompted for installation the first time the project is open in the code editor.

## Installation and development

To build with `xcode`, one should first create a `.xcode.env.local` file under `packages/app/ios` with a path to `node` :

```
export NODE_BINARY=<PATH_TO_YOUR_NODE_BIN>
```
The path to your node binary can be obtained with the command : 

```sh
which node
```

### Dependencies

JavaScript dependencies of the project are installed using `yarn`.
Use the following command at the sources root directory :

```sh
yarn install
```

The ruby dependencies used by the react native application are installed using `bundle`.
Use the following command in the `packages/app` directory of the sources :

```sh
bundle install
```

The cocoa pod native dependencies of the react native application are installed using `pod`.
Use the following command in the `packages/app` directory of the sources :

```sh
yarn pod-install
```

### Development Scripts

> All the development / build related scripts should be launched using `yarn`.

Before you can start developing, you should build the whole workspace once : 

```
yarn build
```

To launch the application server and react native bundler in dev mode use the `dev` script at the top level sources directory.

```sh
yarn dev
```

To run the react native application on ios use the `run:ios` script :

```sh
yarn run:ios
```

To run the react native application on android use the `run:android` script :

```sh
yarn run:android
```

Once you've modified the GraphQL API you should update the GraphQL schema of the application using the `update-graphql-schema` script :

```sh
yarn update-graphql-schema
```

To lint the application source code use the `lint` script

```sh
yarn lint
```

To launch the application source code test use the `test` script

```sh
yarn test
```
## Sources structure

The sources of the project are organized as a monorepo. Dependencies are managed through the `yarn` [workspaces](https://classic.yarnpkg.com/lang/en/docs/workspaces/) feature.

The different packages of the application are located under the `packages` directory :

- [app](./packages/app/): contains the source code of the client React Native application.
- [backoffice](./packages/backoffice/): contains the source code of the backoffice of the application.
- [data](./packages/data/): contains the source code of the data access layer of the application.
- [schema](./packages/schema/): contains the source code of the GraphQL API layer of the application.
- [i18n](./packages/i18n/): contains the translation files and related definitions.
- [shared](./packages/shared/): contains helpers shared by all the packages of the application
- [web](./packages/web/): a NextJS project responsible of the web version of the application and the API
- [payment](./packages/payment/): contains the source code for web subscription.

## Main technologies

The sources code of the application is mainly written using [TypeScript](https://www.typescriptlang.org/).

### Database

The main database used by this project is [PlanetScale](https://planetscale.com/) a MySQL-compatible serverless database platform. 

In the future the application should use [ElasticSearch](https://www.elastic.co/fr/elasticsearch/) for search request in the application, and might use [JanusGraph](https://janusgraph.org/) or [Neo4j](https://neo4j.com/) for recommendations.

### Web server

The web server is based on [NextJS](https://nextjs.org/) and is meant to be deployed on [Vercel](https://vercel.com/).

The application use a [GraphQL](https://graphql.org/) API to communicate between the clients and the server.

### Client

- [React](https://reactjs.org/) Main client framework
- [React Native](https://reactnative.dev/) main mobile application framework
- [ReactRelay](https://relay.dev/) client data layer

### Code Quality

- [Jest](https://jestjs.io/fr/): Test framework
- [React testing library](https://testing-library.com/docs/react-testing-library/intro/) : UI testing framework
- [ESlint](https://eslint.org/): linter
- [Prettier](https://prettier.io/): code formatting

### Miscellaneous

- The authentication process of the mobile applications is based on tokens
- On IOS the main image component is based on [Nuke](https://github.com/kean/Nuke)

## CI/CD

- The workspace build system is based on [Turbo Repo](https://turbo.build/)
- The CI/CD Process is based on [Github Actions](https://github.com/features/actions)

### List of environment variables during the build process:

- `VERCEL_TOKEN`: vercel api token

Valid environments are `DEV`, `STAGING` and `PRODUCTION` (the later is omitted in env variable name).
Valid platforms are  `IOS` and `ANDROID`. 

### List of environment variables used at runtime by the application server:

- `DATABASE_HOST`: Host of the _planetscale_ database
- `DATABASE_USERNAME`: Username of the _planetscale_ database
- `DATABASE_PASSWORD`: Password of the _planetscale_ database 
- `CLOUDINARY_API_SECRET`: _cloudinary_ api secret
- `CLOUDINARY_API_KEY`: the _cloudinary_ api key 
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`:  the _cloudinary_ cloud name (also used by web application client)
- `SECRET_COOKIE_PASSWORD`: password used to encrypt web cookie
- `TOKEN_SECRET`: password used to encrypt jwt tokens
- `REFRESH_TOKEN_SECRET`: password used to encrypt jwt refresh tokens

### List of environment variables used at runtime by the application clients:

- `NEXT_PUBLIC_API_ENDPOINT`: the endpoint of api (generated at build time for mobile clients, set to `/api` for web client)
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`: the _cloudinary_ cloud name (only used on WEB)

## Resources

- The design / graphic prototype of the application can be found on the [figma shared project](https://www.figma.com/files/project/59265907/MOBILE-APPLICATION).
- Application specification can be found on the [google cloud shared folder](https://drive.google.com/drive/folders/1qXYQMdEyw1u5Etui4tIvRpnI40y172dt)
