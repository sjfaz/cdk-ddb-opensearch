import {
  CfnOutput,
  Stack,
  Duration,
  aws_opensearchservice,
  aws_iam,
  RemovalPolicy,
} from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as events from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { Construct } from "constructs";
import {
  lambdaFnProps,
  OS_TEST_CONFIG,
  OS_PROD_CONFIG,
  OS_TEST_SHARDS,
  OS_PROD_SHARDS,
} from "./utils";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
const { Domain } = aws_opensearchservice;
const OS_INDEX_NAME = "transaction-index";

export class DataLayer extends Construct {
  public readonly table: dynamodb.ITable;
  public readonly osDomain: aws_opensearchservice.IDomain;

  constructor(
    parent: Stack,
    name: string,
    props: { ipAddress: string; envConfig?: string }
  ) {
    super(parent, name);

    const table = new dynamodb.Table(this, "TransactionTable", {
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      stream: dynamodb.StreamViewType.NEW_IMAGE,
    });

    const OS_CONFIG =
      props.envConfig === "prod" ? OS_PROD_CONFIG : OS_TEST_CONFIG;
    const openSearchDomain = new Domain(this, "OpenSearchDomain", {
      ...OS_CONFIG,
    });

    // If you want to see dashboard, you need to add this policy
    openSearchDomain.addAccessPolicies(
      aws_iam.PolicyStatement.fromJson({
        Effect: "Allow",
        Principal: {
          AWS: "*",
        },
        Action: "es:ESHttp*",
        Resource: `${openSearchDomain.domainArn}/*`,
        Condition: {
          IpAddress: {
            "aws:SourceIp": `${props.ipAddress}/24`,
          },
        },
      })
    );

    const streamProcessor = new NodejsFunction(this, "ProcessStreamData", {
      ...lambdaFnProps,
      entry: "./services/functions/stream-processor.ts",
      handler: "handler",
      timeout: Duration.seconds(300),
      environment: {
        OS_INDEX_NAME,
        OS_AWS_REGION: process.env.CDK_DEFAULT_REGION!,
        OS_DOMAIN: `https://${openSearchDomain.domainEndpoint}`,
      },
      retryAttempts: 0,
    });

    const ddbIngestion = new NodejsFunction(this, "DynamoDBIngestion", {
      ...lambdaFnProps,
      entry: "./services/functions/ingest-data.ts",
      handler: "handler",
      functionName: `${name}-ingest-dynamodb`,
      timeout: Duration.seconds(300),
      environment: {
        DDB_TABLE_NAME: table.tableName,
        OS_INDEX_NAME,
        OS_AWS_REGION: process.env.CDK_DEFAULT_REGION!,
        OS_DOMAIN: `https://${openSearchDomain.domainEndpoint}`,
        OS_SHARDS: props.envConfig === "prod" ? OS_PROD_SHARDS : OS_TEST_SHARDS,
      },
      retryAttempts: 0,
    });

    table.grantFullAccess(ddbIngestion);
    openSearchDomain.grantWrite(ddbIngestion);
    openSearchDomain.grantIndexReadWrite(OS_INDEX_NAME, ddbIngestion);

    // Add DynamoDB event source
    streamProcessor.addEventSource(
      new DynamoEventSource(table, {
        // startingPosition: lambda.StartingPosition.LATEST,
        startingPosition: lambda.StartingPosition.TRIM_HORIZON,
        batchSize: 100, // default is 100
        retryAttempts: 0,
      })
    );

    const every_3_mins = events.Schedule.rate(Duration.minutes(3));
    // const every_3_hours = events.Schedule.rate(Duration.hours(3));
    // events.Schedule.cron({ minute: "0", hour: "0/3" }), // every 3 hours
    new events.Rule(this, "ScheduleRule", {
      schedule: every_3_mins,
      targets: [new LambdaFunction(ddbIngestion)],
    });

    openSearchDomain.grantIndexReadWrite(OS_INDEX_NAME, streamProcessor);

    this.table = table;
    this.osDomain = openSearchDomain;
    new CfnOutput(this, "TableName", { value: table.tableName });
  }
}
