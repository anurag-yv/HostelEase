import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BiBuilding,
  BiWrench,
  BiCheckShield,
  BiStar,
  BiRightArrowAlt,
  BiCheckDouble,
  BiBell,
  BiBarChartAlt2
} from 'react-icons/bi';

export const LandingPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, directly navigate to role dashboard
  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'STUDENT') navigate('/student/dashboard', { replace: true });
      else if (user.role === 'STAFF') navigate('/staff/dashboard', { replace: true });
      else if (user.role === 'ADMIN') navigate('/admin/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div>
      {/* Hero Section */}
      <section className="py-5 text-center text-lg-start" style={{ background: 'linear-gradient(135deg, #3E2723 0%, #4E342E 100%)', color: '#FFF8F0' }}>
        <div className="container py-4">
          <div className="row align-items-center g-4">
            <div className="col-lg-7">
              <span className="badge bg-warning text-dark fw-bold mb-3 px-3 py-2 text-uppercase" style={{ letterSpacing: '0.5px' }}>
                Campus Maintenance Platform
              </span>
              <h1 className="display-4 fw-bold mb-3">
                Smart Hostel Complaint & Maintenance Management
              </h1>
              <p className="lead mb-4 text-white-50">
                A modern, reliable portal for student residents, maintenance technicians, and hostel wardens. Report issues in seconds, track repairs in real time, and verify completion with verified feedback.
              </p>
              <div className="d-flex flex-wrap gap-3">
                {user ? (
                  <Link
                    to={user.role === 'STUDENT' ? '/student/dashboard' : user.role === 'STAFF' ? '/staff/dashboard' : '/admin/dashboard'}
                    className="btn btn-warning btn-lg fw-bold d-flex align-items-center gap-2"
                  >
                    Go to Your Dashboard <BiRightArrowAlt />
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="btn btn-warning btn-lg fw-bold">
                      Resident & Staff Login
                    </Link>
                    <Link to="/register" className="btn btn-outline-light btn-lg">
                      Register as Student
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="col-lg-5 mt-4 mt-lg-0 text-center">
              <div className="p-4 rounded-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                <BiBuilding className="display-2 text-warning mb-3" />
                <h4 className="fw-bold mb-2">Automated Maintenance Workflow</h4>
                <p className="small text-white-50 mb-3">
                  Replace slow paper complaint registers with digital transparency, SLA monitoring, and automated notifications.
                </p>
                <div className="row text-start g-3 small text-white-50">
                  <div className="col-6"><BiCheckDouble className="text-warning me-1" /> Student Room Isolation</div>
                  <div className="col-6"><BiCheckDouble className="text-warning me-1" /> Role-Based Access</div>
                  <div className="col-6"><BiCheckDouble className="text-warning me-1" /> Photo Attachments</div>
                  <div className="col-6"><BiCheckDouble className="text-warning me-1" /> Verified Star Ratings</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Portals Preview */}
      <section className="container my-5">
        <div className="text-center mb-5">
          <h2 className="fw-bold text-dark mb-2">Tailored Portals for Every Role</h2>
          <p className="text-muted">Designed specifically to meet the daily needs of residents, technicians, and administrators.</p>
        </div>

        <div className="row g-4">
          <div className="col-md-4">
            <div className="card he-card p-4 h-100">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="p-3 rounded-circle bg-light text-chocolate fs-3"><BiStar /></div>
                <div>
                  <h5 className="fw-bold mb-0">Student Residents</h5>
                  <small className="text-muted">Room & Wing Access</small>
                </div>
              </div>
              <p className="small text-muted mb-0">
                Raise tickets for electricity, plumbing, Wi-Fi, and cleanliness issues with attached photos. Monitor technician work logs and submit satisfaction ratings upon completion.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card he-card p-4 h-100">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="p-3 rounded-circle bg-light text-chocolate fs-3"><BiWrench /></div>
                <div>
                  <h5 className="fw-bold mb-0">Maintenance Staff</h5>
                  <small className="text-muted">Technician Workbench</small>
                </div>
              </div>
              <p className="small text-muted mb-0">
                Receive instant task assignments with room locations and contact details. Post progress updates, record spare parts used, and mark tasks as resolved.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card he-card p-4 h-100">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="p-3 rounded-circle bg-light text-chocolate fs-3"><BiBarChartAlt2 /></div>
                <div>
                  <h5 className="fw-bold mb-0">Hostel Wardens</h5>
                  <small className="text-muted">Operations & SLA Oversight</small>
                </div>
              </div>
              <p className="small text-muted mb-0">
                Assign and reassign staff based on workload, reopen unresolved issues, inspect category distributions with charts, and export complete reports to CSV.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Maintenance Lifecycle */}
      <section className="container mb-5">
        <div className="card he-card p-4 p-lg-5">
          <h3 className="text-center fw-bold text-dark mb-4">How HostelEase Works</h3>
          <div className="row g-4 text-center">
            <div className="col-md-3 col-6">
              <div className="badge bg-chocolate p-3 rounded-circle mb-3 fs-4 text-warning">1</div>
              <h6 className="fw-bold">Report Issue</h6>
              <p className="small text-muted mb-0">Student selects category, priority, and attaches optional photos.</p>
            </div>
            <div className="col-md-3 col-6">
              <div className="badge bg-chocolate p-3 rounded-circle mb-3 fs-4 text-warning">2</div>
              <h6 className="fw-bold">Warden Assigns</h6>
              <p className="small text-muted mb-0">Warden assigns ticket to an active specialist electrician, plumber, etc.</p>
            </div>
            <div className="col-md-3 col-6">
              <div className="badge bg-chocolate p-3 rounded-circle mb-3 fs-4 text-warning">3</div>
              <h6 className="fw-bold">Repair & Log</h6>
              <p className="small text-muted mb-0">Technician updates status to In Progress, logs notes, and marks resolved.</p>
            </div>
            <div className="col-md-3 col-6">
              <div className="badge bg-chocolate p-3 rounded-circle mb-3 fs-4 text-warning">4</div>
              <h6 className="fw-bold">Feedback & Close</h6>
              <p className="small text-muted mb-0">Resident rates resolution quality and administration archives ticket.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
