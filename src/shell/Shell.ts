
import * as net from "net";
import * as electron from "electron";

namespace JustinCredible.NintendoVsFrontend.Shell {

	var windowA: GitHubElectron.BrowserWindow;
	var windowB: GitHubElectron.BrowserWindow;

	var tcpServer: net.Server;

	export function main(): void {

		electron.app.on("window-all-closed", app_windowAllClosed);
		electron.app.on("ready", app_ready);

		tcpServer = net.createServer(tcpServer_connect);
		tcpServer.listen(6000, tcpServer_listen);
	}

	function app_windowAllClosed(): void {

		if (process.platform !== "darwin") {
			electron.app.quit();
		}
	}

	function app_ready(): void {

		windowA = new electron.BrowserWindow({ width: 800, height: 600 });
		windowA.loadURL("file://" + __dirname + "../../www/index.html");
		windowA.on("closed", mainWindow_closed);

		windowB = new electron.BrowserWindow({ width: 800, height: 600 });
		windowB.loadURL("file://" + __dirname + "../../www/index.html");
		windowB.on("closed", mainWindow_closed);

		// Used to set sending data to each window without running input-daemon.
		// let i = 0;

		// setTimeout(() => {
		// 	let client = net.createConnection(6000, "127.0.0.1", function () {
		// 		setInterval(() => {
		// 			i++;
		// 			client.write(i.toString());
		// 		}, 1000);
		// 	});
		// }, 1000);
	}

	function mainWindow_closed(): void {
		windowA = null;
		windowB = null;
	}

	function tcpServer_connect(socket: any): void {
		console.log("Client Connected.", socket);
		socket.on("data", socket_data);
		socket.on("end", socket_end);
	}

	function tcpServer_listen() {
		console.log("Bound!");
	}

	function socket_data(data: any): void {
		let keyString = data.toString("utf-8");

		console.log(keyString);
		windowA.emit("key-pressed", keyString);
		windowB.emit("key-pressed", keyString);
	}

	function socket_end() {
		console.log("Socket Closed.");
	}
}

module.exports =  JustinCredible.NintendoVsFrontend.Shell;
