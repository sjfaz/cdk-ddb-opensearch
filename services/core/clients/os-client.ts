import { Client } from "@opensearch-project/opensearch";
import AWS from "aws-sdk";
// import { defaultProvider } from "@aws-sdk/credential-provider-node";
import createAwsOpensearchConnector from "aws-opensearch-connector";
const node = process.env.OS_DOMAIN; // e.g. https://my-domain.region.es.amazonaws.com

export const getClient = () => {
  // const awsCredentials = await defaultProvider()();
  // const connector = createAwsOpensearchConnector({
  //   credentials: awsCredentials,
  //   region: process.env.AWS_REGION!,
  // });
  return new Client({
    ...createAwsOpensearchConnector(AWS.config),
    node,
  });
};
