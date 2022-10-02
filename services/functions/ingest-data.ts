import { Transaction } from "../core/data";
import {
  randAccount,
  randProductDescription,
  randProductName,
  randFloat,
  randCity,
} from "@ngneat/falso";
import { batchWrite, createIndex } from "./utils";
import { EventBridgeEvent } from "aws-lambda";
let firstRun = true;
const SHARDS = parseInt(process.env.OS_SHARDS!);

export const handler = async (
  event: EventBridgeEvent<"Scheduled Event", any>
): Promise<void> => {
  if (firstRun) {
    try {
      console.log(
        "create OpenSearch ahead of time so we can set shards: ",
        event
      );
      await createIndex(SHARDS, 1);
      firstRun = false;
    } catch (err) {
      console.log(`error creating index: ${err}`);
    }
  }

  // scale 500k dummy transactions per day
  // 347 per minute = 1050 per 3 minutes
  let counter = 0;
  const txnArray: Transaction[] = [];
  while (counter < 1050) {
    counter++;
    const customer_id = `0${randAccount({ accountLength: 3 })}`;
    const txn_id = randAccount();
    const txn_datetime = new Date().toISOString();
    const txn = {
      pk: `CUST#${customer_id}`,
      sk: `TXN#${txn_datetime}#${txn_id}`,
      customer_id,
      txn_id,
      full_card_number: randAccount({ accountLength: 16 }),
      card_number: randAccount({ accountLength: 6 }),
      product_code: randAccount({ accountLength: 3 }),
      product_name: randProductName(),
      product_quantity: 1 + Math.floor(Math.random() * 5),
      txn_datetime,
      description: randProductDescription(),
      original_gross_value: randFloat(),
      site_name: randCity(),
    };
    txnArray.push(txn);
    if (txnArray.length === 25) {
      await batchWrite(txnArray);
      txnArray.length = 0;
    }
  }
};
