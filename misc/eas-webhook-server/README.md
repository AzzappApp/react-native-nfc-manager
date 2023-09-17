# EAS Webhook Server

This simple server handle webhook from EAS to notify github with build success/failure.

This webhook is not deployed by CI and should be manually deployed to vecel,
it requires 2 env variables : 
- GITHUB_TOKEN : a github personnal access token used to update the github repo
- EAS_BUILD_WEBHOOK_SECRET: the webhook secret used to check eas build signatures

