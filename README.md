# DDB + OpenSearch

### TODO:

Write text showing how solution would compare using DDB only:
Harder for pagination, we can't get the total number unless we read the whole item colleciton unless we maintain it.
Cost profile does not look good using FilterExpression and contains,

With OS:
We can scale DDB reads down to 1RCU or zero on on-demand to reduce cost
We just pay for the writes.
Need to solve warming issue on OS.
Determine if separate indexes is better than one big one in OS.
How to size cluster.
We may want to remove item collection on DDB - just use UUID as PK (de-risk write throttles on single partition).

## CDK commands below:

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template

### DynamoDB Create

```
aws lambda invoke \
    --function-name invoke-dynamodb \
    --cli-binary-format raw-in-base64-out \
    --payload '{ "testEvent":"create", "txn":{ "pk":"CUST#123", "sk":"TXN#001", "customer_id":"123", "txn_id":"001" } }' \
    response.json
```

### DynamoDB Delete

```
aws lambda invoke \
    --function-name invoke-dynamodb \
    --cli-binary-format raw-in-base64-out \
    --payload '{ "testEvent":"delete", "txn":{ "pk":"CUST#1234", "sk":"TXN#001", "customer_id":"123", "txn_id":"001" } }' \
    response.json
```

### OpenSearch search (match)

```
aws lambda invoke \
    --function-name invoke-opensearch \
    --cli-binary-format raw-in-base64-out \
    --payload '{ "testEvent":"search", "txn":{ "pk":"CUST#123", "sk":"TXN#001", "customer_id":"12", "txn_id":"001" } }' \
    response.json
```

### OpenSearch search (regexp)

```
aws lambda invoke \
    --function-name invoke-opensearch \
    --cli-binary-format raw-in-base64-out \
    --payload '{ "testEvent":"regexp", "txn":{ "pk":"CUST#123", "sk":"TXN#001", "customer_id":"12.*", "txn_id":"001" } }' \
    response.json
```

### DynamoDB ingest (regexp)

```
aws lambda invoke \
    --function-name ingest-dynamodb \
    response.json
```
