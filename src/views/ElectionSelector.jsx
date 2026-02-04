import { useTranslate } from "@tolgee/react";
import { trackEvent } from "../analytics";
import { enabledElections } from "../elections";
import { BrandLogoAlt } from "../components/BrandImage";

export default function ElectionSelector({ onSelectElection, branding }) {
  const { t } = useTranslate();

  const handleSelect = (electionId) => {
    trackEvent("election_selected", { election: electionId });
    onSelectElection(electionId);
  };

  return (
    <div className="election-selection-container">
      <BrandLogoAlt branding={branding} />
      <h2>{t('elections.selectTitle')}</h2>
      <p style={{ textAlign: "center" }}>
        {t('elections.selectDescription')}
      </p>
      {enabledElections.map(election => (
        <button
          key={election.id}
          onClick={() => handleSelect(election.id)}
        >
          {t(election.label)}
        </button>
      ))}
    </div>
  );
}