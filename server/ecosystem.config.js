module.exports = {
  apps : [{
    name   : "gateway",
    script : "./index.js",
    env: { PORT: 3000 }
  }, {
    name   : "api-v1",
    script : "./v1/index.js", // Ensure paths match your structure
    cwd: "./v1" // Sets the "Current Working Directory" so imports work
  }, {
    name   : "api-v2",
    script : "./v2/index.js",
    cwd: "./v2"
  }]
}
