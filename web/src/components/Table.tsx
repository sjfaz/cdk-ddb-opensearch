import React from "react";
import { trpc } from "../../utils/trpc";
import {
  Button,
  Header,
  Table,
  Box,
  Pagination,
  CollectionPreferences,
  TextFilter,
} from "@cloudscape-design/components";
import { Transaction } from "../../../services/core/data";

const CUSTOMER_ID = "0123"; // TODO: Enable user to set
const DEFAULT_PAGESIZE = 10;
const DEFAULT_COLUMNS = {
  customer_id: false,
  txn_id: true,
  card_number: true,
  product_code: true,
  description: true,
};

export const OSTable = () => {
  const [selectedItems, setSelectedItems] = React.useState<Transaction[]>([]);
  const [appOptions, setAppOptions] = React.useState({
    filteredText: "",
    page: 1,
    pageSize: DEFAULT_PAGESIZE,
    columns: { ...DEFAULT_COLUMNS },
  });
  const { filteredText, page, pageSize, columns } = appOptions;
  const params = { customer_id: CUSTOMER_ID, txn_id: filteredText };
  const getOrders = trpc.useQuery(["getTransactions", params]);
  const deleteTransaction = trpc.useMutation(["deleteTransaction"]);
  console.log(getOrders);
  const filteredData =
    getOrders.data?.hits.filter((item) =>
      item.txn_id.toLowerCase().includes(filteredText.toLowerCase())
    ) ?? [];
  const totalRecords = getOrders.data?.totalHits ?? 0;

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
              (i) => i.txn_id === item.txn_id
            ).length;
            return `${item.txn_id} is ${isItemSelected ? "" : "not"} selected`;
          },
        }}
        columnDefinitions={[
          {
            id: "customer_id",
            header: "Customer ID",
            cell: (e) => e.customer_id,
            // sortingField: "customer_id",
          },
          {
            id: "txn_id",
            header: "Transaction ID",
            cell: (e) => e.txn_id,
            // sortingField: "txn_id",
          },
          {
            id: "card_number",
            header: "Card Number",
            cell: (e) => e.card_number,
          },
          {
            id: "product_code",
            header: "Product Code",
            cell: (e) => <div>{e.product_code}</div>,
          },
          {
            id: "description",
            header: "Description",
            cell: (e) => `${e.description.substring(0, 50)}...`,
          },
        ]}
        items={filteredData.slice((page - 1) * pageSize, page * pageSize)}
        loadingText="Loading resources"
        selectionType="multi"
        trackBy="txn_id"
        visibleColumns={
          Object.entries(columns)
            .map((e) => (e[1] ? e[0] : null))
            .filter((e) => e !== null) as string[]
        }
        empty={
          <Box textAlign="center" color="inherit">
            <b>No resources</b>
            <Box padding={{ bottom: "s" }} variant="p" color="inherit">
              {getOrders.isLoading ? "Loading..." : "No resources to display"}
            </Box>
          </Box>
        }
        filter={
          <TextFilter
            filteringPlaceholder="Filter by transaction ID"
            filteringText={filteredText}
            onChange={(e) => {
              setSelectedItems([]);
              setAppOptions((pv) => ({
                ...pv,
                page: 1,
                filteredText: e.detail.filteringText,
              }));
            }}
          />
        }
        header={
          <Header
            counter={filteredData.length > 0 ? `(${filteredData[0].pk})` : ""}
            // actions={<Button onClick={deleteClicked}>Delete</Button>}
          >
            Transactions Table
          </Header>
        }
        pagination={
          <Pagination
            currentPageIndex={page}
            pagesCount={Math.ceil(filteredData.length / pageSize)}
            ariaLabels={{
              nextPageLabel: "Next page",
              previousPageLabel: "Previous page",
              pageLabel: (pageNumber) => `Page ${pageNumber} of all pages`,
            }}
            onChange={(e) =>
              setAppOptions((pv) => ({
                ...pv,
                page: e.detail.currentPageIndex,
              }))
            }
          />
        }
        preferences={
          <CollectionPreferences
            onConfirm={(e) => {
              console.log(e);
              setAppOptions((pv) => ({
                ...pv,
                pageSize: e.detail.pageSize ?? DEFAULT_PAGESIZE,
                columns: Object.keys(DEFAULT_COLUMNS).reduce((acc, curr) => {
                  acc[curr as keyof typeof DEFAULT_COLUMNS] =
                    e.detail.visibleContent?.includes(curr) ?? false;
                  return acc;
                }, {} as typeof DEFAULT_COLUMNS),
              }));
            }}
            title="Preferences"
            confirmLabel="Confirm"
            cancelLabel="Cancel"
            preferences={{
              pageSize: pageSize,
              visibleContent: Object.entries(columns)
                .map((e) => (e[1] ? e[0] : null))
                .filter((e) => e !== null) as string[],
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
                  label: "Columns",
                  options: Object.keys(DEFAULT_COLUMNS).map((c, i) => {
                    return {
                      id: c,
                      label: c,
                      editable: c !== "txn_id",
                    };
                  }),
                },
              ],
            }}
          />
        }
      />
      <Box padding="m">
        {selectedItems.length
          ? `${selectedItems.length} selected from ${totalRecords} records from the server`
          : totalRecords
          ? `${totalRecords} records from the server`
          : ""}
      </Box>
    </div>
  );
};

// const deleteClicked = async () => {
//   if (selectedItems.length !== 1) {
//     alert("Please select just one item to delete");
//     return;
//   }
//   await deleteTransaction.mutateAsync({
//     pk: selectedItems[0].pk,
//     sk: selectedItems[0].sk,
//   });
//   setSelectedItems([]);
//   // We need to wait until change is replicated across to OS from DDB.
//   setTimeout(() => {
//     getOrders.refetch();
//   }, 2000);
// };
