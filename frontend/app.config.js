// app.config.js
const fs = require("fs");
const dotenv = require("dotenv");

module.exports = ({ config }) => {
  const envName = process.env.APP_ENV || "dev"; // 'dev' | 'prod'
  const envFile = envName === "prod" ? ".env.prod" : ".env.dev";

  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
    console.log(`[app.config] loaded ${envFile}`);
  } else {
    console.warn(`[app.config] ${envFile} not found, falling back to process.env`);
  }

  return {
    ...config,
    extra: {
      // Expo espone questi valori in manifest.extra
      EXPO_PUBLIC_API_BASE: process.env.EXPO_PUBLIC_API_BASE || ""
    }
  };
};