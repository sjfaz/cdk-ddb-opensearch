import { Transaction } from "../core/data";
import { randAccount, randProductDescription } from "@ngneat/falso";
import { getClient } from "../core/clients/ddb-client";

async function batchWrite(txns: Transaction[]) {
  return await getClient()
    .batchWrite({
      RequestItems: {
        [process.env.DDB_TABLE_NAME!]: txns.map((txn) => ({
          PutRequest: {
            Item: txn,
          },
        })),
      },
    })
    .promise();
}

async function scanAndDelete() {
  let results;
  do {
    let startKey;
    results = await getClient()
      .scan({
        ExclusiveStartKey: startKey,
        TableName: process.env.DDB_TABLE_NAME!,
      })
      .promise();
    for (const txn of results.Items!) {
      await getClient()
        .delete({
          TableName: process.env.DDB_TABLE_NAME!,
          Key: {
            pk: txn.pk,
            sk: txn.sk,
          },
        })
        .promise();
    }
  } while (results.LastEvaluatedKey);
}

export const handler = async (): Promise<void> => {
  // await scanAndDelete();
  console.log("Insert dummy data with falso");
  let counter = 0;
  const txnArray: Transaction[] = [];
  while (counter < 1000) {
    counter++;
    const customer_id = `0${randAccount({ accountLength: 3 })}`;
    const txn_id = randAccount();
    const txn = {
      pk: `CUST#${customer_id}`,
      sk: `TXN#${txn_id}`,
      customer_id,
      txn_id,
      card_number: randAccount({ accountLength: 16 }),
      product_code: randAccount({ accountLength: 3 }),
      txn_datetime: new Date().toISOString(),
      description: randProductDescription(),
    };
    txnArray.push(txn);
    if (txnArray.length === 25) {
      await batchWrite(txnArray);
      txnArray.length = 0;
    }
  }
};
