import { Router, Request, Response } from "express";

const XRPL_DEFAULT_WS = "wss://testnet.xrpl-labs.com";

export function createXrplRouter(): Router {
  const router = Router();

  // Generate a new account using secp256k1
  router.post("/xrpl-generate-account", (req: Request, res: Response) => {
    try {
      const xrpl = require("xrpl");
      const wallet = xrpl.Wallet.generate(xrpl.ECDSA.secp256k1);
      res.json({
        seed: wallet.seed,
        classicAddress: wallet.classicAddress,
        address: wallet.classicAddress,
        publicKey: wallet.publicKey,
        xAddress: wallet.getXAddress ? wallet.getXAddress(false, false) : null,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Import account from secret or hex private key
  router.post("/xrpl-import-account", (req: Request, res: Response) => {
    try {
      const { Wallet } = require("xrpl");
      const secp256k1 = require("secp256k1");
      const { secret, privateKeyHex } = req.body;
      let wallet;

      if (secret && typeof secret === "string" && secret.trim()) {
        wallet = Wallet.fromSeed(secret.trim());
      } else if (privateKeyHex && typeof privateKeyHex === "string") {
        let hex = privateKeyHex.replace(/^0x/i, "").trim();
        if (hex.length !== 64 || !/^[a-fA-F0-9]+$/.test(hex)) {
          return res.status(400).json({
            error: "Invalid private key. Use 64 hexadecimal characters (with or without 0x prefix).",
          });
        }
        const privateKeyBuffer = Buffer.from(hex, "hex");
        if (!secp256k1.privateKeyVerify(privateKeyBuffer)) {
          return res.status(400).json({ error: "Invalid private key for secp256k1 curve." });
        }
        const publicKeyCompressed = secp256k1.publicKeyCreate(privateKeyBuffer, true);
        const publicKeyHex = Buffer.from(publicKeyCompressed).toString("hex");
        wallet = new Wallet(publicKeyHex, "00" + hex);
      } else {
        return res.status(400).json({ error: "Provide either secret (family seed) or privateKeyHex." });
      }

      res.json({
        classicAddress: wallet.classicAddress,
        address: wallet.address,
        publicKey: wallet.publicKey,
        xAddress: wallet.getXAddress ? wallet.getXAddress(false, false) : null,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get account status and XRP balance
  router.post("/xrpl-account-info", async (req: Request, res: Response) => {
    try {
      const xrpl = require("xrpl");
      const classicAddress = (req.body?.classicAddress as string)?.trim();
      if (!classicAddress) {
        return res.status(400).json({ error: "classicAddress is required" });
      }
      let wsUrl = ((req.body?.wsUrl as string) || "").trim() || XRPL_DEFAULT_WS;
      if (!/^wss?:\/\//i.test(wsUrl)) {
        return res.status(400).json({ error: "wsUrl must be a valid WebSocket URL (wss:// or ws://)" });
      }
      const client = new xrpl.Client(wsUrl);
      await client.connect();
      try {
        const response = await client.request({
          command: "account_info",
          account: classicAddress,
          ledger_index: "validated",
        });
        const result = response.result as {
          error?: string;
          account_data?: { Balance: string; Flags?: number };
        };
        if (result.error === "actNotFound" || !result.account_data) {
          return res.json({ active: false, balance: null });
        }
        const balanceXrp = xrpl.dropsToXrp(result.account_data.Balance);
        const flags = result.account_data.Flags ?? 0;
        const defaultRippleFlag =
          xrpl.AccountRootFlags && typeof xrpl.AccountRootFlags.lsfDefaultRipple === "number"
            ? xrpl.AccountRootFlags.lsfDefaultRipple
            : 0x00800000;
        const requireAuthFlag =
          xrpl.AccountRootFlags && typeof xrpl.AccountRootFlags.lsfRequireAuth === "number"
            ? xrpl.AccountRootFlags.lsfRequireAuth
            : 0x00040000;
        const defaultRippleEnabled = (flags & defaultRippleFlag) !== 0;
        const requireAuthEnabled = (flags & requireAuthFlag) !== 0;
        return res.json({
          active: true,
          balance: String(balanceXrp),
          flags,
          defaultRippleEnabled,
          requireAuthEnabled,
        });
      } finally {
        await client.disconnect();
      }
    } catch (error: unknown) {
      if (error && typeof error === "object" && (error as { data?: { error?: string } }).data?.error === "actNotFound") {
        return res.json({ active: false, balance: null });
      }
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Sign a transaction
  router.post("/xrpl-sign-transaction", (req: Request, res: Response) => {
    try {
      const xrpl = require("xrpl");
      const secp256k1 = require("secp256k1");
      const { transaction, secret, privateKeyHex } = req.body;

      if (!transaction || typeof transaction !== "object") {
        return res.status(400).json({ error: "transaction (object) is required" });
      }

      let wallet;
      if (secret && typeof secret === "string" && secret.trim()) {
        wallet = xrpl.Wallet.fromSeed(secret.trim());
      } else if (privateKeyHex && typeof privateKeyHex === "string") {
        let hex = privateKeyHex.replace(/^0x/i, "").trim();
        if (hex.length !== 64 || !/^[a-fA-F0-9]+$/.test(hex)) {
          return res.status(400).json({ error: "Invalid private key. Use 64 hexadecimal characters." });
        }
        const privateKeyBuffer = Buffer.from(hex, "hex");
        if (!secp256k1.privateKeyVerify(privateKeyBuffer)) {
          return res.status(400).json({ error: "Invalid private key for secp256k1." });
        }
        const publicKeyCompressed = secp256k1.publicKeyCreate(privateKeyBuffer, true);
        const publicKeyHex = Buffer.from(publicKeyCompressed).toString("hex");
        wallet = new xrpl.Wallet(publicKeyHex, "00" + hex);
      } else {
        return res.status(400).json({ error: "Provide either secret (family seed) or privateKeyHex." });
      }

      const signed = wallet.sign(transaction);
      res.json({ tx_blob: signed.tx_blob, hash: signed.hash });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Combine multi-signature tx_blobs into one transaction
  router.post("/xrpl-multisign-combine", (req: Request, res: Response) => {
    try {
      const xrpl = require("xrpl");
      const blobs = req.body?.tx_blobs;
      if (!Array.isArray(blobs) || blobs.length < 2) {
        return res.status(400).json({ error: "tx_blobs must be an array with at least 2 signed tx_blob values." });
      }
      const cleaned = blobs.map((b: unknown) => (typeof b === "string" ? b.trim() : "")).filter(Boolean);
      if (cleaned.length < 2) {
        return res.status(400).json({ error: "Provide at least 2 non-empty tx_blob values." });
      }
      const combinedTxBlob = xrpl.multisign(cleaned);
      return res.json({ combinedTxBlob });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Submit a signed transaction
  router.post("/xrpl-submit-transaction", async (req: Request, res: Response) => {
    try {
      const xrpl = require("xrpl");
      const txBlob = (req.body?.tx_blob as string)?.trim();
      if (!txBlob) {
        return res.status(400).json({ error: "tx_blob is required" });
      }
      let wsUrl = ((req.body?.wsUrl as string) || "").trim() || XRPL_DEFAULT_WS;
      if (!/^wss?:\/\//i.test(wsUrl)) {
        return res.status(400).json({ error: "wsUrl must be a valid WebSocket URL (wss:// or ws://)" });
      }
      const client = new xrpl.Client(wsUrl);
      await client.connect();
      try {
        const response = await client.request({
          command: "submit",
          tx_blob: txBlob,
          fail_hard: false,
        });
        const result = response.result as {
          engine_result: string;
          engine_result_message?: string;
          tx_json?: { hash?: string };
          transaction?: { hash?: string };
          hash?: string;
        };
        const engineResult = result.engine_result;
        const txJson = result.tx_json || result.transaction;
        const hash = txJson?.hash || result.hash;
        if (engineResult === "tesSUCCESS" || engineResult === "terQUEUED") {
          return res.json({
            success: true,
            transactionHash: hash,
            engine_result: engineResult,
            message: result.engine_result_message ?? null,
          });
        }
        return res.status(400).json({
          success: false,
          error: result.engine_result_message || engineResult,
          engine_result: engineResult,
          transactionHash: hash ?? null,
        });
      } finally {
        await client.disconnect();
      }
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // List NFTs owned by an account
  router.post("/xrpl-account-nfts", async (req: Request, res: Response) => {
    try {
      const xrpl = require("xrpl");
      const classicAddress = (req.body?.classicAddress as string)?.trim();
      if (!classicAddress) {
        return res.status(400).json({ error: "classicAddress is required" });
      }
      let wsUrl = ((req.body?.wsUrl as string) || "").trim() || XRPL_DEFAULT_WS;
      if (!/^wss?:\/\//i.test(wsUrl)) {
        return res.status(400).json({ error: "wsUrl must be a valid WebSocket URL (wss:// or ws://)" });
      }
      const client = new xrpl.Client(wsUrl);
      await client.connect();
      try {
        const response = await client.request({
          command: "account_nfts",
          account: classicAddress,
          ledger_index: "validated",
        });
        return res.json(response.result);
      } finally {
        await client.disconnect();
      }
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get basic history for a specific NFT (if supported by server)
  router.post("/xrpl-nft-history", async (req: Request, res: Response) => {
    try {
      const xrpl = require("xrpl");
      const nftId = (req.body?.nftId as string)?.trim();
      if (!nftId) {
        return res.status(400).json({ error: "nftId is required" });
      }
      let wsUrl = ((req.body?.wsUrl as string) || "").trim() || XRPL_DEFAULT_WS;
      if (!/^wss?:\/\//i.test(wsUrl)) {
        return res.status(400).json({ error: "wsUrl must be a valid WebSocket URL (wss:// or ws://)" });
      }
      const client = new xrpl.Client(wsUrl);
      await client.connect();
      try {
        // Some servers may support an nft_history or similar method; fall back gracefully if not.
        const response = await client.request({
          command: "nft_history",
          nft_id: nftId,
          ledger_index: "validated",
        } as any);
        return res.json(response.result);
      } catch (err: any) {
        // If the server does not support nft_history, expose a clear message
        if (err && typeof err === "object" && (err.message || "").includes("unknownCmd")) {
          return res.status(400).json({
            error: "NFT history is not supported by the connected XRPL server.",
          });
        }
        throw err;
      } finally {
        await client.disconnect();
      }
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Fetch order book (sell & buy offers) for a currency pair
  router.post("/xrpl-orderbook", async (req: Request, res: Response) => {
    try {
      const xrpl = require("xrpl");
      const {
        baseCurrency,
        baseIssuer,
        counterCurrency,
        counterIssuer,
        ledgerIndex,
        wsUrl: bodyWsUrl,
      } = req.body || {};

      const baseCur = (baseCurrency as string || "").trim().toUpperCase();
      const ctrCur = (counterCurrency as string || "").trim().toUpperCase();

      if (!baseCur || !ctrCur) {
        return res.status(400).json({ error: "baseCurrency and counterCurrency are required." });
      }

      function buildAmount(currency: string, issuerRaw: string | undefined) {
        if (currency === "XRP") {
          return { currency: "XRP" };
        }
        const issuer = (issuerRaw || "").trim();
        if (!issuer) {
          throw new Error(`Issuer is required for non-XRP currency ${currency}.`);
        }
        return { currency, issuer };
      }

      let takerGetsBase;
      let takerPaysBase;
      try {
        takerGetsBase = buildAmount(baseCur, baseIssuer);
        takerPaysBase = buildAmount(ctrCur, counterIssuer);
      } catch (err) {
        return res.status(400).json({ error: (err as Error).message });
      }

      let wsUrl = (bodyWsUrl as string || "").trim() || XRPL_DEFAULT_WS;
      if (!/^wss?:\/\//i.test(wsUrl)) {
        return res.status(400).json({ error: "wsUrl must be a valid WebSocket URL (wss:// or ws://)" });
      }

      const client = new xrpl.Client(wsUrl);
      await client.connect();
      try {
        const ledger_index = (ledgerIndex as string || "").trim() || "validated";

        const sellResponse = await client.request({
          command: "book_offers",
          taker_gets: takerGetsBase,
          taker_pays: takerPaysBase,
          ledger_index,
        });

        const buyResponse = await client.request({
          command: "book_offers",
          taker_gets: takerPaysBase,
          taker_pays: takerGetsBase,
          ledger_index,
        });

        return res.json({
          ledger_index,
          base: takerGetsBase,
          counter: takerPaysBase,
          sells: sellResponse.result.offers || [],
          buys: buyResponse.result.offers || [],
        });
      } finally {
        await client.disconnect();
      }
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  return router;
}
