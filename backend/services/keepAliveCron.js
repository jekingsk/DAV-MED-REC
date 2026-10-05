const https = require("https");
const http = require("http");

let keepAliveInterval = null;
let lastPingTime = null;
let pingCount = 0;

/**
 * Pings the server's public URL to prevent Render from going to sleep
 */
function pingHealth(targetUrl) {
  if (!targetUrl) return;

  const url = targetUrl.endsWith("/health") ? targetUrl : `${targetUrl.replace(/\/$/, "")}/health`;
  const isHttps = url.startsWith("https://");
  const client = isHttps ? https : http;

  const req = client.get(url, (res) => {
    lastPingTime = new Date().toISOString();
    pingCount++;
    console.log(`[Keep-Alive Cron] Ping #${pingCount} successful -> ${url} (HTTP ${res.statusCode}) at ${lastPingTime}`);
  });

  req.on("error", (err) => {
    console.warn(`[Keep-Alive Cron] Ping failed -> ${url}: ${err.message}`);
  });

  req.setTimeout(10000, () => {
    req.destroy();
    console.warn(`[Keep-Alive Cron] Ping timed out -> ${url}`);
  });
}

/**
 * Initializes keep-alive schedule (runs every 14 minutes)
 */
function initKeepAliveCron() {
  const publicUrl =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.SERVER_URL ||
    process.env.BACKEND_URL ||
    process.env.PUBLIC_URL;

  if (!publicUrl) {
    console.log(
      "[Keep-Alive Cron] Notice: No RENDER_EXTERNAL_URL or SERVER_URL detected. Automated self-ping is in standby. Set RENDER_EXTERNAL_URL=https://your-service.onrender.com to enable."
    );
    return;
  }

  console.log(`[Keep-Alive Cron] Active: Configured to ping ${publicUrl} every 14 minutes to prevent Render sleep.`);

  // Immediate initial ping after 30 seconds
  setTimeout(() => {
    pingHealth(publicUrl);
  }, 30 * 1000);

  // Recurring ping every 14 minutes (14 * 60 * 1000 ms)
  const INTERVAL_MS = 14 * 60 * 1000;
  keepAliveInterval = setInterval(() => {
    pingHealth(publicUrl);
  }, INTERVAL_MS);
}

function getKeepAliveStatus() {
  return {
    configuredUrl:
      process.env.RENDER_EXTERNAL_URL ||
      process.env.SERVER_URL ||
      process.env.BACKEND_URL ||
      null,
    lastPingTime,
    totalPings: pingCount,
    status: keepAliveInterval ? "running" : "standby",
  };
}

module.exports = {
  initKeepAliveCron,
  pingHealth,
  getKeepAliveStatus,
};
