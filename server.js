const express = require("express");
const cors = require("cors");
const multer = require("multer");

const app = express();

// Para já: aceitar pedidos de qualquer site (tiiny.host incluído)
app.use(cors({ origin: "*" }));

// Para dados "normais" (JSON ou urlencoded)
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Para ficheiros (fotos, PDFs, etc.)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB por ficheiro
});

// Health check
app.get("/", (req, res) => res.status(200).send("OK"));

// Função para registar no Render Logs
function logRequest(label, req) {
  console.log(`\n=== ${label} ===`);
  console.log("Campos:", req.body);
  console.log(
    "Ficheiros:",
    (req.files || []).map((f) => ({
      fieldname: f.fieldname,
      originalname: f.originalname,
      size: f.size,
      mimetype: f.mimetype,
    }))
  );
}

// 1) Pedir Orçamentos (ownerForm)
app.post("/api/orcamentos", upload.any(), (req, res) => {
  logRequest("ORCAMENTOS", req);
  return res.status(200).json({ ok: true });
});

// 2) Seguros (seguroForm)
app.post("/api/seguros", upload.any(), (req, res) => {
  logRequest("SEGUROS", req);
  return res.status(200).json({ ok: true });
});

// 3) Apoios do Estado (estadoForm)
app.post("/api/apoios-estado", upload.any(), (req, res) => {
  logRequest("APOIOS-ESTADO", req);
  return res.status(200).json({ ok: true });
});

// 4) Sou Empreiteiro (contractorForm)
app.post("/api/empreiteiros", upload.any(), (req, res) => {
  logRequest("EMPREITEIROS", req);
  return res.status(200).json({ ok: true });
});

// IMPORTANTÍSSIMO no Render: usar a porta que ele fornece
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor ligado na porta", PORT))
