import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { NodejsFunctionProps, LogLevel } from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Duration, aws_ec2, aws_opensearchservice } from "aws-cdk-lib";
const { EngineVersion } = aws_opensearchservice;

export const lambdaFnProps: Partial<NodejsFunctionProps> = {
  bundling: {
    target: "es2020",
    keepNames: true,
    logLevel: LogLevel.INFO,
    sourceMap: true,
    minify: true,
  },
  runtime: lambda.Runtime.NODEJS_16_X,
  timeout: Duration.seconds(30),
  memorySize: 2048,
  logRetention: RetentionDays.ONE_DAY,
  environment: {
    NODE_OPTIONS: "--enable-source-maps",
  },
};

export const OS_BASE_CONFIG = {
  version: EngineVersion.OPENSEARCH_1_3,
  enableVersionUpgrade: true,
  capacity: {
    dataNodeInstanceType: "t3.small.search",
    dataNodes: 1,
    masterNodes: 0,
  },
  ebs: {
    enabled: true,
    volumeSize: 100,
    volumeType: aws_ec2.EbsDeviceVolumeType.GENERAL_PURPOSE_SSD,
  },
  logging: {
    slowSearchLogEnabled: true,
    appLogEnabled: true,
    slowIndexLogEnabled: true,
  },
};

// Optimal size is 30GB per shard in index
// For 1TB we need 34 shards. Default is number of shards is 5.
// 1GB of JVM Heap RAM should for 20/25 shards
// So we need at least 4GB of RAM (only 50% of instance RAM goes to JVM)
// For redundancy we need 2 instances - the replica of the index will be stored on the second instance.
// Querying will target a single shard using custom routing (based on customer ID)
export const OS_PROD_SHARDS = "34";
export const OS_PROD_CONFIG = {
  ...OS_BASE_CONFIG,
  capacity: {
    ...OS_BASE_CONFIG.capacity,
    dataNodes: 2,
    dataNodeInstanceType: "m6g.xlarge.search", // 8GB (upto 1024 GB storage)
  },
  zoneAwareness: {
    availabilityZoneCount: 2,
  },
  ebs: {
    enabled: true,
    volumeSize: 1024,
  },
};

// For testing we use only 1 small instance
// We will have 3 shards and 100GB of storage
// Aim to fill 3 shards with 30GB of data each for 1000 customers = 60MB per customer
export const OS_TEST_SHARDS = "3";
export const OS_TEST_CONFIG = {
  ...OS_BASE_CONFIG,
};
