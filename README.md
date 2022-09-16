# Azzapp

This is the main repository of the Azzapp application source code.

## Development environment

Developping and building the project requires **MacOS version 12+**.
In addition developpers should install the followings dependencies: 
- [NodeJS](https://nodejs.org/en/) version **16** (recommanded install through [nvm](https://github.com/nvm-sh/nvm))
- [yarn](https://yarnpkg.com/) 
- [XCode](https://apps.apple.com/fr/app/xcode/id497799835?mt=12) version **13+**
- [Android Studio](https://developer.android.com/studio)
- [watchman](https://facebook.github.io/watchman/) 
- [ruby](https://www.ruby-lang.org/fr/) version **2.7.6**(recommanded install throguh **brew**)
- [bundler](https://bundler.io/) (should come along ruby)

In addition one should follow the react-native-cli setup instruction of the [React Native documentation](https://reactnative.dev/docs/0.69/getting-started).

The sources of this project should be edited through [Visual Studio Code](https://code.visualstudio.com/). A recommanded extensions list has been commited in the sources and should be prompted for instalation the first time the project is open in the code editor.

## Instalation and development

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

The differents packages of the application are located under the `packages` directory : 
- [app](./packages/app/): contains the source code of the client React Native application.
- [backoffice](./packages/backoffice/): contains the source code of the backoffice of the application.
- [data](./packages/data/): contains the source code of the GraphQL API layer of the application.
- [relay](./packages/relay/): this is a special package that is meant to contains the relay-compiler generated artifacts.
- [shared](./packages/shared/): contains helpers shared by all the packages of the application
- [web](./packages/web/): a NextJS project responsible of the web version of the application and the API

## Main technologies

The sources code of the application is mainly written using [TypeScript](https://www.typescriptlang.org/).

### Database
 
The main database used by this project is [Scylladb](https://www.scylladb.com/) with an [Apache Cassandra](https://cassandra.apache.org/_/index.html) compatible API. The database infrastructure is based on [Scylla cloud](https://www.scylladb.com/product/scylla-cloud/).

In the future the application should use [ElasticSearch](https://www.elastic.co/fr/elasticsearch/) for search request in the application, and mighht use [JanusGraph](https://janusgraph.org/) or [Neo4j](https://neo4j.com/) for recommandations.

### Web server

The web server is based on [NextJS](https://nextjs.org/) and is meant to be deployed on [Vercel](https://vercel.com/).

The application use a [GraphQL](https://graphql.org/) API to communicate between the clients and the server.

### Client 

- [React](https://reactjs.org/) Main client framework 
- [React Native](https://reactnative.dev/) main mobile application framework
- [ReactRelay](https://relay.dev/) client data layer
- [React Native Web](https://necolas.github.io/react-native-web/) used to render react native components on the web application


### Code Quality
- [Jest](https://jestjs.io/fr/): Test framework
- [React testing library](https://testing-library.com/docs/react-testing-library/intro/) : UI testing framework
- [ESlint](https://eslint.org/): linter
- [Prettier](https://prettier.io/): code formatting

### Miscellaneous

- The authentification process of the mobile applications is based on [JWT](https://jwt.io/) tokens 
- The authentification process of the web application is based on [Iron session](https://github.com/vvo/iron-session)
- [Microsoft App Center](https://appcenter.ms/) is used of Code Push, crash reporting and distribution of staging and development version of the application
- On IOS the main image component is based on [Nuke](https://github.com/kean/Nuke)


## CI/CD

The application is build using [Github Actions](https://github.com/features/actions) and [FastLane](https://fastlane.tools/).
A [match](https://docs.fastlane.tools/actions/match/) repository is used to synchronize the application certificate.

List of environement variables during the build process: 

- `FASTLANE_APPSTORE_API_KEY`: a base 64 encoded of a [Faslane JSON API Key](https://docs.fastlane.tools/app-store-connect-api/)
- `FASTLANE_GIT_BASIC_AUTH`: [Git basic auth](https://docs.fastlane.tools/actions/match/#git-storage-on-github) used by fastlane match
- `FASTLANE_MATCH_PASSWORD`:  password of the fastlane match repository
- `VERCEL_TOKEN`: vercel api token
- `APPCENTER_DEV_IOS_API_TOKEN`: the api token of the ios dev appcenter app
- `APPCENTER_DEV_IOS_APP_NAME`: the name the ios dev appcenter app
- `APPCENTER_DEV_IOS_APP_SECRET`: the app secret the ios dev appcenter app
- `APPCENTER_STAGING_IOS_API_TOKEN`: the api token of the ios staging appcenter app
- `APPCENTER_STAGING_IOS_APP_NAME`: the name of the ios staging appcenter app 
- `APPCENTER_STAGING_IOS_APP_SECRET`: the app secret of the ios staging appcenter app

List of environement variables used at runtime by the application server:

- `DB_CONTACT_POINT`: comma separated list of contact point for scylladb connection
- `DB_DATACENTER`: scylladb datacenter name
- `DB_USERNAME`: scylladb user name
- `DB_PASSWORD`: scylladb password
- `DB_KEYSPACE`: scylladb keyspace
- `CLOUDINARY_API_SECRET`: cloudinary api secret
- `SECRET_COOKIE_PASSWORD`: password used to encrypt web cookie
- `TOKEN_SECRET`: password used to encrypt jwt tokens
- `REFRESH_TOKEN_SECRET`: password used to encrypt jwt refresh tokens


List of environement variables used at runtime by the application clients:

- `NEXT_PUBLIC_API_ENDPOINT`: the endpoint of api (generated at build time for mobile clients, set to `/api` for web client)
- `NEXT_PUBLIC_CLOUDINARY_API_KEY`: the cloudinary api key 
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`: the cloudinary cloud name

## Resources

- The design / graphic prototype of the application can be found on  the[figma shared project](https://www.figma.com/files/project/59265907/MOBILE-APPLICATION).
- Application speficiation can be found on the [google cloud shared folder](https://drive.google.com/drive/folders/1qXYQMdEyw1u5Etui4tIvRpnI40y172dt)