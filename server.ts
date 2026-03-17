import express from "express";
import path from "path";
import { createXrplRouter } from "./api/xrpl";
import { createEthereumRouter } from "./api/ethereum";

// When compiled to dist/, static files are in project root (one level up)
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");
const assetsDir = path.join(rootDir, "assets");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(publicDir));
app.use("/assets", express.static(assetsDir));
app.use(express.json());

app.use("/api", createXrplRouter());
app.use("/api", createEthereumRouter());

app.get("/", (req, res) => {
  res.redirect("/public-key-cryptography/intro.html");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
