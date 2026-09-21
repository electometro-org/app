import { LanguagePill } from "./LanguageSwitcher";
import "./QuizTopLine.css";

/** Language pill on the left, region chip on the right. */
export default function QuizTopLine({ regionName = null }) {
  return (
    <div className="quiz-top-line">
      <LanguagePill />
      {regionName && (
        <span className="region-badge" title={regionName}>
          <span className="region-badge__dot" aria-hidden="true" />
          <span className="region-badge__name">{regionName}</span>
        </span>
      )}
    </div>
  );
}
