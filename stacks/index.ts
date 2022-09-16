import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Database } from "./Database";
import { ITable } from "aws-cdk-lib/aws-dynamodb";

export class DatabaseStack extends Stack {
  public readonly table: ITable;
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const db = new Database(this, "Database", {});
    this.table = db.table;
  }
}
