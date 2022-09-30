import { PropertyFilterProps } from "@cloudscape-design/components/property-filter";

export const CUSTOMER_ID = "0123"; // TODO: Enable user to set
export const DEFAULT_PAGESIZE = 10;
type colState = { visible: boolean; limitLength?: number; label: string };
type colStates = { [key: string]: colState };

export const DEFAULT_COLUMNS: colStates = {
  customer_id: { visible: false, label: "Customer ID" },
  txn_id: { visible: true, label: "Transaction ID" },
  card_number: { visible: true, label: "Card Number" },
  full_card_number: { visible: true, label: "Full Card Number" },
  product_code: { visible: true, label: "Product Code" },
  product_name: { visible: true, label: "Product Name" },
  product_quantity: { visible: true, label: "Product Quantity" },
  txn_datetime: { visible: true, label: "Transaction Date" },
  site_name: { visible: true, label: "Site Name" },
  original_gross_value: { visible: true, label: "Original Gross Value" },
  description: { visible: true, limitLength: 50, label: "Description" },
};

// TODO: Consider how we want to search numbers.
const excludedColumns = [
  "customer_id",
  "original_gross_value",
  "product_quantity",
];
export const getDefaultFilterProps = (columns: colStates) => {
  const filterProps: PropertyFilterProps.FilteringProperty[] = [];
  for (const [key, value] of Object.entries(columns)) {
    if (value.visible && !excludedColumns.includes(key)) {
      filterProps.push({
        key: key,
        propertyLabel: value.label,
        groupValuesLabel: value.label,
        operators: [":"],
        defaultOperator: ":",
      });
    }
  }
  return filterProps;
};

export const FILTER_CONSTANTS = {
  filteringAriaLabel: "your choice",
  dismissAriaLabel: "Dismiss",
  filteringPlaceholder: "Search",
  groupValuesText: "Values",
  groupPropertiesText: "Properties",
  operatorsText: "Operators",
  operationAndText: "and",
  operationOrText: "or",
  operatorLessText: "Less than",
  operatorLessOrEqualText: "Less than or equal",
  operatorGreaterText: "Greater than",
  operatorGreaterOrEqualText: "Greater than or equal",
  operatorContainsText: "Contains",
  operatorDoesNotContainText: "Does not contain",
  operatorEqualsText: "Equals",
  operatorDoesNotEqualText: "Does not equal",
  editTokenHeader: "Edit filter",
  propertyText: "Property",
  operatorText: "Operator",
  valueText: "Value",
  cancelActionText: "Cancel",
  applyActionText: "Apply",
  allPropertiesLabel: "All properties",
  tokenLimitShowMore: "Show more",
  tokenLimitShowFewer: "Show fewer",
  clearFiltersText: "Clear filters",
  removeTokenButtonAriaLabel: () => "Remove token",
  enteredTextLabel: (text: string) => `Use: "${text}"`,
};
