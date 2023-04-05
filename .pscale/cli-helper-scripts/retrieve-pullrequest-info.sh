#!/bin/bash

. use-pscale-docker-image.sh
. authenticate-ps.sh





function find_deploy_request_number {
    local retries=$1
    local db=$2
    local branch=$3
    local org=$4
    
    # check whether fifth parameter is set, otherwise use default value
    if [ -z "$5" ]; then
        local max_timeout=60
    else
        local max_timeout=$5
    fi

    local count=0
    local wait=1

    echo "Checking if deploy request on $branch exist..."
    while true; do
        local raw_output=`pscale deploy-request list "$db" --org "$org" --format json`

        # check return code, if not 0 then error
        if [ $? -ne 0 ]; then
            echo "Error: pscale deploy-request list returned non-zero exit code $?: $raw_output"
            return 1
        fi
       
        local outputNumber=`echo $raw_output | jq ".[] | select(.branch == \"$branch\" and .state == \"open\") | .number "`

        # test whether output is pending, if so, increase wait timeout exponentially
        if [ -z "$outputNumber" ]; then
            # increase wait variable exponentially but only if it is less than max_timeout
            echo  "Deploy-request on branch $branch with status open is not found"
            return 0
        else
            echo  "Deploy-request on branch $branch with status open is  request number $outputNumber"
            echo "::set-output name=DEPLOY_REQUEST_NUMBER::$outputNumber"
            return 0
        fi
    done
}


BRANCH_NAME=$1
DB_NAME=$2
ORG_NAME=$3
find_deploy_request_number 2 "$DB_NAME" "$BRANCH_NAME" "$ORG_NAME" 60  #"$DB_NAME" $DEPLOY_REQUEST_NUMBER "$ORG_NAME" 60



