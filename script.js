/* ==========================================================================
   Majordo — script du site
   ==========================================================================
   À MODIFIER ICI, ET SEULEMENT ICI :
   ========================================================================== */

/** Adresse du webhook n8n qui reçoit les demandes du formulaire (POST JSON).
 *  Remplacez "WEBHOOK_URL" par l'URL de production de votre nœud Webhook n8n,
 *  par exemple : "https://votre-instance.app.n8n.cloud/webhook/majordo-contact" */
const WEBHOOK_URL = "WEBHOOK_URL";

/** Coordonnées affichées sur tout le site (accueil + mentions légales).
 *  Laissez telephone vide ("") pour ne pas l'afficher. */
const CONTACT = {
  email: "andrea.co.08ecg@gmail.com", // à remplacer plus tard par contact@majordo.fr
  telephone: "",                      // ex. "06 12 34 56 78"
};

/* ========================================================================== */

(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------- Coordonnées ---------- */
  function fillContact() {
    $$("[data-contact-email]").forEach((el) => {
      if (!CONTACT.email) return;
      el.href = "mailto:" + CONTACT.email;
      if (!el.hasAttribute("data-keep-text")) el.textContent = CONTACT.email;
    });
    if (CONTACT.telephone) {
      const tel = CONTACT.telephone.replace(/[^\d+]/g, "");
      $$("[data-contact-phone]").forEach((el) => {
        el.href = "tel:" + tel;
        el.textContent = CONTACT.telephone;
      });
      $$("[data-contact-phone-wrap]").forEach((el) => (el.hidden = false));
    }
  }

  /* ---------- Année du pied de page ---------- */
  function fillYear() {
    const y = String(new Date().getFullYear());
    $$("[data-year]").forEach((el) => (el.textContent = y));
  }

  /* ---------- Thème clair / sombre ---------- */
  function initTheme() {
    const btn = $("[data-theme-toggle]");
    if (!btn) return;
    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const current = () => root.getAttribute("data-theme") || (mq.matches ? "dark" : "light");
    const sync = () => {
      const dark = current() === "dark";
      btn.setAttribute("aria-label", dark ? "Activer le mode clair" : "Activer le mode sombre");
    };
    btn.addEventListener("click", () => {
      const next = current() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("majordo-theme", next); } catch (e) { /* stockage indisponible */ }
      sync();
    });
    if (mq.addEventListener) mq.addEventListener("change", sync);
    sync();
  }

  /* ---------- En-tête : filet au défilement ---------- */
  function initHeader() {
    const header = $(".site-header");
    if (!header) return;
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Sélecteur de formule ---------- */
  function initBilling() {
    const group = $("[data-billing]");
    if (!group) return;
    const apply = (mode) => {
      $$("[data-flex][data-commit]").forEach((el) => {
        const value = el.getAttribute(mode === "commit" ? "data-commit" : "data-flex");
        if (el.textContent === value) return;
        el.textContent = value;
        el.classList.remove("price-swap");
        void el.offsetWidth; // relance l'animation
        el.classList.add("price-swap");
      });
    };
    group.addEventListener("change", (e) => {
      if (e.target && e.target.name === "billing") apply(e.target.value);
    });
    const checked = $("input[name='billing']:checked", group);
    if (checked) apply(checked.value);
  }

  /* ---------- Calculateur ---------- */
  function formatHours(totalMinutes) {
    const m = Math.round(totalMinutes);
    const h = Math.floor(m / 60);
    const min = m % 60;
    if (h === 0) return min + " min";
    return min === 0 ? h + " h" : h + " h " + String(min).padStart(2, "0");
  }

  function initCalc() {
    const form = $("[data-calc]");
    if (!form) return;
    const msg = $("#calc-messages");
    const min = $("#calc-minutes");
    const out = $("[data-calc-hours]");
    const sub = $("[data-calc-sub]");

    const num = (input) => {
      const v = parseFloat(String(input.value).replace(",", "."));
      if (!isFinite(v) || v < 0) return 0;
      return Math.min(v, parseFloat(input.max) || v);
    };

    const update = () => {
      const perDay = num(msg) * num(min);   // minutes par jour
      const perMonth = perDay * 30;         // sur 30 jours
      const perWeek = perDay * 7;
      out.textContent = formatHours(perMonth);
      sub.textContent = perMonth > 0
        ? "soit environ " + formatHours(perWeek) + " par semaine"
        : "";
    };

    // Les curseurs et les champs numériques restent synchronisés
    $$("[data-sync]", form).forEach((range) => {
      const target = document.getElementById(range.getAttribute("data-sync"));
      range.addEventListener("input", () => { target.value = range.value; update(); });
      target.addEventListener("input", () => {
        const v = parseFloat(String(target.value).replace(",", "."));
        if (isFinite(v)) range.value = Math.min(Math.max(v, range.min), range.max);
        update();
      });
    });
    update();
  }

  /* ---------- Formulaire de contact ---------- */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_RE = /^\+?[\d\s.\-()]{8,20}$/;

  function initContactForm() {
    const form = $("[data-contact-form]");
    if (!form) return;
    const status = $("[data-form-status]", form);
    const submit = $("[data-submit]", form);
    const submitLabel = submit.textContent;

    // Le bouton « En parler » d'une formule pré-remplit le message
    $$("[data-plan-link]").forEach((link) => {
      link.addEventListener("click", () => {
        const msg = $("#f-message");
        if (msg && !msg.value.trim()) msg.value = "Je m'intéresse à la formule " + link.getAttribute("data-plan-link") + ".";
      });
    });

    const fields = {
      nom: {
        el: $("#f-nom"),
        check: (v) => (v.trim().length >= 2 ? "" : "Indiquez votre nom."),
      },
      etablissement: {
        el: $("#f-etab"),
        check: (v) => (v.trim().length >= 2 ? "" : "Indiquez le nom de votre établissement."),
      },
      logements: {
        el: $("#f-logements"),
        check: (v) => {
          const n = Number(v);
          if (v.trim() === "") return "Indiquez le nombre de logements.";
          if (!Number.isInteger(n) || n < 1 || n > 2000) return "Indiquez un nombre entier, par exemple 7.";
          return "";
        },
      },
      contact: {
        el: $("#f-contact"),
        check: (v) => {
          const s = v.trim();
          if (!s) return "Indiquez un email ou un numéro de téléphone.";
          if (s.includes("@")) return EMAIL_RE.test(s) ? "" : "Cet email ne semble pas valide.";
          const digits = s.replace(/\D/g, "");
          return PHONE_RE.test(s) && digits.length >= 9 && digits.length <= 15
            ? ""
            : "Indiquez un email valide ou un numéro de téléphone (au moins 9 chiffres).";
        },
      },
    };

    const showError = (name, message) => {
      const f = fields[name];
      const err = document.getElementById(f.el.id + "-err");
      f.el.setAttribute("aria-invalid", message ? "true" : "false");
      if (err) err.textContent = message;
    };

    Object.keys(fields).forEach((name) => {
      const f = fields[name];
      f.el.addEventListener("blur", () => {
        if (f.el.value !== "") showError(name, f.check(f.el.value));
      });
      f.el.addEventListener("input", () => {
        if (f.el.getAttribute("aria-invalid") === "true") showError(name, f.check(f.el.value));
      });
    });

    const setStatus = (type, title, text) => {
      status.className = "form-status" + (type ? " is-" + type : "");
      status.innerHTML = "";
      if (!type) return;
      const strong = document.createElement("strong");
      strong.textContent = title;
      status.appendChild(strong);
      const span = document.createElement("span");
      span.textContent = text;
      status.appendChild(span);
    };

    const fallbackText = () =>
      CONTACT.email ? " Vous pouvez aussi écrire directement à " + CONTACT.email + "." : "";

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      setStatus(null);

      // Validation
      let firstInvalid = null;
      Object.keys(fields).forEach((name) => {
        const msg = fields[name].check(fields[name].el.value);
        showError(name, msg);
        if (msg && !firstInvalid) firstInvalid = fields[name].el;
      });
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      // Champ piège rempli : on fait semblant que tout va bien
      if ($("#f-site").value) {
        form.reset();
        setStatus("success", "Merci, votre demande est bien partie.", "");
        return;
      }

      if (!/^https:\/\//i.test(WEBHOOK_URL)) {
        setStatus("error", "Le formulaire n'est pas encore branché.", "Votre message n'a pas été envoyé." + fallbackText());
        status.focus();
        return;
      }

      const contactValue = fields.contact.el.value.trim();
      const payload = {
        nom: fields.nom.el.value.trim(),
        etablissement: fields.etablissement.el.value.trim(),
        logements: Number(fields.logements.el.value),
        contact: contactValue,
        contact_type: contactValue.includes("@") ? "email" : "telephone",
        message: $("#f-message").value.trim(),
        page: window.location.href,
        envoye_le: new Date().toISOString(),
        source: "site-majordo",
      };

      submit.disabled = true;
      submit.textContent = "Envoi en cours…";

      const controller = "AbortController" in window ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), 15000) : null;

      try {
        const res = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller ? controller.signal : undefined,
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        form.reset();
        Object.keys(fields).forEach((name) => fields[name].el.removeAttribute("aria-invalid"));
        setStatus(
          "success",
          "Merci, votre demande est bien partie.",
          "Je reviens vers vous rapidement pour convenir d'un créneau de 30 minutes."
        );
      } catch (err) {
        const timeout = err && err.name === "AbortError";
        setStatus(
          "error",
          timeout ? "L'envoi prend trop de temps." : "Votre message n'a pas pu être envoyé.",
          "Vérifiez votre connexion et réessayez dans un instant." + fallbackText()
        );
      } finally {
        if (timer) clearTimeout(timer);
        submit.disabled = false;
        submit.textContent = submitLabel;
        status.focus();
      }
    });
  }

  /* ---------- Apparition douce au défilement ---------- */
  function initReveal() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;
    const targets = $$(".section-head, .split, .calc, .approach-cases, .blocks li, .plans, .extras, .timeline, .steps li, .refs, .promises li, .faq, .contact-grid > *");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    targets.forEach((el) => { el.classList.add("reveal"); io.observe(el); });
  }

  fillContact();
  fillYear();
  initTheme();
  initHeader();
  initBilling();
  initCalc();
  initContactForm();
  initReveal();
})();
