import React from "react";
import { T, useTranslate } from "@tolgee/react";
import BackToQuizButton from "./BackToQuizButton";

export default function Contact() {
  const { t } = useTranslate();

  return (
    // Outer wrapper: fills the viewport with no width restrictions
    <div
      style={{
        justifyContent: "center",
        minHeight: "100vh",
        width: "100vw",         // Force full page width
        margin: 0,
        padding: "0",          // Remove extra padding if needed
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "70%",        // Full width (remove any maxWidth or percentage limitations)
          margin: "0 auto", // Centers the inner container horizontally
          color: "var(--fontColor)",
          padding: "40px 20px",
          boxShadow: "0 2px 10px var(--buttonShadow)",
          lineHeight: 1.6,
        }}
      >
        <header
          style={{
            textAlign: "left",
            marginBottom: "40px",
            borderBottom: "2px solid #f0f0f0",
            paddingBottom: "20px",
          }}
        >
          <h1 style={{ marginBottom: "10px" }}><T keyName="contact.title" /></h1>
        </header>

        <section style={{ marginBottom: "40px" }}>
          <p>
            <T keyName="contact.description" /> <br/>
            <a href="mailto:info@decide.pe" style={{ color: "#00CED1" }}>
              {t('contact.email')}
            </a>
          </p>
        </section>

        <BackToQuizButton />
      </div>
    </div>
  );
}