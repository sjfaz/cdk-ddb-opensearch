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
      The filter is applied to the OpenSearch index using the wildcard query.
      Currently using search against the txn_id field but this can be extended.
    </Box>
    <Box padding="xxs">
      OpenSearch gives a number of advantages over DynamoDB for usecases where
      we need to full featured search functionality.
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
