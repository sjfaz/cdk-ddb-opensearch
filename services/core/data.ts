export interface Transaction {
  pk: string; // Customer ID e.g CUST#123
  sk: string; // Transaction ID e.g TXN#123
  customer_id: string;
  txn_id: string;
  full_card_number: string;
  card_number: string;
  product_code: string;
  product_name: string;
  product_quantity: number;
  txn_datetime: string;
  description: string;
  site_name: string;
  original_gross_value: number;
}
