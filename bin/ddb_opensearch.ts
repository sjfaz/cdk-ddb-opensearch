#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { DatabaseStack } from "../stacks";

const app = new cdk.App();

const db = new DatabaseStack(app, "DDBStack");
