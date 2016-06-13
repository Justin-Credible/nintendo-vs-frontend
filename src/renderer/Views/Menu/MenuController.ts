
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
                Services.LaunchHelper.ID,
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
            private LaunchHelper: Services.LaunchHelper,
            private Utilities: Services.Utilities) {
            super($scope, ViewModels.MenuViewModel);
        }

        //#endregion

        private _allowPlayerInput: boolean;
        private _playerInputTimer: ng.IPromise<void>;
        private _attractModeTimer: ng.IPromise<void>;
        private _isGameRunning: boolean = false;
        private _isAttractModeRunning: boolean = false;

        //#region BaseController Overrides

        protected view_loaded(): void {
            super.view_loaded();

            this._allowPlayerInput = true;

            this.$rootScope.$on(Constants.GameLaunchedEvent, _.bind(this.app_gameLaunched, this));
            this.$rootScope.$on(Constants.GameTerminatedEvent, _.bind(this.app_gameTerminated, this));

            this.$rootScope.$on(Constants.EnableAttractMode, _.bind(this.app_enableAttractMode, this));
            this.$rootScope.$on(Constants.DisableAttractMode, _.bind(this.app_disableAttractMode, this));

            this.$rootScope.$on(Constants.PlayerInputEvent,
                (event: ng.IAngularEvent, input: Interfaces.PlayerInput) => {

                this.scope.$apply(() => {
                    this.app_playerInput(event, input);
                });
            });

            this.viewModel.version = `${this.Utilities.buildVars.version} (${this.Utilities.buildVars.commitShortSha})`;
            this.viewModel.title = "Nintendo VS";
            this.viewModel.games = this.Utilities.gameList;
            this.resetToIdle(true);
        }

        //#endregion

        //#region Controller Helper Properties

        protected get shouldShowN64Logo(): boolean {
            return !this._isGameRunning && !this._isAttractModeRunning;
        }

        protected get videoUrl(): string {

            if (this.viewModel.selectedGame && this.viewModel.selectedGame.videoPath) {
                return this.viewModel.selectedGame.videoPath;
            }

            return "";
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
                return "[Error 4]";
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

        private app_gameLaunched(event: ng.IAngularEvent, side: string, game: Interfaces.GameDescriptor): void {

            if (side === this.Utilities.side) {
                this._isGameRunning = true;
            }
            else {
                this.UIHelper.showToast("info", "Information", `The other side has started playing ${game.name}!`);
            }
        }

        private app_gameTerminated(event: ng.IAngularEvent, side: string): void {

            if (side === this.Utilities.side) {

                this.UIHelper.hidePleaseWait();
                this.allowPlayerInput();
                this.startAttractModeTimer();

                // If a game wasn't running on this side, but we received a terminate event
                // then perhaps the game never launched. This is likely an error scenario.
                if (!this._isGameRunning) {
                    this.SFX.playError();
                    this.UIHelper.showToast("error", "Game Over Man!", "Could not launch game :(");
                }

                this._isGameRunning = false;
            }
            else {
                this.UIHelper.showToast("info", "Information", "The other side has finished playing a game.");
            }
        }

        private app_enableAttractMode(event: ng.IAngularEvent, side: string, game: Interfaces.GameDescriptor): void {
            this._isAttractModeRunning = true;
        }

        private app_disableAttractMode(event: ng.IAngularEvent, side: string): void {
            this._isAttractModeRunning = false;
        }

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

                // Ensure attract mode is stopped.
                this.stopAttractModeTimer();
                this.$rootScope.$broadcast(Constants.DisableAttractMode);

                this.viewModel.activePlayer = input.player;
                this.viewModel.selectedGame = this.viewModel.games[0];
                this.viewModel.currentPageIndex = 0;

                if (input.player === Enums.Player.One) {
                    this.viewModel.player1Prompt = "Choose A Game";
                    this.viewModel.player2Prompt = "Please Wait";
                }
                else if (input.player === Enums.Player.Two) {
                    this.viewModel.player1Prompt = "Please Wait";
                    this.viewModel.player2Prompt = "Choose A Game";
                }

                // Greet the new user.
                this.SFX.playReady();
                this.UIHelper.showToast("info", "Welcome!", "Use the joystick and A button to select a game!");

                // Start the timer.
                this.startPlayerInputTimer();

                return;
            }
            else {
                // If there was already an active player, just refresh
                // the timer, unless the player pressed back to cancel.

                this.stopPlayerInputTimer();

                if (input.input === Enums.Input.Back) {
                    this.resetToIdle(true);
                    this.SFX.playCancel();
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
                        this.SFX.playCancel();
                    }
                    else {
                        this.SFX.playCursorMove();
                        this.viewModel.selectedGame = this.viewModel.games[selectedGameIndex - 1];
                        this.viewModel.currentPageIndex = this.Utilities.getPageIndexForItemIndex(selectedGameIndex - 1, Constants.PAGE_SIZE);
                        this.viewModel.gamesForPage = this.Utilities.getPageAtIndex(this.viewModel.games, this.viewModel.currentPageIndex, Constants.PAGE_SIZE);
                    }

                }
                break;

                case Enums.Input.Down: {

                    if (selectedGameIndex === (this.viewModel.games.length - 1)) {
                        this.SFX.playCancel();
                    }
                    else {
                        this.SFX.playCursorMove();
                        this.viewModel.selectedGame = this.viewModel.games[selectedGameIndex + 1];
                        this.viewModel.currentPageIndex = this.Utilities.getPageIndexForItemIndex(selectedGameIndex + 1, Constants.PAGE_SIZE);
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
        }

        private attractMode_timeout(): void {
            this.$rootScope.$broadcast(Constants.EnableAttractMode);
        }

        private player_inputTimeout(): void {
            this.resetToIdle(true);
        }

        //#endregion

        //#region Private Helpers

        private resetToIdle(allowAttractMode: boolean): void {
            this.viewModel.activePlayer = null;
            this.viewModel.selectedGame = null;
            this.viewModel.currentPageIndex = 0;
            this.viewModel.gamesForPage = this.Utilities.getPageAtIndex(this.viewModel.games, 0, Constants.PAGE_SIZE);
            this.viewModel.player1Prompt = "Press Start";
            this.viewModel.player2Prompt = "Press Start";

            if (allowAttractMode) {
                this.startAttractModeTimer();
            }
        }

        private startAttractModeTimer(): void {
            this.stopAttractModeTimer();
            this._attractModeTimer = this.$timeout(_.bind(this.attractMode_timeout, this), Constants.ATTRACT_MODE_IDLE_TIMEOUT);
        }

        private stopAttractModeTimer(): void {
            if (this._attractModeTimer != null) {
                this.$timeout.cancel(this._attractModeTimer);
            }
        }

        private startPlayerInputTimer(): void {
            this.stopPlayerInputTimer();
            this._playerInputTimer = this.$timeout(_.bind(this.player_inputTimeout, this), Constants.PLAYER_IDLE_TIMEOUT);
        }

        private stopPlayerInputTimer(): void {
            if (this._playerInputTimer != null) {
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

            let data = new Models.LaunchDialogModel();
            data.activePlayer = this.viewModel.activePlayer;
            data.game = this.viewModel.selectedGame;

            this.UIHelper.showDialog(LaunchDialogController, data)
                .then((result: Models.LaunchDialogResultModel) => {

                if (result.action === Constants.DialogResults.OK) {

                    let playable = this.LaunchHelper.canLaunchSpec(result.spec);

                    if (playable) {
                        this.preventPlayerInput();
                        this.stopPlayerInputTimer();
                        this.UIHelper.showPleaseWait();

                        this.LaunchHelper.launchGame(this.viewModel.selectedGame, result.spec);

                        // Wait two seconds before resetting so the user doesn't see the screen reset
                        // back to attract mode (the game will have probably launched by then).
                        this.$timeout(() => { this.resetToIdle(false); }, 3000);
                    }
                    else {
                        this.UIHelper.showToast("error", "Can't Start Game", "The other side is already playing a game.");
                        this.SFX.playError();
                    }
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
