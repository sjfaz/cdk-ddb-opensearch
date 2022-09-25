import React from "react";
import {
  AppLayout,
  ContentLayout,
  Header,
  Box,
  Container,
} from "@cloudscape-design/components";
import { Navigation, OSTable } from "../components";

export function MainHeader() {
  return (
    <Header variant="h1" info={<div>OpenSearch with DynamoDB</div>}>
      Analysis
    </Header>
  );
}

const sidePanel = (
  <Box padding="l">
    <Header variant="h2">Info</Header>

    <Box padding="xxs">
      Further discussion points for considering OpenSearch with DynamoDB.
    </Box>
  </Box>
);

export default function Analysis() {
  return (
    <AppLayout
      navigation={<Navigation activeHref="/analysis" />}
      tools={sidePanel}
      content={
        <ContentLayout header={<MainHeader />}>
          <Container
            header={
              <Header variant="h2" description="Container description">
                Container header
              </Header>
            }
          >
            Container content
          </Container>
        </ContentLayout>
      }
    />
  );
}
