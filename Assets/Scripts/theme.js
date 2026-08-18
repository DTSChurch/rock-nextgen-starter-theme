/**
 * NextGen Starter theme behavior.
 *
 * Loaded from Site.Master's <head> with `defer`, so it executes after HTML
 * parsing and before DOMContentLoaded. No jQuery required.
 *
 * All click handling uses event delegation on `document`, so it keeps working
 * across Rock's partial postbacks (UpdatePanels) without any re-initialization
 * dance — delegated listeners don't care that markup inside a panel was
 * replaced.
 */
(function () {
  'use strict';

  var BACK_TO_TOP_OFFSET = 300;

  document.addEventListener('DOMContentLoaded', function () {
    initBackToTop();
  });

  // --- Mobile menu -----------------------------------------------------------

  document.addEventListener('click', function (event) {
    var toggle = event.target.closest('.site-nav-toggle');
    if (toggle) {
      var header = toggle.closest('.site-header');
      var isOpen = header.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      return;
    }

    var caret = event.target.closest('.site-nav-caret');
    if (caret) {
      event.preventDefault();
      var item = caret.closest('.site-nav-item');
      var isExpanded = item.classList.toggle('open');
      caret.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
      return;
    }

    // Clicking a nav link (not a caret) closes the mobile panel.
    if (event.target.closest('.site-nav a')) {
      var openHeader = document.querySelector('.site-header.nav-open');
      if (openHeader) {
        openHeader.classList.remove('nav-open');
        var openToggle = openHeader.querySelector('.site-nav-toggle');
        if (openToggle) {
          openToggle.setAttribute('aria-expanded', 'false');
        }
      }
    }
  });

  // Close the mobile panel on Escape.
  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') {
      return;
    }
    var header = document.querySelector('.site-header.nav-open');
    if (header) {
      header.classList.remove('nav-open');
      var toggle = header.querySelector('.site-nav-toggle');
      if (toggle) {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    }
  });

  // --- Back to top -------------------------------------------------------------

  function initBackToTop() {
    var backToTop = document.querySelector('.back-to-top');
    if (!backToTop) {
      return;
    }

    var isTicking = false;

    function update() {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      backToTop.classList.toggle('visible', scrollTop > BACK_TO_TOP_OFFSET);
      isTicking = false;
    }

    window.addEventListener('scroll', function () {
      if (!isTicking) {
        isTicking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });

    backToTop.addEventListener('click', function (event) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    update();
  }
})();
