const express = require("express");
const cors = require("cors");
const empresas = require("./empresas.json");

const app = express();

app.use(cors());
app.use(express.json());

function normalizarCnpj(cnpj) {
  return String(cnpj || "").replace(/\D/g, "");
}

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    totalEmpresas: empresas.length,
  });
});

app.get("/api/empresas/cnpj/:cnpj", (req, res) => {
  const cnpj = normalizarCnpj(req.params.cnpj);

  if (cnpj.length !== 14) {
    return res.status(400).json({
      mensagem: "CNPJ deve possuir 14 dígitos.",
    });
  }

  const empresa = empresas.find((item) => {
    const valor = normalizarCnpj(item.cnpj || item.CNPJ);
    return valor === cnpj;
  });

  if (!empresa) {
    return res.status(404).json({
      mensagem: "CNPJ não encontrado.",
    });
  }

  return res.json(empresa);
});

// Executa apenas localmente
if (require.main === module) {
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`API POC rodando na porta ${PORT}`);
  });
}

module.exports = app;