#!/bin/bash

# Deploy to Vercel script

# Expected variables :
# - GITHUB_REF (ex: refs/heads/stable)
# - GITHUB_REF_NAME (ex: stable)
# - VERCEL_TOKEN

ADDITIONAL_ARGS=""

if [ "$GITHUB_REF" == "refs/heads/stable" ]; then
  ADDITIONAL_ARGS="--prod"
fi

vercel deploy \
  --token="$VERCEL_TOKEN" \
  --meta githubCommitRef="$GITHUB_REF_NAME" \
  $ADDITIONAL_ARGS