function extractSdp(sdpLine, pattern) {
  var result = sdpLine.match(pattern);
  return result && result.length === 2 ? result[1] : null;
}
function findLineInRange(sdpLines, startLine, endLine, prefix, substr) {
  var realEndLine = endLine !== -1 ? endLine : sdpLines.length;
  for (var i = startLine; i < realEndLine; ++i) {
    if (sdpLines[i].indexOf(prefix) === 0) {
      if (
        !substr ||
        sdpLines[i].toLowerCase().indexOf(substr.toLowerCase()) !== -1
      ) {
        return i;
      }
    }
  }
  return null;
}
function findLine(sdpLines, prefix, substr?) {
  return findLineInRange(sdpLines, 0, -1, prefix, substr);
}
function getCodecPayloadType(sdpLine) {
  var pattern = new RegExp("a=rtpmap:(\\d+) \\w+\\/\\d+");
  var result = sdpLine.match(pattern);
  return result && result.length === 2 ? result[1] : null;
}

export function setOpusAttributes(sdp, params) {
  params = params || {};

  var sdpLines = sdp.split("\r\n");

  // Opus
  var opusIndex = findLine(sdpLines, "a=rtpmap", "opus/48000");
  var opusPayload;
  if (opusIndex) {
    opusPayload = getCodecPayloadType(sdpLines[opusIndex]);
  }

  if (!opusPayload) {
    return sdp;
  }

  var opusFmtpLineIndex = findLine(
    sdpLines,
    "a=fmtp:" + opusPayload.toString()
  );
  if (opusFmtpLineIndex === null) {
    return sdp;
  }

  var appendOpusNext = "";
  appendOpusNext +=
    "; stereo=" + (typeof params.stereo != "undefined" ? params.stereo : "1");
  appendOpusNext +=
    "; sprop-stereo=" +
    (typeof params["sprop-stereo"] != "undefined"
      ? params["sprop-stereo"]
      : "1");

  if (typeof params.maxaveragebitrate != "undefined") {
    appendOpusNext +=
      "; maxaveragebitrate=" + (params.maxaveragebitrate || 128 * 1024 * 8);
  }

  if (typeof params.maxplaybackrate != "undefined") {
    appendOpusNext +=
      "; maxplaybackrate=" + (params.maxplaybackrate || 128 * 1024 * 8);
  }

  if (typeof params.cbr != "undefined") {
    appendOpusNext +=
      "; cbr=" + (typeof params.cbr != "undefined" ? params.cbr : "1");
  }

  if (typeof params.useinbandfec != "undefined") {
    appendOpusNext += "; useinbandfec=" + params.useinbandfec;
  }

  if (typeof params.usedtx != "undefined") {
    appendOpusNext += "; usedtx=" + params.usedtx;
  }

  if (typeof params.maxptime != "undefined") {
    appendOpusNext += "\r\na=maxptime:" + params.maxptime;
  }

  sdpLines[opusFmtpLineIndex] =
    sdpLines[opusFmtpLineIndex].concat(appendOpusNext);

  sdp = sdpLines.join("\r\n");
  return sdp;
}

export function forceStereoAudio(sdp) {
  var sdpLines = sdp.split("\r\n");
  var fmtpLineIndex: any = null;
  for (var i = 0; i < sdpLines.length; i++) {
    if (sdpLines[i].search("opus/48000") !== -1) {
      var opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
      break;
    }
  }
  for (var i = 0; i < sdpLines.length; i++) {
    if (sdpLines[i].search("a=fmtp") !== -1) {
      var payload = extractSdp(sdpLines[i], /a=fmtp:(\d+)/);
      if (payload === opusPayload) {
        fmtpLineIndex = i;
        break;
      }
    }
  }
  if (fmtpLineIndex === null) return sdp;
  sdpLines[fmtpLineIndex] = sdpLines[fmtpLineIndex].concat(
    "; stereo=1; sprop-stereo=1"
  );
  sdp = sdpLines.join("\r\n");
  return sdp;
}
