#!/bin/bash

set -e
set -x

DIR=$(pwd)
DEST="$DIR/fastlane/builds/azzapp.xcarchive/Products/Applications"
PROJECT_ROOT="$DIR/ios"

yarn react-native bundle \
  --entry-file index.js \
  --platform ios \
  --dev false \
  --reset-cache \
  --bundle-output "$DEST/main.jsbundle" \
  --assets-dest "$DEST/azzapp.app" \
  --minify false

$DIR/ios/Pods/hermes-engine/destroot/bin/hermesc \
  -emit-binary -O \
  -out "$DEST/azzapp.app/main.jsbundle" "$DEST/main.jsbundle"

rm "$DEST/main.jsbundle"

