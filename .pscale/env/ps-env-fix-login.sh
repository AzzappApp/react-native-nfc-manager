#!/bin/bash
export ORG_NAME="azzapp"
echo "::set-output name=ORG_NAME::azzapp"

export DB_NAME="azzapp"
echo "::set-output name=DB_NAME::azzapp"

export BRANCH_NAME="fix-signup"
echo "::set-output name=BRANCH_NAME::fix-signup"

export DEPLOY_REQUEST_NUMBER="120"
echo "::set-output name=DEPLOY_REQUEST_NUMBER::120"

export DEPLOY_REQUEST_URL="https://app.planetscale.com/azzapp/azzapp/deploy-requests/120"
echo "::set-output name=DEPLOY_REQUEST_URL::https://app.planetscale.com/azzapp/azzapp/deploy-requests/120"

export BRANCH_URL="https://app.planetscale.com/azzapp/azzapp/fix-signup"
echo "::set-output name=BRANCH_URL::https://app.planetscale.com/azzapp/azzapp/fix-signup"

