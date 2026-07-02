import { ImageResponse } from "next/og";

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
          alignItems: "center",
          background: "#1e96b4",
          color: "white",
          fontFamily: "Arial",
          padding: "40px",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: 1 }}>
          Thelittlemart
        </div>
        <div style={{ marginTop: 16, fontSize: 32, opacity: 0.9 }}>
          Curated everyday essentials
        </div>
      </div>
    ),
    size
  );
}
