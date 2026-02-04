const express = require("express");
const cors = require("cors");
const multer = require("multer");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }
});

// Teste simples
app.get("/", (req, res) => {
  res.send("OK");
});

app.post("/api/test", upload.any(), (req, res) => {
  console.log("Campos:", req.body);
  console.log("Ficheiros:", req.files);
  res.json({ ok: true });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log("Servidor ligado na porta", PORT);
});