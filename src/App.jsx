import React, { useEffect, useRef } from "react";
import { HashRouter as Router, Routes, Route, useSearchParams } from "react-router-dom";
import { useTranslate } from "@tolgee/react";
import { isValidMnemonic } from "./utils/mnemonicCodec";
import Methodology from "./components/Methodology.jsx";
import Contact from "./components/Contact.jsx";
import Menu from "./components/Menu";
import AnalyticsTracker from "./components/AnalyticsTracker";
import DemographicsForm from "./components/DemographicsForm";
import TurnstileOverlay from "./components/TurnstileOverlay";
import PrivacyNotice from "./components/PrivacyNotice";
import PrivacyPolicy from "./components/PrivacyPolicy";
import CookieSettings from "./components/CookieSettings";
import LanguageSwitcher from "./components/LanguageSwitcher.jsx";
import GenericIntroView from "./views/GenericIntroView";
import ElectionSelector from "./views/ElectionSelector";
import ElectionIntroView from "./views/ElectionIntroView";
import QuizView from "./views/QuizView";
import TopicImportanceView from "./views/TopicImportanceView";
import ResultsView from "./views/ResultsView";
import { useQuizContext } from "./contexts/useQuizContext";
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
    restoreFromMnemonic,

    // Round selection
    rounds,
    selectedRound,
    handleRoundChange,
  } = useQuizContext();

  // Handle URL mnemonic restore
  const hasAttemptedRestore = useRef(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    // Only attempt restore once and when questions are loaded
    if (hasAttemptedRestore.current || state.questions.length === 0) return;

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
  }, [searchParams, setSearchParams, state.questions.length, restoreFromMnemonic, config?.mnemonicWordList]);

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
        />
      );
    }

    // Step 4+: Quiz flow (questions, demographics, results)
    return (
      <div className="election-content-area">
        {state.questions.length === 0 ? (
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
          />
        ) : (
          <>
            {(showDemographics && !turnstileVerified) ? (
              <DemographicsForm
                onConfirm={(demo) => submitDemographicsAndComputeResults(demo)}
                disabled={showTurnstileOverlay}
                branding={branding}
                regions={config?.regions || []}
                initialValues={demographics ? {
                  gender: demographics.gender,
                  age: demographics.age?.toString() || "",
                  education: demographics.education,
                  region: demographics.region,
                  city: demographics.city,
                  analyticsConsent: demographics.analyticsConsent
                } : null}
              />
            ) : (
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
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <>
      <BackgroundLayer />
      <AnalyticsTracker />
      <TurnstileOverlay
        show={showTurnstileOverlay}
        onSuccess={handleTurnstileSuccess}
        branding={branding}
      />
      <>
        {election && !showGenericIntro && !showElectionIntro && (
            <button onClick={handleReset} className="reset-button">{t('common.restart')}</button>
        )}
        <input
          type="text"
          id="website-url"
          name="website"
          style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
          tabIndex="-1"
          autoComplete="off"
          aria-hidden="true"
        />
        <button className="menu-button" onClick={() => setShowMenu(!showMenu)}>{t('common.menu')}</button>
        <Menu open={showMenu} onClose={() => setShowMenu(false)} />

        <Routes>
          <Route
            path="/"
            element={
              <WidgetLayout>
                <LanguageSwitcher />
                {renderMainContent()}
              </WidgetLayout>
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
