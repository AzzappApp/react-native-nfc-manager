#!/bin/bash
export ORG_NAME="azzapp"
echo "::set-output name=ORG_NAME::azzapp"

export DB_NAME="azzapp"
echo "::set-output name=DB_NAME::azzapp"

export BRANCH_NAME="backoffice"
echo "::set-output name=BRANCH_NAME::backoffice"

export DEPLOY_REQUEST_NUMBER="135"
echo "::set-output name=DEPLOY_REQUEST_NUMBER::135"

export DEPLOY_REQUEST_URL="https://app.planetscale.com/azzapp/azzapp/deploy-requests/135"
echo "::set-output name=DEPLOY_REQUEST_URL::https://app.planetscale.com/azzapp/azzapp/deploy-requests/135"

export BRANCH_URL="https://app.planetscale.com/azzapp/azzapp/backoffice"
echo "::set-output name=BRANCH_URL::https://app.planetscale.com/azzapp/azzapp/backoffice"

