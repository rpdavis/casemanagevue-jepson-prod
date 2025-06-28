// public/scripts/core/init.js

import { guardPage } from "./session.js";
import { renderNav } from "./nav.js";

/**
 * Wraps page logic with guard, nav injection, and view switching.
 */
export async function initPageWithNav({
  allowedRoles,
  mainSelector = "#main-content",
  defaultView = null,
  viewMap = {},
  afterRender = () => {}
}) {
  guardPage(allowedRoles, async (user) => {
    // Only one nav, always prepends
    if (!document.getElementById("nav")) {
      document.body.prepend(renderNav(user));
    }

    const main = document.querySelector(mainSelector);

    // One-time nav button handler for views
    document.querySelectorAll("#nav button[data-view]").forEach(button => {
      button.addEventListener("click", () => {
        const view = button.dataset.view;
        if (view && viewMap[view]) viewMap[view](main);
      });
    });

    // Default view loader
    if (defaultView && viewMap[defaultView]) {
      await viewMap[defaultView](main);
    }

    afterRender(user, main);
  });
}