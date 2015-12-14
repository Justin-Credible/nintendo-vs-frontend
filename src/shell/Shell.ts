
import * as net from "net";
import * as electron from "electron";

namespace JustinCredible.NintendoVsFrontend.Shell {

	var mainWindow: GitHubElectron.BrowserWindow;

	var tcpServer: any;

	export function main(): void {

		electron.app.on("window-all-closed", app_windowAllClosed);
		electron.app.on("ready", app_ready);

		tcpServer = net.createServer(tcpServer_connect);
	}

	function app_windowAllClosed(): void {

		if (process.platform !== "darwin") {
			electron.app.quit();
		}
	}

	function app_ready(): void {

		mainWindow = new electron.BrowserWindow({ width: 800, height: 600 });
		mainWindow.loadURL("file://" + __dirname + "../../www/index.html");
		mainWindow.on("closed", mainWindow_closed);
	}

	function mainWindow_closed(): void {
		mainWindow = null;
	}

	function tcpServer_connect(socket: any): void {
		console.log("Client Connected.", socket);
		socket.on("data", socket_data);
		socket.on("end", socket_end);
	}

	function socket_data(data: any): void {
		console.log(data.toString("utf-8"));
	}

	function socket_end() {
		console.log("Socket Closed.");
	}
}

module.exports =  JustinCredible.NintendoVsFrontend.Shell;
