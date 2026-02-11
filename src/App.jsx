import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { useTranslate } from "@tolgee/react";
import Methodology from "./components/methodology.jsx";
import Contact from "./components/contact.jsx";
import Menu from "./components/menu";
import AnalyticsTracker from "./components/analyticsTracker";
import DemographicsForm from "./components/demographicsForm";
import TurnstileOverlay from "./components/TurnstileOverlay";
import PrivacyNotice from "./components/PrivacyNotice";
import PrivacyPolicy from "./components/privacyPolicy";
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

export default function App() {
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
    showTopicImportance,
    minAnswersGate,
    showDemographics,
    showTurnstileOverlay,
    turnstileVerified,
    demographics,
    showGenericIntro,
    showElectionIntro,

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
  } = useQuizContext();

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
                config={config}
                isMobile={isMobile}
                mobileOpen={mobileOpen}
                partyComplete={partyComplete}
                partyIncomplete={partyIncomplete}
                presComplete={presComplete}
                presIncomplete={presIncomplete}
                hoveredOption={state.hoveredOption}
                branding={branding}
                onResultTypeChange={setSelectedResultType}
                onEntityClick={handleEntityClick}
                onMobileToggle={handleMobileToggle}
                onBackToSurvey={handleBackToSurvey}
                onHover={(option) => dispatch({ type: "SET_HOVERED_OPTION", payload: option })}
              />
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <Router>
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
    </Router>
  );
}
