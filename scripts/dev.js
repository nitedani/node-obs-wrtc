const webpack = require("webpack");
const serverOptions = require("../apps/server/webpack.config.js");
const webappOptions = require("../apps/webapp/webpack.config.js");

const { spawn } = require("child_process");
process.env.NODE_ENV = "development";
const serverCompiler = webpack({ ...serverOptions, mode: "development" });
const webappCompiler = webpack({ ...webappOptions, mode: "development" });
let cp = null;

serverCompiler.hooks.watchRun.tap("WatchRun", (compilation) => {
  if (cp) {
    cp.kill();
    cp = null;
  }
});

serverCompiler.watch({ ignored: /node_modules/ }, (err, stats) => {
  if (!cp) {
    cp = spawn("node", ["dist/main.js"], { stdio: "inherit" });
  }
});

webappCompiler.watch({ ignored: /node_modules/ }, (err, stats) => {});
