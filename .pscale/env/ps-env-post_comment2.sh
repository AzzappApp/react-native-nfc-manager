#!/bin/bash
export ORG_NAME="azzapp"
echo "::set-output name=ORG_NAME::azzapp"

export DB_NAME="azzapp"
echo "::set-output name=DB_NAME::azzapp"

export BRANCH_NAME="post-comment"
echo "::set-output name=BRANCH_NAME::post-comment"

export DEPLOY_REQUEST_NUMBER="127"
echo "::set-output name=DEPLOY_REQUEST_NUMBER::127"

export DEPLOY_REQUEST_URL="https://app.planetscale.com/azzapp/azzapp/deploy-requests/127"
echo "::set-output name=DEPLOY_REQUEST_URL::https://app.planetscale.com/azzapp/azzapp/deploy-requests/127"

export BRANCH_URL="https://app.planetscale.com/azzapp/azzapp/post-comment"
echo "::set-output name=BRANCH_URL::https://app.planetscale.com/azzapp/azzapp/post-comment"

