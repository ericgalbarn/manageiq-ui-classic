import React, { forwardRef } from "react";
import PropTypes from "prop-types";
import {
  SideNavItems,
  SideNavMenu,
  SideNavMenuItem,
} from "carbon-components-react/es/components/UIShell";
import { itemId, linkProps } from "./item-type";

const mapItems = (items, hideSecondary, ref, parentTitle) =>
  items.map((item, key) => {
    const Component = item.items.length ? MenuSection : MenuItem;

    return (
      <Component
        hideSecondary={hideSecondary}
        key={item.id}
        parentTitle={parentTitle}
        {...item}
        {...(ref && key === 0 && { ref })}
      />
    );
  });

const MenuItem = forwardRef(
  ({ active, href, id, title, type, hideSecondary, parentTitle }, ref) => {
    const handleClick = () => {
      if (type === "external") {
        window.open(href, "_blank", "noopener,noreferrer");
      }
    };

    // Check if this is part of the Services section using multiple criteria
    const isServicesSection =
      id === "services" ||
      parentTitle === "Services" ||
      id.startsWith("services_");

    return (
      <div>
        <SideNavMenuItem
          id={itemId(id)}
          isActive={active}
          ref={ref}
          onClick={handleClick}
          {...linkProps({
            type,
            href,
            id,
            hideSecondary,
          })}
        >
          {__(title)}
        </SideNavMenuItem>

        {isServicesSection && (
          <SideNavMenuItem
            href="https://console.bidimex.xplat.online/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Headlamp
          </SideNavMenuItem>
        )}
      </div>
    );
  }
);

MenuItem.propTypes = {
  active: PropTypes.bool,
  hideSecondary: PropTypes.func.isRequired,
  href: PropTypes.string,
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  type: PropTypes.string,
  parentTitle: PropTypes.string,
};

MenuItem.defaultProps = {
  active: false,
  href: undefined,
  type: "default",
  parentTitle: "",
};

const MenuSection = forwardRef(
  ({ active, id, items, title, hideSecondary, parentTitle }, ref) => (
    <SideNavMenu
      id={itemId(id, true)}
      isActive={active}
      defaultExpanded={active} // autoexpand active section
      ref={ref}
      title={__(title)}
    >
      {mapItems(items, hideSecondary, null, parentTitle)}
    </SideNavMenu>
  )
);

MenuSection.propTypes = {
  active: PropTypes.bool,
  hideSecondary: PropTypes.func.isRequired,
  id: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PropTypes.any).isRequired,
  title: PropTypes.string.isRequired,
  parentTitle: PropTypes.string,
};

MenuSection.defaultProps = {
  active: false,
  parentTitle: "",
};

const SecondLevel = forwardRef(({ menu, hideSecondary, parentTitle }, ref) => (
  <SideNavItems>{mapItems(menu, hideSecondary, ref, parentTitle)}</SideNavItems>
));

SecondLevel.propTypes = {
  menu: PropTypes.any.isRequired,
  hideSecondary: PropTypes.func.isRequired,
  parentTitle: PropTypes.string,
};

SecondLevel.defaultProps = {
  parentTitle: "",
};

export default SecondLevel;
