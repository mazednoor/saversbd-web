"use client";

import { useEffect } from "react";

/**
 * Makes <details>-based dropdowns (used in the header) close when the user
 * clicks anywhere outside of them, or presses Escape. Also closes a dropdown
 * as soon as one of its links is clicked, so navigation doesn't leave it open.
 */
export function CloseDetailsOnOutsideClick() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as Element | null;
      if (!target) return;

      // Close the dropdown that contains a clicked link.
      const link = target.closest("a");
      if (link) {
        const details = link.closest("details");
        if (details) details.removeAttribute("open");
      }

      // Close any dropdown that does not contain the click target.
      document.querySelectorAll("details[open]").forEach((details) => {
        if (!details.contains(target)) {
          details.removeAttribute("open");
        }
      });
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        document.querySelectorAll("details[open]").forEach((details) => {
          details.removeAttribute("open");
        });
      }
    }

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  return null;
}
