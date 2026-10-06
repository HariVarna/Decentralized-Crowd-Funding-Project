/**
 * Customer Credentials Database & Authentication Store
 * Synchronizes with backend customer_db.json via API and maintains offline localStorage fallback.
 */

const DB_STORAGE_KEY = "dcf_customer_database_v1";
const SESSION_STORAGE_KEY = "dcf_active_session_v1";

// List of possible server endpoints to probe if served from a static server (like npx serve)
const CANDIDATE_PORTS = [
  window.location.port ? parseInt(window.location.port, 10) : 3000,
  3000,
  3001,
  3002,
  5000
];

let activeApiBase = null;

async function findActiveApiBase() {
  if (activeApiBase) return activeApiBase;

  // Test candidate origins
  for (const port of CANDIDATE_PORTS) {
    const origin = `${window.location.protocol}//${window.location.hostname}:${port}`;
    try {
      const res = await fetch(`${origin}/api/customers`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(600)
      });
      if (res.ok) {
        activeApiBase = origin;
        console.log(`[DCF] Linked to active backend server at: ${origin}`);
        return activeApiBase;
      }
    } catch (e) {
      // Continue searching
    }
  }

  // Default fallback
  activeApiBase = window.location.origin;
  return activeApiBase;
}

async function apiFetch(endpoint, options = {}) {
  const base = await findActiveApiBase();
  const url = `${base}${endpoint}`;
  return fetch(url, options);
}

// SHA-256 via Web Crypto API
async function hashString(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export const CustomerDB = {
  // Get all registered customers (API + local fallback)
  async getAllCustomers() {
    try {
      const res = await apiFetch("/api/customers");
      if (res.ok) {
        const data = await res.json();
        if (data.customers) {
          localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(data.customers));
          return data.customers;
        }
      }
    } catch (e) {
      // Offline fallback
    }

    try {
      const local = localStorage.getItem(DB_STORAGE_KEY);
      return local ? JSON.parse(local) : [];
    } catch (e) {
      return [];
    }
  },

  // Register a new customer
  async register({ fullName, email, password }) {
    let apiSuccess = false;
    let registeredCustomer = null;

    // 1. Try registering via backend API (persists directly to customer_db.json)
    try {
      const res = await apiFetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register account.");
      }

      apiSuccess = true;
      registeredCustomer = data.customer;

      // Update local storage cache
      const local = this.getAllCustomersSync();
      const existingIdx = local.findIndex(c => c.email.toLowerCase() === email.toLowerCase());
      if (existingIdx === -1) {
        local.push(registeredCustomer);
      } else {
        local[existingIdx] = registeredCustomer;
      }
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(local));

      return registeredCustomer;
    } catch (err) {
      if (err.message && (err.message.includes("already exists") || err.message.includes("required"))) {
        throw err;
      }

      console.warn("[DCF] Backend API unreachable. Storing in browser cache fallback.", err.message);
      
      // If server unreachable, use client fallback
      const customers = this.getAllCustomersSync();
      const normalizedEmail = email.trim().toLowerCase();
      if (customers.some(c => c.email.toLowerCase() === normalizedEmail)) {
        throw new Error("An account with this email address already exists.");
      }

      const passwordHash = await hashString(password);
      const newCustomer = {
        id: "CUST-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
        fullName: fullName.trim(),
        email: normalizedEmail,
        passwordHash: passwordHash,
        createdAt: new Date().toISOString(),
        walletAddress: null
      };

      customers.push(newCustomer);
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(customers));
      return newCustomer;
    }
  },

  // Authenticate customer login
  async authenticate(email, password) {
    // 1. Try authenticating via backend API
    try {
      const res = await apiFetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid email or password.");
      }

      return data.customer;
    } catch (err) {
      if (err.message && (err.message.includes("Invalid email") || err.message.includes("required"))) {
        throw err;
      }

      // Offline fallback
      const customers = this.getAllCustomersSync();
      const normalizedEmail = email.trim().toLowerCase();
      const customer = customers.find(c => c.email.toLowerCase() === normalizedEmail);

      if (!customer) {
        throw new Error("Invalid email or password.");
      }

      const passwordHash = await hashString(password);
      if (customer.passwordHash && customer.passwordHash !== passwordHash) {
        throw new Error("Invalid email or password.");
      }

      return {
        id: customer.id,
        fullName: customer.fullName,
        email: customer.email,
        createdAt: customer.createdAt,
        walletAddress: customer.walletAddress
      };
    }
  },

  // Update customer wallet address
  async updateWallet(customerId, walletAddress) {
    try {
      await apiFetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, walletAddress })
      });
    } catch (e) {}

    const customers = this.getAllCustomersSync();
    const idx = customers.findIndex(c => c.id === customerId);
    if (idx !== -1) {
      customers[idx].walletAddress = walletAddress;
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(customers));
    }
  },

  getAllCustomersSync() {
    try {
      const data = localStorage.getItem(DB_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }
};

// Initial background sync
(async function initSync() {
  try {
    const local = localStorage.getItem(DB_STORAGE_KEY);
    const localCustomers = local ? JSON.parse(local) : [];
    if (localCustomers.length > 0) {
      await apiFetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ localCustomers })
      });
    }
  } catch (e) {}
})();

// Global Session Manager
export const SessionManager = {
  getSession() {
    try {
      const session = localStorage.getItem(SESSION_STORAGE_KEY);
      return session ? JSON.parse(session) : null;
    } catch (e) {
      return null;
    }
  },

  setCustomerSession(customer) {
    const session = {
      role: "customer",
      user: customer,
      loggedInAt: new Date().toISOString()
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    return session;
  },

  setAdminSession(adminWallet) {
    const session = {
      role: "admin",
      user: {
        walletAddress: adminWallet,
        roleTitle: "Root Platform Administrator"
      },
      loggedInAt: new Date().toISOString()
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    return session;
  },

  clearSession() {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
};
