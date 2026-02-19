const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { Pool } = require("pg");
const nodemailer = require("nodemailer");

const app = express();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orcamentos (
      id SERIAL PRIMARY KEY,
      nome TEXT, email TEXT, telefone TEXT, morada TEXT,
      distrito TEXT, tipo_dano TEXT, descricao TEXT, urgencia TEXT,
      ficheiros JSONB DEFAULT '[]',
      criado_em TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS seguros (
      id SERIAL PRIMARY KEY,
      nome TEXT, email TEXT, telefone TEXT, morada TEXT,
      seguradora TEXT, numero_apolice TEXT, descricao TEXT,
      ficheiros JSONB DEFAULT '[]',
      criado_em TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS apoios_estado (
      id SERIAL PRIMARY KEY,
      nome TEXT, email TEXT, telefone TEXT, morada TEXT,
      nif TEXT, tipo_apoio TEXT, descricao TEXT,
      ficheiros JSONB DEFAULT '[]',
      criado_em TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS empreiteiros (
      id SERIAL PRIMARY KEY,
      nome TEXT, email TEXT, telefone TEXT, empresa TEXT,
      nif TEXT, distrito TEXT, especialidades TEXT, anos_experiencia TEXT,
      ficheiros JSONB DEFAULT '[]',
      criado_em TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log("✅ Base de dados iniciada");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function enviarEmailNotificacao({ assunto, html }) {
  try {
    await transporter.sendMail({
      from: `"Reconstruir Portugal" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_DESTINO || process.env.EMAIL_USER,
      subject: assunto,
      html,
    });
    console.log(`📧 Email enviado: ${assunto}`);
  } catch (err) {
    console.error("❌ Erro ao enviar email:", err.message);
  }
}

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

app.get("/", (req, res) => res.status(200).send("OK"));

function infoFicheiros(files = []) {
  return files.map((f) => ({
    nome: f.originalname,
    tamanho: f.size,
    tipo: f.mimetype,
  }));
}

app.post("/api/orcamentos", upload.any(), async (req, res) => {
  const b = req.body;
  const ficheiros = infoFicheiros(req.files);
  try {
    const { rows } = await pool.query(
      `INSERT INTO orcamentos (nome, email, telefone, morada, distrito, tipo_dano, descricao, urgencia, ficheiros)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [b.nome, b.email, b.telefone, b.morada, b.distrito, b.tipo_dano, b.descricao, b.urgencia, JSON.stringify(ficheiros)]
    );
    await enviarEmailNotificacao({
      assunto: `📋 Novo pedido de orçamento #${rows[0].id} — ${b.nome}`,
      html: `<h2>Novo Pedido de Orçamento</h2>
        <table cellpadding="6">
          <tr><td><b>ID</b></td><td>#${rows[0].id}</td></tr>
          <tr><td><b>Nome</b></td><td>${b.nome || "—"}</td></tr>
          <tr><td><b>Email</b></td><td>${b.email || "—"}</td></tr>
          <tr><td><b>Telefone</b></td><td>${b.telefone || "—"}</td></tr>
          <tr><td><b>Morada</b></td><td>${b.morada || "—"}</td></tr>
          <tr><td><b>Distrito</b></td><td>${b.distrito || "—"}</td></tr>
          <tr><td><b>Tipo de dano</b></td><td>${b.tipo_dano || "—"}</td></tr>
          <tr><td><b>Urgência</b></td><td>${b.urgencia || "—"}</td></tr>
          <tr><td><b>Descrição</b></td><td>${b.descricao || "—"}</td></tr>
        </table>`,
    });
    return res.status(200).json({ ok: true, id: rows[0].id });
  } catch (err) {
    console.error("Erro /api/orcamentos:", err);
    return res.status(500).json({ ok: false, erro: "Erro interno" });
  }
});

app.post("/api/seguros", upload.any(), async (req, res) => {
  const b = req.body;
  const ficheiros = infoFicheiros(req.files);
  try {
    const { rows } = await pool.query(
      `INSERT INTO seguros (nome, email, telefone, morada, seguradora, numero_apolice, descricao, ficheiros)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [b.nome, b.email, b.telefone, b.morada, b.seguradora, b.numero_apolice, b.descricao, JSON.stringify(ficheiros)]
    );
    await enviarEmailNotificacao({
      assunto: `🛡️ Novo pedido de seguro #${rows[0].id} — ${b.nome}`,
      html: `<h2>Novo Pedido de Seguro</h2>
        <table cellpadding="6">
          <tr><td><b>ID</b></td><td>#${rows[0].id}</td></tr>
          <tr><td><b>Nome</b></td><td>${b.nome || "—"}</td></tr>
          <tr><td><b>Email</b></td><td>${b.email || "—"}</td></tr>
          <tr><td><b>Telefone</b></td><td>${b.telefone || "—"}</td></tr>
          <tr><td><b>Morada</b></td><td>${b.morada || "—"}</td></tr>
          <tr><td><b>Seguradora</b></td><td>${b.seguradora || "—"}</td></tr>
          <tr><td><b>Nº Apólice</b></td><td>${b.numero_apolice || "—"}</td></tr>
          <tr><td><b>Descrição</b></td><td>${b.descricao || "—"}</td></tr>
        </table>`,
    });
    return res.status(200).json({ ok: true, id: rows[0].id });
  } catch (err) {
    console.error("Erro /api/seguros:", err);
    return res.status(500).json({ ok: false, erro: "Erro interno" });
  }
});

app.post("/api/apoios-estado", upload.any(), async (req, res) => {
  const b = req.body;
  const ficheiros = infoFicheiros(req.files);
  try {
    const { rows } = await pool.query(
      `INSERT INTO apoios_estado (nome, email, telefone, morada, nif, tipo_apoio, descricao, ficheiros)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [b.nome, b.email, b.telefone, b.morada, b.nif, b.tipo_apoio, b.descricao, JSON.stringify(ficheiros)]
    );
    await enviarEmailNotificacao({
      assunto: `🏛️ Novo pedido de apoio do estado #${rows[0].id} — ${b.nome}`,
      html: `<h2>Novo Pedido de Apoio do Estado</h2>
        <table cellpadding="6">
          <tr><td><b>ID</b></td><td>#${rows[0].id}</td></tr>
          <tr><td><b>Nome</b></td><td>${b.nome || "—"}</td></tr>
          <tr><td><b>Email</b></td><td>${b.email || "—"}</td></tr>
          <tr><td><b>Telefone</b></td><td>${b.telefone || "—"}</td></tr>
          <tr><td><b>Morada</b></td><td>${b.morada || "—"}</td></tr>
          <tr><td><b>NIF</b></td><td>${b.nif || "—"}</td></tr>
          <tr><td><b>Tipo de apoio</b></td><td>${b.tipo_apoio || "—"}</td></tr>
          <tr><td><b>Descrição</b></td><td>${b.descricao || "—"}</td></tr>
        </table>`,
    });
    return res.status(200).json({ ok: true, id: rows[0].id });
  } catch (err) {
    console.error("Erro /api/apoios-estado:", err);
    return res.status(500).json({ ok: false, erro: "Erro interno" });
  }
});

app.post("/api/empreiteiros", upload.any(), async (req, res) => {
  const b = req.body;
  const ficheiros = infoFicheiros(req.files);
  try {
    const { rows } = await pool.query(
      `INSERT INTO empreiteiros (nome, email, telefone, empresa, nif, distrito, especialidades, anos_experiencia, ficheiros)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [b.nome, b.email, b.telefone, b.empresa, b.nif, b.distrito, b.especialidades, b.anos_experiencia, JSON.stringify(ficheiros)]
    );
    await enviarEmailNotificacao({
      assunto: `🔨 Novo empreiteiro registado #${rows[0].id} — ${b.nome}`,
      html: `<h2>Novo Registo de Empreiteiro</h2>
        <table cellpadding="6">
          <tr><td><b>ID</b></td><td>#${rows[0].id}</td></tr>
          <tr><td><b>Nome</b></td><td>${b.nome || "—"}</td></tr>
          <tr><td><b>Email</b></td><td>${b.email || "—"}</td></tr>
          <tr><td><b>Telefone</b></td><td>${b.telefone || "—"}</td></tr>
          <tr><td><b>Empresa</b></td><td>${b.empresa || "—"}</td></tr>
          <tr><td><b>NIF</b></td><td>${b.nif || "—"}</td></tr>
          <tr><td><b>Distrito</b></td><td>${b.distrito || "—"}</td></tr>
          <tr><td><b>Especialidades</b></td><td>${b.especialidades || "—"}</td></tr>
          <tr><td><b>Anos experiência</b></td><td>${b.anos_experiencia || "—"}</td></tr>
        </table>`,
    });
    return res.status(200).json({ ok: true, id: rows[0].id });
  } catch (err) {
    console.error("Erro /api/empreiteiros:", err);
    return res.status(500).json({ ok: false, erro: "Erro interno" });
  }
});

const PORT = process.env.PORT || 3000;

initDB()
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 Servidor ligado na porta ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ Falha ao iniciar base de dados:", err);
    process.exit(1);
  });
