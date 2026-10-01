// Tiny mascot: two pupils that idle-scan via CSS animation until the first
// real pointer movement, then track the cursor/touch point for real. Looks
// for `.eye .pupil` fresh on every move (not cached at init) so it keeps
// working across landing <-> agent view re-renders without re-initializing.

let tracking = false;

function trackTo(x, y) {
  const eyes = document.querySelectorAll(".eye");
  if (!eyes.length) return;

  if (!tracking) {
    tracking = true;
    for (const eye of eyes) {
      const pupil = eye.querySelector(".pupil");
      if (pupil) pupil.style.animation = "none";
    }
  }

  for (const eye of eyes) {
    const pupil = eye.querySelector(".pupil");
    if (!pupil) continue;
    const rect = eye.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const angle = Math.atan2(y - cy, x - cx);
    const radius = rect.width * 0.22;
    const px = (Math.cos(angle) * radius).toFixed(1);
    const py = (Math.sin(angle) * radius).toFixed(1);
    pupil.style.transform = `translate(calc(-50% + ${px}px), calc(-50% + ${py}px))`;
  }
}

export function initEyes() {
  window.addEventListener("mousemove", (e) => trackTo(e.clientX, e.clientY));
  window.addEventListener(
    "touchmove",
    (e) => {
      const touch = e.touches[0];
      if (touch) trackTo(touch.clientX, touch.clientY);
    },
    { passive: true }
  );
}
