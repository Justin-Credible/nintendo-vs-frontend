
namespace JustinCredible.NintendoVsFrontend.Renderer.Controllers {

    export class ToastDialogController extends BaseDialogController<ViewModels.ToastDialogViewModel, Models.ToastDialogModel, ViewModels.EmptyViewModel> {

        //#region Injection

        public static ID = "ToastDialogController";
        public static TemplatePath = "Views/Toast-Dialog/Toast-Dialog.html";

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

            let model = this.getData();

            this.viewModel.title = model.title;
            this.viewModel.message = model.message;

            if (!model.type) {
                model.type = "info";
            }

            switch (model.type) {
                case "info":
                    this.viewModel.imageUrl = "img/question.png";
                    break;
                case "error":
                    this.viewModel.imageUrl = "img/chomp.png";
                    break;
                default:
                    this.viewModel.imageUrl = "img/question.png";
                    break;
            }
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
