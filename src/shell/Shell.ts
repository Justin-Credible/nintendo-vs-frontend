
import * as net from "net";
import * as electron from "electron";
import * as _ from "lodash";
import * as fs from "fs";
import * as yaml from "js-yaml";
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

        readConfig();
        bindingTable = BindingHelper.getBindingTable(config);
        bindingSideTable = BindingHelper.getBindingSideTable(config);

        electron.app.on("window-all-closed", app_windowAllClosed);
        electron.app.on("ready", app_ready);

        tcpServer = net.createServer(tcpServer_connect);
        tcpServer.listen(6000, tcpServer_listen);
    }

    //#region Helper Methods

    function readConfig(): void {
        buildVars = JSON.parse(fs.readFileSync(__dirname + "/../build-vars.json").toString());
        gameList = yaml.safeLoad(fs.readFileSync(__dirname + "/../game-list.yml", "utf8"));
        config = yaml.safeLoad(fs.readFileSync(__dirname + "/../config.yml", "utf8"));
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

    //#endregion

    //#region Electron Application Events

    function app_windowAllClosed(): void {

        if (process.platform !== "darwin") {
            electron.app.quit();
        }
    }

    function app_ready(): void {

        /* tslint:disable:no-string-literal */

        global["gameList"] = gameList;
        global["buildVars"] = buildVars;

        /* tslint:enable:no-string-literal */

        buildWindows();
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

    //#region TCP/Socket Events

    function tcpServer_connect(socket: any): void {
        console.log("Client Connected.");
        socket.on("data", socket_data);
        socket.on("end", socket_end);
    }

    function tcpServer_listen() {
        console.log("Bound!");
    }

    function socket_data(data: Buffer): void {
        let keyString = data.toString("utf-8");

        console.log(keyString);

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
        console.log("Socket Closed.");
    }

    //#endregion
}

module.exports =  JustinCredible.NintendoVsFrontend.Shell;
