// TODO: implement crud from OpenSearch
import { Transaction } from "../data";
import { getClient } from "../clients/os-client";
const client = getClient();

// const t: Transaction = {
//   pk: "CUST#0156",
//   sk: "TXN#1234567890",
//   customer_id: "0123",
//   txn_id: "1234567890",
//   card_number: "1234-5678-9012-3456",
//   product_code: "1234567890",
//   txn_datetime: "2020-01-01T00:00:00.000Z",
//   description: "Product 1234567890",
// };

type SearchResults = {
  totalHits: number;
  hits: Transaction[];
  more: boolean;
};

export const getTransactions = async (
  customer_id: string,
  txn_id: string
): Promise<SearchResults> => {
  return await simpleSearch(customer_id, txn_id);
};

// READ (Could also use term rather than match)
async function simpleSearch(customer_id: string, txn_id: string) {
  const results = await client.search({
    index: process.env.OS_INDEX_NAME!,
    size: 100,
    body: {
      query: {
        bool: {
          must: [
            {
              match: {
                customer_id,
              },
            },
          ],
          filter: [{ wildcard: { txn_id: `*${txn_id}*` } }],
        },
      },
    },
  });
  const hits = results.body.hits.hits.map((hit: any) => {
    const txn: Transaction = hit._source;
    return txn;
  });
  const totalHits = results.body.hits.total.value;
  return {
    totalHits,
    hits,
    more: totalHits > hits.length,
  };
}

// READ (Could also use wildcard rather than regexp)
async function regexpSearch(txn: Transaction) {
  return await client.search({
    index: process.env.OS_INDEX_NAME!,
    body: {
      query: {
        regexp: {
          customer_id: txn.customer_id,
        },
      },
    },
  });
}

// CREATE
async function create(txn: Transaction) {
  return await client.index({
    index: process.env.OS_INDEX_NAME!,
    id: `${txn.pk}_${txn.sk}`,
    body: txn,
  });
}

// UPDATE
async function update(txn: Transaction) {
  return await client.update({
    index: process.env.OS_INDEX_NAME!,
    id: `${txn.pk}_${txn.sk}`,
    body: txn,
  });
}

// DELETE
async function remove(txn: Transaction) {
  return client.delete({
    index: process.env.OS_INDEX_NAME!,
    id: `${txn.pk}_${txn.sk}`,
  });
}
