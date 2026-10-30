import React, { useState, useEffect } from 'react';
import { complaintsApi } from '../api/complaintsApi';
import { BiTimeFive, BiCheckCircle, BiErrorCircle, BiSend, BiShieldQuarter } from 'react-icons/bi';
import { getFutureVisitSuggestions, validateVisitTime, WORK_HOURS } from '../utils/visitTimeSlots';

export const UpdateStatusModal = ({ complaint, userRole, show, onClose, onUpdated }) => {
  const [status, setStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [showChangeTime, setShowChangeTime] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (show && complaint) {
      // Default to logical next status
      if (complaint.status === 'PENDING') {
        setStatus('ASSIGNED');
      } else if (complaint.status === 'ASSIGNED') {
        setStatus('IN_PROGRESS');
      } else if (complaint.status === 'IN_PROGRESS') {
        setStatus('RESOLVED');
      } else if (complaint.status === 'RESOLVED') {
        setStatus(userRole === 'STAFF' ? 'RESOLVED' : 'IN_PROGRESS');
      } else {
        setStatus('PENDING');
      }
      setRemarks('');
      const initialTime = complaint.status === 'RESOLVED' ? '' : (complaint.estimated_visit_time || '');
      setEstimatedTime(initialTime);
      setShowChangeTime(!initialTime);
      setScheduleSuccess('');
      setError('');
      setSuggestions(getFutureVisitSuggestions());
    }
  }, [show, complaint, userRole]);

  if (!show || !complaint) return null;

  const handleScheduleVisit = async (e) => {
    e.preventDefault();
    if (!estimatedTime.trim()) {
      setError('Please mention by what time you can come.');
      return;
    }
    const val = validateVisitTime(estimatedTime.trim());
    if (!val.valid) {
      setError(val.error);
      return;
    }
    setScheduling(true);
    setError('');
    try {
      await complaintsApi.scheduleVisit(complaint.id, {
        estimated_visit_time: estimatedTime.trim()
      });
      complaint.estimated_visit_time = estimatedTime.trim();
      setScheduleSuccess(`Arrival time sent to resident! Resident notified: "${estimatedTime.trim()}".`);
      setShowChangeTime(false);
      onUpdated();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.estimated_visit_time?.[0] || 'Failed to send visit time.');
    } finally {
      setScheduling(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (estimatedTime.trim()) {
      const val = validateVisitTime(estimatedTime.trim());
      if (!val.valid) {
        setError(val.error);
        return;
      }
    }
    setSubmitting(true);
    setError('');

    try {
      await complaintsApi.updateStatus(complaint.id, {
        status,
        remarks,
        ...(userRole === 'STAFF' && estimatedTime.trim() ? { estimated_visit_time: estimatedTime.trim() } : {})
      });
      onUpdated();
      onClose();
    } catch (err) {
      const errMsg = err.response?.data?.error ||
        err.response?.data?.status?.[0] ||
        err.response?.data?.remarks?.[0] ||
        'Failed to update status.';
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const isClosedAndLocked = complaint.status === 'CLOSED' || complaint.has_feedback;
  const isReopening = ['PENDING', 'IN_PROGRESS'].includes(status) && ['RESOLVED', 'CLOSED'].includes(complaint.status);
  const isPendingScheduling = !complaint.visit_approved && ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(complaint.status);
  const isStaffBlockedByApproval = userRole === 'STAFF' && !complaint.visit_approved && (
    (['PENDING', 'ASSIGNED'].includes(complaint.status) && ['IN_PROGRESS', 'RESOLVED'].includes(status)) ||
    (complaint.status === 'IN_PROGRESS' && status === 'RESOLVED')
  );

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header card-chocolate-header py-2.5">
            <h5 className="modal-title fw-bold fs-6">Update Status — {complaint.complaint_number}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} disabled={submitting || scheduling}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-3">
              {error && <div className="alert alert-danger py-2 small">{error}</div>}
              {scheduleSuccess && <div className="alert alert-success py-2 small d-flex align-items-center gap-1.5"><BiCheckCircle className="fs-5" /> {scheduleSuccess}</div>}

              {/* Closed & Finalized Notice */}
              {isClosedAndLocked && (
                <div className="alert alert-secondary py-2.5 small mb-3 border d-flex align-items-center gap-2">
                  <span className="fs-5">🔒</span>
                  <div>
                    <strong>Ticket Closed & Finalized:</strong> Resident feedback has been submitted. This complaint is permanently closed and cannot be modified or reopened by staff or administration.
                  </div>
                </div>
              )}

              {/* Current Status & Complaint Info */}
              <div className="row g-2 mb-3 bg-light p-2.5 rounded border small">
                <div className="col-md-3">
                  <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>Current Status:</span>
                  <span className="badge bg-secondary">{complaint.status}</span>
                </div>
                <div className="col-md-3">
                  <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>Location:</span>
                  <strong className="text-dark">{complaint.hostel_block_snapshot} — Room {complaint.room_number_snapshot}</strong>
                </div>
                <div className="col-md-3">
                  <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>Student Resident:</span>
                  <strong className="text-dark">{complaint.student_name}</strong>
                </div>
                <div className="col-md-3">
                  <span className="text-muted d-block" style={{ fontSize: '0.72rem' }}>Resident Preferred Time:</span>
                  <span className="text-chocolate fw-bold d-flex align-items-center gap-1">
                    <BiTimeFive /> {complaint.preferred_slot || 'Standard / Any'}
                  </span>
                </div>
              </div>

              {/* Staff-Only: Visit Arrival Time Specification Section - Only when pending scheduling/assigned */}
              {userRole === 'STAFF' && isPendingScheduling && (
                <div className="card mb-3 border border-warning-subtle bg-warning-subtle bg-opacity-10">
                  <div className="card-body p-3">
                    {/* Show Resident's Preferred Time prominently to staff */}
                    <div className="p-2.5 bg-white border border-chocolate rounded mb-2.5 d-flex align-items-center justify-content-between flex-wrap gap-2">
                      <div>
                        <span className="text-muted small d-block" style={{ fontSize: '0.72rem' }}>
                          Resident's Preferred Appointment Slot:
                        </span>
                        <strong className="text-chocolate d-flex align-items-center gap-1.5" style={{ fontSize: '0.85rem' }}>
                          <BiTimeFive className="fs-5" /> {complaint.preferred_slot || 'No specific slot requested (Standard / Any time)'}
                        </strong>
                      </div>
                      {complaint.preferred_slot && (!complaint.estimated_visit_time || showChangeTime) && (
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-chocolate py-1 px-2"
                          onClick={() => setEstimatedTime(complaint.preferred_slot)}
                          title="Click to copy resident's preferred time"
                        >
                          Use Resident's Slot
                        </button>
                      )}
                    </div>

                    {/* Persistent Notification Banner if arrival time has been sent */}
                    {((complaint.estimated_visit_time && complaint.status !== 'RESOLVED') || scheduleSuccess) ? (
                      <div className="alert alert-success border border-success py-2.5 px-3 mb-2 shadow-xs">
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                          <div className="d-flex align-items-center gap-2">
                            <BiCheckCircle className="fs-4 text-success flex-shrink-0" />
                            <div>
                              <div className="fw-bold text-success-emphasis">
                                Arrival time sent to resident! Resident notified: "{complaint.estimated_visit_time || estimatedTime}"
                              </div>
                              <small className="text-muted d-block mt-0.5">
                                {complaint.visit_approved ? (
                                  <span className="text-success fw-bold">
                                    ✓ Resident confirmed: "You can come". You are authorized to begin work.
                                  </span>
                                ) : (
                                  <span>
                                    Resident has been notified. Waiting for student to accept / click "Approve Visit". You do not need to repeat this.
                                  </span>
                                )}
                              </small>
                            </div>
                          </div>
                          {!complaint.visit_approved && (
                            <button
                              type="button"
                              className="btn btn-xs btn-outline-secondary"
                              onClick={() => setShowChangeTime(prev => !prev)}
                            >
                              {showChangeTime ? 'Cancel Change' : '✏️ Change Proposed Time'}
                            </button>
                          )}
                        </div>
                      </div>
                    ) : null}

                    {/* Time Selection Form (Shown only if no time is sent yet OR staff clicks "Change Proposed Time") */}
                    {(!complaint.estimated_visit_time || showChangeTime) && (
                      <div className="p-2.5 bg-white border rounded">
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-1.5">
                          <label className="form-label fw-bold small text-dark mb-0 d-flex align-items-center gap-1.5">
                            <BiTimeFive className="text-chocolate fs-5" /> Mention by what time you can come:
                          </label>
                          <span className="badge bg-light text-muted border">
                            Working Hours: {WORK_HOURS.label}
                          </span>
                        </div>

                        <p className="small text-muted mb-2" style={{ fontSize: '0.76rem' }}>
                          Specify your arrival window so the student can review and confirm "You Can Come" before you enter the room.
                        </p>

                        <div className="input-group input-group-sm mb-2">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. Tomorrow (10:00 AM – 12:00 PM)"
                            value={estimatedTime}
                            onChange={(e) => setEstimatedTime(e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn btn-chocolate d-flex align-items-center gap-1"
                            onClick={handleScheduleVisit}
                            disabled={scheduling || submitting || !estimatedTime.trim()}
                          >
                            <BiSend /> {scheduling ? 'Sending...' : 'Notify Student of Arrival Time'}
                          </button>
                        </div>

                        {/* Suggestion Chips - Strictly Future, Strictly 9 AM to 6 PM */}
                        <div className="d-flex flex-wrap gap-1 align-items-center">
                          <span className="small text-muted me-1" style={{ fontSize: '0.72rem' }}>Future slots (9 AM - 6 PM):</span>
                          {suggestions.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              className={`btn btn-xs py-0.5 px-2 rounded-pill ${
                                estimatedTime === slot ? 'btn-chocolate' : 'btn-outline-secondary bg-white'
                              }`}
                              style={{ fontSize: '0.7rem' }}
                              onClick={() => setEstimatedTime(slot)}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status Selection */}
              <div className="mb-3">
                <label className="form-label fw-bold small">New Status <span className="text-danger">*</span></label>
                <select
                  className="form-select form-select-sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  required
                >
                  {userRole === 'STAFF' ? (
                    <>
                      <option value="IN_PROGRESS">In Progress (Work started)</option>
                      <option value="RESOLVED">Resolved (Maintenance completed)</option>
                    </>
                  ) : (
                    <>
                      <option value="PENDING">Pending (Reset / Unassign)</option>
                      <option value="ASSIGNED">Assigned</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                    </>
                  )}
                </select>
              </div>

              {/* Admin Pending Reset Notice */}
              {userRole === 'ADMIN' && status === 'PENDING' && (
                <div className="alert alert-warning py-2 small mb-3">
                  ↩️ <strong>Pending (Reset):</strong> Changing status to Pending unassigns the currently assigned technician and returns this ticket to the unassigned queue for fresh assignment.
                </div>
              )}

              {/* Visit Approval Alert for Staff */}
              {userRole === 'STAFF' && isPendingScheduling && ['IN_PROGRESS', 'RESOLVED'].includes(status) && (
                <div className="alert alert-warning py-2 small mb-3">
                  ⚠️ <strong>Visit Entry Not Approved Yet:</strong> You cannot update status to {status === 'IN_PROGRESS' ? 'In Progress' : 'Resolved / Completed'} until the student resident approves that you can come. Please specify your arrival time above and click <em>"Notify Student of Arrival Time"</em> so the resident can confirm.
                </div>
              )}

              {/* Reopening from Resolved Notice */}
              {complaint.status === 'RESOLVED' && status === 'IN_PROGRESS' && (
                <div className="alert alert-warning py-2 small mb-3 d-flex align-items-center gap-2">
                  <BiTimeFive className="fs-5 text-warning flex-shrink-0" />
                  <span>
                    🔄 <strong>Reopening to In Progress:</strong> Reopening this resolved ticket resets technician arrival time and visit authorization. Staff will be asked to propose their arrival time again and the student resident must approve room entry before work can be marked resolved.
                  </span>
                </div>
              )}

              {/* Admin Notice for Admin */}
              {userRole === 'ADMIN' && status === 'IN_PROGRESS' && complaint.status !== 'RESOLVED' && !complaint.visit_approved && (
                <div className="alert alert-info py-2 small mb-3">
                  🛡️ <strong>Admin Notice:</strong> The student resident has not yet confirmed visit approval. As an Administrator, you can override and progress status if this is an urgent or authorized inspection.
                </div>
              )}

              {status === 'IN_PROGRESS' && complaint.status !== 'RESOLVED' && complaint.visit_approved && (
                <div className="alert alert-success py-2 small mb-3 d-flex align-items-center gap-2">
                  <BiCheckCircle className="fs-5 text-success flex-shrink-0" />
                  <span>
                    <strong>Visit Entry Confirmed:</strong> Resident approved: <em>"You can come"</em>. You are authorized to begin maintenance in room {complaint.room_number_snapshot}.
                  </span>
                </div>
              )}

              <div className="mb-2">
                <label className="form-label fw-bold small">
                  Status Transition Remarks {isReopening && <span className="text-danger">* (Required for Reopening)</span>}
                </label>
                <textarea
                  className="form-control form-control-sm"
                  rows="3"
                  placeholder={isReopening ? "Reason why this complaint is being reopened..." : "Action taken or progress details..."}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  required={isReopening}
                />
              </div>
            </div>
            <div className="modal-footer py-2">
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose} disabled={submitting}>
                {isClosedAndLocked ? 'Close' : 'Cancel'}
              </button>
              {!isClosedAndLocked ? (
                <button
                  type="submit"
                  className="btn btn-sm btn-chocolate"
                  disabled={submitting || isStaffBlockedByApproval}
                >
                  {submitting ? 'Updating...' : 'Update Status'}
                </button>
              ) : (
                <button type="button" className="btn btn-sm btn-secondary" disabled>
                  🔒 Status Locked
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
