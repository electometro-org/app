import { useState } from "react";
import { collectFingerprintPayload, useFingerprint } from "./useFingerprint";
import { buildSubmissionPayload, submitQuizAnswers } from "../services/submissionService";
import { setAnalyticsConsent } from "../utils/analytics";

/**
 * useDemographicsAndSubmission - Demographics → captcha → submit pipeline
 * Takes state, quizDataVersion
 * Returns: { showDemographics, demographics, showTurnstileOverlay, turnstileVerified, submitDemographicsAndComputeResults, handleTurnstileSuccess, submitAnswersToAPI, handleBackToSurvey }
 */
export function useDemographicsAndSubmission(state, quizDataVersion, onResetFlow) {
  const [showDemographics, setShowDemographics] = useState(false);
  const [demographics, setDemographics] = useState(null);
  const [showTurnstileOverlay, setShowTurnstileOverlay] = useState(false);
  const [turnstileVerified, setTurnstileVerified] = useState(false);

  const { fingerprint } = useFingerprint();

  const submitAnswersToAPI = async (demographicsData = null, turnstileToken = null, captchaType = 'turnstile', isResubmission = false, quizVersion = null) => {
    // Honeypot check
    const website_url = document.getElementById('website-url')?.value;
    if (website_url) return;

    try {
      let submissionFingerprint = fingerprint;
      try {
        submissionFingerprint = await collectFingerprintPayload();
        if (typeof window !== "undefined" && submissionFingerprint) {
          window.sessionStorage.setItem("fingerprint", submissionFingerprint);
        }
      } catch (fpError) {
        console.error("Error generating fingerprint for submission:", fpError);
      }

      const payload = buildSubmissionPayload(
        state.questions,
        state.answers,
        state.weights,
        demographicsData,
        submissionFingerprint,
        turnstileToken,
        captchaType,
        isResubmission,
        quizVersion || quizDataVersion
      );
      const data = await submitQuizAnswers(payload);
      console.log("Form submitted successfully:", data);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const submitDemographicsAndComputeResults = (demo) => {
    setDemographics(demo || null);

    if (demo?.analyticsConsent !== undefined) {
      setAnalyticsConsent(demo.analyticsConsent);
    }

    setShowTurnstileOverlay(true);
  };

  const handleTurnstileSuccess = async (token, captchaType = 'turnstile', restoredFromMnemonic = false) => {
    console.log(`${captchaType} verified, submitting form with token`);
    try {
      if (typeof window !== "undefined" && token) {
        window.sessionStorage.setItem("captcha_token", token);
        window.sessionStorage.setItem("turnstile_verified_at", String(Date.now()));
        window.sessionStorage.setItem("captcha_type", captchaType);
      }
    } catch (_) { }

    try {
      await submitAnswersToAPI(demographics, token, captchaType, restoredFromMnemonic, quizDataVersion);
    } catch (error) {
      console.error('Failed to submit form:', error);
    }

    setTurnstileVerified(true);
    setShowTurnstileOverlay(false);
    setShowDemographics(false);

    // Scroll to top when showing results
    window.scrollTo(0, 0);
  };

  const handleBackToSurvey = () => {
    setTurnstileVerified(false);
    setShowTurnstileOverlay(false);
    setShowDemographics(false);
    onResetFlow?.();
    window.scrollTo(0, 0);
  };

  const reset = () => {
    setShowDemographics(false);
    setDemographics(null);
    setShowTurnstileOverlay(false);
    setTurnstileVerified(false);
  };

  return {
    showDemographics,
    setShowDemographics,
    demographics,
    setDemographics,
    showTurnstileOverlay,
    setShowTurnstileOverlay,
    turnstileVerified,
    setTurnstileVerified,
    submitAnswersToAPI,
    submitDemographicsAndComputeResults,
    handleTurnstileSuccess,
    handleBackToSurvey,
    reset,
  };
}
