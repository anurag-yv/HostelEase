import React from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import {
  BiUniversalAccess,
  BiFont,
  BiSun,
  BiVolumeFull,
  BiVolumeMute,
  BiX,
  BiCommand,
  BiCheck
} from 'react-icons/bi';

export const AccessibilityWidget = () => {
  const {
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    screenReaderMuted,
    setScreenReaderMuted,
    isA11yMenuOpen,
    setIsA11yMenuOpen,
    announce
  } = useAccessibility();

  const handleFontSizeChange = (size) => {
    setFontSize(size);
    announce(`Font size changed to ${size}`, true);
  };

  const handleContrastToggle = () => {
    const next = !highContrast;
    setHighContrast(next);
    announce(`High contrast ${next ? 'enabled' : 'disabled'}`, true);
  };

  const handleVoiceToggle = () => {
    const next = !screenReaderMuted;
    setScreenReaderMuted(next);
    localStorage.setItem('hostelease_tts_muted', String(next));
    announce(`Voice announcements ${next ? 'muted' : 'unmuted'}`, !next);
  };

  return (
    <>
      {/* Trigger Button in Navbar / Header */}
      <button
        className="btn btn-sm btn-outline-light d-flex align-items-center gap-1.5 px-2 py-1 rounded-pill"
        onClick={() => setIsA11yMenuOpen(true)}
        aria-label="Accessibility options and text sizing"
        title="Accessibility Settings (Alt + A)"
      >
        <BiUniversalAccess className="fs-5 text-warning" />
        <span className="small d-none d-md-inline fw-semibold">Accessibility</span>
      </button>

      {/* Accessibility Modal Drawer */}
      {isA11yMenuOpen && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          aria-labelledby="a11y-modal-title"
          aria-modal="true"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', zIndex: 1060 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsA11yMenuOpen(false);
          }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
            <div className="modal-content shadow-lg border-2 border-chocolate">
              <div className="modal-header bg-dark text-white py-2 px-3">
                <div className="d-flex align-items-center gap-2">
                  <BiUniversalAccess className="fs-4 text-warning" />
                  <h5 className="modal-title fs-6 fw-bold mb-0" id="a11y-modal-title">
                    Accessibility & Text Settings
                  </h5>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  aria-label="Close accessibility settings"
                  onClick={() => setIsA11yMenuOpen(false)}
                />
              </div>

              <div className="modal-body p-3 p-md-4">
                {/* 1. Text Size Selector */}
                <div className="mb-4">
                  <label className="fw-bold text-dark d-flex align-items-center gap-1.5 mb-2 small">
                    <BiFont className="text-chocolate fs-5" /> Adjustable Text Size
                  </label>
                  <p className="text-muted small mb-2">
                    Adjust text scaling for comfortable reading across all pages.
                  </p>
                  <div className="btn-group w-100" role="group" aria-label="Font size selector">
                    <button
                      type="button"
                      className={`btn py-2 ${fontSize === 'normal' ? 'btn-chocolate fw-bold' : 'btn-outline-secondary'}`}
                      onClick={() => handleFontSizeChange('normal')}
                      aria-pressed={fontSize === 'normal'}
                    >
                      <span style={{ fontSize: '0.85rem' }}>A Default</span>
                      <small className="d-block" style={{ fontSize: '0.68rem' }}>(100%)</small>
                    </button>
                    <button
                      type="button"
                      className={`btn py-2 ${fontSize === 'large' ? 'btn-chocolate fw-bold' : 'btn-outline-secondary'}`}
                      onClick={() => handleFontSizeChange('large')}
                      aria-pressed={fontSize === 'large'}
                    >
                      <span style={{ fontSize: '1rem' }}>A+ Large</span>
                      <small className="d-block" style={{ fontSize: '0.68rem' }}>(115%)</small>
                    </button>
                    <button
                      type="button"
                      className={`btn py-2 ${fontSize === 'xlarge' ? 'btn-chocolate fw-bold' : 'btn-outline-secondary'}`}
                      onClick={() => handleFontSizeChange('xlarge')}
                      aria-pressed={fontSize === 'xlarge'}
                    >
                      <span style={{ fontSize: '1.15rem' }}>A++ Extra Large</span>
                      <small className="d-block" style={{ fontSize: '0.68rem' }}>(130%)</small>
                    </button>
                  </div>
                </div>

                {/* 2. High Contrast Mode Toggle */}
                <div className="mb-4 p-3 rounded border bg-light">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-bold text-dark small d-flex align-items-center gap-1.5">
                        <BiSun className="text-warning fs-5" /> High Contrast Display Mode
                      </div>
                      <small className="text-muted d-block mt-0.5">
                        Enhances visual boundaries and text contrast for low-vision users.
                      </small>
                    </div>
                    <div className="form-check form-switch fs-4 mb-0">
                      <input
                        className="form-check-input cursor-pointer"
                        type="checkbox"
                        role="switch"
                        id="highContrastSwitch"
                        checked={highContrast}
                        onChange={handleContrastToggle}
                        aria-label="Toggle high contrast display mode"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Screen Reader Voice Announcements */}
                <div className="mb-4 p-3 rounded border bg-light">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-bold text-dark small d-flex align-items-center gap-1.5">
                        {screenReaderMuted ? (
                          <BiVolumeMute className="text-danger fs-5" />
                        ) : (
                          <BiVolumeFull className="text-success fs-5" />
                        )}
                        Voice Feedback & Audio Announcements
                      </div>
                      <small className="text-muted d-block mt-0.5">
                        Read aloud ticket updates, actions, and status transitions.
                      </small>
                    </div>
                    <button
                      className={`btn btn-sm ${screenReaderMuted ? 'btn-outline-secondary' : 'btn-success'}`}
                      onClick={handleVoiceToggle}
                      aria-label="Toggle voice feedback"
                    >
                      {screenReaderMuted ? 'Muted' : 'Enabled'}
                    </button>
                  </div>
                </div>

                {/* 4. Keyboard Shortcuts Reference */}
                <div>
                  <div className="fw-bold text-dark small d-flex align-items-center gap-1 mb-2">
                    <BiCommand className="text-chocolate fs-5" /> Keyboard Navigation Shortcuts
                  </div>
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered small mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Shortcut</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><kbd>Alt</kbd> + <kbd>A</kbd></td>
                          <td>Toggle this accessibility menu</td>
                        </tr>
                        <tr>
                          <td><kbd>Alt</kbd> + <kbd>L</kbd></td>
                          <td>Toggle high contrast mode</td>
                        </tr>
                        <tr>
                          <td><kbd>Alt</kbd> + <kbd>+</kbd> / <kbd>-</kbd></td>
                          <td>Increase or decrease text size</td>
                        </tr>
                        <tr>
                          <td><kbd>Tab</kbd> / <kbd>Shift + Tab</kbd></td>
                          <td>Navigate interactive elements</td>
                        </tr>
                        <tr>
                          <td><kbd>Escape</kbd></td>
                          <td>Close modal dialogs or menus</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="modal-footer py-2 px-3 bg-light d-flex justify-content-between">
                <small className="text-muted">Settings are saved automatically</small>
                <button
                  type="button"
                  className="btn btn-sm btn-chocolate fw-bold px-3"
                  onClick={() => setIsA11yMenuOpen(false)}
                >
                  <BiCheck className="me-1" /> Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

