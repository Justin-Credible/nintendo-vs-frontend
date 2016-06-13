
namespace JustinCredible.NintendoVsFrontend.Renderer.Controllers {

    export class AttractModeController extends BaseController<ViewModels.AttractModeViewModel> {

        //#region Injection

        public static ID = "AttractModeController";

        public static get $inject(): string[] {
            return [
                "$scope",
                "$rootScope",
                "$interval",
            ];
        }

        constructor(
            $scope: ng.IScope,
            private $rootScope: ng.IRootScopeService,
            private $interval: ng.IIntervalService) {
            super($scope, ViewModels.AttractModeViewModel);
        }

        //#endregion

        private _viewModelNames: string[];
        private _slideCounter: number;
        private _attractModeInterval: ng.IPromise<void>;

        //#region BaseController Overrides

        protected view_loaded(): void {
            super.view_loaded();

            this._viewModelNames = [
                "showSmashBros",
                "showQuestionBlock",
                "showZelda",
                "showGameCube",
            ];

            this.$rootScope.$on(Constants.EnableAttractMode, _.bind(this.app_enableAttractMode, this));
            this.$rootScope.$on(Constants.DisableAttractMode, _.bind(this.app_disableAttractMode, this));
        }

        //#endregion

        //#region Events

        private app_enableAttractMode(event: ng.IAngularEvent, side: string, game: Interfaces.GameDescriptor): void {
            this.startAttractMode();
        }

        private app_disableAttractMode(event: ng.IAngularEvent, side: string): void {
            this.stopAttractMode();
        }

        //#endregion

        //#region Private Helpers

        private startAttractMode(): void {

            this._slideCounter = null;

            this.next();

            this._attractModeInterval = this.$interval(() => {
                this.next();
            }, 15000);
        }

        private stopAttractMode(): void {

            this.$interval.cancel(this._attractModeInterval);

            this.viewModel.showSmashBros = false;
            this.viewModel.showQuestionBlock = false;
            this.viewModel.showZelda = false;
            this.viewModel.showGameCube = false;
        }

        //#endregion

        //#region Private Helpers

        private next(): void {

            if (this._slideCounter === this._viewModelNames.length - 1) {
                this._slideCounter = null;
            }

            let prevSlideCounter: number;

            if (this._slideCounter == null) {
                this._slideCounter = 0;
                prevSlideCounter = this._viewModelNames.length - 1;
            }
            else {
                prevSlideCounter = this._slideCounter;
                this._slideCounter += 1;
            }

            let prevVmName = this._viewModelNames[prevSlideCounter];
            let nextVmName = this._viewModelNames[this._slideCounter];

            this.viewModel[prevVmName] = false;
            this.viewModel[nextVmName] = true;
        }

        //#endregion
    }
}
