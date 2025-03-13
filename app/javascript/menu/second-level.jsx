import React, { forwardRef } from "react";
import PropTypes from "prop-types";
import {
  SideNavItems,
  SideNavMenu,
  SideNavMenuItem,
} from "carbon-components-react/es/components/UIShell";
import { itemId, linkProps } from "./item-type";

const mapItems = (items, hideSecondary, ref, activeSection) =>
  items.map((item, key) => {
    const Component = item.items.length ? MenuSection : MenuItem;

    return (
      <Component
        hideSecondary={hideSecondary}
        key={item.id}
        activeSection={activeSection}
        {...item}
        {...(ref && key === 0 && { ref })}
      />
    );
  });

// Add this to your second-level.jsx for temporary debugging
// Add this at the beginning of the MenuItem component function
const debugSection = () => {
  if (activeSection) {
    console.log("Active Section:", {
      id: activeSection.id,
      title: activeSection.title,
      fullObject: JSON.stringify(activeSection),
    });
  } else {
    console.log("No active section");
  }
};

// Then call it once
debugSection();

const MenuItem = forwardRef(
  ({ active, href, id, title, type, hideSecondary, activeSection }, ref) => {
    const handleClick = () => {
      if (type === "external") {
        window.open(href, "_blank", "noopener,noreferrer");
      }
    };

    // Check if the active section has title "Services"
    const isUnderServices = activeSection && activeSection.title === "Services";

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

        {/* Only render the Redirect button if under Services */}
        {isUnderServices && (
          <SideNavMenuItem
            href="http://console.kto.xplat.online/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Redirect
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
  activeSection: PropTypes.object,
};

MenuItem.defaultProps = {
  active: false,
  href: undefined,
  type: "default",
  activeSection: null,
};

const MenuSection = forwardRef(
  ({ active, id, items, title, hideSecondary, activeSection }, ref) => (
    <SideNavMenu
      id={itemId(id, true)}
      isActive={active}
      defaultExpanded={active} // autoexpand active section
      ref={ref}
      title={__(title)}
    >
      {mapItems(items, hideSecondary, null, activeSection)}
    </SideNavMenu>
  )
);

MenuSection.propTypes = {
  active: PropTypes.bool,
  hideSecondary: PropTypes.func.isRequired,
  id: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PropTypes.any).isRequired,
  title: PropTypes.string.isRequired,
  activeSection: PropTypes.object,
};

MenuSection.defaultProps = {
  active: false,
  activeSection: null,
};

const SecondLevel = forwardRef(
  ({ menu, hideSecondary, activeSection }, ref) => (
    <SideNavItems>
      {mapItems(menu, hideSecondary, ref, activeSection)}
    </SideNavItems>
  )
);

SecondLevel.propTypes = {
  menu: PropTypes.any.isRequired,
  hideSecondary: PropTypes.func.isRequired,
  activeSection: PropTypes.object,
};

SecondLevel.defaultProps = {
  activeSection: null,
};

export default SecondLevel;
