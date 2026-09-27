import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HashRouter as Router, Routes, Route, useSearchParams } from "react-router-dom";
import { useTranslate } from "@tolgee/react";
import { isValidMnemonic } from "./utils/mnemonicCodec";
import Methodology from "./components/Methodology.jsx";
import Contact from "./components/Contact.jsx";
import Menu from "./components/Menu";
import HamburgerMenu from "./components/HamburgerMenu";
import DemographicsForm from "./components/DemographicsForm";
import TurnstileOverlay from "./components/TurnstileOverlay";
import PrivacyNotice from "./components/PrivacyNotice";
import PrivacyPolicy from "./components/PrivacyPolicy";
import CookieSettings from "./components/CookieSettings";
import LanguageSwitcher from "./components/LanguageSwitcher.jsx";
import QuizTopLine from "./components/QuizTopLine";
import { BrandLogoAlt } from "./components/BrandImage";
import GenericIntroView from "./views/GenericIntroView";
import ElectionSelector from "./views/ElectionSelector";
import ElectionIntroView from "./views/ElectionIntroView";
import RegionSelectorView from "./views/RegionSelectorView";
import QuizView from "./views/QuizView";
import TopicImportanceView from "./views/TopicImportanceView";
import ResultsView from "./views/ResultsView";
import ErrorBoundary from "./components/ErrorBoundary";
import { useQuizContext } from "./contexts/useQuizContext";
import { useRegionalData } from "./hooks/useRegionalData";
import { BackgroundLayer } from "./backgrounds";
import { WidgetLayout } from "./widgets";
import "./App.css";

// Inner component that uses router hooks (must be inside Router)
function AppContent() {
  const { t } = useTranslate();
  const {
    // Core state
    election,
    state,
    dispatch,
    config,
    resultTypes,

    // UI state
    showMenu,
    setShowMenu,
    isMobile,
    selectedResultType,
    setSelectedResultType,
    mobileOpen,
    canFinishQuizNow,
    hasReachedLastQuestion,
    showTopicImportance,
    minAnswersGate,
    showDemographics,
    showTurnstileOverlay,
    turnstileVerified,
    demographics,
    showGenericIntro,
    showElectionIntro,
    restoredFromMnemonic,
    setRestoredFromMnemonic,

    // Version tracking
    quizDataVersion,
    restoredVersion,
    versionMismatchType,
    setVersionMismatchType,

    // Computed values
    displayIndex,
    totalQuestions,
    uniqueTopics,
    partyComplete,
    partyIncomplete,
    presComplete,
    presIncomplete,
    branding,

    // Handlers
    handleSkip,
    handleGoBack,
    handleAnswerClick,
    handleMobileToggle,
    handleEndQuiz,
    closeMinAnswersGate,
    goToNextUnanswered,
    handleTopicImportanceContinue,
    handleToggleTopicImportance,
    handleEntityClick,
    handleBackToSurvey,
    handleReset,
    handleTurnstileSuccess,
    submitDemographicsAndComputeResults,
    handleGenericIntroContinue,
    handleSelectElection,
    handleStartQuiz,
    handleSelectRegion,
    restoreFromMnemonic,

    // Regional elections
    regionId,

    // Round selection
    rounds,
    selectedRound,
    handleRoundChange,
  } = useQuizContext();

  // Regional elections: name of the selected region (for the badge and demographics prefill)
  const { regions: regionList } = useRegionalData(config?.regional ? config.regionalVotesUrl : null);
  const regionName = regionList.find(r => r.id === regionId)?.name ?? null;

  // Restart confirmation (both the top-left button and the hamburger menu item open this)
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const confirmRestart = () => {
    setShowRestartConfirm(false);
    handleReset();
  };

  // Handle URL mnemonic restore
  const hasAttemptedRestore = useRef(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    // Only attempt restore once and when questions are loaded
    // (regional restores load their own region's questions, so they don't wait)
    if (hasAttemptedRestore.current || (!config?.regional && state.questions.length === 0)) return;

    const mnemonicParam = searchParams.get("r");
    if (!mnemonicParam) return;

    const wordList = config?.mnemonicWordList;
    if (!isValidMnemonic(mnemonicParam, wordList)) {
      console.warn("Invalid mnemonic in URL:", mnemonicParam);
      // Clear invalid param
      searchParams.delete("r");
      setSearchParams(searchParams, { replace: true });
      return;
    }

    hasAttemptedRestore.current = true;

    restoreFromMnemonic(mnemonicParam).then((success) => {
      if (!success) {
        // Clear param on failure
        searchParams.delete("r");
        setSearchParams(searchParams, { replace: true });
      }
    });
  }, [searchParams, setSearchParams, state.questions.length, restoreFromMnemonic, config?.mnemonicWordList, config?.regional]);

  // "Top line" chrome (Restart top-left, language pill + region chip above the question):
  // only once the quiz flow is running, i.e. after the intro and, for regional elections, the region picker
  const topLine = !!config?.quizTopLine;
  const inQuizFlow = !!election && !showGenericIntro && !showElectionIntro && !(config?.regional && !regionId);
  // Same brand block QuizView renders above the question card, so it reads as one consistent header
  // across the quiz, topic importance, demographics and results screens
  const brandSubtitle = config?.shortLabel ? t(config.shortLabel, config.defaultShortLabel) : null;

  // Determine which view to show
  const renderMainContent = () => {
    // Step 1: Generic intro (neutral branding, before election selection)
    if (showGenericIntro) {
      return (
        <GenericIntroView onContinue={handleGenericIntroContinue} />
      );
    }

    // Step 2: Election selector (if no election selected yet)
    if (!election) {
      return (
        <ElectionSelector
          onSelectElection={handleSelectElection}
          branding={branding}
        />
      );
    }

    // Step 3: Election intro (election-specific branding, before quiz)
    if (showElectionIntro) {
      return (
        <ElectionIntroView
          branding={branding}
          electionId={election}
          electionLabel={config?.label}
          onStart={handleStartQuiz}
          onRestore={restoreFromMnemonic}
          mnemonicWordList={config?.mnemonicWordList}
          rounds={rounds}
          selectedRound={selectedRound}
          onRoundChange={handleRoundChange}
          fallbackIntro={config?.intro}
        />
      );
    }

    // Step 3b: Region picker (regional elections only, before the quiz starts)
    if (config?.regional && !regionId) {
      return (
        <RegionSelectorView
          branding={branding}
          regionalVotesUrl={config.regionalVotesUrl}
          onSelectRegion={handleSelectRegion}
        />
      );
    }

    // Regional questions are per region: wait until the selected region's set is loaded
    const questionsReady = state.questions.length > 0
      && (!config?.regional || state.loadedRegionId === regionId);

    // Step 4+: Quiz flow (questions, demographics, results)
    return (
      <div className="election-content-area">
        {topLine && !(questionsReady && state.currentQuestionIndex < state.questions.length) && (
          <>
            <div className="quiz-brand">
              <BrandLogoAlt branding={branding} />
              <span className="quiz-brand__text">
                {branding?.title && <span className="quiz-brand__title">{branding.title}</span>}
                {brandSubtitle && <span className="quiz-brand__subtitle">{brandSubtitle}</span>}
              </span>
            </div>
            <QuizTopLine regionName={config?.regional ? regionName : null} />
          </>
        )}
        {!topLine && config?.regional && regionName && (
          <div className="region-badge" title={regionName}>
            <span className="region-badge__dot" aria-hidden="true" />
            {regionName}
          </div>
        )}
        {!questionsReady ? (
          <h2>{t('common.loading')}</h2>
        ) : state.currentQuestionIndex < state.questions.length ? (
          <QuizView
            question={state.questions[state.currentQuestionIndex]}
            displayIndex={displayIndex}
            totalQuestions={totalQuestions}
            selectedAnswer={state.answers[state.currentQuestionIndex]}
            hoveredOption={state.hoveredOption}
            isFirstQuestion={state.currentQuestionIndex === 0}
            isLastQuestion={state.currentQuestionIndex === state.questions.length - 1}
            hasSeenQuestion={state.answers[state.currentQuestionIndex] != null}
            branding={branding}
            onAnswer={handleAnswerClick}
            onSkip={handleSkip}
            onGoBack={handleGoBack}
            onHover={(option) => dispatch({ type: "SET_HOVERED_OPTION", payload: option })}
            onEndQuiz={handleEndQuiz}
            canFinishQuizNow={canFinishQuizNow}
            hasReachedLastQuestion={hasReachedLastQuestion}
            minAnswersGate={minAnswersGate}
            onCloseMinAnswersGate={closeMinAnswersGate}
            onGoToNextUnanswered={goToNextUnanswered}
            inlineProgress={!!config?.inlineProgress}
            topics={uniqueTopics}
            showTopicHeader={!!config?.topicHeader}
            showTopLine={topLine}
            regionName={config?.regional ? regionName : null}
            brandSubtitle={brandSubtitle}
          />
        ) : showTopicImportance ? (
          <TopicImportanceView
            topics={uniqueTopics}
            topicImportance={state.topicImportance}
            questions={state.questions}
            answers={state.answers}
            branding={branding}
            onToggle={handleToggleTopicImportance}
            onContinue={handleTopicImportanceContinue}
            showTopLine={topLine}
          />
        ) : (
          <>
            {(showDemographics && !turnstileVerified) ? (
              <DemographicsForm
                onConfirm={(demo) => submitDemographicsAndComputeResults(demo)}
                disabled={showTurnstileOverlay}
                branding={branding}
                regions={config?.regions || []}
                showTopLine={topLine}
                initialValues={demographics ? {
                  gender: demographics.gender,
                  age: demographics.age?.toString() || "",
                  education: demographics.education,
                  region: demographics.region,
                  city: demographics.city,
                  analyticsConsent: demographics.analyticsConsent
                } : regionName ? { region: regionName } : null}
              />
            ) : (
              <ErrorBoundary
                fallback={({ retry }) => (
                  <div className="error-boundary-fallback" role="alert">
                    <h2>{t("errors.boundary.title", "Algo salió mal")}</h2>
                    <p>{t("errors.boundary.resultsDescription", "No pudimos mostrar tus resultados. Tus respuestas están guardadas: puedes reintentar o volver al cuestionario.")}</p>
                    <div>
                      <button onClick={retry}>{t("errors.boundary.retry", "Reintentar")}</button>
                      <button onClick={handleBackToSurvey}>{t("errors.boundary.backToSurvey", "Volver al cuestionario")}</button>
                    </div>
                  </div>
                )}
              >
              <ResultsView
                comparisonResults={state.comparisonResults}
                selectedResultType={selectedResultType}
                resultTypes={resultTypes}
                selectedEntity={state.selectedEntity}
                entityDetails={state.entityDetails}
                questionDetails={state.questionDetails}
                questions={state.questions}
                answers={state.answers}
                weights={state.weights}
                config={config}
                selectedRound={selectedRound}
                isMobile={isMobile}
                mobileOpen={mobileOpen}
                partyComplete={partyComplete}
                partyIncomplete={partyIncomplete}
                presComplete={presComplete}
                presIncomplete={presIncomplete}
                hoveredOption={state.hoveredOption}
                branding={branding}
                restoredFromMnemonic={restoredFromMnemonic}
                quizDataVersion={quizDataVersion}
                regionId={regionId}
                restoredVersion={restoredVersion}
                versionMismatchType={versionMismatchType}
                onResultTypeChange={setSelectedResultType}
                onEntityClick={handleEntityClick}
                onMobileToggle={handleMobileToggle}
                onBackToSurvey={handleBackToSurvey}
                onHover={(option) => dispatch({ type: "SET_HOVERED_OPTION", payload: option })}
                onDismissRestoredModal={() => {
                  setRestoredFromMnemonic(false);
                  setVersionMismatchType(null);
                }}
                onForceReset={handleReset}
              />
              </ErrorBoundary>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <>
      <BackgroundLayer />
      <TurnstileOverlay
        show={showTurnstileOverlay}
        onSuccess={handleTurnstileSuccess}
        branding={branding}
      />
      <>
        <input
          type="text"
          id="website-url"
          name="website"
          style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
          tabIndex="-1"
          autoComplete="off"
          aria-hidden="true"
        />
        {topLine && inQuizFlow && (
          <button type="button" onClick={() => setShowRestartConfirm(true)} className="reset-button">{t('common.restart')}</button>
        )}
        <HamburgerMenu
          showRestart={!topLine && !!election && !showGenericIntro && !showElectionIntro}
          onRestart={() => setShowRestartConfirm(true)}
          onOpenMenu={() => setShowMenu(!showMenu)}
          menuOpen={showMenu}
        />

        {showRestartConfirm && createPortal(
          <div className="quiz-min-answers-overlay" onClick={() => setShowRestartConfirm(false)}>
            <div className="quiz-min-answers-dialog" onClick={(e) => e.stopPropagation()}>
              <h3>{t("common.restartConfirmTitle")}</h3>
              <p>
                <span className="quiz-min-answers-line">{t("common.restartConfirmBody")}</span>
              </p>
              <div className="quiz-min-answers-actions">
                <button
                  className="quiz-min-answers-btn quiz-min-answers-btn--primary"
                  onClick={confirmRestart}
                >
                  {t("common.restartConfirmConfirm")}
                </button>
                <button
                  className="quiz-min-answers-btn quiz-min-answers-btn--secondary"
                  onClick={() => setShowRestartConfirm(false)}
                >
                  {t("common.restartConfirmCancel")}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
        <Menu open={showMenu} onClose={() => setShowMenu(false)} />

        <Routes>
          <Route
            path="/"
            element={
              <>
                {/* Outside WidgetLayout: its transform would break position: fixed */}
                {!(topLine && inQuizFlow) && <LanguageSwitcher />}
                <WidgetLayout>
                  {renderMainContent()}
                </WidgetLayout>
              </>
            }
          />
          <Route path="/metodologia" element={<div className="static-page-shell"><Methodology /></div>} />
          <Route path="/contacto" element={<div className="static-page-shell"><Contact /></div>} />
          <Route path="/politica-privacidad" element={<div className="static-page-shell"><PrivacyPolicy /></div>} />
          <Route path="/configuracion-privacidad" element={<div className="static-page-shell"><CookieSettings /></div>} />
        </Routes>
        {showElectionIntro && <PrivacyNotice />}
      </>
    </>
  );
}

// Main App component wraps everything with Router
export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
