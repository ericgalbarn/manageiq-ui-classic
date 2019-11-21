import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { toggleVerticalMenuCollapsed } from '../../miq-redux/menu-reducer';

const NavbarHeader = ({
  customBrand,
  imagePath,
}) => {
  const dispatch = useDispatch();
  return (
    <div className="navbar-header">
      <button className="navbar-toggle" type="button" onClick={() => dispatch(toggleVerticalMenuCollapsed())}>
        <span className="sr-only">
          {__('Toggle navigation')}
        </span>
        <span className="icon-bar" />
        <span className="icon-bar" />
        <span className="icon-bar" />
      </button>
      <a className="navbar-brand" href="/dashboard/start_url" title={__('Go to my start page')}>
        <img
          alt="ManageIQ"
          className="navbar-brand-name"
          src={customBrand ? '/upload/custom_brand.png' : imagePath}
        />
      </a>
    </div>
  );
};

NavbarHeader.propTypes = {
  customBrand: PropTypes.bool.isRequired,
  imagePath: PropTypes.string.isRequired,
};

export default NavbarHeader;
