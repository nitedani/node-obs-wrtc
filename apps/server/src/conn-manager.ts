import cuid from "cuid";
import { EventEmitter } from "events";
import { Connection } from "./conn";

export class WebRTCConnectionManager extends EventEmitter {
  connections: { [key: string]: Connection } = {};

  createConnection({ id, bitrate }) {
    id ??= cuid();
    const connection = new Connection({
      id,
      bitrate,
    });

    this.connections[id] = connection;

    connection.on("signal", (signal) => {
      connection.signalBuffer.push(signal);
    });

    return connection;
  }

  deleteConnection(id: string) {
    delete this.connections[id];
  }

  getConnectionById(id: string) {
    return this.connections[id];
  }
}
