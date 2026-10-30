import React, { useState } from 'react';
import { complaintsApi } from '../api/complaintsApi';
import { BiXCircle, BiInfoCircle } from 'react-icons/bi';

export const WithdrawComplaintModal = ({ complaint, show, onClose, onWithdrawn }) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!show || !complaint) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await complaintsApi.withdrawComplaint(complaint.id, { reason: reason.trim() });
      onWithdrawn();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to withdraw complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header bg-danger text-white py-2.5">
            <h5 className="modal-title fw-bold fs-6 d-flex align-items-center gap-2">
              <BiXCircle className="fs-5" /> Take Back / Withdraw Complaint
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} disabled={submitting}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-3">
              {error && <div className="alert alert-danger py-2 small">{error}</div>}

              <div className="alert alert-warning py-2 small d-flex align-items-start gap-2 mb-3">
                <BiInfoCircle className="fs-5 flex-shrink-0 mt-0.5" />
                <span>
                  Are you sure you want to withdraw <strong>{complaint.complaint_number}</strong> ({complaint.title})? This will cancel the maintenance request before technician dispatch.
                </span>
              </div>

              <div className="mb-2">
                <label className="form-label fw-bold small" htmlFor="withdrawReason">
                  Reason for Withdrawing (Optional)
                </label>
                <textarea
                  id="withdrawReason"
                  className="form-control form-control-sm"
                  rows="3"
                  placeholder="e.g. Problem fixed on its own, duplicate issue reported, or resolved by roommate..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer py-2">
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose} disabled={submitting}>
                Keep Complaint Active
              </button>
              <button type="submit" className="btn btn-sm btn-danger fw-semibold" disabled={submitting}>
                {submitting ? 'Withdrawing...' : 'Confirm Withdrawal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
