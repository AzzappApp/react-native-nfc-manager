fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios build

```sh
[bundle exec] fastlane ios build
```

Build iOS application native part.

### ios inject_react_native

```sh
[bundle exec] fastlane ios inject_react_native
```

Inject React Native and resign the app.

### ios deploy

```sh
[bundle exec] fastlane ios deploy
```

Deploy iOS application to App Store.

----


## Android

### android build

```sh
[bundle exec] fastlane android build
```

Build Android application based on ANDROID_TARGET environment variable.

### android deploy

```sh
[bundle exec] fastlane android deploy
```

Deploy Android application to Play Store.

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
