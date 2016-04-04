
namespace JustinCredible.NintendoVsFrontend.Renderer.Services {

    /**
     * Helper methods for the user interface.
     */
    export class UIHelper {

        //#region Injection

        public static ID = "UIHelper";

        public static get $inject(): string[] {
            return [
                "ngDialog",
                Utilities.ID,
            ];
        }

        constructor(
            private ngDialog: angular.dialog.IDialogService,
            private Utilities: Services.Utilities) {
        }

        //#endregion

        public showDialog(DialogController: Function, data?: any): ng.dialog.IDialogOpenResult {

            if (!this.Utilities.derivesFrom(DialogController, Controllers.BaseDialogController)) {
                throw new Error("The DialogController passed was not a class instance extending BaseDialogController.");
            }

            let templatePath = DialogController["TemplatePath"];

            if (typeof(templatePath) !== "string") {
                throw new Error("The DialogController passed did not have a string TemplatePath static property.");
            }

            let options: ng.dialog.IDialogOpenOptions = {
                template: templatePath,
                controller: DialogController,
                data: data
            };

            return this.ngDialog.open(options);
        }
    }
}
