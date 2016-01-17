
import * as net from "net";
import * as electron from "electron";
import * as _ from "lodash";
import * as fs from "fs";
import * as yaml from "js-yaml";

namespace JustinCredible.NintendoVsFrontend.Shell {

    var buildVars: Interfaces.BuildVars = JSON.parse(fs.readFileSync(__dirname + "/../build-vars.json").toString());
    var gameList: Interfaces.GameDescriptor[] = yaml.safeLoad(fs.readFileSync(__dirname + "/../game-list.yml", "utf8"));

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

        global["game-list"] = gameList;

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
        console.log("Client Connected.");
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
