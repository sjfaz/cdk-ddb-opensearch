import { Transaction } from "../core/data";
import { randAccount } from "@ngneat/falso";
import { getClient } from "../core/clients/ddb-client";

async function create(txn: Transaction) {
  return await getClient()
    .put({
      TableName: process.env.DDB_TABLE_NAME!,
      Item: txn,
    })
    .promise();
}

export const handler = async (): Promise<void> => {
  console.log("Insert dummy data");
  // Use falso to add some data
  let counter = 0;
  while (counter < 10) {
    counter++;
    const customer_id = randAccount();
    const txn_id = randAccount();
    const txn = {
      pk: `CUST#${customer_id}`,
      sk: `TXN#${txn_id}`,
      customer_id,
      txn_id,
    };
    await create(txn);
  }
};
