
// Define the dependency injection container by importing node modules.
var diContainer = {
	app: require("app"),
	BrowserWindow: require("browser-window"),
	net: require("net")
};

// This is JustinCredible.NintendoVsFrontend.Shell
var Shell = require("./bundle.js");

// Inject the node module dependencies.
Shell.inject(diContainer);

// Bootstrap the shell application.
Shell.main();
