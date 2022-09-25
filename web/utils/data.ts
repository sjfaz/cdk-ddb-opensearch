import { Transaction } from "../../services/core/data";

const t: Transaction = {
  pk: "CUST#0123",
  sk: "TXN#1234567890",
  customer_id: "0123",
  txn_id: "1234567890",
  card_number: "1234-5678-9012-3456",
  product_code: "1234567890",
  txn_datetime: "2020-01-01T00:00:00.000Z",
  description: "Product 1234567890",
};

export const getDummyTransactions = (): Transaction[] => {
  return [...Array(10).keys()].map((i) => {
    const txn_id = parseInt(t.txn_id) + i;
    return {
      ...t,
      sk: `TXN#${txn_id}`,
      txn_id: txn_id.toString(),
      txn_datetime: new Date().toISOString(),
    };
  });
};

export const fullData = [
  {
    name: "Item 1",
    alt: "First",
    description: "This is the first item",
    type: "1A",
    size: "Small",
  },
  {
    name: "Item 2",
    alt: "Second",
    description: "This is the second item",
    type: "1B",
    size: "Large",
  },
  {
    name: "Item 3",
    alt: "Third",
    description: "-",
    type: "1A",
    size: "Large",
  },
  {
    name: "Item 4",
    alt: "Fourth",
    description: "This is the fourth item",
    type: "2A",
    size: "Small",
  },
  {
    name: "Item 5",
    alt: "-",
    description: "This is the fifth item with a longer description",
    type: "2A",
    size: "Large",
  },
  {
    name: "Item 6",
    alt: "Sixth",
    description: "This is the sixth item",
    type: "1A",
    size: "Small",
  },
];
