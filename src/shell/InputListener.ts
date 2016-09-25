
import events = require('events');
import * as net from "net";
import * as ConfigManager from "./ConfigManager";
import * as InputDaemon from "./InputDaemon";

export class InputListener extends events.EventEmitter {

    // TCP Server for communication with Input-Daemon.exe.
    private _tcpServer: net.Server;

    public initialize(): void {
        this.createTcpServer();
    }

    public shutdown(): void {

        console.log("Attempting to close the TCP server...");

        if (this._tcpServer) {
            try {
                this._tcpServer.close();
            }
            catch (ex) {
                console.error("An error occurred attempting to close the TCP server.", ex);
            }
        }
    }

    private createTcpServer(): void {
        console.log("Starting TCP server at 127.0.0.1:6000...");
        this._tcpServer = net.createServer(this.tcpServer_connect.bind(this));
        this._tcpServer.listen(6000, this.tcpServer_listen.bind(this));
    }

    private tcpServer_listen() {
        console.log("TCP server started at 127.0.0.1:6000");
        InputDaemon.launch();
    }

    private tcpServer_connect(socket: net.Socket): void {
        console.log("Client connected via TCP.");
        socket.on("data", this.socket_data.bind(this));
        socket.on("end", this.socket_end.bind(this));
        socket.on("error", this.socket_error.bind(this));
    }

    private socket_data(data: Buffer): void {
        let keyString = data.toString("utf-8");

        let key = parseInt(keyString, 10);

        let input = ConfigManager.bindingTable[key];

        if (input) {
            let side = ConfigManager.bindingSideTable[key];
            this.emit("player-input", side, input);
        }
    }

    private socket_end() {
        console.log("TCP connection closed.");
    }

    private socket_error(error: any) {
        console.error("TCP connection error.", error);
    }
}
