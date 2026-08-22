/* ==========================================================
   KULINERAN — auth.js
   Validasi sederhana untuk halaman login.html & register.html.
   Catatan: ini validasi sisi-klien saja (belum ada backend
   sungguhan), jadi submit yang berhasil hanya menampilkan
   pesan sukses.
   ========================================================== */

(() => {
  "use strict";

  const AUTH_KEY = "kulineranLoggedIn";
  const USER_KEY = "kulineranUser";

  if (localStorage.getItem(AUTH_KEY) === "true") {
    const currentPath = window.location.pathname.split("/").pop();
    if (currentPath === "login.html" || currentPath === "register.html") {
      window.location.href = "index.html";
      return;
    }
  }

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

      const userName = emailInput.value.trim();
      localStorage.setItem(AUTH_KEY, "true");
      localStorage.setItem(USER_KEY, userName);

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

      const userName = userInput.value.trim();
      localStorage.setItem(AUTH_KEY, "true");
      localStorage.setItem(USER_KEY, userName);

      showFormMsg(msg, "Akun berhasil dibuat! Mengarahkan ke etalase rasa...", "success");
      registerForm.querySelector("button[type=submit]").disabled = true;
      setTimeout(() => { window.location.href = "index.html"; }, 1000);
    });
  }
})();