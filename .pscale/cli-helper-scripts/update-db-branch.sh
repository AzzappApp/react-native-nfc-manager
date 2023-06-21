#!/bin/bash

. use-pscale-docker-image.sh

. authenticate-ps.sh

BRANCH_NAME="$1"
DB_NAME="$2"
ORG_NAME="$3"
DEPLOY_REQUEST_NUMBER="$4"


. set-db-and-org-and-branch-name.sh
pscale branch refresh-schema "$DB_NAME" "$BRANCH_NAME" --org "$ORG_NAME"

. ps-create-helper-functions.sh
create-diff-for-ci "$DB_NAME" "$ORG_NAME" "$DEPLOY_REQUEST_NUMBER" "$BRANCH_NAME" "update"
