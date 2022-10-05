# DDB + OpenSearch

This project sets up:

- OpenSearch Cluster
- DynamoDB Table with stream to sync data to OpenSearch Cluster
- Lambda, APIGateway, TRPC for the API
- Static React SPA website using the CloudScape component library.
- EventBridge and Lambda to import dummy data into DynamoDB every x minutes.

```
# deploy (IP Address is to view OpenSearch Dashboards)
yarn cdk deploy --parameters DataLayerStack:ipaddress='YOUR_IP_ADDRESS' --all

# destroy
npm cdk destroy
```

## CDK commands below:

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template
