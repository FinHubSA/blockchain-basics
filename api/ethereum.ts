import { Router, Request, Response } from "express";
import * as https from "https";
import * as http from "http";
import { URL } from "url";

export function createEthereumRouter(): Router {
  const router = Router();

  router.post("/generate-keypair", (req: Request, res: Response) => {
    try {
      const secp256k1 = require("secp256k1");
      const crypto = require("crypto");
      const { privateToAddress } = require("ethereumjs-util");
      let privateKey: Buffer;
      do {
        privateKey = crypto.randomBytes(32);
      } while (!secp256k1.privateKeyVerify(privateKey));
      const publicKey = secp256k1.publicKeyCreate(privateKey, false);
      const publicKeyBuffer = Buffer.from(publicKey.slice(1));
      const ethereumAddress = privateToAddress(privateKey);
      res.json({
        privateKey: privateKey.toString("hex"),
        publicKey: Buffer.from(publicKey).toString("hex"),
        ethereumAddress: "0x" + ethereumAddress.toString("hex"),
        publicKeyUncompressed: publicKeyBuffer.toString("hex"),
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post("/import-keypair", (req: Request, res: Response) => {
    try {
      const secp256k1 = require("secp256k1");
      const { privateToAddress } = require("ethereumjs-util");
      let privateKeyHex = req.body.privateKeyHex as string;
      if (!privateKeyHex || typeof privateKeyHex !== "string") {
        return res.status(400).json({ error: "Private key (hex) is required" });
      }
      privateKeyHex = privateKeyHex.replace(/^0x/i, "").trim();
      if (privateKeyHex.length !== 64 || !/^[a-fA-F0-9]+$/.test(privateKeyHex)) {
        return res.status(400).json({
          error: "Invalid private key. Must be 64 hexadecimal characters (with or without 0x prefix).",
        });
      }
      const privateKey = Buffer.from(privateKeyHex, "hex");
      if (!secp256k1.privateKeyVerify(privateKey)) {
        return res.status(400).json({ error: "Invalid private key for secp256k1 curve." });
      }
      const publicKey = secp256k1.publicKeyCreate(privateKey, false);
      const publicKeyBuffer = Buffer.from(publicKey.slice(1));
      const ethereumAddress = privateToAddress(privateKey);
      res.json({
        privateKey: privateKey.toString("hex"),
        publicKey: Buffer.from(publicKey).toString("hex"),
        ethereumAddress: "0x" + ethereumAddress.toString("hex"),
        publicKeyUncompressed: publicKeyBuffer.toString("hex"),
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post("/public-key-to-address", (req: Request, res: Response) => {
    try {
      const { pubToAddress } = require("ethereumjs-util");
      let publicKeyHex = req.body.publicKeyHex as string;
      if (!publicKeyHex || typeof publicKeyHex !== "string") {
        return res.status(400).json({ error: "Public key (hex) is required" });
      }
      publicKeyHex = publicKeyHex.replace(/^0x/i, "").trim();
      if (publicKeyHex.length === 132 && publicKeyHex.startsWith("04")) {
        publicKeyHex = publicKeyHex.slice(2);
      }
      if (publicKeyHex.length !== 130 || !/^[a-fA-F0-9]+$/.test(publicKeyHex)) {
        return res.status(400).json({
          error: "Invalid public key. Use uncompressed secp256k1 public key (130 hex chars, with or without 04 prefix).",
        });
      }
      const publicKeyBuffer = Buffer.from(publicKeyHex, "hex");
      const address = pubToAddress(publicKeyBuffer);
      res.json({ ethereumAddress: "0x" + address.toString("hex") });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post("/sign", (req: Request, res: Response) => {
    try {
      const secp256k1 = require("secp256k1");
      const { keccak256 } = require("ethereumjs-util");
      const { message, privateKeyHex } = req.body;
      if (!message || !privateKeyHex) {
        return res.status(400).json({ error: "Message and private key are required" });
      }
      const privateKey = Buffer.from(privateKeyHex, "hex");
      const messageHash = keccak256(Buffer.from(message));
      const signature = secp256k1.ecdsaSign(messageHash, privateKey);
      const signatureBuffer = Buffer.from(signature.signature);
      res.json({
        message,
        messageHash: messageHash.toString("hex"),
        signature: {
          r: signatureBuffer.slice(0, 32).toString("hex"),
          s: signatureBuffer.slice(32, 64).toString("hex"),
          recovery: signature.recid,
          full: signatureBuffer.toString("hex"),
        },
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post("/verify", (req: Request, res: Response) => {
    try {
      const secp256k1 = require("secp256k1");
      const { keccak256 } = require("ethereumjs-util");
      const { message, signatureHex, publicKeyHex } = req.body;
      if (!message || !signatureHex || !publicKeyHex) {
        return res.status(400).json({ error: "Message, signature, and public key are required" });
      }
      const publicKey = Buffer.from(publicKeyHex, "hex");
      const signature = Buffer.from(signatureHex, "hex");
      const messageHash = keccak256(Buffer.from(message));
      const isValid = secp256k1.ecdsaVerify(signature, messageHash, publicKey);
      res.json({ isValid, message, messageHash: messageHash.toString("hex") });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post("/encrypt", (req: Request, res: Response) => {
    try {
      const crypto = require("crypto");
      const { message, publicKeyHex } = req.body;
      if (!message || !publicKeyHex) {
        return res.status(400).json({ error: "Message and public key are required" });
      }
      const publicKey = Buffer.from(publicKeyHex, "hex");
      const keyMaterial = crypto.createHash("sha256").update(publicKey).digest();
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv("aes-256-cbc", keyMaterial, iv);
      let encrypted = cipher.update(message, "utf8", "hex");
      encrypted += cipher.final("hex");
      res.json({ encrypted, iv: iv.toString("hex"), publicKey: publicKeyHex });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post("/decrypt", (req: Request, res: Response) => {
    try {
      const crypto = require("crypto");
      const { encrypted, ivHex, privateKeyHex, publicKeyHex } = req.body;
      if (!encrypted || !ivHex || !privateKeyHex || !publicKeyHex) {
        return res.status(400).json({ error: "All fields are required for decryption" });
      }
      const publicKey = Buffer.from(publicKeyHex, "hex");
      const keyMaterial = crypto.createHash("sha256").update(publicKey).digest();
      const iv = Buffer.from(ivHex, "hex");
      const decipher = crypto.createDecipheriv("aes-256-cbc", keyMaterial, iv);
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");
      res.json({ decrypted, original: encrypted });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post("/sign-transaction", (req: Request, res: Response) => {
    try {
      const secp256k1 = require("secp256k1");
      const { keccak256, privateToAddress } = require("ethereumjs-util");
      const rlp = require("rlp");
      const { from, to, value, nonce, gasPrice, gasLimit, privateKey, data } = req.body;

      if (!from || (to === undefined && to !== null) || value === undefined || nonce === undefined || !gasPrice || !gasLimit || !privateKey) {
        return res.status(400).json({ error: "All transaction fields are required" });
      }

      let txData = "0x";
      if (data) {
        if (typeof data === "string") txData = data;
        else if (Buffer.isBuffer(data)) txData = "0x" + data.toString("hex");
        else txData = String(data);
        if (txData && txData !== "0x" && !txData.startsWith("0x")) txData = "0x" + txData;
      }

      const privateKeyBuffer = Buffer.from(privateKey, "hex");
      if (!secp256k1.privateKeyVerify(privateKeyBuffer)) {
        return res.status(400).json({ error: "Invalid private key" });
      }
      const derivedAddress = "0x" + privateToAddress(privateKeyBuffer).toString("hex");
      if (derivedAddress.toLowerCase() !== from.toLowerCase()) {
        return res.status(400).json({ error: 'Private key does not match the "From" address. Derived address: ' + derivedAddress });
      }

      const valueInWei = BigInt(Math.floor(parseFloat(value) * 1e18)).toString();
      const gasPriceInWei = BigInt(Math.floor(parseFloat(gasPrice) * 1e9)).toString();

      const numToBuffer = (num: number | string): Buffer => {
        if (num === 0 || num === "0" || (typeof num === "string" && num === "0")) return Buffer.alloc(0);
        const bigNum = typeof num === "string" ? BigInt(num) : BigInt(num);
        if (bigNum === 0n) return Buffer.alloc(0);
        const hex = bigNum.toString(16);
        return Buffer.from(hex.length % 2 === 0 ? hex : "0" + hex, "hex");
      };

      const hexToBuffer = (hex: string | null | undefined): Buffer => {
        if (hex === null || hex === undefined) return Buffer.alloc(0);
        if (!hex || hex === "0x" || hex === "") return Buffer.alloc(0);
        const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
        if (!/^[0-9a-fA-F]*$/.test(cleanHex)) throw new Error("Invalid hex string in data field");
        return Buffer.from(cleanHex, "hex");
      };

      const chainId = req.body.chainId !== undefined ? parseInt(req.body.chainId) : 11155111;
      const rawTransaction = {
        nonce: parseInt(nonce),
        gasPrice: gasPriceInWei,
        gasLimit: parseInt(gasLimit),
        to: to === null ? null : (to as string).toLowerCase(),
        value: valueInWei,
        data: txData,
        chainId,
      };

      let dataBuffer: Buffer;
      try {
        dataBuffer = hexToBuffer(txData);
      } catch (err) {
        return res.status(400).json({ error: "Invalid data field: " + (err as Error).message });
      }

      const txFields = [
        numToBuffer(rawTransaction.nonce),
        numToBuffer(rawTransaction.gasPrice),
        numToBuffer(rawTransaction.gasLimit),
        hexToBuffer(rawTransaction.to),
        numToBuffer(rawTransaction.value),
        dataBuffer,
        numToBuffer(chainId),
        Buffer.alloc(0),
        Buffer.alloc(0),
      ];

      const txRLP = rlp.encode(txFields);
      const txRLPBuffer = Buffer.isBuffer(txRLP) ? txRLP : Buffer.from(txRLP);
      const txHash = keccak256(txRLPBuffer);
      const signature = secp256k1.ecdsaSign(txHash, privateKeyBuffer);
      const recoveryId = signature.recid;
      const v = chainId * 2 + 35 + recoveryId;

      const signedTxFields = [
        numToBuffer(rawTransaction.nonce),
        numToBuffer(rawTransaction.gasPrice),
        numToBuffer(rawTransaction.gasLimit),
        hexToBuffer(rawTransaction.to),
        numToBuffer(rawTransaction.value),
        dataBuffer,
        numToBuffer(v),
        signature.signature.slice(0, 32),
        signature.signature.slice(32, 64),
      ];

      const signedTxRLP = rlp.encode(signedTxFields);
      const signedTxRLPBuffer = Buffer.isBuffer(signedTxRLP) ? signedTxRLP : Buffer.from(signedTxRLP);
      const finalTxHash = keccak256(signedTxRLPBuffer);

      res.json({
        rawTransaction: {
          nonce: "0x" + rawTransaction.nonce.toString(16),
          gasPrice: "0x" + BigInt(rawTransaction.gasPrice).toString(16),
          gasLimit: "0x" + rawTransaction.gasLimit.toString(16),
          to: rawTransaction.to,
          value: "0x" + BigInt(rawTransaction.value).toString(16),
          data: rawTransaction.data,
          chainId,
        },
        signedTransaction: "0x" + signedTxRLPBuffer.toString("hex"),
        transactionHash: "0x" + finalTxHash.toString("hex"),
        recoveryId,
        signature: {
          r: "0x" + signature.signature.slice(0, 32).toString("hex"),
          s: "0x" + signature.signature.slice(32, 64).toString("hex"),
          v: "0x" + v.toString(16),
        },
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post("/encode-function", (req: Request, res: Response) => {
    try {
      const { keccak256 } = require("ethereumjs-util");
      const abi = require("ethereumjs-abi");
      const { functionSignature, parameters } = req.body;
      if (!functionSignature) {
        return res.status(400).json({ error: "Function signature is required" });
      }
      const functionHash = keccak256(Buffer.from(functionSignature));
      const functionSelector = "0x" + functionHash.slice(0, 4).toString("hex");
      let encodedParameters = "";
      if (parameters && parameters.length > 0) {
        const match = functionSignature.match(/\(([^)]*)\)/);
        if (!match) return res.status(400).json({ error: "Invalid function signature" });
        const paramTypes = match[1].split(",").map((t: string) => t.trim()).filter((t: string) => t.length > 0);
        if (paramTypes.length !== parameters.length) {
          return res.status(400).json({
            error: `Parameter count mismatch. Expected ${paramTypes.length} parameters, got ${parameters.length}`,
          });
        }
        try {
          const encoded = abi.rawEncode(
            paramTypes,
            parameters.map((p: unknown) => {
              if (typeof p === "string" && /^\d+$/.test(p)) return BigInt(p);
              return p;
            })
          );
          encodedParameters = "0x" + encoded.toString("hex");
        } catch (err) {
          return res.status(400).json({ error: "Error encoding parameters: " + (err as Error).message });
        }
      }
      const selectorHex = functionSelector.slice(2);
      const paramsHex = encodedParameters ? encodedParameters.slice(2) : "";
      res.json({
        functionSelector,
        encodedParameters: encodedParameters || "0x",
        data: selectorHex + paramsHex,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post("/submit-transaction", async (req: Request, res: Response) => {
    try {
      const { rpcUrl, signedTransaction } = req.body;
      if (!rpcUrl || !signedTransaction) {
        return res.status(400).json({ error: "RPC URL and signed transaction are required" });
      }
      if (!signedTransaction.startsWith("0x")) {
        return res.status(400).json({ error: "Signed transaction must start with 0x" });
      }
      const rpcPayload = { jsonrpc: "2.0", method: "eth_sendRawTransaction", params: [signedTransaction], id: 1 };
      const url = new URL(rpcUrl);
      const isHttps = url.protocol === "https:";
      const client = isHttps ? https : http;
      const postData = JSON.stringify(rpcPayload);
      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(postData) },
      };
      const rpcResponse = await new Promise<{ error?: { message?: string }; result?: string }>((resolve, reject) => {
        const req = client.request(options, (res) => {
          let data = "";
          res.on("data", (chunk) => { data += chunk; });
          res.on("end", () => {
            try { resolve(JSON.parse(data)); } catch (e) { reject(new Error("Invalid JSON response from RPC")); }
          });
        });
        req.on("error", reject);
        req.write(postData);
        req.end();
      });
      if (rpcResponse.error) {
        return res.status(400).json({
          error: rpcResponse.error.message || "RPC error: " + JSON.stringify(rpcResponse.error),
        });
      }
      if (!rpcResponse.result) {
        return res.status(400).json({ error: "No transaction hash returned from RPC" });
      }
      res.json({ transactionHash: rpcResponse.result, rpcUrl });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post("/compile-solidity", async (req: Request, res: Response) => {
    try {
      const solc = require("solc");
      const { code } = req.body;
      if (!code) return res.status(400).json({ error: "Solidity code is required" });
      const input = {
        language: "Solidity",
        sources: { "Contract.sol": { content: code } },
        settings: { outputSelection: { "*": { "*": ["evm.bytecode"] } } },
      };
      const output = JSON.parse(solc.compile(JSON.stringify(input)));
      if (output.errors) {
        const errors = output.errors.filter((e: { severity?: string }) => e.severity === "error");
        if (errors.length > 0) {
          return res.status(400).json({
            error: "Compilation errors",
            errors: errors.map((e: { formattedMessage?: string; message?: string }) => e.formattedMessage || e.message),
          });
        }
      }
      const contracts = output.contracts["Contract.sol"];
      if (!contracts || Object.keys(contracts).length === 0) {
        return res.status(400).json({ error: "No contracts found in the code" });
      }
      const contractName = Object.keys(contracts)[0];
      const bytecode = contracts[contractName].evm.bytecode.object;
      if (!bytecode || bytecode === "") {
        return res.status(400).json({
          error: "No bytecode generated. Make sure your contract has a constructor or is deployable.",
        });
      }
      const cleanBytecode = bytecode.startsWith("0x") ? bytecode.slice(2) : bytecode;
      res.json({ bytecode: cleanBytecode, contractName });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  return router;
}
