import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Kozy Hole Ice Shack Rentals — Lac la Biche, Alberta";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0f14",
          fontFamily: "Georgia, serif",
          position: "relative",
          padding: "0 80px",
        }}
      >
        {/* Top ice-blue accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background:
              "linear-gradient(to right, transparent, #5cc6ec 30%, #5cc6ec 70%, transparent)",
          }}
        />

        {/* Background radial glow */}
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "900px",
            height: "500px",
            borderRadius: "50%",
            background:
              "radial-gradient(closest-side, rgba(92,198,236,0.12), transparent 70%)",
          }}
        />

        {/* Location pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "999px",
            padding: "8px 20px",
            marginBottom: "32px",
            fontSize: "16px",
            fontFamily: "sans-serif",
            color: "#6b7d8d",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#4cc38a",
            }}
          />
          Lac la Biche, Alberta · Dec 15 – Mar 31
        </div>

        {/* Brand name */}
        <div
          style={{
            fontSize: "96px",
            fontWeight: 700,
            color: "#eaf1f7",
            letterSpacing: "-0.02em",
            lineHeight: 1,
            textAlign: "center",
            fontFamily: "Georgia, serif",
          }}
        >
          Kozy Hole
        </div>

        {/* Sub-brand */}
        <div
          style={{
            fontSize: "20px",
            fontFamily: "sans-serif",
            fontWeight: 600,
            color: "#5cc6ec",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            marginTop: "16px",
          }}
        >
          Ice Shack Rentals
        </div>

        {/* Divider */}
        <div
          style={{
            width: "60px",
            height: "1px",
            background: "rgba(255,255,255,0.12)",
            margin: "36px 0",
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontSize: "32px",
            color: "#9db0c0",
            textAlign: "center",
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
            maxWidth: "700px",
            lineHeight: 1.3,
          }}
        >
          Your warm spot on the hard water
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "1px",
            background:
              "linear-gradient(to right, transparent, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.08) 70%, transparent)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
