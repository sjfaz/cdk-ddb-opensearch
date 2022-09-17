import { Stack, StackProps, CfnParameter } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Database } from "./Database";
import { ITable } from "aws-cdk-lib/aws-dynamodb";

export class DatabaseStack extends Stack {
  public readonly table: ITable;
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const ipAddress = new CfnParameter(this, "ipaddress", {
      type: "String",
      description: "IP_Address to access OS dashboard from.",
    }).valueAsString;

    const db = new Database(this, "Database", { ipAddress });
    this.table = db.table;
  }
}
