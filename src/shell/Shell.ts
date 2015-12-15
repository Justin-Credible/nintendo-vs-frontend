
import * as net from "net";
import * as electron from "electron";
import * as _ from "lodash";
import * as fs from "fs";

namespace JustinCredible.NintendoVsFrontend.Shell {

	var buildVars: BuildVars = JSON.parse(fs.readFileSync(__dirname + "/../build-vars.json").toString());

	var windowA: GitHubElectron.BrowserWindow;
	var windowB: GitHubElectron.BrowserWindow;
	var inputTestWindow: GitHubElectron.BrowserWindow;

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
		windowA.loadURL("file://" + __dirname + "../../www/index.html#side-a");
		windowA.on("closed", _.bind(rendererWindow_closed, null, "A"));

		windowB = new electron.BrowserWindow({ width: 800, height: 600 });
		windowB.loadURL("file://" + __dirname + "../../www/index.html#side-b");
		windowA.on("closed", _.bind(rendererWindow_closed, null, "B"));

		if (buildVars.debug) {

			inputTestWindow = new electron.BrowserWindow({ width: 300, height: 175 });
			inputTestWindow.loadURL("file://" + __dirname + "../../www/input-test.html");
			inputTestWindow.on("closed", _.bind(rendererWindow_closed, null, "input-test"));

			let inputTestSocket = net.createConnection(6000, "127.0.0.1", function () {
				console.log("input-test: Connected");
			});

			electron.ipcMain.on("input-test-keypress", (eventName: string, keyCode: number) => {
				inputTestSocket.write(keyCode.toString(), "utf-8");
			});
		}
	}

	function rendererWindow_closed(windowId: string): void {

		switch (windowId) {
			case "A":
				windowA = null;
				break;
			case "B":
				windowB = null;
				break;
			case "input-test":
				inputTestWindow = null;
				break;
		}
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
