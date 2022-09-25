#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { DataLayerStack, APILayerStack } from "../stacks";

const app = new cdk.App();

const db = new DataLayerStack(app, "DataLayerStack");
const api = new APILayerStack(app, "APILayerStack", { table: db.table });
