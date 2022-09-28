import { Transaction } from "../../core/data";
import { getClient } from "../../core/clients/ddb-client";
import { getClient as getOSClient } from "../../core/clients/os-client";

export async function batchWrite(txns: Transaction[]) {
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

export async function scanAndDelete() {
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

export async function createIndex(shards: number, replicas: number) {
  const client = getOSClient();
  var settings = {
    settings: {
      index: {
        number_of_shards: shards,
        number_of_replicas: replicas,
      },
    },
  };
  return await client.indices.create({
    index: process.env.OS_INDEX_NAME!,
    body: settings,
  });
}
