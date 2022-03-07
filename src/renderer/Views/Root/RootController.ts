
namespace JustinCredible.NintendoVsFrontend.Renderer.Controllers {

    export class RootController extends BaseController<ViewModels.RootViewModel> {

        //#region Injection

        public static ID = "RootController";

        public static get $inject(): string[] {
            return [
                "$scope",
                "$rootScope",
                "Utilities",
            ];
        }

        constructor(
            $scope: ng.IScope,
            private $rootScope: ng.IRootScopeService,
            private Utilities: Services.Utilities) {
            super($scope, ViewModels.RootViewModel);
        }

        //#endregion

        //#region BaseController Overrides

        protected view_loaded(): void {
            super.view_loaded();

            this.$rootScope.$on(Constants.EnableAttractMode, _.bind(this.app_enableAttractMode, this));
            this.$rootScope.$on(Constants.DisableAttractMode, _.bind(this.app_disableAttractMode, this));

            this.viewModel.enableAttractMode = false;

            let scalingFactor = this.Utilities.side === "A"
                ? this.Utilities.menuConfig.scalingFactor.screenA
                : this.Utilities.menuConfig.scalingFactor.screenB;

            this.viewModel.mainContainerStyle = {
                "transform": `scale(${scalingFactor})`
            };
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
