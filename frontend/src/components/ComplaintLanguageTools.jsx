import React, { useState } from 'react';
import { simplifyText, getStructuredPlainLanguageUpdate } from '../utils/simplifier';
import { SUPPORTED_LANGUAGES, translateTerm, translateMaintenanceText, speakText } from '../utils/translator';
import {
  BiGlobe,
  BiVolumeFull,
  BiStopCircle,
  BiWrench,
  BiCheckCircle,
  BiInfoCircle,
  BiHelpCircle,
  BiChevronDown,
  BiChevronUp
} from 'react-icons/bi';

export const ComplaintLanguageTools = ({
  complaint,
  selectedLanguage,
  onLanguageChange
}) => {
  const [isSimplifiedOpen, setIsSimplifiedOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Latest update or remarks
  const latestLog = complaint.work_logs && complaint.work_logs.length > 0
    ? complaint.work_logs[complaint.work_logs.length - 1].progress_message
    : (complaint.status_history && complaint.status_history.length > 0 && complaint.status_history[0].remarks) || '';

  const structured = getStructuredPlainLanguageUpdate(latestLog, complaint.status, complaint.category);

  const handleSpeak = (textToSpeak) => {
    if (isSpeaking) {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    speakText(textToSpeak, selectedLanguage);
    // Auto reset speaking state after estimate
    setTimeout(() => {
      setIsSpeaking(false);
    }, 4500);
  };

  return (
    <div className="card mb-4 border shadow-sm" style={{ backgroundColor: 'var(--color-cream)' }}>
      <div className="card-body p-3">
        {/* Top Controls Row */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
          {/* Language Selector Dropdown */}
          <div className="d-flex align-items-center gap-2">
            <BiGlobe className="text-chocolate fs-5 flex-shrink-0" />
            <label htmlFor="languageSelect" className="small fw-bold text-dark mb-0">
              Translate Updates:
            </label>
            <select
              id="languageSelect"
              className="form-select form-select-sm bg-white border-chocolate"
              style={{ width: 'auto', minWidth: '140px', fontSize: '0.82rem' }}
              value={selectedLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
              aria-label="Select preferred translation language for complaint updates"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.native} ({lang.name})
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-chocolate d-flex align-items-center gap-1"
              onClick={() => setIsSimplifiedOpen(!isSimplifiedOpen)}
              aria-expanded={isSimplifiedOpen}
              title="Explain technical maintenance updates in simple words"
            >
              <BiWrench />
              <span className="small fw-bold">
                {isSimplifiedOpen ? 'Hide Simplified Terms' : '✨ Explain in Simple Words'}
              </span>
              {isSimplifiedOpen ? <BiChevronUp /> : <BiChevronDown />}
            </button>

            <button
              type="button"
              className={`btn btn-sm ${isSpeaking ? 'btn-danger' : 'btn-chocolate'} d-flex align-items-center gap-1`}
              onClick={() => {
                const textToRead = selectedLanguage === 'en'
                  ? `Status update: ${structured.summary}. ${structured.whatItMeans}`
                  : translateMaintenanceText(`Status update: ${structured.summary}. ${structured.whatItMeans}`, selectedLanguage);
                handleSpeak(textToRead);
              }}
              title="Listen to maintenance update with voice reading"
              aria-label="Listen to maintenance updates read aloud"
            >
              {isSpeaking ? <BiStopCircle /> : <BiVolumeFull />}
              <span className="small d-none d-sm-inline">
                {isSpeaking ? 'Stop Reading' : 'Listen'}
              </span>
            </button>
          </div>
        </div>

        {/* Translated Live Status Pill if non-English */}
        {selectedLanguage !== 'en' && (
          <div className="alert alert-warning py-1.5 px-3 small mb-2 d-flex align-items-center justify-content-between flex-wrap gap-1">
            <div>
              <strong>अनुवादित स्थिति / Translated Status: </strong>
              <span className="badge bg-chocolate ms-1">
                {translateTerm(complaint.status, selectedLanguage)}
              </span>
              <span className="ms-2 text-muted">
                ({translateTerm(complaint.category, selectedLanguage)} &bull; {translateTerm(complaint.priority, selectedLanguage)})
              </span>
            </div>
            <small className="text-muted">Auto-translated to preferred language</small>
          </div>
        )}

        {/* Collapsible Plain English Explanation */}
        {isSimplifiedOpen && (
          <div className="mt-2 pt-2 border-top">
            <div className="row g-2">
              <div className="col-md-7">
                <div className="p-2.5 rounded bg-white border">
                  <div className="fw-bold small text-chocolate d-flex align-items-center gap-1 mb-1">
                    <BiInfoCircle /> What Maintenance Did in Simple Words:
                  </div>
                  <p className="small text-dark mb-0">
                    {structured.summary}
                  </p>
                </div>
              </div>
              <div className="col-md-5">
                <div className="p-2.5 rounded bg-white border" style={{ borderLeft: '3px solid var(--color-success)' }}>
                  <div className="fw-bold small text-success d-flex align-items-center gap-1 mb-1">
                    <BiCheckCircle /> What This Means For You:
                  </div>
                  <p className="small text-dark mb-0">
                    {structured.whatItMeans}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

