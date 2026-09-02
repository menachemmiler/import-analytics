import { ImageResponse } from "next/og";

export const alt = "Netiv Import Intelligence Dashboard — landed cost and market intelligence";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #064e3b 100%)",
          color: "#f8fafc",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#34d399",
            marginBottom: 24,
          }}
        >
          Netiv
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.1,
            maxWidth: 980,
          }}
        >
          Import Feasibility & Market Intelligence
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 28,
            color: "#cbd5e1",
            maxWidth: 900,
          }}
        >
          Landed cost, Israeli retail, global suppliers, and customs brokers.
        </div>
      </div>
    ),
    size,
  );
}
