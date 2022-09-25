import React from "react";
import {
  SideNavigation,
  SideNavigationProps,
} from "@cloudscape-design/components";

const SideHeader = { text: "Demo", href: "/" };
export const Navigation = () => {
  const navItems: SideNavigationProps.Item[] = [
    { type: "link", text: "OpenSearch + DDB Demo", href: "/" },
    { type: "link", text: "Analysis", href: "/analysis" },
  ];
  return (
    <>
      <SideNavigation
        items={navItems}
        header={SideHeader}
        activeHref="/"
        onFollow={(e) => console.log(e)}
      />
    </>
  );
};
