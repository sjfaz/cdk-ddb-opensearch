#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { DataLayerStack, APILayerStack, WebLayerStack } from "../stacks";

const app = new cdk.App();

const db = new DataLayerStack(app, "DataLayerStack");
const api = new APILayerStack(app, "APILayerStack", {
  table: db.table,
  domain: db.domain,
});
new WebLayerStack(app, "WebLayerStack", {
  apiUrl: api.apiUrl,
});
