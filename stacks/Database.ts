import {
  CfnOutput,
  Stack,
  Duration,
  aws_ssm,
  aws_opensearchservice,
  aws_ec2,
  aws_iam,
  CfnParameter,
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

    const ipAddress = new CfnParameter(this, "ipAddress", {
      type: "String",
      description: "IP_Address to access OS dashboard from.",
    });

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
      accessPolicies: [
        aws_iam.PolicyStatement.fromJson({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: {
                AWS: "*",
              },
              Action: "es:*",
              Resource: "*",
            },
          ],
          Action: "es:ESHttpGet*",
          Resource: `arn:aws:es:${process.env.CDK_DEFAULT_REGION!}:${process.env
            .CDK_DEFAULT_ACCOUNT!}:domain/${INDEX_NAME}/*`,
          Condition: {
            IpAddress: {
              "aws:SourceIp": `${ipAddress.valueAsString}/24`,
            },
          },
        }),
      ],
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

    const streamProcessor = new NodejsFunction(this, "ProcessStreamData", {
      ...lambdaFnProps,
      entry: "./services/functions/stream-processor.ts", // accepts .js, .jsx, .ts and .tsx files
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

    this.table = table;
    new CfnOutput(this, "TableName", { value: table.tableName });
  }
}
