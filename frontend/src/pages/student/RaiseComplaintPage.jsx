import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { complaintsApi } from '../../api/complaintsApi';
import { useAuth } from '../../context/AuthContext';
import {
  BiPlusCircle,
  BiImageAdd,
  BiTrash,
  BiCheckCircle,
  BiMicrophone,
  BiShieldQuarter,
  BiTimeFive,
  BiUserCheck,
  BiDoorOpen,
  BiBell,
  BiChevronDown,
  BiChevronUp
} from 'react-icons/bi';
import { FieldVoiceDictation, VoiceComplaintAssistant, smartClassifyCategory } from '../../components/VoiceComplaintAssistant';
import { VisitTimeSelector } from '../../components/VisitTimeSelector';
import { validateVisitTime } from '../../utils/visitTimeSlots';

export const RaiseComplaintPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    category: 'PLUMBING',
    priority: 'MEDIUM',
    description: '',
    preferred_worker_gender: 'ANY',
    require_warden_presence: false,
    keep_door_open: false,
    preferred_slot: '',
    custom_accommodation: '',
    notify_before_visit: true,
  });

  const [showPreferences, setShowPreferences] = useState(false);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(prev => [...prev, ...files]);

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.title.trim().length < 5) {
      setError('Title must be at least 5 characters long.');
      return;
    }
    if (formData.description.trim().length < 10) {
      setError('Detailed description must be at least 10 characters long.');
      return;
    }
    if (formData.preferred_slot && formData.preferred_slot.trim()) {
      const val = validateVisitTime(formData.preferred_slot.trim());
      if (!val.valid) {
        setError(val.error);
        return;
      }
    }

    setSubmitting(true);
    const data = new FormData();
    data.append('title', formData.title.trim());
    data.append('category', formData.category);
    data.append('priority', formData.priority);
    data.append('description', formData.description.trim());
    data.append('preferred_worker_gender', formData.preferred_worker_gender);
    data.append('require_warden_presence', formData.require_warden_presence);
    data.append('keep_door_open', formData.keep_door_open);
    data.append('preferred_slot', formData.preferred_slot.trim());
    data.append('custom_accommodation', formData.custom_accommodation.trim());
    data.append('notify_before_visit', formData.notify_before_visit);

    images.forEach(img => {
      data.append('images', img);
    });

    try {
      const res = await complaintsApi.createComplaint(data);
      const newComp = res.data.complaint;
      navigate(`/student/complaints/${newComp.id}`);
    } catch (err) {
      const errMsg = err.response?.data?.error ||
        err.response?.data?.title?.[0] ||
        err.response?.data?.description?.[0] ||
        'Failed to submit complaint. Please check your inputs.';
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-3">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card he-card">
            <div className="card-header he-card-header d-flex justify-content-between align-items-center">
              <span className="fs-5 fw-bold">
                <BiPlusCircle className="text-warning me-2" /> Raise Maintenance Complaint
              </span>
              <span className="badge bg-light text-dark border">
                {user?.hostel_block} - Room {user?.room_number}
              </span>
            </div>
            <div className="card-body p-4">
              {/* Voice-Guided Complaint Submission Banner */}
              <div className="alert alert-warning border d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4 p-3 rounded">
                <div className="d-flex align-items-center gap-2.5">
                  <div className="rounded-circle bg-chocolate text-white p-2 d-flex align-items-center justify-content-center">
                    <BiMicrophone className="fs-4 text-warning" />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-0 text-dark">Need Hands-Free Assistance?</h6>
                    <small className="text-muted">Use our interactive voice assistant to speak and submit your complaint step-by-step.</small>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-chocolate fw-bold d-flex align-items-center gap-1.5 shadow-sm"
                  onClick={() => setIsVoiceAssistantOpen(true)}
                  aria-label="Start voice-guided complaint submission"
                >
                  <BiMicrophone /> Start Voice Guide
                </button>
              </div>

              {error && <div className="alert alert-danger py-2 small">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label fw-bold small mb-0" htmlFor="complaintTitle">
                      Problem Title <span className="text-danger">*</span>
                    </label>
                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>Click mic to speak title</span>
                  </div>
                  <div className="input-group">
                    <input
                      id="complaintTitle"
                      type="text"
                      name="title"
                      className="form-control"
                      placeholder="Brief summary (e.g. Leaking pipe under sink, Switch sparking)"
                      value={formData.title}
                      onChange={handleChange}
                      required
                    />
                    <FieldVoiceDictation
                      onTranscript={(text) => {
                        const smartCat = smartClassifyCategory('', text, formData.description);
                        setFormData(prev => ({
                          ...prev,
                          title: text,
                          category: smartCat !== 'OTHER' ? smartCat : prev.category
                        }));
                      }}
                      ariaLabel="Speak problem title"
                    />
                  </div>
                  <small className="text-muted">Minimum 5 characters.</small>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold small" htmlFor="categorySelect">
                      Category <span className="text-danger">*</span>
                    </label>
                    <select
                      id="categorySelect"
                      name="category"
                      className="form-select"
                      value={formData.category}
                      onChange={handleChange}
                      required
                    >
                      <option value="ELECTRICITY">Electricity Issues</option>
                      <option value="PLUMBING">Plumbing Issues</option>
                      <option value="WIFI">Wi-Fi / Internet Issues</option>
                      <option value="FURNITURE">Furniture Damage</option>
                      <option value="CLEANLINESS">Cleanliness Issues</option>
                      <option value="OTHER">Other Issues</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small" htmlFor="prioritySelect">Priority Level</label>
                    <select
                      id="prioritySelect"
                      name="priority"
                      className="form-select"
                      value={formData.priority}
                      onChange={handleChange}
                    >
                      <option value="LOW">Low (Cosmetic, minor)</option>
                      <option value="MEDIUM">Medium (Normal daily issue)</option>
                      <option value="HIGH">High (Urgent disruption)</option>
                      <option value="CRITICAL">Critical (Hazard, safety risk)</option>
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label fw-bold small mb-0" htmlFor="descriptionInput">
                      Detailed Description <span className="text-danger">*</span>
                    </label>
                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>Click mic to speak description</span>
                  </div>
                  <div className="position-relative">
                    <textarea
                      id="descriptionInput"
                      name="description"
                      className="form-control"
                      rows="4"
                      placeholder="Provide specific location, severity, when it started, and whether it represents any immediate safety hazard..."
                      value={formData.description}
                      onChange={handleChange}
                      required
                    />
                    <div className="position-absolute" style={{ right: '8px', bottom: '8px' }}>
                      <FieldVoiceDictation
                        onTranscript={(text) => setFormData(prev => ({
                          ...prev,
                          description: prev.description ? `${prev.description} ${text}` : text
                        }))}
                        ariaLabel="Speak detailed description"
                      />
                    </div>
                  </div>
                  <small className="text-muted">Minimum 10 characters.</small>
                </div>

                {/* Visit Safety & Privacy Preferences Card */}
                <div className="card border-0 bg-light rounded-3 mb-4 overflow-hidden border">
                  <div
                    className="card-header bg-white border-bottom py-2.5 px-3 d-flex justify-content-between align-items-center"
                    onClick={() => setShowPreferences(!showPreferences)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <div className="p-1 rounded bg-chocolate text-white d-flex align-items-center justify-content-center">
                        <BiShieldQuarter className="fs-5 text-warning" />
                      </div>
                      <div>
                        <span className="fw-bold text-dark small d-block">Visit Safety & Privacy Preferences (Optional)</span>
                        <small className="text-muted" style={{ fontSize: '0.74rem' }}>
                          Warden accompaniment, appointment slot, technician gender, and door policy
                        </small>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      {(formData.require_warden_presence || formData.keep_door_open || formData.preferred_worker_gender !== 'ANY' || formData.preferred_slot || formData.custom_accommodation) && (
                        <span className="badge bg-success-subtle text-success border border-success-subtle small">
                          Customized
                        </span>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary p-1"
                        aria-label={showPreferences ? 'Collapse preferences' : 'Expand preferences'}
                      >
                        {showPreferences ? <BiChevronUp /> : <BiChevronDown />}
                      </button>
                    </div>
                  </div>

                  {showPreferences && (
                    <div className="card-body p-3 bg-white">
                      <div className="row g-3 mb-3">
                        <div className="col-md-6">
                          <label className="form-label fw-bold small d-flex align-items-center gap-1" htmlFor="preferredWorkerGender">
                            <BiUserCheck className="text-chocolate" /> Preferred Technician Gender
                          </label>
                          <select
                            id="preferredWorkerGender"
                            name="preferred_worker_gender"
                            className="form-select form-select-sm"
                            value={formData.preferred_worker_gender}
                            onChange={handleChange}
                          >
                            <option value="ANY">No Preference (Any Qualified Staff)</option>
                            <option value="SAME">Same-Gender Staff Only</option>
                          </select>
                          <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                            Matched during admin staff dispatch.
                          </small>
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
                        <label className="form-label fw-bold small" htmlFor="customAccommodation">
                          Alternative Location or Other Reasonable Accommodation
                        </label>
                        <input
                          id="customAccommodation"
                          type="text"
                          name="custom_accommodation"
                          className="form-control form-control-sm"
                          placeholder="e.g. Can bring portable appliance to hostel reception / wheelchair access required"
                          value={formData.custom_accommodation}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="bg-light p-2.5 rounded border">
                        <div className="form-check mb-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="requireWarden"
                            name="require_warden_presence"
                            checked={formData.require_warden_presence}
                            onChange={handleChange}
                          />
                          <label className="form-check-label small fw-semibold" htmlFor="requireWarden">
                            Request a hostel warden or authorized staff member to accompany the worker
                          </label>
                        </div>

                        <div className="form-check mb-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="keepDoorOpen"
                            name="keep_door_open"
                            checked={formData.keep_door_open}
                            onChange={handleChange}
                          />
                          <label className="form-check-label small fw-semibold" htmlFor="keepDoorOpen">
                            Perform repair with room door open (where safe & permitted)
                          </label>
                        </div>

                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="notifyBeforeVisit"
                            name="notify_before_visit"
                            checked={formData.notify_before_visit}
                            onChange={handleChange}
                          />
                          <label className="form-check-label small fw-semibold" htmlFor="notifyBeforeVisit">
                            Notify me in advance before the maintenance technician arrives
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Photo Upload with Live Previews */}
                <div className="mb-4">
                  <label className="form-label fw-bold small d-flex align-items-center gap-1">
                    <BiImageAdd className="fs-5 text-chocolate" /> Upload Photos (Optional)
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                  />
                  <small className="text-muted d-block mt-1">
                    Attach photos of the issue to assist maintenance technicians in diagnosing required tools/parts.
                  </small>

                  {/* Previews */}
                  {previews.length > 0 && (
                    <div className="d-flex flex-wrap gap-2 mt-3">
                      {previews.map((preview, idx) => (
                        <div key={idx} className="position-relative border rounded p-1 bg-white" style={{ width: '100px', height: '100px' }}>
                          <img src={preview} alt="Upload preview" className="w-100 h-100 rounded" style={{ objectFit: 'cover' }} />
                          <button
                            type="button"
                            className="btn btn-sm btn-danger position-absolute top-0 end-0 p-0 rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: '20px', height: '20px', transform: 'translate(30%, -30%)' }}
                            onClick={() => handleRemoveImage(idx)}
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="d-flex justify-content-between align-items-center">
                  <Link to="/student/dashboard" className="btn btn-outline-secondary">
                    Cancel
                  </Link>
                  <button type="submit" className="btn btn-chocolate px-4" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Register Complaint'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Assistant Walkthrough Modal */}
      <VoiceComplaintAssistant
        isOpen={isVoiceAssistantOpen}
        onClose={() => setIsVoiceAssistantOpen(false)}
        onComplete={(voiceData) => {
          setFormData(prev => ({ ...prev, ...voiceData }));
        }}
      />
    </div>
  );
};
