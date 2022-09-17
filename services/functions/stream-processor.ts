import { DynamoDBStreamEvent } from "aws-lambda";
import DynamoDB from "aws-sdk/clients/dynamodb";
import { Transaction, deleteDocument, indexDocument } from "../core/client";

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
