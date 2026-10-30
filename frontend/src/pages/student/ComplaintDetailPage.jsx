import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { complaintsApi } from '../../api/complaintsApi';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { Timeline } from '../../components/Timeline';
import { FeedbackModal } from '../../components/FeedbackModal';
import { ReopenComplaintModal } from '../../components/ReopenComplaintModal';
import { RescheduleModal } from '../../components/RescheduleModal';
import { EditPreferencesModal } from '../../components/EditPreferencesModal';
import { WithdrawComplaintModal } from '../../components/WithdrawComplaintModal';
import { ComplaintLanguageTools } from '../../components/ComplaintLanguageTools';
import { translateTerm, translateMaintenanceText } from '../../utils/translator';
import {
  BiLeftArrowAlt,
  BiCalendar,
  BiUser,
  BiBuilding,
  BiStar,
  BiWrench,
  BiRefresh,
  BiMessageSquareDetail,
  BiShieldQuarter,
  BiDoorOpen,
  BiBell,
  BiTimeFive,
  BiUserCheck,
  BiCheckCircle,
  BiXCircle
} from 'react-icons/bi';

export const ComplaintDetailPage = () => {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showEditPreferencesModal, setShowEditPreferencesModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [approvingVisit, setApprovingVisit] = useState(false);

  const handleApproveVisit = async () => {
    setApprovingVisit(true);
    try {
      await complaintsApi.approveVisit(complaint.id);
      await fetchDetail();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve technician visit.');
    } finally {
      setApprovingVisit(false);
    }
  };

  const fetchDetail = async () => {
    try {
      const res = await complaintsApi.getComplaintDetail(id);
      setComplaint(res.data);
    } catch (err) {
      setError('Failed to load complaint details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-chocolate" role="status"></div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="alert alert-danger my-4">
        {error || 'Complaint not found.'}
        <br />
        <Link to="/student/complaints" className="btn btn-sm btn-outline-danger mt-2">Back to complaints</Link>
      </div>
    );
  }

  const currentAssignment = complaint.status === 'PENDING' ? null : complaint.assignments?.find(a => a.is_current);
  const canGiveFeedback = complaint.status === 'RESOLVED' && !complaint.feedback;

  return (
    <div>
      <div className="mb-3">
        <Link to="/student/complaints" className="text-decoration-none text-muted">
          <BiLeftArrowAlt /> Back to My Complaints
        </Link>
      </div>

      <div className="row g-4">
        {/* Main Details */}
        <div className="col-lg-8">
          <div className="card he-card mb-4">
            <div className="card-header he-card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <span className="fs-5 fw-bold">{complaint.complaint_number}</span>
                <span className="ms-2"><StatusBadge status={complaint.status} /></span>
                <span className="ms-1"><PriorityBadge priority={complaint.priority} /></span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-light text-dark border">{complaint.category_display}</span>
                {complaint.status === 'PENDING' && (
                  <button
                    className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                    onClick={() => setShowWithdrawModal(true)}
                    title="Take back or withdraw this complaint before staff assignment"
                  >
                    <BiXCircle /> Take Back Issue
                  </button>
                )}
              </div>
            </div>
            <div className="card-body p-4">
              {/* Language Translation & Plain Language Simplifier Bar */}
              <ComplaintLanguageTools
                complaint={complaint}
                selectedLanguage={selectedLanguage}
                onLanguageChange={setSelectedLanguage}
              />

              {/* Student Visit Entry Authorization Banner */}
              {!complaint.visit_approved && ['ASSIGNED', 'IN_PROGRESS'].includes(complaint.status) && (
                <div className="card border-warning shadow-sm mb-4 bg-warning bg-opacity-10">
                  <div className="card-header bg-warning bg-opacity-25 border-warning py-2.5 px-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <span className="fw-bold text-dark d-flex align-items-center gap-2">
                      <BiDoorOpen className="fs-4 text-chocolate" />
                      Technician Visit Request — Resident Action Required
                    </span>
                    <span className="badge bg-warning text-dark border border-warning-subtle">
                      Awaiting Your Approval
                    </span>
                  </div>

                  <div className="card-body p-3">
                    {complaint.estimated_visit_time ? (
                      <div className="p-3 bg-white border border-warning rounded shadow-xs mb-3">
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                          <div>
                            <span className="text-muted small d-block">Technician Proposed Arrival Time:</span>
                            <div className="fs-5 fw-bold text-dark d-flex align-items-center gap-2 mt-1">
                              <BiTimeFive className="text-chocolate" />
                              <span className="badge bg-warning text-dark fs-6 px-3 py-1.5 border border-warning-subtle">
                                {complaint.estimated_visit_time}
                              </span>
                            </div>
                          </div>
                          <div className="text-muted small text-end">
                            <div>Technician: <strong className="text-dark">{currentAssignment?.staff_name || 'Assigned Staff'}</strong></div>
                            <div>Location: <strong className="text-dark">{complaint.hostel_block_snapshot} — Room {complaint.room_number_snapshot}</strong></div>
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2 border-top text-dark small">
                          Technician <strong>{currentAssignment?.staff_name || 'Staff'}</strong> has notified that they can come to your room at the above time.
                          <div className="text-muted mt-0.5">
                            Before they can enter your room and commence maintenance work, you must approve that you are available and that they can come.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-white border rounded mb-3 small text-muted d-flex align-items-center gap-2">
                        <BiTimeFive className="fs-5 text-muted flex-shrink-0" />
                        <span>
                          Technician <strong>{currentAssignment?.staff_name || 'Staff'}</strong> is assigned to your room. They have not yet stated an arrival window, but you can pre-approve their room visit now.
                        </span>
                      </div>
                    )}

                    {/* Clear Accept and Request Reschedule Buttons */}
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-1 border-top">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5"
                        onClick={() => setShowRescheduleModal(true)}
                      >
                        🔄 Request Alternate Time
                      </button>
                      <button
                        type="button"
                        className="btn btn-success btn-sm fw-bold px-3 py-2 d-flex align-items-center gap-2 shadow-sm"
                        onClick={handleApproveVisit}
                        disabled={approvingVisit}
                      >
                        <BiCheckCircle className="fs-5" />
                        {approvingVisit ? 'Approving...' : 'Accept Visit ("You Can Come")'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {complaint.status !== 'PENDING' && complaint.visit_approved && (
                <div className="alert alert-success py-2.5 px-3 small d-flex align-items-center justify-content-between mb-4 border border-success shadow-xs">
                  <div className="d-flex align-items-center gap-2">
                    <BiCheckCircle className="fs-4 flex-shrink-0 text-success" />
                    <div>
                      <strong className="d-block text-success-emphasis">
                        Visit Approved ("You Can Come"):
                      </strong>
                      <span>
                        You authorized technician <strong>{currentAssignment?.staff_name || 'Staff'}</strong> to visit room {complaint.room_number_snapshot}
                        {complaint.estimated_visit_time ? ` (Arrival Window: ${complaint.estimated_visit_time})` : ''}. Maintenance staff may now arrive and commence work.
                      </span>
                    </div>
                  </div>
                  {complaint.visit_approved_at && (
                    <span className="badge bg-success text-white">
                      Approved at {new Date(complaint.visit_approved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              )}

              <h4 className="fw-bold text-dark mb-3">
                {selectedLanguage === 'en'
                  ? complaint.title
                  : translateMaintenanceText(complaint.title, selectedLanguage)}
              </h4>

              <div className="p-3 bg-light rounded mb-4">
                <h6 className="fw-bold small text-muted text-uppercase mb-2">
                  {selectedLanguage === 'en' ? 'Description' : 'विवरण / Translated Description'}
                </h6>
                <p className="mb-0 text-dark" style={{ whiteSpace: 'pre-line' }}>
                  {selectedLanguage === 'en'
                    ? complaint.description
                    : translateMaintenanceText(complaint.description, selectedLanguage)}
                </p>
              </div>

              {/* Uploaded Images */}
              {complaint.images && complaint.images.length > 0 && (
                <div className="mb-4">
                  <h6 className="fw-bold small text-muted text-uppercase mb-2">Attached Problem Photos</h6>
                  <div className="d-flex flex-wrap gap-3">
                    {complaint.images.map((img) => (
                      <div key={img.id} className="border rounded p-1 bg-white" style={{ width: '130px' }}>
                        <a href={img.image} target="_blank" rel="noreferrer">
                          <img
                            src={img.image}
                            alt="Attached issue"
                            className="img-fluid rounded"
                            style={{ height: '90px', width: '100%', objectFit: 'cover' }}
                          />
                        </a>
                        <small className="text-muted d-block text-center mt-1" style={{ fontSize: '0.7rem' }}>
                          {new Date(img.uploaded_at).toLocaleDateString()}
                        </small>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback Prompt if Resolved */}
              {canGiveFeedback && (
                <div className="alert alert-warning d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4 shadow-xs">
                  <div>
                    <h6 className="fw-bold mb-1"><BiStar className="me-1 text-warning" /> Complaint Resolved!</h6>
                    <small>Please submit your feedback rating to confirm resolution and close this ticket.</small>
                  </div>
                  <button className="btn btn-sm btn-chocolate fw-bold" onClick={() => setShowFeedbackModal(true)}>
                    Submit Feedback & Close Ticket
                  </button>
                </div>
              )}

              {/* Existing Feedback Display & Final Closure Badge */}
              {complaint.feedback && (
                <div className="border border-success-subtle rounded p-3 bg-light mb-4 shadow-xs">
                  <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                    <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-1">
                      <BiCheckCircle className="text-success fs-5" /> Resident Service Feedback & Final Closure
                    </h6>
                    <span className="badge bg-secondary">
                      🔒 Status Locked & Closed
                    </span>
                  </div>
                  <div className="text-warning fs-5 mb-1">
                    {'★'.repeat(complaint.feedback.rating)}
                    {'☆'.repeat(5 - complaint.feedback.rating)}
                    <span className="text-dark fs-6 ms-2">({complaint.feedback.rating}/5)</span>
                  </div>
                  {complaint.feedback.comment && (
                    <p className="small text-muted mb-0">"{complaint.feedback.comment}"</p>
                  )}
                  <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
                    Submitted on {new Date(complaint.feedback.timestamp).toLocaleDateString()} — Ticket permanently closed and finalized. No further status changes can be made.
                  </small>
                </div>
              )}

              {/* Reopen Action for Resolved Tickets (Only before feedback is submitted) */}
              {complaint.status === 'RESOLVED' && !complaint.feedback && (
                <div className="card mb-4 bg-light border">
                  <div className="card-body p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                      <span className="fw-bold small text-dark d-block">Issue not resolved or problem recurring?</span>
                      <small className="text-muted">You can request to reopen this ticket for further maintenance review before submitting feedback.</small>
                    </div>
                    <button
                      className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                      onClick={() => setShowReopenModal(true)}
                    >
                      <BiRefresh /> Request Reopen
                    </button>
                  </div>
                </div>
              )}

              {/* Visual Timeline Component */}
              <Timeline
                history={complaint.status_history || []}
                workLogs={complaint.work_logs || []}
                selectedLanguage={selectedLanguage}
              />
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="col-lg-4">
          {/* Location & Status Card */}
          <div className="card he-card mb-4">
            <div className="card-header he-card-header py-2">
              <BiBuilding className="me-1" /> Ticket Summary
            </div>
            <div className="card-body">
              <ul className="list-unstyled mb-0 small">
                <li className="mb-2">
                  <span className="text-muted d-block">Hostel Block:</span>
                  <strong>{complaint.hostel_block_snapshot}</strong>
                </li>
                <li className="mb-2">
                  <span className="text-muted d-block">Room Number:</span>
                  <strong>Room {complaint.room_number_snapshot}</strong>
                </li>
                <li className="mb-2">
                  <span className="text-muted d-block">Filed On:</span>
                  <span>{new Date(complaint.created_at).toLocaleString()}</span>
                </li>
                {complaint.resolved_at && (
                  <li className="mb-2">
                    <span className="text-muted d-block">Resolved On:</span>
                    <span className="text-success fw-bold">{new Date(complaint.resolved_at).toLocaleString()}</span>
                  </li>
                )}
                {complaint.closed_at && (
                  <li className="mb-0">
                    <span className="text-muted d-block">Closed On:</span>
                    <span className="text-secondary fw-bold">{new Date(complaint.closed_at).toLocaleString()}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Assigned Staff Card */}
          <div className="card he-card mb-4">
            <div className="card-header he-card-header py-2">
              <BiWrench className="me-1" /> Assigned Maintenance Staff
            </div>
            <div className="card-body">
              {currentAssignment ? (
                <div>
                  <h6 className="fw-bold mb-1 text-chocolate">{currentAssignment.staff_name}</h6>
                  <p className="small text-muted mb-1"><BiUser className="me-1" /> {currentAssignment.staff_email}</p>
                  {currentAssignment.staff_phone && (
                    <p className="small text-muted mb-2">Phone: <strong>{currentAssignment.staff_phone}</strong></p>
                  )}
                  {complaint.estimated_visit_time && (
                    <div className="p-2 bg-warning-subtle text-dark border border-warning rounded small mb-2 d-flex align-items-center gap-1.5">
                      <BiTimeFive className="fs-5 text-chocolate flex-shrink-0" />
                      <div>
                        <strong>Mentioned Arrival Time:</strong> {complaint.estimated_visit_time}
                      </div>
                    </div>
                  )}
                  {currentAssignment.remarks && (
                    <div className="p-2 bg-light rounded small text-muted">
                      <em>Admin Note: {currentAssignment.remarks}</em>
                    </div>
                  )}
                </div>
              ) : ['RESOLVED', 'CLOSED'].includes(complaint.status) ? (
                <div className="text-muted small">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle fw-semibold">Admin resolved it</span>
                  </div>
                  <p className="mb-0">This complaint was reviewed and resolved directly by the hostel administration without an external staff assignment.</p>
                </div>
              ) : (
                <div className="text-muted small">
                  <p className="mb-0">This complaint is in queue and will be assigned to a maintenance staff member shortly by the hostel administration.</p>
                </div>
              )}
            </div>
          </div>

          {/* Visit Safety & Privacy Preferences Card */}
          <div className="card he-card mb-4">
            <div className="card-header he-card-header py-2 d-flex justify-content-between align-items-center">
              <span><BiShieldQuarter className="me-1 text-warning" /> Visit & Safety Protocols</span>
              <div className="d-flex align-items-center gap-1">
                {complaint.status === 'PENDING' && (
                  <button
                    type="button"
                    className="btn btn-xs btn-outline-light py-0 px-2"
                    style={{ fontSize: '0.74rem' }}
                    onClick={() => setShowEditPreferencesModal(true)}
                    title="Change worker gender, warden accompaniment, and door preferences"
                  >
                    ✏️ Edit Preferences
                  </button>
                )}
                {!['RESOLVED', 'CLOSED'].includes(complaint.status) && (
                  <button
                    type="button"
                    className="btn btn-xs btn-outline-light py-0 px-1.5"
                    style={{ fontSize: '0.72rem' }}
                    onClick={() => setShowRescheduleModal(true)}
                    title="Request different appointment time"
                  >
                    Change Slot
                  </button>
                )}
              </div>
            </div>
            <div className="card-body p-3">
              <ul className="list-unstyled mb-0 small">
                <li className="mb-2 pb-2 border-bottom">
                  <span className="text-muted d-block">Student Visit Authorization:</span>
                  {complaint.visit_approved ? (
                    <span className="badge bg-success-subtle text-success border border-success-subtle">
                      ✅ Approved ("You can come")
                    </span>
                  ) : (
                    <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
                      ⏳ Awaiting Student Approval
                    </span>
                  )}
                </li>
                <li className="mb-2 pb-2 border-bottom">
                  <span className="text-muted d-block">Preferred Appointment Time:</span>
                  <div className="d-flex justify-content-between align-items-center mt-0.5">
                    <strong>{complaint.preferred_slot || 'Standard / Any Time'}</strong>
                    {!['RESOLVED', 'CLOSED'].includes(complaint.status) && (
                      <button
                        className="btn btn-link text-chocolate p-0 text-decoration-none fw-semibold"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => setShowRescheduleModal(true)}
                      >
                        Reschedule
                      </button>
                    )}
                  </div>
                </li>
                <li className="mb-2 pb-2 border-bottom">
                  <span className="text-muted d-block">Technician Gender Preference:</span>
                  <strong className="text-dark">{complaint.preferred_worker_gender_display || 'Any Qualified Staff'}</strong>
                </li>
                <li className="mb-2 pb-2 border-bottom">
                  <span className="text-muted d-block">Staff Accompaniment:</span>
                  {complaint.require_warden_presence ? (
                    <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
                      Warden / Staff Presence Requested
                    </span>
                  ) : (
                    <span className="text-muted">Standard protocol</span>
                  )}
                </li>
                <li className="mb-2 pb-2 border-bottom">
                  <span className="text-muted d-block">Room Door Policy:</span>
                  {complaint.keep_door_open ? (
                    <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle">
                      Repair with door open requested
                    </span>
                  ) : (
                    <span className="text-muted">Standard protocol</span>
                  )}
                </li>
                <li className="mb-2 pb-2 border-bottom">
                  <span className="text-muted d-block">Advance Visit Alert:</span>
                  <span className={complaint.notify_before_visit ? 'text-success fw-bold' : 'text-muted'}>
                    {complaint.notify_before_visit ? 'Yes, notify student prior to entry' : 'Standard'}
                  </span>
                </li>
                {complaint.custom_accommodation && (
                  <li className="mb-0">
                    <span className="text-muted d-block">Special Accommodation / Location:</span>
                    <span className="text-dark">{complaint.custom_accommodation}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Reschedule Appointment Modal */}
      <RescheduleModal
        complaint={complaint}
        show={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
        onRescheduled={fetchDetail}
      />

      {/* Edit Preferences Modal (Available while PENDING before assignment) */}
      <EditPreferencesModal
        complaint={complaint}
        show={showEditPreferencesModal}
        onClose={() => setShowEditPreferencesModal(false)}
        onUpdated={fetchDetail}
      />

      {/* Withdraw Complaint Modal (Available while PENDING before assignment) */}
      <WithdrawComplaintModal
        complaint={complaint}
        show={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        onWithdrawn={fetchDetail}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        complaint={complaint}
        show={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmitted={fetchDetail}
      />

      {/* Reopen Modal */}
      <ReopenComplaintModal
        complaint={complaint}
        show={showReopenModal}
        onClose={() => setShowReopenModal(false)}
        onReopened={fetchDetail}
      />
    </div>
  );
};
