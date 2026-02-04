import { useTranslate } from "@tolgee/react";
import { BrandLogoAlt } from "../components/BrandImage";
import { defaultBranding } from "../config/branding";

export default function GenericIntroView({ onContinue }) {
  const { t } = useTranslate();

  return (
    <div className="intro-container">
      <BrandLogoAlt branding={defaultBranding} />
      <h2>{t('welcome.title')}</h2>
      <p style={{ textAlign: "center" }}>
        {t('welcome.description1')}<br />
        {t('welcome.description2')}
      </p>
      <button onClick={onContinue}>
        {t('common.continue')}
      </button>
    </div>
  );
}