import React, { useState, useEffect } from 'react';
import { complaintsApi } from '../api/complaintsApi';
import { BiCalendar, BiTimeFive, BiInfoCircle } from 'react-icons/bi';
import { VisitTimeSelector } from './VisitTimeSelector';
import { validateVisitTime } from '../utils/visitTimeSlots';

export const RescheduleModal = ({ complaint, show, onClose, onRescheduled }) => {
  const [preferredSlot, setPreferredSlot] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (complaint) {
      setPreferredSlot(complaint.preferred_slot || '');
      setReason('');
      setError('');
    }
  }, [complaint, show]);

  if (!show || !complaint) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!preferredSlot.trim()) {
      setError('Please provide your preferred appointment date/time slot.');
      return;
    }
    const val = validateVisitTime(preferredSlot.trim());
    if (!val.valid) {
      setError(val.error);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await complaintsApi.rescheduleComplaint(complaint.id, {
        preferred_slot: preferredSlot.trim(),
        reason: reason.trim(),
      });
      onRescheduled();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.preferred_slot?.[0] ||
        err.response?.data?.error ||
        'Failed to request appointment reschedule. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header he-card-header">
            <h5 className="modal-title fw-bold fs-6 d-flex align-items-center gap-2">
              <BiCalendar className="text-warning" /> Request Different Appointment Time
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              disabled={submitting}
              aria-label="Close"
            />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-3">
              {error && <div className="alert alert-danger py-2 small">{error}</div>}

              <div className="alert alert-info py-2 small d-flex align-items-center gap-2 mb-3">
                <BiInfoCircle className="fs-5 flex-shrink-0" />
                <span>
                  Hostel staff and the assigned technician will be notified immediately of your preferred visit time.
                </span>
              </div>

              <div className="mb-3">
                <VisitTimeSelector
                  value={preferredSlot}
                  onChange={setPreferredSlot}
                  label="Preferred Appointment Date & Time"
                  placeholder="e.g. Tomorrow (10:00 AM – 12:00 PM)"
                  required
                  helperText="Choose a convenient future time slot during maintenance working hours (9:00 AM – 6:00 PM)."
                />
                {complaint.preferred_slot && (
                  <small className="text-muted d-block mt-1">
                    Current preferred time: <strong>{complaint.preferred_slot}</strong>
                  </small>
                )}
              </div>

              <div className="mb-2">
                <label className="form-label fw-bold small" htmlFor="rescheduleReasonInput">
                  Reason for Rescheduling (Optional)
                </label>
                <textarea
                  id="rescheduleReasonInput"
                  className="form-control form-control-sm"
                  rows="2"
                  placeholder="e.g. Attending lab classes during the morning / not present in room"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer py-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-sm btn-chocolate"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Update Appointment Preference'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

