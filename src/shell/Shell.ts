
module JustinCredible.NintendoVsFrontend.Shell {
	var context: DIContext;

	var mainWindow: GitHubElectron.BrowserWindow;

	var tcpServer: any;

	export function inject(diContainer: any): void {
		context = diContainer;
	}

	export function main(): void {

		context.app.on("window-all-closed", app_windowAllClosed);
		context.app.on("ready", app_ready);

		tcpServer = context.net.createServer(tcpServer_connect);
	}

	function app_windowAllClosed(): void {

		if (process.platform !== "darwin") {
			context.app.quit();
		}
	}

	function app_ready(): void {

		mainWindow = new context.BrowserWindow({ width: 800, height: 600 });
		mainWindow.loadUrl("file://" + __dirname + "/www/index.html");
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
