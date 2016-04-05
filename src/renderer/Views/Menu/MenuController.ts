
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
                Services.SFX.ID,
                Services.UIHelper.ID,
                Services.Utilities.ID
            ];
        }

        constructor(
            $scope: ng.IScope,
            private $rootScope: ng.IRootScopeService,
            private $timeout: ng.ITimeoutService,
            private Logger: Services.Logger,
            private SFX: Services.SFX,
            private UIHelper: Services.UIHelper,
            private Utilities: Services.Utilities) {
            super($scope, ViewModels.MenuViewModel);
        }

        //#endregion

        private _allowPlayerInput: boolean;
        private _playerInputTimer: ng.IPromise<void>;

        //#region BaseController Overrides

        protected view_loaded(): void {
            super.view_loaded();

            this._allowPlayerInput = true;

            this.$rootScope.$on(Constants.PlayerInputEvent, _.bind(this.app_playerInput, this));

            this.viewModel.title = "Nintendo VS";
            this.viewModel.player1Prompt = "Press Start";
            this.viewModel.player2Prompt = "Press Start";

            this.viewModel.games = this.Utilities.gameList;
            this.viewModel.gamesForPage = this.Utilities.getPageAtIndex(this.Utilities.gameList, 0, Constants.PAGE_SIZE);
            this.Logger.debug(MenuController.ID, "view_loaded", "gamesForPage", this.viewModel.gamesForPage);
            this.viewModel.currentPageIndex = 0;
            this.viewModel.selectedGame = this.viewModel.games[0];
        }

        //#endregion

        //#region Controller Helper Properties

        protected get posterImageUrl(): string {

            if (!this.viewModel.selectedGame) {
                return "url('img/game-place-holder.png')";
            }

            if (!this.viewModel.selectedGame._hasImage) {
                return "url('img/game-place-holder.png')";
            }

            return this.Utilities.format("url('img/games/{0}/{1}.png')",
                this.viewModel.selectedGame.platform,
                this.viewModel.selectedGame.resource);
        }

        protected get playerCountDisplay(): string {

            if (!this.viewModel.selectedGame) {
                return "";
            }

            if (this.viewModel.selectedGame.specs.length === 1) {
                return this.viewModel.selectedGame.specs[0].players + " Players";
            }
            else if (this.viewModel.selectedGame.specs.length > 1) {
                let lastSpecIndex = this.viewModel.selectedGame.specs.length - 1;
                return this.viewModel.selectedGame.specs[lastSpecIndex].players + " Players";
            }
            else {
                return "[Error 1]";
            }
        }

        protected get screenCountDisplay(): string {

            if (!this.viewModel.selectedGame) {
                return "";
            }
            
            if (this.viewModel.selectedGame.specs.length === 1) {
                if (this.viewModel.selectedGame.specs[0].type === "single-screen") {
                    return "1 Screen";
                }
                else if (this.viewModel.selectedGame.specs[0].type === "dual-screen") {
                    return "2 Screen";
                }
                else {
                    return "[Error 1]";
                }
            }
            else if (this.viewModel.selectedGame.specs.length > 1) {
                let types = _.pluck(this.viewModel.selectedGame.specs, "type");

                if (types.indexOf("single-screen") > -1 && types.indexOf("dual-screen") > -1) {
                    return "1-2 Screens";
                }
                else {
                    return "[Error 2]";
                }
            }
            else {
                return "[Error 3]";
            }
        }

        protected get pagerDisplay(): string {

            if (this.viewModel.currentPageIndex == null || this.viewModel.games == null) {
                return;
            }

            return this.Utilities.format("Page {0} of {1}",
                        this.viewModel.currentPageIndex + 1,
                        Math.ceil(this.viewModel.games.length / Constants.PAGE_SIZE));
        }

        //#endregion

        //#region Events

        private app_playerInput(event: ng.IAngularEvent, input: Interfaces.PlayerInput): void {

            if (!this._allowPlayerInput) {
                return;
            }

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
                    this.viewModel.player2Prompt = "Please Wait";
                }
                else if (input.player === Enums.Player.Two) {
                    this.viewModel.player1Prompt = "Please Wait";
                    this.viewModel.player2Prompt = "Choose a Game";
                }

                this.startPlayerInputTimer();
            }
            else {
                // If there was already an active player, just refresh
                // the timer, unless the player pressed back to cancel.

                this.stopPlayerInputTimer();

                if (input.input === Enums.Input.Back) {
                    this.viewModel.activePlayer = null;
                    this.viewModel.selectedGame = null;
                    this.viewModel.player1Prompt = "Press Start";
                    this.viewModel.player2Prompt = "Press Start";
                    return;
                }
                else {
                    this.startPlayerInputTimer();
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
                        this.SFX.playCursorMove();
                        this.viewModel.selectedGame = this.viewModel.games[selectedGameIndex - 1];
                        this.viewModel.currentPageIndex = this.Utilities.getPageIndexForItemIndex(selectedGameIndex - 1, Constants.PAGE_SIZE)
                        this.viewModel.gamesForPage = this.Utilities.getPageAtIndex(this.viewModel.games, this.viewModel.currentPageIndex, Constants.PAGE_SIZE);
                    }

                }
                break;

                case Enums.Input.Down: {

                    if (selectedGameIndex === (this.viewModel.games.length - 1)) {
                        // TODO: Can't go down sound effect.
                        this.Logger.debug(MenuController.ID, "app_playerInput", "TODO: SFX Needed: Can't navigate down.");
                    }
                    else {
                        this.SFX.playCursorMove();
                        this.viewModel.selectedGame = this.viewModel.games[selectedGameIndex + 1];
                        this.viewModel.currentPageIndex = this.Utilities.getPageIndexForItemIndex(selectedGameIndex + 1, Constants.PAGE_SIZE)
                        this.viewModel.gamesForPage = this.Utilities.getPageAtIndex(this.viewModel.games, this.viewModel.currentPageIndex, Constants.PAGE_SIZE);
                    }
                }
                break;

                case Enums.Input.OK: {

                    this.preventPlayerInput();
                    this.stopPlayerInputTimer();

                    this.showLaunchDialog(this.viewModel.selectedGame);
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

        //#region Private Helpers

        private startPlayerInputTimer(): void {
            this._playerInputTimer = this.$timeout(_.bind(this.player_inputTimeout, this), 10000);
        }

        private stopPlayerInputTimer(): void {
            if (this._playerInputTimer) {
                this.$timeout.cancel(this._playerInputTimer);
            }
        }

        private preventPlayerInput(): void {
            this._allowPlayerInput = false;
        }

        private allowPlayerInput(): void {
            this._allowPlayerInput = true;
        }

        private showLaunchDialog(game: Interfaces.GameDescriptor): void {

            this.UIHelper.showDialog(LaunchDialogController)
                .then((result: Models.LaunchDialogResultModel) => {

                console.debug("!", result);

                if (result.action === Constants.DialogResults.OK) {
                    // TODO: Validate spec, show loading dialog, and launch!
                    this.Logger.debug(MenuController.ID, "app_playerInput", "TODO: Player chose game.", this.viewModel.selectedGame);
                }
                else {
                    this.allowPlayerInput();
                    this.startPlayerInputTimer();
                }
            });
        }

        //#endregion
    }
}
