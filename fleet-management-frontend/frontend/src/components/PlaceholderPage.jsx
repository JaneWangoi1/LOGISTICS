// Shared shell for any module whose real screen hasn't been built yet.
// An empty screen should still say something useful — which phase brings
// it, and what's coming — rather than just being blank.
export default function PlaceholderPage({ title, phase, description }) {
  return (
    <>
      <div className="content-header">
        <h1>{title}</h1>
      </div>
      <div className="panel placeholder-panel">
        <span className="placeholder-phase">{phase}</span>
        <h2>Not built yet</h2>
        <p>{description}</p>
      </div>
    </>
  );
}
