import Peer from "simple-peer";
import wrtc from "wrtc";
import { forceStereoAudio, setOpusAttributes } from "./sdp";

export const setMediaBitrate = (sdp, mediaType, bitrate) => {
  const sdpLines = sdp.split("\n");
  let mediaLineIndex = -1;
  const mediaLine = "m=${mediaType}";
  let bitrateLineIndex = -1;
  const bitrateLine = "b=AS:${bitrate}";
  mediaLineIndex = sdpLines.findIndex((line) => line.startsWith(mediaLine));

  // If we find a line matching “m={mediaType}”
  if (mediaLineIndex > -1 && mediaLineIndex < sdpLines.length) {
    // Skip the media line
    bitrateLineIndex = mediaLineIndex + 1;

    // Skip both i=* and c=* lines (bandwidths limiters have to come afterwards)
    while (
      sdpLines[bitrateLineIndex].startsWith("i=") ||
      sdpLines[bitrateLineIndex].startsWith("c=")
    ) {
      bitrateLineIndex += 1;
    }

    if (sdpLines[bitrateLineIndex].startsWith("b=")) {
      // If the next line is a b=* line, replace it with our new bandwidth
      sdpLines[bitrateLineIndex] = bitrateLine;
    } else {
      // Otherwise insert a new bitrate line.
      sdpLines.splice(bitrateLineIndex, 0, bitrateLine);
    }
  }

  // Then return the updated sdp content as a string
  return sdpLines.join("\n");
};

export class Connection extends Peer {
  id: string;
  remoteStream = null;
  signalBuffer: any[] = [];

  constructor({ id, bitrate }) {
    super({
      wrtc: wrtc,
      sdpTransform: (sdp) => {
        let sdp2 = sdp
          .replace(
            /(m=video.*\r\n)/g,
            `$1b=AS:${Math.max(bitrate * 1024, 5 * 1024 * 1024)}\r\n`
          )
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
    });
    this.id = id;
    this.on("stream", (stream) => {
      this.remoteStream = stream;
    });

    this.addListener("error", (err) => {});
  }

  connectTo(other: Connection) {
    other.getStream().then((stream) => {
      this.addStream(stream);
    });

    this.getStream().then((stream) => {
      other.addStream(stream);
    });
  }

  getStream() {
    return new Promise<MediaStream>((resolve) => {
      if (this.remoteStream) {
        resolve(this.remoteStream);
        return;
      }
      this.once("stream", (stream) => {
        this.remoteStream = stream;
        resolve(this.remoteStream);
      });
    });
  }
}
