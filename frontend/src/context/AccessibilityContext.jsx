import React, { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext();

export const AccessibilityProvider = ({ children }) => {
  // Load preferences from localStorage
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('hostelease_fontsize') || 'normal';
  });

  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('hostelease_contrast') === 'true';
  });

  const [screenReaderMuted, setScreenReaderMuted] = useState(() => {
    return localStorage.getItem('hostelease_tts_muted') === 'true';
  });

  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const [isA11yMenuOpen, setIsA11yMenuOpen] = useState(false);

  // Apply font size class to documentElement
  useEffect(() => {
    document.documentElement.classList.remove('font-size-normal', 'font-size-large', 'font-size-xlarge');
    document.documentElement.classList.add(`font-size-${fontSize}`);
    localStorage.setItem('hostelease_fontsize', fontSize);
  }, [fontSize]);

  // Apply high contrast class to documentElement
  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast-mode');
    } else {
      document.documentElement.classList.remove('high-contrast-mode');
    }
    localStorage.setItem('hostelease_contrast', String(highContrast));
  }, [highContrast]);

  // Screen reader announcer
  const announce = (message, speakAloud = false) => {
    setLiveAnnouncement('');
    setTimeout(() => {
      setLiveAnnouncement(message);
    }, 50);

    if (speakAloud && !screenReaderMuted && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Keyboard navigation & global shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is actively typing in an input or textarea
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
      if (isInput && e.key !== 'Escape') return;

      // Alt + A: Open Accessibility Panel
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setIsA11yMenuOpen(prev => !prev);
        announce('Accessibility menu toggled');
      }

      // Alt + L: Toggle High Contrast
      if (e.altKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        setHighContrast(prev => {
          const next = !prev;
          announce(`High contrast mode ${next ? 'enabled' : 'disabled'}`, true);
          return next;
        });
      }

      // Alt + Plus / Equal: Increase font size
      if (e.altKey && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        setFontSize(prev => {
          const next = prev === 'normal' ? 'large' : 'xlarge';
          announce(`Text size set to ${next}`, true);
          return next;
        });
      }

      // Alt + Minus: Decrease font size
      if (e.altKey && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        setFontSize(prev => {
          const next = prev === 'xlarge' ? 'large' : 'normal';
          announce(`Text size set to ${next}`, true);
          return next;
        });
      }

      // Escape: Close accessibility panel or modal
      if (e.key === 'Escape') {
        if (isA11yMenuOpen) {
          setIsA11yMenuOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isA11yMenuOpen, screenReaderMuted]);

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize,
        setFontSize,
        highContrast,
        setHighContrast,
        screenReaderMuted,
        setScreenReaderMuted,
        isA11yMenuOpen,
        setIsA11yMenuOpen,
        announce
      }}
    >
      {/* Hidden live region for screen readers */}
      <div
        id="a11y-live-region"
        aria-live="polite"
        aria-atomic="true"
        className="visually-hidden"
      >
        {liveAnnouncement}
      </div>

      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

