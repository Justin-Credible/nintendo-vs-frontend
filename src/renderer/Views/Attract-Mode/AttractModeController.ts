
namespace JustinCredible.NintendoVsFrontend.Renderer.Controllers {

    export class AttractModeController extends BaseController<ViewModels.AttractModeViewModel> {

        //#region Injection

        public static ID = "AttractModeController";

        public static get $inject(): string[] {
            return [
                "$scope",
                "$rootScope",
                "$timeout",
            ];
        }

        constructor(
            $scope: ng.IScope,
            private $rootScope: ng.IRootScopeService,
            private $timeout: ng.ITimeoutService) {
            super($scope, ViewModels.AttractModeViewModel);
        }

        //#endregion

        //#region BaseController Overrides

        protected view_loaded(): void {
            super.view_loaded();

            this.$rootScope.$on(Constants.EnableAttractMode, _.bind(this.app_enableAttractMode, this));
            this.$rootScope.$on(Constants.DisableAttractMode, _.bind(this.app_disableAttractMode, this));
        }

        //#endregion

        //#region Events

        private app_enableAttractMode(event: ng.IAngularEvent, side: string, game: Interfaces.GameDescriptor): void {
            this.startAttractMode();
        }

        private app_disableAttractMode(event: ng.IAngularEvent, side: string): void {
            this.viewModel.showSmashBros = false;
            this.viewModel.showQuestionBlock = false;
            this.viewModel.showZelda = false;
            this.viewModel.showGameCube = false;
        }

        //#endregion

        //#region Private Helpers

        private startAttractMode(): void {

            let delay = 15000;

            this.viewModel.showSmashBros = true;

            this.$timeout(() => {
                this.viewModel.showSmashBros = false;
                this.viewModel.showZelda = true;

                this.$timeout(() => {

                    this.viewModel.showZelda = false;
                    this.viewModel.showQuestionBlock = true;

                    this.$timeout(() => {

                        this.viewModel.showQuestionBlock = false;
                        this.viewModel.showGameCube = true;

                        this.$timeout(() => {

                            this.viewModel.showGameCube = false;
                            this.startAttractMode();

                        }, delay);

                    }, delay);

                }, delay);

            }, delay);
        }

        //#endregion
    }
}
