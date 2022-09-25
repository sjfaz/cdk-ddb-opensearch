import { Transaction } from "../../core/data";
import { getClient } from "../../core/clients/ddb-client";

export const deleteTransaction = async (pk: string, sk: string) => {
  return await remove(pk, sk);
};

// READ
async function read(txn: Transaction) {
  return await getClient()
    .get({
      TableName: process.env.TABLE_NAME!,
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
      TableName: process.env.TABLE_NAME!,
      Item: txn,
    })
    .promise();
}

// UPDATE
async function update(txn: Transaction) {
  return await getClient()
    .update({
      TableName: process.env.TABLE_NAME!,
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
async function remove(pk: string, sk: string) {
  return await getClient()
    .delete({
      TableName: process.env.TABLE_NAME!,
      Key: {
        pk: pk,
        sk: sk,
      },
    })
    .promise();
}
