
namespace JustinCredible.NintendoVsFrontend.Renderer.Services {

    /**
     * Helpers used to communicate with the shell instance over IPC to launch games.
     */
    export class LaunchHelper {

        //#region Injection

        public static ID = "LaunchHelper";

        public static get $inject(): string[] {
            return [
                "electronIpcRenderer",
                "side"
            ];
        }

        constructor(
            private ipcRenderer: GitHubElectron.IpcRenderer,
            private side: string) {
        }

        //#endregion

        private _currentRoute: string;

        //#region Public Methods

        /**
         * Used to check if a game is currently running on this side.
         */
        public isGameRunning(): boolean {
            return this.ipcRenderer.sendSync("renderer_isGameRunning", this.side) === "true";
        }

        /**
         * Used to check if the given game specification can be launched.
         * 
         * This checks to determine if the given spec can be executed based
         * on the state of the other side.
         * 
         * @param spec The game specification to check.
         * @returns True if the given spec can be launched, false otherwise.
         */
        public canLaunchSpec(spec: Interfaces.GameSpecification): boolean {
            return this.ipcRenderer.sendSync("renderer_canLaunchSpec", this.side, JSON.stringify(spec)) === "true";
        }

        /**
         * Used to launch a game using the specific specification.
         * 
         * @param game The game to launch.
         * @param spec The specification used to launch the game.
         */
        public launchGame(game: Interfaces.GameDescriptor, spec: Interfaces.GameSpecification): void {
            this.ipcRenderer.send("renderer_launchGame", this.side, JSON.stringify(game), JSON.stringify(spec));
        }

        //#endregion
    }
}
