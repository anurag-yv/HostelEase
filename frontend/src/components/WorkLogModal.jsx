import React, { useState } from 'react';
import { complaintsApi } from '../api/complaintsApi';

export const WorkLogModal = ({ complaint, show, onClose, onLogged }) => {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!show || !complaint) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please enter a progress update message.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      await complaintsApi.addWorkLog(complaint.id, { progress_message: message });
      onLogged();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.progress_message?.[0] || 'Failed to add work log.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header card-chocolate-header">
            <h5 className="modal-title fw-bold">Log Maintenance Progress — {complaint.complaint_number}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && <div className="alert alert-danger py-2 small">{error}</div>}

              <div className="mb-3">
                <label className="form-label fw-bold">Work Update / Actions Taken <span className="text-danger">*</span></label>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="e.g. Inspected electric board, purchased 16A replacement switch, scheduled power shutdown for 15 mins..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-chocolate" disabled={submitting}>
                {submitting ? 'Saving Log...' : 'Post Progress Log'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
