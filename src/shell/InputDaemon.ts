
import * as fs from "fs";
import { exec } from "child_process";
import * as ConfigManager from "./ConfigManager";

export function isAvailable(): boolean {
    // The input daemon process is only available on Windows.
    return process.platform === "win32" && fs.existsSync(__dirname + "/../input-daemon.exe");
}

export function launch(): void {

    let command = "start /MIN " + __dirname + "/../input-daemon.exe";

    console.log("Attempting to start input daemon with command:\n    " + command);

    if (!isAvailable()) {
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
        setTimeout(() => { launch(); }, 2000);
    });
}

export function shutdown(): void {

    console.log("Attempting to close Input Daemon...");

    try {
            exec(`${ConfigManager.config.taskKill} /IM Input-Daemon.exe`);
    }
    catch (ex) {
        console.error("An error occurred attempting to close Input Daemon.", ex);
    }
}
