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
  mobileOpen,
  partyComplete,
  partyIncomplete,
  presComplete,
  presIncomplete,
  hoveredOption,
  branding,
  onResultTypeChange,
  onEntityClick,
  onMobileToggle,
  onBackToSurvey,
  onHover,
}) {
  const { t } = useTranslate();

  const MIN_COMPARED = 8;
  const presidentialResultsAll = comparisonResults?.presidential_results || [];

  return (
    <>
      <BrandLogo branding={branding} />
      <h2>{t('results.title')}</h2>

      {resultTypes.length > 1 && (
        <div className="results-toggle-container">
          {resultTypes.map(rt => (
            <button
              key={rt}
              className="toggle-option-button"
              onClick={() => onResultTypeChange(rt)}
              onMouseEnter={() => onHover(rt)}
              onMouseLeave={() => onHover(null)}
              style={{
                backgroundColor:
                  selectedResultType === rt || hoveredOption === rt
                    ? "var(--buttonNextHover)"
                    : "var(--buttonNext)"
              }}
            >
              {rt === "party" && t('results.parties')}
              {rt === "presidentialCandidates" && t('results.candidates')}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", width: "80%" }}>
        <div style={{ flex: 1 }}>
          {comparisonResults && selectedResultType === "party" && (
            <>
              <div className="candidate-party-similarity-header">
                <span>{t('results.parties')}</span>
                <span>{t('results.similarity')}</span>
              </div>
              <ul className="parties-and-candidates-list" style={{ textAlign: "left" }}>
                {(() => {
                  const combined = [...partyComplete, ...partyIncomplete];
                  const topCount = partyComplete.length;

                  return combined.map((partyResult, i) => {
                    const isSelected =
                      selectedEntity &&
                      (selectedEntity.name === partyResult.name || selectedEntity.party === partyResult.party);

                    return (
                      <React.Fragment key={partyResult.party ?? partyResult.name ?? `party-${i}`}>
                        <li
                          className={`candidate-party-similarity-item ${i >= topCount ? "incomplete" : ""} ${mobileOpen === partyResult.name ? "open" : ""}`}
                          onClick={() =>
                            isMobile
                              ? onMobileToggle(partyResult, "party")
                              : onEntityClick(partyResult, "party")
                          }
                          style={{
                            "--sim": `${partyResult.similarity_score}%`,
                            background: isSelected
                              ? `linear-gradient(90deg, lightgray ${partyResult.similarity_score}%, transparent ${partyResult.similarity_score}%)`
                              : undefined
                          }}
                        >
                          <span>{partyResult.name}</span>
                          <span className="result-score">{partyResult.similarity_score}%</span>
                        </li>

                        {isMobile && mobileOpen === partyResult.name && (
                          <EntityDetails
                            selectedEntity={selectedEntity}
                            entityDetails={entityDetails}
                            questionDetails={questionDetails}
                            questions={questions}
                            answers={answers}
                            config={config}
                            isMobile={isMobile}
                            inline={true}
                          />
                        )}
                      </React.Fragment>
                    );
                  });
                })()}
              </ul>
            </>
          )}

          {comparisonResults && selectedResultType === "presidentialCandidates" && (
            <>
              <div className="candidate-party-similarity-header">
                <span>{t('results.candidates')}</span>
                <span>{t('results.similarity')}</span>
              </div>
              <ul className="parties-and-candidates-list">
                {presidentialResultsAll.map((result, idx) => {
                  const isSelected = selectedEntity && selectedEntity.name === result.name;
                  const isIncomplete = Number(result.compared_questions || 0) < MIN_COMPARED;

                  return (
                    <React.Fragment key={result.name ?? `pres-${idx}`}>
                      <li
                        className={`candidate-party-similarity-item ${isIncomplete ? "incomplete" : ""} ${mobileOpen === result.name ? "open" : ""}`}
                        onClick={() =>
                          isMobile
                            ? onMobileToggle(result, "presidential")
                            : onEntityClick(result, "presidential")
                        }
                        style={{
                          "--sim": `${result.similarity_score}%`,
                          background: isSelected
                            ? `linear-gradient(90deg, lightgray ${result.similarity_score}%, transparent ${result.similarity_score}%)`
                            : undefined
                        }}
                      >
                        <span>{result.displayName}</span>
                        <span className="result-score">{result.similarity_score}%</span>
                      </li>

                      {isMobile && mobileOpen === result.name && (
                        <EntityDetails
                          selectedEntity={selectedEntity}
                          entityDetails={entityDetails}
                          questionDetails={questionDetails}
                          questions={questions}
                          answers={answers}
                          config={config}
                          isMobile={isMobile}
                          inline={true}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        <EntityDetails
          selectedEntity={selectedEntity}
          entityDetails={entityDetails}
          questionDetails={questionDetails}
          questions={questions}
          answers={answers}
          config={config}
          isMobile={isMobile}
        />
      </div>

      <div>
        <button
          className="back-to-survey-button"
          onClick={onBackToSurvey}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "var(--buttonNextHover)")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "var(--buttonNext)")}
          style={{ backgroundColor: "var(--buttonNext)", transition: "background-color 0.2s ease-in-out" }}
        >
          {t('nav.backToSurvey')}
        </button>
      </div>
    </>
  );
}