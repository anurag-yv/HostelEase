import React, { useState } from 'react';
import { complaintsApi } from '../api/complaintsApi';
import { BiRefresh } from 'react-icons/bi';

export const ReopenComplaintModal = ({ complaint, show, onClose, onReopened }) => {
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!show || !complaint) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (remarks.trim().length < 5) {
      setError('Please provide a specific reason for reopening (minimum 5 characters).');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await complaintsApi.reopenComplaint(complaint.id, { remarks: remarks.trim() });
      onReopened();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.remarks?.[0] ||
        err.response?.data?.error ||
        'Failed to reopen complaint. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header card-chocolate-header">
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
              <BiRefresh className="text-warning fs-4" />
              <span>Request Reopen — {complaint.complaint_number}</span>
            </h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && <div className="alert alert-danger py-2 small">{error}</div>}

              <p className="text-muted small mb-3">
                If the maintenance issue was not resolved satisfactorily or has recurred, please describe what remains to be fixed. The ticket will be re-assigned to the maintenance workbench.
              </p>

              <div className="mb-3">
                <label className="form-label fw-bold small">
                  Reason for Reopening <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="Explain why the issue is not fixed (e.g. Tap still drips when water pressure increases, switch sparks again)..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-chocolate" disabled={submitting}>
                {submitting ? 'Submitting Request...' : 'Confirm Reopen Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
