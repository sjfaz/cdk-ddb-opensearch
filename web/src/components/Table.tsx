import React from "react";
import { trpc } from "../../utils/trpc";
import {
  Header,
  Table,
  Box,
  Pagination,
  CollectionPreferences,
  PropertyFilter,
  Spinner,
  Input,
} from "@cloudscape-design/components";
import { PropertyFilterProps } from "@cloudscape-design/components/property-filter";
import { TableProps } from "@cloudscape-design/components";
import { Transaction } from "../../../services/core/data";
import { NonCancelableEventHandler } from "@cloudscape-design/components/internal/events";
import { FooterMessage } from "../components";
import {
  DEFAULT_PAGESIZE,
  DEFAULT_COLUMNS,
  FILTER_CONSTANTS,
  CUSTOMER_ID,
  getDefaultFilterProps,
  getType,
} from "./";

const DEFAULT_FILTERING_QUERY: PropertyFilterProps.Query = {
  tokens: [],
  operation: "and",
};

export const OSTable = () => {
  const [appOptions, setAppOptions] = React.useState({
    filteringQuery: DEFAULT_FILTERING_QUERY,
    page: 1,
    pageSize: DEFAULT_PAGESIZE,
    columns: { ...DEFAULT_COLUMNS },
    sortingColumn: { sortingField: "txn_datetime" },
    sortingDescending: true,
    customerId: CUSTOMER_ID,
  });
  const {
    page,
    pageSize,
    columns,
    filteringQuery,
    sortingColumn,
    sortingDescending,
    customerId,
  } = appOptions;
  const params = {
    customer_id: customerId,
    search_fields: filteringQuery.tokens.map((token) => ({
      key: token.propertyKey!,
      value: token.value,
    })),
    operator: filteringQuery.operation === "and" ? "must" : "should",
    sorting: {
      column: sortingColumn.sortingField,
      descending: sortingDescending ? "desc" : "asc",
      isNumber: getType(sortingColumn.sortingField),
    },
  };
  const getTransactions = trpc.useQuery(["getTransactions", params]);

  const filteredData = getTransactions.data?.hits ?? [];
  const totalRecords = getTransactions.data?.totalHits ?? 0;
  const performanceData = getTransactions.data
    ? `OpenSearch took: ${getTransactions.data?.took}ms, shards scanned: ${getTransactions.data?.shards}`
    : "";

  const cols: TableProps.ColumnDefinition<Transaction>[] = Object.keys(
    DEFAULT_COLUMNS
  ).map((key) => ({
    id: key,
    header: DEFAULT_COLUMNS[key].label,
    cell: (transactionRecord) => {
      const { limitLength } = DEFAULT_COLUMNS[key];
      if (limitLength) {
        const val = transactionRecord[key as keyof Transaction] as string;
        return `${val.substring(0, limitLength)}...`;
      }
      return transactionRecord[key as keyof Transaction];
    },
    sortingField: key,
  }));

  const handleSortingChange = (args: any) => {
    setAppOptions((prev) => ({
      ...prev,
      page: 1,
      sortingColumn: args.detail.sortingColumn,
      sortingDescending: args.detail.isDescending,
    }));
  };

  const handlePropertyFilteringChange: NonCancelableEventHandler<
    PropertyFilterProps.Query
  > = (args) => {
    if (args.detail.tokens.some((token) => token.propertyKey === undefined)) {
      alert("Please select a property");
      return;
    }
    setAppOptions((prev) => ({
      ...prev,
      filteringQuery: args.detail,
      page: 1,
    }));
  };

  return (
    <div>
      <Table
        columnDefinitions={cols}
        items={filteredData.slice((page - 1) * pageSize, page * pageSize)}
        loadingText="Loading resources"
        trackBy="txn_id"
        sortingColumn={sortingColumn}
        sortingDescending={sortingDescending}
        onSortingChange={handleSortingChange}
        variant="full-page"
        stickyHeader={true}
        resizableColumns={true}
        visibleColumns={
          Object.entries(columns)
            .map((column) => (column[1].visible ? column[0] : null))
            .filter((column) => column !== null) as string[]
        }
        empty={
          <Box textAlign="center" color="inherit">
            <b>No resources</b>
            <Box padding={{ bottom: "s" }} variant="p" color="inherit">
              {getTransactions.isLoading ? (
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
          <PropertyFilter
            query={filteringQuery}
            i18nStrings={FILTER_CONSTANTS}
            filteringProperties={getDefaultFilterProps(columns)}
            onChange={handlePropertyFilteringChange}
            expandToViewport={true}
          />
        }
        header={
          <Header counter={`(CUST#${customerId})`}>Transactions Table</Header>
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
                page: 1,
                customerId: e.detail.custom ?? customerId,
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
                { value: 10, label: "10 records" },
                { value: 20, label: "20 records" },
                { value: 30, label: "30 records" },
              ],
            }}
            customPreference={(customValue, setCustomValue) => (
              <>
                <Box variant="div" margin={{ vertical: "xs" }}>
                  <strong>Customer ID (Number between 0000 and 0999)</strong>
                </Box>
                <Input
                  value={customValue ?? customerId}
                  onChange={({ detail }: any) => {
                    if (detail.value.length < 5 && !isNaN(detail.value)) {
                      return setCustomValue(detail.value);
                    }
                  }}
                />
              </>
            )}
            visibleContentPreference={{
              title: "Select visible content",
              options: [
                {
                  label: "Columns",
                  options: Object.keys(DEFAULT_COLUMNS).map((column_key) => {
                    return {
                      id: column_key,
                      label: column_key,
                      editable: column_key !== "txn_id",
                    };
                  }),
                },
              ],
            }}
          />
        }
      />
      <FooterMessage
        message={`${totalRecords} records from the server. ${performanceData}`}
      />
    </div>
  );
};
