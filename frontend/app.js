/**
 * DCF // Decentralized Crowdfunding Application Logic
 * Phase 1: Authentication, Customer & Admin Portals
 */

import { CustomerDB, SessionManager } from "./db.js";

// Hardcoded Admin Identity & Credentials for Phase 1
const ADMIN_WALLET = "0xa7704bA93fE0A8e04E6E8Bfd760b0892ac71a319".toLowerCase();
const ADMIN_PASSWORD = "iamtheadmin";

// State
let provider = null;
let userAddress = null;

// Audio Feedback (Admin Retro Mode)
let audioCtx = null;
function playRetroBeep(freq = 600, type = "square", duration = 0.08) {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

// DOM Elements
const authView = document.getElementById("authView");
const customerView = document.getElementById("customerView");
const adminView = document.getElementById("adminView");
const authAlert = document.getElementById("authAlert");

// Tabs
const tabBtns = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

// Customer Forms & Displays
const custLoginForm = document.getElementById("custLoginForm");
const custRegisterForm = document.getElementById("custRegisterForm");
const adminLoginForm = document.getElementById("adminLoginForm");
const btnCustomerLogout = document.getElementById("btnCustomerLogout");
const custDisplayName = document.getElementById("custDisplayName");
const custProfileName = document.getElementById("custProfileName");
const custProfileEmail = document.getElementById("custProfileEmail");
const custProfileId = document.getElementById("custProfileId");
const custProfileJoined = document.getElementById("custProfileJoined");
const btnCustConnectWallet = document.getElementById("btnCustConnectWallet");
const custWalletStatusPill = document.getElementById("custWalletStatusPill");
const custConnectedWallet = document.getElementById("custConnectedWallet");

// Admin Elements
const btnAdminLogout = document.getElementById("btnAdminLogout");
const elNetworkStatus = document.getElementById("networkStatus");
const elBlockNumber = document.getElementById("blockNumber");

// View Navigation Router
function showView(viewName) {
  authView.classList.remove("active");
  customerView.classList.remove("active");
  adminView.classList.remove("active");

  if (viewName === "auth") {
    authView.classList.add("active");
  } else if (viewName === "customer") {
    customerView.classList.add("active");
    renderCustomerView();
  } else if (viewName === "admin") {
    adminView.classList.add("active");
    initAdminTerminal();
  }
}

function showAuthAlert(msg, type = "error") {
  authAlert.className = `auth-alert ${type}`;
  authAlert.innerText = msg;
  authAlert.classList.remove("hidden");
}

function clearAuthAlert() {
  authAlert.className = "auth-alert hidden";
  authAlert.innerText = "";
}

// Tab Switching
tabBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    clearAuthAlert();
    tabBtns.forEach(b => b.classList.remove("active"));
    tabContents.forEach(c => c.classList.remove("active"));

    btn.classList.add("active");
    const targetTab = btn.getAttribute("data-tab");
    document.getElementById(targetTab.replace("Tab", "Form")).classList.add("active");
  });
});

// Initialize App & Sessions
window.addEventListener("DOMContentLoaded", async () => {
  const session = SessionManager.getSession();
  if (session) {
    if (session.role === "admin") {
      showView("admin");
    } else if (session.role === "customer") {
      showView("customer");
    } else {
      showView("auth");
    }
  } else {
    showView("auth");
  }

  // Setup Web3 Provider
  if (window.ethereum) {
    provider = new ethers.BrowserProvider(window.ethereum);
    
    // Listen to account changes
    window.ethereum.on("accountsChanged", async (accounts) => {
      if (accounts.length > 0) {
        userAddress = accounts[0];
        const s = SessionManager.getSession();
        if (s && s.role === "customer") {
          setCustomerWalletConnected(userAddress);
        }
      }
    });

    // Listen to network changes
    window.ethereum.on("chainChanged", () => {
      window.location.reload();
    });
  }
});

// ---------------------------------------------------------------------------
// AUTHENTICATION LOGIC
// ---------------------------------------------------------------------------

// 1. Customer Login Submit
custLoginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAuthAlert();
  const email = document.getElementById("custLoginEmail").value;
  const password = document.getElementById("custLoginPassword").value;

  try {
    const customer = await CustomerDB.authenticate(email, password);
    SessionManager.setCustomerSession(customer);
    showView("customer");
  } catch (err) {
    showAuthAlert(err.message, "error");
  }
});

// 2. Customer Registration Submit
custRegisterForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAuthAlert();
  const fullName = document.getElementById("regFullName").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;

  try {
    const customer = await CustomerDB.register({ fullName, email, password });
    SessionManager.setCustomerSession(customer);
    showAuthAlert("Account created successfully! Redirecting...", "success");
    setTimeout(() => {
      showView("customer");
    }, 600);
  } catch (err) {
    showAuthAlert(err.message, "error");
  }
});

// 3. Admin Login Submit
adminLoginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  clearAuthAlert();
  const inputWallet = document.getElementById("adminWalletInput").value.trim().toLowerCase();
  const inputPassword = document.getElementById("adminPasswordInput").value;

  if (inputWallet !== ADMIN_WALLET) {
    showAuthAlert("Access Denied: Unrecognized Admin Wallet Address.", "error");
    return;
  }

  if (inputPassword !== ADMIN_PASSWORD) {
    showAuthAlert("Access Denied: Invalid Admin Authentication Password.", "error");
    return;
  }

  // Set Admin Session
  SessionManager.setAdminSession(inputWallet);
  showView("admin");
});

// Logout Handlers
btnCustomerLogout.addEventListener("click", () => {
  SessionManager.clearSession();
  showView("auth");
});

btnAdminLogout.addEventListener("click", () => {
  playRetroBeep(350, "sawtooth");
  SessionManager.clearSession();
  showView("auth");
});

// ---------------------------------------------------------------------------
// CUSTOMER PORTAL LOGIC
// ---------------------------------------------------------------------------
function renderCustomerView() {
  const session = SessionManager.getSession();
  if (!session || session.role !== "customer") {
    showView("auth");
    return;
  }

  const user = session.user;
  custDisplayName.innerText = user.fullName;
  custProfileName.innerText = user.fullName;
  custProfileEmail.innerText = user.email;
  custProfileId.innerText = user.id;
  custProfileJoined.innerText = new Date(user.createdAt).toLocaleDateString();

  if (user.walletAddress) {
    setCustomerWalletConnected(user.walletAddress);
  } else {
    custWalletStatusPill.className = "status-pill neutral";
    custWalletStatusPill.innerText = "Not Connected";
    custConnectedWallet.classList.add("hidden");
    btnCustConnectWallet.style.display = "inline-flex";
  }
}

function setCustomerWalletConnected(address) {
  custWalletStatusPill.className = "status-pill active";
  custWalletStatusPill.innerText = "Connected";
  custConnectedWallet.innerText = address;
  custConnectedWallet.classList.remove("hidden");
  btnCustConnectWallet.style.display = "none";
}

btnCustConnectWallet.addEventListener("click", async () => {
  if (!window.ethereum) {
    alert("MetaMask is required to connect your Web3 wallet.");
    return;
  }
  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    if (accounts.length > 0) {
      const addr = accounts[0];
      const session = SessionManager.getSession();
      if (session && session.user) {
        CustomerDB.updateWallet(session.user.id, addr);
        session.user.walletAddress = addr;
        SessionManager.setCustomerSession(session.user);
      }
      setCustomerWalletConnected(addr);
    }
  } catch (err) {
    alert("Wallet connection failed: " + err.message);
  }
});

// ---------------------------------------------------------------------------
// RETRO ADMIN TERMINAL LOGIC
// ---------------------------------------------------------------------------
async function initAdminTerminal() {
  playRetroBeep(880, "square", 0.15);

  if (provider) {
    try {
      const network = await provider.getNetwork();
      if (elNetworkStatus) {
        elNetworkStatus.innerText = `NET: ${network.name.toUpperCase()} (ID: ${network.chainId})`;
      }
      const block = await provider.getBlockNumber();
      if (elBlockNumber) {
        elBlockNumber.innerText = `BLOCK: #${block}`;
      }
      provider.on("block", (num) => {
        if (elBlockNumber) {
          elBlockNumber.innerText = `BLOCK: #${num}`;
        }
      });
    } catch (e) {
      // provider info optional
    }
  }
}
