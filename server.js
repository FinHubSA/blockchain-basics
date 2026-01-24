const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// API route for generating secp256k1 key pairs
app.post('/api/generate-keypair', (req, res) => {
  try {
    const secp256k1 = require('secp256k1');
    const crypto = require('crypto');
    const { privateToAddress, privateToPublic } = require('ethereumjs-util');

    // Generate a random private key
    let privateKey;
    do {
      privateKey = crypto.randomBytes(32);
    } while (!secp256k1.privateKeyVerify(privateKey));

    // Get public key from private key
    const publicKey = secp256k1.publicKeyCreate(privateKey, false);
    
    // Convert to Ethereum address format
    const publicKeyBuffer = Buffer.from(publicKey.slice(1)); // Remove 0x04 prefix
    const ethereumAddress = privateToAddress(privateKey);

    res.json({
      privateKey: privateKey.toString('hex'),
      publicKey: Buffer.from(publicKey).toString('hex'), // Convert Uint8Array to Buffer first
      ethereumAddress: '0x' + ethereumAddress.toString('hex'),
      publicKeyUncompressed: publicKeyBuffer.toString('hex')
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API route for signing a message
app.post('/api/sign', (req, res) => {
  try {
    const secp256k1 = require('secp256k1');
    const crypto = require('crypto');
    const { keccak256 } = require('ethereumjs-util');

    const { message, privateKeyHex } = req.body;

    if (!message || !privateKeyHex) {
      return res.status(400).json({ error: 'Message and private key are required' });
    }

    const privateKey = Buffer.from(privateKeyHex, 'hex');
    
    // Create message hash (Ethereum-style: keccak256)
    const messageHash = keccak256(Buffer.from(message));
    
    // Sign the message hash
    const signature = secp256k1.ecdsaSign(messageHash, privateKey);
    
    // Convert Uint8Array to Buffer for proper hex conversion
    const signatureBuffer = Buffer.from(signature.signature);

    res.json({
      message,
      messageHash: messageHash.toString('hex'),
      signature: {
        r: signatureBuffer.slice(0, 32).toString('hex'),
        s: signatureBuffer.slice(32, 64).toString('hex'),
        recovery: signature.recid,
        full: signatureBuffer.toString('hex')
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API route for verifying a signature
app.post('/api/verify', (req, res) => {
  try {
    const secp256k1 = require('secp256k1');
    const { keccak256 } = require('ethereumjs-util');

    const { message, signatureHex, publicKeyHex } = req.body;

    if (!message || !signatureHex || !publicKeyHex) {
      return res.status(400).json({ error: 'Message, signature, and public key are required' });
    }

    const publicKey = Buffer.from(publicKeyHex, 'hex');
    const signature = Buffer.from(signatureHex, 'hex');
    
    // Create message hash
    const messageHash = keccak256(Buffer.from(message));
    
    // Verify signature
    const isValid = secp256k1.ecdsaVerify(signature, messageHash, publicKey);
    
    res.json({
      isValid,
      message,
      messageHash: messageHash.toString('hex')
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API route for encrypting a message (using ECIES-like approach)
app.post('/api/encrypt', (req, res) => {
  try {
    const crypto = require('crypto');
    const secp256k1 = require('secp256k1');

    const { message, publicKeyHex } = req.body;

    if (!message || !publicKeyHex) {
      return res.status(400).json({ error: 'Message and public key are required' });
    }

    // For demonstration: Use AES encryption with a shared secret derived from public key
    // In production, use proper ECIES (Elliptic Curve Integrated Encryption Scheme)
    const publicKey = Buffer.from(publicKeyHex, 'hex');
    
    // Derive a key from the public key (simplified for demo)
    const keyMaterial = crypto.createHash('sha256').update(publicKey).digest();
    
    // Generate random IV
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-cbc', keyMaterial, iv);
    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    res.json({
      encrypted,
      iv: iv.toString('hex'),
      publicKey: publicKeyHex
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API route for decrypting a message
app.post('/api/decrypt', (req, res) => {
  try {
    const crypto = require('crypto');
    const secp256k1 = require('secp256k1');

    const { encrypted, ivHex, privateKeyHex, publicKeyHex } = req.body;

    if (!encrypted || !ivHex || !privateKeyHex || !publicKeyHex) {
      return res.status(400).json({ error: 'All fields are required for decryption' });
    }

    const publicKey = Buffer.from(publicKeyHex, 'hex');
    
    // Derive the same key from the public key
    const keyMaterial = crypto.createHash('sha256').update(publicKey).digest();
    const iv = Buffer.from(ivHex, 'hex');
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyMaterial, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    res.json({
      decrypted,
      original: encrypted
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API route for signing an Ethereum transaction
app.post('/api/sign-transaction', (req, res) => {
  try {
    const secp256k1 = require('secp256k1');
    const crypto = require('crypto');
    const { keccak256, privateToAddress, toBuffer } = require('ethereumjs-util');
    const rlp = require('rlp');

    const { from, to, value, nonce, gasPrice, gasLimit, privateKey, data } = req.body;

    // Validate required fields
    // Note: 'to' can be null for contract deployment transactions
    if (!from || (to === undefined && to !== null) || value === undefined || nonce === undefined || !gasPrice || !gasLimit || !privateKey) {
      return res.status(400).json({ error: 'All transaction fields are required' });
    }

    // Use provided data field or default to empty
    // Ensure data is a string and handle various formats
    let txData = '0x';
    if (data) {
      if (typeof data === 'string') {
        txData = data;
      } else if (Buffer.isBuffer(data)) {
        txData = '0x' + data.toString('hex');
      } else {
        txData = String(data);
      }
      // Ensure it starts with 0x if it's not empty
      if (txData && txData !== '0x' && !txData.startsWith('0x')) {
        txData = '0x' + txData;
      }
    }

    // Convert private key to buffer
    const privateKeyBuffer = Buffer.from(privateKey, 'hex');
    
    // Verify private key is valid
    if (!secp256k1.privateKeyVerify(privateKeyBuffer)) {
      return res.status(400).json({ error: 'Invalid private key' });
    }

    // Verify the from address matches the private key
    const derivedAddress = '0x' + privateToAddress(privateKeyBuffer).toString('hex');
    if (derivedAddress.toLowerCase() !== from.toLowerCase()) {
      return res.status(400).json({ 
        error: 'Private key does not match the "From" address. Derived address: ' + derivedAddress 
      });
    }

    // Convert value from ETH to Wei (1 ETH = 10^18 Wei)
    const valueInWei = BigInt(Math.floor(parseFloat(value) * 1e18)).toString();

    // Convert gas price from Gwei to Wei (1 Gwei = 10^9 Wei)
    const gasPriceInWei = BigInt(Math.floor(parseFloat(gasPrice) * 1e9)).toString();

    // Helper function to convert number to buffer (removing leading zeros)
    // Returns empty buffer for 0 to ensure canonical RLP encoding
    const numToBuffer = (num) => {
      // Handle zero values (number 0, string "0", or BigInt string "0")
      if (num === 0 || num === '0' || (typeof num === 'string' && num === '0')) {
        return Buffer.alloc(0);
      }
      // Convert to BigInt first to handle large numbers, then to hex string
      const bigNum = typeof num === 'string' ? BigInt(num) : BigInt(num);
      if (bigNum === 0n) {
        return Buffer.alloc(0);
      }
      const hex = bigNum.toString(16);
      return Buffer.from(hex.length % 2 === 0 ? hex : '0' + hex, 'hex');
    };

    // Helper function to convert hex string to buffer
    // Handles null for contract deployment (returns empty buffer)
    const hexToBuffer = (hex) => {
      if (hex === null || hex === undefined) {
        return Buffer.alloc(0);
      }
      if (!hex || hex === '0x' || hex === '') {
        return Buffer.alloc(0);
      }
      const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
      // Validate hex string
      if (!/^[0-9a-fA-F]*$/.test(cleanHex)) {
        throw new Error('Invalid hex string in data field');
      }
      return Buffer.from(cleanHex, 'hex');
    };

    // Create raw transaction object (Ethereum transaction format)
    // Default to Sepolia (11155111) if not provided
    const chainId = req.body.chainId !== undefined ? parseInt(req.body.chainId) : 11155111;
    const rawTransaction = {
      nonce: parseInt(nonce),
      gasPrice: gasPriceInWei,
      gasLimit: parseInt(gasLimit),
      to: to === null ? null : to.toLowerCase(), // null for contract deployment
      value: valueInWei,
      data: txData, // Use provided data or empty for simple transfer
      chainId: chainId
    };

    // Create transaction hash for signing (EIP-155 format)
    // Transaction fields: [nonce, gasPrice, gasLimit, to, value, data, chainId, 0, 0]
    // Convert data to buffer - ensure it's always a Buffer for RLP encoding
    let dataBuffer;
    try {
      dataBuffer = hexToBuffer(txData);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid data field: ' + error.message });
    }
    const txFields = [
      numToBuffer(rawTransaction.nonce),
      numToBuffer(rawTransaction.gasPrice),
      numToBuffer(rawTransaction.gasLimit),
      hexToBuffer(rawTransaction.to),
      numToBuffer(rawTransaction.value),
      dataBuffer, // data (function call or empty)
      numToBuffer(chainId),
      Buffer.alloc(0), // r (placeholder)
      Buffer.alloc(0)  // s (placeholder)
    ];

    // RLP encode the transaction (without signature)
    const txRLP = rlp.encode(txFields);
    
    // Ensure txRLP is a Buffer (rlp.encode may return Uint8Array)
    const txRLPBuffer = Buffer.isBuffer(txRLP) ? txRLP : Buffer.from(txRLP);
    
    // Create hash of transaction (this is what gets signed)
    const txHash = keccak256(txRLPBuffer);

    // Sign the transaction hash
    const signature = secp256k1.ecdsaSign(txHash, privateKeyBuffer);

    // Calculate recovery ID (v)
    // v = chainId * 2 + 35 + recoveryId
    const recoveryId = signature.recid;
    const v = chainId * 2 + 35 + recoveryId;

    // Create signed transaction fields
    const signedTxFields = [
      numToBuffer(rawTransaction.nonce),
      numToBuffer(rawTransaction.gasPrice),
      numToBuffer(rawTransaction.gasLimit),
      hexToBuffer(rawTransaction.to),
      numToBuffer(rawTransaction.value),
      dataBuffer, // data (function call or empty)
      numToBuffer(v),
      signature.signature.slice(0, 32), // r
      signature.signature.slice(32, 64) // s
    ];

    // RLP encode the signed transaction
    const signedTxRLP = rlp.encode(signedTxFields);
    
    // Ensure signedTxRLP is a Buffer (rlp.encode may return Uint8Array)
    const signedTxRLPBuffer = Buffer.isBuffer(signedTxRLP) ? signedTxRLP : Buffer.from(signedTxRLP);
    
    // Calculate final transaction hash (hash of RLP-encoded signed transaction)
    const finalTxHash = keccak256(signedTxRLPBuffer);

    // Format response
    const response = {
      rawTransaction: {
        nonce: '0x' + rawTransaction.nonce.toString(16),
        gasPrice: '0x' + BigInt(rawTransaction.gasPrice).toString(16),
        gasLimit: '0x' + rawTransaction.gasLimit.toString(16),
        to: rawTransaction.to,
        value: '0x' + BigInt(rawTransaction.value).toString(16),
        data: rawTransaction.data,
        chainId: chainId
      },
      signedTransaction: '0x' + signedTxRLPBuffer.toString('hex'),
      transactionHash: '0x' + finalTxHash.toString('hex'),
      recoveryId: recoveryId,
      signature: {
        r: '0x' + signature.signature.slice(0, 32).toString('hex'),
        s: '0x' + signature.signature.slice(32, 64).toString('hex'),
        v: '0x' + v.toString(16)
      }
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API route for encoding a function call
app.post('/api/encode-function', (req, res) => {
  try {
    const { keccak256 } = require('ethereumjs-util');
    const abi = require('ethereumjs-abi');

    const { functionSignature, parameters } = req.body;

    if (!functionSignature) {
      return res.status(400).json({ error: 'Function signature is required' });
    }

    // Create function selector (first 4 bytes of keccak256 hash of function signature)
    const functionHash = keccak256(Buffer.from(functionSignature));
    const functionSelector = '0x' + functionHash.slice(0, 4).toString('hex');

    // Encode parameters if provided
    let encodedParameters = '';
    if (parameters && parameters.length > 0) {
      // Extract parameter types from function signature
      const paramTypes = functionSignature
        .match(/\(([^)]*)\)/)[1]
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      if (paramTypes.length !== parameters.length) {
        return res.status(400).json({ 
          error: `Parameter count mismatch. Expected ${paramTypes.length} parameters, got ${parameters.length}` 
        });
      }

      // Encode parameters using ABI encoding
      try {
        const encoded = abi.rawEncode(paramTypes, parameters.map(p => {
          // Convert string numbers to BigInt for uint types
          if (typeof p === 'string' && /^\d+$/.test(p)) {
            return BigInt(p);
          }
          return p;
        }));
        encodedParameters = '0x' + encoded.toString('hex');
      } catch (error) {
        return res.status(400).json({ 
          error: 'Error encoding parameters: ' + error.message 
        });
      }
    }

    // Combine function selector and encoded parameters
    const selectorHex = functionSelector.slice(2); // Remove 0x
    const paramsHex = encodedParameters ? encodedParameters.slice(2) : ''; // Remove 0x if present
    const completeData = selectorHex + paramsHex;

    res.json({
      functionSelector: functionSelector,
      encodedParameters: encodedParameters || '0x',
      data: completeData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API route for submitting a signed transaction to an Ethereum network
app.post('/api/submit-transaction', async (req, res) => {
  try {
    const https = require('https');
    const http = require('http');
    const { URL } = require('url');
    const { rpcUrl, signedTransaction } = req.body;

    if (!rpcUrl || !signedTransaction) {
      return res.status(400).json({ error: 'RPC URL and signed transaction are required' });
    }

    // Validate signed transaction format
    if (!signedTransaction.startsWith('0x')) {
      return res.status(400).json({ error: 'Signed transaction must start with 0x' });
    }

    // Use eth_sendRawTransaction RPC method
    const rpcPayload = {
      jsonrpc: '2.0',
      method: 'eth_sendRawTransaction',
      params: [signedTransaction],
      id: 1
    };

    // Parse URL
    const url = new URL(rpcUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    // Make RPC call to the provided endpoint
    const postData = JSON.stringify(rpcPayload);

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    // Make the request
    const rpcResponse = await new Promise((resolve, reject) => {
      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Invalid JSON response from RPC'));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });

    if (rpcResponse.error) {
      return res.status(400).json({ 
        error: rpcResponse.error.message || 'RPC error: ' + JSON.stringify(rpcResponse.error)
      });
    }

    if (!rpcResponse.result) {
      return res.status(400).json({ error: 'No transaction hash returned from RPC' });
    }

    res.json({
      transactionHash: rpcResponse.result,
      rpcUrl: rpcUrl
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API route for compiling Solidity code
app.post('/api/compile-solidity', async (req, res) => {
  try {
    const solc = require('solc');
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Solidity code is required' });
    }

    // Solidity compiler input format
    const input = {
      language: 'Solidity',
      sources: {
        'Contract.sol': {
          content: code
        }
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['evm.bytecode']
          }
        }
      }
    };

    // Compile the Solidity code
    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    // Check for compilation errors
    if (output.errors) {
      const errors = output.errors.filter(e => e.severity === 'error');
      if (errors.length > 0) {
        return res.status(400).json({ 
          error: 'Compilation errors',
          errors: errors.map(e => e.formattedMessage || e.message)
        });
      }
    }

    // Extract bytecode from the first contract
    const contracts = output.contracts['Contract.sol'];
    if (!contracts || Object.keys(contracts).length === 0) {
      return res.status(400).json({ error: 'No contracts found in the code' });
    }

    const contractName = Object.keys(contracts)[0];
    const bytecode = contracts[contractName].evm.bytecode.object;

    if (!bytecode || bytecode === '') {
      return res.status(400).json({ error: 'No bytecode generated. Make sure your contract has a constructor or is deployable.' });
    }

    // Remove '0x' prefix if present
    const cleanBytecode = bytecode.startsWith('0x') ? bytecode.slice(2) : bytecode;

    res.json({
      bytecode: cleanBytecode,
      contractName: contractName
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve the main page (redirects to intro)
app.get('/', (req, res) => {
  res.redirect('/public-key-cryptography/intro.html');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

