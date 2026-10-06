#!/usr/bin/env node
/**
 * DCF Customer Database CLI Viewer & Management Tool
 * Run from terminal: node scripts/db-cli.js
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, "..", "customer_db.json");

function getCustomers() {
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

function saveCustomers(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function displayTable() {
  const customers = getCustomers();
  console.log("\n===================================================================");
  console.log("             DCF REGISTERED CUSTOMER DATABASE (CLI)");
  console.log("===================================================================");
  console.log(` Database File: ${DB_FILE}`);
  console.log("-------------------------------------------------------------------");
  
  if (customers.length === 0) {
    console.log(" [!] Database is currently empty.");
    console.log("     Create accounts through the web app (http://localhost:3000)");
    console.log("     or run: node scripts/db-cli.js add <name> <email> <password>\n");
    return;
  }

  console.table(
    customers.map((c, i) => ({
      "#": i + 1,
      ID: c.id,
      Name: c.fullName,
      Email: c.email,
      "Wallet Address": c.walletAddress || "(Not Linked)",
      "Joined Date": new Date(c.createdAt).toLocaleDateString(),
      "Password Hash": c.passwordHash ? c.passwordHash.slice(0, 16) + "..." : "(none)"
    }))
  );
  console.log(`Total Registered Customers: ${customers.length}`);
  console.log(`Tip: Run 'node scripts/db-cli.js details' to view full 64-char hashes and complete record details.\n`);
}

function displayDetailedView() {
  const customers = getCustomers();
  console.log("\n===================================================================");
  console.log("          DCF CUSTOMER DATABASE — COMPLETE FIELD AUDIT");
  console.log("===================================================================");
  console.log(` Database File: ${DB_FILE}`);
  console.log(` Total Accounts: ${customers.length}`);
  console.log("-------------------------------------------------------------------");

  if (customers.length === 0) {
    console.log(" [!] Database is currently empty.\n");
    return;
  }

  customers.forEach((c, idx) => {
    console.log(`\n[ACCOUNT #${idx + 1}]`);
    console.log(`  • Account ID:       ${c.id}`);
    console.log(`  • Full Name:        ${c.fullName}`);
    console.log(`  • Email Address:    ${c.email}`);
    console.log(`  • Wallet Address:   ${c.walletAddress || "None (Not Linked Yet)"}`);
    console.log(`  • Joined Date:      ${c.createdAt} (${new Date(c.createdAt).toLocaleString()})`);
    console.log(`  • SHA-256 Hash:     ${c.passwordHash}`);
  });
  console.log("\n===================================================================\n");
}

const args = process.argv.slice(2);
const command = args[0] || "list";

if (command === "list") {
  displayTable();
} else if (command === "details" || command === "all" || command === "show") {
  displayDetailedView();
} else if (command === "add") {
  const [_, name, email, password] = args;
  if (!name || !email || !password) {
    console.log("Usage: node scripts/db-cli.js add <fullName> <email> <password>");
    process.exit(1);
  }
  const customers = getCustomers();
  const normalizedEmail = email.trim().toLowerCase();

  // Duplicate Check
  const exists = customers.some(c => c.email.toLowerCase() === normalizedEmail);
  if (exists) {
    console.log(`\n[✖] ERROR: An account with email "${email}" already exists in database.\n`);
    process.exit(1);
  }

  const hash = crypto.createHash("sha256").update(password).digest("hex");
  const newCust = {
    id: "CUST-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
    fullName: name.trim(),
    email: normalizedEmail,
    passwordHash: hash,
    createdAt: new Date().toISOString(),
    walletAddress: null
  };
  customers.push(newCust);
  saveCustomers(customers);
  console.log(`\n[✓] Added customer: ${name} (${email})`);
  displayTable();
} else if (command === "delete" || command === "remove") {
  const targetEmail = args[1];
  if (!targetEmail) {
    console.log("Usage: node scripts/db-cli.js delete <email>");
    process.exit(1);
  }

  const customers = getCustomers();
  const normalizedTarget = targetEmail.trim().toLowerCase();
  const initialLength = customers.length;
  const filtered = customers.filter(c => c.email.toLowerCase() !== normalizedTarget);

  if (filtered.length === initialLength) {
    console.log(`\n[!] No customer found with email: "${targetEmail}"\n`);
  } else {
    saveCustomers(filtered);
    console.log(`\n[✓] Successfully deleted customer: "${targetEmail}"\n`);
  }
  displayTable();
} else if (command === "clear") {
  saveCustomers([]);
  console.log("\n[✓] Database cleared.\n");
  displayTable();
} else {
  console.log("Unknown command. Options: list | details | add | delete <email> | clear");
}
