module.exports = {
  apps: [
    {
      name: "simulador-backend",
      script: "./dist/index.js", // O la ruta donde quede tu index compilado
      instances: "max", // Usa todos los núcleos del procesador (Modo Cluster)
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G", // Si consume más de 1GB de RAM, se reinicia solo por seguridad
      env: {
        NODE_ENV: "production",
      }
    }
  ]
};