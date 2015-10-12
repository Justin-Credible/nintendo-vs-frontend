
interface DIContext {
	app: GitHubElectron.App;
	BrowserWindow: { new(options?: GitHubElectron.BrowserWindowOptions): GitHubElectron.BrowserWindow };
	net: any;
}