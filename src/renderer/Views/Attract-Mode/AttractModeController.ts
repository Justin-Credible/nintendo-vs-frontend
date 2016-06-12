
namespace JustinCredible.NintendoVsFrontend.Renderer.Controllers {

    export class AttractModeController extends BaseController<ViewModels.EmptyViewModel> {

        //#region Injection

        public static ID = "AttractModeController";

        public static get $inject(): string[] {
            return [
                "$scope",
                "$rootScope",
            ];
        }

        constructor(
            $scope: ng.IScope,
            private $rootScope: ng.IRootScopeService) {
            super($scope, ViewModels.EmptyViewModel);
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
            // TODO
        }

        private app_disableAttractMode(event: ng.IAngularEvent, side: string): void {
            // TODO
        }

        //#endregion
    }
}
