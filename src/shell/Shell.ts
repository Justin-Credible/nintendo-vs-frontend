
import * as electron from "electron";
import * as ConfigManager from "./ConfigManager";
import * as Utilities from "./Utilities";
import * as Enums from "./Enums";
import * as InputDaemon from "./InputDaemon";
import { InputListener } from "./InputListener";
import { TrayMenu } from "./TrayMenu";
import * as BorderlessGaming from "./BorderlessGaming";
import { WindowManager } from "./WindowManager";

namespace JustinCredible.NintendoVsFrontend.Shell {

    var inputListener: InputListener;
    var trayMenu: TrayMenu;
    var windowManager: WindowManager;

    export function main(): void {

        // Read in configuration values.
        ConfigManager.loadConfigs();

        // Wire up the event handlers for the node process.
        process.on("uncaughtException", process_uncaughtException);
        process.on("SIGTERM", process_sigterm);

        // Wire up the event handlers for Electron.
        electron.app.on("exit", app_exit);
        electron.app.on("window-all-closed", app_windowAllClosed);
        electron.app.on("ready", app_ready);

        // Listen for controller input.
        inputListener = new InputListener();
        inputListener.initialize();
        inputListener.on("player-input", inputListener_playerInput);

        // Intialize the window manager.
        windowManager = new WindowManager();
        windowManager.on("show-system-notification", windowManager_showSystemNotification);

        // Once electron is ready, app_ready will be fired...
    }

    //#region Helper Methods

    function cleanupOnExit(): void {

        inputListener.shutdown();
        BorderlessGaming.shutdown();
        InputDaemon.shutdown();

        electron.app.quit();
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
        trayMenu = new TrayMenu();
        trayMenu.on("quit", trayMenu_quit);

        // Populate the path to the preview videos for each game.
        Utilities.populateVideoPaths(ConfigManager.gameList);

        // Expose these as globals so they can be accessed via the render windows via Boot2.ts.
        /* tslint:disable:no-string-literal */
        global["gameList"] = ConfigManager.gameList;
        global["buildVars"] = ConfigManager.buildVars;
        global["menuConfig"] = ConfigManager.config.menu;
        /* tslint:enable:no-string-literal */

        // Ensure the Borderless Gaming app is running.
        BorderlessGaming.launch();

        // Wait to ensure that Borderless Gaming launches and it's window is on the desktop.
        // We want to make sure that our renderer windows are on top of the window.
        setTimeout(() => { windowManager.buildWindows(); }, ConfigManager.config.borderlessgaming.delay || 500);
    }

    //#endregion

    //#region Tray Menu Events

    function trayMenu_quit(): void {
        electron.app.quit();
    }

    //#endregion

    //#region Input Listener Events

    function inputListener_playerInput(side: string, input: Enums.Input): void {

        if (side === "A" && !windowManager.sideAGame) {
            windowManager.windowA.emit("player-input", input);
        }
        else if (side === "B" && !windowManager.sideBGame) {
            windowManager.windowB.emit("player-input", input);
        }
    }

    //#endregion

    //#region Window Manager Events

    function windowManager_showSystemNotification(type: string, title: string, message: string): void {
        trayMenu.displayBalloon(type, title, message);
    }

    //#endregion
}

module.exports =  JustinCredible.NintendoVsFrontend.Shell;
