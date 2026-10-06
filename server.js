/**
 * DCF Fullstack Local Server (Zero External Dependencies)
 * Includes robust validation, duplicate prevention, auto-port fallback, and customer database management.
 */

import http from "http";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const DEFAULT_PORT = parseInt(process.env.PORT || "3000", 10);
const DB_FILE = path.join(process.cwd(), "customer_db.json");
const FRONTEND_DIR = path.join(process.cwd(), "frontend");

// MIME Types
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

// Database Helpers
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === "string" && re.test(email.trim());
}

// Request Body Parser Helper
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const start = Date.now();
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end();
    return;
  }

  // --- API ROUTES ---

  // 1. Get all customers
  if (pathname === "/api/customers" && req.method === "GET") {
    const customers = readDB().map(c => ({
      id: c.id,
      fullName: c.fullName,
      email: c.email,
      walletAddress: c.walletAddress,
      createdAt: c.createdAt
    }));
    return sendJSON(res, 200, { success: true, customers });
  }

  // 2. Register new customer with strict duplicate & syntax validation
  if (pathname === "/api/register" && req.method === "POST") {
    try {
      const { fullName, email, password } = await parseBody(req);
      
      // Field existence check
      if (!fullName || !fullName.trim()) {
        return sendJSON(res, 400, { success: false, error: "Full Name is required." });
      }
      if (!email || !isValidEmail(email)) {
        return sendJSON(res, 400, { success: false, error: "A valid email address is required." });
      }
      if (!password || password.length < 6) {
        return sendJSON(res, 400, { success: false, error: "Password must be at least 6 characters long." });
      }

      const customers = readDB();
      const normalizedEmail = email.trim().toLowerCase();

      // Duplicate Check (409 Conflict)
      const existing = customers.find(c => c.email.toLowerCase() === normalizedEmail);
      if (existing) {
        console.log(`[AUTH-AUDIT] Registration rejected: Duplicate email "${normalizedEmail}"`);
        return sendJSON(res, 409, {
          success: false,
          error: "An account with this email address already exists. Please login instead."
        });
      }

      const newCustomer = {
        id: "CUST-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
        fullName: fullName.trim(),
        email: normalizedEmail,
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString(),
        walletAddress: null
      };

      customers.push(newCustomer);
      writeDB(customers);

      console.log(`[AUTH-AUDIT] New customer registered: ${newCustomer.fullName} (${newCustomer.email}) [ID: ${newCustomer.id}]`);

      return sendJSON(res, 201, {
        success: true,
        customer: {
          id: newCustomer.id,
          fullName: newCustomer.fullName,
          email: newCustomer.email,
          createdAt: newCustomer.createdAt,
          walletAddress: newCustomer.walletAddress
        }
      });
    } catch (err) {
      return sendJSON(res, 500, { success: false, error: err.message });
    }
  }

  // 3. Authenticate / Login
  if (pathname === "/api/login" && req.method === "POST") {
    try {
      const { email, password } = await parseBody(req);
      if (!email || !password) {
        return sendJSON(res, 400, { success: false, error: "Email and password are required." });
      }

      const customers = readDB();
      const normalizedEmail = email.trim().toLowerCase();
      const customer = customers.find(c => c.email.toLowerCase() === normalizedEmail);

      if (!customer) {
        return sendJSON(res, 401, { success: false, error: "Invalid email or password." });
      }

      const hash = hashPassword(password);
      if (customer.passwordHash !== hash) {
        return sendJSON(res, 401, { success: false, error: "Invalid email or password." });
      }

      console.log(`[AUTH-AUDIT] Customer logged in: ${customer.fullName} (${customer.email})`);

      return sendJSON(res, 200, {
        success: true,
        customer: {
          id: customer.id,
          fullName: customer.fullName,
          email: customer.email,
          createdAt: customer.createdAt,
          walletAddress: customer.walletAddress
        }
      });
    } catch (err) {
      return sendJSON(res, 500, { success: false, error: err.message });
    }
  }

  // 4. Delete Customer
  if (pathname.startsWith("/api/customers/") && req.method === "DELETE") {
    const targetEmail = decodeURIComponent(pathname.replace("/api/customers/", "")).trim().toLowerCase();
    const customers = readDB();
    const initialLen = customers.length;
    const filtered = customers.filter(c => c.email.toLowerCase() !== targetEmail);

    if (filtered.length === initialLen) {
      return sendJSON(res, 404, { success: false, error: `Customer with email "${targetEmail}" not found.` });
    }

    writeDB(filtered);
    console.log(`[AUTH-AUDIT] Customer deleted: ${targetEmail}`);
    return sendJSON(res, 200, { success: true, message: `Customer "${targetEmail}" successfully deleted.` });
  }

  // 5. Sync / Merge browser accounts
  if (pathname === "/api/sync" && req.method === "POST") {
    try {
      const { localCustomers } = await parseBody(req);
      const dbCustomers = readDB();
      let updated = false;

      if (Array.isArray(localCustomers)) {
        for (const lc of localCustomers) {
          if (!lc || !lc.email || !isValidEmail(lc.email)) continue;
          const idx = dbCustomers.findIndex(c => c.email.toLowerCase() === lc.email.toLowerCase());
          if (idx === -1) {
            dbCustomers.push(lc);
            updated = true;
          }
        }
      }

      if (updated) {
        writeDB(dbCustomers);
      }

      return sendJSON(res, 200, { success: true, customers: dbCustomers });
    } catch (e) {
      return sendJSON(res, 500, { success: false, error: e.message });
    }
  }

  // 6. Update Wallet
  if (pathname === "/api/wallet" && req.method === "POST") {
    try {
      const { customerId, walletAddress } = await parseBody(req);
      const customers = readDB();
      const idx = customers.findIndex(c => c.id === customerId);

      if (idx === -1) {
        return sendJSON(res, 404, { success: false, error: "Customer not found." });
      }

      customers[idx].walletAddress = walletAddress;
      writeDB(customers);
      return sendJSON(res, 200, { success: true });
    } catch (err) {
      return sendJSON(res, 500, { success: false, error: err.message });
    }
  }

  // --- STATIC FILE SERVING ---
  let filePath = path.join(FRONTEND_DIR, pathname === "/" ? "index.html" : pathname);
  const ext = path.extname(filePath).toLowerCase();

  // Protect against directory traversal
  if (!filePath.startsWith(FRONTEND_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === "ENOENT") {
        // Fallback to index.html for SPA routing
        fs.readFile(path.join(FRONTEND_DIR, "index.html"), (e, indexContent) => {
          if (e) {
            res.writeHead(404);
            res.end("404 Not Found");
          } else {
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            res.end(indexContent);
          }
        });
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
      res.end(content);
    }
  });
});

// Resilient Port Listener (Auto Port Fallback on EADDRINUSE)
function startServer(port) {
  server.listen(port, () => {
    console.log("\n===================================================================");
    console.log(`  ✓ DCF Fullstack Server running at: http://localhost:${port}`);
    console.log(`  ✓ Database File Linked:             ${DB_FILE}`);
    console.log("  ✓ Auto-Validation & Duplicate Check: ACTIVE");
    console.log("===================================================================\n");
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`[!] Port ${port} is already in use. Retrying on port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error("[✖] Server error:", err);
    }
  });
}

startServer(DEFAULT_PORT);
