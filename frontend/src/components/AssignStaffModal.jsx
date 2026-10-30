import React, { useState, useEffect } from 'react';
import { authApi } from '../api/authApi';
import { complaintsApi } from '../api/complaintsApi';
import { BiShieldQuarter, BiUserCheck, BiTimeFive, BiInfoCircle, BiDoorOpen, BiWrench } from 'react-icons/bi';

export const AssignStaffModal = ({ complaint, show, onClose, onAssigned }) => {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [remarks, setRemarks] = useState('');
  const [filterOnlyRequestedGender, setFilterOnlyRequestedGender] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show) {
      authApi.getStaffList()
        .then(res => setStaffList(res.data))
        .catch(() => setError('Failed to load staff list.'));
      setSelectedStaff('');
      setRemarks('');
      setError('');
      setFilterOnlyRequestedGender(true);
    }
  }, [show, complaint]);

  if (!show || !complaint) return null;

  const getRequestedGender = () => {
    if (!complaint) return null;
    const pref = complaint.preferred_worker_gender;
    if (!pref || pref === 'ANY') return null;
    if (pref === 'SAME') {
      const g = (complaint.student_gender || '').toUpperCase();
      if (g === 'MALE' || g === 'FEMALE') return g;
      return null;
    }
    return (pref || '').toUpperCase();
  };

  const requestedGender = getRequestedGender();
  const requestedGenderLabel = requestedGender === 'FEMALE' ? 'Female' : requestedGender === 'MALE' ? 'Male' : 'Same-Gender';

  const matchingStaff = requestedGender
    ? staffList.filter((s) => (s.gender || '').toUpperCase() === requestedGender)
    : staffList;

  const displayedStaff = (filterOnlyRequestedGender && requestedGender)
    ? matchingStaff
    : staffList;

  const hasSpecialAccommodations =
    complaint.require_warden_presence ||
    complaint.keep_door_open ||
    complaint.preferred_worker_gender !== 'ANY' ||
    complaint.preferred_slot ||
    complaint.custom_accommodation;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaff) {
      setError('Please select a staff member to assign.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await complaintsApi.assignStaff(complaint.id, {
        staff_id: selectedStaff,
        remarks: remarks
      });
      onAssigned();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.staff_id?.[0] || 'Assignment failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header card-chocolate-header py-2.5">
            <h5 className="modal-title fw-bold fs-6 d-flex align-items-center gap-2">
              <BiWrench className="text-warning" /> Assign Maintenance Technician — {complaint.complaint_number}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} disabled={submitting}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-3">
              {error && <div className="alert alert-danger py-2 small">{error}</div>}

              {/* Student Visit Safety & Privacy Protocols Summary */}
              <div className="card mb-3 border bg-light">
                <div className="card-header py-1.5 px-3 bg-white border-bottom d-flex align-items-center justify-content-between">
                  <span className="fw-bold small text-dark d-flex align-items-center gap-1.5">
                    <BiShieldQuarter className="text-chocolate fs-5" /> Student Visit & Privacy Preferences
                  </span>
                  <span className="badge bg-light text-dark border">
                    {complaint.hostel_block_snapshot} — Room {complaint.room_number_snapshot}
                  </span>
                </div>
                <div className="card-body p-2.5">
                  <div className="row g-2 small">
                    <div className="col-md-6">
                      <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>Resident & Gender:</span>
                      <strong className="text-dark">
                        {complaint.student_name} ({complaint.student_gender_display || complaint.student_gender || 'Not specified'})
                      </strong>
                    </div>
                    <div className="col-md-6">
                      <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>Technician Gender Preference:</span>
                      <span className={`fw-bold ${complaint.preferred_worker_gender !== 'ANY' ? 'text-primary' : 'text-dark'}`}>
                        {complaint.preferred_worker_gender_display || 'Any Qualified Staff'}
                      </span>
                    </div>

                    <div className="col-md-6">
                      <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>Preferred Appointment Slot:</span>
                      <strong className="text-dark">
                        {complaint.preferred_slot ? `🕒 ${complaint.preferred_slot}` : 'Standard / Any time'}
                      </strong>
                    </div>

                    <div className="col-md-6">
                      <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>Safety & Privacy Protocol:</span>
                      <div className="d-flex flex-wrap gap-1 mt-0.5">
                        {complaint.require_warden_presence && (
                          <span className="badge bg-warning text-dark border">
                            Warden Accompaniment Requested
                          </span>
                        )}
                        {complaint.keep_door_open && (
                          <span className="badge bg-info text-dark border">
                            Door Kept Open During Repair
                          </span>
                        )}
                        {complaint.notify_before_visit && (
                          <span className="badge bg-secondary text-white">
                            Advance Visit Notification Active
                          </span>
                        )}
                        {!complaint.require_warden_presence && !complaint.keep_door_open && !complaint.notify_before_visit && (
                          <span className="text-muted">Standard maintenance entry</span>
                        )}
                      </div>
                    </div>

                    {complaint.custom_accommodation && (
                      <div className="col-12 mt-1 pt-1 border-top">
                        <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>Alternative Location / Accommodation:</span>
                        <span className="text-dark fw-semibold">{complaint.custom_accommodation}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Warning if requested gender staff not available */}
              {requestedGender && matchingStaff.length === 0 && (
                <div className="alert alert-warning py-2 px-3 small d-flex align-items-center justify-content-between mb-3 border">
                  <div>
                    <strong>No {requestedGenderLabel} Staff Registered:</strong> Currently, no {requestedGenderLabel.toLowerCase()} maintenance technician exists in the system.
                  </div>
                  {filterOnlyRequestedGender && (
                    <button
                      type="button"
                      className="btn btn-xs btn-outline-dark py-0 px-2 fw-semibold ms-2"
                      style={{ fontSize: '0.75rem' }}
                      onClick={() => setFilterOnlyRequestedGender(false)}
                    >
                      Show All Staff
                    </button>
                  )}
                </div>
              )}

              <div className="mb-3">
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <label className="form-label fw-bold small mb-0">
                    Select Maintenance Staff <span className="text-danger">*</span>
                  </label>
                  {requestedGender && (
                    <div className="d-flex align-items-center gap-2">
                      <span className={`badge ${filterOnlyRequestedGender ? 'bg-primary-subtle text-primary border border-primary-subtle' : 'bg-light text-muted border'}`} style={{ fontSize: '0.72rem' }}>
                        {filterOnlyRequestedGender ? `Showing Only ${requestedGenderLabel} Staff (${matchingStaff.length})` : 'Showing All Staff'}
                      </span>
                      <button
                        type="button"
                        className="btn btn-link p-0 text-decoration-none small text-chocolate fw-semibold"
                        style={{ fontSize: '0.74rem' }}
                        onClick={() => setFilterOnlyRequestedGender(!filterOnlyRequestedGender)}
                      >
                        {filterOnlyRequestedGender ? 'Show all staff' : `Show only ${requestedGenderLabel}`}
                      </button>
                    </div>
                  )}
                </div>
                <select
                  className="form-select"
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  required
                >
                  <option value="">
                    {requestedGender && filterOnlyRequestedGender
                      ? `-- Choose ${requestedGenderLabel} Staff Member (${displayedStaff.length} available) --`
                      : '-- Choose Qualified Staff Member --'}
                  </option>
                  {displayedStaff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.gender_display || s.gender || 'Staff'}) — {s.email} {s.phone_number ? `(${s.phone_number})` : ''}
                    </option>
                  ))}
                </select>
                {requestedGender && filterOnlyRequestedGender && displayedStaff.length > 0 && (
                  <small className="text-muted d-block mt-1" style={{ fontSize: '0.72rem' }}>
                    Filtered to only show {requestedGenderLabel} staff as requested by the student resident.
                  </small>
                )}
              </div>

              <div className="mb-2">
                <label className="form-label fw-bold small">Assignment Instructions / Dispatch Remarks</label>
                <textarea
                  className="form-control form-control-sm"
                  rows="3"
                  placeholder="Notes for staff (e.g. Please carry 15A switch, inspect before 2 PM, ensure door remains open as requested)..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer py-2">
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-sm btn-chocolate" disabled={submitting}>
                {submitting ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
