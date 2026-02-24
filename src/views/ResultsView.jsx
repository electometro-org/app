import React from "react";
import { useTranslate } from "@tolgee/react";
import { BrandLogo } from "../components/BrandImage";
import { voteToNumeric } from "../voteUtils";
import { createPortal } from "react-dom";

export default function ResultsView({
  comparisonResults,
  selectedResultType,
  resultTypes,
  selectedEntity,
  entityDetails,
  questionDetails,
  questions,
  answers,
  config,
  isMobile,
  partyComplete,
  partyIncomplete,
  presComplete,
  presIncomplete,
  hoveredOption,
  branding,
  onResultTypeChange,
  onEntityClick,
  onBackToSurvey,
  onHover,
}) {
  const { t } = useTranslate();
  const [mobileResultsTab, setMobileResultsTab] = React.useState("list");
  const [resultsViewMode, setResultsViewMode] = React.useState("coincidence");
  const [slotIndex, setSlotIndex] = React.useState(0);
  const [hoveredViewMode, setHoveredViewMode] = React.useState(null);
  const [analysisNavFlash, setAnalysisNavFlash] = React.useState(null);
  const analysisNavFlashTimerRef = React.useRef(null);
  const analysisNavFlashRafRef = React.useRef(null);

  const MIN_COMPARED = 8;
  const presidentialResultsAll = comparisonResults?.presidential_results || [];
  const rankingLabel = t("results.ranking") === "results.ranking" ? "Ranking" : t("results.ranking");
  const analysisLabel = t("results.analysis") === "results.analysis" ? "Analisis" : t("results.analysis");
  const comparisonLabel = t("results.comparison") === "results.comparison" ? "Comparacion" : t("results.comparison");
  const compactModeLabel = t("results.compactMode") === "results.compactMode"
    ? "Nivel de coincidencia"
    : t("results.compactMode");
  const coincidenceTitleLabel = t("results.coincidenceLevelTitle") === "results.coincidenceLevelTitle"
    ? "Nivel de coincidencia"
    : t("results.coincidenceLevelTitle");
  const detailedModeLabel = t("results.detailedMode") === "results.detailedMode"
    ? "Comparacion detallada"
    : t("results.detailedMode");

  const getRows = () => {
    if (selectedResultType === "party") {
      const combined = [...partyComplete, ...partyIncomplete];
      const topCount = partyComplete.length;
      return combined.map((row, idx) => ({
        key: row.party ?? row.name ?? `party-${idx}`,
        id: row.party ?? row.name,
        name: row.name,
        displayName: row.name,
        score: row.similarity_score,
        incomplete: idx >= topCount,
        type: "party",
        payload: row,
      }));
    }

    return presidentialResultsAll.map((row, idx) => ({
      key: row.name ?? `pres-${idx}`,
      id: row.name,
      name: row.name,
      displayName: row.displayName || row.name,
      score: row.similarity_score,
      incomplete: Number(row.compared_questions || 0) < MIN_COMPARED,
      type: "presidential",
      payload: row,
    }));
  };

  const rows = getRows();

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

  const getFillPercent = (score) => {
    const numeric = Number(score);
    return Number.isFinite(numeric) ? Math.max(0, Math.min(100, numeric)) : 0;
  };

  const getRowFillStyle = (fillPercent) => {
    const pct = fillPercent;
    return {
      background: `linear-gradient(to right, color-mix(in srgb, var(--accentLight) 95%, transparent) ${pct}%, color-mix(in srgb, var(--accent) 8%, var(--buttonColor)) ${pct}%)`,
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

        {!isMobile && (
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
        )}

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
                    <SlotAvatar row={row} config={config} />
                    <h3 className="results-slot-item__name">{row.displayName}</h3>
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
            <div className="results-analysis-card__header is-compact">
              <span>{comparisonLabel}</span>
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
          {(!isMobile || mobileResultsTab === "list") && (
          <section className="results-list-card">
            <div className="results-list-card__header">
              <span>
                {selectedResultType === "party" ? t("results.parties") : t("results.candidates")}
              </span>
              <span>{t("results.similarity")}</span>
            </div>

            <ul className="results-list">
              {rows.map((row) => {
                const fillPercent = getFillPercent(row.score);
                const selected = isSelectedRow(row);
                const dimmed = !!selectedEntity && !selected;
                return (
                <li key={row.key}>
                  <button
                    className={`results-row ${selected ? "is-selected" : ""} ${dimmed ? "is-dimmed" : ""} ${row.incomplete ? "is-incomplete" : ""}`}
                    onClick={() => handleSelectRow(row)}
                    style={getRowFillStyle(fillPercent)}
                  >
                    <span className="results-row__identity">
                      <RowAvatar row={row} config={config} fillPercent={fillPercent} />
                      <span className="results-row__name">
                        <RowFillAwareText text={row.displayName} fillPercent={fillPercent} />
                      </span>
                    </span>
                    <span className="results-row__score">
                      <RowFillAwareText text={`${row.score}%`} fillPercent={fillPercent} />
                    </span>
                  </button>
                </li>
              )})}
            </ul>
          </section>
          )}

          {(!isMobile || mobileResultsTab === "analysis") && (
          <div className="results-analysis-panel">
            <section className="results-analysis-card">
              <div className="results-analysis-card__header">
                <span>{comparisonLabel}</span>
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
          </div>
          )}
        </div>
      )}

      <button
        className="back-to-survey-button"
        onClick={onBackToSurvey}
        onMouseEnter={(e) => (e.target.style.backgroundColor = "var(--buttonNextHover)")}
        onMouseLeave={(e) => (e.target.style.backgroundColor = "var(--buttonNext)")}
        style={{ backgroundColor: "var(--buttonNext)", transition: "background-color 0.2s ease-in-out" }}
      >
        {t("nav.backToSurvey")}
      </button>
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

function SlotAvatar({ row, config }) {
  const exts = ["png", "jpg", "jpeg"];
  const [srcIndex, setSrcIndex] = React.useState(0);
  const [failed, setFailed] = React.useState(false);
  const [logoLoaded, setLogoLoaded] = React.useState(false);

  const extractPartyFromCandidateName = (name) => {
    if (!name || typeof name !== "string") return null;
    const m = name.match(/\(([^)]+)\)\s*$/);
    if (m && m[1]) return m[1].trim();
    const m2 = name.match(/\[([^\]]+)\]\s*$/);
    if (m2 && m2[1]) return m2[1].trim();
    return null;
  };

  const getPartyName = () => {
    if (!row) return null;
    if (row.type === "party") return row.name || row.id || row.payload?.party || null;
    return row.payload?.party || extractPartyFromCandidateName(row.displayName || row.name || row.payload?.name || "");
  };

  const partyName = getPartyName();

  React.useEffect(() => {
    setSrcIndex(0);
    setFailed(false);
    setLogoLoaded(false);
  }, [partyName]);

  React.useEffect(() => {
    setLogoLoaded(false);
  }, [srcIndex]);

  const getAppBase = () => {
    const baseUrl = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.BASE_URL)
      ? import.meta.env.BASE_URL
      : "";
    return String(baseUrl || "").replace(/\/$/, "");
  };

  const buildLogoUrl = (name, ext) => {
    if (!name) return "";
    const base = getAppBase();
    const prefix = base ? `${base}/` : "";
    const assetsPath = config?.assetsPath || "";
    return `${prefix}${assetsPath}party_logos/${encodeURIComponent(name)}.${ext}`;
  };

  const logoSrc = !failed && partyName ? buildLogoUrl(partyName, exts[srcIndex]) : "";

  const handleImgError = () => {
    if (srcIndex < exts.length - 1) {
      setSrcIndex((s) => s + 1);
    } else {
      setFailed(true);
    }
  };

  return (
    <div className={`results-slot-item__avatar ${logoLoaded ? "has-logo" : ""}`} aria-hidden="true">
      <span className="results-slot-item__avatar-fallback">
        {(row?.displayName || "?").charAt(0)}
      </span>
      {logoSrc && (
        <img
          className={`results-slot-item__avatar-img ${logoLoaded ? "is-visible" : ""}`}
          src={logoSrc}
          alt=""
          onLoad={() => setLogoLoaded(true)}
          onError={handleImgError}
          draggable={false}
        />
      )}
    </div>
  );
}

function RowAvatar({ row, config, fillPercent }) {
  const exts = ["png", "jpg", "jpeg"];
  const [srcIndex, setSrcIndex] = React.useState(0);
  const [failed, setFailed] = React.useState(false);
  const [logoLoaded, setLogoLoaded] = React.useState(false);

  const extractPartyFromCandidateName = (name) => {
    if (!name || typeof name !== "string") return null;
    const m = name.match(/\(([^)]+)\)\s*$/);
    if (m && m[1]) return m[1].trim();
    const m2 = name.match(/\[([^\]]+)\]\s*$/);
    if (m2 && m2[1]) return m2[1].trim();
    return null;
  };

  const getPartyName = () => {
    if (!row) return null;
    if (row.type === "party") return row.name || row.id || row.payload?.party || null;
    return row.payload?.party || extractPartyFromCandidateName(row.displayName || row.name || row.payload?.name || "");
  };

  const partyName = getPartyName();

  React.useEffect(() => {
    setSrcIndex(0);
    setFailed(false);
    setLogoLoaded(false);
  }, [partyName]);

  React.useEffect(() => {
    setLogoLoaded(false);
  }, [srcIndex]);

  const getAppBase = () => {
    const baseUrl = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.BASE_URL)
      ? import.meta.env.BASE_URL
      : "";
    return String(baseUrl || "").replace(/\/$/, "");
  };

  const buildLogoUrl = (name, ext) => {
    if (!name) return "";
    const base = getAppBase();
    const prefix = base ? `${base}/` : "";
    const assetsPath = config?.assetsPath || "";
    return `${prefix}${assetsPath}party_logos/${encodeURIComponent(name)}.${ext}`;
  };

  const logoSrc = !failed && partyName ? buildLogoUrl(partyName, exts[srcIndex]) : "";

  const handleImgError = () => {
    if (srcIndex < exts.length - 1) {
      setSrcIndex((s) => s + 1);
    } else {
      setFailed(true);
    }
  };

  return (
    <span className={`results-row__avatar ${logoLoaded ? "has-logo" : ""}`} aria-hidden="true">
      <span className="results-row__avatar-fallback">
        <RowFillAwareText text={(row?.displayName || "?").charAt(0)} fillPercent={fillPercent} />
      </span>
      {logoSrc && (
        <img
          className={`results-row__avatar-img ${logoLoaded ? "is-visible" : ""}`}
          src={logoSrc}
          alt=""
          onLoad={() => setLogoLoaded(true)}
          onError={handleImgError}
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
          <span className={`results-analysis-heading__count ${chipClass}`}>
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

              {selectedTopic.source && (
                <p className="results-topic-modal__source">
                  {t("common.seeSource")}: {selectedTopic.source}
                </p>
              )}

              <button
                className="results-topic-modal__close"
                onClick={() => setSelectedTopic(null)}
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
