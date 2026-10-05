import { AbsoluteFill, Composition, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

// Install check: frame-driven motion only (no timers), renders in a few seconds.
const SmokeTestScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 12 } });
  const x = interpolate(frame, [0, 59], [-200, 200]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#004664", justifyContent: "center", alignItems: "center" }}>
      <div style={{ width: 160, height: 160, borderRadius: 80, background: "#62E8FF", transform: `translateX(${x}px) scale(${s})` }} />
    </AbsoluteFill>
  );
};

export const SmokeTest = () => (
  <Composition id="SmokeTest" component={SmokeTestScene} durationInFrames={60} fps={30} width={1280} height={720} />
);
