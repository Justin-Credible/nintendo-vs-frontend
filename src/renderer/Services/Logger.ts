
namespace JustinCredible.NintendoVsFrontend.Renderer.Services {

    /**
     * Provides a common set of helper/utility methods for logging errors.
     */
    export class Logger {

        //#region Injection

        public static ID = "Logger";

        public static get $inject(): string[] {
            return [
                "$log",
                "electronIpcRenderer"
            ];
        }

        constructor(
            private $log: ng.ILogService,
            private ipcRenderer: GitHubElectron.IpcRenderer) {
        }

        //#endregion

        private _currentRoute: string;

        //#region Public Methods

        public debug(tagPrefix: string, tag: string, message: string, metadata?: any): void {
            this.$log.debug(tagPrefix + "." + tag + ": " + message, metadata);

            if (metadata) {
                try {
                    message += " | " + JSON.stringify(metadata);
                }
                catch (exception) {
                    message += " | [Metadata]";
                }
            }

            this.ipcRenderer.send("renderer_log", "debug", tagPrefix + "." + tag + ": " + message);
        }

        public info(tagPrefix: string, tag: string, message: string, metadata?: any): void {
            this.$log.info(tagPrefix + "." + tag + ": " + message, metadata);

            if (metadata) {
                try {
                    message += " | " + JSON.stringify(metadata);
                }
                catch (exception) {
                    message += " | [Metadata]";
                }
            }

            this.ipcRenderer.send("renderer_log", "info", tagPrefix + "." + tag + ": " + message);
        }

        public warn(tagPrefix: string, tag: string, message: string, metadata?: any): void {
            this.$log.warn(tagPrefix + "." + tag + ": " + message, metadata);

            if (metadata) {
                try {
                    message += " | " + JSON.stringify(metadata);
                }
                catch (exception) {
                    message += " | [Metadata]";
                }
            }

            this.ipcRenderer.send("renderer_log", "warn", tagPrefix + "." + tag + ": " + message);
        }

        public error(tagPrefix: string, tag: string, message: string, metadata?: any): void {
            this.$log.error(tagPrefix + "." + tag + ": " + message, metadata);

            if (metadata) {
                try {
                    message += " | " + JSON.stringify(metadata);
                }
                catch (exception) {
                    message += " | [Metadata]";
                }
            }

            this.ipcRenderer.send("renderer_log", "error", tagPrefix + "." + tag + ": " + message);
        }

        //#endregion
    }
}
