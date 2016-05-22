
namespace JustinCredible.NintendoVsFrontend.Renderer.Controllers {

    export class PleaseWaitDialogController extends BaseDialogController<ViewModels.EmptyViewModel, ViewModels.EmptyViewModel, ViewModels.EmptyViewModel> {

        //#region Injection

        public static ID = "PleaseWaitDialogController";
        public static TemplatePath = "Views/Please-Wait-Dialog/Please-Wait-Dialog.html";

        public static get $inject(): string[] {
            return [
                "$scope",
            ];
        }

        constructor(
            $scope: ng.IScope) {
            super($scope, ViewModels.EmptyViewModel);
        }

        //#endregion

        //#region BaseDialogController Events

        protected dialog_opened(): void {
            /* tslint:disable:no-empty */
            /* tslint:enable:no-empty */
        }

        protected dialog_closing(): void {
            /* tslint:disable:no-empty */
            /* tslint:enable:no-empty */
        }

        protected dialog_closed(): void {
            /* tslint:disable:no-empty */
            /* tslint:enable:no-empty */
        }

        //#endregion

        //#region Controller Helper Methods

        //#endregion

        //#region Events

        //#endregion
    }
}
