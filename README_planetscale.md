
![Planetscale-2](https://github.com/AzzappApp/azzapp/assets/7248073/a35500da-cbbc-4167-ab81-0a2b4c71a167)

#Description of file
## use-pscale-docker-image.sh
this script allows to use a docker image for github acton. on self hosted runner, we can use pscale command directly

## authenticate-ps.sh
(not change) if env is not define try to login with spcale command. (should not be really necessary in our case, maybe in self hosted runner)

## approve-deploy-request.sh
(not change) The original one provided https://github.com/planetscale/pscale-workflow-helper-scripts

## create-branch-connection-string.sh
remove this syntax which can cause issue (on hosted mac m1 runner)
 local CREDS=${4,,}
remove the usage of heroku planetscale app to share secrat
add secret in github env for creating env/sharing it

## create-db-branch-dr-and-connection
Script updated to handler From database, to create a pr on a specific branch (not available on PS script/ github action)

## merge-deploy-request
Merge a deploy request, which is calling multiple function in those scripts

## ps-create-helper-functions
`create-db-branch` 
- update to handle from database.
- remove option to overwrite existing branch with same name
`create-schema-change`
`create-deploy-request`
`create-deploy-request-info` : in addition of creating deploy request, put the info in github env
`create-branch-info`
`create-diff-for-ci` : generate diff for a PR with color code and put if en github env

## retrive-branch-info.sh
use in ops command github action to recover info on a branch

## retrieve-deploy-diff-pull-request.sh
script used in ops command that retrieve difference in a pull request. (encapsualting all required script to run)

## wait-for-deploy-request-merged
update script to also wait for the `queue` status(with rollback feature activated)


# GITHUB ACTION
There is 2 separates cases. A PR to main from a branch made by a developer. There is not relation between branch name and pr name.

The PR from main=>staging and staging=>prod.
The name of the branch will be hardcoded and fix, no need for using a ps-env temp file. This one is pretty transparent. No action needed after the PR is created. This is describe in planetscale-merge-pr-staging-prod.yml
Github action only for staging and prod. The action will merge the planetscale request based on the branch name.


planetscale-merge-pr-dev.yml
Github action that will merge (if not already done by /ps-merge command) the Pull Request to main branch.
This PR is using a ps-env file. ()
The ps-env-*** file is a simple file used by all script with some constant and also make a relation between a PS branch name, github branch and github pull request

ex 
```
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
```

Process for a pull request from dev to main 
- developer create a github pull request name :"my pull request"
- if the developer have enough access right to planetscale dashboard, he can create a branch on the PS dashboard and get the connection string manually
https://app.planetscale.com/azzapp/azzapp/branches
- if not, a command /ps-create is available as a comment of the PR. It will create the branch and return the connection string. Those will not be encrypted. (and available for all people reading the pull request. If necessary we can use a one time display).

- The developer can use the connection string in the repository (web and backoffice .env, and using the command 
`pscale connect --org azzapp azzapp BRANCH_NAME`
- developer can push changement with script available in packages/data/package.json. we are not generating changes from command in pull request comment



