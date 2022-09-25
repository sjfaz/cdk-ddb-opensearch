import { Stack, StackProps, CfnParameter } from "aws-cdk-lib";
import { Construct } from "constructs";
import { DataLayer } from "./DataLayer";
import { APILayerConstruct } from "./APILayer";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { aws_opensearchservice } from "aws-cdk-lib";

export class DataLayerStack extends Stack {
  public readonly table: ITable;
  public readonly domain: aws_opensearchservice.IDomain;
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const ipAddress = new CfnParameter(this, "ipaddress", {
      type: "String",
      description: "IP_Address to access OS dashboard from.",
    }).valueAsString;

    const db = new DataLayer(this, "DataLayerConstruct", { ipAddress });
    this.table = db.table;
    this.domain = db.osDomain;
  }
}

interface APILayerProps extends StackProps {
  table: ITable;
  domain: aws_opensearchservice.IDomain;
}

export class APILayerStack extends Stack {
  public readonly apiUrl: string;
  constructor(scope: Construct, id: string, props: APILayerProps) {
    super(scope, id, props);
    const api = new APILayerConstruct(this, "APILayerConstruct", {
      table: props.table,
      domain: props.domain,
    });
    this.apiUrl = api.apiUrl;
  }
}
