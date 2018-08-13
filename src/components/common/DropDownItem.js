import React, { Component } from 'react';

export default function CustomComponent(props) {
  const { onClick, children } = props
  return (
    <li className="list-group-item" onClick={onClick}>
      {children}
    </li>
  );
}
