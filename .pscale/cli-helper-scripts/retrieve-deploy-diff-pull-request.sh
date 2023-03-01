#!/bin/bash

. use-pscale-docker-image.sh

. authenticate-ps.sh


DEPLOY_REQUEST_NUMBER=$1
BRANCH_NAME=$2
DB_NAME=$3
ORG_NAME=$4



# refresh the schema after push
 pscale branch refresh-schema "$DB_NAME" "$BRANCH_NAME" --org "$ORG_NAME"

. wait-for-deploy-request-ready.sh
wait_for_deploy_request_ready 9 "$DB_NAME" $DEPLOY_REQUEST_NUMBER "$ORG_NAME" 60

. ps-create-helper-functions.sh
create-diff-for-ci "$DB_NAME" "$ORG_NAME" $DEPLOY_REQUEST_NUMBER "$BRANCH_NAME"