import { Transaction } from "../data";
import { getClient } from "../clients/os-client";
const client = getClient();

type SearchResults = {
  totalHits: number;
  hits: Transaction[];
  more: boolean;
  shards: number;
  took: number;
};

type SearchField = { key: string; value: string };
type SortFields = { column: string; descending: string; isNumber: boolean };

export const getTransactions = async (
  customer_id: string,
  SearchFields: SearchField[],
  operator: string,
  paging: { pageSize: number; from: number },
  sorting: SortFields | undefined
): Promise<SearchResults> => {
  return await simpleSearch(
    customer_id,
    SearchFields,
    operator,
    paging,
    sorting
  );
};

// READ (Could also use term rather than match)
async function simpleSearch(
  customer_id: string,
  searchFields: SearchField[],
  operator: string,
  paging: { pageSize: number; from: number },
  sorting?: SortFields | undefined
) {
  const query = {
    index: process.env.OS_INDEX_NAME!,
    routing: customer_id,
    from: paging.from,
    size: paging.pageSize,
    body: {
      query: {
        bool: {
          must: [
            {
              match: {
                customer_id,
              },
            },
            {
              bool: {
                [operator]: searchFields.map((field) => ({
                  wildcard: { [field.key]: `*${field.value}*` },
                })),
              },
            },
          ],
        },
      },
    },
  };

  const column_name = `${sorting?.column}${
    sorting?.isNumber ? "" : ".keyword"
  }`;
  const sort = sorting ? [{ [column_name]: sorting.descending }] : [];
  const results = await client.search({
    ...query,
    body: { ...query.body, sort },
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
    shards: results.body._shards.total,
    took: results.body.took,
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
