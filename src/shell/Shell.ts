
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
var syncExec = require("sync-exec");

namespace JustinCredible.NintendoVsFrontend.Shell {

    // Runtime Configuration
    var buildVars: Interfaces.BuildVars;
    var gameList: Interfaces.GameDescriptor[];
    var config: Interfaces.Config;

    // Controller Bindings
    var bindingTable: Interfaces.NumberDictionary<Interfaces.PlayerInput>;
    var bindingSideTable: Interfaces.NumberDictionary<string>;
    var sideABindings: number[] = [];
    var sideBBindings: number[] = [];

    // TCP Server for Input Daemon Communication
    var tcpServer: net.Server;

    // Windows and UI Elements
    var tray: GitHubElectron.Tray;
    var windowA: GitHubElectron.BrowserWindow;
    var windowB: GitHubElectron.BrowserWindow;
    var inputTestWindow: GitHubElectron.BrowserWindow;

    // Emulator Status
    var sideAGame: Interfaces.GameDescriptor;
    var sideASpec: Interfaces.GameSpecification;
    var sideBGame: Interfaces.GameDescriptor;
    var sideBSpec: Interfaces.GameSpecification;

    export function main(): void {

        // Read in configuration values.
        readConfig();
        bindingTable = BindingHelper.getBindingTable(config);
        bindingSideTable = BindingHelper.getBindingSideTable(config);

        // Wire up the event handlers for the node process.
        process.on("uncaughtException", process_uncaughtException);
        process.on("SIGTERM", process_sigterm);

        // Wire up the event handlers for Electron.
        electron.app.on("exit", app_exit);
        electron.app.on("window-all-closed", app_windowAllClosed);
        electron.app.on("ready", app_ready);

        // Wire up the IPC events for the renderers.
        electron.ipcMain.on("renderer_log", renderer_log);
        electron.ipcMain.on("renderer_isGameRunning", renderer_isGameRunning);
        electron.ipcMain.on("renderer_canLaunchSpec", renderer_canLaunchSpec);
        electron.ipcMain.on("renderer_launchGame", renderer_launchGame);
        electron.ipcMain.on("renderer_showSystemNotification", renderer_showSystemNotification);

        // Create the local TCP server for the input daemon.
        createTcpServer();
    }

    //#region Helper Methods

    function cleanupOnExit(): void {

        console.log("Attempting to close the TCP server...");

        if (tcpServer) {
            try {
                tcpServer.close();
            }
            catch (ex) {
                console.error("An error occurred attempting to close the TCP server.", ex);
            }
        }

        console.log("Attempting to close utility processes...");

        try {
            exec(`${config.utilityBinaries.taskKill} /IM BorderlessGaming.exe`);
            exec(`${config.utilityBinaries.taskKill} /IM Input-Daemon.exe`);
        }
        catch (ex) {
            console.error("An error occurred attempting to close the utility processes.", ex);
        }

        electron.app.quit();
    }

    function readConfig(): void {
        buildVars = JSON.parse(fs.readFileSync(__dirname + "/../build-vars.json").toString());
        gameList = yaml.safeLoad(fs.readFileSync(__dirname + "/../game-list.yml", "utf8"));
        config = yaml.safeLoad(fs.readFileSync(__dirname + "/../config.yml", "utf8"));

        // TODO: Validate config and throw exception if not valid.
    }

    function isInputDaemonAvailable(): boolean {
        // The input daemon process is only available on Windows.
        return process.platform === "win32" && fs.existsSync(__dirname + "/../input-daemon.exe");
    }

    function isBorderlessGamingAvailable(): boolean {
        // The Borderless Gaming process is only available on Windows.
        return process.platform === "win32" && fs.existsSync(config.borderlessgaming.executable);
    }

    function launchInputDaemon(): void {

        let command = "start /MIN " + __dirname + "/../input-daemon.exe";

        console.log("Attempting to start input daemon with command:\n    " + command);

        if (!isInputDaemonAvailable()) {
            console.log("Unable to start input daemon; executable missing or platform is not win32.");
            return;
        }

        exec(command, (error: Error, stdout: Buffer, stderr: Buffer) => {

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

    function launchBorderlessGaming(): void {

        if (!isBorderlessGamingAvailable()) {
            console.log("Unable to start Borderless Gaming; executable missing or platform is not win32.");
            return;
        }

        console.log("Terminating any previous Borderless Gaming processes...");

        exec(`${config.utilityBinaries.taskKill} /IM BorderlessGaming.exe`);

        let command = "start /b /min \"\" \"" + config.borderlessgaming.executable + "\"";

        console.log("Attempting to start Borderless Gaming with command:\n    " + command);

        exec(command, (error: Error, stdout: Buffer, stderr: Buffer) => {

            if (error) {
                console.log("Error launching Borderless Gaming.", error);
            }
            else if (stdout || stderr) {
                console.log("Borderless Gaming terminated unexpectedly.", stdout, stderr);
            }

            console.log("Attempting to restart Borderless Gaming in 2 seconds...");
            setTimeout(() => { launchBorderlessGaming(); }, 2000);
        });
    }

    function buildTrayMenu(): void {

        let iconPath = path.join(__dirname, "..", "icons", "joystick.ico");
        tray = new electron.Tray(null);
        tray.setToolTip("Nintendo VS Frontend");

        let versionDisplay = `Version ${buildVars.version} - ${buildVars.commitShortSha}`;

        let options: GitHubElectron.MenuItemOptions[] = [
            { type: "normal", label: "Nintendo VS Frontend", sublabel: versionDisplay, enabled: false },
            { type: "separator" },
            { label: "Quit", type: "normal", click: tray_quit_click },
        ];

        // OSX doesn't support sub-labels in menu items, so we'll add it as a seperate item.
        if (process.platform === "darwin") {
            options.splice(1, 0, { type: "normal", label: versionDisplay, enabled: false } );
        }

        let contextMenu = electron.Menu.buildFromTemplate(options);
        tray.setContextMenu(contextMenu);
    }

    /**
     * Used to build the two renderer windows for side A and B of the cabinet.
     * Both windows will be frameless and displayed at a full 1280x1024 resolution.
     * 
     * This does nothing if we don't have exactly two 1280x1024 displays.
     */
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
        let screensAre1280x1024 = displays.length >= 2
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

            inputTestWindow = new electron.BrowserWindow({ width: 300, height: 175, x: 0, y: 0 });
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

    /**
     * Used to ensure both windows are displayed a 0,0 on their assigned screens.
     * 
     * This does nothing if we don't have exactly two 1280x1024 displays.
     */
    function repositionWindows(): void {

        if (!windowA || !windowB) {
            return;
        }

        let displays: Interfaces.ElectronDisplay[] = electron.screen.getAllDisplays();

        // During development don't worry about repositioning the screens.
        if (buildVars.debug) {

            let screensAre1280x1024 = displays.length >= 2
                && displays[0].size.width === 1280
                && displays[0].size.height === 1024
                && displays[1].size.width === 1280
                && displays[1].size.height === 1024;

            if (!screensAre1280x1024) {
                return;
            }
        }

        // Ugly hack ahead!

        // Before the windows can be repositioned, they must be removed from full screen
        // mode. Then the bounds can be set. Finally, they can be set back to full screen
        // mode. Then one last check is made to see if the windows are where they should
        // be. If they aren't then we'll sleep another second and try again. Sometimes this
        // is needed if the switch between clone and extend displays is slow.

        windowA.setFullScreen(false);
        windowB.setFullScreen(false);

        setTimeout(() => {
            windowA.setBounds(displays[0].bounds);
            windowB.setBounds(displays[1].bounds);

            setTimeout(() => {
                windowA.setFullScreen(true);
                windowB.setFullScreen(true);

                setTimeout(() => {

                    let isWindowAOk = JSON.stringify(windowA.getBounds()) === JSON.stringify(displays[0].bounds);
                    let isWindowBOk = JSON.stringify(windowB.getBounds()) === JSON.stringify(displays[1].bounds);

                    if (!isWindowAOk || !isWindowBOk) {
                        setTimeout(() => { repositionWindows(); }, 1000);
                    }

                }, 500);
            }, 500);
        }, 500);
    }

    //#endregion

    //#region Node Process Events

    function process_uncaughtException(error: Error) {

        console.error("An uncaught exception occurred; preparing to terminate.", error);
        cleanupOnExit();
    }

    function process_sigterm() {

        console.error("SIGTERM occurred; preparing to terminate.");
        cleanupOnExit();
    }

    //#endregion

    //#region Electron Application Events

    function app_exit(): void {

        cleanupOnExit();
    }

    function app_windowAllClosed(): void {

        electron.app.quit();
    }

    function app_ready(): void {

        // Build the tray context menu.
        buildTrayMenu();

        // Populate the path to the preview videos for each game.
        Utilities.populateVideoPaths(gameList);

        /* tslint:disable:no-string-literal */
        global["gameList"] = gameList;
        global["buildVars"] = buildVars;
        global["menuConfig"] = config.menu;
        /* tslint:enable:no-string-literal */

        // Ensure the Borderless Gaming app is running.
        launchBorderlessGaming();

        // Wait to ensure that Borderless Gaming launches and it's window is on the desktop.
        // We want to make sure that our renderer windows are on top of the window.
        setTimeout(() => { buildWindows(); }, config.borderlessgaming.delay || 500);
    }

    //#endregion

    //#region Tray Menu Events

    function tray_quit_click(): void {
        electron.app.quit();
    }

    //#endregion

    //#region Renderer IPC Events

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

    function renderer_isGameRunning(event: any, side: string): void {

        let isGameRunning = false;

        switch (side) {
            case "A":
                isGameRunning = sideAGame != null;
                break;
            case "B":
                isGameRunning = sideBGame != null;
                break;
        }

        event.returnValue = isGameRunning.toString();
    }

    function renderer_canLaunchSpec(event: any, side: string, specToCheckJson: string): void {

        let specToCheck: Interfaces.GameSpecification;

        try {
            specToCheck = JSON.parse(specToCheckJson);
        }
        catch (exception) {
            console.error("Unable to parse game specification JSON.", side, specToCheckJson, exception);
        }

        event.returnValue = Utilities.canLaunchSpec(sideASpec, sideBSpec, side, specToCheck).toString();
    }

    function renderer_launchGame(event: any, side: string, gameJson: string, specJson: string): void {

        let game: Interfaces.GameDescriptor;
        let spec: Interfaces.GameSpecification;

        try {
            game = JSON.parse(gameJson);
            spec = JSON.parse(specJson);
        }
        catch (exception) {
            console.error("Unable to parse game descriptor or specification JSON.", side, gameJson, specJson, exception);
            windowA.emit("game-terminated", side);
            windowB.emit("game-terminated", side);
            return;
        }

        if (side == null || game == null || spec == null ) {
            console.error("A side, game, and spec are required to launch a game.", side, game, spec);
            windowA.emit("game-terminated", side);
            windowB.emit("game-terminated", side);
            return;
        }

        if (side !== "A" && side !== "B") {
            console.error("Unsupported side when launching game.", side, game, spec);
            windowA.emit("game-terminated", side);
            windowB.emit("game-terminated", side);
            return;
        }

        if (spec.type !== "single-screen" && spec.type !== "dual-screen") {
            console.error("Unsupported spec type when launching game.", side, game, spec);
            windowA.emit("game-terminated", side);
            windowB.emit("game-terminated", side);
            return;
        }

        if (game.platform !== "MAME" && game.platform !== "PC") {
            console.error("Unsupported platform type when launching game.", side, game, spec);
            windowA.emit("game-terminated", side);
            windowB.emit("game-terminated", side);
            return;
        }

        if (game.platform === "PC" && spec.type !== "dual-screen") {
            console.error("The PC platform only supports dual screen games.");
            windowA.emit("game-terminated", side);
            windowB.emit("game-terminated", side);
            return;
        }

        if (game.platform === "PC" && process.platform !== "win32") {
            console.error("The PC platform is only available on the win32 platform.");
            windowA.emit("game-terminated", side);
            windowB.emit("game-terminated", side);
            return;
        }

        let canLaunchSpec = Utilities.canLaunchSpec(sideASpec, sideBSpec, side, spec);

        // Sanity check - The renderer should have already checked this.
        if (!canLaunchSpec) {
            console.warn("The given specification can not be launched at this time because it conflicts with another active spec.");
            windowA.emit("game-terminated", side);
            windowB.emit("game-terminated", side);
            return;
        }

        let executable: string = null;
        let workingDir: string = null;
        let args: string[] = [];
        let startMinimized = false;

        if (game.platform === "MAME") {
            executable = config.mame.executable;
            workingDir = config.mame.workingDir;

            if (spec.resource) {
                args.push(spec.resource);
            }
            else {
                args.push(game.resource);
            }

            if (config.mame.args && config.mame.args.length > 0) {
                args = args.concat(config.mame.args);
            }

            if (spec.type === "dual-screen") {
                args.push("-numscreens 2");
            }
            else if (spec.type === "single-screen") {

                startMinimized = true;

                args.push("-global_inputs");
                args.push("-window");

                if (side === "A") {
                    args.push(Utilities.format("-screen {0}", config.mame.screens.a));
                }
                else if (side === "B") {
                    args.push(Utilities.format("-screen {0}", config.mame.screens.b));
                }
            }

            args.push(`-cfg_directory "${config.mame.customConfigRoot}/side-${side}"`);

            // TODO: Handle two instances of the same game at once (nvram conflicts??)
        }
        else if (game.platform === "PC") {
            executable = game.resource;
        }

        if (!fs.existsSync(executable)) {
            console.error("Unable to locate executable when launching game.", executable);
            windowA.emit("game-terminated", side);
            windowB.emit("game-terminated", side);
            return;
        }

        if (!fs.existsSync(executable)) {
            console.error("Unable to locate working directory when launching game.", workingDir);
            windowA.emit("game-terminated", side);
            windowB.emit("game-terminated", side);
            return;
        }

        if (spec.type === "dual-screen") {
            sideAGame = game;
            sideASpec = spec;

            sideBGame = game;
            sideBSpec = spec;
        }
        else if (spec.type === "single-screen" && side === "A") {
            sideAGame = game;
            sideASpec = spec;
        }
        else if (spec.type === "single-screen" && side === "B") {
            sideBGame = game;
            sideBSpec = spec;
        }

        // If there are spaces in the executable path, wrap it in quotes.
        if (executable.indexOf(" ")) {
            executable = "\"" + executable + "\"";
        }

        let execOptions = {
            cwd: workingDir
        };

        let command = executable + " " + args.join(" ");

        // If the start minimized flag was set, we'll use the built-in start command
        // to launch the process so we can take advantage of the /min switch.
        if (startMinimized) {
            command = "start /b /min \"\" " + command;
        }

        // Currently, PC games are only supported by switching the dual screens to be cloned.
        if (game.platform === "PC") {
            syncExec(`${config.utilityBinaries.displaySwitch} /clone`);
        }

        console.log("Launching game...", workingDir, command);

        windowA.emit("game-launched", side, JSON.stringify(game));
        windowB.emit("game-launched", side, JSON.stringify(game));

        exec(command, execOptions, (error: Error, stdout: Buffer, stderr: Buffer) => {

            if (error) {
                console.error("Process terminated with error.", exec, args, error);
            }

            if (stderr) {
                console.error("Process terminated with stderr output.", exec, args, stderr.toString());
            }

            // Switch back to extended displays from cloned displays.
            if (game.platform === "PC") {
                syncExec(`${config.utilityBinaries.displaySwitch} /extend`);
                repositionWindows();
            }

            if (spec.type === "dual-screen") {
                sideAGame = null;
                sideASpec = null;

                sideBGame = null;
                sideBSpec = null;
            }
            else if (spec.type === "single-screen" && side === "A") {
                sideAGame = null;
                sideASpec = null;
            }
            else if (spec.type === "single-screen" && side === "B") {
                sideBGame = null;
                sideBSpec = null;
            }

            windowA.emit("game-terminated", side);
            windowB.emit("game-terminated", side);
        });
    }

    function renderer_showSystemNotification(event: any, type: string, title: string, message: string): void {

        let icon: string;

        switch (type) {
            case "info":
                icon = "question.ico";
                break;
            case "error":
                icon = "chomp.ico";
                break;
            default:
                icon = "joystick.ico";
                break;
        }

        icon = path.join(__dirname, "..", "icons", icon);

        let iconImage = Utilities.createImageFromPath(icon);

        tray.displayBalloon({
            icon: iconImage,
            title: title,
            content: message
        });
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
            if (bindingSideTable[key] === "A" && !sideAGame) {
                windowA.emit("player-input", input);
            }
            else if (bindingSideTable[key] === "B" && !sideBGame) {
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
