module.exports = {
  apps: [
    {
      name: "saversbd-web",
      // Requires `BUILD_STANDALONE=1 npm run build`, then copy `public` and
      // `.next/static` into `.next/standalone` (see README → VPS).
      script: ".next/standalone/server.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
      },
    },
  ],
};
