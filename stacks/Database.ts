import {
  CfnOutput,
  Stack,
  Duration,
  aws_ssm,
  aws_opensearchservice,
  aws_ec2,
} from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { lambdaFnProps } from "./utils";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
const { EngineVersion, Domain } = aws_opensearchservice;
const INDEX_NAME = "transaction-index";

export class Database extends Construct {
  public readonly table: dynamodb.Table;
  constructor(parent: Stack, name: string, props: {}) {
    super(parent, name);

    const table = new dynamodb.Table(this, "TransactionTable", {
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_IMAGE,
    });

    // Add OpenSearch cluster
    // const devDomain = new Domain(this, "OSDomain", {
    //   version: EngineVersion.OPENSEARCH_1_0,
    //   enableVersionUpgrade: true,
    // });

    const openSearchDomain = new Domain(this, "OpenSearchDomain", {
      version: EngineVersion.OPENSEARCH_1_0,
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

    const streamProcessor = new NodejsFunction(this, "GetData", {
      ...lambdaFnProps,
      entry: "./services/functions/stream-processor.ts", // accepts .js, .jsx, .ts and .tsx files
      functionName: "stream-processor",
      handler: "handler",
      memorySize: 512,
      timeout: Duration.seconds(30),
      environment: {
        INDEX_NAME,
        AWS_REGION: process.env.CDK_DEFAULT_REGION!,
        DOMAIN: openSearchDomain.domainEndpoint,
      },
    });

    // Add DynamoDB event source
    streamProcessor.addEventSource(
      new DynamoEventSource(table, {
        // startingPosition: lambda.StartingPosition.LATEST,
        startingPosition: lambda.StartingPosition.TRIM_HORIZON,
        batchSize: 1,
        retryAttempts: 3,
      })
    );

    openSearchDomain.grantIndexReadWrite(INDEX_NAME, streamProcessor);

    // const prodDomain = new Domain(this, "Domain", {
    //   version: EngineVersion.OPENSEARCH_1_0,
    //   capacity: {
    //     masterNodes: 5,
    //     dataNodes: 20,
    //   },
    //   ebs: {
    //     volumeSize: 20,
    //   },
    //   zoneAwareness: {
    //     availabilityZoneCount: 3,
    //   },
    //   logging: {
    //     slowSearchLogEnabled: true,
    //     appLogEnabled: true,
    //     slowIndexLogEnabled: true,
    //   },
    // });

    this.table = table;
    new CfnOutput(this, "TableName", { value: table.tableName });
    // new CfnOutput(this, "Region", { value: process.env.CDK_DEFAULT_REGION! });
  }
}
