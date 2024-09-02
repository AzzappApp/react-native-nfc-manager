# @azzapp/app

Source code of the client React Native application.

# Code structure

The app package is a React Native applications, so it retains the same directory structure thatn every RN application.

- `android` contains Android native source code
- `ios` contains the IOS native source code

On top of that the `scripts` directory contains scripts used for testing or building, etc... the `fastlane` directory contains [Fastlane](https://fastlane.tools/) configurations used to build the application.

Finally the `lib` folder contains the TypeScript source code shared by all platforms. 

The typescript source code has the following directory structure : 
- `ui`: contains React components that implements **ui building block**, like buttons tab bars, etc... thoses components does not contains any application related logic (no relay, routings, api call, etc...)
- `components`: contains React components **reused** by different screens of the application, contrary to components in `ui` those components may contains application related logic
- `helpers`: contains helpers functions that are **only used in the clients** source code (otherwise they should be placed in the `@azzapp/shared` package)
- `hooks`: contains custom react hooks reused accros the application
- `screens`: contains React components that represents a top level screen of the application, since those components will be reused on the web client they should not contains any native specific code.
- `mobileScreens`: contains the specialized version of `screens` component used only by the native application


# Native Routing

The native routing application is based [`react-native-screens`](https://github.com/software-mansion/react-native-screens) but unlike most RN applications we use a custom router instead of [React Navigation](https://reactnavigation.org/). It has been made to improove the integration with [React Relay](https://relay.dev/) and to improve the way azzapp aplication specific use case are implemented.
The custom router can be found in `lib/components/NativeRouter.tsx`.


# Development environment

To be able to launch the application in development, create a copy of `.env.example` in a `.env` file and set the environment variables to proper values.