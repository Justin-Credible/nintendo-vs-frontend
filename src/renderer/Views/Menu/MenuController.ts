
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

            this.viewModel.title = "Nintendo VS HELLO WORLD";
        }

        //#endregion

        //#region BaseController Events

        // protected view_beforeEnter(event?: ng.IAngularEvent, eventArgs?: Ionic.IViewEventArguments): void {
        //     super.view_beforeEnter(event, eventArgs);

        //     // Set the category number into the view model using the value as provided
        //     // in the view route (via the $stateParameters).
        //     this.viewModel.categoryNumber = this.$stateParams.categoryNumber;
        // }

        //#endregion
    }
}
