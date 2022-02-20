declare namespace Express {
  interface Request {
    sessionID: string;
  }
}
declare module "*.exe" {
  const value: string;
  export default value;
}
/*
declare module "wrtc" {
  const value: {
    MediaStream: {
      new (tracks: MediaStreamTrack[]): MediaStream;
    };
    MediaStreamTrack: MediaStreamTrack;
    RTCDataChannel: RTCDataChannel;
    RTCDataChannelEvent: RTCDataChannelEvent;
    RTCDtlsTransport: RTCDtlsTransport;
    RTCIceCandidate: RTCIceCandidate;
    RTCIceTransport: RTCIceTransport;
    RTCPeerConnection: RTCPeerConnection;
    RTCPeerConnectionIceEvent: RTCPeerConnectionIceEvent;
    RTCRtpReceiver: RTCRtpReceiver;
    RTCRtpSender: RTCRtpSender;
    RTCRtpTransceiver: RTCRtpTransceiver;
    nonstandard: any;
    RTCSessionDescription: RTCSessionDescription;
    getUserMedia: typeof navigator.mediaDevices["getUserMedia"];
    mediaDevices: typeof navigator.mediaDevices;
  };
  export type WRTC = typeof value;
  export default value;
}
*/