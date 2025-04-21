#!/bin/bash

DIR=$(pwd)
DEST="$DIR/fastlane/builds/azzapp.xcarchive/Products/Applications"
PROJECT_ROOT="$DIR/ios"
SOURCE_MAP_DEST="$DIR/fastlane/builds/sourcemaps"


mkdir -p "$SOURCE_MAP_DEST"

yarn react-native bundle \
  --entry-file index.js \
  --platform ios \
  --dev false \
  --reset-cache \
  --bundle-output "$DEST/main.jsbundle" \
  --assets-dest "$DEST/$SCHEME.app/assets" \
  --minify false \
  --sourcemap-output "$SOURCE_MAP_DEST/main.jsbundle.map"

$DIR/ios/Pods/hermes-engine/destroot/bin/hermesc \
  -emit-binary -max-diagnostic-width=80 -O \
  -out "$DEST/$SCHEME.app/main.jsbundle" "$DEST/main.jsbundle"

cp "$DEST/$SCHEME.app/main.jsbundle" "$SOURCE_MAP_DEST/main.jsbundle"