import { useState, useEffect } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

/**
 * Custom hook to generate and manage browser fingerprint
 * The fingerprint is generated once on mount and stored in state
 */
export function useFingerprint() {
  const [fingerprint, setFingerprint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const generateFingerprint = async () => {
      try {
        // Initialize FingerprintJS agent
        const fpPromise = FingerprintJS.load();
        const fp = await fpPromise;

        // Get the visitor identifier
        const result = await fp.get();

        // Store the fingerprint (visitorId is the unique identifier)
        setFingerprint(result.visitorId);
        setLoading(false);

        console.log('Fingerprint generated:', result.visitorId);
      } catch (err) {
        console.error('Error generating fingerprint:', err);
        setError(err);
        setLoading(false);
      }
    };

    generateFingerprint();
  }, []); // Run only once on mount

  return { fingerprint, loading, error };
}