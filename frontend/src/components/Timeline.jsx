import React, { useState } from 'react';
import { StatusBadge } from './StatusBadge';
import { BiTimeFive, BiCheckCircle, BiWrench, BiUser, BiVolumeFull, BiInfoCircle } from 'react-icons/bi';
import { simplifyText } from '../utils/simplifier';
import { translateMaintenanceText, speakText } from '../utils/translator';

export const Timeline = ({ history = [], workLogs = [], selectedLanguage = 'en' }) => {
  // Store set of log IDs that are currently showing simplified text
  const [simplifiedLogs, setSimplifiedLogs] = useState({});

  const toggleSimplify = (id) => {
    setSimplifiedLogs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSpeak = (text) => {
    speakText(text, selectedLanguage);
  };

  return (
    <div className="timeline-container py-2">
      <h6 className="fw-bold mb-3 text-dark d-flex align-items-center gap-2">
        <BiTimeFive className="text-warning" /> Complaint Activity & Transition Timeline
      </h6>

      {/* Status History */}
      <div className="mb-4">
        <h6 className="small fw-bold text-muted text-uppercase mb-2">Status Changes</h6>
        <div className="border-start border-3 border-chocolate ps-3 ms-2">
          {history.length > 0 ? (
            history.map((item, idx) => {
              const displayRemarks = item.remarks
                ? (selectedLanguage === 'en'
                    ? item.remarks
                    : translateMaintenanceText(item.remarks, selectedLanguage))
                : '';

              return (
                <div key={idx} className="mb-3 position-relative">
                  <div
                    className="position-absolute bg-chocolate rounded-circle"
                    style={{ width: '12px', height: '12px', left: '-22px', top: '4px' }}
                  />
                  <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                    <span className="small text-muted">{item.previous_status}</span>
                    <span className="small">&rarr;</span>
                    <StatusBadge status={item.new_status} />
                    <small className="text-muted ms-auto">
                      {new Date(item.timestamp).toLocaleString()}
                    </small>
                  </div>
                  <div className="small text-dark d-flex align-items-center justify-content-between flex-wrap gap-1">
                    <div>
                      <strong>{item.changed_by_name || 'System'}</strong> ({item.changed_by_role || 'Auto'})
                      {displayRemarks && <span className="text-muted ms-1">— "{displayRemarks}"</span>}
                    </div>
                    {displayRemarks && (
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 text-chocolate"
                        title="Read aloud"
                        onClick={() => handleSpeak(displayRemarks)}
                        aria-label="Read status remark aloud"
                      >
                        <BiVolumeFull />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-muted small">No status changes recorded.</p>
          )}
        </div>
      </div>

      {/* Work Progress Logs */}
      {workLogs && workLogs.length > 0 && (
        <div>
          <h6 className="small fw-bold text-muted text-uppercase mb-2">
            <BiWrench className="me-1" /> Maintenance Work Logs
          </h6>
          <div className="list-group">
            {workLogs.map((log) => {
              const isSimplified = !!simplifiedLogs[log.id];
              const rawMessage = log.progress_message;
              const plainMessage = simplifyText(rawMessage);

              // If non-English selected, translate message
              const displayMessage = selectedLanguage === 'en'
                ? (isSimplified ? plainMessage : rawMessage)
                : translateMaintenanceText(isSimplified ? plainMessage : rawMessage, selectedLanguage);

              return (
                <div key={log.id} className="list-group-item bg-light border-0 mb-2 rounded p-3">
                  <div className="d-flex justify-content-between align-items-center mb-1 flex-wrap gap-1">
                    <span className="fw-semibold text-chocolate small d-flex align-items-center gap-1">
                      <BiUser /> {log.staff_name}
                    </span>
                    <div className="d-flex align-items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-chocolate btn-sm py-0 px-1.5"
                        style={{ fontSize: '0.72rem' }}
                        onClick={() => toggleSimplify(log.id)}
                        title="Toggle simplified student-friendly explanation"
                      >
                        <BiInfoCircle className="me-1 text-warning" />
                        {isSimplified ? 'Show Technical Log' : 'Simplify Log'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 text-muted"
                        title="Read log aloud"
                        onClick={() => handleSpeak(displayMessage)}
                        aria-label="Read work log aloud"
                      >
                        <BiVolumeFull className="fs-5" />
                      </button>
                      <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </small>
                    </div>
                  </div>
                  <p className="mb-0 small text-dark mt-1">
                    {displayMessage}
                    {isSimplified && (
                      <span className="badge bg-success text-white ms-2" style={{ fontSize: '0.62rem' }}>
                        Simplified Plain Language
                      </span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
