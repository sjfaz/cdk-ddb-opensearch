import { Transaction } from "../../core/data";
import { getClient } from "../../core/clients/ddb-client";

interface DDBTestEvent {
  testEvent: "read" | "create" | "update" | "delete";
  txn: Transaction;
}

// READ
async function read(txn: Transaction) {
  return await getClient()
    .get({
      TableName: process.env.DDB_TABLE_NAME!,
      Key: {
        pk: txn.pk,
        sk: txn.sk,
      },
    })
    .promise();
}

// CREATE
async function create(txn: Transaction) {
  return await getClient()
    .put({
      TableName: process.env.DDB_TABLE_NAME!,
      Item: txn,
    })
    .promise();
}

// UPDATE
async function update(txn: Transaction) {
  return await getClient()
    .update({
      TableName: process.env.DDB_TABLE_NAME!,
      Key: {
        pk: txn.pk,
        sk: txn.sk,
      },
      UpdateExpression: "set #c = :c, #t = :t",
      ExpressionAttributeNames: {
        "#c": "customer_id",
        "#t": "txn_id",
      },
      ExpressionAttributeValues: {
        ":c": txn.customer_id,
        ":t": txn.txn_id,
      },
    })
    .promise();
}

// DELETE
async function remove(txn: Transaction) {
  return await getClient()
    .delete({
      TableName: process.env.DDB_TABLE_NAME!,
      Key: {
        pk: txn.pk,
        sk: txn.sk,
      },
    })
    .promise();
}

export const handler = async (testEvent: DDBTestEvent): Promise<any> => {
  console.log("Received event from some table");
  let response;
  if (testEvent.testEvent === "read") {
    console.log("search");
    response = read(testEvent.txn);
  }
  if (testEvent.testEvent === "create") {
    console.log("create");
    response = create(testEvent.txn);
  }
  if (testEvent.testEvent === "update") {
    console.log("update");
    response = update(testEvent.txn);
  }
  if (testEvent.testEvent === "delete") {
    console.log("delete");
    response = remove(testEvent.txn);
  }
  return response;
};
