
namespace JustinCredible.NintendoVsFrontend.Renderer.Controllers {

    export class MenuController extends BaseController<ViewModels.MenuViewModel> {

        //#region Injection

        public static ID = "MenuController";

        public static get $inject(): string[] {
            return [
                "$scope",
                "$rootScope",
                "$timeout",
                Services.Logger.ID,
                Services.Utilities.ID
            ];
        }

        constructor(
            $scope: ng.IScope,
            private $rootScope: ng.IRootScopeService,
            private $timeout: ng.ITimeoutService,
            private Logger: Services.Logger,
            private Utilities: Services.Utilities) {
            super($scope, ViewModels.MenuViewModel);

            this.viewModel.title = "Nintendo VS";
            this.viewModel.player1Prompt = "Please Wait";
            this.viewModel.player2Prompt = "Please Wait";
        }

        //#endregion

        private _playerInputTimer: ng.IPromise<void>;

        //#region BaseController Overrides

        protected view_loaded(): void {
            super.view_loaded();

            this.$rootScope.$on(Constants.PlayerInputEvent, _.bind(this.app_playerInput, this));

            this.viewModel.games = this.Utilities.gameList;
            this.viewModel.selectedGame = this.viewModel.games[0];
        }

        //#endregion

        //#region Events

        private app_playerInput(event: ng.IAngularEvent, input: Interfaces.PlayerInput): void {

            // If one player is already in control and the other provides
            // input, then ignore it as they are in the "Please Wait" state.
            if (this.viewModel.activePlayer != null
                && input.player !== this.viewModel.activePlayer) {

                return;
            }

            if (this.viewModel.activePlayer == null) {
                // If there wasn't an active player yet, then set one and
                // start a timer so we can force the player to relinquish
                // control after a period of inactivity.

                this.viewModel.activePlayer = input.player;

                if (input.player === Enums.Player.One) {
                    this.viewModel.player1Prompt = "Choose a Game";
                }
                else if (input.player === Enums.Player.Two) {
                    this.viewModel.player2Prompt = "Choose a Game";
                }

                this._playerInputTimer = this.$timeout(_.bind(this.player_inputTimeout, this), 10000);
            }
            else {
                // If there was already an active player, just refresh
                // the timer, unless the player pressed back to cancel.

                this.$timeout.cancel(this._playerInputTimer);

                if (input.input === Enums.Input.Back) {
                    this.viewModel.activePlayer = null;
                    this.viewModel.selectedGame = null;
                    this.viewModel.player1Prompt = "Press Start";
                    this.viewModel.player2Prompt = "Press Start";
                    return;
                }
                else {
                    this._playerInputTimer = this.$timeout(_.bind(this.player_inputTimeout, this), 10000);
                }
            }

            // The only inputs we handle after this point are up/down/ok/back.
            if (input.input !== Enums.Input.Up
                && input.input !== Enums.Input.Down
                && input.input !== Enums.Input.OK) {

                return;
            }

            // If a game wasn't selected yet, select the first one and then bail out.
            if (!this.viewModel.selectedGame) {
                this.viewModel.selectedGame = this.viewModel.games[0];
                return;
            }

            // Find the index of the selected game.
            let selectedGameIndex = this.viewModel.games.indexOf(this.viewModel.selectedGame);

            // Sanity check; there should always be a selected game.
            if (selectedGameIndex <= -1) {
                this.Logger.warn(MenuController.ID, "app_playerInput", "Could not locate the selected game; index zero or underflow.");
                return;
            }

            // Sanity check; the index shouldn't be over the max in the list.
            if (selectedGameIndex > (this.viewModel.games.length - 1)) {
                this.Logger.warn(MenuController.ID, "app_playerInput", "Could not locate the selected game; index overflow.");
                return;
            }

            // Perform an action based on the player's input.
            switch (input.input) {

                case Enums.Input.Up: {

                    if (selectedGameIndex === 0) {
                        // TODO: Can't go up sound effect.
                        this.Logger.debug(MenuController.ID, "app_playerInput", "TODO: SFX Needed: Can't navigate up.");
                    }
                    else {
                        this.viewModel.selectedGame = this.viewModel.games[selectedGameIndex - 1];
                    }

                }
                break;

                case Enums.Input.Down: {

                    if (selectedGameIndex === (this.viewModel.games.length - 1)) {
                        // TODO: Can't go down sound effect.
                        this.Logger.debug(MenuController.ID, "app_playerInput", "TODO: SFX Needed: Can't navigate down.");
                    }
                    else {
                        this.viewModel.selectedGame = this.viewModel.games[selectedGameIndex + 1];
                    }
                }
                break;

                case Enums.Input.OK: {

                    // TODO: Show menu about game information.
                    this.Logger.debug(MenuController.ID, "app_playerInput", "TODO: Player chose game.", this.viewModel.selectedGame);
                }
                break;
            }

            this.scope.$apply();
        }

        private player_inputTimeout(): void {

            this.viewModel.activePlayer = null;
            this.viewModel.selectedGame = null;
            this.viewModel.player1Prompt = "Press Start";
            this.viewModel.player2Prompt = "Press Start";
        }

        //#endregion
    }
}
