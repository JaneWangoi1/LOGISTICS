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
