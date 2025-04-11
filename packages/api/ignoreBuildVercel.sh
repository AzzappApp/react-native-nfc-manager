#!/bin/bash

echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"

if [[ "$VERCEL_GIT_COMMIT_REF" == "main" || "$VERCEL_GIT_COMMIT_REF" == "staging"  ]] ; then
  if npx turbo-ignore 2> /dev/null; then
    # Don't build
    echo "🛑 - Build cancelled"
    exit 0;
  else
    # Proceed with the build
    echo "✅ - Build can proceed"
    exit 1;
  fi
else
  # Don't build
  echo "🛑 - Build cancelled"
  exit 0;
fi


# https://vercel.com/guides/how-do-i-use-the-ignored-build-step-field-on-vercel