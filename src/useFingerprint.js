import { useState, useEffect } from 'react';
import FingerprintScanner from 'fpscanner';

let scannerInstance = null;

function getScanner() {
  if (!scannerInstance) {
    scannerInstance = new FingerprintScanner();
  }
  return scannerInstance;
}

export async function collectFingerprintPayload() {
  const scanner = getScanner();
  try {
    return await scanner.collectFingerprint();
  } catch (err) {
    // Safari 12 / strict CSP fallback: skip worker signals
    return await scanner.collectFingerprint({ skipWorker: true });
  }
}

/**
 * Custom hook to generate and manage browser fingerprint
 * The fingerprint is generated once on mount and stored in state
 */
export function useFingerprint() {
  const [fingerprint, setFingerprint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const generateFingerprint = async () => {
      try {
        const payload = await collectFingerprintPayload();
        if (!isMounted) return;
        setFingerprint(payload);
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        console.error('Error generating fingerprint:', err);
        setError(err);
        setLoading(false);
      }
    };

    generateFingerprint();

    return () => {
      isMounted = false;
    };
  }, []); // Run only once on mount

  return { fingerprint, loading, error };
}
