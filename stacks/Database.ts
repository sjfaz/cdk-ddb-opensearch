import {
  CfnOutput,
  Stack,
  Duration,
  aws_opensearchservice,
  aws_ec2,
  aws_iam,
} from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
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

    openSearchDomain.addAccessPolicies(
      aws_iam.PolicyStatement.fromJson({
        Effect: "Allow",
        Principal: {
          AWS: "*",
        },
        Action: "es:ESHttp*",
        Resource: `arn:aws:es:${process.env.CDK_DEFAULT_REGION!}:${process.env
          .CDK_DEFAULT_ACCOUNT!}:domain/${openSearchDomain.domainName}/*`,
        Condition: {
          IpAddress: {
            "aws:SourceIp": `${props.ipAddress}/24`,
          },
        },
      })
    );

    const streamProcessor = new NodejsFunction(this, "ProcessStreamData", {
      ...lambdaFnProps,
      entry: "./services/functions/stream-processor.ts", // accepts .js, .jsx, .ts and .tsx files
      handler: "handler",
      memorySize: 512,
      timeout: Duration.seconds(30),
      environment: {
        OS_INDEX_NAME,
        OS_AWS_REGION: process.env.CDK_DEFAULT_REGION!,
        OS_DOMAIN: openSearchDomain.domainEndpoint,
      },
    });

    // Add DynamoDB event source
    streamProcessor.addEventSource(
      new DynamoEventSource(table, {
        // startingPosition: lambda.StartingPosition.LATEST,
        startingPosition: lambda.StartingPosition.TRIM_HORIZON,
        batchSize: 1, // default is 100
        retryAttempts: 3,
      })
    );

    openSearchDomain.grantIndexReadWrite(OS_INDEX_NAME, streamProcessor);

    this.table = table;
    new CfnOutput(this, "TableName", { value: table.tableName });
  }
}
