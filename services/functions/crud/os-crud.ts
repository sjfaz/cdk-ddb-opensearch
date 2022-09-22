// TODO: implement crud from OpenSearch
import { Transaction } from "../../core/data";
import { getClient } from "../../core/clients/os-client";
const client = getClient();

interface OSTestEvent {
  testEvent: "search" | "analytics-search" | "create" | "update" | "delete";
  txn: Transaction;
}

// READ (Could also use term rather than match)
async function simpleSearch(txn: Transaction) {
  return await client.search({
    index: process.env.OS_INDEX_NAME!,
    body: {
      query: {
        match: {
          customer_id: txn.customer_id,
        },
      },
    },
  });
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

export const handler = async (testEvent: OSTestEvent): Promise<any> => {
  console.log("Received event from some table");
  let response;

  if (testEvent.testEvent === "search") {
    console.log("search");
    response = simpleSearch(testEvent.txn);
  }
  if (testEvent.testEvent === "analytics-search") {
    console.log("search");
    response = regexpSearch(testEvent.txn);
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
