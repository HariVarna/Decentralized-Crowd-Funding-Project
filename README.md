# 🚀 Decentralized Crowd Funding (DCF) Platform

[![Solidity](https://img.shields.io/badge/Solidity-0.8.34-363636?style=flat-square&logo=solidity)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-3.x-yellow?style=flat-square&logo=ethereum)](https://hardhat.org/)
[![Node.js](https://img.shields.io/badge/Node.js-ESM-339933?style=flat-square&logo=nodedotjs)](https://nodejs.org/)
[![Ethers.js](https://img.shields.io/badge/Ethers.js-v6-2535a0?style=flat-square)](https://docs.ethers.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

A modern, fullstack Web3 **Decentralized Crowdfunding Platform** designed to bring transparent, trustless, and secure fundraising to the Ethereum ecosystem. 

The project features a **self-contained Solidity smart contract layer**, a **zero-dependency Node.js backend server**, an interactive **CLI database manager**, and a dual-themed **Web3 frontend** supporting both customer onboarding and contract administration.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features & Capabilities](#-key-features--capabilities)
- [System Architecture](#-system-architecture)
- [Project Directory Structure](#-project-directory-structure)
- [Platform Roadmap](#-platform-roadmap)
- [Smart Contract Layer (Blockend)](#-smart-contract-layer-blockend)
- [Backend Server & REST API](#-backend-server--rest-api)
- [Database Management CLI](#-database-management-cli)
- [Frontend Experience](#-frontend-experience)
- [Getting Started & Installation](#-getting-started--installation)
- [Testing](#-testing)
- [Security & Architecture Highlights](#-security--architecture-highlights)
- [License](#-license)

---

## 🌟 Overview

Traditional crowdfunding platforms suffer from central points of failure, opaque fee structures, and withdrawal delays. **DCF** builds a trustless alternative that enforces fundraising terms directly on the blockchain.

The platform is currently operating in **Phase 1 (Admin Identity & Access Control Protocol)**, establishing the on-chain cryptographic foundation, account management infrastructure, and administrative tooling required for campaign deployment and escrow operations.

---

## ⚡ Key Features & Capabilities

### 🛡️ 1. Smart Contract & Blockchain Infrastructure
- **Raw Solidity 0.8.34 Architecture**: Built without external contract dependencies (pure, self-contained implementation with custom errors for maximum gas efficiency).
- **On-Chain Access Control**: Role-based administrative verification using custom `onlyOwner` modifiers and EVM-level checks.
- **Ownership Lifecycle**: Complete transfer and renunciation mechanisms emitting audit-ready `OwnershipTransferred` events.
- **Hardhat 3 Integration**: Comprehensive TypeScript test suite with Mocha, Chai, and Ethers.js v6.

### 🌐 2. Dual-Themed Frontend UI
- **Customer Portal (Minimalist Black & White)**:
  - Clean, responsive dashboard for customer registration and login.
  - Web3 wallet connection indicator (MetaMask / EIP-1193 integration).
  - Profile inspection showing registered email, account ID, and creation date.
- **Admin Control Terminal (Retro Cyberpunk / CRT Green Screen)**:
  - Immersive retro scanline overlay, glowing phosphor CRT typography, and synthesized Web Audio feedback.
  - Verified Admin wallet authentication (`0xa770...319`).
  - Live network state and latest block number detection.

### 🔌 3. Zero-Dependency Lightweight Backend
- **Native Node.js Server (`server.js`)**: Runs using built-in `http`, `crypto`, and `fs` modules with zero runtime `npm` dependencies.
- **Auto-Port Fallback & CORS Support**: Automatically binds to available ports (default 3000) and serves both static assets and API routes.
- **Dual-Storage Synchronization**: Synchronizes customer authentication with backend `customer_db.json` and client-side `localStorage`.

### 🛠️ 4. Interactive Database CLI
- **Terminal Admin Tool (`scripts/db-cli.js`)**: Manage the customer database directly from your command line without firing up a browser.
- **Operations Supported**: Pretty table view (`list`), full SHA-256 audit inspection (`details`), manual customer creation (`add`), and user deletion (`delete`).

---

## 🏗️ System Architecture

```
                                  +---------------------------------------+
                                  |         Web3 User / Browser           |
                                  |    (Customer Portal & Admin Panel)    |
                                  +---------------------------------------+
                                         /                         \
                          HTTP / REST   /                           \  Web3 / Ethers.js
                                       /                             \
                                      v                               v
                       +-----------------------------+   +-----------------------------+
                       |    Node.js Local Server     |   |   Ethereum Smart Contract   |
                       |        (server.js)          |   |     (Crowdfunding.sol)      |
                       +-----------------------------+   +-----------------------------+
                                      |                               |
                             JSON Read / Write                 EVM State & Events
                                      v                               v
                       +-----------------------------+   +-----------------------------+
                       |     customer_db.json        |   |   Hardhat Network / Node    |
                       |     (File-based DB)         |   |    (Localhost / Sepolia)    |
                       +-----------------------------+   +-----------------------------+
```

---

## 📁 Project Directory Structure

```plaintext
Decentralized-Crowd-Funding-Project/
├── blockend/                          # Smart contract workspace
│   ├── contracts/
│   │   └── Crowdfunding.sol           # Core crowdfunding & access control contract
│   ├── ignition/
│   │   └── modules/                   # Hardhat Ignition deployment modules
│   ├── test/
│   │   └── Crowdfunding.ts            # Mocha/Chai smart contract test suite
│   ├── hardhat.config.ts              # Hardhat configuration (Solidity 0.8.34)
│   ├── tsconfig.json                  # TypeScript configuration
│   └── package.json                   # Blockend dependencies & scripts
├── frontend/                          # Web application interface
│   ├── index.html                     # Multi-view application markup
│   ├── style.css                      # Dual design system (B&W + CRT Cyberpunk)
│   ├── app.js                         # Application router, Web3 logic & UI handlers
│   └── db.js                          # Client-side storage & API synchronization layer
├── scripts/
│   └── db-cli.js                      # Interactive CLI customer database manager
├── customer_db.json                   # Local persistent account database (JSON)
├── server.js                          # Zero-dependency Node.js HTTP & API server
├── package.json                       # Root orchestration scripts
├── OPENZEPPELIN_TO_RAW_SOLIDITY.md   # Architectural guide on raw Solidity migration
└── README.md                          # Main project documentation
```

---

## 🗺️ Platform Roadmap

| Phase | Milestone | Description | Status |
| :--- | :--- | :--- | :--- |
| **Phase 1** | **Admin Identity & Ownership Protocol** | Secure EVM-level contract ownership, account registration, zero-dependency server, and dual-themed UI. | ✅ **Complete** |
| **Phase 2** | **Campaign Registry & Factory** | Smart contract campaign creation (`struct Campaign`), funding goals, deadlines, and campaign metadata registry. | 🚧 **In Development** |
| **Phase 3** | **Decentralized Escrow & Backing** | Direct ETH pledge functionality, escrow locking, backer balance tracking, and contribution milestones. | ⏳ **Planned** |
| **Phase 4** | **Claiming, Governance & Automated Refunds** | Creator withdrawal logic upon reaching funding targets, algorithmic backer refunds for failed goals, and emergency pause controls. | ⏳ **Planned** |

---

## 📜 Smart Contract Layer (Blockend)

The core contract [Crowdfunding.sol](file:///e:/Git%20repos/dcf/Decentralized-Crowd-Funding-Project/blockend/contracts/Crowdfunding.sol) provides access control without third-party dependencies.

### Contract Highlights:
- **Custom Errors**: `OwnableUnauthorizedAccount(address)` and `OwnableInvalidOwner(address)` to minimize gas consumption compared to legacy `require` string reverts.
- **Access Modifiers**: `onlyOwner` modifier verifies `msg.sender == _owner`.
- **Ownership Transfer**: Safe two-step or direct transfer with non-zero address validation.
- **Audit Documentation**: Complete migration analysis available in [OPENZEPPELIN_TO_RAW_SOLIDITY.md](file:///e:/Git%20repos/dcf/Decentralized-Crowd-Funding-Project/OPENZEPPELIN_TO_RAW_SOLIDITY.md).

---

## 🌐 Backend Server & REST API

The backend server ([server.js](file:///e:/Git%20repos/dcf/Decentralized-Crowd-Funding-Project/server.js)) serves static assets and provides RESTful endpoints for account management:

### Endpoints:

| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/customers` | Returns all registered customer accounts (excluding password hashes) | *None* |
| `POST` | `/api/register` | Registers a new customer with validation & duplicate checks | `{ "fullName": "...", "email": "...", "password": "..." }` |
| `POST` | `/api/login` | Authenticates customer credentials against hashed records | `{ "email": "...", "password": "..." }` |
| `POST` | `/api/sync` | Merges local offline accounts with backend storage | `{ "localCustomers": [...] }` |
| `DELETE`| `/api/customers/:email` | Deletes a customer account by email address | *None* |

---

## 💻 Database Management CLI

The project includes an administrative CLI tool ([scripts/db-cli.js](file:///e:/Git%20repos/dcf/Decentralized-Crowd-Funding-Project/scripts/db-cli.js)) for inspecting and managing accounts:

```bash
# View all registered customers in a formatted table
npm run db

# View complete records including SHA-256 hashes and timestamps
node scripts/db-cli.js details

# Add a customer account manually
node scripts/db-cli.js add "Alice Smith" "alice@example.com" "securePass123"

# Remove a customer account
node scripts/db-cli.js delete "alice@example.com"
```

---

## 🖥️ Frontend Experience

The frontend offers two distinct views:

1. **Customer View**:
   - Clean, professional high-contrast layout.
   - Profile verification badges and account metadata.
   - MetaMask wallet integration for upcoming pledge capabilities.
2. **Admin Console (`Terminal Mode`)**:
   - Authentic retro CRT monitor effect with green phosphor scanlines.
   - Real-time Web3 block and network status tracker.
   - Integrated procedural 8-bit audio feedback using Web Audio API.

---

## 🚀 Getting Started & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.x or later)
- [MetaMask](https://metamask.io/) browser extension (for Web3 interactions)

### 1. Clone the Repository
```bash
git clone https://github.com/HariVarna/Decentralized-Crowd-Funding-Project.git
cd Decentralized-Crowd-Funding-Project
```

### 2. Install Blockend Dependencies
```bash
cd blockend
npm install
cd ..
```

### 3. Start the Fullstack Server
```bash
npm start
```
The server will start at `http://localhost:3000` (or automatically pick the next available port if 3000 is occupied).

---

## 🧪 Testing

The smart contract test suite validates all ownership controls, modifier protections, custom error reverts, and event emissions.

```bash
# Run all smart contract tests from the root directory
npm test

# Run tests from within the blockend directory
cd blockend
npx hardhat test
```

### Test Coverage Summary:
- ✅ Contract deployment & initial owner assignment (`msg.sender`)
- ✅ Rejection of unauthorized callers attempting admin functions (`OwnableUnauthorizedAccount`)
- ✅ Ownership transfer and `OwnershipTransferred` event emission
- ✅ Irreversible ownership renunciation to `address(0)`

---

## 🔒 Security & Architecture Highlights

- **Gas Optimization**: Zero external contract overhead, leveraging Solidity custom errors over string reverts.
- **Zero Third-Party Node Server Dependencies**: The core server runs exclusively on Node.js standard libraries, mitigating supply chain attack vectors.
- **Decentralized Fallback**: Frontend stores sessions and cached accounts in `localStorage` when backend connectivity is offline.
- **Password Protection**: Passwords are never stored in plain text; SHA-256 digests are computed and verified securely.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
