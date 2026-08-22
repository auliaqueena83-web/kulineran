/* ==========================================================
   KULINERAN — auth.js
   Validasi sederhana untuk halaman login.html & register.html.
   Catatan: ini validasi sisi-klien saja (belum ada backend
   sungguhan), jadi submit yang berhasil hanya menampilkan
   pesan sukses.
   ========================================================== */

(() => {
  "use strict";

  const USERS_KEY = "kulineran_users";

  function getUsers() {
    try {
      const value = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (e) {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function resolveUserByIdentifier(identifier) {
    const target = (identifier || "").trim().toLowerCase();
    if (!target) return null;

    return getUsers().find((user) => {
      const username = String(user.username || "").toLowerCase();
      const email = String(user.email || "").toLowerCase();
      return username === target || email === target || username === target.replace(/^@/, "");
    }) || null;
  }

  // Kalau sudah login, nggak perlu lihat form login/register lagi
  try {
    const session = JSON.parse(localStorage.getItem("kulineran_session"));
    if (session && session.loggedIn && (document.getElementById("loginForm") || document.getElementById("registerForm"))) {
      window.location.href = "index.html";
      return;
    }
  } catch (e) { /* abaikan kalau data rusak */ }

  // ---------- toggle lihat/sembunyikan kata sandi ----------
  document.querySelectorAll(".password-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.dataset.target);
      if (!target) return;
      const isHidden = target.type === "password";
      target.type = isHidden ? "text" : "password";
      btn.classList.toggle("is-visible", isHidden);
      btn.setAttribute("aria-label", isHidden ? "Sembunyikan kata sandi" : "Tampilkan kata sandi");
    });
  });

  function showError(inputEl, errorEl, message) {
    inputEl.classList.add("has-error");
    errorEl.textContent = message;
    errorEl.hidden = false;
  }
  function clearError(inputEl, errorEl) {
    inputEl.classList.remove("has-error");
    errorEl.hidden = true;
    errorEl.textContent = "";
  }
  function showFormMsg(el, message, type) {
    el.textContent = message;
    el.className = "form-msg " + (type === "success" ? "form-msg-success" : "form-msg-error");
    el.hidden = false;
  }
  const isValidEmailish = (v) => v.includes("@") || v.trim().length >= 3;
  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  // ---------- LOGIN ----------
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    const emailInput = document.getElementById("loginEmail");
    const emailError = document.getElementById("loginEmailError");
    const passInput = document.getElementById("loginPassword");
    const passError = document.getElementById("loginPasswordError");
    const msg = document.getElementById("loginMsg");

    document.getElementById("forgotLink").addEventListener("click", (e) => {
      e.preventDefault();
      showFormMsg(msg, "Fitur reset kata sandi belum tersedia di versi demo ini.", "error");
    });

    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      let valid = true;

      if (!emailInput.value.trim() || !isValidEmailish(emailInput.value)) {
        showError(emailInput, emailError, "Masukkan email atau username yang valid.");
        valid = false;
      } else clearError(emailInput, emailError);

      if (!passInput.value || passInput.value.length < 6) {
        showError(passInput, passError, "Kata sandi minimal 6 karakter.");
        valid = false;
      } else clearError(passInput, passError);

      if (!valid) {
        showFormMsg(msg, "Ada isian yang perlu diperbaiki dulu, ya.", "error");
        return;
      }

      const identifier = emailInput.value.trim();
      const matchedUser = resolveUserByIdentifier(identifier);
      const sessionUser = matchedUser || {
        name: identifier.includes("@") ? identifier.split("@")[0] : identifier,
        username: identifier.startsWith("@") ? identifier.slice(1) : identifier,
        email: identifier.includes("@") ? identifier : "",
      };

      localStorage.setItem("kulineran_session", JSON.stringify({
        loggedIn: true,
        name: sessionUser.name || sessionUser.username || "Kamu",
        username: sessionUser.username || sessionUser.name || "kamu",
        email: sessionUser.email || "",
        displayName: sessionUser.name || sessionUser.username || "Kamu",
        loginAt: Date.now(),
      }));

      showFormMsg(msg, "Berhasil masuk! Mengarahkan ke etalase rasa...", "success");
      loginForm.querySelector("button[type=submit]").disabled = true;
      setTimeout(() => { window.location.href = "index.html"; }, 900);
    });
  }

  // ---------- REGISTER ----------
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    const nameInput = document.getElementById("regName");
    const nameError = document.getElementById("regNameError");
    const userInput = document.getElementById("regUsername");
    const userError = document.getElementById("regUsernameError");
    const emailInput = document.getElementById("regEmail");
    const emailError = document.getElementById("regEmailError");
    const passInput = document.getElementById("regPassword");
    const passError = document.getElementById("regPasswordError");
    const passConfirmInput = document.getElementById("regPasswordConfirm");
    const passConfirmError = document.getElementById("regPasswordConfirmError");
    const agreeInput = document.getElementById("agreeTerms");
    const msg = document.getElementById("registerMsg");

    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      let valid = true;

      if (!nameInput.value.trim()) {
        showError(nameInput, nameError, "Nama lengkap wajib diisi.");
        valid = false;
      } else clearError(nameInput, nameError);

      if (!userInput.value.trim() || userInput.value.trim().length < 3) {
        showError(userInput, userError, "Username minimal 3 karakter.");
        valid = false;
      } else clearError(userInput, userError);

      if (!emailInput.value.trim() || !isValidEmail(emailInput.value.trim())) {
        showError(emailInput, emailError, "Masukkan alamat email yang valid.");
        valid = false;
      } else clearError(emailInput, emailError);

      if (!passInput.value || passInput.value.length < 8) {
        showError(passInput, passError, "Kata sandi minimal 8 karakter.");
        valid = false;
      } else clearError(passInput, passError);

      if (passConfirmInput.value !== passInput.value || !passConfirmInput.value) {
        showError(passConfirmInput, passConfirmError, "Konfirmasi kata sandi tidak cocok.");
        valid = false;
      } else clearError(passConfirmInput, passConfirmError);

      if (!agreeInput.checked) {
        showFormMsg(msg, "Kamu perlu menyetujui syarat & ketentuan dulu.", "error");
        valid = false;
      }

      if (!valid) {
        if (agreeInput.checked) showFormMsg(msg, "Ada isian yang perlu diperbaiki dulu, ya.", "error");
        return;
      }

      const sanitizedUsername = userInput.value.trim().replace(/^@/, "");
      const currentUsers = getUsers();
      const nextUsers = [...currentUsers, {
        name: nameInput.value.trim(),
        username: sanitizedUsername,
        email: emailInput.value.trim(),
      }];
      saveUsers(nextUsers);

      localStorage.setItem("kulineran_session", JSON.stringify({
        loggedIn: true,
        name: nameInput.value.trim(),
        username: sanitizedUsername,
        email: emailInput.value.trim(),
        displayName: nameInput.value.trim(),
        loginAt: Date.now(),
      }));

      showFormMsg(msg, "Akun berhasil dibuat! Mengarahkan ke etalase rasa...", "success");
      registerForm.querySelector("button[type=submit]").disabled = true;
      setTimeout(() => { window.location.href = "index.html"; }, 1000);
    });
  }
})();