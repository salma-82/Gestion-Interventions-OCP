import React, { useState, useEffect } from 'react';

const EscalationModal = ({ isOpen, onClose, onSubmit, ticket }) => {
  const [escalationReason, setEscalationReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEscalationReason('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!escalationReason.trim()) return;

    setLoading(true);
    try {
      await onSubmit(ticket.id, escalationReason);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !ticket) return null;

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
                <i className="bi bi-arrow-up-circle-fill me-2 text-warning"></i>
                Escalader vers le Niveau 2 (Ticket #{ticket.id})
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
                <div className="alert alert-warning-subtle border-0 rounded-3 p-3 mb-3 text-warning-emphasis" style={{ fontSize: '13px', backgroundColor: '#fff3e0' }}>
                  <strong>Important:</strong> L'escalade vers N2 transfère la responsabilité opérationnelle du ticket. Ce ticket ne sera plus modifiable par votre profil N1.
                </div>
                
                <div className="mb-3">
                  <label htmlFor="escalationTextarea" className="form-label fw-semibold text-dark" style={{ fontSize: '14px' }}>
                    Motif de l'escalade / Raison technique <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="escalationTextarea"
                    className="form-control"
                    rows="4"
                    value={escalationReason}
                    onChange={(e) => setEscalationReason(e.target.value)}
                    placeholder="Saisissez la raison de l'escalade (ex: Nécessite une intervention physique sur site, panne matérielle lourde hors de portée N1)..."
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
                  className="btn btn-warning text-dark px-4 rounded-pill fw-bold"
                  disabled={loading || !escalationReason.trim()}
                  style={{ fontSize: '13px' }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Transfert...
                    </>
                  ) : (
                    'Escalader vers N2'
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

export default EscalationModal;
