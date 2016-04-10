
namespace JustinCredible.NintendoVsFrontend.Renderer.Services {

    /**
     * Helper methods for the user interface.
     */
    export class UIHelper {

        //#region Injection

        public static ID = "UIHelper";

        public static get $inject(): string[] {
            return [
                "$q",
                "ngDialog",
                Utilities.ID,
                SFX.ID,
            ];
        }

        constructor(
            private $q: ng.IQService,
            private ngDialog: angular.dialog.IDialogService,
            private Utilities: Services.Utilities,
            private SFX: Services.SFX) {
        }

        //#endregion

        public showDialog(DialogController: Function, data?: any): ng.IPromise<any> {
            let q = this.$q.defer<any>();

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
                data: data,
                showClose: false,
                closeByEscape: false,
                closeByNavigation: false,
                closeByDocument: false,
                className: "ngdialog-theme-nintendo"
            };

            this.SFX.playReady();

            this.ngDialog.open(options).closePromise.then((result: ng.dialog.IDialogClosePromise) => {
                q.resolve(result.value);
            });

            return q.promise;
        }
    }
}
