
import * as net from "net";
import { exec } from "child_process";
import * as path from "path";
import * as electron from "electron";
import * as _ from "lodash";
import * as fs from "fs";
import * as yaml from "js-yaml";
import * as Utilities from "./Utilities";
import * as BindingHelper from "./BindingHelper";
import * as Enums from "./Enums";

namespace JustinCredible.NintendoVsFrontend.Shell {

    var buildVars: Interfaces.BuildVars;
    var gameList: Interfaces.GameDescriptor[];
    var config: Interfaces.Config;

    var bindingTable: Interfaces.NumberDictionary<Interfaces.PlayerInput>;
    var bindingSideTable: Interfaces.NumberDictionary<string>;
    var sideABindings: number[] = [];
    var sideBBindings: number[] = [];

    var tcpServer: net.Server;

    var windowA: GitHubElectron.BrowserWindow;
    var windowB: GitHubElectron.BrowserWindow;
    var inputTestWindow: GitHubElectron.BrowserWindow;

    export function main(): void {

        // Read in configuration values.
        readConfig();
        bindingTable = BindingHelper.getBindingTable(config);
        bindingSideTable = BindingHelper.getBindingSideTable(config);

        // Wire up the event handlers for Electron.
        electron.app.on("window-all-closed", app_windowAllClosed);
        electron.app.on("ready", app_ready);
        electron.ipcMain.on("renderer_log", renderer_log);

        // Create the local TCP server for the input daemon.
        createTcpServer();
    }

    //#region Helper Methods

    function readConfig(): void {
        buildVars = JSON.parse(fs.readFileSync(__dirname + "/../build-vars.json").toString());
        gameList = yaml.safeLoad(fs.readFileSync(__dirname + "/../game-list.yml", "utf8"));
        config = yaml.safeLoad(fs.readFileSync(__dirname + "/../config.yml", "utf8"));
    }

    function isInputDaemonAvailable(): boolean {
        // The input daemon process is only available on Windows.
        return process.platform === "win32" && fs.existsSync(__dirname + "/../input-daemon.exe");
    }

    function launchInputDaemon(): void {

        let command = "start /MIN " + __dirname + "/../input-daemon.exe";

        console.log("Attempting to start input daemon with command:\n    " + command);

        if (!isInputDaemonAvailable()) {
            console.log("Unable to start input daemon; executable missing or platform is not win32.");
            return;
        }

        exec(command, function (error, stdout, stderr) {

            if (error) {
                console.log("Error launching input daemon.", error);
            }
            else if (stdout || stderr) {
                console.log("Input daemon terminated unexpectedly.", stdout, stderr);
            }

            console.log("Attempting to restart input daemon in 2 seconds...");
            setTimeout(() => { launchInputDaemon(); }, 2000);
        });
    }

    function buildWindows(): void {

        let windowOptions: GitHubElectron.BrowserWindowOptions = {
            frame: false,
            fullscreen: true,
            width: 1280,
            height: 1024
        };

        let optionsA = _.clone(windowOptions);
        let optionsB = _.clone(windowOptions);

        let displays: Interfaces.ElectronDisplay[] = electron.screen.getAllDisplays();

        // Determine if we have two 1280x1024 screens available.
        let screensAre1280x1024 = displays.length === 2
            && displays[0].size.width === 1280
            && displays[0].size.height === 1024
            && displays[1].size.width === 1280
            && displays[1].size.height === 1024;

        // If we have the corrent screen configuration, position a window on
        // each of the screens. If not, then make sure the windows show up with
        // frames and borders etc.
        if (screensAre1280x1024) {
            optionsA.x = displays[0].bounds.x;
            optionsA.y = displays[0].bounds.y;
            optionsB.x = displays[1].bounds.x;
            optionsB.y = displays[1].bounds.y;
        }
        else {
            optionsA.fullscreen = false;
            optionsB.fullscreen = false;
            optionsA.frame = true;
            optionsB.frame = true;
        }

        windowA = new electron.BrowserWindow(optionsA);
        windowA.loadURL("file://" + __dirname + "../../www/index.html#side-a");
        windowA.on("closed", _.bind(rendererWindow_closed, null, "A"));

        windowB = new electron.BrowserWindow(optionsB);
        windowB.loadURL("file://" + __dirname + "../../www/index.html#side-b");
        windowA.on("closed", _.bind(rendererWindow_closed, null, "B"));

        // If this is a debug build AND the input daemon is not available, show the
        // input test window which emulates the functionality of the daemon for testing.
        if (buildVars.debug && !isInputDaemonAvailable()) {

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

    //#endregion

    //#region Electron Application Events

    function app_windowAllClosed(): void {

        if (process.platform !== "darwin") {
            electron.app.quit();
        }
    }

    function app_ready(): void {

        gameList.forEach((game: Interfaces.GameDescriptor) => {

            // TODO: If no resource, examine child specs.
            // TODO: If platform === "PC", grab binary filename, remove EXE and use for image filename.
            if (game.resource) {
                let imagePath = path.join(__dirname, "..", "www", "img", "games", game.platform, game.resource + ".png");
                game._hasImage = fs.existsSync(imagePath);
            }
        })

        /* tslint:disable:no-string-literal */
        global["gameList"] = gameList;
        global["buildVars"] = buildVars;
        /* tslint:enable:no-string-literal */

        buildWindows();
    }

    function renderer_log(event: any, level: string, message: string): void {

        switch (level) {
            case "debug":
                console.log("[DEBUG] " + message);
                break;
            case "info":
                console.log("[INFO] " + message);
                break;
            case "warn":
                console.warn("[WARN] " + message);
                break;
            case "error":
                console.error("[ERROR] " + message);
                break;
            default:
                console.log("[UNKNOWN] " + message);
                break;
        }
    }

    //#endregion

    //#region Renderer Window Events

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

    //#endregion

    //#region TCP/Sockets

    function createTcpServer(): void {
        console.log("Starting TCP server at 127.0.0.1:6000...");
        tcpServer = net.createServer(tcpServer_connect);
        tcpServer.listen(6000, tcpServer_listen);
    }

    function tcpServer_listen() {
        console.log("TCP server started at 127.0.0.1:6000");
        launchInputDaemon();
    }

    function tcpServer_connect(socket: net.Socket): void {
        console.log("Client connected via TCP.");
        socket.on("data", socket_data);
        socket.on("end", socket_end);
        socket.on("error", socket_error);
    }

    function socket_data(data: Buffer): void {
        let keyString = data.toString("utf-8");

        let key = parseInt(keyString, 10);

        let input = bindingTable[key];

        if (input) {
            if (bindingSideTable[key] === "A") {
                windowA.emit("player-input", input);
            }
            else if (bindingSideTable[key] === "B") {
                windowB.emit("player-input", input);
            }
        }
    }

    function socket_end() {
        console.log("TCP connection closed.");
    }

    function socket_error(error: any) {
        console.error("TCP connection error.", error);
    }

    //#endregion
}

module.exports =  JustinCredible.NintendoVsFrontend.Shell;
