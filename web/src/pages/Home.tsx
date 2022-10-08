import React from "react";
import { AppLayout, Header, Box } from "@cloudscape-design/components";
import { Navigation, OSTable, HeaderMessage } from "../components";

export function MainHeader() {
  return (
    <Header
      variant="h1"
      info={<div>Example showing searching from OpenSearch</div>}
    >
      Read from OpenSearch
    </Header>
  );
}

const sidePanel = (
  <Box padding="l">
    <Header variant="h2">Info</Header>

    <Box padding="xxs">
      This table has some dummy transaction data. The data is stored in DynamoDB
      and replicated to OpenSearch using DynamoDB streams.
    </Box>
    <Box padding="xxs">
      The table can be sorted and you can search the text fields. The filter on
      OpenSearch the wildcard query. We target a specific shard using custom
      routing. The custom routing works by using the customer_id as the routing
      key. This means we can scan just one shard for each customer, allowing it
      to scale nicely.
    </Box>
    <Box padding="xxs">
      OpenSearch gives advantages over DynamoDB for use cases where we need to
      full featured search functionality. The footer shows records returned,
      OpenSearch latency and took and also how many shards were scanned.
    </Box>
    <Box padding="xxs">
      Filtering, sorting, paging happens server side. This is part of the
      equation to keep the latency low.
    </Box>
  </Box>
);

export default function Home() {
  return (
    <AppLayout
      navigation={<Navigation activeHref="/" />}
      content={<OSTable />}
      contentType="table"
      tools={sidePanel}
      stickyNotifications={true}
      notifications={<HeaderMessage />}
    />
  );
}
