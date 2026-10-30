import React, { useState, useEffect, useRef } from 'react';
import {
  BiMicrophone,
  BiStopCircle,
  BiVolumeFull,
  BiCheckCircle,
  BiX,
  BiHelpCircle,
  BiWrench,
  BiSend
} from 'react-icons/bi';

import { smartClassifyCategory } from '../utils/categoryClassifier';

// Helper to get SpeechRecognition instance
const getSpeechRecognition = () => {
  if (typeof window === 'undefined') return null;
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  return SpeechRec ? new SpeechRec() : null;
};

export { smartClassifyCategory };

/**
 * Reusable single-field dictation button.
 * Click to speak and fill any text input or textarea.
 */
export const FieldVoiceDictation = ({ onTranscript, ariaLabel = "Dictate with voice" }) => {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);
  const silenceTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
    };
  }, []);

  const stopListening = () => {
    shouldListenRef.current = false;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setListening(false);
  };

  const toggleListen = () => {
    if (listening) {
      stopListening();
      return;
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Speech Recognition is not supported by your current browser. You can still type directly.');
      return;
    }

    const recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    shouldListenRef.current = true;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event) => {
      let accumulated = '';
      for (let i = 0; i < event.results.length; i++) {
        accumulated += event.results[i][0].transcript + ' ';
      }
      accumulated = accumulated.trim();
      if (accumulated) {
        onTranscript(accumulated);

        // Keep mic open, only stop after 4 seconds of quiet after speech
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          stopListening();
        }, 4000);
      }
    };

    recognition.onerror = (err) => {
      if (err.error === 'no-speech' && shouldListenRef.current) {
        return;
      }
      shouldListenRef.current = false;
      setListening(false);
    };

    recognition.onend = () => {
      if (shouldListenRef.current) {
        try {
          recognition.start();
        } catch {
          setTimeout(() => {
            if (shouldListenRef.current) {
              try { recognition.start(); } catch {}
            }
          }, 250);
        }
      } else {
        setListening(false);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setListening(false);
    }
  };

  return (
    <button
      type="button"
      className={`btn btn-sm ${listening ? 'btn-danger animate-pulse' : 'btn-outline-secondary'}`}
      onClick={toggleListen}
      title={listening ? 'Listening... click to stop' : 'Click to speak'}
      aria-label={ariaLabel}
      style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
    >
      <BiMicrophone className={listening ? 'fs-5' : 'fs-6'} />
    </button>
  );
};

/**
 * Full Step-by-Step Voice-Guided Complaint Assistant Modal
 */
export const VoiceComplaintAssistant = ({ isOpen, onClose, onComplete }) => {
  const [step, setStep] = useState(1);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);

  // Form State being built via voice
  const [voiceForm, setVoiceForm] = useState({
    title: '',
    category: 'FURNITURE',
    description: '',
    priority: 'MEDIUM'
  });

  const [currentTranscript, setCurrentTranscript] = useState('');
  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);
  const silenceTimerRef = useRef(null);
  const currentTextRef = useRef('');

  const stopListening = () => {
    shouldListenRef.current = false;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setIsListening(false);
  };

  // Speak a prompt aloud
  const speakPrompt = (text, callback) => {
    stopListening();
    if (!window.speechSynthesis) {
      if (callback) callback();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (callback) callback();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      if (callback) callback();
    };

    window.speechSynthesis.speak(utterance);
  };

  // Start listening continuously for user speech without turning off on pauses
  const startListeningForStep = (stepNumber) => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      setVoiceSupported(false);
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      shouldListenRef.current = true;
      currentTextRef.current = '';
      setCurrentTranscript('');

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let accumulated = '';
        for (let i = 0; i < event.results.length; i++) {
          accumulated += event.results[i][0].transcript + ' ';
        }
        accumulated = accumulated.trim();
        if (accumulated) {
          setCurrentTranscript(accumulated);
          currentTextRef.current = accumulated;

          // Auto-advance after 3.5s of quiet AFTER user has spoken
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (shouldListenRef.current && currentTextRef.current.trim().length >= 3) {
              const finalText = currentTextRef.current.trim();
              stopListening();
              handleStepResult(stepNumber, finalText);
            }
          }, 3500);
        }
      };

      recognition.onerror = (e) => {
        if (e.error === 'no-speech' && shouldListenRef.current) {
          return;
        }
      };

      recognition.onend = () => {
        if (shouldListenRef.current) {
          try {
            recognition.start();
          } catch {
            setTimeout(() => {
              if (shouldListenRef.current) {
                try { recognition.start(); } catch {}
              }
            }, 300);
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleStepResult = (currentStep, text) => {
    stopListening();
    const cleanText = text.trim();
    if (!cleanText) return;

    if (currentStep === 1) {
      const smartCat = smartClassifyCategory('', cleanText, '');
      setVoiceForm(prev => ({
        ...prev,
        title: cleanText,
        category: smartCat !== 'OTHER' ? smartCat : prev.category
      }));

      setTimeout(() => {
        setStep(2);
        promptStep(2, cleanText, smartCat);
      }, 700);
    } else if (currentStep === 2) {
      const smartCat = smartClassifyCategory(cleanText, voiceForm.title, voiceForm.description);
      setVoiceForm(prev => ({ ...prev, category: smartCat }));

      setTimeout(() => {
        setStep(3);
        promptStep(3);
      }, 700);
    } else if (currentStep === 3) {
      setVoiceForm(prev => {
        const refinedCat = prev.category === 'OTHER'
          ? smartClassifyCategory('', prev.title, cleanText)
          : prev.category;
        return {
          ...prev,
          description: cleanText,
          category: refinedCat !== 'OTHER' ? refinedCat : prev.category
        };
      });

      setTimeout(() => {
        setStep(4);
        promptStep(4);
      }, 700);
    } else if (currentStep === 4) {
      let matchedPriority = 'MEDIUM';
      const lower = cleanText.toLowerCase();
      if (lower.includes('emergency') || lower.includes('urgent') || lower.includes('danger') || lower.includes('critical') || lower.includes('hazard')) {
        matchedPriority = 'CRITICAL';
      } else if (lower.includes('high') || lower.includes('serious') || lower.includes('asap') || lower.includes('fast')) {
        matchedPriority = 'HIGH';
      } else if (lower.includes('low') || lower.includes('minor') || lower.includes('not urgent')) {
        matchedPriority = 'LOW';
      }
      setVoiceForm(prev => ({ ...prev, priority: matchedPriority }));

      setTimeout(() => {
        setStep(5);
        speakPrompt('Great! All complaint details have been captured. Please review on screen and confirm to submit.');
      }, 700);
    }
  };

  const toggleListeningCurrentStep = () => {
    if (isListening) {
      stopListening();
    } else {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setIsSpeaking(false);
      startListeningForStep(step);
    }
  };

  const promptStep = (stepNumber, titleContext = '', preClassifiedCat = '') => {
    if (stepNumber === 1) {
      speakPrompt('What is the main problem? For example, my door is not opening or water is leaking in bathroom.', () => {
        startListeningForStep(1);
      });
    } else if (stepNumber === 2) {
      const catToUse = preClassifiedCat || voiceForm.category;
      const catNames = {
        FURNITURE: 'Furniture and Door issue',
        ELECTRICITY: 'Electricity and Power issue',
        PLUMBING: 'Plumbing and Water issue',
        WIFI: 'Internet and Wi-Fi issue',
        CLEANLINESS: 'Cleanliness and Sanitation issue',
        OTHER: 'General Maintenance issue'
      };

      const suggestion = catNames[catToUse] || 'General Maintenance';
      speakPrompt(`We detected this is a ${suggestion}. Say 'confirm' to keep it, or say another category like Plumbing, Electricity, Furniture, Wi-Fi, or Cleaning.`, () => {
        startListeningForStep(2);
      });
    } else if (stepNumber === 3) {
      speakPrompt('Please describe the problem in more detail. For example, the latch is jammed from the inside.', () => {
        startListeningForStep(3);
      });
    } else if (stepNumber === 4) {
      speakPrompt('What is the priority? You can say Low, Medium, High, or Critical.', () => {
        startListeningForStep(4);
      });
    }
  };

  const resetAssistantState = () => {
    stopListening();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setStep(1);
    setVoiceForm({
      title: '',
      category: 'FURNITURE',
      description: '',
      priority: 'MEDIUM'
    });
    setCurrentTranscript('');
    currentTextRef.current = '';
    setIsSpeaking(false);
  };

  // Trigger step 1 prompt on open and reset any previous voice input
  useEffect(() => {
    if (isOpen) {
      resetAssistantState();
      setTimeout(() => {
        promptStep(1);
      }, 150);
    } else {
      resetAssistantState();
    }
  }, [isOpen]);

  const handleClose = () => {
    resetAssistantState();
    onClose();
  };

  const handleApplyToForm = () => {
    onComplete(voiceForm);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      aria-labelledby="voice-modal-title"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '540px' }}>
        <div className="modal-content shadow-lg border-2 border-chocolate">
          <div className="modal-header bg-chocolate text-white py-2.5 px-3 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <BiMicrophone className="fs-4 text-warning" />
              <h5 className="modal-title fs-6 fw-bold mb-0" id="voice-modal-title">
                Smart Voice-Guided Complaint Assistant
              </h5>
            </div>
            <button
              type="button"
              className="btn btn-link text-white p-0 border-0 d-flex align-items-center justify-content-center"
              aria-label="Close voice assistant"
              onClick={handleClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                textDecoration: 'none'
              }}
              title="Close voice guide"
            >
              <BiX style={{ fontSize: '1.75rem', color: '#ffffff' }} />
            </button>
          </div>

          <div className="modal-body p-4 text-center">
            {/* Step Progress Tracker */}
            <div className="d-flex justify-content-between align-items-center mb-4 px-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className="d-flex flex-column align-items-center">
                  <div
                    className={`rounded-circle d-flex align-items-center justify-content-center fw-bold small ${
                      step === s
                        ? 'bg-chocolate text-white ring-2'
                        : step > s
                        ? 'bg-success text-white'
                        : 'bg-light text-muted border'
                    }`}
                    style={{ width: '28px', height: '28px', fontSize: '0.78rem' }}
                  >
                    {step > s ? '✓' : s}
                  </div>
                  <span className="text-muted" style={{ fontSize: '0.65rem' }}>
                    {s === 1 ? 'Title' : s === 2 ? 'Category' : s === 3 ? 'Details' : s === 4 ? 'Urgency' : 'Review'}
                  </span>
                </div>
              ))}
            </div>

            {/* Pulsing Listening / Speaking Indicator - Interactive Mic */}
            <div className="my-3">
              <button
                type="button"
                className={`btn mx-auto rounded-circle d-flex align-items-center justify-content-center shadow ${
                  isListening
                    ? 'btn-danger animate-bounce'
                    : isSpeaking
                    ? 'btn-warning text-dark'
                    : 'btn-chocolate text-white'
                }`}
                style={{
                  width: '76px',
                  height: '76px',
                  transition: 'all 0.3s ease',
                  border: isListening ? '4px solid #ffcccc' : 'none'
                }}
                onClick={toggleListeningCurrentStep}
                title={isListening ? 'Microphone is active. Click to pause' : 'Click to start recording'}
              >
                {isSpeaking ? (
                  <BiVolumeFull className="fs-1" />
                ) : (
                  <BiMicrophone className="fs-1" />
                )}
              </button>
              <div className="mt-2 fw-semibold text-dark small">
                {isSpeaking
                  ? 'HostelEase is speaking instructions...'
                  : isListening
                  ? '🔴 Listening continuous... speak your answer'
                  : 'Mic paused — click mic to speak'}
              </div>
              {isListening && (
                <small className="text-muted d-block mt-0.5" style={{ fontSize: '0.72rem' }}>
                  Microphone stays active so you can pause and speak naturally without cut-offs.
                </small>
              )}
            </div>

            {/* Prompt details based on current step */}
            <div className="bg-light p-3 rounded border mb-3 text-start">
              {step === 1 && (
                <div>
                  <span className="badge bg-chocolate mb-1">Step 1: Complaint Title</span>
                  <h6 className="fw-bold text-dark mb-1">What is the problem?</h6>
                  <p className="small text-muted mb-2">Speak a short title (e.g., "My door is not opening" or "Geyser not heating").</p>
                  <div className="fw-semibold text-chocolate small bg-white p-2.5 rounded border">
                    {voiceForm.title || currentTranscript || 'Waiting for speech...'}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="badge bg-chocolate">Step 2: Category</span>
                    <span className="badge bg-success text-white small d-flex align-items-center gap-1">
                      <BiCheckCircle /> Smart Classified
                    </span>
                  </div>
                  <h6 className="fw-bold text-dark mb-1">Assigned Category:</h6>
                  <p className="small text-muted mb-2">
                    Say "Confirm" or click any option below if you'd like to change it:
                  </p>

                  <div className="d-flex flex-wrap gap-1.5 mb-2">
                    {[
                      { id: 'FURNITURE', label: '🪑 Furniture & Doors' },
                      { id: 'ELECTRICITY', label: '⚡ Electricity' },
                      { id: 'PLUMBING', label: '🔧 Plumbing & Water' },
                      { id: 'WIFI', label: '📶 Wi-Fi / Internet' },
                      { id: 'CLEANLINESS', label: '🧹 Cleanliness' },
                      { id: 'OTHER', label: '📦 Other' }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        className={`btn btn-sm py-1 px-2 ${
                          voiceForm.category === cat.id
                            ? 'btn-chocolate fw-bold'
                            : 'btn-outline-secondary bg-white'
                        }`}
                        style={{ fontSize: '0.78rem' }}
                        onClick={() => setVoiceForm(prev => ({ ...prev, category: cat.id }))}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  <div className="small text-muted fst-italic">
                    Speech heard: "{currentTranscript || 'Listening...'}"
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <span className="badge bg-chocolate mb-1">Step 3: Description</span>
                  <h6 className="fw-bold text-dark mb-1">Describe in more detail:</h6>
                  <p className="small text-muted mb-2">Say when it started and what is affected.</p>
                  <div className="fw-semibold text-chocolate small bg-white p-2.5 rounded border" style={{ minHeight: '55px' }}>
                    {voiceForm.description || currentTranscript || 'Waiting for speech...'}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <span className="badge bg-chocolate mb-1">Step 4: Priority</span>
                  <h6 className="fw-bold text-dark mb-1">How urgent is this?</h6>
                  <div className="d-flex flex-wrap gap-2 my-2">
                    {[
                      { id: 'LOW', label: 'Low' },
                      { id: 'MEDIUM', label: 'Medium' },
                      { id: 'HIGH', label: 'High' },
                      { id: 'CRITICAL', label: 'Critical' }
                    ].map(p => (
                      <button
                        key={p.id}
                        type="button"
                        className={`btn btn-sm py-1 px-2.5 ${
                          voiceForm.priority === p.id
                            ? 'btn-chocolate fw-bold'
                            : 'btn-outline-secondary bg-white'
                        }`}
                        onClick={() => setVoiceForm(prev => ({ ...prev, priority: p.id }))}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 5 && (
                <div>
                  <span className="badge bg-success mb-1">Step 5: Ready to Submit</span>
                  <h6 className="fw-bold text-dark mb-2">Review Your Captured Complaint:</h6>
                  <ul className="list-unstyled small mb-0">
                    <li className="mb-1"><strong>Title:</strong> {voiceForm.title}</li>
                    <li className="mb-1"><strong>Category:</strong> {voiceForm.category}</li>
                    <li className="mb-1"><strong>Priority:</strong> {voiceForm.priority}</li>
                    <li><strong>Description:</strong> {voiceForm.description}</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Step Navigation Controls */}
            <div className="d-flex justify-content-between align-items-center gap-2">
              {step < 5 ? (
                <>
                  <div className="d-flex align-items-center gap-1">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => promptStep(step)}
                      disabled={isSpeaking}
                    >
                      Repeat ↺
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={handleClose}
                      title="Exit voice guide"
                    >
                      Exit
                    </button>
                  </div>
                  <div className="d-flex gap-2">
                    {currentTranscript && (
                      <button
                        type="button"
                        className="btn btn-sm btn-success fw-bold d-flex align-items-center gap-1"
                        onClick={() => {
                          const textToSubmit = currentTranscript.trim();
                          stopListening();
                          handleStepResult(step, textToSubmit);
                        }}
                      >
                        Done Speaking ✓
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-sm btn-chocolate fw-bold"
                      onClick={() => {
                        stopListening();
                        if (step < 4) {
                          setStep(step + 1);
                          promptStep(step + 1);
                        } else {
                          setStep(5);
                        }
                      }}
                    >
                      Next Step &rarr;
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  className="btn btn-chocolate w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
                  onClick={handleApplyToForm}
                >
                  <BiCheckCircle className="fs-5" /> Populate Complaint Form & Proceed
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
