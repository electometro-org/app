// useQuiz.js - Enhanced quiz state management hook
import { useReducer, useMemo, useEffect } from "react";
import { electionConfigs, enabledElections } from "../elections";
import { computeUniqueIndices, findNextUniqueIndex, findPrevUniqueIndex } from "../services/quizService";

const initialState = {
  questions: [],
  questionDetails: [],
  currentQuestionIndex: 0,
  answers: [],
  weights: [],
  seenQuestions: [], // Track which questions have been viewed
  topicImportance: {}, // { [topic_key]: boolean } - true = very important
  comparisonResults: null,
  selectedEntity: null,
  entityDetails: {},
  hoveredOption: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_QUESTIONS":
      return {
        ...state,
        questions: action.payload,
        questionDetails: action.payload,
        answers: Array(action.payload.length).fill(null),
        weights: Array(action.payload.length).fill(2),
      };
    case "SET_CURRENT_QUESTION_INDEX":
      return { ...state, currentQuestionIndex: action.payload };
    case "ANSWER":
      { const newAnswers = [...state.answers];
      newAnswers[action.index] = action.answer;
      return { ...state, answers: newAnswers }; }
    case "SET_WEIGHTS":
      { const newWeights = [...state.weights];
      newWeights[action.index] = action.weight;
      return { ...state, weights: newWeights }; }
    case "SET_COMPARISON_RESULTS":
      return { ...state, comparisonResults: action.payload };
    case "SET_SELECTED_ENTITY":
      return { ...state, selectedEntity: action.payload };
    case "SET_ENTITY_DETAILS":
      return { ...state, entityDetails: action.payload };
    case "SET_HOVERED_OPTION":
      return { ...state, hoveredOption: action.payload };
    case "MARK_QUESTION_SEEN":
      // Only add if not already in the array
      if (state.seenQuestions.includes(action.payload)) {
        return state;
      }
      return { ...state, seenQuestions: [...state.seenQuestions, action.payload] };
    case "TOGGLE_TOPIC_IMPORTANCE":
      return {
        ...state,
        topicImportance: {
          ...state.topicImportance,
          [action.topicKey]: !state.topicImportance[action.topicKey],
        },
      };
    case "RESTORE_STATE":
      // Restore answers and weights from saved state (e.g., from mnemonic)
      // Pads or truncates to match current questions length
      {
        const { answers: restoredAnswers, weights: restoredWeights } = action.payload;
        const qLen = state.questions.length;
        const answers = Array(qLen).fill(null);
        const weights = Array(qLen).fill(2);
        for (let i = 0; i < qLen && i < restoredAnswers.length; i++) {
          answers[i] = restoredAnswers[i];
          weights[i] = restoredWeights[i] ?? 2;
        }
        // Derive topicImportance from weights (3 = important)
        const topicImportance = {};
        state.questions.forEach((q, i) => {
          if (q.topic_key && weights[i] >= 3) {
            topicImportance[q.topic_key] = true;
          }
        });
        return {
          ...state,
          answers,
          weights,
          topicImportance,
          currentQuestionIndex: qLen, // Past last question
        };
      }
    case "RESET":
      // Preserve questions but reset answers, progress, results, seen questions, and topic importance
      return {
        ...initialState,
        questions: state.questions,
        questionDetails: state.questionDetails,
        answers: Array(state.questions.length).fill(null),
        weights: Array(state.questions.length).fill(2),
        seenQuestions: [],
        topicImportance: {},
      };
    default:
      return state;
  }
}

export function useQuiz(election) {
  const config = useMemo(() => (election ? electionConfigs[election] : {}), [election]);
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load questions when election changes
  useEffect(() => {
    if (!election) return;

    const loadPresQs = config.questionTypes?.includes("presidential")
      ? fetch(config.presVotesUrl)
          .then(r => r.json())
          .then(data => {
            // Iterate through ALL candidates to find ALL unique questions
            const allQuestionsMap = {};

            Object.values(data.candidates).forEach(candidate => {
              Object.entries(candidate.votes).forEach(([id, q]) => {
                if (!allQuestionsMap[id]) {
                  allQuestionsMap[id] = {
                    id,
                    question: q.question,
                    question_key: q.question_key,
                    topic_key: q.topic_key,
                    options: [
                      'answers.agreeCapitalized',
                      'answers.neutralCapitalized',
                      'answers.disagreeCapitalized'
                    ],
                    polarity: ""
                  };
                }
              });
            });

            return Object.values(allQuestionsMap);
          })
      : Promise.resolve([]);

    loadPresQs
      .then(presQs => dispatch({ type: "SET_QUESTIONS", payload: presQs }))
      .catch(err => console.error("Error loading questions:", err));
  }, [election, config.presVotesUrl, config.questionTypes]);

  // Computed: unique question indices
  const uniqueIndices = useMemo(() => computeUniqueIndices(state.questions), [state.questions]);

  // Computed: progress
  const progress = useMemo(() => ({
    current: uniqueIndices.indexOf(state.currentQuestionIndex) + 1,
    total: uniqueIndices.length,
    percentage: uniqueIndices.length > 0
      ? Math.round((uniqueIndices.indexOf(state.currentQuestionIndex) + 1) / uniqueIndices.length * 100)
      : 0,
  }), [uniqueIndices, state.currentQuestionIndex]);

  // Action creators - cleaner API for common operations
  const actions = useMemo(() => ({
    answerQuestion: (index, answer) => dispatch({ type: "ANSWER", index, answer }),
    setWeight: (index, weight) => dispatch({ type: "SET_WEIGHTS", index, weight }),
    goToQuestion: (index) => dispatch({ type: "SET_CURRENT_QUESTION_INDEX", payload: index }),
    setResults: (results) => dispatch({ type: "SET_COMPARISON_RESULTS", payload: results }),
    selectEntity: (entity) => dispatch({ type: "SET_SELECTED_ENTITY", payload: entity }),
    setEntityDetails: (details) => dispatch({ type: "SET_ENTITY_DETAILS", payload: details }),
    setHoveredOption: (option) => dispatch({ type: "SET_HOVERED_OPTION", payload: option }),
    markQuestionSeen: (index) => dispatch({ type: "MARK_QUESTION_SEEN", payload: index }),
    reset: () => dispatch({ type: "RESET" }),
  }), []);

  // Navigation helpers
  const navigation = useMemo(() => {
    const canGoNext = findNextUniqueIndex(uniqueIndices, state.currentQuestionIndex) !== undefined;
    const canGoPrev = findPrevUniqueIndex(uniqueIndices, state.currentQuestionIndex) !== undefined;

    return {
      goNext: () => {
        const next = findNextUniqueIndex(uniqueIndices, state.currentQuestionIndex);
        if (next !== undefined) {
          dispatch({ type: "SET_CURRENT_QUESTION_INDEX", payload: next });
          return true;
        }
        return false;
      },
      goPrev: () => {
        const prev = findPrevUniqueIndex(uniqueIndices, state.currentQuestionIndex);
        if (prev !== undefined) {
          dispatch({ type: "SET_CURRENT_QUESTION_INDEX", payload: prev });
          return true;
        }
        return false;
      },
      isFirst: state.currentQuestionIndex === 0,
      isLast: state.currentQuestionIndex === state.questions.length - 1,
      canGoNext,
      canGoPrev,
    };
  }, [uniqueIndices, state.currentQuestionIndex, state.questions.length]);

  // Current question helper
  const currentQuestion = useMemo(() => {
    if (state.questions.length === 0) return null;
    if (state.currentQuestionIndex >= state.questions.length) return null;
    return state.questions[state.currentQuestionIndex];
  }, [state.questions, state.currentQuestionIndex]);

  return {
    // Core state and dispatch (for backward compatibility)
    state,
    dispatch,
    config,
    electionConfigs,
    enabledElections,  // List of enabled election configs for UI

    // Enhanced API
    actions,
    navigation,
    progress,
    uniqueIndices,
    currentQuestion,
  };
}