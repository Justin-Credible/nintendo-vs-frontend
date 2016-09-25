
import * as fs from "fs";
import { exec } from "child_process";
import * as ConfigManager from "./ConfigManager";

export function isAvailable(): boolean {
    // The Borderless Gaming process is only available on Windows.
    return process.platform === "win32" && fs.existsSync(ConfigManager.config.borderlessgaming.executable);
}

export function launch(): void {

    if (!isAvailable()) {
        console.log("Unable to start Borderless Gaming; executable missing or platform is not win32.");
        return;
    }

    console.log("Terminating any previous Borderless Gaming processes...");

    exec(`${ConfigManager.config.taskKill} /IM BorderlessGaming.exe`);

    let command = "start /b /min \"\" \"" + ConfigManager.config.borderlessgaming.executable + "\"";

    console.log("Attempting to start Borderless Gaming with command:\n    " + command);

    exec(command, (error: Error, stdout: Buffer, stderr: Buffer) => {

        if (error) {
            console.log("Error launching Borderless Gaming.", error);
        }
        else if (stdout || stderr) {
            console.log("Borderless Gaming terminated unexpectedly.", stdout, stderr);
        }

        console.log("Attempting to restart Borderless Gaming in 2 seconds...");
        setTimeout(() => { launch(); }, 2000);
    });
}

export function shutdown(): void {

    console.log("Attempting to close Borderless Gaming...");

    try {
        exec(`${ConfigManager.config.taskKill} /IM BorderlessGaming.exe`);
    }
    catch (ex) {
        console.error("An error occurred attempting to close Borderless Gaming.", ex);
    }
}
