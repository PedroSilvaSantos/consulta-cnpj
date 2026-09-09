const express = require("express");
const cors = require("cors");
const empresas = require("./empresas.json");

const { redis, conectarRedis } = require("./redis");

const app = express();

app.use(cors());
app.use(express.json());

function normalizarCnpj(cnpj) {
  return String(cnpj || "").replace(/\D/g, "");
}

/**
 * Índice em memória:
 * CNPJ -> empresa
 */
const empresasPorCnpj = new Map();

for (const empresa of empresas) {
  const cnpj = normalizarCnpj(empresa.cnpj || empresa.CNPJ);

  if (cnpj) {
    empresasPorCnpj.set(cnpj, empresa);
  }
}

/**
 * Health check
 */
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    totalEmpresas: empresas.length,
    redis: redis.isReady ? "online" : "offline",
  });
});

/**
 * Consulta empresa por CNPJ
 */
app.get("/api/empresas/cnpj/:cnpj", async (req, res) => {
  const cnpj = normalizarCnpj(req.params.cnpj);

  if (cnpj.length !== 14) {
    return res.status(400).json({
      mensagem: "CNPJ deve possuir 14 dígitos.",
    });
  }

  const cacheKey = `empresa:cnpj:${cnpj}`;

  /**
   * 1. Tenta consultar o Redis
   */
  try {
    await conectarRedis();

    const empresaCache = await redis.get(cacheKey);

    if (empresaCache) {
      console.log(`CACHE HIT: ${cnpj}`);

      return res.json(JSON.parse(empresaCache));
    }

    console.log(`CACHE MISS: ${cnpj}`);
  } catch (redisError) {
    console.error(
      "Redis indisponível:",
      redisError.message
    );
  }

  /**
   * 2. Consulta o índice em memória
   */
  const empresa = empresasPorCnpj.get(cnpj);

  if (!empresa) {
    return res.status(404).json({
      mensagem: "CNPJ não encontrado.",
    });
  }

  /**
   * 3. Tenta salvar no Redis
   */
  try {
    await conectarRedis();

    await redis.set(
      cacheKey,
      JSON.stringify(empresa),
      {
        EX: 60 * 60,
      }
    );

    console.log(`CACHE SET: ${cnpj}`);
  } catch (redisError) {
    console.error(
      "Não foi possível salvar no Redis:",
      redisError.message
    );
  }

  /**
   * 4. Retorna a empresa
   */
  return res.json(empresa);
});

/**
 * Inicialização local / Docker
 */
if (require.main === module) {
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`API rodando na porta ${PORT}`);
  });
}

module.exports = app;
