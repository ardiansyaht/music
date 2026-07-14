// ================================================================
//  Melodia — Toast Notification Component
// ================================================================
import React from 'react';

export default function Toast({ message, icon, isVisible }) {
  return (
    <div className={`toast-notification ${isVisible ? 'visible' : ''}`}>
      {icon && <span className="toast-icon">{icon}</span>}
      <span className="toast-message">{message}</span>
    </div>
  );
}
