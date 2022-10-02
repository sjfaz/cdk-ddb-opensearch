import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod,
} from "@aws-cdk/aws-apigatewayv2-alpha";
import {
  StackProps,
  Stack,
  Duration,
  CfnOutput,
  aws_opensearchservice,
  aws_lambda,
} from "aws-cdk-lib";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { lambdaFnProps } from "./utils";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
const OS_INDEX_NAME = "transaction-index";

interface LambdaApiStackProps extends StackProps {
  table: ITable;
  domain: aws_opensearchservice.IDomain;
}

export class APILayerConstruct extends Construct {
  public readonly apiUrl: string;
  constructor(parent: Stack, name: string, props: LambdaApiStackProps) {
    super(parent, name);

    const httpApi = new HttpApi(this, `${name}-http-api`, {
      description: "HTTP API example",
      corsPreflight: {
        allowHeaders: [
          "Content-Type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
        ],
        allowMethods: [
          CorsHttpMethod.OPTIONS,
          CorsHttpMethod.GET,
          CorsHttpMethod.POST,
          CorsHttpMethod.PUT,
          CorsHttpMethod.PATCH,
          CorsHttpMethod.DELETE,
        ],
        allowOrigins: ["*"],
      },
    });

    const newFunc = new NodejsFunction(
      this,
      `${name}-simple-endpoint-handler`,
      {
        ...lambdaFnProps,
        entry: "./services/functions/simple.ts", // accepts .js, .jsx, .ts and .tsx files
        functionName: `${name}-simple`,
        handler: "handler",
        memorySize: 512,
        timeout: Duration.seconds(15),
        environment: {},
      }
    );

    const newFuncRPC = new NodejsFunction(
      this,
      `${name}-trpc-endpoint-handler`,
      {
        ...lambdaFnProps,
        entry: "./services/functions/tRPC.ts", // accepts .js, .jsx, .ts and .tsx files
        functionName: `${name}-tRPC`,
        handler: "handler",
        tracing: aws_lambda.Tracing.ACTIVE,
        environment: {
          TABLE_NAME: props.table.tableName,
          OS_INDEX_NAME,
          OS_AWS_REGION: process.env.CDK_DEFAULT_REGION!,
          OS_DOMAIN: `https://${props.domain.domainEndpoint}`,
        },
      }
    );

    props.table.grantFullAccess(newFuncRPC);
    props.domain.grantReadWrite(newFuncRPC);

    // Add route for GET /todos
    httpApi.addRoutes({
      path: "/simple",
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        `${name}-simple-integration`,
        newFunc
      ),
    });

    // Add route for GET /todos
    httpApi.addRoutes({
      path: "/beta/{proxy+}",
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        `${name}-trpc-integration`,
        newFuncRPC
      ),
    });

    // Add route for POST /todos
    httpApi.addRoutes({
      path: "/beta/{proxy+}",
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration(
        `${name}-bete-integration-post`,
        newFuncRPC,
        {}
      ),
    });

    this.apiUrl = httpApi.url!;
    new CfnOutput(this, "apiUrl", {
      value: httpApi.url!,
    });
  }
}
