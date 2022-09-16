import { DynamoDBStreamEvent } from "aws-lambda";
import DynamoDB from "aws-sdk/clients/dynamodb";
import { Transaction, deleteDocument, indexDocument } from "./client";
// const {
//   OpenSearchClient,
//   AcceptInboundConnectionCommand,
// } = require("@aws-sdk/client-opensearch");
// const client = new OpenSearchClient();
// import { HttpRequest } from "@aws-sdk/protocol-http";
// import { NodeHttpHandler } from "@aws-sdk/node-http-handler";
// import { SignatureV4 } from "@aws-sdk/signature-v4";
// import { defaultProvider } from "@aws-sdk/credential-provider-node";
// import { Sha256 } from "@aws-crypto/sha256-browser";
//import {indexDocumentInOpenSearch, removeDocumentFromOpenSearch} from "../service/OpenSearchService";

// exports.handler = async (event: DynamoDBStreamEvent) => {
//   try {
//     for (const record of event.Records) {
//       console.log("DynamoDB Record: %j", record.dynamodb);
//       var params = {
//         // DelaySeconds: 1,
//         MessageBody: JSON.stringify(record),
//         QueueUrl: process.env.QUEUE_URL,
//       };
//       await sqs.sendMessage(params).promise();
//     }
//   } catch (error) {
//     console.log(`Error processiong stream: ${error}`);
//   }
// };

// async function execute(request: HttpRequest): Promise<void> {
//   const awsOpenSearchSigner = new SignatureV4({
//     credentials: defaultProvider(),
//     region: process.env.OS_AWS_REGION!,
//     service: "es",
//     sha256: Sha256,
//   });

//   try {
//     const signedRequest = await awsOpenSearchSigner.sign(request);
//     const awsNodeHttpClient = new NodeHttpHandler();

//     const { response } = await awsNodeHttpClient.handle(
//       <HttpRequest>signedRequest
//     );
//     if (response.statusCode === 200 || response.statusCode === 201) {
//       console.log(
//         "Successfully sent request to OpenSearch Domain. Response code:",
//         response.statusCode
//       );
//     } else {
//       console.error(
//         "Error occurred with request to OpenSearch Domain. Response code:",
//         response.statusCode
//       );
//     }
//   } catch (error) {
//     console.error(
//       "Error occurred trying to make request to OpenSearch Domain",
//       error
//     );
//     throw error;
//   }
// }

// export async function deleteDocument(documentId: string): Promise<void> {
//   const request = new HttpRequest({
//     headers: {
//       "Content-Type": "application/json",
//       host: process.env.OS_DOMAIN!,
//     },
//     hostname: process.env.OS_DOMAIN!,
//     method: "DELETE",
//     path: `${process.env.OS_INDEX_NAME}/${type}/${documentId}`,
//   });

//   await execute(request);
// }

// export async function indexDocument(
//   documentId: string,
//   document: Transaction
// ): Promise<void> {
//   const request = new HttpRequest({
//     body: JSON.stringify(document),
//     headers: {
//       "Content-Type": "application/json",
//       host: process.env.OS_DOMAIN!,
//     },
//     hostname: process.env.OS_DOMAIN!,
//     method: "PUT",
//     path: `${process.env.OS_INDEX_NAME}/${type}/${documentId}`,
//   });

//   await execute(request);
// }

export async function removeDocumentFromOpenSearch(
  partitionKey: string | undefined,
  sortKey: string | undefined
): Promise<void> {
  if (!partitionKey || !sortKey) {
    console.error("Error: either partition key or sort key is undefined");
    return;
  }

  const documentId = `${partitionKey}_${sortKey}`;
  console.log("Deleting document from OpenSearch with id:", documentId);

  await deleteDocument(documentId);
}

export async function indexDocumentInOpenSearch(
  user: Transaction,
  partitionKey: string | undefined,
  sortKey: string | undefined
): Promise<void> {
  if (!partitionKey || !sortKey) {
    console.error("Error: either partition key or sort key is undefined");
    return;
  }

  const documentId = `${partitionKey}_${sortKey}`;
  console.log("Indexing document in OpenSearch with id:", documentId);

  await indexDocument(documentId, user);
}

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  console.log("Received event from some table");

  for (const record of event.Records) {
    if (!record.eventName || !record.dynamodb || !record.dynamodb.Keys)
      continue;

    const partitionKey = record.dynamodb.Keys.pk.S;
    const sortKey = record.dynamodb.Keys.sk.S;
    // Note here that we are using a pk and sk but maybe you are using only an id, this would look like:
    // const id = record.dynamodb.Keys.id.S;

    try {
      if (record.eventName === "REMOVE") {
        console.log(
          "Received remove event from some table, deleting the document from OpenSearch"
        );
        return await removeDocumentFromOpenSearch(partitionKey, sortKey);
      } else {
        if (!record.dynamodb.NewImage) continue;

        console.log(
          `Received ${record.eventName.toLowerCase()} event from dynamo, indexing the document in OpenSearch`
        );
        const document = DynamoDB.Converter.unmarshall(
          record.dynamodb.NewImage
        ) as Transaction;
        return await indexDocumentInOpenSearch(document, partitionKey, sortKey);
      }
    } catch (error) {
      console.error("Error occurred updating OpenSearch domain", error);
      throw error;
    }
  }
};
