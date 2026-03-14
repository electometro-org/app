import React from "react";
import { T } from "@tolgee/react";
import BackToQuizButton from "./BackToQuizButton";

export default function Methodology() {
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
          width: "70%",
          margin: "0 auto",
          color: "var(--fontColor)",
          padding: "40px 20px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          fontFamily: "Arial, sans-serif",
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
          <h1 style={{ marginBottom: "10px" }}><T keyName="methodology.title" /></h1>
        </header>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{fontSize: "1.5em",marginBottom: "10px"}}>
            <T keyName="methodology.sourcesTitle" />
          </h2>
          <p style={{ marginBottom: "20px", whiteSpace: "pre-line" }}>
            <T keyName="methodology.sourcesText" />
          </p>

          <h2 style={{fontSize: "1.5em",marginBottom: "10px"}}>
            <T keyName="methodology.goalsTitle" />
          </h2>
            <p style={{ marginBottom: "20px", whiteSpace: "pre-line" }}>
              <T keyName="methodology.goalsText" />
            </p>

        </section>

        <BackToQuizButton />
      </div>
    </div>
  );
}