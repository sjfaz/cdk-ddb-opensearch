import React from "react";
import {
  AppLayout,
  ContentLayout,
  Header,
} from "@cloudscape-design/components";
import { Navigation, OSTable } from "../components";

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

export default function Home() {
  return (
    <AppLayout
      navigation={<Navigation />}
      content={
        <ContentLayout header={<MainHeader />}>
          <OSTable />
        </ContentLayout>
      }
    />
  );
}
