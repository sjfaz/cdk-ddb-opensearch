import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { DataLayerStack } from "../";

test("PITR is enabled", () => {
  const app = new cdk.App();
  // WHEN
  const stack = new DataLayerStack(app, "MyTestStack", {});
  // THEN

  const template = Template.fromStack(stack);

  template.resourceCountIs("AWS::DynamoDB::Table", 1);
});
