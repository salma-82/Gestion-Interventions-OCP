import React, { useState, useEffect } from 'react';

const InterventionModal = ({ isOpen, onClose, onSubmit, ticketId }) => {
  const [actionText, setActionText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActionText('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!actionText.trim()) return;

    setLoading(true);
    try {
      await onSubmit(ticketId, actionText);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="modal-backdrop show" onClick={onClose} style={{ zIndex: 1050 }}></div>
      
      {/* Modal */}
      <div 
        className="modal show d-block n1-modal" 
        tabIndex="-1" 
        style={{ zIndex: 1060, top: '15%' }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content shadow-lg border-0 rounded-4">
            <div className="modal-header bg-dark text-white border-0 py-3">
              <h5 className="modal-title fw-bold">
                <i className="bi bi-chat-right-text-fill me-2 text-info"></i>
                Ajouter une Action à Distance (Ticket #{ticketId})
              </h5>
              <button 
                type="button" 
                className="btn-close btn-close-white" 
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body p-4">
                <p className="text-secondary" style={{ fontSize: '13px' }}>
                  Saisissez les actions correctives ou le diagnostic réalisé à distance sur cet équipement.
                </p>
                <div className="mb-3">
                  <label htmlFor="actionTextarea" className="form-label fw-semibold text-dark" style={{ fontSize: '14px' }}>
                    Description de l'action à distance <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="actionTextarea"
                    className="form-control"
                    rows="4"
                    value={actionText}
                    onChange={(e) => setActionText(e.target.value)}
                    placeholder="Ex: Redémarrage de l'automate de contrôle à distance, vérification des logs de connexion..."
                    required
                    style={{ fontSize: '14px' }}
                  ></textarea>
                </div>
              </div>
              
              <div className="modal-footer bg-light border-0 py-3">
                <button 
                  type="button" 
                  className="btn btn-secondary px-4 rounded-pill" 
                  onClick={onClose}
                  style={{ fontSize: '13px' }}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="btn btn-info text-white px-4 rounded-pill fw-semibold"
                  disabled={loading || !actionText.trim()}
                  style={{ fontSize: '13px' }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Enregistrement...
                    </>
                  ) : (
                    'Enregistrer l\'action'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default InterventionModal;