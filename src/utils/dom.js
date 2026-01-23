export const qs = (selector, scope = document) => scope.querySelector(selector);
export const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

export function setCSSVars(target, vars = {}) {
  const el = target || document.documentElement;
  Object.entries(vars).forEach(([key, value]) => {
    el.style.setProperty(key, value);
  });
}