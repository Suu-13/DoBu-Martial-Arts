/* ==========================================================
   DoBu Martial Arts — shared site script
   Handles: mobile nav toggle, tabbed panels (.tab-button /
   .tab-panel), and marks the current page's nav link active.
   Include this one file on every page via:
   <script src="script.js" defer></script>
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initNavToggle();
  initTabs();
  initClassSchedule();
  markActiveNavLink();
  initRegisterForm();
  initLoginForm();
  initDashboard();
  initPricingButtons();
  initClassBooking();
  initCommunityForum();
  initShareButton();
  initContactForm();
  highlightTodayHours();
});

/* ---------- Mobile nav toggle ----------
   Flips body[data-nav-open] between "true"/"false", which the
   CSS uses to show/hide .site-nav on small screens. */
function initNavToggle() {
  const toggle = document.querySelector(".nav-toggle");
  if (!toggle) return;

  toggle.addEventListener("click", () => {
    const isOpen = document.body.getAttribute("data-nav-open") === "true";
    document.body.setAttribute("data-nav-open", String(!isOpen));
    toggle.setAttribute("aria-expanded", String(!isOpen));
  });

  // Close the menu automatically when a nav link is tapped
  document.querySelectorAll(".nav-list .nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      document.body.setAttribute("data-nav-open", "false");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* ---------- Tabbed panels ----------
   Works with any group wrapped in [data-tab-group], containing
   .tab-button elements (data-tab="id") and matching
   .tab-panel elements (id="id"). Supports multiple independent
   tab groups on the same page. */
function initTabs() {
  document.querySelectorAll("[data-tab-group]").forEach((group) => {
    const buttons = group.querySelectorAll(".tab-button");
    const panelsWrap = document.querySelector(
      group.getAttribute("data-panels-target") || "body"
    );

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const targetId = button.getAttribute("data-tab");

        buttons.forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        });
        button.classList.add("active");
        button.setAttribute("aria-selected", "true");

        panelsWrap.querySelectorAll(".tab-panel").forEach((panel) => {
          panel.hidden = panel.id !== targetId;
        });
      });
    });
  });
}

/* ---------- Classes timetable + modal ----------
   Filters the timetable cards by discipline without reloading
   the page and opens a detail modal when a class is clicked. */
function initClassSchedule() {
  const pageRoot = document.body;
  if (!pageRoot || pageRoot.getAttribute("data-page") !== "classes-pricing") return;

  const filterButtons = Array.from(document.querySelectorAll("[data-class-filter]"));
  const cards = Array.from(document.querySelectorAll(".schedule-card"));
  const feedback = document.querySelector("[data-filter-feedback]");
  const modal = document.querySelector("[data-schedule-modal]");
  const modalTitle = document.getElementById("schedule-modal-title");

  if (!filterButtons.length || !cards.length || !modal || !modalTitle) return;

  const modalStatus = modal.querySelector('[data-detail="status"]');
  const detailFields = {
    discipline: modal.querySelector('[data-detail="discipline"]'),
    instructor: modal.querySelector('[data-detail="instructor"]'),
    day: modal.querySelector('[data-detail="day"]'),
    start: modal.querySelector('[data-detail="start"]'),
    end: modal.querySelector('[data-detail="end"]'),
    capacity: modal.querySelector('[data-detail="capacity"]'),
    enrolled: modal.querySelector('[data-detail="enrolled"]'),
    statusText: modal.querySelector('[data-detail="statusText"]'),
  };

  let lastFocusedCard = null;

  function formatFilterMessage(filter, visibleCount) {
    if (filter === "all") {
      return "Showing all disciplines across the full weekly timetable.";
    }

    const activeButton = filterButtons.find((button) => button.getAttribute("data-class-filter") === filter);
    const label = activeButton ? activeButton.textContent.trim() : "Selected discipline";
    const plural = visibleCount === 1 ? "class" : "classes";
    return `Showing ${visibleCount} ${plural} for ${label}.`;
  }

  function applyFilter(filter) {
    let visibleCount = 0;

    cards.forEach((card) => {
      const matches = filter === "all" || card.getAttribute("data-discipline") === filter;
      card.classList.toggle("is-hidden", !matches);
      card.setAttribute("aria-hidden", String(!matches));
      card.tabIndex = matches ? 0 : -1;

      if (matches) {
        visibleCount += 1;
      }
    });

    if (feedback) {
      feedback.textContent = formatFilterMessage(filter, visibleCount);
    }
  }

  function setStatusAppearance(statusText) {
    const normalized = statusText.toLowerCase();
    modalStatus.textContent = statusText;
    modalStatus.className = "schedule-modal__status";
    modalStatus.classList.add(`status-${normalized}`);
  }

  function openModal(card) {
    lastFocusedCard = card;
    modal.hidden = false;
    document.body.style.overflow = "hidden";

    modalTitle.textContent = card.getAttribute("data-class-name") || "Class details";
    detailFields.discipline.textContent = card.getAttribute("data-discipline-label") || "";
    detailFields.instructor.textContent = card.getAttribute("data-instructor") || "";
    detailFields.day.textContent = card.getAttribute("data-day") || "";
    detailFields.start.textContent = card.getAttribute("data-start") || "";
    detailFields.end.textContent = card.getAttribute("data-end") || "";
    detailFields.capacity.textContent = card.getAttribute("data-capacity") || "";
    detailFields.enrolled.textContent = card.getAttribute("data-enrolled") || "";

    const statusText = card.getAttribute("data-status") || "Open";
    detailFields.statusText.textContent = statusText;
    setStatusAppearance(statusText);

    const closeButton = modal.querySelector(".schedule-modal__close");
    if (closeButton) {
      closeButton.focus();
    }
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    if (lastFocusedCard) {
      lastFocusedCard.focus();
    }
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyFilter(button.getAttribute("data-class-filter") || "all");
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      if (!card.classList.contains("is-hidden")) {
        openModal(card);
      }
    });
  });

  modal.querySelectorAll("[data-modal-close]").forEach((element) => {
    element.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) {
      closeModal();
    }
  });

  const activeFilterButton = filterButtons.find((button) => button.classList.contains("active"));
  applyFilter(activeFilterButton ? activeFilterButton.getAttribute("data-class-filter") || "all" : "all");

  /* ---- Deep-link from martial-arts.html ----
     If the URL contains ?discipline=karate (or judo / boxing /
     kickboxing / selfdefence), auto-activate that tab and scroll
     the classes section into view. */
  const params = new URLSearchParams(window.location.search);
  const deepDiscipline = params.get("discipline");
  if (deepDiscipline) {
    const targetBtn = filterButtons.find(
      (b) => b.getAttribute("data-class-filter") === deepDiscipline
    );
    if (targetBtn) {
      targetBtn.click(); // activates tab + applies filter
      const classesSection = document.getElementById("classes");
      if (classesSection) {
        setTimeout(() => {
          classesSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
      }
    }
  }
}

/* ---------- Active nav link ----------
   Reads body[data-page] and highlights the matching .nav-link
   so every page shows the right item as active without manual
   editing per file. */
function markActiveNavLink() {
  const page = document.body.getAttribute("data-page") || "home";
  document.querySelectorAll(".nav-list .nav-link").forEach((link) => {
    if (link.getAttribute("data-nav-id") === page) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

/* ==========================================================
   Account simulation (no backend)
   Everything below stores plain demo data in localStorage
   just to fake persistence between pages. Never do this with
   real passwords in a production app.
   ========================================================== */

const STORAGE_KEYS = {
  account: "dobuAccount",
  session: "dobuSession",
  membership: "dobuMembership",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getStoredAccount() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.account));
  } catch {
    return null;
  }
}

function setFieldError(inputRow, errorEl, message) {
  if (message) {
    inputRow.classList.add("has-error");
    errorEl.textContent = message;
  } else {
    inputRow.classList.remove("has-error");
    errorEl.textContent = "";
  }
}

/* ---------- Register form ---------- */
function initRegisterForm() {
  const form = document.getElementById("register-form");
  if (!form) return;

  const status = document.getElementById("register-status");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const nameInput = form.querySelector("#name");
    const emailInput = form.querySelector("#email");
    const passwordInput = form.querySelector("#password");
    const confirmInput = form.querySelector("#confirm-password");

    let isValid = true;

    // Name
    if (!nameInput.value.trim()) {
      setFieldError(nameInput.closest(".input-row"), document.getElementById("name-error"), "Enter your full name.");
      isValid = false;
    } else {
      setFieldError(nameInput.closest(".input-row"), document.getElementById("name-error"), "");
    }

    // Email
    if (!emailInput.value.trim()) {
      setFieldError(emailInput.closest(".input-row"), document.getElementById("email-error"), "Enter your email address.");
      isValid = false;
    } else if (!EMAIL_PATTERN.test(emailInput.value.trim())) {
      setFieldError(emailInput.closest(".input-row"), document.getElementById("email-error"), "Enter a valid email address.");
      isValid = false;
    } else {
      setFieldError(emailInput.closest(".input-row"), document.getElementById("email-error"), "");
    }

    // Password
    if (!passwordInput.value) {
      setFieldError(passwordInput.closest(".input-row"), document.getElementById("password-error"), "Enter a password.");
      isValid = false;
    } else if (passwordInput.value.length < 6) {
      setFieldError(passwordInput.closest(".input-row"), document.getElementById("password-error"), "Use at least 6 characters.");
      isValid = false;
    } else {
      setFieldError(passwordInput.closest(".input-row"), document.getElementById("password-error"), "");
    }

    // Confirm password
    if (!confirmInput.value) {
      setFieldError(confirmInput.closest(".input-row"), document.getElementById("confirm-password-error"), "Confirm your password.");
      isValid = false;
    } else if (confirmInput.value !== passwordInput.value) {
      setFieldError(confirmInput.closest(".input-row"), document.getElementById("confirm-password-error"), "Passwords do not match.");
      isValid = false;
    } else {
      setFieldError(confirmInput.closest(".input-row"), document.getElementById("confirm-password-error"), "");
    }

    if (!isValid) {
      status.textContent = "Please fix the highlighted fields.";
      status.className = "form-status error";
      return;
    }

    const account = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim().toLowerCase(),
      password: passwordInput.value,
    };

    localStorage.setItem(STORAGE_KEYS.account, JSON.stringify(account));

    status.textContent = "Account created! Redirecting to login…";
    status.className = "form-status success";

    setTimeout(() => {
      window.location.href = "login.html?registered=1";
    }, 900);
  });
}

/* ---------- Login form ---------- */
function initLoginForm() {
  const form = document.getElementById("login-form");
  if (!form) return;

  const status = document.getElementById("login-status");

  // If we just arrived from a successful registration, say so.
  const params = new URLSearchParams(window.location.search);
  if (params.get("registered") === "1") {
    status.textContent = "Account created. Log in with your new details.";
    status.className = "form-status success";
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const emailInput = form.querySelector("#login-email");
    const passwordInput = form.querySelector("#login-password");

    let isValid = true;

    if (!emailInput.value.trim()) {
      setFieldError(emailInput.closest(".input-row"), document.getElementById("login-email-error"), "Enter your email address.");
      isValid = false;
    } else if (!EMAIL_PATTERN.test(emailInput.value.trim())) {
      setFieldError(emailInput.closest(".input-row"), document.getElementById("login-email-error"), "Enter a valid email address.");
      isValid = false;
    } else {
      setFieldError(emailInput.closest(".input-row"), document.getElementById("login-email-error"), "");
    }

    if (!passwordInput.value) {
      setFieldError(passwordInput.closest(".input-row"), document.getElementById("login-password-error"), "Enter your password.");
      isValid = false;
    } else {
      setFieldError(passwordInput.closest(".input-row"), document.getElementById("login-password-error"), "");
    }

    if (!isValid) {
      status.textContent = "Please fix the highlighted fields.";
      status.className = "form-status error";
      return;
    }

    const account = getStoredAccount();
    const enteredEmail = emailInput.value.trim().toLowerCase();

    if (!account) {
      status.textContent = "No account found yet. Create one first.";
      status.className = "form-status error";
      return;
    }

    if (account.email !== enteredEmail || account.password !== passwordInput.value) {
      status.textContent = "Email or password is incorrect.";
      status.className = "form-status error";
      return;
    }

    localStorage.setItem(STORAGE_KEYS.session, "true");
    status.textContent = "Logged in! Redirecting…";
    status.className = "form-status success";

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 600);
  });
}

/* ---------- Dashboard ---------- */
function defaultMembership() {
  const renewal = new Date();
  renewal.setMonth(renewal.getMonth() + 1);

  return {
    plan: "Monthly",
    status: "Active",
    renewalDate: renewal.toISOString().slice(0, 10),
    bookedClasses: [],
  };
}

const PLAN_ORDER = ["Monthly", "Quarterly", "Annual"];

/* ---------- Pricing page plan buttons ----------
   When a logged-in user picks a plan (Monthly / Quarterly / Annual)
   or clicks Book A Free Trial, we save the choice to localStorage
   and redirect them to their dashboard. Guests are sent to login first. */
function getRenewalDate(plan) {
  const d = new Date();
  if (plan === "Monthly")   d.setMonth(d.getMonth() + 1);
  else if (plan === "Quarterly") d.setMonth(d.getMonth() + 3);
  else if (plan === "Annual")    d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

function initPricingButtons() {
  const planButtons = document.querySelectorAll("[data-plan]");
  if (!planButtons.length) return;

  planButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Guard: must be logged in
      if (localStorage.getItem(STORAGE_KEYS.session) !== "true") {
        window.location.href = "login.html";
        return;
      }

      const plan = btn.getAttribute("data-plan");
      const membership = getMembership();

      if (plan === "FreeTrial") {
        // Add a free trial entry if not already booked
        const alreadyBooked = membership.bookedClasses.some(
          (c) => c.name === "Free Trial Session"
        );
        if (!alreadyBooked) {
          membership.bookedClasses.unshift({
            name: "Free Trial Session",
            day: "Contact us to arrange",
            time: "",
          });
        }
        saveMembership(membership);
      } else {
        // Update plan and renewal date
        membership.plan = plan;
        membership.renewalDate = getRenewalDate(plan);
        if (membership.status === "Cancelled") {
          membership.status = "Active";
        }
        saveMembership(membership);
      }

      // Visual feedback before redirect
      btn.textContent = plan === "FreeTrial" ? "Booked! Redirecting…" : "Plan Selected! Redirecting…";
      btn.disabled = true;

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 700);
    });
  });
}

function initClassBooking() {
  const bookButtons = document.querySelectorAll("[data-book-class]");
  if (!bookButtons.length) return;

  bookButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (localStorage.getItem(STORAGE_KEYS.session) !== "true") {
        window.location.href = "login.html";
        return;
      }

      const className = btn.getAttribute("data-book-class");
      const membership = getMembership();

      const alreadyBooked = membership.bookedClasses.some(
        (c) => c.name === `${className} Session`
      );
      if (!alreadyBooked) {
        membership.bookedClasses.unshift({
          name: `${className} Session`,
          day: "Contact us to arrange",
          time: "",
        });
        saveMembership(membership);
      }

      btn.textContent = "Booked! Redirecting…";
      btn.disabled = true;

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 700);
    });
  });
}

function saveMembership(membership) {
  localStorage.setItem(STORAGE_KEYS.membership, JSON.stringify(membership));
}

function getMembership() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.membership));
    if (stored) return stored;
  } catch {
    /* fall through to default */
  }
  const fresh = defaultMembership();
  saveMembership(fresh);
  return fresh;
}

function renderMembership(membership, elements) {
  elements.planEl.textContent = membership.plan;
  elements.renewalEl.textContent = membership.renewalDate;

  elements.statusEl.textContent = membership.status;
  elements.statusEl.classList.remove("status-active", "status-cancelled");
  elements.statusEl.classList.add(
    membership.status === "Active" ? "status-active" : "status-cancelled"
  );

  const classesThisWeekEl = document.getElementById("classes-this-week");
  if (classesThisWeekEl) {
    classesThisWeekEl.textContent = membership.bookedClasses.length;
  }

  elements.classesListEl.innerHTML = "";
  if (membership.bookedClasses.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No classes booked yet.";
    li.style.color = "var(--muted)";
    elements.classesListEl.appendChild(li);
  } else {
    membership.bookedClasses.forEach((cls) => {
      const li = document.createElement("li");
      li.textContent = `${cls.name} — ${cls.day}, ${cls.time}`;
      elements.classesListEl.appendChild(li);
    });
  }

  elements.upgradeBtn.disabled = membership.status === "Cancelled";
  elements.cancelBtn.textContent =
    membership.status === "Cancelled" ? "Reactivate Membership" : "Cancel Membership";
}

function initDashboard() {
  const root = document.querySelector("[data-dashboard]");
  if (!root) return;

  if (localStorage.getItem(STORAGE_KEYS.session) !== "true") {
    window.location.href = "login.html";
    return;
  }

  const account = getStoredAccount();
  const nameEl = document.getElementById("member-name");
  if (nameEl && account) {
    nameEl.textContent = account.name;
  }

  const elements = {
    planEl: document.getElementById("membership-plan"),
    statusEl: document.getElementById("membership-status"),
    renewalEl: document.getElementById("membership-renewal"),
    classesListEl: document.getElementById("booked-classes"),
    upgradeBtn: document.getElementById("upgrade-btn"),
    cancelBtn: document.getElementById("cancel-btn"),
  };

  let membership = getMembership();
  renderMembership(membership, elements);

  const actionStatus = document.getElementById("membership-action-status");

  elements.upgradeBtn.addEventListener("click", () => {
    const currentIndex = PLAN_ORDER.indexOf(membership.plan);
    if (currentIndex === PLAN_ORDER.length - 1) {
      actionStatus.textContent = "You're already on the top plan (Annual).";
      actionStatus.className = "form-status";
      return;
    }
    membership.plan = PLAN_ORDER[currentIndex + 1];
    saveMembership(membership);
    renderMembership(membership, elements);
    actionStatus.textContent = `Upgraded to the ${membership.plan} plan.`;
    actionStatus.className = "form-status success";
  });

  elements.cancelBtn.addEventListener("click", () => {
    if (membership.status === "Cancelled") {
      membership.status = "Active";
      saveMembership(membership);
      renderMembership(membership, elements);
      actionStatus.textContent = "Membership reactivated.";
      actionStatus.className = "form-status success";
    } else {
      membership.status = "Cancelled";
      saveMembership(membership);
      renderMembership(membership, elements);
      actionStatus.textContent = "Membership cancelled. You can reactivate anytime.";
      actionStatus.className = "form-status error";
    }
  });

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEYS.session);
      window.location.href = "login.html";
    });
  }
}

/* ==========================================================
   Community forum (in-memory, no backend)
   Sample threads live in a JS array and are rendered into the
   page with DOM methods. New threads submitted via the form
   are appended to that same array and re-rendered — nothing
   is sent anywhere or saved between page loads.
   ========================================================== */

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function initCommunityForum() {
  const list = document.getElementById("thread-list");
  if (!list) return;

  const samplePosts = [
    {
      id: 1,
      title: "Best warm-up before a Karate class?",
      author: "Thiri A.",
      message: "What does everyone do in the 10 minutes before class starts?",
      replies: 6,
    },
    {
      id: 2,
      title: "Anyone training for the Judo grading in September?",
      author: "Kyaw M.",
      message: "Looking for a partner to drill throws with a couple times a week.",
      replies: 11,
    },
    {
      id: 3,
      title: "Kickboxing conditioning class was brutal today",
      author: "Nandar S.",
      message: "That Saturday 9am class nearly finished me. Recovery tips?",
      replies: 4,
    },
    {
      id: 4,
      title: "Self-Defence workshop — bring a friend?",
      author: "Zayar H.",
      message: "Can I bring a non-member friend to the Sunday workshop?",
      replies: 2,
    },
  ];

  let posts = [...samplePosts];
  let nextId = posts.length + 1;

  function renderThreads() {
    list.innerHTML = "";

    posts.forEach((post) => {
      const article = document.createElement("article");
      article.className = "card thread-card";
      article.innerHTML = `
        <h3 class="card-title">${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.message)}</p>
        <div class="thread-meta">
          <span>Started by ${escapeHtml(post.author)}</span>
          <span class="pill">${post.replies} ${post.replies === 1 ? "Reply" : "Replies"}</span>
        </div>
        <div class="button-row">
          <button type="button" class="button button-secondary reply-btn" data-id="${post.id}">Reply</button>
        </div>
      `;
      list.appendChild(article);
    });

    list.querySelectorAll(".reply-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.getAttribute("data-id"));
        const post = posts.find((p) => p.id === id);
        if (post) {
          post.replies += 1;
          renderThreads();
        }
      });
    });
  }

  renderThreads();

  const form = document.getElementById("new-thread-form");
  if (!form) return;

  const status = document.getElementById("thread-status");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const titleInput = form.querySelector("#thread-title");
    const authorInput = form.querySelector("#thread-author");
    const messageInput = form.querySelector("#thread-message");

    let isValid = true;

    if (!titleInput.value.trim()) {
      setFieldError(titleInput.closest(".input-row"), document.getElementById("thread-title-error"), "Give your thread a title.");
      isValid = false;
    } else {
      setFieldError(titleInput.closest(".input-row"), document.getElementById("thread-title-error"), "");
    }

    if (!authorInput.value.trim()) {
      setFieldError(authorInput.closest(".input-row"), document.getElementById("thread-author-error"), "Enter your name.");
      isValid = false;
    } else {
      setFieldError(authorInput.closest(".input-row"), document.getElementById("thread-author-error"), "");
    }

    if (!isValid) {
      status.textContent = "Please fix the highlighted fields.";
      status.className = "form-status error";
      return;
    }

    posts.unshift({
      id: nextId++,
      title: titleInput.value.trim(),
      author: authorInput.value.trim(),
      message: messageInput.value.trim() || "No additional details.",
      replies: 0,
    });

    renderThreads();
    form.reset();
    status.textContent = "Thread posted to the community board.";
    status.className = "form-status success";
  });
}

/* ---------- Share this page ---------- */
function initShareButton() {
  const btn = document.getElementById("share-btn");
  if (!btn) return;

  const status = document.getElementById("share-status");

  btn.addEventListener("click", async () => {
    const shareData = {
      title: document.title,
      text: "Check out the DoBu Martial Arts community.",
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled the share sheet — no error needed.
      }
      return;
    }

    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        status.textContent = "Link copied to clipboard.";
        status.className = "form-status success";
      } catch {
        status.textContent = "Couldn't copy automatically — copy the link from your address bar.";
        status.className = "form-status error";
      }
      return;
    }

    status.textContent = "Copy this page's link from your address bar to share it.";
    status.className = "form-status";
  });
}

/* ==========================================================
   Contact / booking form (no backend)
   Validates the fields, then simulates a successful submission.
   ========================================================== */

const PHONE_PATTERN = /^[0-9+\-\s()]{7,20}$/;

function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const status = document.getElementById("contact-status");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const nameInput = form.querySelector("#contact-name");
    const emailInput = form.querySelector("#contact-email");
    const phoneInput = form.querySelector("#contact-phone");
    const classInput = form.querySelector("#contact-class");
    const messageInput = form.querySelector("#contact-message");

    let isValid = true;

    if (!nameInput.value.trim()) {
      setFieldError(nameInput.closest(".input-row"), document.getElementById("contact-name-error"), "Enter your full name.");
      isValid = false;
    } else {
      setFieldError(nameInput.closest(".input-row"), document.getElementById("contact-name-error"), "");
    }

    if (!emailInput.value.trim()) {
      setFieldError(emailInput.closest(".input-row"), document.getElementById("contact-email-error"), "Enter your email address.");
      isValid = false;
    } else if (!EMAIL_PATTERN.test(emailInput.value.trim())) {
      setFieldError(emailInput.closest(".input-row"), document.getElementById("contact-email-error"), "Enter a valid email address.");
      isValid = false;
    } else {
      setFieldError(emailInput.closest(".input-row"), document.getElementById("contact-email-error"), "");
    }

    if (!phoneInput.value.trim()) {
      setFieldError(phoneInput.closest(".input-row"), document.getElementById("contact-phone-error"), "Enter a phone number.");
      isValid = false;
    } else if (!PHONE_PATTERN.test(phoneInput.value.trim())) {
      setFieldError(phoneInput.closest(".input-row"), document.getElementById("contact-phone-error"), "Enter a valid phone number.");
      isValid = false;
    } else {
      setFieldError(phoneInput.closest(".input-row"), document.getElementById("contact-phone-error"), "");
    }

    if (!classInput.value) {
      setFieldError(classInput.closest(".input-row"), document.getElementById("contact-class-error"), "Select a class you're interested in.");
      isValid = false;
    } else {
      setFieldError(classInput.closest(".input-row"), document.getElementById("contact-class-error"), "");
    }

    if (!messageInput.value.trim()) {
      setFieldError(messageInput.closest(".input-row"), document.getElementById("contact-message-error"), "Add a short message.");
      isValid = false;
    } else {
      setFieldError(messageInput.closest(".input-row"), document.getElementById("contact-message-error"), "");
    }

    if (!isValid) {
      status.textContent = "Please fix the highlighted fields.";
      status.className = "form-status error";
      return;
    }

    // No backend — this is where a real fetch() to a server would go.
    status.textContent = `Thanks, ${nameInput.value.trim()}! We'll get back to you within 24 hours.`;
    status.className = "form-status success";
    form.reset();
  });
}

/* ---------- Highlight today's row in the opening-hours table ---------- */
function highlightTodayHours() {
  const table = document.querySelector(".hours-table");
  if (!table) return;

  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const today = dayNames[new Date().getDay()];

  table.querySelectorAll("tbody tr").forEach((row) => {
    if (row.getAttribute("data-day") === today) {
      row.classList.add("is-today");
    }
  });
}
