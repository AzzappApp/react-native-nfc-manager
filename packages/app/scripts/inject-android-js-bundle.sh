#!/bin/bash

set -e

if [ -z "$1" ]; then
  echo "❌ Usage: $0 <Variant> (e.g. Development, Staging, Production)"
  exit 1
fi

# Target variant
TARGET="$1"
TARGET="$(tr '[:lower:]' '[:upper:]' <<< ${TARGET:0:1})${TARGET:1}"
echo "⚙️ Target: $TARGET"

# === Paths ===
TMP_DIR="tmp"
AAB_PATH="azzapp.aab"
BASE_BUILD_DIR="android/app/build/generated"
JS_BUNDLE_PATH="$BASE_BUILD_DIR/assets/createBundle${TARGET}ReleaseJsAndAssets/index.android.bundle"
ASSET_PATH="$BASE_BUILD_DIR/res/createBundle${TARGET}ReleaseJsAndAssets"

echo "🧹 Cleaning up"
rm -rf "$TMP_DIR"
echo "🗑️ Temporary directory removed"

echo "📦 Unzipping AAB..."
mkdir -p "$TMP_DIR"
unzip -q "$AAB_PATH" -d "$TMP_DIR"

if [ ! -f "$JS_BUNDLE_PATH" ]; then
  echo "❌ JS bundle not found at: $JS_BUNDLE_PATH"
  exit 1
fi

echo "📥 Injecting JS bundle"
mkdir -p "$TMP_DIR/base/assets/"
cp "$JS_BUNDLE_PATH" "$TMP_DIR/base/assets/"

echo "📥 Injecting assets"
mkdir -p "$TMP_DIR/base/res/"
cp -r "$ASSET_PATH"/* "$TMP_DIR/base/res/"

echo "🗜️ Rebuilding AAB..."
cd "$TMP_DIR"
zip -0 -r "../$AAB_PATH" .
cd - > /dev/null

echo "🧹 Cleaning up"
rm -rf "$TMP_DIR"
echo "✅ AAB rebuilt and temporary files removed"
