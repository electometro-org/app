import React, { useEffect } from 'react';
import { T } from '@tolgee/react';
import { defaultBranding } from '../config/branding';
import { BrandLogo } from './BrandImage';

export default function TurnstileOverlay({ show, onSuccess, branding = defaultBranding }) {
  useEffect(() => {
    if (!show) return;

    // Wait for Turnstile to load and render widget
    const initTurnstile = async () => {
      if (!window.turnstile) {
        setTimeout(initTurnstile, 200);
        return;
      }

      // Clear any existing widget
      const container = document.getElementById('turnstile-overlay-widget');
      if (container) container.innerHTML = '';

      try {
        await new Promise((resolve, reject) => {
          window.turnstile.render('#turnstile-overlay-widget', {
            sitekey: import.meta.env.VITE_TURNSTILE_FORM_KEY,
            theme: 'light',
            size: 'normal',
            'error-callback': function (e) {
              console.error('Turnstile error:', e);
              reject(e);
            },
            'callback': function (token) {
              // Wait a bit to show the success checkmark animation
              setTimeout(() => {
                console.log("Turnstile token received");
                resolve(token)
              }, 1500);
            },
          });
        }).then((token) => {
          // Challenge completed successfully
          if (onSuccess) onSuccess(token);
        });
      } catch (error) {
        console.error('Turnstile verification failed:', error);
      }
    };

    initTurnstile();
  }, [show, onSuccess]);

  if (!show) return null;

  return (
    <div className="turnstile-overlay">
      <div className="turnstile-overlay-content">
        <BrandLogo branding={branding} />
        <h2><T keyName="turnstile.title" /></h2>
        <p><T keyName="turnstile.description" /></p>
        <div id="turnstile-overlay-widget"></div>
      </div>
    </div>
  );
}