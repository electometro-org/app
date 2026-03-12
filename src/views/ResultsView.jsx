import React from "react";
import { useTranslate } from "@tolgee/react";
import { BrandLogo } from "../components/BrandImage";
import { voteToNumeric } from "../voteUtils";
import { createPortal } from "react-dom";
import { encodeToMnemonic } from "../utils/mnemonicCodec";
import { collectFingerprintPayload } from "../useFingerprint";

const PARTY_LOGO_EXTS = ["png", "jpg", "jpeg", "svg"];
const CANDIDATE_PHOTO_EXTS = ["jpg", "jpeg", "png"];

const TURNSTILE_SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js";
const HCAPTCHA_SCRIPT_URL = "https://js.hcaptcha.com/1/api.js";

function loadCaptchaScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function tryLoadTurnstile() {
  try {
    await loadCaptchaScript(TURNSTILE_SCRIPT_URL);
    await new Promise((resolve) => setTimeout(resolve, 100));
    return typeof window.turnstile !== "undefined";
  } catch {
    return false;
  }
}

async function tryLoadHCaptcha() {
  try {
    await loadCaptchaScript(HCAPTCHA_SCRIPT_URL);
    let attempts = 0;
    while (typeof window.hcaptcha === "undefined" && attempts < 50) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }
    return typeof window.hcaptcha !== "undefined";
  } catch {
    return false;
  }
}

function slugifyAssetName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ResultsView({
  comparisonResults,
  selectedResultType,
  resultTypes,
  selectedEntity,
  entityDetails,
  questionDetails,
  questions,
  answers,
  weights,
  config,
  isMobile,
  partyComplete,
  partyIncomplete,
  presComplete,
  presIncomplete,
  hoveredOption,
  branding,
  restoredFromMnemonic,
  quizDataVersion,
  restoredVersion,
  versionMismatchType,
  onResultTypeChange,
  onEntityClick,
  onBackToSurvey,
  onHover,
  onDismissRestoredModal,
  onForceReset,
}) {
  const { t } = useTranslate();
  const [mobileResultsTab, setMobileResultsTab] = React.useState("list");
  const [resultsViewMode, setResultsViewMode] = React.useState("comparison");
  const [slotIndex, setSlotIndex] = React.useState(0);
  const [hoveredViewMode, setHoveredViewMode] = React.useState(null);
  const [analysisNavFlash, setAnalysisNavFlash] = React.useState(null);
  const [showListScrollHint, setShowListScrollHint] = React.useState(false);
  const [hasShownListScrollHint, setHasShownListScrollHint] = React.useState(false);
  const [listHasTopFade, setListHasTopFade] = React.useState(false);
  const [listHasBottomFade, setListHasBottomFade] = React.useState(false);
  const [showResultsScrollDownFab, setShowResultsScrollDownFab] = React.useState(false);
  const [showComparisonInfoModal, setShowComparisonInfoModal] = React.useState(false);
  const [showSaveModal, setShowSaveModal] = React.useState(false);
  const [savedUrl, setSavedUrl] = React.useState("");
  const [savedMnemonic, setSavedMnemonic] = React.useState("");
  const [copiedUrl, setCopiedUrl] = React.useState(false);
  const [copiedMnemonic, setCopiedMnemonic] = React.useState(false);
  const [resolvedLogoUrls, setResolvedLogoUrls] = React.useState({});
  const resolvedLogoUrlsRef = React.useRef({});
  const logoResolveInFlightRef = React.useRef(new Map()); // Map<slug, Promise<[slug, url]>>
  const logoCacheContextRef = React.useRef("");
  const [resolvedCandidatePhotoUrls, setResolvedCandidatePhotoUrls] = React.useState({});
  const resolvedCandidatePhotoUrlsRef = React.useRef({});
  const candidatePhotoResolveInFlightRef = React.useRef(new Map());
  const analysisNavFlashTimerRef = React.useRef(null);
  const analysisNavFlashRafRef = React.useRef(null);
  const listScrollHintTimerRef = React.useRef(null);
  const resultsListRef = React.useRef(null);
  const pendingNavListAlignRef = React.useRef(false);
  const backToSurveyRef = React.useRef(null);
  const guiScrollParentRef = React.useRef(null);

  const MIN_COMPARED = 8;
  const presidentialResultsAll = comparisonResults?.presidential_results || [];
  const rankingLabel = t("results.ranking") === "results.ranking" ? "Ranking" : t("results.ranking");
  const analysisLabel = t("results.analysis") === "results.analysis" ? "Analisis" : t("results.analysis");
  const scrollDownTopicsLabel = t("topicImportance.seeMoreTopics");
  const compactModeLabel = t("results.compactMode") === "results.compactMode"
    ? "Nivel de coincidencia"
    : t("results.compactMode");
  const coincidenceTitleLabel = t("results.coincidenceLevelTitle") === "results.coincidenceLevelTitle"
    ? "Nivel de coincidencia"
    : t("results.coincidenceLevelTitle");
  const detailedModeLabel = t("results.detailedMode") === "results.detailedMode"
    ? "Comparacion detallada"
    : t("results.detailedMode");
  const goBackToListLabel = t("results.goBackToList") === "results.goBackToList"
    ? "Go back to list"
    : t("results.goBackToList");
  const activeSelectionPartyLabel = t("results.activeSelectionParty") === "results.activeSelectionParty"
    ? "Partido activo"
    : t("results.activeSelectionParty");
  const activeSelectionCandidateLabel = t("results.activeSelectionCandidate") === "results.activeSelectionCandidate"
    ? "Candidatura activa"
    : t("results.activeSelectionCandidate");
  const activeSelectionSimilarityPercentageLabel = t("results.activeSelectionSimilarityPercentage") === "results.activeSelectionSimilarityPercentage"
    ? "Porcentaje de similitud"
    : t("results.activeSelectionSimilarityPercentage");
  const completeComparisonsTemplate = t("results.completeComparisons") === "results.completeComparisons"
    ? "[nrOfComplete] resultados con muestra suficiente"
    : t("results.completeComparisons");
  const incompleteComparisonsTemplate = t("results.incompleteComparisons") === "results.incompleteComparisons"
    ? "[nrOfIncomplete] resultados con muestra insuficiente"
    : t("results.incompleteComparisons");
  const activeSelectionLabel = selectedResultType === "party"
    ? activeSelectionPartyLabel
    : activeSelectionCandidateLabel;
  const comparedTopicsCount = Array.isArray(entityDetails?.details)
    ? entityDetails.details.filter((detail) => detail?.compared).length
    : 0;
  const comparisonToken = "[nrOfComparedTopics]";
  const comparisonTemplate = t("results.comparison");
  const comparisonParts = String(comparisonTemplate || "").split(comparisonToken);
  const comparisonBefore = comparisonParts[0] || "";
  const comparisonAfter = comparisonParts.slice(1).join(comparisonToken) || "";
  const importantTopicsCount = React.useMemo(() => {
    if (!Array.isArray(entityDetails?.details)) return 0;
    const uniqueImportantTopics = new Set();
    entityDetails.details.forEach((detail) => {
      const weight = Number(detail?.userWeight);
      if (!Number.isFinite(weight) || weight < 3) return;
      const key = detail?.topic_key || detail?.question_key || detail?.id;
      if (key != null) uniqueImportantTopics.add(String(key));
    });
    return uniqueImportantTopics.size;
  }, [entityDetails?.details]);
  const comparisonInfoBodyTemplate = t("results.comparisonInfoBody") === "results.comparisonInfoBody"
    ? "Elegiste [NrOfImportantTopics] temas de mayor importancia. Esto influye la posicion del resultado en el ranking."
    : t("results.comparisonInfoBody");
  const comparisonInfoBody = comparisonInfoBodyTemplate.replace("[NrOfImportantTopics]", String(importantTopicsCount));
  const comparisonInfoLabel = t("results.comparisonInfoLabel") === "results.comparisonInfoLabel"
    ? "Mas informacion"
    : t("results.comparisonInfoLabel");
  const comparisonInfoCloseLabel = t("results.comparisonInfoClose") === "results.comparisonInfoClose"
    ? "Cerrar"
    : t("results.comparisonInfoClose");
  const saveResultsLabel = t("results.saveResults") === "results.saveResults"
    ? "Guardar resultados"
    : t("results.saveResults");
  const restoredTitleLabel = t("results.restoredTitle") === "results.restoredTitle"
    ? "Resultados restaurados"
    : t("results.restoredTitle");
  const restoredBodyLabel = t("results.restoredBody") === "results.restoredBody"
    ? "Tus resultados han sido restaurados. Si no coinciden con lo que recuerdas, puedes presionar el botón 'Reiniciar' en la esquina superior izquierda."
    : t("results.restoredBody");
  const restoredCloseLabel = t("results.restoredClose") === "results.restoredClose"
    ? "Entendido"
    : t("results.restoredClose");
  const savedTitleLabel = t("results.savedTitle") === "results.savedTitle"
    ? "Resultados guardados"
    : t("results.savedTitle");
  const savedBodyLabel = t("results.savedBody") === "results.savedBody"
    ? "Guarda este enlace para ver tus resultados en el futuro:"
    : t("results.savedBody");
  const savedMnemonicLabelText = t("results.savedMnemonicLabel") === "results.savedMnemonicLabel"
    ? "Tu código mnemónico:"
    : t("results.savedMnemonicLabel");
  const copyUrlLabel = t("results.copyUrl") === "results.copyUrl"
    ? "Copiar enlace"
    : t("results.copyUrl");
  const copyMnemonicLabel = t("results.copyMnemonic") === "results.copyMnemonic"
    ? "Copiar código"
    : t("results.copyMnemonic");
  const copiedLabel = t("results.copied") === "results.copied"
    ? "¡Copiado!"
    : t("results.copied");

  // Version modal labels
  const versionPatchTitleLabel = t("results.versionPatchTitle") === "results.versionPatchTitle"
    ? "Información actualizada"
    : t("results.versionPatchTitle");
  const versionPatchBodyTemplate = t("results.versionPatchBody") === "results.versionPatchBody"
    ? "Los datos del cuestionario fueron actualizados ({0} → {1}). Tu puntuación sigue siendo válida."
    : t("results.versionPatchBody");
  const versionPatchCloseLabel = t("results.versionPatchClose") === "results.versionPatchClose"
    ? "Entendido"
    : t("results.versionPatchClose");

  const versionMinorTitleLabel = t("results.versionMinorTitle") === "results.versionMinorTitle"
    ? "Cuestionario actualizado"
    : t("results.versionMinorTitle");
  const versionMinorBodyTemplate = t("results.versionMinorBody") === "results.versionMinorBody"
    ? "El cuestionario ha cambiado significativamente ({0} → {1}). Te recomendamos volver a responder."
    : t("results.versionMinorBody");
  const versionMinorCloseLabel = t("results.versionMinorClose") === "results.versionMinorClose"
    ? "Reiniciar cuestionario"
    : t("results.versionMinorClose");

  const versionMajorTitleLabel = t("results.versionMajorTitle") === "results.versionMajorTitle"
    ? "Nueva versión disponible"
    : t("results.versionMajorTitle");
  const versionMajorBodyTemplate = t("results.versionMajorBody") === "results.versionMajorBody"
    ? "Esta versión del cuestionario ({0}) ya no es compatible. Por favor, responde el nuevo cuestionario."
    : t("results.versionMajorBody");
  const versionMajorCloseLabel = t("results.versionMajorClose") === "results.versionMajorClose"
    ? "Comenzar de nuevo"
    : t("results.versionMajorClose");

  // Format version body text with version numbers
  const formatVersionBody = (template, oldVersion, newVersion) => {
    return template
      .replace("{0}", oldVersion || "?")
      .replace("{1}", newVersion || "?");
  };

  // Handle saving results - opens modal with URL and mnemonic
  const handleSaveResults = () => {
    const wordList = config?.mnemonicWordList;
    // Include quizDataVersion in the mnemonic
    const mnemonic = encodeToMnemonic(answers, weights, wordList, quizDataVersion);
    if (!mnemonic) return;

    // Update URL hash with mnemonic
    const currentHash = window.location.hash;
    const basePath = currentHash.split("?")[0] || "#/";
    const newUrl = `${window.location.origin}${window.location.pathname}${basePath}?r=${mnemonic}`;

    // Update browser URL without reload
    window.history.replaceState(null, "", newUrl);

    // Show modal with URL and mnemonic
    setSavedUrl(newUrl);
    setSavedMnemonic(mnemonic);
    setCopiedUrl(false);
    setCopiedMnemonic(false);
    setShowSaveModal(true);
  };

  const copyToClipboard = async (text, setCopied) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (_) {
        console.warn("Failed to copy to clipboard");
      }
      document.body.removeChild(textArea);
    }
  };

  const toSortableScore = (score) => {
    const numeric = Number(score);
    return Number.isFinite(numeric) ? numeric : -1;
  };

  const sortRowsByScoreDesc = (a, b) => {
    const scoreDiff = toSortableScore(b.score) - toSortableScore(a.score);
    if (scoreDiff !== 0) return scoreDiff;
    const comparedDiff = Number(b.payload?.compared_questions || 0) - Number(a.payload?.compared_questions || 0);
    if (comparedDiff !== 0) return comparedDiff;
    return String(a.displayName || a.name || "").localeCompare(String(b.displayName || b.name || ""));
  };

  const orderRowsForNavigation = (mappedRows) => {
    const sorted = [...mappedRows].sort(sortRowsByScoreDesc);
    const complete = sorted.filter((row) => !row.incomplete);
    const incomplete = sorted.filter((row) => row.incomplete);
    return [...complete, ...incomplete];
  };

  const getRows = () => {
    if (selectedResultType === "party") {
      const mappedRows = [...partyComplete, ...partyIncomplete]
        .map((row, idx) => ({
        key: row.party ?? row.name ?? `party-${idx}`,
        id: row.party ?? row.name,
        name: row.name,
        displayName: row.name,
        score: row.similarity_score,
        incomplete: Number(row.compared_questions || 0) < MIN_COMPARED,
        type: "party",
        payload: row,
      }));
      return orderRowsForNavigation(mappedRows);
    }

    const mappedRows = presidentialResultsAll
      .map((row, idx) => ({
      key: row.name ?? `pres-${idx}`,
      id: row.name,
      name: row.name,
      displayName: row.displayName || row.name,
      score: row.similarity_score,
      incomplete: Number(row.compared_questions || 0) < MIN_COMPARED,
      type: "presidential",
      payload: row,
    }));
    return orderRowsForNavigation(mappedRows);
  };

  const rows = getRows();
  const rowsWithIndex = rows.map((row, idx) => ({ row, idx }));
  const completeRows = rowsWithIndex.filter(({ row }) => !row.incomplete);
  const incompleteRows = rowsWithIndex.filter(({ row }) => row.incomplete);
  const completeComparisonsLabel = completeComparisonsTemplate.replace("[nrOfComplete]", String(completeRows.length));
  const incompleteComparisonsLabel = incompleteComparisonsTemplate.replace("[nrOfIncomplete]", String(incompleteRows.length));

  // Reset logo and candidate photo cache when comparisonResults changes (new results computed)
  React.useEffect(() => {
    resolvedLogoUrlsRef.current = {};
    logoResolveInFlightRef.current.clear();
    setResolvedLogoUrls({});
    resolvedCandidatePhotoUrlsRef.current = {};
    candidatePhotoResolveInFlightRef.current.clear();
    setResolvedCandidatePhotoUrls({});
  }, [comparisonResults]);

  React.useEffect(() => {
    const baseUrl = config?.assetsBaseUrl || "";
    const assetsPath = config?.assetsPath || "";
    const prefix = baseUrl ? `${baseUrl}/` : "";
    const cacheContext = `${baseUrl}|${assetsPath}`;
    if (!prefix) {
      setResolvedLogoUrls({});
      resolvedLogoUrlsRef.current = {};
      logoResolveInFlightRef.current.clear();
      logoCacheContextRef.current = "";
      return;
    }
    if (logoCacheContextRef.current !== cacheContext) {
      setResolvedLogoUrls({});
      resolvedLogoUrlsRef.current = {};
      logoResolveInFlightRef.current.clear();
      logoCacheContextRef.current = cacheContext;
    }

    const extractParty = (name) => {
      if (!name || typeof name !== "string") return null;
      const m = name.match(/\(([^)]+)\)\s*$/);
      if (m && m[1]) return m[1].trim();
      const m2 = name.match(/\[([^\]]+)\]\s*$/);
      if (m2 && m2[1]) return m2[1].trim();
      return null;
    };

    const partyNames = new Set();
    [...partyComplete, ...partyIncomplete].forEach((row) => {
      if (row?.name) partyNames.add(row.name);
    });
    presidentialResultsAll.forEach((row) => {
      if (row?.party) partyNames.add(row.party);
      const extracted = extractParty(row?.displayName || row?.name);
      if (extracted) partyNames.add(extracted);
    });

    const preloadImage = (url) => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = reject;
      img.src = url;
    });

    const resolveLogoUrl = async (partyName) => {
      const slug = slugifyAssetName(partyName || "");
      if (!slug) return [slug, ""];
      if (Object.prototype.hasOwnProperty.call(resolvedLogoUrlsRef.current, slug)) {
        return [slug, resolvedLogoUrlsRef.current[slug] || ""];
      }
      // If already resolving, wait for the existing promise
      if (logoResolveInFlightRef.current.has(slug)) {
        return logoResolveInFlightRef.current.get(slug);
      }
      // Create and store the resolution promise
      const resolutionPromise = (async () => {
        for (const ext of PARTY_LOGO_EXTS) {
          const url = `${prefix}${assetsPath}party_logos/${slug}.${ext}`;
          try {
            await preloadImage(url);
            logoResolveInFlightRef.current.delete(slug);
            return [slug, url];
          } catch {
            // Try next extension
          }
        }
        logoResolveInFlightRef.current.delete(slug);
        return [slug, null];
      })();
      logoResolveInFlightRef.current.set(slug, resolutionPromise);
      return resolutionPromise;
    };

    let cancelled = false;
    (async () => {
      const missingPartyNames = [...partyNames].filter((name) => {
        const slug = slugifyAssetName(name || "");
        return (
          !!slug
          && !Object.prototype.hasOwnProperty.call(resolvedLogoUrlsRef.current, slug)
        );
      });
      if (missingPartyNames.length === 0) return;
      const pairs = await Promise.all(missingPartyNames.map(resolveLogoUrl));
      if (cancelled) return;
      const nextEntries = {};
      pairs.forEach((pair) => {
        if (!pair) return;
        const [slug, url] = pair;
        if (slug) nextEntries[slug] = url ?? null;
      });
      if (Object.keys(nextEntries).length === 0) return;
      const merged = { ...resolvedLogoUrlsRef.current, ...nextEntries };
      resolvedLogoUrlsRef.current = merged;
      setResolvedLogoUrls(merged);
    })();

    return () => {
      cancelled = true;
    };
  }, [partyComplete, partyIncomplete, presidentialResultsAll, config?.assetsBaseUrl, config?.assetsPath, comparisonResults]);

  // Resolve candidate photo URLs for presidential candidates
  React.useEffect(() => {
    const baseUrl = config?.assetsBaseUrl || "";
    const assetsPath = config?.assetsPath || "";
    const prefix = baseUrl ? `${baseUrl}/` : "";
    if (!prefix) {
      setResolvedCandidatePhotoUrls({});
      resolvedCandidatePhotoUrlsRef.current = {};
      candidatePhotoResolveInFlightRef.current.clear();
      return;
    }

    // Extract candidate names from presidential results (name without party)
    const extractCandidateName = (row) => {
      // For presidential candidates, the displayName or name contains "Name (Party)"
      const fullName = row?.displayName || row?.name || "";
      // Extract name before the party in parentheses
      const match = fullName.match(/^([^(]+)/);
      if (match && match[1]) return match[1].trim();
      return fullName.trim();
    };

    const candidateNames = new Set();
    presidentialResultsAll.forEach((row) => {
      const name = extractCandidateName(row);
      if (name) candidateNames.add(name);
    });

    const preloadImage = (url) => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = reject;
      img.src = url;
    });

    const resolveCandidatePhotoUrl = async (candidateName) => {
      const slug = slugifyAssetName(candidateName || "");
      if (!slug) return [slug, ""];
      if (Object.prototype.hasOwnProperty.call(resolvedCandidatePhotoUrlsRef.current, slug)) {
        return [slug, resolvedCandidatePhotoUrlsRef.current[slug] || ""];
      }
      if (candidatePhotoResolveInFlightRef.current.has(slug)) {
        return candidatePhotoResolveInFlightRef.current.get(slug);
      }
      const resolutionPromise = (async () => {
        for (const ext of CANDIDATE_PHOTO_EXTS) {
          const url = `${prefix}${assetsPath}candidate_photos/${slug}.${ext}`;
          try {
            await preloadImage(url);
            candidatePhotoResolveInFlightRef.current.delete(slug);
            return [slug, url];
          } catch {
            // Try next extension
          }
        }
        candidatePhotoResolveInFlightRef.current.delete(slug);
        return [slug, null];
      })();
      candidatePhotoResolveInFlightRef.current.set(slug, resolutionPromise);
      return resolutionPromise;
    };

    let cancelled = false;
    (async () => {
      const missingCandidateNames = [...candidateNames].filter((name) => {
        const slug = slugifyAssetName(name || "");
        return (
          !!slug
          && !Object.prototype.hasOwnProperty.call(resolvedCandidatePhotoUrlsRef.current, slug)
        );
      });
      if (missingCandidateNames.length === 0) return;
      const pairs = await Promise.all(missingCandidateNames.map(resolveCandidatePhotoUrl));
      if (cancelled) return;
      const nextEntries = {};
      pairs.forEach((pair) => {
        if (!pair) return;
        const [slug, url] = pair;
        if (slug) nextEntries[slug] = url ?? null;
      });
      if (Object.keys(nextEntries).length === 0) return;
      const merged = { ...resolvedCandidatePhotoUrlsRef.current, ...nextEntries };
      resolvedCandidatePhotoUrlsRef.current = merged;
      setResolvedCandidatePhotoUrls(merged);
    })();

    return () => {
      cancelled = true;
    };
  }, [presidentialResultsAll, config?.assetsBaseUrl, config?.assetsPath, comparisonResults]);

  const isSelectedRow = (row) => {
    if (!selectedEntity) return false;
    if (row.type === "party") {
      return selectedEntity.name === row.name || selectedEntity.party === row.id;
    }
    return selectedEntity.name === row.id;
  };

  const handleSelectRow = (row) => {
    onEntityClick(row.payload, row.type);
    if (isMobile) setMobileResultsTab("analysis");
  };

  React.useEffect(() => {
    if (rows.length === 0) {
      setSlotIndex(0);
      return;
    }

    if (!selectedEntity) {
      setSlotIndex(0);
      return;
    }

    const idx = rows.findIndex((row) => {
      if (row.type === "party") {
        return selectedEntity.name === row.name || selectedEntity.party === row.id;
      }
      return selectedEntity.name === row.id;
    });

    if (idx >= 0) {
      setSlotIndex(idx);
    }
  }, [selectedEntity, selectedResultType, rows]);

  const moveSlot = (direction) => {
    if (rows.length === 0) return;
    const next = Math.max(0, Math.min(rows.length - 1, slotIndex + direction));
    if (next === slotIndex) return;
    setSlotIndex(next);
    const target = rows[next];
    if (target) onEntityClick(target.payload, target.type);
  };

  const selectedRowIndex = React.useMemo(() => {
    if (rows.length === 0) return -1;
    if (!selectedEntity) return 0;
    const idx = rows.findIndex((row) => {
      if (row.type === "party") {
        return selectedEntity.name === row.name || selectedEntity.party === row.id;
      }
      return selectedEntity.name === row.id;
    });
    return idx >= 0 ? idx : 0;
  }, [rows, selectedEntity]);
  const activeRow = rows[Math.max(0, selectedRowIndex)] || null;

  const moveAnalysisSelection = (direction) => {
    if (rows.length === 0) return;
    const base = selectedRowIndex >= 0 ? selectedRowIndex : 0;
    const next = Math.max(0, Math.min(rows.length - 1, base + direction));
    if (next === base) return;
    const target = rows[next];
    if (target) onEntityClick(target.payload, target.type);
  };

  const handleAnalysisNavClick = (direction, key) => {
    if (analysisNavFlashTimerRef.current) {
      clearTimeout(analysisNavFlashTimerRef.current);
    }
    if (analysisNavFlashRafRef.current) {
      cancelAnimationFrame(analysisNavFlashRafRef.current);
    }
    setAnalysisNavFlash(null);
    analysisNavFlashRafRef.current = requestAnimationFrame(() => {
      setAnalysisNavFlash(key);
      analysisNavFlashTimerRef.current = setTimeout(() => {
        setAnalysisNavFlash(null);
        analysisNavFlashTimerRef.current = null;
      }, 260);
      analysisNavFlashRafRef.current = null;
    });
    pendingNavListAlignRef.current = true;
    moveAnalysisSelection(direction);
  };

  React.useEffect(() => () => {
    if (analysisNavFlashTimerRef.current) {
      clearTimeout(analysisNavFlashTimerRef.current);
    }
    if (analysisNavFlashRafRef.current) {
      cancelAnimationFrame(analysisNavFlashRafRef.current);
    }
  }, []);

  const hideListScrollHint = React.useCallback(() => {
    setShowListScrollHint(false);
    if (listScrollHintTimerRef.current) {
      clearTimeout(listScrollHintTimerRef.current);
      listScrollHintTimerRef.current = null;
    }
  }, []);

  const updateResultsListScrollIndicators = React.useCallback(() => {
    const el = resultsListRef.current;
    if (!el) {
      setListHasTopFade(false);
      setListHasBottomFade(false);
      return false;
    }
    const canScroll = el.scrollHeight > el.clientHeight + 2;
    if (!canScroll) {
      setListHasTopFade(false);
      setListHasBottomFade(false);
      return false;
    }
    const atTop = el.scrollTop <= 2;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
    setListHasTopFade(!atTop);
    setListHasBottomFade(!atBottom);
    return true;
  }, []);

  const handleResultsListScroll = () => {
    const el = resultsListRef.current;
    if (el && el.scrollTop > 3) {
      hideListScrollHint();
    }
    updateResultsListScrollIndicators();
  };

  React.useEffect(() => {
    if (!isMobile || resultsViewMode !== "comparison" || mobileResultsTab !== "list") return;
    if (selectedRowIndex < 0) return;

    const rafId = requestAnimationFrame(() => {
      const listEl = resultsListRef.current;
      if (!listEl) return;
      const rowEl = listEl.querySelector(`[data-row-index="${selectedRowIndex}"]`);
      if (!rowEl) return;

      const rowTop = rowEl.offsetTop;
      const rowHeight = rowEl.offsetHeight;
      const centeredTop = rowTop - (listEl.clientHeight / 2) + (rowHeight / 2);
      const maxTop = Math.max(0, listEl.scrollHeight - listEl.clientHeight);
      const targetTop = Math.max(0, Math.min(maxTop, centeredTop));

      listEl.scrollTo({ top: targetTop, behavior: "smooth" });
      updateResultsListScrollIndicators();
    });

    return () => cancelAnimationFrame(rafId);
  }, [isMobile, resultsViewMode, mobileResultsTab, selectedRowIndex, updateResultsListScrollIndicators]);

  const handleResultsScrollDownFabClick = () => {
    const target = backToSurveyRef.current;
    const getScrollParent = (el) => {
      if (!el) return document.documentElement;
      let node = el.parentElement;
      while (node) {
        const styles = window.getComputedStyle(node);
        const overflowY = styles.overflowY;
        if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) {
          return node;
        }
        node = node.parentElement;
      }
      return document.documentElement;
    };
    const scrollParent = getScrollParent(target);
    guiScrollParentRef.current = scrollParent;
    const isWindowScroll = !scrollParent
      || scrollParent === document.documentElement
      || scrollParent === document.body;

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }

    const stepBase = isWindowScroll
      ? (window.innerHeight || document.documentElement.clientHeight || 0)
      : scrollParent.clientHeight;
    const step = Math.max(140, Math.floor(stepBase * 0.72));
    if (isWindowScroll) {
      window.scrollBy({ top: step, behavior: "smooth" });
    } else {
      scrollParent.scrollBy({ top: step, behavior: "smooth" });
    }
  };

  React.useEffect(() => {
    const listVisible = resultsViewMode === "comparison" && (!isMobile || mobileResultsTab === "list");
    if (!listVisible) {
      hideListScrollHint();
      return;
    }

    const maybeShowHint = () => {
      const canScroll = updateResultsListScrollIndicators();
      if (!canScroll) {
        hideListScrollHint();
        return false;
      }
      if (!hasShownListScrollHint) {
        setShowListScrollHint(true);
        setHasShownListScrollHint(true);
        if (listScrollHintTimerRef.current) clearTimeout(listScrollHintTimerRef.current);
        listScrollHintTimerRef.current = setTimeout(() => {
          hideListScrollHint();
        }, 2200);
      }
      return true;
    };

    const rafId = requestAnimationFrame(() => {
      maybeShowHint();
    });
    const settleTimerId = setTimeout(() => {
      maybeShowHint();
    }, 260);

    let resizeObserver = null;
    const listEl = resultsListRef.current;
    if (listEl && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        maybeShowHint();
      });
      resizeObserver.observe(listEl);
    }

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(settleTimerId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (listScrollHintTimerRef.current) {
        clearTimeout(listScrollHintTimerRef.current);
        listScrollHintTimerRef.current = null;
      }
    };
  }, [resultsViewMode, isMobile, mobileResultsTab, rows.length, hasShownListScrollHint, hideListScrollHint, updateResultsListScrollIndicators]);

  React.useEffect(() => {
    const getScrollParent = (el) => {
      if (!el) return document.documentElement;
      let node = el.parentElement;
      while (node) {
        const styles = window.getComputedStyle(node);
        const overflowY = styles.overflowY;
        if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) {
          return node;
        }
        node = node.parentElement;
      }
      return document.documentElement;
    };

    const isElementVisibleInViewport = (el) => {
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.visualViewport?.height
        || window.innerHeight
        || document.documentElement.clientHeight
        || 0;
      return rect.bottom >= 0 && rect.top <= viewportHeight;
    };

    const updateFabVisibility = () => {
      const target = backToSurveyRef.current;
      if (!target) {
        setShowResultsScrollDownFab(false);
        return;
      }
      guiScrollParentRef.current = getScrollParent(target);
      setShowResultsScrollDownFab(!isElementVisibleInViewport(target));
    };

    const target = backToSurveyRef.current;
    if (!target) {
      setShowResultsScrollDownFab(false);
      return;
    }

    let rafId = 0;
    const onScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateFabVisibility);
    };

    let observer = null;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          setShowResultsScrollDownFab(!(entry?.isIntersecting ?? false));
        },
        {
          root: null,
          threshold: 0.01,
        }
      );
      observer.observe(target);
    }

    updateFabVisibility();
    const settleTimer = setTimeout(updateFabVisibility, 260);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", onScroll);
      window.visualViewport.addEventListener("scroll", onScroll);
    }

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", onScroll);
        window.visualViewport.removeEventListener("scroll", onScroll);
      }
      if (rafId) cancelAnimationFrame(rafId);
      clearTimeout(settleTimer);
    };
  }, [resultsViewMode, mobileResultsTab, rows.length]);

  React.useEffect(() => {
    if (!pendingNavListAlignRef.current) return;

    const listEl = resultsListRef.current;
    if (!listEl || selectedRowIndex < 0) {
      pendingNavListAlignRef.current = false;
      return;
    }

    const rowEl = listEl.querySelector(`[data-row-index="${selectedRowIndex}"]`);
    if (!rowEl) {
      pendingNavListAlignRef.current = false;
      return;
    }

    const viewportTop = listEl.scrollTop;
    const viewportBottom = viewportTop + listEl.clientHeight;
    const rowTop = rowEl.offsetTop;
    const rowBottom = rowTop + rowEl.offsetHeight;
    const fullyVisible = rowTop >= viewportTop && rowBottom <= viewportBottom;

    if (!fullyVisible) {
      const BOTTOM_PAD = 14;
      const maxTop = Math.max(0, listEl.scrollHeight - listEl.clientHeight);
      const desiredTop = Math.min(maxTop, Math.max(0, rowBottom - listEl.clientHeight + BOTTOM_PAD));
      listEl.scrollTo({ top: desiredTop, behavior: "smooth" });
    }

    pendingNavListAlignRef.current = false;
  }, [selectedRowIndex, rows.length]);

  const getFillPercent = (score) => {
    const numeric = Number(score);
    return Number.isFinite(numeric) ? Math.max(0, Math.min(100, numeric)) : 0;
  };

  const getRowFillStyle = (fillPercent, { selected = false, dimmed = false } = {}) => {
    const pct = fillPercent;
    // Check if browser supports color-mix()
    const supportsColorMix = typeof CSS !== 'undefined' && CSS.supports && CSS.supports('background', 'color-mix(in srgb, red 50%, blue)');
    if (supportsColorMix) {
      if (selected) {
        return {
          background: `linear-gradient(to right, color-mix(in srgb, var(--accentLight) 97%, transparent) ${pct}%, color-mix(in srgb, var(--accent) 16%, var(--buttonColor)) ${pct}%)`,
        };
      }
      if (dimmed) {
        return {
          background: `linear-gradient(to right, color-mix(in srgb, var(--accentLight) 88%, transparent) ${pct}%, color-mix(in srgb, var(--accent) 10%, var(--buttonColor)) ${pct}%)`,
        };
      }
      return {
        background: `linear-gradient(to right, color-mix(in srgb, var(--accentLight) 95%, transparent) ${pct}%, color-mix(in srgb, var(--accent) 8%, var(--buttonColor)) ${pct}%)`,
      };
    }
    // Fallback for older browsers
    if (selected) {
      return {
        background: `linear-gradient(to right, rgba(195, 30, 30, 1) ${pct}%, rgba(245, 245, 245, 1) ${pct}%)`,
      };
    }
    if (dimmed) {
      return {
        background: `linear-gradient(to right, rgba(195, 30, 30, 0.85) ${pct}%, rgba(245, 245, 245, 1) ${pct}%)`,
      };
    }
    return {
      background: `linear-gradient(to right, rgba(195, 30, 30, 1) ${pct}%, rgba(245, 245, 245, 1) ${pct}%)`,
    };
  };

  return (
    <div className="results-view-shell">
      <div className="results-view-header">
        <BrandLogo branding={branding} />
        <h2>{t("results.title")}</h2>
      </div>

      <div className={`results-toolbar ${resultsViewMode === "comparison" ? "is-detailed" : "is-compact"}`}>
        {resultTypes.length > 1 && (
          <div className="results-type-toggle">
            {resultTypes.map((rt) => {
              const selected = selectedResultType === rt || hoveredOption === rt;
              return (
                <button
                  key={rt}
                  className={`results-type-toggle__btn ${selected ? "is-active" : ""}`}
                  onClick={() => onResultTypeChange(rt)}
                  onMouseEnter={() => onHover(rt)}
                  onMouseLeave={() => onHover(null)}
                >
                  {rt === "party" && t("results.parties")}
                  {rt === "presidentialCandidates" && t("results.candidates")}
                </button>
              );
            })}
          </div>
        )}

        <div className="results-view-mode-toggle">
          <button
              className={`results-view-mode-toggle__btn ${(resultsViewMode === "coincidence" || hoveredViewMode === "coincidence") ? "is-active" : ""}`}
              onClick={() => setResultsViewMode("coincidence")}
              onMouseEnter={() => setHoveredViewMode("coincidence")}
              onMouseLeave={() => setHoveredViewMode(null)}
          >
            {compactModeLabel}
          </button>
          <button
            className={`results-view-mode-toggle__btn ${(resultsViewMode === "comparison" || hoveredViewMode === "comparison") ? "is-active" : ""}`}
            onClick={() => setResultsViewMode("comparison")}
            onMouseEnter={() => setHoveredViewMode("comparison")}
            onMouseLeave={() => setHoveredViewMode(null)}
          >
            {detailedModeLabel}
          </button>
        </div>

        {isMobile && resultsViewMode === "comparison" && (
          <div className="results-mobile-tabs">
            <button
              className={`results-mobile-tabs__btn ${mobileResultsTab === "list" ? "is-active" : ""}`}
              onClick={() => setMobileResultsTab("list")}
            >
              {rankingLabel}
            </button>
            <button
              className={`results-mobile-tabs__btn ${mobileResultsTab === "analysis" ? "is-active" : ""}`}
              onClick={() => setMobileResultsTab("analysis")}
            >
              {analysisLabel}
            </button>
          </div>
        )}
      </div>

      {resultsViewMode === "coincidence" ? (
        <section className="results-slot-mode">
          <div className="results-slot-card">
            <div className="results-slot-card__header">{coincidenceTitleLabel}</div>
            <div className="results-slot-viewport">
              <div
                className="results-slot-track"
                style={{ transform: `translateX(-${slotIndex * 100}%)` }}
              >
                {rows.map((row) => (
                  <div
                    key={row.key}
                    className={`results-slot-item ${row.incomplete ? "is-incomplete" : ""}`}
                  >
                    <SlotAvatar row={row} resolvedLogoUrls={resolvedLogoUrls} resolvedCandidatePhotoUrls={resolvedCandidatePhotoUrls} />
                    <h3 className="results-slot-item__name">{row.displayName}</h3>
                    {row.type === "presidential" && row.payload?.party && (
                      <div className="results-slot-item__party">{row.payload.party}</div>
                    )}
                    <div className="results-slot-item__score">{row.score}%</div>
                  </div>
                ))}
              </div>
              <div className="results-slot-fade results-slot-fade--left" aria-hidden="true" />
              <div className="results-slot-fade results-slot-fade--right" aria-hidden="true" />
            </div>

            <div className="results-slot-controls">
              <button
                className="results-slot-controls__btn"
                onClick={() => moveSlot(-1)}
                disabled={slotIndex <= 0}
              >
                {t("common.back")}
              </button>
              <button
                className="results-slot-controls__btn"
                onClick={() => moveSlot(1)}
                disabled={slotIndex >= rows.length - 1}
              >
                {t("common.next")}
              </button>
            </div>
          </div>

          <section className="results-analysis-card">
            <div className="results-analysis-card__header is-compact has-info">
              <span>
                {comparisonBefore}
                {comparedTopicsCount}
                {comparisonAfter}
              </span>
              <button
                type="button"
                className="topic-info-btn results-analysis-info-btn"
                onClick={() => setShowComparisonInfoModal(true)}
                aria-label={comparisonInfoLabel}
                title={comparisonInfoLabel}
              >
                <span className="info-icon">i</span>
              </button>
            </div>
            <ResultsAnalysisPanel
              t={t}
              selectedEntity={selectedEntity}
              entityDetails={entityDetails}
              questions={questions}
              answers={answers}
            />
          </section>
        </section>
      ) : (
        <div className={`results-layout ${isMobile ? "is-mobile" : "is-desktop"}`}>
          <section className={`results-list-card ${isMobile && mobileResultsTab !== "list" ? "results-mobile-tab-hidden" : ""}`}>
            <div className="results-list-card__header">
              <span>
                {selectedResultType === "party" ? t("results.parties") : t("results.candidates")}
              </span>
              <span>{t("results.similarity")}</span>
            </div>

            <div className="results-list-scroll-area">
            <ul className="results-list" ref={resultsListRef} onScroll={handleResultsListScroll}>
              {completeRows.length > 0 && (
                <li className="results-list-section-header" aria-hidden="true">
                  <span>{completeComparisonsLabel}</span>
                </li>
              )}
              {completeRows.map(({ row, idx }) => {
                const fillPercent = getFillPercent(row.score);
                const selected = isSelectedRow(row);
                const dimmed = !!selectedEntity && !selected;
                const hasResolvedSelection = selectedRowIndex >= 0 && selectedRowIndex < rows.length;
                const showIncompleteState = row.incomplete && !hasResolvedSelection;
                return (
                  <li key={row.key} data-row-index={idx}>
                    <button
                      className={`results-row ${selected ? "is-selected" : ""} ${dimmed ? "is-dimmed" : ""} ${showIncompleteState ? "is-incomplete" : ""}`}
                      onClick={() => handleSelectRow(row)}
                      style={getRowFillStyle(fillPercent, { selected, dimmed })}
                    >
                      <span className="results-row__identity">
                        <RowAvatar row={row} fillPercent={fillPercent} resolvedLogoUrls={resolvedLogoUrls} resolvedCandidatePhotoUrls={resolvedCandidatePhotoUrls} />
                        <span className="results-row__name">
                          <RowFillAwareText text={row.displayName} fillPercent={fillPercent} />
                        </span>
                      </span>
                      <span className="results-row__score">
                        <RowFillAwareText text={`${row.score}%`} fillPercent={fillPercent} />
                      </span>
                    </button>
                  </li>
                );
              })}
              {incompleteRows.length > 0 && (
                <li className="results-list-section-header" aria-hidden="true">
                  <span>{incompleteComparisonsLabel}</span>
                </li>
              )}
              {incompleteRows.map(({ row, idx }) => {
                const fillPercent = getFillPercent(row.score);
                const selected = isSelectedRow(row);
                const dimmed = !!selectedEntity && !selected;
                const hasResolvedSelection = selectedRowIndex >= 0 && selectedRowIndex < rows.length;
                const showIncompleteState = row.incomplete && !hasResolvedSelection;
                return (
                  <li key={row.key} data-row-index={idx}>
                    <button
                      className={`results-row ${selected ? "is-selected" : ""} ${dimmed ? "is-dimmed" : ""} ${showIncompleteState ? "is-incomplete" : ""}`}
                      onClick={() => handleSelectRow(row)}
                      style={getRowFillStyle(fillPercent, { selected, dimmed })}
                    >
                      <span className="results-row__identity">
                        <RowAvatar row={row} fillPercent={fillPercent} resolvedLogoUrls={resolvedLogoUrls} resolvedCandidatePhotoUrls={resolvedCandidatePhotoUrls} />
                        <span className="results-row__name">
                          <RowFillAwareText text={row.displayName} fillPercent={fillPercent} />
                        </span>
                      </span>
                      <span className="results-row__score">
                        <RowFillAwareText text={`${row.score}%`} fillPercent={fillPercent} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
              <div className={`results-list-fade results-list-fade--top ${listHasTopFade ? "is-visible" : ""}`} aria-hidden="true" />
              <div className={`results-list-fade results-list-fade--bottom ${listHasBottomFade ? "is-visible" : ""}`} aria-hidden="true" />
              {showListScrollHint && (
                <div className="results-list-scroll-hint">
                  {t("results.scrollHint")}
                </div>
              )}
            </div>
          </section>

          <div className={`results-analysis-panel ${isMobile && mobileResultsTab !== "analysis" ? "results-mobile-tab-hidden" : ""}`}>
            {activeRow && (
              <section className="results-analysis-active-card">
                <div className="results-analysis-active-card__identity">
                  <SlotAvatar row={activeRow} resolvedLogoUrls={resolvedLogoUrls} resolvedCandidatePhotoUrls={resolvedCandidatePhotoUrls} />
                  <div className="results-analysis-active-card__text">
                    <span className="results-analysis-active-card__label">
                      {activeSelectionLabel}
                    </span>
                    <strong className="results-analysis-active-card__name">
                      {activeRow.displayName}
                      {selectedResultType === "presidentialCandidates" && activeRow?.payload?.party && (
                        <span className="results-analysis-active-card__party-inline"> ({activeRow.payload.party})</span>
                      )}
                    </strong>
                  </div>
                </div>
                <div className="results-analysis-active-card__score">
                  <span className="results-analysis-active-card__score-label">
                    {activeSelectionSimilarityPercentageLabel}
                  </span>
                  {activeRow.score}%
                </div>
              </section>
            )}
            <section className="results-analysis-card">
              <div className="results-analysis-card__header has-info">
                <span>
                  {comparisonBefore}
                  {comparedTopicsCount}
                  {comparisonAfter}
                </span>
                <button
                  type="button"
                  className="topic-info-btn results-analysis-info-btn"
                  onClick={() => setShowComparisonInfoModal(true)}
                  aria-label={comparisonInfoLabel}
                  title={comparisonInfoLabel}
                >
                  <span className="info-icon">i</span>
                </button>
              </div>
              <ResultsAnalysisPanel
                t={t}
                selectedEntity={selectedEntity}
                entityDetails={entityDetails}
                questions={questions}
                answers={answers}
              />
            </section>
            <div className="results-analysis-nav">
              <button
                className={`results-analysis-nav__btn ${analysisNavFlash === "prev" ? "is-flash" : ""}`}
                onClick={() => handleAnalysisNavClick(-1, "prev")}
                disabled={selectedRowIndex <= 0}
              >
                {t("common.back")}
              </button>
              <button
                className={`results-analysis-nav__btn ${analysisNavFlash === "next" ? "is-flash" : ""}`}
                onClick={() => handleAnalysisNavClick(1, "next")}
                disabled={selectedRowIndex < 0 || selectedRowIndex >= rows.length - 1}
              >
                {t("common.next")}
              </button>
            </div>
            {isMobile && (
              <div className="results-analysis-nav is-single">
                <button
                  className="results-analysis-nav__btn results-analysis-nav__btn--back-to-ranking"
                  onClick={() => setMobileResultsTab("list")}
                >
                  {goBackToListLabel}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showResultsScrollDownFab && createPortal(
        <button
          className="topic-scroll-down-fab results-scroll-down-fab"
          type="button"
          onClick={handleResultsScrollDownFabClick}
          aria-label={scrollDownTopicsLabel}
          title={scrollDownTopicsLabel}
        >
          <span>{scrollDownTopicsLabel}</span>
          <span aria-hidden="true">▼</span>
        </button>,
        document.body
      )}

      {showComparisonInfoModal && createPortal(
        <div className="results-comparison-info-overlay" onClick={() => setShowComparisonInfoModal(false)}>
          <div className="results-comparison-info-dialog" onClick={(e) => e.stopPropagation()}>
            <p>{comparisonInfoBody}</p>
            <button
              type="button"
              className="results-comparison-info-close"
              onClick={() => setShowComparisonInfoModal(false)}
            >
              {comparisonInfoCloseLabel}
            </button>
          </div>
        </div>,
        document.body
      )}

      <button
        className="results-save-btn"
        onClick={handleSaveResults}
        type="button"
      >
        {saveResultsLabel}
      </button>

      <button
        ref={backToSurveyRef}
        className="back-to-survey-button"
        onClick={onBackToSurvey}
        onMouseEnter={(e) => (e.target.style.backgroundColor = "var(--buttonNextHover)")}
        onMouseLeave={(e) => (e.target.style.backgroundColor = "var(--buttonNext)")}
        style={{ backgroundColor: "var(--buttonNext)", transition: "background-color 0.2s ease-in-out" }}
      >
        {t("nav.backToSurvey")}
      </button>

      {showSaveModal && createPortal(
        <div className="results-save-modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="results-save-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{savedTitleLabel}</h3>
            <p>{savedBodyLabel}</p>
            <div className="results-save-modal__url-box">
              <input
                type="text"
                className="results-save-modal__url-input"
                value={savedUrl}
                readOnly
                onClick={(e) => e.target.select()}
              />
              <button
                type="button"
                className="results-save-modal__copy-btn"
                onClick={() => copyToClipboard(savedUrl, setCopiedUrl)}
              >
                {copiedUrl ? copiedLabel : copyUrlLabel}
              </button>
            </div>
            <p className="results-save-modal__mnemonic-label">{savedMnemonicLabelText}</p>
            <div className="results-save-modal__mnemonic-box">
              <code className="results-save-modal__mnemonic-code">{savedMnemonic}</code>
              <button
                type="button"
                className="results-save-modal__copy-btn"
                onClick={() => copyToClipboard(savedMnemonic, setCopiedMnemonic)}
              >
                {copiedMnemonic ? copiedLabel : copyMnemonicLabel}
              </button>
            </div>
            <button
              type="button"
              className="results-save-modal__close"
              onClick={() => setShowSaveModal(false)}
            >
              {t("common.close")}
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Version-aware restored modals */}
      {restoredFromMnemonic && versionMismatchType === "exact" && createPortal(
        <div className="results-restored-modal-overlay" onClick={onDismissRestoredModal}>
          <div className="results-restored-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{restoredTitleLabel}</h3>
            <p>{restoredBodyLabel}</p>
            <button
              type="button"
              className="results-restored-modal__close"
              onClick={onDismissRestoredModal}
            >
              {restoredCloseLabel}
            </button>
          </div>
        </div>,
        document.body
      )}

      {restoredFromMnemonic && versionMismatchType === "patch" && createPortal(
        <div className="results-restored-modal-overlay results-version-patch-overlay" onClick={onDismissRestoredModal}>
          <div className="results-restored-modal results-version-patch-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{versionPatchTitleLabel}</h3>
            <p>{formatVersionBody(versionPatchBodyTemplate, restoredVersion, quizDataVersion)}</p>
            <button
              type="button"
              className="results-restored-modal__close"
              onClick={onDismissRestoredModal}
            >
              {versionPatchCloseLabel}
            </button>
          </div>
        </div>,
        document.body
      )}

      {restoredFromMnemonic && versionMismatchType === "minor" && createPortal(
        <div className="results-restored-modal-overlay results-version-minor-overlay">
          <div className="results-restored-modal results-version-minor-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{versionMinorTitleLabel}</h3>
            <p>{formatVersionBody(versionMinorBodyTemplate, restoredVersion, quizDataVersion)}</p>
            <button
              type="button"
              className="results-restored-modal__close results-version-minor-modal__close"
              onClick={onForceReset}
            >
              {versionMinorCloseLabel}
            </button>
          </div>
        </div>,
        document.body
      )}

      {restoredFromMnemonic && versionMismatchType === "major" && createPortal(
        <div className="results-restored-modal-overlay results-version-major-overlay">
          <div className="results-restored-modal results-version-major-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{versionMajorTitleLabel}</h3>
            <p>{formatVersionBody(versionMajorBodyTemplate, restoredVersion, quizDataVersion)}</p>
            <button
              type="button"
              className="results-restored-modal__close results-version-major-modal__close"
              onClick={onForceReset}
            >
              {versionMajorCloseLabel}
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Generic restored modal for invalid/null versions (legacy mnemonics) */}
      {restoredFromMnemonic && (versionMismatchType === "invalid" || versionMismatchType === null) && createPortal(
        <div className="results-restored-modal-overlay" onClick={onDismissRestoredModal}>
          <div className="results-restored-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{restoredTitleLabel}</h3>
            <p>{restoredBodyLabel}</p>
            <button
              type="button"
              className="results-restored-modal__close"
              onClick={onDismissRestoredModal}
            >
              {restoredCloseLabel}
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function RowFillAwareText({ text, fillPercent }) {
  const rootRef = React.useRef(null);
  const [splitPx, setSplitPx] = React.useState(null);

  const recomputeSplit = React.useCallback(() => {
    const textEl = rootRef.current;
    if (!textEl) return;
    const rowEl = textEl.closest(".results-row");
    if (!rowEl) return;

    const rowRect = rowEl.getBoundingClientRect();
    const textRect = textEl.getBoundingClientRect();
    const rowFillPx = rowRect.width * (fillPercent / 100);
    const localSplit = rowFillPx - (textRect.left - rowRect.left);
    const clamped = Math.max(0, Math.min(textRect.width, localSplit));
    const rounded = Math.round(clamped * 100) / 100;
    setSplitPx((prev) => (prev === rounded ? prev : rounded));
  }, [fillPercent]);

  React.useEffect(() => {
    recomputeSplit();
    const textEl = rootRef.current;
    if (!textEl) return undefined;
    const rowEl = textEl.closest(".results-row");

    let ro = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(recomputeSplit);
      ro.observe(textEl);
      if (rowEl) ro.observe(rowEl);
    }

    window.addEventListener("resize", recomputeSplit);
    return () => {
      window.removeEventListener("resize", recomputeSplit);
      if (ro) ro.disconnect();
    };
  }, [recomputeSplit, text]);

  return (
    <span className="results-row__split-text" ref={rootRef} style={{ "--split-local": `${splitPx ?? 0}px` }}>
      <span className="results-row__split-text-measure">
        {text}
      </span>
      <span className="results-row__split-text-layer is-fill" aria-hidden="true">
        {text}
      </span>
      <span className="results-row__split-text-layer is-base" aria-hidden="true">
        {text}
      </span>
    </span>
  );
}

function SlotAvatar({ row, resolvedLogoUrls = {}, resolvedCandidatePhotoUrls = {} }) {
  const [photoLoaded, setPhotoLoaded] = React.useState(false);
  const [logoLoaded, setLogoLoaded] = React.useState(false);
  const photoImgRef = React.useRef(null);
  const logoImgRef = React.useRef(null);

  const extractPartyFromCandidateName = (name) => {
    if (!name || typeof name !== "string") return null;
    const m = name.match(/\(([^)]+)\)\s*$/);
    if (m && m[1]) return m[1].trim();
    const m2 = name.match(/\[([^\]]+)\]\s*$/);
    if (m2 && m2[1]) return m2[1].trim();
    return null;
  };

  const extractCandidateName = (name) => {
    if (!name || typeof name !== "string") return null;
    const match = name.match(/^([^(]+)/);
    if (match && match[1]) return match[1].trim();
    return name.trim();
  };

  const getPartyName = () => {
    if (!row) return null;
    if (row.type === "party") return row.name || row.id || row.payload?.party || null;
    return row.payload?.party || extractPartyFromCandidateName(row.displayName || row.name || row.payload?.name || "");
  };

  const getCandidateName = () => {
    if (!row || row.type === "party") return null;
    return extractCandidateName(row.displayName || row.name || row.payload?.name || "");
  };

  const isCandidate = row?.type === "presidential";
  const candidateName = getCandidateName();
  const candidateSlug = slugifyAssetName(candidateName || "");
  const candidatePhotoSrc = isCandidate ? (resolvedCandidatePhotoUrls[candidateSlug] || "") : "";

  const partyName = getPartyName();
  const partySlug = slugifyAssetName(partyName || "");
  const logoSrc = resolvedLogoUrls[partySlug] || "";

  React.useEffect(() => {
    setPhotoLoaded(false);
  }, [candidatePhotoSrc]);

  React.useEffect(() => {
    setLogoLoaded(false);
  }, [logoSrc]);

  React.useEffect(() => {
    if (!candidatePhotoSrc) return undefined;
    let cancelled = false;
    let rafId = 0;
    let attempts = 0;
    const checkLoaded = () => {
      if (cancelled) return;
      const el = photoImgRef.current;
      if (el && el.complete && el.naturalWidth > 0) {
        setPhotoLoaded(true);
        return;
      }
      attempts += 1;
      if (attempts < 30) {
        rafId = requestAnimationFrame(checkLoaded);
      }
    };
    rafId = requestAnimationFrame(checkLoaded);
    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [candidatePhotoSrc]);

  React.useEffect(() => {
    if (!logoSrc) return undefined;
    let cancelled = false;
    let rafId = 0;
    let attempts = 0;
    const checkLoaded = () => {
      if (cancelled) return;
      const el = logoImgRef.current;
      if (el && el.complete && el.naturalWidth > 0) {
        setLogoLoaded(true);
        return;
      }
      attempts += 1;
      if (attempts < 30) {
        rafId = requestAnimationFrame(checkLoaded);
      }
    };
    rafId = requestAnimationFrame(checkLoaded);
    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [logoSrc]);

  const hasPhoto = isCandidate && photoLoaded;
  const hasLogo = logoLoaded;

  return (
    <div className={`results-slot-item__avatar ${hasPhoto ? "has-photo" : ""} ${hasLogo ? "has-logo" : ""}`} aria-hidden="true">
      <span className="results-slot-item__avatar-fallback">
        {(row?.displayName || "?").charAt(0)}
      </span>
      {isCandidate && candidatePhotoSrc && (
        <img
          key={candidatePhotoSrc}
          ref={photoImgRef}
          className={`results-slot-item__avatar-photo ${photoLoaded ? "is-visible" : ""}`}
          src={candidatePhotoSrc}
          alt=""
          onLoad={() => setPhotoLoaded(true)}
          onError={() => setPhotoLoaded(false)}
          draggable={false}
        />
      )}
      {logoSrc && (
        <img
          key={logoSrc}
          ref={logoImgRef}
          className={`results-slot-item__avatar-img ${logoLoaded ? "is-visible" : ""} ${isCandidate && photoLoaded ? "is-badge" : ""}`}
          src={logoSrc}
          alt=""
          onLoad={() => setLogoLoaded(true)}
          onError={() => setLogoLoaded(false)}
          draggable={false}
        />
      )}
    </div>
  );
}

function RowAvatar({ row, fillPercent, resolvedLogoUrls = {}, resolvedCandidatePhotoUrls = {} }) {
  const [photoLoaded, setPhotoLoaded] = React.useState(false);
  const [logoLoaded, setLogoLoaded] = React.useState(false);
  const photoImgRef = React.useRef(null);
  const logoImgRef = React.useRef(null);

  const extractPartyFromCandidateName = (name) => {
    if (!name || typeof name !== "string") return null;
    const m = name.match(/\(([^)]+)\)\s*$/);
    if (m && m[1]) return m[1].trim();
    const m2 = name.match(/\[([^\]]+)\]\s*$/);
    if (m2 && m2[1]) return m2[1].trim();
    return null;
  };

  const extractCandidateName = (name) => {
    if (!name || typeof name !== "string") return null;
    const match = name.match(/^([^(]+)/);
    if (match && match[1]) return match[1].trim();
    return name.trim();
  };

  const getPartyName = () => {
    if (!row) return null;
    if (row.type === "party") return row.name || row.id || row.payload?.party || null;
    return row.payload?.party || extractPartyFromCandidateName(row.displayName || row.name || row.payload?.name || "");
  };

  const getCandidateName = () => {
    if (!row || row.type === "party") return null;
    return extractCandidateName(row.displayName || row.name || row.payload?.name || "");
  };

  const isCandidate = row?.type === "presidential";
  const candidateName = getCandidateName();
  const candidateSlug = slugifyAssetName(candidateName || "");
  const candidatePhotoSrc = isCandidate ? (resolvedCandidatePhotoUrls[candidateSlug] || "") : "";

  const partyName = getPartyName();
  const partySlug = slugifyAssetName(partyName || "");
  const logoSrc = resolvedLogoUrls[partySlug] || "";

  React.useEffect(() => {
    setPhotoLoaded(false);
  }, [candidatePhotoSrc]);

  React.useEffect(() => {
    setLogoLoaded(false);
  }, [logoSrc]);

  React.useEffect(() => {
    if (!candidatePhotoSrc) return undefined;
    let cancelled = false;
    let rafId = 0;
    let attempts = 0;
    const checkLoaded = () => {
      if (cancelled) return;
      const el = photoImgRef.current;
      if (el && el.complete && el.naturalWidth > 0) {
        setPhotoLoaded(true);
        return;
      }
      attempts += 1;
      if (attempts < 30) {
        rafId = requestAnimationFrame(checkLoaded);
      }
    };
    rafId = requestAnimationFrame(checkLoaded);
    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [candidatePhotoSrc]);

  React.useEffect(() => {
    if (!logoSrc) return undefined;
    let cancelled = false;
    let rafId = 0;
    let attempts = 0;
    const checkLoaded = () => {
      if (cancelled) return;
      const el = logoImgRef.current;
      if (el && el.complete && el.naturalWidth > 0) {
        setLogoLoaded(true);
        return;
      }
      attempts += 1;
      if (attempts < 30) {
        rafId = requestAnimationFrame(checkLoaded);
      }
    };
    rafId = requestAnimationFrame(checkLoaded);
    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [logoSrc]);

  // For candidates: show photo with party logo badge
  // For parties: show logo only
  const hasPhoto = isCandidate && photoLoaded;
  const hasLogo = logoLoaded;

  return (
    <span className={`results-row__avatar ${hasPhoto ? "has-photo" : ""} ${hasLogo ? "has-logo" : ""}`} aria-hidden="true">
      <span className="results-row__avatar-fallback">
        <RowFillAwareText text={(row?.displayName || "?").charAt(0)} fillPercent={fillPercent} />
      </span>
      {isCandidate && candidatePhotoSrc && (
        <img
          key={candidatePhotoSrc}
          ref={photoImgRef}
          className={`results-row__avatar-photo ${photoLoaded ? "is-visible" : ""}`}
          src={candidatePhotoSrc}
          alt=""
          onLoad={() => setPhotoLoaded(true)}
          onError={() => setPhotoLoaded(false)}
          draggable={false}
        />
      )}
      {logoSrc && (
        <img
          key={logoSrc}
          ref={logoImgRef}
          className={`results-row__avatar-img ${logoLoaded ? "is-visible" : ""} ${isCandidate && photoLoaded ? "is-badge" : ""}`}
          src={logoSrc}
          alt=""
          onLoad={() => setLogoLoaded(true)}
          onError={() => setLogoLoaded(false)}
          draggable={false}
        />
      )}
    </span>
  );
}

function ResultsAnalysisPanel({
  t,
  selectedEntity,
  entityDetails,
  questions,
  answers,
}) {
  const [expandedCategory, setExpandedCategory] = React.useState(null);
  const [selectedTopic, setSelectedTopic] = React.useState(null);
  const [headingAnimTick, setHeadingAnimTick] = React.useState(0);
  const [showSuggestionModal, setShowSuggestionModal] = React.useState(false);
  const [suggestionText, setSuggestionText] = React.useState("");
  const [suggestionName, setSuggestionName] = React.useState("");
  const [suggestionEmail, setSuggestionEmail] = React.useState("");
  const [suggestionNameTouched, setSuggestionNameTouched] = React.useState(false);
  const [suggestionEmailTouched, setSuggestionEmailTouched] = React.useState(false);
  const [suggestionSubmitting, setSuggestionSubmitting] = React.useState(false);
  const [suggestionSent, setSuggestionSent] = React.useState(false);
  const [suggestedTopics, setSuggestedTopics] = React.useState(() => new Set());

  React.useEffect(() => {
    setHeadingAnimTick((prev) => prev + 1);
  }, [selectedEntity?.id, selectedEntity?.name, selectedEntity?.party]);

  React.useEffect(() => {
    setShowSuggestionModal(false);
    setSuggestionText("");
    setSuggestionName("");
    setSuggestionEmail("");
    setSuggestionNameTouched(false);
    setSuggestionEmailTouched(false);
    setSuggestionSubmitting(false);
    setSuggestionSent(false);
  }, [selectedTopic?.id]);

  if (!selectedEntity || !entityDetails) {
    return (
      <div className="results-analysis-empty">
        {t("results.noDetails")}
      </div>
    );
  }

  const answerToNumeric = {
    "answers.agreeCapitalized": 1,
    "answers.neutralCapitalized": 0.5,
    "answers.disagreeCapitalized": 0,
  };
  const numericToVoteKey = {
    "1": "votes.inFavor",
    "0.5": "votes.neutral",
    "0": "votes.against",
  };

  const details = (entityDetails.details || []).filter(d => d.includedInAnalysis);
  const topics = details
    .map((d) => {
      const qIndex = questions.findIndex(q => q.id === d.id);
      if (qIndex < 0) return null;

      const rawAnswer = answers?.[qIndex];
      if (rawAnswer == null) return null;

      const userVal = answerToNumeric[rawAnswer];
      if (userVal == null) return null;

      const candidateVal = voteToNumeric(d.vote);
      const diff = Math.abs(candidateVal - userVal);
      let status = "match";
      if (diff === 0.5) status = "partial";
      if (diff >= 1) status = "mismatch";

      const baseQuestion = questions[qIndex];
      const text = d.question_key ? t(d.question_key) : (baseQuestion?.question || d.question || "");
      const topicKey = baseQuestion?.topic_key || null;
      const topicFallback = baseQuestion?.tema || d.tema || text;
      const topicLabel = topicKey ? (t(topicKey) === topicKey ? topicFallback : t(topicKey)) : topicFallback;
      const userVoteKey = numericToVoteKey[String(userVal)] || null;
      const candidateVoteKey = numericToVoteKey[String(candidateVal)] || null;

      return {
        id: d.id,
        status,
        topicKey: topicKey || topicLabel,
        shortLabel: topicLabel,
        statement: text,
        userStance: userVoteKey ? t(userVoteKey) : t("entityDetails.noAnswer"),
        candidateStance: candidateVoteKey ? t(candidateVoteKey) : (d.vote || "N/A"),
        explanation: d.comment_key ? t(d.comment_key) : (d.comment || ""),
        source: d.source || "",
      };
    })
    .filter(Boolean);

  const dedupeTopics = (items) => {
    const seen = new Set();
    return items.filter((item) => {
      const key = item.topicKey || item.shortLabel || item.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const normalizeTopicSources = (rawSource) => {
    if (rawSource == null || rawSource === "") return [];
    if (Array.isArray(rawSource)) {
      return rawSource.flatMap((item) => normalizeTopicSources(item));
    }
    if (typeof rawSource === "object") {
      const text = rawSource.text || rawSource.title || rawSource.name || rawSource.label || "";
      const url = rawSource.url || rawSource.link || rawSource.href || "";
      if (text || url) return [{ text: String(text), url: String(url) }];
      if (rawSource.source) return normalizeTopicSources(rawSource.source);
      return [JSON.stringify(rawSource)];
    }
    const textValue = String(rawSource);
    const splitEntries = textValue
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean);
    return splitEntries.length > 0 ? splitEntries : [textValue];
  };

  const renderSourcePart = (value, keyPrefix) => {
    const urlRegex = /(https?:\/\/[^\s)]+|www\.[^\s)]+)/gi;
    const text = String(value || "");
    const parts = [];
    let lastIndex = 0;
    let match;
    let matchIndex = 0;
    while ((match = urlRegex.exec(text)) !== null) {
      const matched = match[0];
      const start = match.index;
      const end = start + matched.length;
      if (start > lastIndex) {
        parts.push(
          <span key={`${keyPrefix}-t-${matchIndex}`}>{text.slice(lastIndex, start)}</span>
        );
      }
      const href = matched.startsWith("http") ? matched : `https://${matched}`;
      parts.push(
        <a
          key={`${keyPrefix}-u-${matchIndex}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="results-topic-modal__source-link"
        >
          {matched}
        </a>
      );
      lastIndex = end;
      matchIndex += 1;
    }
    if (lastIndex < text.length) {
      parts.push(<span key={`${keyPrefix}-tail`}>{text.slice(lastIndex)}</span>);
    }
    return parts.length > 0 ? parts : [<span key={`${keyPrefix}-plain`}>{text}</span>];
  };

  const renderSourceEntry = (entry, idx) => {
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      const text = (entry.text || "").trim();
      const url = (entry.url || "").trim();
      const safeHref = url ? (url.startsWith("http") ? url : `https://${url}`) : "";
      return (
        <li key={`src-${idx}`} className="results-topic-modal__source-item">
          {text ? <span>{text}{safeHref ? ": " : ""}</span> : null}
          {safeHref ? (
            <a
              href={safeHref}
              target="_blank"
              rel="noopener noreferrer"
              className="results-topic-modal__source-link"
            >
              {url}
            </a>
          ) : null}
        </li>
      );
    }
    return (
      <li key={`src-${idx}`} className="results-topic-modal__source-item">
        {renderSourcePart(entry, `src-${idx}`)}
      </li>
    );
  };

  const grouped = {
    match: dedupeTopics(topics.filter(item => item.status === "match")),
    partial: dedupeTopics(topics.filter(item => item.status === "partial")),
    mismatch: dedupeTopics(topics.filter(item => item.status === "mismatch")),
  };

  const categoryConfig = [
    {
      id: "match",
      headingTemplate: t("results.fullMatchesHeading") === "results.fullMatchesHeading"
        ? "Tu coincides plenamente en [[nrOfMatchedTopics]] temas"
        : t("results.fullMatchesHeading"),
      chipClass: "is-match",
    },
    {
      id: "partial",
      headingTemplate: t("results.partialMatchesHeading") === "results.partialMatchesHeading"
        ? "Tu coincides parcialmente en [[nrOfMatchedTopics]] temas"
        : t("results.partialMatchesHeading"),
      chipClass: "is-partial",
    },
    {
      id: "mismatch",
      headingTemplate: t("results.mismatchHeading") === "results.mismatchHeading"
        ? "Tu difieres en [[nrOfMatchedTopics]] temas"
        : t("results.mismatchHeading"),
      chipClass: "is-mismatch",
    },
  ];

  const suggestionCtaLabel = t("results.topicSuggestionCta") === "results.topicSuggestionCta"
    ? "Sugerencias"
    : t("results.topicSuggestionCta");
  const suggestionTitle = t("results.topicSuggestionTitle") === "results.topicSuggestionTitle"
    ? "Enviar sugerencia"
    : t("results.topicSuggestionTitle");
  const suggestionBody = t("results.topicSuggestionBody") === "results.topicSuggestionBody"
    ? "Ayudanos a mejorar este tema. Tu sugerencia sera revisada por el equipo."
    : t("results.topicSuggestionBody");
  const suggestionTopicLabel = t("results.topicSuggestionTopicLabel") === "results.topicSuggestionTopicLabel"
    ? "Tema"
    : t("results.topicSuggestionTopicLabel");
  const suggestionInputLabel = t("results.topicSuggestionInputLabel") === "results.topicSuggestionInputLabel"
    ? "Sugerencia"
    : t("results.topicSuggestionInputLabel");
  const suggestionInputPlaceholder = t("results.topicSuggestionInputPlaceholder") === "results.topicSuggestionInputPlaceholder"
    ? "Escribe aqui tu sugerencia..."
    : t("results.topicSuggestionInputPlaceholder");
  const suggestionNameLabel = t("results.topicSuggestionNameLabel") === "results.topicSuggestionNameLabel"
    ? "Nombre"
    : t("results.topicSuggestionNameLabel");
  const suggestionNamePlaceholder = t("results.topicSuggestionNamePlaceholder") === "results.topicSuggestionNamePlaceholder"
    ? "Tu nombre completo"
    : t("results.topicSuggestionNamePlaceholder");
  const suggestionEmailLabel = t("results.topicSuggestionEmailLabel") === "results.topicSuggestionEmailLabel"
    ? "Email (opcional)"
    : t("results.topicSuggestionEmailLabel");
  const suggestionEmailPlaceholder = t("results.topicSuggestionEmailPlaceholder") === "results.topicSuggestionEmailPlaceholder"
    ? "correo@ejemplo.com"
    : t("results.topicSuggestionEmailPlaceholder");
  const suggestionNameError = t("results.topicSuggestionNameError") === "results.topicSuggestionNameError"
    ? "El nombre debe tener al menos 5 letras."
    : t("results.topicSuggestionNameError");
  const suggestionEmailError = t("results.topicSuggestionEmailError") === "results.topicSuggestionEmailError"
    ? "Ingresa un email valido."
    : t("results.topicSuggestionEmailError");
  const suggestionCancelLabel = t("results.topicSuggestionCancel") === "results.topicSuggestionCancel"
    ? "Cancelar"
    : t("results.topicSuggestionCancel");
  const suggestionSendLabel = t("results.topicSuggestionSend") === "results.topicSuggestionSend"
    ? "Enviar"
    : t("results.topicSuggestionSend");
  const suggestionSendingLabel = t("results.topicSuggestionSending") === "results.topicSuggestionSending"
    ? "Enviando..."
    : t("results.topicSuggestionSending");
  const suggestionSuccessLabel = t("results.topicSuggestionSuccess") === "results.topicSuggestionSuccess"
    ? "Gracias. Tu sugerencia fue registrada."
    : t("results.topicSuggestionSuccess");

  const sanitizeFreeText = (value) => String(value || "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const sanitizeName = (value) => sanitizeFreeText(value)
    .replace(/[^A-Za-zÀ-ÿ' -]/g, "");
  const sanitizeEmail = (value) => String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
  const countLetters = (value) => {
    const matched = String(value || "").match(/[A-Za-zÀ-ÿ]/g);
    return matched ? matched.length : 0;
  };
  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

  const cleanName = sanitizeName(suggestionName);
  const cleanEmail = sanitizeEmail(suggestionEmail);
  const cleanSuggestion = sanitizeFreeText(suggestionText);
  const isValidName = countLetters(cleanName) >= 5;
  const isValidSuggestion = cleanSuggestion.length >= 8;
  const isValidSuggestionEmail = cleanEmail.length === 0 || isValidEmail(cleanEmail);
  const canSubmitSuggestion = isValidName && isValidSuggestionEmail && isValidSuggestion && !suggestionSubmitting;
  const showNameError = suggestionNameTouched && suggestionName.length > 0 && !isValidName;
  const showEmailError = suggestionEmailTouched && suggestionEmail.length > 0 && !isValidSuggestionEmail;
  const getTopicSuggestionKey = (topic) => String(topic?.topicKey || topic?.shortLabel || topic?.id || "");
  const selectedTopicSuggestionKey = getTopicSuggestionKey(selectedTopic);
  const hasSuggestedForSelectedTopic = selectedTopicSuggestionKey && suggestedTopics.has(selectedTopicSuggestionKey);

  const openSuggestionModal = () => {
    setSuggestionSent(false);
    setSuggestionSubmitting(false);
    setSuggestionText("");
    setSuggestionName("");
    setSuggestionEmail("");
    setSuggestionNameTouched(false);
    setSuggestionEmailTouched(false);
    setShowSuggestionModal(true);
  };
  const handleSuggestionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTopic) return;
    if (!canSubmitSuggestion) {
      setSuggestionNameTouched(true);
      setSuggestionEmailTouched(true);
      return;
    }

    setSuggestionSubmitting(true);
    setSuggestionSent(false);
    const requestFreshTurnstileToken = async () => {
      if (typeof window === "undefined") return "";
      const verifiedAtRaw = window.sessionStorage.getItem("turnstile_verified_at");
      const verifiedAt = Number(verifiedAtRaw || "0");
      const storedCaptchaType = window.sessionStorage.getItem("captcha_type") || "turnstile";

      // Check if recently verified (within 5 minutes)
      const isRecentlyVerified = Number.isFinite(verifiedAt) &&
                                  verifiedAt > 0 &&
                                  Date.now() - verifiedAt <= 5 * 60 * 1000;

      if (isRecentlyVerified) {
        return ""; // No refresh needed
      }

      // Need verification: either never verified or expired
      // Load captcha scripts if not already available
      let captchaToUse = null;

      // Try Turnstile first (unless hCaptcha was previously used)
      if (storedCaptchaType === "turnstile" || !window.hcaptcha) {
        if (!window.turnstile && import.meta.env.VITE_TURNSTILE_FORM_KEY) {
          const loaded = await tryLoadTurnstile();
          if (loaded) captchaToUse = "turnstile";
        } else if (window.turnstile && import.meta.env.VITE_TURNSTILE_FORM_KEY) {
          captchaToUse = "turnstile";
        }
      }

      // Fall back to hCaptcha if Turnstile not available
      if (!captchaToUse) {
        if (!window.hcaptcha && import.meta.env.VITE_HCAPTCHA_SITE_KEY) {
          const loaded = await tryLoadHCaptcha();
          if (loaded) captchaToUse = "hcaptcha";
        } else if (window.hcaptcha && import.meta.env.VITE_HCAPTCHA_SITE_KEY) {
          captchaToUse = "hcaptcha";
        }
      }

      // No captcha available
      if (!captchaToUse) {
        return "";
      }

      return new Promise((resolve, reject) => {
        let widgetId = null;
        const overlay = document.createElement("div");
        overlay.className = "results-turnstile-refresh-overlay";
        overlay.innerHTML = `
          <div class="results-turnstile-refresh-card">
            <p class="results-turnstile-refresh-title">Verificación de seguridad</p>
            <p class="results-turnstile-refresh-body">Confirma nuevamente para enviar tu sugerencia.</p>
            <div id="results-turnstile-refresh-widget"></div>
            <button type="button" class="results-turnstile-refresh-cancel">Cancelar</button>
          </div>
        `;

        const cleanup = () => {
          try {
            if (widgetId != null) {
              if (window.turnstile?.remove) window.turnstile.remove(widgetId);
              if (window.hcaptcha?.reset) window.hcaptcha.reset(widgetId);
            }
          } catch (_) {}
          overlay.remove();
        };

        const cancelBtn = overlay.querySelector(".results-turnstile-refresh-cancel");
        if (cancelBtn) {
          cancelBtn.addEventListener("click", () => {
            cleanup();
            reject(new Error("captcha_cancelled"));
          });
        }

        document.body.appendChild(overlay);

        try {
          if (captchaToUse === "turnstile") {
            if (!import.meta.env.VITE_TURNSTILE_FORM_KEY) {
              reject(new Error("turnstile_missing_key"));
              return;
            }
            widgetId = window.turnstile.render("#results-turnstile-refresh-widget", {
              sitekey: import.meta.env.VITE_TURNSTILE_FORM_KEY,
              callback: (token) => {
                window.sessionStorage.setItem("captcha_type", "turnstile");
                cleanup();
                resolve(token || "");
              },
              "error-callback": () => {
                cleanup();
                reject(new Error("turnstile_error"));
              },
              "expired-callback": () => {
                cleanup();
                reject(new Error("turnstile_expired"));
              },
            });
          } else if (captchaToUse === "hcaptcha") {
            widgetId = window.hcaptcha.render("results-turnstile-refresh-widget", {
              sitekey: import.meta.env.VITE_HCAPTCHA_SITE_KEY,
              callback: (token) => {
                window.sessionStorage.setItem("captcha_type", "hcaptcha");
                cleanup();
                resolve(token || "");
              },
              "error-callback": () => {
                cleanup();
                reject(new Error("hcaptcha_error"));
              },
            });
          }
        } catch (err) {
          cleanup();
          reject(err);
        }
      });
    };

    let refreshTurnstileToken = "";
    try {
      refreshTurnstileToken = await requestFreshTurnstileToken();
      if (refreshTurnstileToken && typeof window !== "undefined") {
        window.sessionStorage.setItem("turnstile_verified_at", String(Date.now()));
      }
    } catch (_) {}

    const readCookie = (name) => {
      if (typeof document === "undefined") return "";
      const escaped = name.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&");
      const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
      return match ? decodeURIComponent(match[1]) : "";
    };
    let fingerprint = typeof window !== "undefined" ? (window.sessionStorage.getItem("fingerprint") || "") : "";
    try {
      const freshFingerprint = await collectFingerprintPayload();
      if (freshFingerprint) {
        fingerprint = freshFingerprint;
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("fingerprint", freshFingerprint);
        }
      }
    } catch (_) {
      // fall back to last known fingerprint
    }
    const captchaType = typeof window !== "undefined" ? (window.sessionStorage.getItem("captcha_type") || "turnstile") : "turnstile";
    const cfCookie = readCookie("cf_cookie") || readCookie("cf_clearance");
    const payload = {
      topicKey: selectedTopic.topicKey,
      topicLabel: selectedTopic.shortLabel,
      statement: selectedTopic.statement,
      suggestion: cleanSuggestion,
      name: cleanName,
      email: cleanEmail,
      cf_cookie: cfCookie,
      fingerprint,
      captcha_token: refreshTurnstileToken || undefined,
      captcha_type: refreshTurnstileToken ? captchaType : undefined,
      createdAt: new Date().toISOString(),
    };
    // Use fallback API for hCaptcha (old browsers that can't run Turnstile)
    const useFallbackApi = captchaType === "hcaptcha" && import.meta.env.VITE_HCAPTCHA_FALLBACK_API;
    const endpoint = useFallbackApi
      ? `${import.meta.env.VITE_HCAPTCHA_FALLBACK_API}/api/feedback`
      : `${String(import.meta.env.BASE_URL || "/").replace(/\/+$/, "")}/api/feedback`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: useFallbackApi ? "omit" : "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Acknowledgement-first UX: keep request fire-and-forget for the user.
        return;
      }

      setSuggestionSent(true);
      setSuggestionText("");
      setSuggestionName("");
      setSuggestionEmail("");
    } catch (_) {
      // Acknowledgement-first UX: do not block with errors in this flow.
    } finally {
      setSuggestionSubmitting(false);
      setSuggestionSent(true);
      if (selectedTopicSuggestionKey) {
        setSuggestedTopics((prev) => {
          const next = new Set(prev);
          next.add(selectedTopicSuggestionKey);
          return next;
        });
      }
    }
  };

  const renderHeading = (template, count, chipClass) => {
    const token = "[[nrOfMatchedTopics]]";
    const parts = String(template || "").split(token);
    const before = parts[0] || "";
    const after = parts.slice(1).join(token) || "";

    const enIdx = before.toLowerCase().lastIndexOf(" en ");
    const firstLine = enIdx >= 0 ? before.slice(0, enIdx).trim() : before.trim();
    const secondPrefix = enIdx >= 0 ? before.slice(enIdx + 1).trim() : "";

    return (
      <span className="results-analysis-heading">
        <span className="results-analysis-heading__line">{firstLine}</span>
        <span className="results-analysis-heading__line">
          {secondPrefix ? `${secondPrefix} ` : ""}
          <span
            className={`results-analysis-heading__count ${chipClass}`}
            style={{
              animationName: headingAnimTick % 2 === 0 ? "resultsHeadingFadeA" : "resultsHeadingFadeB",
            }}
          >
            {count}
          </span>
          {after ? ` ${after.trim()}` : ""}
        </span>
      </span>
    );
  };

  return (
    <div className="results-analysis-groups">
      {categoryConfig.map((category) => {
        const isOpen = expandedCategory === category.id;
        const chips = grouped[category.id] || [];
        return (
          <section key={category.id} className={`results-analysis-group ${isOpen ? "is-open" : ""}`}>
            <button
              className="results-analysis-group__header"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setExpandedCategory((prev) => (prev === category.id ? null : category.id));
              }}
            >
              {renderHeading(category.headingTemplate, chips.length, category.chipClass)}
              <span className="results-analysis-group__toggle">
                <span className="results-analysis-group__toggle-label">
                  {isOpen
                    ? (t("results.collapseSectionCta") === "results.collapseSectionCta"
                      ? "Presiona para minimizar"
                      : t("results.collapseSectionCta"))
                    : (t("results.expandSectionCta") === "results.expandSectionCta"
                      ? "Presiona para ver mas"
                      : t("results.expandSectionCta"))}
                </span>
                <span className="results-analysis-group__chevron" aria-hidden="true">
                  {isOpen ? "▲" : "▼"}
                </span>
              </span>
            </button>

              <div className={`results-analysis-group__body ${isOpen ? "is-open" : ""}`}>
                <div className="results-analysis-group__chips">
                  {chips.map((chip) => (
                    <button
                    key={`${category.id}-${chip.id}`}
                    className={`results-topic-chip ${category.chipClass}`}
                    type="button"
                    onClick={() => setSelectedTopic(chip)}
                  >
                    {chip.shortLabel}
                  </button>
                ))}
                {chips.length === 0 && (
                  <p className="results-analysis-empty-inline">
                    {t("results.noDetails")}
                  </p>
                )}
                </div>
                <p className="results-analysis-group__hint">
                  {t("results.groupTopicsHint") === "results.groupTopicsHint"
                    ? "Toca un tema para ver el detalle."
                    : t("results.groupTopicsHint")}
                </p>
              </div>
            </section>
          );
        })}

      {selectedTopic && createPortal(
        <div className="results-topic-modal-overlay" onClick={() => setSelectedTopic(null)}>
          <div className="results-topic-modal" onClick={(e) => e.stopPropagation()}>
            <div className={`results-topic-modal__topbar is-${selectedTopic.status}`} />
            <div className="results-topic-modal__content">
              <h3>{selectedTopic.statement}</h3>

              <div className="results-topic-modal__stances">
                <div className="results-topic-modal__stance">
                  <span>{t("entityDetails.you")}</span>
                  <strong>{selectedTopic.userStance}</strong>
                </div>
                <div className="results-topic-modal__stance">
                  <span>{t("entityDetails.candidate")}</span>
                  <strong>{selectedTopic.candidateStance}</strong>
                </div>
              </div>

              {selectedTopic.explanation && (
                <p className="results-topic-modal__explanation">
                  {selectedTopic.explanation}
                </p>
              )}

              {(() => {
                const sources = normalizeTopicSources(selectedTopic.source);
                if (sources.length === 0) return null;
                return (
                  <div className="results-topic-modal__source">
                    <p className="results-topic-modal__source-title">
                      {t("common.seeSource")}
                    </p>
                    <ul className="results-topic-modal__source-list">
                      {sources.map((entry, idx) => renderSourceEntry(entry, idx))}
                    </ul>
                  </div>
                );
              })()}

              <div className="results-topic-modal__actions">
                {!hasSuggestedForSelectedTopic ? (
                  <button
                    className="results-topic-modal__suggest"
                    onClick={openSuggestionModal}
                    type="button"
                  >
                    {suggestionCtaLabel}
                  </button>
                ) : null}
                <button
                  className="results-topic-modal__close"
                  onClick={() => setSelectedTopic(null)}
                  type="button"
                >
                  {t("common.close")}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showSuggestionModal && selectedTopic && createPortal(
        <div className="results-suggestion-modal-overlay" onClick={() => setShowSuggestionModal(false)}>
          <div className="results-suggestion-modal" onClick={(e) => e.stopPropagation()}>
            {suggestionSent ? (
              <div className="results-suggestion-modal__success-state">
                <p className="results-suggestion-modal__success">{suggestionSuccessLabel}</p>
                <button
                  type="button"
                  className="results-suggestion-modal__btn is-primary"
                  onClick={() => setShowSuggestionModal(false)}
                >
                  {t("common.close")}
                </button>
              </div>
            ) : (
              <>
                <h3>{suggestionTitle}</h3>
                <p className="results-suggestion-modal__body">{suggestionBody}</p>
                <div className="results-suggestion-modal__topic-box">
                  <span>{suggestionTopicLabel}</span>
                  <strong>{selectedTopic.shortLabel}</strong>
                </div>

                <form className="results-suggestion-modal__form" onSubmit={handleSuggestionSubmit}>
                  <div className="results-suggestion-modal__row">
                    <div className="results-suggestion-modal__field">
                      <label className="results-suggestion-modal__label" htmlFor="results-suggestion-name">
                        {suggestionNameLabel}
                      </label>
                      <input
                        id="results-suggestion-name"
                        className="results-suggestion-modal__input"
                        value={suggestionName}
                        onChange={(e) => setSuggestionName(sanitizeName(e.target.value))}
                        onBlur={() => setSuggestionNameTouched(true)}
                        placeholder={suggestionNamePlaceholder}
                        type="text"
                        autoComplete="name"
                        required
                      />
                      <p className={`results-suggestion-modal__error ${showNameError ? "is-visible" : ""}`}>
                        {showNameError ? suggestionNameError : " "}
                      </p>
                    </div>

                    <div className="results-suggestion-modal__field">
                      <label className="results-suggestion-modal__label" htmlFor="results-suggestion-email">
                        {suggestionEmailLabel}
                      </label>
                      <input
                        id="results-suggestion-email"
                        className="results-suggestion-modal__input"
                        value={suggestionEmail}
                        onChange={(e) => setSuggestionEmail(sanitizeEmail(e.target.value))}
                        onBlur={() => setSuggestionEmailTouched(true)}
                        placeholder={suggestionEmailPlaceholder}
                        type="email"
                        autoComplete="email"
                      />
                      <p className={`results-suggestion-modal__error ${showEmailError ? "is-visible" : ""}`}>
                        {showEmailError ? suggestionEmailError : " "}
                      </p>
                    </div>
                  </div>

                  <div className="results-suggestion-modal__field">
                    <label className="results-suggestion-modal__label" htmlFor="results-suggestion-message">
                      {suggestionInputLabel}
                    </label>
                    <textarea
                      id="results-suggestion-message"
                      className="results-suggestion-modal__textarea"
                      value={suggestionText}
                      onChange={(e) => setSuggestionText(e.target.value)}
                      placeholder={suggestionInputPlaceholder}
                      rows={4}
                      required
                    />
                  </div>

                  <div className="results-suggestion-modal__actions">
                    <button
                      type="button"
                      className="results-suggestion-modal__btn is-secondary"
                      onClick={() => setShowSuggestionModal(false)}
                      disabled={suggestionSubmitting}
                    >
                      {suggestionCancelLabel}
                    </button>
                    <button
                      type="submit"
                      className="results-suggestion-modal__btn is-primary"
                      disabled={!canSubmitSuggestion}
                    >
                      {suggestionSubmitting ? suggestionSendingLabel : suggestionSendLabel}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
