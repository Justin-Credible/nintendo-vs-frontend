
/*globals process, __dirname*/

var app = require("app");
var BrowserWindow = require("browser-window");

var mainWindow = null;

app.on("window-all-closed", function() {
	if (process.platform != "darwin")
	app.quit();
});

app.on("ready", function() {
	mainWindow = new BrowserWindow({width: 800, height: 600});
	mainWindow.loadUrl("file://" + __dirname + "/www/index.html");
	mainWindow.on("closed", function() {
		mainWindow = null;
	});
});


var net = require("net");

var tcp_server = net.createServer(function(socket) {
	console.log("Client Connected.", socket);
	
	socket.on("data", function (data) {
		console.log(data.toString("utf-8"));
	});
	
	socket.on("end", function () {
		console.log("Socket closed.");
	});
});

tcp_server.listen(6000, function () {
	console.log("Listening on TCP port 6000.");
});