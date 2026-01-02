import React from 'react';

const Spinner = ({ label = 'Loading...' }) => (
  <div className="spinner-wrap">
    <div className="spinner" />
    <span>{label}</span>
  </div>
);

export default Spinner;
