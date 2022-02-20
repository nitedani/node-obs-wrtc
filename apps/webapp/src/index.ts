import Peer from "simple-peer";
import axios from "axios";

const videoEl = document.getElementById("video") as HTMLVideoElement;

import { forceStereoAudio, setOpusAttributes } from "../../server/src/sdp";

const peer = new Peer({
  sdpTransform: (sdp) => {
    let sdp2 = sdp
      .replace(/(m=video.*\r\n)/g, `$1b=AS:${10 * 1024 * 1024}\r\n`)
      .replace(/(m=audio.*\r\n)/g, `$1b=AS:${128 * 1024}\r\n`);

    sdp2 = forceStereoAudio(sdp2);
    sdp2 = setOpusAttributes(sdp2, {
      stereo: 1,
      maxaveragebitrate: 128 * 1024,
      maxplaybackrate: 128 * 1024,
      maxptime: 3,
    });

    console.log(sdp2);
    return sdp2;
  },
  config: {
    iceServers: [
      {
        urls: ["turn:turn.0.tunnelr.co:3478"],
        username: "roadhogg",
        credential: "almafa33",
      },
    ],
  },
  initiator: true,
});

const pollSignal = async () => {
  const res = await axios.get("/api/signal", { timeout: 999999 });

  for (const signal of res.data) {
    peer.signal(signal);
  }

  pollSignal();
};

(async () => {
  await axios.post("/api/connect");
  pollSignal();
})();

peer.on("signal", async (signal) => {
  console.log("asdasd");

  await axios.post("/api/signal", signal);
});

peer.on("stream", (stream) => {
  console.log("ALMAFA");
  videoEl.srcObject = stream;
  videoEl.play();
});

if (module.hot) {
  module.hot.accept();
}
