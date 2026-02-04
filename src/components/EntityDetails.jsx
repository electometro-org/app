import React, { useState } from "react";
import { useTranslate } from "@tolgee/react";
import { voteToNumeric } from "../voteUtils";

function extractUrls(source) {
  if (!source) return [];
  const urlRegex = /https?:\/\/[^\s;,]+/g;
  const matches = source.match(urlRegex) || [];
  return matches.map(url => url.replace(/[.,;:]+$/, ''));
}

function SourceLinks({ source, label }) {
  const [isOpen, setIsOpen] = useState(false);
  const urls = extractUrls(source);

  if (urls.length === 0) return null;

  if (urls.length === 1) {
    return (
      <sup>
        <a href={urls[0]} target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      </sup>
    );
  }

  return (
    <sup style={{ position: "relative" }}>
      <span
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: "pointer", color: "#646cff", fontWeight: "500"}}
      >
        {label}
      </span>
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            background: "white",
            border: "1px solid #ccc",
            borderRadius: 4,
            padding: "8px",
            zIndex: 1000,
            minWidth: "200px",
            maxWidth: "300px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
          }}
        >
          <div style={{ marginBottom: 4, fontWeight: "bold", fontSize: "0.9em" }}>
            Fuentes ({urls.length}):
          </div>
          {urls.map((url, i) => (
            <div key={i} style={{ marginBottom: 4, fontSize: "0.85em", wordBreak: "break-all" }}>
              <a href={url} target="_blank" rel="noopener noreferrer">
                {url.length > 50 ? url.substring(0, 50) + "..." : url}
              </a>
            </div>
          ))}
          <div
            onClick={() => setIsOpen(false)}
            style={{ cursor: "pointer", color: "gray", fontSize: "0.8em", marginTop: 4 }}
          >
            ✕ Cerrar
          </div>
        </div>
      )}
    </sup>
  );
}


export default function EntityDetails({
  selectedEntity,
  entityDetails,
  questionDetails = [],
  questions = [],
  answers = {},
  config = {},
  isMobile = false,
  inline = false
}) {
  const { t } = useTranslate();
  if (!selectedEntity || !entityDetails) return null;

  const isPartyEntity = !!entityDetails && !entityDetails.candidate_meta;
  const wrapperClass = inline ? "entity-details-inline" : "entity-details-container";
  const { candidate_meta, details = [] } = entityDetails;

  const includedDetails = details.filter(d => d.includedInAnalysis);

  const comparedList = includedDetails.filter(d => {
    const qIndex = questions.findIndex(q => q.id === d.id);
    if (qIndex < 0) return false;
    const raw = answers[qIndex];
    return !!raw && raw !== t('entityDetails.noAnswer') && String(raw).trim() !== "";
  });

  const comparedCount = comparedList.length;
  const totalCount = questions.length || details.length;

  const extractPartyFromCandidateName = (name) => {
    if (!name || typeof name !== "string") return null;
    const m = name.match(/\(([^)]+)\)\s*$/);
    if (m && m[1]) return m[1].trim();
    const m2 = name.match(/\[([^\]]+)\]\s*$/);
    if (m2 && m2[1]) return m2[1].trim();
    if (selectedEntity.party) return selectedEntity.party;
    return null;
  };

  const displayText = selectedEntity.name || selectedEntity.party || "";
  const logoPartyName = isPartyEntity
    ? (selectedEntity.name || selectedEntity.party || "")
    : (extractPartyFromCandidateName(selectedEntity.name) || selectedEntity.party || "");

  const getAppBase = () => {
    const fromPublicUrl = (typeof process !== "undefined" && process.env && process.env.PUBLIC_URL) ? process.env.PUBLIC_URL : "";
    const fromVite = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : "";
    let base = fromPublicUrl || fromVite || "";
    return base.replace(/\/$/, "");
  };

  const buildLogoUrl = (partyName, ext) => {
    if (!partyName) return "";
    const base = getAppBase();
    const encoded = encodeURIComponent(partyName);
    const prefix = base ? `${base}/` : "";
    const assetsPath = config.assetsPath || "";
    return `${prefix}${assetsPath}party_logos/${encoded}.${ext}`;
  };
  const LogoImage = ({ partyName, maxHeight = 100, altSuffix = "logo" }) => {
    const [srcIndex, setSrcIndex] = React.useState(0);
    const [failed, setFailed] = React.useState(false);

    if (!partyName || failed) return null;

    const exts = ["png", "jpg", "jpeg"];
    const src = buildLogoUrl(partyName, exts[srcIndex]);

    const handleImgError = () => {
      if (srcIndex < exts.length - 1) {
        setSrcIndex(s => s + 1);
      } else {
        setFailed(true);
      }
    };

    return (
      <img
        src={src}
        alt={`${partyName} ${altSuffix}`}
        onError={handleImgError}
        style={{
          width: "auto",
          height: "auto",
          maxHeight: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
          maxWidth: "100%",
          objectFit: "contain",
          borderRadius: 4,
          border: "1px solid rgba(0,0,0,0.05)",
          
          display: "block",
          paddingRight: "0px"
        }}
        draggable={false}
      />
    );
  };


  return (
    <div className={wrapperClass}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 160px",
          gap: 12,
          alignItems: "start",
          marginBottom: inline ? 4 : 8
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <span>{displayText}</span>
            </h2>
          </div>

          <div style={{ marginTop: 8 }}>
            <small style={{ color: "gray" }}>
              {t('results.comparedWith')} {comparedCount} {t('results.of')} {totalCount} {t('results.statements')}
              {comparedCount === 0 && ` ${t('results.noComparison')}`}
            </small>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            {logoPartyName ? (
            <LogoImage partyName={logoPartyName} size={120} />
          ) : null}
        </div>
      </div>

      {comparedList.length > 0 ? (
        comparedList.map((d) => {
          const qd = questionDetails.find(q => q.id === d.id) || {};
          const qIndex = questions.findIndex(q => q.id === d.id);
          const answerToVoteKey = {
            'answers.agreeCapitalized': 'votes.inFavor',
            'answers.neutralCapitalized': 'votes.neutral',
            'answers.disagreeCapitalized': 'votes.against',
          };
          const rawAnswer = qIndex >= 0 ? answers[qIndex] : null;
          const userVoteKey = rawAnswer ? answerToVoteKey[rawAnswer] : null;
          const userText = userVoteKey ? t(userVoteKey) : t('entityDetails.noAnswer');
          const userVal = { 'votes.inFavor': 1, 'votes.neutral': 0.5, 'votes.against': 0 }[userVoteKey] ?? 0.5;

          const candVal = voteToNumeric(d.vote);
          const voteToKey = { "1": 'votes.inFavor', "0.5": 'votes.neutral', "0": 'votes.against' };
          const candVoteKey = voteToKey[String(d.vote)];
          const candText = candVoteKey ? t(candVoteKey) : (d.vote ?? "N/A");
          const diff = Math.abs(candVal - userVal);

          let statusText = t('entityDetails.matches');
          let statusColor = "green";
          if (diff === 0.5) {
            statusText = t('entityDetails.partialMatch');
            statusColor = "gold";
          } else if (diff >= 1) {
            statusText = t('entityDetails.noMatch');
            statusColor = "red";
          }

          const entityLabel = isPartyEntity ? t('entityDetails.party') : t('entityDetails.candidate');

          return (
            <div key={d.id} style={{ marginBottom: inline ? "4px" : "2px", lineHeight: "1.2" }}>
              <p style={{ margin: "2px 0" }}>
                <strong>{t('entityDetails.topic')}</strong> {d.question_key ? t(d.question_key) : (qd.question || d.question)}
              </p>
              <p style={{ margin: "2px 0", fontSize: "0.95em", color: "#555" }}>
                <strong style={{ color: statusColor }}>{statusText}</strong>
                {": "}

                <strong style={{ color: "inherit" }}>{entityLabel}:</strong> {candText}
                {" | "}
                <strong style={{ color: "inherit" }}>{t('entityDetails.you')}:</strong> {userText}
              </p>

              <div style={{ margin: "2px 0" }}>
                {(isPartyEntity || config.isPresidentialElection) ? (
                  <>
                    {d.comment ? (
                      <p style={{ margin: "2px 0" }}>
                        <strong>{t('entityDetails.explanation')}</strong> {d.comment_key ? t(d.comment_key) : d.comment}
                        {d.source && (
                          <SourceLinks source={d.source} label={t('common.seeSource')} />
                        )}
                        <br />
                      </p>
                    ) : (
                      <>
                        <strong>{t('entityDetails.vote')}</strong> {typeof d.vote === "number" ? d.vote : (d.vote || "N/A")}
                        <br />
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <strong>{t('entityDetails.congressVote')}</strong> {d.vote}
                    <br />
                  </>
                )}
              </div>

              <br />
            </div>
          );
        })
      ) : (
        <p style={{ margin: "2px 0" }}>{t('results.noDetails')}</p>
      )}
    </div>
  );

}
