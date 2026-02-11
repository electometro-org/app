import { useEffect, useRef, useState } from "react";
import { useTranslate } from "@tolgee/react";
import { BrandLogoAlt } from "../components/BrandImage";

export default function ElectionIntroView({ branding, electionId, electionLabel, onStart }) {
  const { t } = useTranslate();
  const description1 = t(`welcome.${electionId}.description1`);
  const description2 = t(`welcome.${electionId}.description2`);
  const [showFirstDescription, setShowFirstDescription] = useState(false);
  const [showSecondDescription, setShowSecondDescription] = useState(false);
  const secondDescriptionRef = useRef(null);
  const [secondDescriptionHeight, setSecondDescriptionHeight] = useState(0);

  useEffect(() => {
    setShowFirstDescription(false);
    setShowSecondDescription(false);

    const rafId = requestAnimationFrame(() => {
      setShowFirstDescription(true);
    });

    const timeoutId = setTimeout(() => {
      setShowSecondDescription(true);
    }, 2500);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
    };
  }, [electionId]);

  useEffect(() => {
    const measureSecondDescription = () => {
      if (!secondDescriptionRef.current) return;
      setSecondDescriptionHeight(secondDescriptionRef.current.scrollHeight);
    };

    measureSecondDescription();
    window.addEventListener('resize', measureSecondDescription);
    return () => window.removeEventListener('resize', measureSecondDescription);
  }, [description2, electionId]);

  return (
    <div className="intro-container">
      <BrandLogoAlt branding={branding} />
      <h2>{t(`welcome.${electionId}.title`, { election: t(electionLabel) })}</h2>
      <p className="election-intro-pitch-inline">
        <span
          className={`election-intro-line election-intro-line--first ${showFirstDescription ? 'is-visible' : ''}`}
          aria-hidden={false}
        >
          {description1}
        </span>
        <span
          className={`election-intro-line election-intro-line--second ${showSecondDescription ? 'is-visible' : ''}`}
          aria-hidden={!showSecondDescription}
          ref={secondDescriptionRef}
          style={{ '--intro-second-max-height': `${secondDescriptionHeight}px` }}
        >
          {description2}
        </span>
      </p>
      <button onClick={onStart}>
        {t('common.start')}
      </button>
    </div>
  );
}
