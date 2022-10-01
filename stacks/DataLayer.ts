import {
  CfnOutput,
  Stack,
  Duration,
  aws_opensearchservice,
  aws_ec2,
  aws_iam,
  RemovalPolicy,
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

export class DataLayer extends Construct {
  public readonly table: dynamodb.ITable;
  public readonly osDomain: aws_opensearchservice.IDomain;

  constructor(parent: Stack, name: string, props: { ipAddress: string }) {
    super(parent, name);

    const table = new dynamodb.Table(this, "TransactionTable", {
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      stream: dynamodb.StreamViewType.NEW_IMAGE,
    });

    // Optimal size is 30GB per shard in index
    // For 1TB we need 34 shards. Default is number of shards is 5.
    // 1GB of JVM Heap RAM should for 20/25 shards
    // So we need at least 4GB of RAM (only 50% of instance RAM goes to JVM)
    // For redundancy we need 2 instances - the replica of the index will be stored on the second instance.
    // TODO: We can use more indexes to split up the data. But we don't want an index-per-tenant that would be too many shards.
    const openSearchDomain = new Domain(this, "OpenSearchDomain", {
      version: EngineVersion.OPENSEARCH_1_3,
      enableVersionUpgrade: true,
      capacity: {
        // dataNodeInstanceType: "t3.small.search",
        dataNodeInstanceType: "m6g.xlarge.search", // 8GB (upto 1024 GB storage)
        dataNodes: 1,
        masterNodes: 0,
      },
      // zoneAwareness: {
      //   availabilityZoneCount: 2,
      // },
      ebs: {
        enabled: true,
        volumeSize: 1024,
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
      memorySize: 1024,
      timeout: Duration.seconds(300),
      environment: {
        DDB_TABLE_NAME: table.tableName,
        OS_INDEX_NAME,
        OS_AWS_REGION: process.env.CDK_DEFAULT_REGION!,
        OS_DOMAIN: `https://${openSearchDomain.domainEndpoint}`,
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
