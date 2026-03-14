// src/components/Menu.jsx
import React from "react";
import { Link } from "react-router-dom";
import { T } from "@tolgee/react";

export default function Menu({ open, onClose }) {
  if (!open) return null;
  return (
    <>
      <div className="menu-backdrop" onClick={onClose} />
      <div className="menu-panel">
        <ul style={{ textDecoration: "none", listStyle: "none", margin: 0, padding: 10 }}>
          <li className="menu-list-item"><Link to="/" onClick={onClose}><T keyName="nav.survey" /></Link></li>
          <li className="menu-list-item"><Link to="/metodologia" onClick={onClose}><T keyName="nav.methodology" /></Link></li>
          <li className="menu-list-item"><Link to="/contacto" onClick={onClose}><T keyName="nav.contact" /></Link></li>
          <li className="menu-list-item"><Link to="/politica-privacidad" onClick={onClose}><T keyName="nav.privacy" /></Link></li>
          <li className="menu-list-item"><Link to="/configuracion-privacidad" onClick={onClose}><T keyName="nav.privacySettings" /></Link></li>
        </ul>
      </div>
    </>
  );
}