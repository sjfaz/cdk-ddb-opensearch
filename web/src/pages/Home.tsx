import React, { useState } from "react";
// import { Input, Alert, Select, Header } from "../components";
import { trpc } from "../../utils/trpc";
import {
  AppLayout,
  ContentLayout,
  Button,
  Header,
  Table,
  Box,
  Pagination,
  CollectionPreferences,
  TextFilter,
  SideNavigation,
  SideNavigationProps,
} from "@cloudscape-design/components";
import { fullData } from "../../utils/data";

type itemData = typeof fullData[0];

const Navigation = () => {
  const navItems: SideNavigationProps.Item[] = [
    { type: "link", text: "OpenSearch", href: "#/" },
    { type: "link", text: "DDB Only", href: "#/ddb" },
    {
      text: "Auto scaling",

      type: "section",
      defaultExpanded: false,
      items: [
        {
          type: "link",
          text: "Launch configurations",
          href: "#/launch_configurations",
        },
        {
          type: "link",
          text: "Auto scaling groups",
          href: "#/auto_scaling_groups",
        },
      ],
    },
  ];
  return (
    <>
      <SideNavigation
        items={navItems}
        // header={<h1>header</h1>}
        activeHref="#/"
        onFollow={(e) => console.log(e)}
      />
    </>
  );
};

const OSTable = () => {
  const [selectedItems, setSelectedItems] = React.useState<itemData[]>([
    fullData[2],
  ]);
  return (
    <div>
      <Table
        onSelectionChange={({ detail }) =>
          setSelectedItems(detail.selectedItems)
        }
        selectedItems={selectedItems}
        ariaLabels={{
          selectionGroupLabel: "Items selection",
          allItemsSelectionLabel: ({ selectedItems }) =>
            `${selectedItems.length} ${
              selectedItems.length === 1 ? "item" : "items"
            } selected`,
          itemSelectionLabel: ({ selectedItems }, item) => {
            const isItemSelected = selectedItems.filter(
              (i) => i.name === item.name
            ).length;
            return `${item.name} is ${isItemSelected ? "" : "not"} selected`;
          },
        }}
        columnDefinitions={[
          {
            id: "variable",
            header: "Customer ID",
            cell: (e) => e.name,
            sortingField: "name",
          },
          {
            id: "value",
            header: "Transaction ID",
            cell: (e) => e.alt,
            sortingField: "alt",
          },
          { id: "type", header: "Type", cell: (e) => e.type },
          {
            id: "description",
            header: "Description",
            cell: (e) => e.description,
          },
        ]}
        items={fullData}
        loadingText="Loading resources"
        selectionType="multi"
        trackBy="name"
        visibleColumns={["variable", "value", "type", "description"]}
        empty={
          <Box textAlign="center" color="inherit">
            <b>No resources</b>
            <Box padding={{ bottom: "s" }} variant="p" color="inherit">
              No resources to display.
            </Box>
            <Button>Create resource</Button>
          </Box>
        }
        filter={
          <TextFilter filteringPlaceholder="Find resources" filteringText="" />
        }
        header={
          <Header
            counter={
              selectedItems.length
                ? "(" + selectedItems.length + "/10)"
                : "(10)"
            }
          >
            Table with dummy transactions
          </Header>
        }
        pagination={
          <Pagination
            currentPageIndex={1}
            pagesCount={2}
            ariaLabels={{
              nextPageLabel: "Next page",
              previousPageLabel: "Previous page",
              pageLabel: (pageNumber) => `Page ${pageNumber} of all pages`,
            }}
          />
        }
        preferences={
          <CollectionPreferences
            title="Preferences"
            confirmLabel="Confirm"
            cancelLabel="Cancel"
            preferences={{
              pageSize: 10,
              visibleContent: ["variable", "value", "type", "description"],
            }}
            pageSizePreference={{
              title: "Select page size",
              options: [
                { value: 10, label: "10 resources" },
                { value: 20, label: "20 resources" },
              ],
            }}
            visibleContentPreference={{
              title: "Select visible content",
              options: [
                {
                  label: "Main distribution properties",
                  options: [
                    {
                      id: "variable",
                      label: "Variable name",
                      editable: true,
                    },
                    { id: "value", label: "Text value" },
                    { id: "type", label: "Type" },
                    {
                      id: "description",
                      label: "Description",
                    },
                  ],
                },
              ],
            }}
          />
        }
      />
    </div>
  );
};

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

const MainContent = () => {
  return (
    <ContentLayout header={<MainHeader />}>
      {/* <Button>Hello</Button> */}
      <OSTable />
    </ContentLayout>
  );
};

export default function Home() {
  return <AppLayout navigation={<Navigation />} content={<MainContent />} />;
}
