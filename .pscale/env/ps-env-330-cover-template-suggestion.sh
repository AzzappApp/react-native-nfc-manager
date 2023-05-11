#!/bin/bash
export ORG_NAME="azzapp"
echo "::set-output name=ORG_NAME::azzapp"

export DB_NAME="azzapp"
echo "::set-output name=DB_NAME::azzapp"

export BRANCH_NAME="templante-recommendation"
echo "::set-output name=BRANCH_NAME::templante-recommendation"

export DEPLOY_REQUEST_NUMBER="123"
echo "::set-output name=DEPLOY_REQUEST_NUMBER::123"

export DEPLOY_REQUEST_URL="https://app.planetscale.com/azzapp/azzapp/deploy-requests/123"
echo "::set-output name=DEPLOY_REQUEST_URL::https://app.planetscale.com/azzapp/azzapp/deploy-requests/123"

export BRANCH_URL="https://app.planetscale.com/azzapp/azzapp/templante-recommendation"
echo "::set-output name=BRANCH_URL::https://app.planetscale.com/azzapp/azzapp/templante-recommendation"

