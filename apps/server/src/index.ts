import "colors";
import { spawn } from "child_process";
import express, { json, raw } from "express";
import http from "http";
import path, { join } from "path";
import { createHttpClient } from "tunnelr";
import WRTC from "wrtc";
import { WebRTCConnectionManager } from "./conn-manager";
import { haiku } from "./haiku";
import { Readable } from "stream";
import cookieParser from "cookie-parser";

import _ffmpegPath from "ffmpeg-static/ffmpeg.exe";
const ffmpegPath = join(__dirname, _ffmpegPath);

(async () => {
  console.log("\nOBS Settings".bgWhite.black);
  console.log("\nServer: udp://127.0.0.1:1234");
  let width = 0;
  let height = 0;

  const PORT = 3000;

  const app = express();
  const server = http.createServer(app);

  const connectionManager = new WebRTCConnectionManager();

  const randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const room = haiku(randomInt(1, 1000));
  const provider = "0.tunnelr.co";

  const videoSource = new WRTC.nonstandard.RTCVideoSource({
    // isScreencast: true,
    needsDenoising: false,
  });
  const videoTrack = videoSource.createTrack();

  const audioSource = new WRTC.nonstandard.RTCAudioSource();
  const audioTrack = audioSource.createTrack();
  const sampleRate = 48000;

  const outputStream = new WRTC.MediaStream([videoTrack, audioTrack]);

  const getBitrate = () =>
    new Promise<number>((resolve) => {
      const cp_ffmpeg = spawn(
        ffmpegPath,
        [
          "-f",
          "mpegts",
          "-re",
          "-i",
          `udp://127.0.0.1:1234`,
          "-c:v",
          "copy",
          "-c:a",
          "copy",
          "-movflags",
          "frag_keyframe+empty_moov",
          "-f",
          "flv",
          "-flush_packets",
          "1",
          "pipe:1",
        ],
        { stdio: ["ignore", "ignore", "pipe"] }
      );
      let counter = 0;
      cp_ffmpeg.stderr.on("data", (data) => {
        const str = data.toString();

        const bitrateMath = /(?<=bitrate=)(\d+)/.exec(str);
        if (bitrateMath) {
          counter++;
          const bitrate = parseInt(bitrateMath[0]);
          if (counter === 2) {
            cp_ffmpeg.kill();
            resolve(bitrate);
          }
        }
      });
    });

  console.log("Waiting for stream...");
  const bitrate = await getBitrate();

  createHttpClient({
    SECURE: true,
    PROVIDER: `${room}.${provider}`,
    TO_HOST: "localhost",
    TO_PORT: PORT,
    TO_PROTOCOL: "http",
    TTY: true,
  });

  const cp_ffmpeg = spawn(
    ffmpegPath,
    [
      "-f",
      "mpegts",
      "-vsync",
      "drop",
      "-analyzeduration",
      "1",
      "-fflags",
      "-nobuffer",
      "-flags",
      "low_delay",
      "-flags2",
      "fast",
      "-strict",
      "experimental",
      "-probesize",
      "200000",
      "-i",
      `udp://127.0.0.1:1234?fifo_size=50000&overrun_nonfatal=1`,
      "-map",
      "0:v",
      "-f",
      "rawvideo",
      "-pix_fmt",
      "yuv420p",
      "-flush_packets",
      "1",
      "pipe:1",
      "-map",
      "0:a",
      "-avioflags",
      "direct",
      "-f",
      "s16le",
      "-ar",
      "48k",
      "-ac",
      "1",
      "-flush_packets",
      "1",
      "pipe:3",
    ],
    {
      stdio: ["pipe", "pipe", "pipe", "pipe"],
    }
  );

  async function getVideoChunk() {
    if (!width || !height) {
      setImmediate(getVideoChunk);
      return;
    }
    const frameSize = width * height * 1.5;
    const data = cp_ffmpeg.stdio[1].read(frameSize);
    if (data != null && data.byteLength === frameSize) {
      videoSource.onFrame({
        width,
        height,
        data,
      });
      setImmediate(getVideoChunk);
    }
  }

  cp_ffmpeg.stdio[1].on("readable", getVideoChunk);
  cp_ffmpeg.stderr.on("data", (data) => {
    const str: string = data.toString();
    if (/non-existing|decode_slice_header|Invalid data|no frame/.test(str)) {
      return;
    }
    console.log(str);
    if (!width || !height) {
      const match = /(\d{3,4}x\d{3,4})/.exec(str);
      if (match) {
        const [, size] = match;
        const [widthStr, heightStr] = size.split("x");
        width = parseInt(widthStr, 10);
        height = parseInt(heightStr, 10);
        //console.log(`Video size: ${width}x${height}`);
      }
    }
  });

  function getAudioChunk() {
    const data = (cp_ffmpeg.stdio[3] as Readable).read((2 * sampleRate) / 100);
    if (data != null) {
      audioSource.onData({
        samples: new Int16Array(
          data.buffer.slice(data.byteOffset, data.byteOffset + data.length)
        ),
        sampleRate,
      });
      setImmediate(getAudioChunk);
    }
  }

  cp_ffmpeg.stdio[3].on("readable", getAudioChunk);

  app.set("trust proxy", 1); // trust first proxy
  app.use(cookieParser());
  app.use(json());
  app.use(raw({ type: "*/*" }));

  app.use("/api", (req, res, next) => {
    req.sessionID = req.cookies["sessionID"];
    if (!req.sessionID) {
      //Create a short random string

      const sessionID =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

      req.sessionID = sessionID;
      res.cookie("sessionID", sessionID);
    }
    next();
  });

  app.get("/api/signal", async (req, res) => {
    try {
      const conn = connectionManager.getConnectionById(req.sessionID);

      while (!conn.signalBuffer.length) {
        await new Promise((r) => setTimeout(r, 10));
      }

      req.on("close", () => {
        conn.onDisconnect();
      });

      res.json(conn.signalBuffer);
      conn.signalBuffer = [];
    } catch (error) {}
  });

  app.post("/api/signal", (req, res) => {
    connectionManager.getConnectionById(req.sessionID).signal(req.body);
    res.sendStatus(201);
  });

  app.post("/api/connect", (req, res) => {
    //console.log("a user connected");

    const conn = connectionManager.createConnection({
      id: req.sessionID,
      bitrate,
    });

    conn.on("connect", () => {
      conn.addStream(outputStream);

      for (const sender of (conn as any)._pc.getSenders()) {
        const parameters = sender.getParameters();

        const newParameters = {
          ...parameters,
          degradationPreference: "maintain-framerate",
        };
        sender.setParameters(newParameters);
      }
    });
    res.sendStatus(201);
  });

  app.use(express.static(path.join(__dirname, "webapp")));
  server.listen(PORT, () => {});

  const exit = () => {
    server.close();
    cp_ffmpeg.kill();
    process.exit();
  };

  process.on("SIGINT", exit);
  process.on("SIGTERM", exit);
})();
