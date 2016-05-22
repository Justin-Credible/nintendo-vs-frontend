
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

        public showAndGetDialogInstance(DialogController: Function, data?: any): angular.dialog.IDialogOpenResult {

            if (!this.Utilities.derivesFrom(DialogController, Controllers.BaseDialogController)) {
                throw new Error("The DialogController passed was not a class instance extending BaseDialogController.");
            }

            /* tslint:disable:no-string-literal */
            let templatePath = DialogController["TemplatePath"];
            /* tslint:enable:no-string-literal */

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

            return this.ngDialog.open(options);
        }

        public showDialog(DialogController: Function, data?: any): ng.IPromise<any> {
            let q = this.$q.defer<any>();

            let instance = this.showAndGetDialogInstance(DialogController, data);

            instance.closePromise.then((result: ng.dialog.IDialogClosePromise) => {
                q.resolve(result.value);
            });

            return q.promise;
        }

        private _pleaseWaitDialog: angular.dialog.IDialogOpenResult;

        public showPleaseWait(): void {

            if (this._pleaseWaitDialog) {
                return;
            }

            this._pleaseWaitDialog = this.showAndGetDialogInstance(Controllers.PleaseWaitDialogController);
        }

        public hidePleaseWait(): void {

            if (this._pleaseWaitDialog) {
                this._pleaseWaitDialog.close();
                this._pleaseWaitDialog = null;
            }
        }
    }
}
