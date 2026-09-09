const { createClient } = require("redis");

const redis = createClient({
  url: process.env.REDIS_URL,
});

redis.on("error", (err) => {
  console.error("Erro no Redis:", err.message);
});

redis.on("connect", () => {
  console.log("Redis conectando...");
});

redis.on("ready", () => {
  console.log("Redis pronto.");
});

redis.on("reconnecting", () => {
  console.log("Redis reconectando...");
});

async function conectarRedis() {
  if (redis.isReady) {
    return;
  }

  if (!redis.isOpen) {
    await redis.connect();
  }
}

module.exports = {
  redis,
  conectarRedis,
};
