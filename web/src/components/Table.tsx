import React from "react";
import { trpc } from "../../utils/trpc";
import {
  // Button,
  Header,
  Table,
  Box,
  Pagination,
  CollectionPreferences,
  TextFilter,
  Spinner,
} from "@cloudscape-design/components";
import { Transaction } from "../../../services/core/data";

const CUSTOMER_ID = "0123"; // TODO: Enable user to set
const DEFAULT_PAGESIZE = 10;
type colState = { visible: boolean; limitLength?: number };
const DEFAULT_COLUMNS: { [key: string]: colState } = {
  customer_id: { visible: false },
  txn_id: { visible: true },
  card_number: { visible: true },
  full_card_number: { visible: true },
  product_code: { visible: true },
  product_name: { visible: true },
  product_quantity: { visible: true },
  txn_datetime: { visible: true },
  site_name: { visible: true },
  original_gross_value: { visible: true },
  description: { visible: true, limitLength: 50 },
};

export const OSTable = () => {
  const [appOptions, setAppOptions] = React.useState({
    filteredText: "",
    page: 1,
    pageSize: DEFAULT_PAGESIZE,
    columns: { ...DEFAULT_COLUMNS },
  });
  const { filteredText, page, pageSize, columns } = appOptions;
  const params = {
    customer_id: CUSTOMER_ID,
    search_fields: [
      { key: "txn_id", value: filteredText },
      { key: "customer_id", value: "0123" },
    ],
  };
  const getOrders = trpc.useQuery(["getTransactions", params]);
  console.log(getOrders);
  const filteredData =
    getOrders.data?.hits.filter((item) =>
      item.txn_id.toLowerCase().includes(filteredText.toLowerCase())
    ) ?? [];
  const totalRecords = getOrders.data?.totalHits ?? 0;

  return (
    <div>
      <Table
        columnDefinitions={Object.keys(DEFAULT_COLUMNS).map((key) => ({
          id: key,
          header: key,
          cell: (e: any) => {
            const { limitLength } = DEFAULT_COLUMNS[key];
            if (limitLength) {
              return `${e[key].substring(0, limitLength)}...`;
            }
            return e[key];
          },
          sortingField: key,
        }))}
        items={filteredData.slice((page - 1) * pageSize, page * pageSize)}
        loadingText="Loading resources"
        trackBy="txn_id"
        visibleColumns={
          Object.entries(columns)
            .map((e) => (e[1].visible ? e[0] : null))
            .filter((e) => e !== null) as string[]
        }
        empty={
          <Box textAlign="center" color="inherit">
            <b>No resources</b>
            <Box padding={{ bottom: "s" }} variant="p" color="inherit">
              {getOrders.isLoading ? (
                <>
                  <Spinner />
                  Loading...
                </>
              ) : (
                "No resources to display"
              )}
            </Box>
          </Box>
        }
        filter={
          <TextFilter
            filteringPlaceholder="Filter by transaction ID"
            filteringText={filteredText}
            onChange={(e) => {
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
                  acc[curr] = {
                    ...DEFAULT_COLUMNS[curr],
                    visible: e.detail.visibleContent?.includes(curr) ?? false,
                  };
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
                .map((e) => (e[1].visible ? e[0] : null))
                .filter((e) => e !== null) as string[],
            }}
            pageSizePreference={{
              title: "Select page size",
              options: [
                { value: 10, label: "10 resources" },
                { value: 20, label: "20 resources" },
                { value: 30, label: "30 resources" },
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
      <Box padding="m">{totalRecords} records from the server.</Box>
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
