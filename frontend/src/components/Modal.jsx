import React from 'react';

const Modal = ({ title, onClose, children, width = 520 }) => {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal" style={{ maxWidth: width }}>
        <div className="modal__header">
          <h3>{title}</h3>
          <button type="button" className="ghost" onClick={onClose} aria-label="Close modal">✕</button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
