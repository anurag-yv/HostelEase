import React, { useState } from 'react';
import { complaintsApi } from '../api/complaintsApi';
import { BiStar } from 'react-icons/bi';

export const FeedbackModal = ({ complaint, show, onClose, onSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!show || !complaint) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await complaintsApi.submitFeedback(complaint.id, { rating, comment });
      onSubmitted();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.rating?.[0] || 'Feedback submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header card-chocolate-header">
            <h5 className="modal-title fw-bold">Feedback — {complaint.complaint_number}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body text-center">
              {error && <div className="alert alert-danger py-2 small">{error}</div>}

              <h6 className="fw-bold mb-3">How satisfied are you with the resolution?</h6>

              {/* Star Rating Selector */}
              <div className="d-flex justify-content-center gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`btn btn-lg ${rating >= star ? 'btn-warning' : 'btn-outline-secondary'}`}
                    onClick={() => setRating(star)}
                    style={{ fontSize: '1.5rem', width: '50px', height: '50px', padding: 0 }}
                  >
                    ★
                  </button>
                ))}
              </div>
              <p className="text-muted small fw-semibold mb-2">
                Selected Rating: {rating} of 5 Stars
              </p>
              <div className="alert alert-info py-1.5 px-2 small mb-3 text-start" style={{ fontSize: '0.78rem' }}>
                ℹ️ <strong>Note:</strong> Submitting feedback officially closes this complaint. Once closed, the status is permanently finalized and no further changes can be made.
              </div>

              <div className="text-start mb-3">
                <label className="form-label fw-bold">Comments or Remarks (Optional)</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Share your thoughts on timeliness, quality of work, and staff conduct..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-chocolate fw-bold" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Feedback & Close Ticket'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
