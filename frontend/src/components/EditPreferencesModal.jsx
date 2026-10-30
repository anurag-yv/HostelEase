import React, { useState, useEffect } from 'react';
import { complaintsApi } from '../api/complaintsApi';
import { BiShieldQuarter, BiUserCheck, BiTimeFive, BiInfoCircle } from 'react-icons/bi';
import { VisitTimeSelector } from './VisitTimeSelector';
import { validateVisitTime } from '../utils/visitTimeSlots';

export const EditPreferencesModal = ({ complaint, show, onClose, onUpdated }) => {
  const [formData, setFormData] = useState({
    preferred_worker_gender: 'ANY',
    require_warden_presence: false,
    keep_door_open: false,
    preferred_slot: '',
    custom_accommodation: '',
    notify_before_visit: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (complaint && show) {
      setFormData({
        preferred_worker_gender: complaint.preferred_worker_gender || 'ANY',
        require_warden_presence: !!complaint.require_warden_presence,
        keep_door_open: !!complaint.keep_door_open,
        preferred_slot: complaint.preferred_slot || '',
        custom_accommodation: complaint.custom_accommodation || '',
        notify_before_visit: complaint.notify_before_visit ?? true,
      });
      setError('');
    }
  }, [complaint, show]);

  if (!show || !complaint) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.preferred_slot && formData.preferred_slot.trim()) {
      const val = validateVisitTime(formData.preferred_slot.trim());
      if (!val.valid) {
        setError(val.error);
        return;
      }
    }
    setSubmitting(true);
    setError('');

    try {
      await complaintsApi.updatePreferences(complaint.id, formData);
      onUpdated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update preferences.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header he-card-header py-2.5">
            <h5 className="modal-title fw-bold fs-6 d-flex align-items-center gap-2">
              <BiShieldQuarter className="text-warning" /> Update Visit, Staff & Accompaniment Preferences
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} disabled={submitting}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-3">
              {error && <div className="alert alert-danger py-2 small">{error}</div>}

              <div className="alert alert-info py-2 small d-flex align-items-center gap-2 mb-3">
                <BiInfoCircle className="fs-5 flex-shrink-0" />
                <span>
                  You can update your visit and staff preferences anytime while your complaint is <strong>Pending</strong> before staff assignment.
                </span>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold small d-flex align-items-center gap-1" htmlFor="editWorkerGender">
                    <BiUserCheck className="text-chocolate" /> Preferred Technician Gender
                  </label>
                  <select
                    id="editWorkerGender"
                    name="preferred_worker_gender"
                    className="form-select form-select-sm"
                    value={formData.preferred_worker_gender}
                    onChange={handleChange}
                  >
                    <option value="ANY">No Preference (Any Qualified Staff)</option>
                    <option value="SAME">Same-Gender Staff Only</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <VisitTimeSelector
                    value={formData.preferred_slot}
                    onChange={(val) => setFormData(prev => ({ ...prev, preferred_slot: val }))}
                    label="Preferred Appointment Slot"
                    placeholder="e.g. Tomorrow (10:00 AM – 12:00 PM)"
                    helperText="Strictly 9:00 AM – 6:00 PM. No past times."
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold small" htmlFor="editAccommodation">
                  Alternative Location or Other Reasonable Accommodation
                </label>
                <input
                  id="editAccommodation"
                  type="text"
                  name="custom_accommodation"
                  className="form-control form-control-sm"
                  placeholder="e.g. Can bring portable appliance to hostel reception / wheelchair access required"
                  value={formData.custom_accommodation}
                  onChange={handleChange}
                />
              </div>

              <div className="bg-light p-3 rounded border">
                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="editRequireWarden"
                    name="require_warden_presence"
                    checked={formData.require_warden_presence}
                    onChange={handleChange}
                  />
                  <label className="form-check-label small fw-semibold" htmlFor="editRequireWarden">
                    Request a hostel warden or authorized staff member to accompany the worker
                  </label>
                </div>

                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="editKeepDoorOpen"
                    name="keep_door_open"
                    checked={formData.keep_door_open}
                    onChange={handleChange}
                  />
                  <label className="form-check-label small fw-semibold" htmlFor="editKeepDoorOpen">
                    Perform repair with room door open (where safe & permitted)
                  </label>
                </div>

                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="editNotifyBeforeVisit"
                    name="notify_before_visit"
                    checked={formData.notify_before_visit}
                    onChange={handleChange}
                  />
                  <label className="form-check-label small fw-semibold" htmlFor="editNotifyBeforeVisit">
                    Notify me in advance before the maintenance technician arrives
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-footer py-2">
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-sm btn-chocolate" disabled={submitting}>
                {submitting ? 'Saving Changes...' : 'Save Preferences'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
