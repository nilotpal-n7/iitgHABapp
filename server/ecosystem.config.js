module.exports = {
  apps : [{
    name   : "gateway",
    script : "./index.js",
    env: { PORT: 3000 }
  }, {
    name   : "api-v1",
    script : "./index.js", // Relative to cwd
    cwd: "./v1", // Sets the "Current Working Directory" so imports work
    env: { PORT: 3001 }
  }, {
    name   : "api-v2",
    script : "./index.js", // Relative to cwd
    cwd: "./v2",
    env: { PORT: 3002 }
  }]
}
