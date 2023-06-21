function create-branch-connection-string {
    local DB_NAME=$1
    local BRANCH_NAME=$2
    local ORG_NAME=$3
    local CREDS=$4

    # delete password if it already existed
    # first, list password if it exists
    local raw_output=`pscale password list "$DB_NAME" "$BRANCH_NAME" --org "$ORG_NAME" --format json `
    # check return code, if not 0 then error
    if [ $? -ne 0 ]; then
        echo "Error: pscale password list returned non-zero exit code $?: $raw_output"
        exit 1
    fi

    local output=`echo $raw_output | jq -r "[.[] | select(.display_name == \"$CREDS\") ] | .[0].id "`
    # if output is not "null", then password exists, delete it
    if [ "$output" != "null" ]; then
        echo "Deleting existing password $output"
        pscale password delete --force "$DB_NAME" "$BRANCH_NAME" "$output" --org "$ORG_NAME"
        # check return code, if not 0 then error
        if [ $? -ne 0 ]; then
            echo "Error: pscale password delete returned non-zero exit code $?"
            exit 1
        fi
    fi
    
    local raw_output=`pscale password create "$DB_NAME" "$BRANCH_NAME" "$CREDS" --org "$ORG_NAME" --format json`
    
    if [ $? -ne 0 ]; then
        echo "Failed to create credentials for database $DB_NAME branch $BRANCH_NAME: $raw_output"
        exit 1
    fi
    echo $raw_output
    local DB_URL=`echo "$raw_output" |  jq -r ". | \"mysql://\" + .username +  \":\" + .plain_text +  \"@\" + .database_branch.access_host_url + \"/\""`
    # local DATABASE_USERNAME=`echo "$raw_output" |  jq -r ". | .username"`

    local DATABASE_USERNAME=`echo "$raw_output" | jq -r ".username"`
    local DATABASE_PASSWORD=`echo "$raw_output" | jq -r ".plain_text"`
    echo $DATABASE_USERNAME
    echo $DATABASE_PASSWORD
    # if not running in C
    echo "DATABASE_USERNAME=$DATABASE_USERNAME" >> $GITHUB_OUTPUT
    echo "DATABASE_PASSWORD=$DATABASE_PASSWORD" >> $GITHUB_OUTPUT
    echo "CONNECT_STRING=$DB_URL" >> $GITHUB_OUTPUT
    export MY_DB_URL=$DB_URL
}