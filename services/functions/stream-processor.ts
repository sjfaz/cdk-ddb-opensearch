import { DynamoDBStreamEvent } from "aws-lambda";
import DynamoDB from "aws-sdk/clients/dynamodb";
import { getClient } from "../core/clients/os-client";
import { Transaction } from "../core/data";

const client = getClient();
const index = process.env.OS_INDEX_NAME!;

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  console.log("Received event from some table");

  for (const record of event.Records) {
    if (!record.eventName || !record.dynamodb || !record.dynamodb.Keys)
      continue;

    const documentId = `${record.dynamodb.Keys.pk.S}_${record.dynamodb.Keys.sk.S}`;

    try {
      if (record.eventName === "REMOVE") {
        console.log(
          "Received remove event from some table, deleting the document from OpenSearch"
        );
        console.log("Deleting document from OpenSearch with id:", documentId);
        await client.delete({ index, id: documentId });
      } else {
        if (!record.dynamodb.NewImage) continue;

        console.log(
          `Received ${record.eventName.toLowerCase()} event from dynamo, indexing the document in OpenSearch`
        );
        const document = DynamoDB.Converter.unmarshall(
          record.dynamodb.NewImage
        ) as Transaction;
        console.log("Indexing document in OpenSearch with id:", documentId);
        await client.index({
          index,
          id: documentId,
          body: document,
        });
      }
    } catch (error) {
      console.error("Error occurred updating OpenSearch domain", error);
      throw error;
    }
  }
};
