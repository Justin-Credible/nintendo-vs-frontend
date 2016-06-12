
namespace JustinCredible.NintendoVsFrontend.Renderer.Controllers {

    export class RootController extends BaseController<ViewModels.RootViewModel> {

        //#region Injection

        public static ID = "RootController";

        public static get $inject(): string[] {
            return [
                "$scope",
                "$rootScope",
            ];
        }

        constructor(
            $scope: ng.IScope,
            private $rootScope: ng.IRootScopeService) {
            super($scope, ViewModels.RootViewModel);
        }

        //#endregion

        //#region BaseController Overrides

        protected view_loaded(): void {
            super.view_loaded();

            this.$rootScope.$on(Constants.EnableAttractMode, _.bind(this.app_enableAttractMode, this));
            this.$rootScope.$on(Constants.DisableAttractMode, _.bind(this.app_disableAttractMode, this));

            this.viewModel.enableAttractMode = false;
        }

        //#endregion

        //#region Events

        private app_enableAttractMode(event: ng.IAngularEvent, side: string, game: Interfaces.GameDescriptor): void {
            this.viewModel.enableAttractMode = true;
        }

        private app_disableAttractMode(event: ng.IAngularEvent, side: string): void {
            this.viewModel.enableAttractMode = false;
        }

        //#endregion
    }
}
