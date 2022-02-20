const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const WebpackMessages = require("webpack-messages");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const { join } = require("path");
const { cwd } = require("process");

const fileExtensions = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "eot",
  "otf",
  "svg",
  "ttf",
  "woff",
  "woff2",
  "wav",
];

module.exports = {
  resolve: {
    fallback: {
      util: false,
      http: false,
      process: false,
    },
    extensions: [".js", ".jsx", ".ts", ".tsx"],
  },
  mode: "production",
  entry: [join(cwd(), "apps", "webapp", "src", "index.ts")],
  output: {
    path: join(cwd(), "dist", "webapp"),
    filename: "[name].[fullhash].js",
    publicPath: "/",
  },
  stats: "errors-only",
  performance: {
    hints: false,
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all",
        },
      },
    },
  },
  watchOptions: {
    ignored: "/node_modules/",
  },
  module: {
    rules: [
      {
        test: new RegExp(".(" + fileExtensions.join("|") + ")$"),
        loader: "file-loader",
        options: {
          name: "[name].[ext]",
        },
        exclude: /node_modules/,
      },
      {
        test: /\.html$/,
        loader: "html-loader",
        exclude: /node_modules/,
      },
      {
        exclude: /node_modules/,
        test: /\.(css|scss)$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
          },
          "postcss-loader",
          {
            loader: "sass-loader",
            options: {
              sourceMap: true,
            },
          },
        ],
      },
      {
        exclude: /node_modules/,
        test: /.[tj]sx?$/,
        use: {
          loader: "ts-loader",
        },
      },
    ],
  },
  plugins: [
    new WebpackMessages({
      name: "client",
      logger: (str) => console.log(`>> ${str}`),
    }),
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin(),
    new NodePolyfillPlugin(),
    new HtmlWebpackPlugin({
      template: join(cwd(), "apps", "webapp", "public", "index.html"),
    }),
  ],
};
