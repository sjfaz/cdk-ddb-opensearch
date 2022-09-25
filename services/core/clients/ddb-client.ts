import { DocumentClient } from "aws-sdk/clients/dynamodb";
let client: DocumentClient;

export const getClient = (): DocumentClient => {
  if (client) return client;
  client = new DocumentClient({
    httpOptions: {
      connectTimeout: 1000,
      timeout: 5000,
    },
  });
  return client;
};
