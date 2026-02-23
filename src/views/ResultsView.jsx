import React from "react";
import { useTranslate } from "@tolgee/react";
import EntityDetails from "../components/EntityDetails";
import { BrandLogo } from "../components/BrandImage";

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

  const MIN_COMPARED = 8;
  const presidentialResultsAll = comparisonResults?.presidential_results || [];
  const rankingLabel = t("results.ranking") === "results.ranking" ? "Ranking" : t("results.ranking");
  const analysisLabel = t("results.analysis") === "results.analysis" ? "Analisis" : t("results.analysis");
  const comparisonLabel = t("results.comparison") === "results.comparison" ? "Comparacion" : t("results.comparison");
  const compactModeLabel = t("results.compactMode") === "results.compactMode"
    ? "Nivel de coincidencia"
    : t("results.compactMode");
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

  return (
    <div className="results-view-shell">
      <div className="results-view-header">
        <BrandLogo branding={branding} />
        <h2>{t("results.title")}</h2>
      </div>

      <div className="results-toolbar">
        <div className="results-view-mode-toggle">
          <button
            className={`results-view-mode-toggle__btn ${resultsViewMode === "coincidence" ? "is-active" : ""}`}
            onClick={() => setResultsViewMode("coincidence")}
          >
            {compactModeLabel}
          </button>
          <button
            className={`results-view-mode-toggle__btn ${resultsViewMode === "comparison" ? "is-active" : ""}`}
            onClick={() => setResultsViewMode("comparison")}
          >
            {detailedModeLabel}
          </button>
        </div>

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
            <div className="results-slot-card__header">{compactModeLabel}</div>
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
                    <div className="results-slot-item__avatar">
                      {(row.displayName || "?").charAt(0)}
                    </div>
                    <h3 className="results-slot-item__name">{row.displayName}</h3>
                    <div className="results-slot-item__score">{row.score}%</div>
                  </div>
                ))}
              </div>
              <div className="results-slot-fade results-slot-fade--left" aria-hidden="true" />
              <div className="results-slot-fade results-slot-fade--right" aria-hidden="true" />
            </div>
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

          <section className="results-analysis-card">
            <div className="results-analysis-card__header">
              <span>{comparisonLabel}</span>
            </div>
            <EntityDetails
              selectedEntity={selectedEntity}
              entityDetails={entityDetails}
              questionDetails={questionDetails}
              questions={questions}
              answers={answers}
              config={config}
              isMobile={isMobile}
              inline={isMobile}
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
              {rows.map((row) => (
                <li key={row.key}>
                  <button
                    className={`results-row ${isSelectedRow(row) ? "is-selected" : ""} ${row.incomplete ? "is-incomplete" : ""}`}
                    onClick={() => handleSelectRow(row)}
                  >
                    <span className="results-row__identity">
                      <span className="results-row__avatar" aria-hidden="true">
                        {(row.displayName || "?").charAt(0)}
                      </span>
                      <span className="results-row__name">{row.displayName}</span>
                    </span>
                    <span className="results-row__score">{row.score}%</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
          )}

          {(!isMobile || mobileResultsTab === "analysis") && (
          <section className="results-analysis-card">
            <div className="results-analysis-card__header">
              <span>{comparisonLabel}</span>
            </div>
            <EntityDetails
              selectedEntity={selectedEntity}
              entityDetails={entityDetails}
              questionDetails={questionDetails}
              questions={questions}
              answers={answers}
              config={config}
              isMobile={isMobile}
              inline={isMobile}
            />
          </section>
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
