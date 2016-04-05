
namespace JustinCredible.NintendoVsFrontend.Renderer.Controllers {

    export class LaunchDialogController extends BaseDialogController<ViewModels.EmptyViewModel, ViewModels.EmptyViewModel, Models.LaunchDialogResultModel> {

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
            private Utilities: Services.Utilities) {
            super($scope, ViewModels.EmptyViewModel);
        }

        //#endregion

        //#region BaseDialogController Events

        protected dialog_opened(): void {
            this.viewModel["something"] = "123";
        }

        protected dialog_closing(): void {
        }

        protected dialog_closed(): void {
        }

        //#endregion
    }
}
