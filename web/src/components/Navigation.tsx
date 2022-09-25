import React from "react";
import {
  SideNavigation,
  SideNavigationProps,
} from "@cloudscape-design/components";

const SideHeader = { text: "Demo", href: "/" };

interface NavigationProps extends SideNavigationProps {
  activeHref: string;
}

export const Navigation = (props: NavigationProps) => {
  const navItems: SideNavigationProps.Item[] = [
    {
      type: "link",
      text: "OpenSearch Demo",
      href: "/",
      // info: <div>Test</div>
    },
    { type: "link", text: "Analysis", href: "/analysis" },
  ];
  return (
    <>
      <SideNavigation
        items={navItems}
        header={SideHeader}
        activeHref={props.activeHref}
        onFollow={(e) => console.log(e)}
      />
    </>
  );
};
