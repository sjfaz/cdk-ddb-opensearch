import {
  CfnOutput,
  Stack,
  Duration,
  aws_opensearchservice,
  aws_ec2,
  aws_iam,
} from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as events from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { Construct } from "constructs";
import { lambdaFnProps } from "./utils";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
const { EngineVersion, Domain } = aws_opensearchservice;
const OS_INDEX_NAME = "transaction-index";

export class Database extends Construct {
  public readonly table: dynamodb.Table;
  constructor(parent: Stack, name: string, props: { ipAddress: string }) {
    super(parent, name);

    const table = new dynamodb.Table(this, "TransactionTable", {
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_IMAGE,
    });

    // Escape hatch example
    // const ddbCfnNode = table.node.defaultChild as dynamodb.CfnTable;
    // ddbCfnNode.sseSpecification = {
    //   sseEnabled: true,
    // };

    const openSearchDomain = new Domain(this, "OpenSearchDomain", {
      version: EngineVersion.OPENSEARCH_1_3,
      enableVersionUpgrade: true,
      capacity: {
        dataNodeInstanceType: "t3.small.search",
        dataNodes: 1,
        masterNodes: 0,
      },
      ebs: {
        enabled: true,
        volumeSize: 50,
        volumeType: aws_ec2.EbsDeviceVolumeType.GENERAL_PURPOSE_SSD,
      },
      logging: {
        slowSearchLogEnabled: true,
        appLogEnabled: true,
        slowIndexLogEnabled: true,
      },
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
      memorySize: 1024,
      timeout: Duration.seconds(300),
      environment: {
        OS_INDEX_NAME,
        OS_AWS_REGION: process.env.CDK_DEFAULT_REGION!,
        OS_DOMAIN: `https://${openSearchDomain.domainEndpoint}`,
      },
      retryAttempts: 0,
    });

    const ddbLambda = new NodejsFunction(this, "DynamoDBCrud", {
      ...lambdaFnProps,
      entry: "./services/functions/crud/ddb-crud.ts",
      handler: "handler",
      functionName: "invoke-dynamodb",
      environment: {
        DDB_TABLE_NAME: table.tableName,
      },
    });

    table.grantFullAccess(ddbLambda);

    const ddbIngestion = new NodejsFunction(this, "DynamoDBIngestion", {
      ...lambdaFnProps,
      entry: "./services/functions/ingest-data.ts",
      handler: "handler",
      functionName: "ingest-dynamodb",
      memorySize: 1024,
      timeout: Duration.seconds(300),
      environment: {
        DDB_TABLE_NAME: table.tableName,
      },
      retryAttempts: 0,
    });

    table.grantFullAccess(ddbIngestion);

    const ddbOpenSearch = new NodejsFunction(this, "OpenSearchCrud", {
      ...lambdaFnProps,
      entry: "./services/functions/crud/os-crud.ts",
      handler: "handler",
      functionName: "invoke-opensearch",
      environment: {
        OS_INDEX_NAME,
        OS_AWS_REGION: process.env.CDK_DEFAULT_REGION!,
        OS_DOMAIN: `https://${openSearchDomain.domainEndpoint}`,
      },
    });

    openSearchDomain.grantReadWrite(ddbOpenSearch);

    // Add DynamoDB event source
    streamProcessor.addEventSource(
      new DynamoEventSource(table, {
        // startingPosition: lambda.StartingPosition.LATEST,
        startingPosition: lambda.StartingPosition.TRIM_HORIZON,
        batchSize: 100, // default is 100
        retryAttempts: 0,
      })
    );

    new events.Rule(this, "ScheduleRule", {
      schedule: events.Schedule.cron({ minute: "0/5" }), // every 5 minutes
      targets: [new LambdaFunction(ddbIngestion)],
    });

    openSearchDomain.grantIndexReadWrite(OS_INDEX_NAME, streamProcessor);

    this.table = table;
    new CfnOutput(this, "TableName", { value: table.tableName });
  }
}
