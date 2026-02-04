import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faTimes } from '@fortawesome/free-solid-svg-icons';

const ErrorModal = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1003 }}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Error</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#ef4444', fontSize: '1.5rem' }} />
            <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{message}</p>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="modal-btn modal-btn-confirm">
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;

