export default function ExercisesLoading() {
  return (
    <div className="page-stack" aria-label="Loading exercises">
      <div className="skeleton-block skeleton-heading" />
      <div className="skeleton-block skeleton-body-map" />
      <div className="exercise-skeleton-grid">
        {Array.from({ length: 6 }, (_, index) => <div className="skeleton-block skeleton-card" key={index} />)}
      </div>
    </div>
  );
}
