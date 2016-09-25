
import events = require("events");
import * as ConfigManager from "./ConfigManager";
import * as Utilities from "./Utilities";
import * as path from "path";
import * as electron from "electron";

export class TrayMenu extends events.EventEmitter {

    constructor() {
        super();
        this.buildMenu();
    }

    private _tray: GitHubElectron.Tray;

    private buildMenu(): void {

        let iconPath = path.join(__dirname, "..", "icons", "joystick.ico");
        this._tray = new electron.Tray(iconPath);
        this._tray.setToolTip("Nintendo VS Frontend");

        let versionDisplay = `Version ${ConfigManager.buildVars.version} - ${ConfigManager.buildVars.commitShortSha}`;

        let options: GitHubElectron.MenuItemOptions[] = [
            { type: "normal", label: "Nintendo VS Frontend", sublabel: versionDisplay, enabled: false },
            { type: "separator" },
            { label: "Quit", type: "normal", click: this.tray_quit_click.bind(this) },
        ];

        // OSX doesn't support sub-labels in menu items, so we'll add it as a seperate item.
        if (process.platform === "darwin") {
            options.splice(1, 0, { type: "normal", label: versionDisplay, enabled: false } );
        }

        let contextMenu = electron.Menu.buildFromTemplate(options);
        this._tray.setContextMenu(contextMenu);
    }

    private tray_quit_click(): void {
        this.emit("quit");
    }

    public displayBalloon(type: string, title: string, message: string): void {

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

        this._tray.displayBalloon({
            icon: iconImage,
            title: title,
            content: message
        });
    }
}
