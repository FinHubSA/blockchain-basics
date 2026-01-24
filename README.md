# Blockchain Tutorial Application

A comprehensive Express application that teaches blockchain and Ethereum concepts through interactive tutorials and hands-on exercises.

## Features

### Topics Covered

1. **Public Key Cryptography**
   - Introduction to public key cryptography
   - Generate secp256k1 key pairs (Ethereum-compatible)
   - Digital signing with private keys
   - Signature verification with public keys
   - Ethereum address derivation from public keys
   - Local storage for key pairs

2. **Distributed Ledgers**
   - Introduction to distributed ledgers, accounts, balances, and transactions
   - Blockchain as a state machine
   - Ethereum transaction signing
   - Smart contract deployment (Solidity code compilation)
   - Smart contract function calls (ABI encoding)
   - Transaction field validation and local storage

3. **Consensus Mechanisms**
   - Introduction to consensus mechanisms (PoW, PoS, DPoS, PBFT)
   - Transaction blocks and block structure
   - Submitting signed transactions to test networks (Sepolia)
   - RPC endpoint integration
   - Transaction status tracking

4. **Smart Contracts**
   - Introduction to smart contracts
   - Externally Owned Accounts (EOAs) vs Contract Accounts
   - Value movement through smart contracts

### Interactive Tools

- **Dynamic Navigation Drawer**: Easy navigation between all topics and sub-pages
- **CodeMirror Integration**: Syntax-highlighted Solidity code editor
- **Local Storage**: Persistent storage for keys, transactions, and code
- **Real-time Validation**: Transaction field validation based on transaction type
- **Visual Aids**: Images and diagrams explaining cryptographic processes

## Installation

1. Install dependencies:
```bash
npm install
```

## Running the Application

Start the server:
```bash
npm start
```

Or use nodemon for development (auto-restart on changes):
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
blockchain/
├── server.js                    # Express server with API routes
├── package.json                 # Dependencies and scripts
├── public/                      # Frontend files
│   ├── index.html              # Main entry point (redirects to intro)
│   ├── css/
│   │   └── style.css           # Application styling
│   ├── js/
│   │   ├── navigation-data.js  # Navigation structure data
│   │   ├── navigation.js       # Dynamic navigation drawer
│   │   ├── key-generation.js   # Key generation page logic
│   │   ├── transaction-signing.js # Transaction signing page logic
│   │   └── submit-transaction.js # Transaction submission logic
│   ├── public-key-cryptography/
│   │   ├── intro.html          # Public key cryptography introduction
│   │   └── key-generation.html # Key generation and operations
│   ├── distributed-ledgers/
│   │   ├── intro.html          # Distributed ledgers introduction
│   │   └── transaction-signing.html # Transaction signing page
│   ├── consensus-mechanisms/
│   │   ├── intro.html          # Consensus mechanisms introduction
│   │   └── submit-transaction.html # Transaction submission page
│   └── smart-contracts/
│       └── intro.html          # Smart contracts introduction
└── README.md                    # This file
```

## API Endpoints

### Key Generation & Cryptography
- `POST /api/generate-keypair` - Generate a new secp256k1 key pair (returns private key, public key, and Ethereum address)
- `POST /api/sign` - Sign a message with a private key (returns signature components: r, s, and full signature)
- `POST /api/verify` - Verify a signature with a public key and message

### Transaction Operations
- `POST /api/sign-transaction` - Sign an Ethereum transaction (supports regular transfers, contract deployment, and function calls)
  - Handles EIP-155 transaction signing with chain ID
  - Supports contract deployment (null `to` field)
  - Includes transaction data for smart contract interactions
- `POST /api/encode-function` - Encode a smart contract function call (function selector + parameters)
- `POST /api/submit-transaction` - Submit a signed raw transaction to an Ethereum RPC endpoint
- `POST /api/compile-solidity` - Compile Solidity code to bytecode for contract deployment

## Technologies Used

### Backend
- **Express.js**: Web server framework
- **secp256k1**: Elliptic curve cryptography library for key generation and signing
- **ethereumjs-util**: Ethereum utility functions (keccak256, address derivation)
- **rlp**: Recursive Length Prefix encoding for Ethereum transactions
- **ethereumjs-abi**: ABI encoding/decoding for smart contract function calls
- **solc**: Solidity compiler for contract bytecode generation
- **Node.js crypto**: Built-in cryptographic functions

### Frontend
- **CodeMirror**: Syntax highlighting for Solidity code editor
- **Local Storage API**: Client-side persistence for keys, transactions, and code
- **Vanilla JavaScript**: No framework dependencies

## Key Concepts Demonstrated

- **secp256k1 Elliptic Curve**: The curve used by Ethereum for key pairs
- **Ethereum Address Derivation**: Last 20 bytes of keccak256 hash of public key
- **Digital Signatures**: ECDSA signing and verification
- **Ethereum Transactions**: Transaction structure, RLP encoding, EIP-155 signing
- **Smart Contracts**: Deployment bytecode, function selectors, ABI encoding
- **State Machine Model**: How blockchain maintains and verifies state
- **Gas & Gas Prices**: Understanding transaction costs (Wei, Gwei, ETH)

## Notes

- **Security Warning**: This is an educational tool. Private keys are generated and stored in browser localStorage for demonstration purposes only. Never use this in production without proper security measures.
- **Test Networks**: The application is designed to work with Ethereum test networks (e.g., Sepolia). Always use test networks for learning and development.
- **Transaction Costs**: Real transactions on mainnet require real ETH. Use testnet faucets to get test ETH for experimentation.
- **Best Practices**: Always use established libraries and follow security best practices for production blockchain applications.
- **Local Storage**: All data stored in browser localStorage is client-side only and not transmitted to the server (except when submitting transactions to RPC endpoints).

