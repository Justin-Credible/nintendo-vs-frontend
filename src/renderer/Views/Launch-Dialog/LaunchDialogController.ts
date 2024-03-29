
namespace JustinCredible.NintendoVsFrontend.Renderer.Controllers {

    export class LaunchDialogController extends BaseDialogController<ViewModels.LaunchDialogViewModel, Models.LaunchDialogModel, Models.LaunchDialogResultModel> {

        //#region Injection

        public static ID = "LaunchDialogController";
        public static TemplatePath = "Views/Launch-Dialog/Launch-Dialog.html";

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
            super($scope, ViewModels.LaunchDialogViewModel);
        }

        //#endregion

        private _playerInputTimer: ng.IPromise<void>;
        private _cancelGameLaunchedListener: Function;
        private _cancelGameTerminatedListener: Function;
        private _cancelPlayerInputListener: Function;

        //#region BaseDialogController Events

        protected dialog_opened(event: ng.IAngularEvent, element: ng.IAugmentedJQuery): void {

            this._cancelGameLaunchedListener = this.$rootScope.$on(Constants.GameLaunchedEvent, _.bind(this.app_gameLaunched, this));
            this._cancelGameTerminatedListener = this.$rootScope.$on(Constants.GameTerminatedEvent, _.bind(this.app_gameTerminated, this));
            this._cancelPlayerInputListener = this.$rootScope.$on(Constants.PlayerInputEvent, _.bind(this.app_playerInput, this));

            this.viewModel.game = this.getData().game;
            this.viewModel.specs = this.getData().game.specs;
            this.viewModel.selectedOptionIndex = 0;
            this.viewModel.selectedSpec = this.viewModel.specs[0];

            // The maximum number of options is the number of specs plus the extra options
            // (currently just "cancel"). Then minus one to get the max index.
            this.viewModel.maxOptionIndex = (this.viewModel.specs.length + 1) - 1;

            this.viewModel.disabledSpecs = [];
            this.refreshDisabledSpecs();
            this.startPlayerInputTimer();

            this.SFX.playReady();
        }

        protected dialog_closing(event: ng.IAngularEvent, element: ng.IAugmentedJQuery): void {

            this.stopPlayerInputTimer();
            this._cancelGameLaunchedListener();
            this._cancelGameTerminatedListener();
            this._cancelPlayerInputListener();
        }

        protected dialog_closed(event: ng.IAngularEvent, element: ng.IAugmentedJQuery): void {
            /* tslint:disable:no-empty */
            /* tslint:enable:no-empty */
        }

        //#endregion

        //#region Controller Helper Methods

        protected getCaviatDisplayText(spec: Interfaces.GameSpecification): string {

            if (!spec) {
                return "";
            }

            if (spec.layout === "duo-alternating") {
                return "* two player gameplay is not simultaneous (alternating).";
            }

            return "";
        }

        protected getSpecDisplayName(spec: Interfaces.GameSpecification): string {

            let screenDisplay = "[???]";

            if (spec.type === "single-screen") {
                screenDisplay = "this screen";
            }
            else if (spec.type === "dual-screen") {
                screenDisplay = "both screens";
            }

            return this.Utilities.format("{0} players, {1}", spec.players, screenDisplay);
        }

        protected isSpecDisabled(spec: Interfaces.GameSpecification): boolean {

            if (!this.viewModel.disabledSpecs || this.viewModel.disabledSpecs.length === 0) {
                return false;
            }

            return this.viewModel.disabledSpecs.indexOf(spec) !== -1;
        }

        //#endregion

        //#region Events

        private player_inputTimeout(): void {
            let result = new Models.LaunchDialogResultModel();
            result.action = Constants.DialogResults.Cancel;

            this.SFX.playCancel();
            this.close(result);
        }

        private app_gameLaunched(event: ng.IAngularEvent, side: string, game: Interfaces.GameDescriptor, spec: Interfaces.GameSpecification): void {

            if (side !== this.Utilities.side) {
                this.refreshDisabledSpecs();
            }
        }

        private app_gameTerminated(event: ng.IAngularEvent, side: string, game: Interfaces.GameDescriptor, spec: Interfaces.GameSpecification): void {

            if (side !== this.Utilities.side && spec.type === "dual-screen") {

                // If the other side launched a dual screen game, close this dialog without doing anything.

                let result = new Models.LaunchDialogResultModel();
                result.action = Constants.DialogResults.DoNothing;
                result.spec = null;

                this.close(result);
            }
            else if (side !== this.Utilities.side) {
                // If the other side launched a game, we may need to display some specs in the list.
                this.refreshDisabledSpecs();
            }
        }

        private app_playerInput(event: ng.IAngularEvent, input: Interfaces.PlayerInput): void {

            // Only the active player should be able to control the cursor in the dialog.
            if (input.player !== this.getData().activePlayer) {
                return;
            }

            this.stopPlayerInputTimer();
            this.startPlayerInputTimer();

            // Handle the out-of-bounds cases first.
            if (input.input === Enums.Input.Up && this.viewModel.selectedOptionIndex === 0) {
                this.SFX.playCancel();
                return;
            }
            else if (input.input === Enums.Input.Down && this.viewModel.selectedOptionIndex >= this.viewModel.maxOptionIndex) {
                this.SFX.playCancel();
                return;
            }

            let isCancelSelected = this.viewModel.selectedOptionIndex === this.viewModel.maxOptionIndex;

            if (input.input === Enums.Input.Up || input.input === Enums.Input.Down) {
                this.SFX.playCursorMove();

                if (input.input === Enums.Input.Up) {
                    this.viewModel.selectedOptionIndex--;
                }
                else {
                    this.viewModel.selectedOptionIndex++;
                }

                if (this.viewModel.selectedOptionIndex === this.viewModel.maxOptionIndex) {
                    this.viewModel.selectedSpec = null;
                }
                else {
                    this.viewModel.selectedSpec = this.viewModel.specs[this.viewModel.selectedOptionIndex];
                }
            }
            else if (input.input === Enums.Input.Back || input.input === Enums.Input.OK && isCancelSelected) {

                let result = new Models.LaunchDialogResultModel();
                result.action = Constants.DialogResults.Cancel;

                this.SFX.playCancel();
                this.close(result);
            }
            else if (input.input === Enums.Input.OK) {

                let selectedSpec = this.viewModel.specs[this.viewModel.selectedOptionIndex];

                let playable = this.LaunchHelper.canLaunchSpec(selectedSpec);

                if (playable) {
                    let result = new Models.LaunchDialogResultModel();
                    result.action = Constants.DialogResults.OK;
                    result.spec = selectedSpec;

                    this.SFX.playOk();
                    this.close(result);
                }
                else {
                    this.SFX.playError();
                }
            }
        }

        //#endregion

        //#region Private Methods

        private startPlayerInputTimer(): void {
            this.stopPlayerInputTimer();
            this._playerInputTimer = this.$timeout(_.bind(this.player_inputTimeout, this), Constants.PLAYER_IDLE_TIMEOUT);
        }

        private stopPlayerInputTimer(): void {
            this.$timeout.cancel(this._playerInputTimer);
        }

        private refreshDisabledSpecs(): void {

            this.viewModel.disabledSpecs = [];

            if (!this.viewModel.specs || this.viewModel.specs.length === 0) {
                return;
            }

            this.viewModel.specs.forEach((spec: Interfaces.GameSpecification) => {
                if (!this.LaunchHelper.canLaunchSpec(spec)) {
                    this.viewModel.disabledSpecs.push(spec);
                }
            });
        }

        //#endregion
    }
}
