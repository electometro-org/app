import { useMemo, useState } from "react";
import { useTranslate } from "@tolgee/react";
import { BrandLogoAlt } from "../components/BrandImage";
import { trackEvent } from "../utils/analytics";
import { useRegionalData } from "../hooks/useRegionalData";
import { slugifyTopic } from "../services/regionalService";
import "./RegionSelectorView.css";

const LAST_REGION_KEY = "lastRegionId";
const SEARCH_MIN_REGIONS = 7;

function readLastRegion() {
  try {
    return window.localStorage.getItem(LAST_REGION_KEY);
  } catch {
    return null;
  }
}

function rememberRegion(id) {
  try {
    window.localStorage.setItem(LAST_REGION_KEY, id);
  } catch { /* ignore storage errors */ }
}

function initials(name) {
  const words = name.split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase();
}

// Translations fall back to Spanish copy until Tolgee has the keys
function useLabel() {
  const { t } = useTranslate();
  return (key, fallback, params) => {
    const value = t(key, params);
    return value === key ? fallback : value;
  };
}

export default function RegionSelectorView({ branding, regionalVotesUrl, onSelectRegion }) {
  const label = useLabel();
  const { regions, loading, error, retry } = useRegionalData(regionalVotesUrl);
  const [query, setQuery] = useState("");
  const lastRegionId = useMemo(readLastRegion, []);

  const filtered = useMemo(() => {
    const q = slugifyTopic(query);
    return q ? regions.filter(r => slugifyTopic(r.name).includes(q)) : regions;
  }, [regions, query]);

  const lastRegion = regions.find(r => r.id === lastRegionId);

  const choose = (region) => {
    rememberRegion(region.id);
    trackEvent("region_selected", { region: region.id, region_name: region.name });
    onSelectRegion(region.id);
  };

  return (
    <div className="region-selector">
      <BrandLogoAlt branding={branding} />
      <h2 className="region-selector__title">{label("regions.title", "¿En qué región votas?")}</h2>
      <p className="region-selector__subtitle">
        {label("regions.subtitle", "Las preguntas y los candidatos dependen de tu región.")}
      </p>

      {loading && (
        <div className="region-selector__grid" aria-busy="true" aria-live="polite">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="region-card region-card--skeleton" aria-hidden="true" />
          ))}
        </div>
      )}

      {error && (
        <div className="region-selector__error" role="alert">
          <p>{label("regions.loadError", "No pudimos cargar las regiones.")}</p>
          <button type="button" onClick={retry}>{label("regions.retry", "Reintentar")}</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {lastRegion && (
            <button type="button" className="region-selector__last" onClick={() => choose(lastRegion)}>
              {label("regions.continueWith", "Continuar con [region]").replace("[region]", lastRegion.name)}
              <span aria-hidden="true"> →</span>
            </button>
          )}

          {regions.length >= SEARCH_MIN_REGIONS && (
            <input
              type="search"
              className="region-selector__search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={label("regions.searchPlaceholder", "Busca tu región…")}
              aria-label={label("regions.searchLabel", "Buscar región")}
              autoComplete="off"
            />
          )}

          <ul className="region-selector__grid">
            {filtered.map(region => (
              <li key={region.id}>
                <button type="button" className="region-card" onClick={() => choose(region)}>
                  <span className="region-card__badge" aria-hidden="true">{initials(region.name)}</span>
                  <span className="region-card__name">{region.name}</span>
                  <span className="region-card__meta">
                    {label("regions.meta", "[candidates] candidatos · [topics] temas")
                      .replace("[candidates]", region.candidateCount)
                      .replace("[topics]", region.questionCount)}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {filtered.length === 0 && (
            <p className="region-selector__empty" role="status">
              {label("regions.noResults", "No encontramos esa región.")}
            </p>
          )}
        </>
      )}
    </div>
  );
}
