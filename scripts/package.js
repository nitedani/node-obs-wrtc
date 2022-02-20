const { join } = require("path");
const { cwd } = require("process");
const webpack = require("webpack");
const serverOptions = require("../apps/server/webpack.config.js");
const webappOptions = require("../apps/webapp/webpack.config.js");
const { path7za } = require("7zip-bin");
const { spawnSync, execSync } = require("child_process");
const rimraf = require("rimraf");

const distPath = join(cwd(), "dist");
const sfxPath = join(cwd(), "sfx");
const nodePath = join(cwd(), "sfx", "node.exe");

rimraf.sync(distPath);

const run = (compiler) =>
  new Promise((resolve) => {
    compiler.run(() => {
      resolve();
    });
  });

(async () => {
  await Promise.all([run(webpack(serverOptions)), run(webpack(webappOptions))]);

  spawnSync(
    path7za,
    ["a", `${distPath}\\built.7z`, `${distPath}\\*`, nodePath],
    {
      stdio: "inherit",
    }
  );

  execSync(
    `COPY /b "${sfxPath}\\7z.sfx" + "${sfxPath}\\sfx.txt" + "${distPath}\\built.7z" "${distPath}\\built.exe"`,
    {
      stdio: "inherit",
    }
  );
})();
