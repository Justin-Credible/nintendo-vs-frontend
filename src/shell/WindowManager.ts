
import * as net from "net";
import { exec } from "child_process";
import events = require("events");
import * as path from "path";
import * as fs from "fs";

var syncExec = require("sync-exec");
import * as electron from "electron";
import * as _ from "lodash";

import * as ConfigManager from "./ConfigManager";
import * as Utilities from "./Utilities";
import * as InputDaemon from "./InputDaemon";


export class WindowManager extends events.EventEmitter {

    private _windowA: GitHubElectron.BrowserWindow;
    private _windowB: GitHubElectron.BrowserWindow;
    private _inputTestWindow: GitHubElectron.BrowserWindow;

    // Active games for each side
    private _sideAGame: Interfaces.GameDescriptor;
    private _sideASpec: Interfaces.GameSpecification;
    private _sideBGame: Interfaces.GameDescriptor;
    private _sideBSpec: Interfaces.GameSpecification;

    public get windowA(): GitHubElectron.BrowserWindow {
        return this._windowA;
    }

    public get windowB(): GitHubElectron.BrowserWindow {
        return this._windowB;
    }

    public get sideAGame(): Interfaces.GameDescriptor {
        return this._sideAGame;
    }

    public get sideBGame(): Interfaces.GameDescriptor {
        return this._sideBGame;
    }

    constructor() {
        super();

        // Wire up the IPC events for the renderers.
        electron.ipcMain.on("renderer_log", this.renderer_log.bind(this));
        electron.ipcMain.on("renderer_isGameRunning", this.renderer_isGameRunning.bind(this));
        electron.ipcMain.on("renderer_canLaunchSpec", this.renderer_canLaunchSpec.bind(this));
        electron.ipcMain.on("renderer_showSystemNotification", this.renderer_showSystemNotification.bind(this));
        electron.ipcMain.on("renderer_launchGame", this.renderer_launchGame.bind(this));
    }

    /**
     * Used to build the two renderer windows for side A and B of the cabinet.
     * Both windows will be frameless and displayed at a full 1280x1024 resolution.
     * 
     * This does nothing if we don't have exactly two 1280x1024 displays.
     */
    public buildWindows(): void {

        let windowOptions: GitHubElectron.BrowserWindowOptions = {
            frame: false,
            fullscreen: true,
            width: 1280,
            height: 1024
        };

        let optionsA = _.clone(windowOptions);
        let optionsB = _.clone(windowOptions);

        let displays: Interfaces.ElectronDisplay[] = electron.screen.getAllDisplays();

        console.log("--- Display Configuration --------------------------------");
        console.log(JSON.stringify(displays, null, 4));
        console.log("----------------------------------------------------------");

        // Determine if we have exactly two 1280x1024 screens available.
        let screensAre1280x1024 = displays.length >= 2
            && displays[0].size.width === 1280
            && displays[0].size.height === 1024
            && displays[1].size.width === 1280
            && displays[1].size.height === 1024;

        // Next up find the "origin" screen; that is, the screen at position (0, 0).
        // Windows uses the origin screen to determine the positioning of all of the
        // other monitors attached to the system.

        // Find the index of the monitor in the array that is at (0, 0).
        let originIndex = _.findIndex(displays, (display: Interfaces.ElectronDisplay) => {
            return display.bounds.x === 0 && display.bounds.y === 0;
        });

        // Find the index of the monitor in the array that is NOT at (0, 0).
        let nonOriginIndex = _.findIndex(displays, (display: Interfaces.ElectronDisplay) => {
            return !(display.bounds.x === 0 && display.bounds.y === 0);
        });

        // If we have the corrent screen configuration, position a window on
        // each of the screens. If not, then make sure the windows show up with
        // frames and borders etc so they can be moved around during debugging.
        if (screensAre1280x1024 && originIndex != null && nonOriginIndex != null && originIndex !== nonOriginIndex) {

            // Put the side A and B windows on the correct monitors by config.
            if (ConfigManager.config.menu.originMonitorSide === "A") {
                optionsA.x = displays[originIndex].bounds.x;
                optionsA.y = displays[originIndex].bounds.y;
                optionsB.x = displays[nonOriginIndex].bounds.x;
                optionsB.y = displays[nonOriginIndex].bounds.y;
            }
            else if (ConfigManager.config.menu.originMonitorSide === "B") {
                optionsA.x = displays[nonOriginIndex].bounds.x;
                optionsA.y = displays[nonOriginIndex].bounds.y;
                optionsB.x = displays[originIndex].bounds.x;
                optionsB.y = displays[originIndex].bounds.y;
            }
        }
        else {
            optionsA.fullscreen = false;
            optionsB.fullscreen = false;
            optionsA.frame = true;
            optionsB.frame = true;
        }

        this._windowA = new electron.BrowserWindow(optionsA);
        this._windowA.loadURL("file://" + __dirname + "../../www/index.html#side-a");
        this._windowA.on("closed", this.rendererWindow_closed.bind(this, "A"));

        this._windowB = new electron.BrowserWindow(optionsB);
        this._windowB.loadURL("file://" + __dirname + "../../www/index.html#side-b");
        this._windowB.on("closed", this.rendererWindow_closed.bind(this, "B"));

        // If this is a debug build AND the input daemon is not available, show the
        // input test window which emulates the functionality of the daemon for testing.
        if (ConfigManager.buildVars.debug && !InputDaemon.isAvailable()) {

            this._inputTestWindow = new electron.BrowserWindow({ width: 300, height: 175, x: 0, y: 0 });
            this._inputTestWindow.loadURL("file://" + __dirname + "../../www/input-test.html");
            this._inputTestWindow.on("closed", this.rendererWindow_closed.bind(this, "input-test"));

            let inputTestSocket = net.createConnection(6000, "127.0.0.1", function () {
                console.log("input-test: Connected");
            });

            electron.ipcMain.on("input-test-keypress", (eventName: string, keyCode: number) => {
                inputTestSocket.write(keyCode.toString(), "utf-8");
            });
        }
    }

    //#region Private Helpers

    /**
     * Used to ensure both windows are displayed a 0,0 on their assigned screens.
     * 
     * This does nothing if we don't have exactly two 1280x1024 displays.
     */
    private repositionWindows(): void {

        if (!this._windowA || !this._windowB) {
            return;
        }

        let displays: Interfaces.ElectronDisplay[] = electron.screen.getAllDisplays();

        // During development don't worry about repositioning the screens.
        if (ConfigManager.buildVars.debug) {

            let screensAre1280x1024 = displays.length >= 2
                && displays[0].size.width === 1280
                && displays[0].size.height === 1024
                && displays[1].size.width === 1280
                && displays[1].size.height === 1024;

            if (!screensAre1280x1024) {
                return;
            }
        }

        // Next up find the "origin" screen; that is, the screen at position (0, 0).
        // Windows uses the origin screen to determine the positioning of all of the
        // other monitors attached to the system.

        // Find the index of the monitor in the array that is at (0, 0).
        let originIndex = _.findIndex(displays, (display: Interfaces.ElectronDisplay) => {
            return display.bounds.x === 0 && display.bounds.y === 0;
        });

        // Find the index of the monitor in the array that is NOT at (0, 0).
        let nonOriginIndex = _.findIndex(displays, (display: Interfaces.ElectronDisplay) => {
            return !(display.bounds.x === 0 && display.bounds.y === 0);
        });

        if (originIndex == null || nonOriginIndex == null || originIndex === nonOriginIndex) {
            console.error("Unable to determine origin monitor in repositionWindows().", originIndex, nonOriginIndex);
            return;
        }

        // Determine the index of the display that corresponds to the correct
        // side as defined in the configuration.

        let windowAIndex = null;
        let windowBIndex = null;

        if (ConfigManager.config.menu.originMonitorSide === "A") {
            windowAIndex = originIndex;
            windowBIndex = nonOriginIndex;
        }
        else if (ConfigManager.config.menu.originMonitorSide === "B") {
            windowAIndex = nonOriginIndex;
            windowBIndex = originIndex;
        }

        if (windowAIndex == null || windowBIndex == null || windowAIndex === windowBIndex) {
            console.error("Unable to determine window indexes in repositionWindows().", originIndex, nonOriginIndex);
            return;
        }

        // Ugly hack ahead!

        // Before the windows can be repositioned, they must be removed from full screen
        // mode. Then the bounds can be set. Finally, they can be set back to full screen
        // mode. Then one last check is made to see if the windows are where they should
        // be. If they aren't then we'll sleep another second and try again. Sometimes this
        // is needed if the switch between clone and extend displays is slow.

        this._windowA.setFullScreen(false);
        this._windowB.setFullScreen(false);

        setTimeout(() => {
            this._windowA.setBounds(displays[windowAIndex].bounds);
            this._windowB.setBounds(displays[windowBIndex].bounds);

            setTimeout(() => {
                this._windowA.setFullScreen(true);
                this._windowB.setFullScreen(true);

                setTimeout(() => {

                    let isWindowAOk = JSON.stringify(this._windowA.getBounds()) === JSON.stringify(displays[windowAIndex].bounds);
                    let isWindowBOk = JSON.stringify(this._windowB.getBounds()) === JSON.stringify(displays[windowBIndex].bounds);

                    if (!isWindowAOk || !isWindowBOk) {
                        setTimeout(() => { this.repositionWindows(); }, 1000);
                    }

                }, 500);
            }, 500);
        }, 500);
    }

    //#endregion

    //#region Renderer Window Events

    private rendererWindow_closed(windowId: string): void {

        switch (windowId) {
            case "A":
                this._windowA = null;
                break;
            case "B":
                this._windowB = null;
                break;
            case "input-test":
                this._inputTestWindow = null;
                break;
        }
    }

    //#endregion

    //#region Renderer IPC Events

    private renderer_log(event: any, level: string, message: string): void {

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

    private renderer_isGameRunning(event: any, side: string): void {

        let isGameRunning = false;

        switch (side) {
            case "A":
                isGameRunning = this._sideAGame != null;
                break;
            case "B":
                isGameRunning = this._sideBGame != null;
                break;
        }

        event.returnValue = isGameRunning.toString();
    }

    private renderer_canLaunchSpec(event: any, side: string, specToCheckJson: string): void {

        let specToCheck: Interfaces.GameSpecification;

        try {
            specToCheck = JSON.parse(specToCheckJson);
        }
        catch (exception) {
            console.error("Unable to parse game specification JSON.", side, specToCheckJson, exception);
        }

        event.returnValue = Utilities.canLaunchSpec(this._sideASpec, this._sideBSpec, side, specToCheck).toString();
    }

    private renderer_showSystemNotification(event: any, type: string, title: string, message: string): void {
        this.emit("show-system-notification", type, title, message);
    }

    private renderer_launchGame(event: any, side: string, gameJson: string, specJson: string): void {

        let game: Interfaces.GameDescriptor;
        let spec: Interfaces.GameSpecification;

        try {
            game = JSON.parse(gameJson);
            spec = JSON.parse(specJson);
        }
        catch (exception) {
            console.error("Unable to parse game descriptor or specification JSON.", side, gameJson, specJson, exception);
            this._windowA.emit("game-terminated", side, gameJson, specJson);
            this._windowB.emit("game-terminated", side, gameJson, specJson);
            return;
        }

        if (side == null || game == null || spec == null ) {
            console.error("A side, game, and spec are required to launch a game.", side, game, spec);
            this._windowA.emit("game-terminated", side, gameJson, specJson);
            this._windowB.emit("game-terminated", side, gameJson, specJson);
            return;
        }

        if (side !== "A" && side !== "B") {
            console.error("Unsupported side when launching game.", side, game, spec);
            this._windowA.emit("game-terminated", side, gameJson, specJson);
            this._windowB.emit("game-terminated", side, gameJson, specJson);
            return;
        }

        if (spec.type !== "single-screen" && spec.type !== "dual-screen") {
            console.error("Unsupported spec type when launching game.", side, game, spec);
            this._windowA.emit("game-terminated", side, gameJson, specJson);
            this._windowB.emit("game-terminated", side, gameJson, specJson);
            return;
        }

        if (game.platform !== "MAME" && game.platform !== "PC") {
            console.error("Unsupported platform type when launching game.", side, game, spec);
            this._windowA.emit("game-terminated", side, gameJson, specJson);
            this._windowB.emit("game-terminated", side, gameJson, specJson);
            return;
        }

        if (game.platform === "PC" && spec.type !== "dual-screen") {
            console.error("The PC platform only supports dual screen games.");
            this._windowA.emit("game-terminated", side, gameJson, specJson);
            this._windowB.emit("game-terminated", side, gameJson, specJson);
            return;
        }

        if (game.platform === "PC" && process.platform !== "win32") {
            console.error("The PC platform is only available on the win32 platform.");
            this._windowA.emit("game-terminated", side, gameJson, specJson);
            this._windowB.emit("game-terminated", side, gameJson, specJson);
            return;
        }

        let canLaunchSpec = Utilities.canLaunchSpec(this._sideASpec, this._sideBSpec, side, spec);

        // Sanity check - The renderer should have already checked this.
        if (!canLaunchSpec) {
            console.warn("The given specification can not be launched at this time because it conflicts with another active spec.");
            this._windowA.emit("game-terminated", side, gameJson, specJson);
            this._windowB.emit("game-terminated", side, gameJson, specJson);
            return;
        }

        let executable: string = null;
        let workingDir: string = null;
        let args: string[] = [];
        let startMinimized = false;
        let config = ConfigManager.config;

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

                if (side === "A") {
                    args.push(Utilities.format("-screen0 {0}", config.mame.screens.a));
                    args.push(Utilities.format("-screen1 {0}", config.mame.screens.b));
                }
                else if (side === "B") {
                    args.push(Utilities.format("-screen0 {0}", config.mame.screens.b));
                    args.push(Utilities.format("-screen1 {0}", config.mame.screens.a));
                }
            }
            else if (spec.type === "single-screen") {

                startMinimized = true;

                args.push("-global_inputs");
                args.push("-window");

                if (side === "A") {
                    args.push(Utilities.format("-screen {0}", config.mame.screens.a));
                    args.push(config.mame.mameAudioChannelSwitches.a);
                }
                else if (side === "B") {
                    args.push(Utilities.format("-screen {0}", config.mame.screens.b));
                    args.push(config.mame.mameAudioChannelSwitches.b);
                }
            }

            args.push(`-cfg_directory "${config.mame.customConfigRoot}/side-${side}"`);

            // TODO: Handle two instances of the same game at once (nvram conflicts??)
        }
        else if (game.platform === "PC") {
            executable = game.resource;
            workingDir = path.dirname(game.resource);
        }

        if (!fs.existsSync(executable)) {
            console.error("Unable to locate executable when launching game.", executable);
            this._windowA.emit("game-terminated", side, gameJson, specJson);
            this._windowB.emit("game-terminated", side, gameJson, specJson);
            return;
        }

        if (!fs.existsSync(executable)) {
            console.error("Unable to locate working directory when launching game.", workingDir);
            this._windowA.emit("game-terminated", side, gameJson, specJson);
            this._windowB.emit("game-terminated", side, gameJson, specJson);
            return;
        }

        if (spec.type === "dual-screen") {
            this._sideAGame = game;
            this._sideASpec = spec;

            this._sideBGame = game;
            this._sideBSpec = spec;
        }
        else if (spec.type === "single-screen" && side === "A") {
            this._sideAGame = game;
            this._sideASpec = spec;
        }
        else if (spec.type === "single-screen" && side === "B") {
            this._sideBGame = game;
            this._sideBSpec = spec;
        }

        // TODO: Commented this out for now as it appears that node child_process.exec(...)
        // is already wrapping the command with quotes in this format using cmd.exe:
        // cmd.exe /s /c "COMMAND_HERE"
        // If there are spaces in the executable path, wrap it in quotes.
        // if (executable.indexOf(" ") > -1) {
        //     executable = `"${executable}"`;
        // }

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
            let command = `"${config.displayFusion.executable}" -monitorloadprofile ${config.displayFusion.cloneProfile}`;
            console.log(`Switching display to clone profile with command:\n${command}`);
            let result = syncExec(command);
            result = JSON.stringify(result, null, 4);
            console.log(`Display switch result:\n${result}`);
        }

        console.log("Launching game...", workingDir, command);

        this._windowA.emit("game-launched", side, gameJson, specJson);
        this._windowB.emit("game-launched", side, gameJson, specJson);

        exec(command, execOptions, (error: Error, stdout: Buffer, stderr: Buffer) => {

            if (error) {
                console.error("Process terminated with error.", error);
            }

            if (stdout) {
                console.log("Process terminated with stdout output.", stdout.toString());
            }

            if (stderr) {
                console.error("Process terminated with stderr output.", stderr.toString());
            }

            // Switch back to extended displays from cloned displays.
            if (game.platform === "PC") {
                let command = `"${config.displayFusion.executable}" -monitorloadprofile ${config.displayFusion.extendProfile}`;
                console.log(`Switching display to extended profile with command:\n${command}`);
                let result = syncExec(command);
                result = JSON.stringify(result, null, 4);
                console.log(`Display switch result:\n${result}`);

                this.repositionWindows();
            }

            if (spec.type === "dual-screen") {
                this._sideAGame = null;
                this._sideASpec = null;

                this._sideBGame = null;
                this._sideBSpec = null;
            }
            else if (spec.type === "single-screen" && side === "A") {
                this._sideAGame = null;
                this._sideASpec = null;
            }
            else if (spec.type === "single-screen" && side === "B") {
                this._sideBGame = null;
                this._sideBSpec = null;
            }

            this._windowA.emit("game-terminated", side, gameJson, specJson);
            this._windowB.emit("game-terminated", side, gameJson, specJson);
        });
    }

    //#endregion
}
