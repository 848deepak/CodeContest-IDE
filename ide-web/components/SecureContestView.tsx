'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import WebcamMonitor from './WebcamMonitor';

interface SecureContestViewProps {
  contestId: string;
  requireFullScreen: boolean;
  disableCopyPaste: boolean;
  preventTabSwitching: boolean;
  requireWebcamMonitoring?: boolean;
  children: React.ReactNode;
  onAllowEndRef?: React.MutableRefObject<(() => void) | undefined>;
}

export default function SecureContestView({
  contestId,
  requireFullScreen,
  disableCopyPaste,
  preventTabSwitching,
  requireWebcamMonitoring = false,
  children,
  onAllowEndRef,
}: SecureContestViewProps) {
  const router = useRouter();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [securityWarnings, setSecurityWarnings] = useState<string[]>([]);
  const [securityViolations, setSecurityViolations] = useState(0);
  const MAX_VIOLATIONS = 3;
  const lastFocusTime = useRef<number>(Date.now());
  const windowFocused = useRef<boolean>(true);
  const focusCheckIntervalId = useRef<number | null>(null);

  // Record security violations
  const recordViolation = (message: string) => {
    setSecurityWarnings(prev => [...prev, message]);
    setSecurityViolations(prev => {
      const newCount = prev + 1;
      if (newCount >= MAX_VIOLATIONS) {
        // Log the user out or take other action after too many violations
        router.push(`/contests/${contestId}/violation`);
      }
      return newCount;
    });
  };

  // Request full screen
  const requestFullScreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } catch (error) {
      console.error('Failed to enter full screen mode:', error);
      setSecurityWarnings(prev => [...prev, 'Full screen mode is required for this contest. Please allow full screen.']);
    }
  };

  // Handle window blur event
  const handleWindowBlur = () => {
    windowFocused.current = false;
    lastFocusTime.current = Date.now();
  };

  // Handle window focus event
  const handleWindowFocus = () => {
    // If the window was previously unfocused, check how long it's been
    if (!windowFocused.current) {
      const timeSinceBlur = Date.now() - lastFocusTime.current;
      if (timeSinceBlur > 1000) { // If more than 1 second, likely switched tabs
        recordViolation('Tab switching detected. Please stay on this tab during the contest.');
      }
    }
    windowFocused.current = true;
  };

  // Prevent navigation using back/forward buttons
  const preventNavigation = (e: PopStateEvent) => {
    // Push the current state back to history to prevent navigation
    window.history.pushState(null, '', window.location.href);
    recordViolation('Browser navigation (back/forward) is disabled during the contest.');
    
    // Additionally display an alert to make it very clear to the user
    setTimeout(() => {
      alert('Back navigation is disabled during the contest');
    }, 0);
  };

  // Handle tab switching
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      recordViolation('Tab switching detected. Please stay on this tab during the contest.');
      lastFocusTime.current = Date.now();
    }
  };

  // Prevent default actions
  const preventDefaultAction = (e: Event) => {
    e.preventDefault();
    recordViolation('Copy/paste is disabled during this contest.');
  };

  // Prevent keyboard shortcuts for copy/paste
  const preventCopyPasteShortcuts = (e: KeyboardEvent) => {
    // Check for Ctrl+C, Ctrl+V, Ctrl+X
    if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
      e.preventDefault();
      recordViolation('Copy/paste keyboard shortcuts are disabled during this contest.');
    }
    
    // Prevent navigation shortcuts
    if (
      (e.key === 'F5') || // Refresh
      (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) || // Alt+Left/Right for browser navigation
      (e.ctrlKey && e.key === 'r') || // Ctrl+R for refresh
      (e.ctrlKey && e.key === 'l') || // Ctrl+L to focus address bar
      (e.ctrlKey && e.key === '[') || // Ctrl+[ sometimes works as back in some browsers
      (e.key === 'F11') || // F11 for fullscreen toggle
      (e.key === 'Escape') || // Escape to exit fullscreen
      (e.key === 'Backspace' && document.activeElement === document.body) // Backspace when no input is focused
    ) {
      e.preventDefault();
      e.stopPropagation();
      recordViolation('Navigation shortcuts are disabled during this contest.');
    }
  };

  // Handle full screen change
  const handleFullScreenChange = () => {
    const isCurrentlyFullScreen = !!document.fullscreenElement;
    setIsFullScreen(isCurrentlyFullScreen);
    
    if (requireFullScreen && !isCurrentlyFullScreen) {
      recordViolation('Full screen mode exited. Please return to full screen to continue.');
      // Try to go back to full screen after a short delay
      setTimeout(() => {
        requestFullScreen();
      }, 1000);
    }
  };

  // Create a shared variable to track if a submission/finish was explicitly allowed
  // by the parent component (after confirmation dialog)
  const allowEndNavigation = useRef(false);

  // Method to be exposed to parent component to allow end navigation
  const setAllowEndNavigation = () => {
    allowEndNavigation.current = true;
  };

  // Expose the setAllowEndNavigation method through the ref
  useEffect(() => {
    if (onAllowEndRef) {
      onAllowEndRef.current = () => {
        allowEndNavigation.current = true;
      };
    }
    
    return () => {
      if (onAllowEndRef) {
        onAllowEndRef.current = undefined;
      }
    };
  }, [onAllowEndRef]);

  // Request full screen when component mounts
  // Override router methods to prevent programmatic navigation
  useEffect(() => {
    const originalPush = router.push;
    const originalBack = router.back;
    const originalReplace = router.replace;
    
    // Override router methods
    router.push = (href: string) => {
      // Only allow navigation to problem pages within the same contest
      if (href.includes(`/contests/${contestId}/problems/`)) {
        return originalPush(href);
      }
      
      // Allow submission or finish pages, but only when confirmed through the custom end dialog
      // The parent component handles showing the dialog and collecting the "end" confirmation
      if ((href.includes(`/contests/${contestId}/submit`) || href.includes(`/contests/${contestId}/finish`)) && 
          allowEndNavigation.current) {
        // This means the end dialog confirmed with "end" text
        // Reset the flag immediately to prevent multiple navigations
        allowEndNavigation.current = false;
        return originalPush(href);
      }
      
      // Block other navigation attempts
      recordViolation('Navigation attempt detected and blocked');
      return Promise.resolve(false);
    };
    
    router.back = () => {
      recordViolation('Back navigation attempt detected and blocked');
      alert('Back navigation is not allowed during the contest');
      return Promise.resolve(false);
    };
    
    router.replace = (href: string) => {
      // Only allow navigation to problem pages within the same contest
      if (href.includes(`/contests/${contestId}/problems/`)) {
        return originalReplace(href);
      }
      
      // Allow submission or finish pages, but only when confirmed through the custom end dialog
      // The parent component handles showing the dialog and collecting the "end" confirmation
      if ((href.includes(`/contests/${contestId}/submit`) || href.includes(`/contests/${contestId}/finish`)) && 
          allowEndNavigation.current) {
        // This means the end dialog confirmed with "end" text
        // Reset the flag immediately to prevent multiple navigations
        allowEndNavigation.current = false;
        return originalReplace(href);
      }
      
      // Block other navigation attempts
      recordViolation('Navigation attempt detected and blocked');
      return Promise.resolve(false);
    };
    
    return () => {
      // Restore original router methods
      router.push = originalPush;
      router.back = originalBack;
      router.replace = originalReplace;
    };
  }, [router, contestId]);

  useEffect(() => {
    if (requireFullScreen && !isFullScreen) {
      requestFullScreen();
    }

    // Set up tab visibility and focus detection
    if (preventTabSwitching) {
      // Primary detection method - visibilitychange
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Secondary detection methods - window blur/focus
      window.addEventListener('blur', handleWindowBlur);
      window.addEventListener('focus', handleWindowFocus);
      
      // Periodic check for focus status
      focusCheckIntervalId.current = window.setInterval(() => {
        // If window has lost focus for more than 2 seconds, consider it a tab switch
        if (!windowFocused.current && Date.now() - lastFocusTime.current > 2000) {
          recordViolation('Tab switching or window change detected. Please stay on the contest tab.');
          windowFocused.current = true; // Reset to prevent multiple violations
        }
      }, 2000);
    }

    // Prevent context menu (right click)
    if (disableCopyPaste) {
      document.addEventListener('contextmenu', preventDefaultAction);
    }

    // Prevent copy/paste if disabled
    if (disableCopyPaste) {
      document.addEventListener('copy', preventDefaultAction);
      document.addEventListener('cut', preventDefaultAction);
      document.addEventListener('paste', preventDefaultAction);
    }

    // Prevent browser navigation (back/forward)
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', preventNavigation);

    // Multiple pushStates to ensure the history stack has many entries
    // This makes it harder to navigate back multiple times
    for (let i = 0; i < 10; i++) {
      window.history.pushState(null, '', window.location.href);
    }

    // Prevent page exit/refresh
    const preventPageExit = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      recordViolation('Attempted to leave or refresh the page during the contest.');
      return '';
    };
    window.addEventListener('beforeunload', preventPageExit);
    
    // Additional handling for navigation attempts
    const preventUnload = () => {
      recordViolation('Attempted to navigate away from the contest.');
      // Log the violation before potentially leaving the page
      fetch('/api/contests/violation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contestId,
          violationType: 'navigation',
          message: 'User attempted to leave the contest page',
        }),
        // Use keepalive to ensure the request completes even if the page is unloading
        keepalive: true,
      }).catch(err => console.error('Failed to log violation:', err));
    };
    window.addEventListener('unload', preventUnload);

    // Prevent keyboard shortcuts for copy/paste and navigation
    document.addEventListener('keydown', preventCopyPasteShortcuts, true);

    // Detect full screen exit
    if (requireFullScreen) {
      document.addEventListener('fullscreenchange', handleFullScreenChange);
    }

    // Intercept all link clicks to prevent navigation
    const interceptLinkClicks = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      if (link) {
        const href = link.getAttribute('href');
        
        // Check for back links specifically and immediately block them
        if (href && (
          href.includes('/contests') && !href.includes(`/contests/${contestId}`) ||
          href === '/contests' ||
          href.includes('back') ||
          link.textContent?.toLowerCase().includes('back')
        )) {
          e.preventDefault();
          e.stopPropagation();
          recordViolation('Back navigation is disabled during the contest');
          return;
        }
        
        // Only allow navigation to problems within the same contest
        if (href && href.includes(`/contests/${contestId}/problems/`)) {
          // This is allowed - let the navigation happen
          return;
        }
        
        // Allow submit button with confirmation
        if (href && (href.includes(`/contests/${contestId}/submit`) || href.includes(`/contests/${contestId}/finish`))) {
          // We'll use the parent component's custom end dialog instead
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        
        // Block all other navigation
        e.preventDefault();
        e.stopPropagation();
        recordViolation('Navigation to other pages is disabled during the contest.');
      }
    };
    
    // Hide all back links in the DOM - more aggressive approach
    const hideBackLinks = () => {
      // First, find all links that contain 'back' in text or href
      const allLinks = document.querySelectorAll('a');
      allLinks.forEach(link => {
        const href = link.getAttribute('href') || '';
        const text = link.textContent?.toLowerCase() || '';
        
        // Check for back-related content
        if (
          href.includes('back') || 
          text.includes('back') ||
          text.includes('return') ||
          href === '/contests' ||
          (href.includes('/contests') && !href.includes(`/contests/${contestId}`))
        ) {
          // First option: completely remove the element
          if (link.parentNode) {
            link.parentNode.removeChild(link);
          } else {
            // If can't remove, then hide and disable
            link.style.display = 'none';
            link.setAttribute('disabled', 'true');
            link.setAttribute('aria-hidden', 'true');
            link.removeAttribute('href');
            // Add empty click handler to prevent default
            link.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              recordViolation('Back navigation attempt detected and blocked');
              return false;
            };
          }
        }
      });
      
      // Also hide elements with class/id containing 'back'
      const backElements = document.querySelectorAll('[class*="back"], [id*="back"]');
      backElements.forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });
    };
    
    // Run initially and then every second to catch dynamically added links
    hideBackLinks();
    const hideBackInterval = setInterval(hideBackLinks, 500); // More frequent checking
    document.addEventListener('click', interceptLinkClicks, true);

    return () => {
      // Clean up event listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      if (focusCheckIntervalId.current) {
        window.clearInterval(focusCheckIntervalId.current);
        focusCheckIntervalId.current = null;
      }
      document.removeEventListener('contextmenu', preventDefaultAction);
      document.removeEventListener('copy', preventDefaultAction);
      document.removeEventListener('cut', preventDefaultAction);
      document.removeEventListener('paste', preventDefaultAction);
      document.removeEventListener('keydown', preventCopyPasteShortcuts, true);
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      window.removeEventListener('popstate', preventNavigation);
      window.removeEventListener('beforeunload', preventPageExit);
      window.removeEventListener('unload', preventUnload);
      document.removeEventListener('click', interceptLinkClicks, true);
      clearInterval(hideBackInterval);
    };
  }, [requireFullScreen, disableCopyPaste, preventTabSwitching, isFullScreen, contestId]);

  // Capture webcam screenshot on violation for evidence
  const captureWebcamScreenshot = async () => {
    try {
      // Find the webcam element in the DOM
      const webcamElement = document.querySelector('video');
      if (!webcamElement) return null;
      
      // Create a canvas to capture the screenshot
      const canvas = document.createElement('canvas');
      canvas.width = webcamElement.videoWidth;
      canvas.height = webcamElement.videoHeight;
      
      // Draw the video frame to the canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(webcamElement, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64 data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      
      // In a real implementation, you would upload this to your server
      // For this example, we'll just return the data URL
      return dataUrl;
    } catch (error) {
      console.error('Error capturing webcam screenshot:', error);
      return null;
    }
  };
  
  // Record webcam-specific violation
  const recordWebcamViolation = async (message: string, violationType: string) => {
    // Record general violation first
    recordViolation(message);
    
    // Capture screenshot for evidence
    const screenshot = await captureWebcamScreenshot();
    
    // Log violation with screenshot
    fetch('/api/contests/violation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contestId,
        violationType,
        details: message,
        screenshotUrl: screenshot, // In production, store the URL after uploading
      }),
    }).catch(err => console.error('Failed to log webcam violation:', err));
  };

  return (
    <div className="secure-contest-view">
      {/* Security warning banner */}
      {securityWarnings.length > 0 && (
        <div className="bg-red-600 text-white p-4 sticky top-0 z-50">
          <h3 className="font-bold mb-2">Security Warning ({securityViolations}/{MAX_VIOLATIONS})</h3>
          <ul className="list-disc pl-5">
            {securityWarnings.slice(-3).map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
          {requireFullScreen && !isFullScreen && (
            <button 
              onClick={requestFullScreen}
              className="mt-2 bg-white text-red-600 px-4 py-2 rounded font-semibold"
            >
              Return to Full Screen
            </button>
          )}
        </div>
      )}

      {/* Webcam monitoring - temporarily disabled */}
      {requireWebcamMonitoring && false && (
        <WebcamMonitor 
          enabled={requireWebcamMonitoring}
          onViolation={(message) => recordWebcamViolation(message, 'webcam')}
          onWarning={(message) => setSecurityWarnings(prev => [...prev, message])}
        />
      )}

      {/* Contest content */}
      {children}
    </div>
  );
}
