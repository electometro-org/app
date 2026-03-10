import { USER_TO_NUM, normalizeAnswer } from "../constants/answerMappings";
import { statsUserId, getAnalyticsConsent } from "../analytics";

// Build compact responses payload from quiz state
export function buildCompactResponses(questions, answers, weights) {
  return questions.reduce((acc, q, i) => {
    const raw = answers[i] ?? null;
    if (!raw || raw === "Sin respuesta") return acc;

    let vote = normalizeAnswer(raw);
    if (vote === null) vote = 0.5;

    acc[q.id] = [vote, Number(weights?.[i] ?? 2)];
    return acc;
  }, {});
}

export function buildSubmissionPayload(questions, answers, weights, demographics, fingerprint, turnstileToken, captchaType = 'turnstile', isResubmission = false) {
  const compactResponses = buildCompactResponses(questions, answers, weights);

  const userId = localStorage.getItem("userId") || Date.now().toString();
  localStorage.setItem("userId", userId);

  return {
    user_id: userId,
    stats_id: getAnalyticsConsent() ? statsUserId() : null,
    responses: compactResponses,
    demographics: demographics || null,
    turnstile_token: turnstileToken,
    captcha_type: captchaType,
    fingerprint: fingerprint || null,
    is_resubmission: isResubmission,
  };
}

export async function submitQuizAnswers(payload) {
  const response = await fetch(`${import.meta.env.BASE_URL}api/form`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Form submission failed');
  }

  return response.json();
}