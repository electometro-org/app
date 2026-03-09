import React, { useEffect, useState } from 'react';
import { T } from '@tolgee/react';
import { defaultBranding } from '../config/branding';
import { BrandLogo } from './BrandImage';

const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
const HCAPTCHA_SCRIPT_URL = 'https://js.hcaptcha.com/1/api.js';

// Load a script dynamically and return a promise
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Try to load Turnstile, returns true if successful, false if failed
async function tryLoadTurnstile() {
  try {
    await loadScript(TURNSTILE_SCRIPT_URL);
    await new Promise(resolve => setTimeout(resolve, 100));
    return typeof window.turnstile !== 'undefined';
  } catch {
    return false;
  }
}

// Load hCaptcha as fallback
async function loadHCaptcha() {
  try {
    await loadScript(HCAPTCHA_SCRIPT_URL);
    let attempts = 0;
    while (typeof window.hcaptcha === 'undefined' && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    return typeof window.hcaptcha !== 'undefined';
  } catch {
    return false;
  }
}

export default function TurnstileOverlay({ show, onSuccess, branding = defaultBranding }) {
  const [captchaType, setCaptchaType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [isHidingLoader, setIsHidingLoader] = useState(false);
  const turnstileAbortedRef = React.useRef(false);

  // Hide loader with animation
  const hideLoader = () => {
    setIsHidingLoader(true);
    setTimeout(() => {
      setIsRendering(false);
      setIsHidingLoader(false);
    }, 300); // Match animation duration
  };

  // Load captcha scripts on mount
  useEffect(() => {
    if (!show) return;

    turnstileAbortedRef.current = false;
    let cancelled = false;

    async function initCaptcha() {
      setIsLoading(true);

      const turnstileLoaded = await tryLoadTurnstile();
      if (cancelled) return;

      if (turnstileLoaded) {
        setCaptchaType('turnstile');
        setIsLoading(false);
        return;
      }

      const hcaptchaLoaded = await loadHCaptcha();
      if (cancelled) return;

      if (hcaptchaLoaded) {
        setCaptchaType('hcaptcha');
      } else {
        setCaptchaType('failed');
      }
      setIsLoading(false);
    }

    initCaptcha();

    return () => { cancelled = true; };
  }, [show]);

  // Fall back to hCaptcha when Turnstile fails during render
  const fallbackToHCaptcha = async () => {
    if (turnstileAbortedRef.current) return;
    turnstileAbortedRef.current = true;

    const container = document.getElementById('turnstile-overlay-widget');
    if (container) {
      try {
        const widgetId = container.querySelector('iframe')?.closest('[data-turnstile-widget-id]')?.getAttribute('data-turnstile-widget-id');
        if (widgetId && window.turnstile?.remove) {
          window.turnstile.remove(widgetId);
        }
      } catch {
        // Ignore cleanup errors
      }
      container.innerHTML = '';
    }

    setIsRendering(true);
    const hcaptchaLoaded = await loadHCaptcha();
    if (hcaptchaLoaded) {
      setCaptchaType('hcaptcha');
    } else {
      setCaptchaType('failed');
      setIsRendering(false);
    }
  };

  // Render the appropriate captcha widget
  useEffect(() => {
    if (!show || isLoading || !captchaType) return;

    const container = document.getElementById('turnstile-overlay-widget');
    if (!container) return;
    container.innerHTML = '';

    let checkWidgetInterval = null;
    let timeoutId = null;
    let widgetAppeared = false;
    let turnstileWidgetId = null;

    if (captchaType === 'turnstile') {
      setIsRendering(true);

      checkWidgetInterval = setInterval(() => {
        const wrapperDiv = container.querySelector('div');
        const rect = wrapperDiv ? wrapperDiv.getBoundingClientRect() : null;
        const hasVisibleSize = rect && rect.height > 20;

        if (hasVisibleSize && !widgetAppeared) {
          widgetAppeared = true;
          hideLoader();
          clearInterval(checkWidgetInterval);
          checkWidgetInterval = null;
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      }, 300);

      timeoutId = setTimeout(() => {
        if (checkWidgetInterval) clearInterval(checkWidgetInterval);
        if (!widgetAppeared && !turnstileAbortedRef.current) {
          fallbackToHCaptcha();
        }
      }, 3000);

      turnstileWidgetId = window.turnstile.render('#turnstile-overlay-widget', {
        sitekey: import.meta.env.VITE_TURNSTILE_FORM_KEY,
        theme: 'light',
        size: 'normal',
        'error-callback': function () {
          if (checkWidgetInterval) clearInterval(checkWidgetInterval);
          if (timeoutId) clearTimeout(timeoutId);
          if (!turnstileAbortedRef.current) {
            fallbackToHCaptcha();
          }
        },
        'expired-callback': function () {},
        'timeout-callback': function () {},
        'unsupported-callback': function () {
          if (checkWidgetInterval) clearInterval(checkWidgetInterval);
          if (timeoutId) clearTimeout(timeoutId);
          if (!turnstileAbortedRef.current) {
            fallbackToHCaptcha();
          }
        },
        'callback': function (token) {
          if (checkWidgetInterval) clearInterval(checkWidgetInterval);
          if (timeoutId) clearTimeout(timeoutId);
          if (turnstileAbortedRef.current) return;
          hideLoader();
          setTimeout(() => {
            if (onSuccess) onSuccess(token, 'turnstile');
          }, 1500);
        },
      });
    } else if (captchaType === 'hcaptcha') {
      setIsRendering(true);
      try {
        window.hcaptcha.render('turnstile-overlay-widget', {
          sitekey: import.meta.env.VITE_HCAPTCHA_SITE_KEY,
          theme: 'light',
          callback: function (token) {
            setTimeout(() => {
              if (onSuccess) onSuccess(token, 'hcaptcha');
            }, 1500);
          },
          'error-callback': function () {},
        });
        hideLoader();
      } catch {
        setIsRendering(false);
        setCaptchaType('failed');
      }
    }

    return () => {
      if (checkWidgetInterval) clearInterval(checkWidgetInterval);
      if (timeoutId) clearTimeout(timeoutId);
      if (turnstileWidgetId && window.turnstile?.remove) {
        try {
          window.turnstile.remove(turnstileWidgetId);
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [show, isLoading, captchaType, onSuccess]);

  if (!show) return null;

  const showLoader = isLoading || isRendering;

  return (
    <div className="turnstile-overlay">
      <div className="turnstile-overlay-content">
        <BrandLogo branding={branding} />
        <h2><T keyName="turnstile.title" /></h2>
        <p><T keyName="turnstile.description" /></p>
        {showLoader && (
          <div className={`captcha-loading ${isHidingLoader ? 'captcha-loading--hiding' : ''}`}>
            <div className="captcha-spinner"></div>
            <T keyName="turnstile.loading" defaultValue="Loading verification..." />
          </div>
        )}
        {captchaType === 'failed' && (
          <div className="captcha-error">
            <T keyName="turnstile.loadError" defaultValue="Verification unavailable. Please try a different browser." />
          </div>
        )}
        <div id="turnstile-overlay-widget"></div>
      </div>
    </div>
  );
}