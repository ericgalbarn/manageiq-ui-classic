import React, { forwardRef } from "react";
import PropTypes from "prop-types";
import {
  SideNavItems,
  SideNavMenu,
  SideNavMenuItem,
} from "carbon-components-react/es/components/UIShell";
import { itemId, linkProps } from "./item-type";

const mapItems = (items, hideSecondary, ref, parentId) =>
  items.map((item, key) => {
    const Component = item.items.length ? MenuSection : MenuItem;

    return (
      <Component
        hideSecondary={hideSecondary}
        key={item.id}
        parentId={parentId}
        {...item}
        {...(ref && key === 0 && { ref })}
      />
    );
  });

const MenuItem = forwardRef(
  ({ active, href, id, title, type, hideSecondary, parentId }, ref) => {
    const handleClick = () => {
      if (type === "external") {
        window.open(href, "_blank", "noopener,noreferrer");
      }
    };

    // Check if this item is under the "Services" section
    const isUnderServices = parentId === "services";

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
  parentId: PropTypes.string,
};

MenuItem.defaultProps = {
  active: false,
  href: undefined,
  type: "default",
  parentId: null,
};

const MenuSection = forwardRef(
  ({ active, id, items, title, hideSecondary, parentId }, ref) => (
    <SideNavMenu
      id={itemId(id, true)}
      isActive={active}
      defaultExpanded={active} // autoexpand active section
      ref={ref}
      title={__(title)}
    >
      {mapItems(items, hideSecondary, null, id)}
    </SideNavMenu>
  )
);

MenuSection.propTypes = {
  active: PropTypes.bool,
  hideSecondary: PropTypes.func.isRequired,
  id: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PropTypes.any).isRequired,
  title: PropTypes.string.isRequired,
  parentId: PropTypes.string,
};

MenuSection.defaultProps = {
  active: false,
  parentId: null,
};

const SecondLevel = forwardRef(({ menu, hideSecondary, parentId }, ref) => (
  <SideNavItems>{mapItems(menu, hideSecondary, ref, parentId)}</SideNavItems>
));

SecondLevel.propTypes = {
  menu: PropTypes.any.isRequired,
  hideSecondary: PropTypes.func.isRequired,
  parentId: PropTypes.string,
};

SecondLevel.defaultProps = {
  parentId: null,
};

export default SecondLevel;
