
namespace JustinCredible.NintendoVsFrontend.Renderer.Controllers {

    export class MenuController extends BaseController<ViewModels.MenuViewModel> {

        //#region Injection

        public static ID = "MenuController";

        public static get $inject(): string[] {
            return [
                "$scope",
                Services.Utilities.ID
            ];
        }

        constructor(
            $scope: ng.IScope,
            private Utilities: Services.Utilities) {
            super($scope, ViewModels.MenuViewModel);

            this.viewModel.title = "Nintendo VS";
        }

        //#endregion

        //#region BaseController Events

        protected view_loaded(): void {
            super.view_loaded();
        }

        //#endregion
    }
}
