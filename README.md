# Welcome to your CDK JavaScript project!

This is a blank project for JavaScript development with CDK.

The `cdk.json` file tells the CDK Toolkit how to execute your app. The build step is not required when using JavaScript.

## Useful commands

 * `npm run test`         perform the jest unit tests
 * `cdk deploy`           deploy this stack to your default AWS account/region
 * `cdk diff`             compare deployed stack with current state
 * `cdk synth`            emits the synthesized CloudFormation template


## Some useful Curl commands
 curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"stayNextMove":"True"}' https://xxxx.amazonaws.com/game/195958/turn/1/player/123


curl --request POST https://xxxx.execute-api.us-east-2.amazonaws.com/game


 curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"player":"Joe"}' https://xxxx.execute-api.us-east-2.amazonaws.com/game/195958/player