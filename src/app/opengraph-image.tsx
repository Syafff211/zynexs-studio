import { ImageResponse } from "next/og";

export const alt = "Zynex Studio — Premium Digital Products & Services";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #05060c 0%, #0b1030 55%, #061e2b 100%)",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -180,
            left: -120,
            width: 620,
            height: 620,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(51,102,255,0.5) 0%, rgba(51,102,255,0) 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -220,
            right: -140,
            width: 640,
            height: 640,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(22,191,216,0.4) 0%, rgba(22,191,216,0) 70%)",
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 20,
              background: "linear-gradient(135deg, #598eff 0%, #1f45f5 55%, #16bfd8 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 38,
              fontWeight: 800,
              color: "#fff",
            }}
          >
            Z
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 34, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>
              Zynex Studio
            </div>
            <div style={{ fontSize: 17, color: "rgba(255,255,255,0.45)", letterSpacing: 3 }}>
              DIGITAL STORE
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 66,
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.1,
              letterSpacing: -2,
              maxWidth: 950,
              display: "flex",
            }}
          >
            Digital Product &amp; Services, Simple. Fast. Affordable.
          </div>
          <div
            style={{
              fontSize: 27,
              color: "rgba(255,255,255,0.6)",
              maxWidth: 880,
              display: "flex",
            }}
          >
            Domain, AI Pro, Canva Pro, dan berbagai layanan digital dalam satu platform.
          </div>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          {["Domain .my.id — Rp5.000", "Canva Pro — Rp2.000", "Google AI Pro — Rp20.000"].map(
            (item) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  padding: "13px 24px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.16)",
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 22,
                  fontWeight: 600,
                }}
              >
                {item}
              </div>
            )
          )}
        </div>
      </div>
    ),
    size
  );
}
