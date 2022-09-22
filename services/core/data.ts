export interface Transaction {
  pk: string; // Customer ID e.g CUST#123
  sk: string; // Transaction ID e.g TXN#123
  customer_id: string;
  txn_id: string;
  // card_number: string;
  // product_code: string;
  // txn_datetime: string;
}
