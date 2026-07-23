# Exercise media

Fitcore only displays approved, locally hosted exercise demonstrations. Add or replace an asset in `lib/exercises/media.ts` after it has been reviewed for form, framing, licence, and attribution.

Use a short, muted WebM or MP4 loop stored under `public/exercise-media/<slug>/`. Include `previewUrl`, `fullVideoUrl`, `posterUrl`, optional front/side views, source, licence, attribution, reviewer, date, and version. Set `mediaStatus` to `approved` only once those fields are verified.

Until then leave the registry entry as `needs-approval`. The UI will show an honest media-pending state and users can still follow the written technique, breathing, and safety guidance.
