import { Client } from "@opensearch-project/opensearch";
import AWS from "aws-sdk";
// import { defaultProvider } from "@aws-sdk/credential-provider-node";
import createAwsOpensearchConnector from "aws-opensearch-connector";
const node = process.env.OS_DOMAIN;

export const getClient = () => {
  return new Client({
    ...createAwsOpensearchConnector(AWS.config),
    node,
  });
};
