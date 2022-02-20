("use strict");

const { join } = require("path");
const { cwd } = require("process");
const WebpackMessages = require("webpack-messages");

module.exports = {
  externals: ["bufferutil", "utf-8-validate"],
  target: "node",
  mode: "production",
  entry: [join(cwd(), "apps", "server", "src", "index.ts")],
  output: {
    filename: "main.js",
    path: join(cwd(), "dist"),
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        loader: "ts-loader",
      },
      {
        test: /\.html$/,
        type: "asset/source",
      },
      {
        test: /\.exe$/,
        type: "asset/resource",
      },
      {
        test: /\.node$/,
        loader: "node-loader",
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  plugins: [
    new WebpackMessages({
      name: "server",
      logger: (str) => console.log(`>> ${str}`),
    }),
  ],
};
