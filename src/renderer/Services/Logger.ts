
namespace JustinCredible.NintendoVsFrontend.Renderer.Services {

    /**
     * Provides a common set of helper/utility methods for logging errors.
     */
    export class Logger {

        //#region Injection

        public static ID = "Logger";

        public static get $inject(): string[] {
            return [
                "$log"
            ];
        }

        constructor(
            private $log: ng.ILogService) {
        }

        //#endregion

        private _currentRoute: string;

        //#region Public Methods

        public debug(tagPrefix: string, tag: string, message: string, metadata?: any): void {
            this.$log.debug(tagPrefix + "." + tag + ": " + message, metadata);
        }

        public info(tagPrefix: string, tag: string, message: string, metadata?: any): void {
            this.$log.info(tagPrefix + "." + tag + ": " + message, metadata);
        }

        public warn(tagPrefix: string, tag: string, message: string, metadata?: any): void {
            this.$log.warn(tagPrefix + "." + tag + ": " + message, metadata);
        }

        public error(tagPrefix: string, tag: string, message: string, metadata?: any): void {
            this.$log.error(tagPrefix + "." + tag + ": " + message, metadata);
        }

        //#endregion
    }
}
