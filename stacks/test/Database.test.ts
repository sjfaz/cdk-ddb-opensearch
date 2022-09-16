import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { DatabaseStack } from "../";

test("PITR is enabled", () => {
  const app = new cdk.App();
  // WHEN
  const stack = new DatabaseStack(app, "MyTestStack", {});
  // THEN

  const template = Template.fromStack(stack);

  template.hasResourceProperties("AWS::DynamoDB::Table", {
    PointInTimeRecoverySpecification: {
      PointInTimeRecoveryEnabled: true,
    },
  });
});
