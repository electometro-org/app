import { USER_TO_NUM, normalizeAnswer } from "../constants/answerMappings";
import { statsUserId, getAnalyticsConsent } from "../utils/analytics";

// Build compact responses payload from quiz state
export function buildCompactResponses(questions, answers, weights) {
  return questions.reduce((acc, q, i) => {
    const raw = answers[i] ?? null;
    if (!raw || raw === "Sin respuesta") return acc;

    let vote = normalizeAnswer(raw);
    if (vote === null) vote = 0.5;

    acc[q.id] = [vote, Number(weights?.[i] ?? 1)];
    return acc;
  }, {});
}

export function buildSubmissionPayload(questions, answers, weights, demographics, fingerprint, captchaToken, captchaType = 'turnstile', isResubmission = false, quizVersion = null) {
  const compactResponses = buildCompactResponses(questions, answers, weights);

  const userId = localStorage.getItem("userId") || Date.now().toString();
  localStorage.setItem("userId", userId);

  return {
    user_id: userId,
    stats_id: getAnalyticsConsent() ? statsUserId() : null,
    responses: compactResponses,
    demographics: demographics || null,
    captcha_token: captchaToken,
    captcha_type: captchaType,
    fingerprint: fingerprint || null,
    is_resubmission: isResubmission,
    quiz_version: quizVersion || null,
  };
}

export async function submitQuizAnswers(payload) {
  // Use fallback API for hCaptcha (old browsers that can't run Turnstile)
  const useFallbackApi = payload.captcha_type === 'hcaptcha' && import.meta.env.VITE_HCAPTCHA_FALLBACK_API;
  const endpoint = useFallbackApi
    ? `${import.meta.env.VITE_HCAPTCHA_FALLBACK_API}/api/form`
    : `${import.meta.env.BASE_URL}api/form`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: useFallbackApi ? 'omit' : 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Form submission failed');
  }

  return response.json();
}
