// Smooth-scroll handlers for page anchors used in the UI.
// Respects prefers-reduced-motion.
(function () {
  var prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function smoothScrollToElement(el) {
    if (!el) return;
    if (prefersReduced) {
      el.scrollIntoView(true);
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Hero CTAs (navigation links)
  var ctas = document.querySelectorAll(".hero-cta");
  ctas.forEach(function (cta) {
    cta.addEventListener("click", function (e) {
      var href = this.getAttribute("href");
      if (href && href.startsWith("#")) {
        e.preventDefault();
        var targetId = href.substring(1);
        var target = document.getElementById(targetId);
        smoothScrollToElement(target);
      }
      // For non-hash links (like PDFs), let default behavior happen
    });
  });

  // Back-to-top button
  var back = document.querySelector(".backtotop");
  if (back) {
    back.addEventListener("click", function (e) {
      e.preventDefault();
      var target =
        document.getElementById("hero") || document.documentElement;
      smoothScrollToElement(target);
      // update hash without jumping (optional)
      if (history.pushState) history.pushState(null, "", "#hero");
    });
  }

  // Panel back buttons (Manifesto, Services, Portfolio, Story)
  var panelBackBtns = document.querySelectorAll(".panel__back-btn");
  panelBackBtns.forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var target =
        document.getElementById("hero") || document.documentElement;
      smoothScrollToElement(target);
      if (history.pushState) history.pushState(null, "", "#hero");
    });
  });

  // Contact section back button
  var contactBack = document.querySelector(".contact__back-btn");
  if (contactBack) {
    contactBack.addEventListener("click", function (e) {
      e.preventDefault();
      var target =
        document.getElementById("hero") || document.documentElement;
      smoothScrollToElement(target);
      if (history.pushState) history.pushState(null, "", "#hero");
    });
  }

  // Trackpad detection: trackpads typically send smaller, more frequent deltaY values
  var isTrackpad = false;
  var trackpadCheckCount = 0;
  var trackpadDetectionComplete = false;

  function detectTrackpad(e) {
    if (trackpadDetectionComplete) return;

    // Trackpads typically have deltaY values that are not multiples of 120
    // and are generally smaller and more precise than mouse wheels
    var deltaY = Math.abs(e.deltaY);

    if (deltaY > 0 && deltaY < 50) {
      // Small delta values are typical of trackpads
      isTrackpad = true;
      trackpadDetectionComplete = true;
    } else if (deltaY % 120 === 0) {
      // Mouse wheels typically use multiples of 120
      trackpadCheckCount++;
      if (trackpadCheckCount >= 2) {
        isTrackpad = false;
        trackpadDetectionComplete = true;
      }
    } else if (deltaY > 0) {
      trackpadCheckCount++;
      if (trackpadCheckCount >= 3) {
        trackpadDetectionComplete = true;
      }
    }
  }

  // Desktop wheel scrolling: advance a panel per gesture to avoid
  // the "multiple scrolls" effect from CSS snap on traditional mice.
  // Disabled when trackpad is detected to allow native smooth scrolling.
  var scroller = document.querySelector(".snap-container");
  if (scroller && !prefersReduced) {
    var panels = Array.prototype.slice.call(
      scroller.querySelectorAll(".panel")
    );
    if (panels.length) {
      var isAnimating = false;
      var pendingIndex = null;
      var releaseTimer = null;

      function nearestPanelIndex() {
        var scrollTop = scroller.scrollTop;
        var closest = 0;
        var minDelta = Infinity;
        for (var i = 0; i < panels.length; i++) {
          var delta = Math.abs(panels[i].offsetTop - scrollTop);
          if (delta < minDelta) {
            minDelta = delta;
            closest = i;
          }
        }
        return closest;
      }

      function endAnimation() {
        isAnimating = false;
        pendingIndex = null;
        if (releaseTimer) {
          window.clearTimeout(releaseTimer);
          releaseTimer = null;
        }
      }

      function scrollToPanel(index) {
        if (index < 0 || index >= panels.length) return;
        isAnimating = true;
        pendingIndex = index;
        panels[index].scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        if (releaseTimer) window.clearTimeout(releaseTimer);
        releaseTimer = window.setTimeout(endAnimation, 700);
      }

      scroller.addEventListener(
        "wheel",
        function (e) {
          // Detect trackpad on first few wheel events
          detectTrackpad(e);

          // Skip custom scroll logic if trackpad is detected
          if (isTrackpad) {
            return;
          }

          if (!e.deltaY || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) {
            return;
          }
          if (isAnimating) {
            e.preventDefault();
            return;
          }

          var current = nearestPanelIndex();
          var direction = e.deltaY > 0 ? 1 : -1;
          var targetIndex = current + direction;
          if (targetIndex < 0 || targetIndex >= panels.length) {
            return;
          }

          e.preventDefault();
          scrollToPanel(targetIndex);
        },
        { passive: false }
      );

      scroller.addEventListener("scroll", function () {
        // Skip animation handling if trackpad is detected
        if (isTrackpad) {
          return;
        }

        if (!isAnimating || pendingIndex == null) return;
        var target = panels[pendingIndex];
        if (!target) {
          endAnimation();
          return;
        }
        var diff = Math.abs(target.offsetTop - scroller.scrollTop);
        if (diff <= 2) {
          endAnimation();
        }
      });
    }
  }

  // Intersection Observer for scroll-triggered fade-in animations
  if (!prefersReduced && "IntersectionObserver" in window) {
    var fadeElements = document.querySelectorAll(".fade-on-scroll");
    var observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    };

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    fadeElements.forEach(function (element) {
      observer.observe(element);
    });
  } else {
    // Fallback for browsers without IntersectionObserver or when motion is reduced
    var fadeElements = document.querySelectorAll(".fade-on-scroll");
    fadeElements.forEach(function (element) {
      element.classList.add("visible");
    });
  }

  // ========================
  // Portfolio Modal
  // ========================
  var portfolioOverlay = document.getElementById("portfolioOverlay");
  var portfolioModal = document.getElementById("portfolioModal");
  var portfolioCloseBtn = document.querySelector(".portfolio-modal__close");
  var portfolioCards = document.querySelectorAll(".portfolio-card");
  var portfolioContents = document.querySelectorAll(
    ".portfolio-modal__content"
  );

  function openPortfolioModal(brandId) {
    if (!portfolioModal || !portfolioOverlay) return;

    // Hide all content sections, show the selected one
    portfolioContents.forEach(function (content) {
      content.classList.remove("visible");
      if (content.getAttribute("data-brand") === brandId) {
        content.classList.add("visible");
      }
    });

    portfolioOverlay.classList.add("visible");
    portfolioModal.classList.add("visible");
    portfolioModal.scrollTop = 0;
    document.body.style.overflow = "hidden";
  }

  function closePortfolioModal() {
    if (!portfolioModal || !portfolioOverlay) return;

    portfolioOverlay.classList.remove("visible");
    portfolioModal.classList.remove("visible");
    document.body.style.overflow = "";
  }

  // Card click handlers
  portfolioCards.forEach(function (card) {
    card.addEventListener("click", function () {
      var brandId = this.getAttribute("data-brand");
      openPortfolioModal(brandId);
    });
  });

  // Close button handler
  if (portfolioCloseBtn) {
    portfolioCloseBtn.addEventListener("click", closePortfolioModal);
  }

  // Close on overlay click
  if (portfolioOverlay) {
    portfolioOverlay.addEventListener("click", closePortfolioModal);
  }

  // Close on Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && portfolioModal.classList.contains("visible")) {
      closePortfolioModal();
    }
  });
})();
