// Collects runtime errors from the very start so the test API can report them.
const caught = [];
const push = (kind, message) => {
  caught.push({ kind, message: String(message), at: Math.round(performance.now()) });
  if (caught.length > 50) caught.shift();
};
window.addEventListener('error', (e) => push('error', e.message || e.error));
window.addEventListener('unhandledrejection', (e) => push('rejection', e.reason && e.reason.message ? e.reason.message : e.reason));
export const errors = () => caught.slice();
