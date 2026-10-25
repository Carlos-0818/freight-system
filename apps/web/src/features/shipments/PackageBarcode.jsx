import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";

export default function PackageBarcode({ code }) {
  const svgRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const svg = svgRef.current;

    if (!svg) {
      return;
    }

    svg.replaceChildren();
    setErrorMessage("");

    try {
      if (typeof code !== "string" || code.trim() === "") {
        throw new Error("Missing package code");
      }

      JsBarcode(svg, code, {
        format: "CODE128",
        width: 2,
        height: 80,
        displayValue: false,
        background: "#ffffff",
        lineColor: "#000000",
        margin: 20,
      });
    } catch {
      svg.replaceChildren();
      setErrorMessage("無法產生貨件條碼，請使用文字編號查詢。");
    }

    return () => {
      svg.replaceChildren();
    };
  }, [code]);

  return (
    <figure style={{ margin: "16px 0", minWidth: 0 }}>
      <figcaption>
        貨件條碼（CODE128）
        <div style={{ overflowWrap: "anywhere" }}>
          <code>{code}</code>
        </div>
      </figcaption>

      {errorMessage && <p role="alert">{errorMessage}</p>}

      <div
        hidden={Boolean(errorMessage)}
        role="region"
        aria-label="貨件條碼，可橫向捲動查看完整內容"
        tabIndex={0}
        style={{
          maxWidth: "100%",
          overflowX: "auto",
          marginTop: 8,
        }}
      >
        <svg
          ref={svgRef}
          role="img"
          aria-label={`貨件 ${code} 的 CODE128 條碼`}
          style={{
            display: "block",
            maxWidth: "none",
          }}
        />
      </div>
    </figure>
  );
}
