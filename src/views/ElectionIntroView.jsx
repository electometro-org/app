import { useTranslate } from "@tolgee/react";
import { BrandLogoAlt } from "../components/BrandImage";

export default function ElectionIntroView({ branding, electionId, electionLabel, onStart }) {
  const { t } = useTranslate();

  return (
    <div className="intro-container">
      <BrandLogoAlt branding={branding} />
      <h2>{t(`welcome.${electionId}.title`, { election: t(electionLabel) })}</h2>
      <p style={{ textAlign: "center" }}>
        {t(`welcome.${electionId}.description1`)}<br />
        {t(`welcome.${electionId}.description2`)}
      </p>
      <button onClick={onStart}>
        {t('common.start')}
      </button>
    </div>
  );
}