'use strict';

(function() {
    Polymer({
        is: 'file-attachments-tab',
        behaviors: [
            APBehaviors.TableElementsBehavior
        ],
        properties: {
            mainProperty: {
                type: String
            },
            itemModel: {
                type: Object,
                value: function() {
                    return {
                        id: undefined,
                        created: undefined,
                        file: undefined,
                        file_name: undefined,
                        raw: undefined,
                        file_type: undefined,
                        display_name: undefined,
                        type: {},
                    };
                }
            },
            headings: {
                type: Array,
                notify: true,
                value: []
            },
            addDialogTexts: {
                type: Object,
                value: {
                    title: 'Attach File',
                    confirmBtn: 'Attach'
                }
            },
            editDialogTexts: {
                type: Object,
                value: {
                    title: 'Edit Attachment',
                    confirmBtn: 'Edit',
                }
            },
            multiple: {
                type: Boolean,
                value: false
            },
            uploadLabel: {
                type: String,
                value: 'File Attachment'
            },
            readonly: {
                type: Boolean,
                value: false
            },
            fileTypes: {
                type: Array,
                value: function() {
                    return [];
                }
            },
            fileTypeRequired: {
                type: Boolean,
                value: false
            },
            fileTypesLabel: {
                type: String,
                value: 'Document Type'
            },
            allowEdit: {
                type: Boolean,
                value: false
            }
        },
        listeners: {
            'dialog-confirmed': '_addItemFromDialog',
            'delete-confirmed': 'removeItem',
            'dialog-cancelled': '_handleDialogCancel'
        },
        observers: [
            '_filesChange(dataItems.*, fileTypes.*)',
            '_updateHeadings(allowEdit, readonly, fileTypeRequired)',
            'resetDialog(dialogOpened)',
            '_errorHandler(errorObject)',
            'savingError(errorObject)'
        ],

        _handleDialogCancel: function(e, detail) {
            if (this.canBeRemoved) {
                this._openDeleteConfirmation(e, detail);
            }
        },

        _getFileType: function(fileType) {
            if (this.fileTypes && this.fileTypes.length > 0) {
                let type = this.fileTypes.filter(function(type) {
                    return parseInt(type.value, 10) === parseInt(fileType, 10);
                })[0];
                return type || null;
            }
            return null;
        },

        _showAddBtn: function(filesLength, readonly) {
            if (readonly === true) {
                return false;
            }

            if (!this.multiple && filesLength > 0) {
                return false;
            }

            return true;
        },

        _updateHeadings: function(allowEdit, readonly, fileTypeRequired) {
            let showEditButton = allowEdit && (readonly === false);
            let headings = [{
                'size': '100px',
                'name': 'date',
                'label': 'Date Uploaded',
                'path': 'created'
            }, {
                'size': 65,
                'label': 'File Attachment',
                'property': 'file_name',
                'custom': true,
                'doNotHide': true
            }];

            if (showEditButton) {
                headings.push({
                    'size': '45px',
                    'label': 'Edit',
                    'name': 'edit',
                    'align': 'center',
                    'icon': true
                });
            }

            if (fileTypeRequired) {
                headings.splice(1, 0, {
                    'size': 35,
                    'label': 'Document Type',
                    'path': 'display_name'
                });
            }

            this.set('headings', headings);
        },

        _openFileChooser: function() {
            let elem = Polymer.dom(this.root).querySelector('#fileInput');
            if (elem && document.createEvent) {
                let evt = document.createEvent('MouseEvents');
                evt.initEvent('click', true, false);
                elem.dispatchEvent(evt);
            }
        },

        _fileSelected: function(e) {
            if (!e || !e.target) { return false; }

            let files = e.target.files || {};
            let file = files[0];

            if (this._checkAlreadySelected()) {
                return false;
            }

            if (file && file instanceof File) {
                this.set('editedItem.file_name', file.name);
                this.editedItem.raw = file;
                this.editedItem.created = new Date().toISOString();

                return true;
            }
        },

        _setFileType: function(e, detail) {
            if (detail && detail.selectedValues) {
                this.editedItem.type = detail.selectedValues;
                this.editedItem.display_name = detail.selectedValues.display_name;
                this.editedItem.file_type = detail.selectedValues.value;
            }
        },

        _filesChange: function() {
            if (!this.dataItems) { return false; }

            this.dataItems.forEach((file, index) => {
                if (file.file && file.id && !file.file_name) {
                    file.file_name = this._getFilenameFromUrl(file.file);
                }

                if (!file.file_name) {
                    this.splice('dataItems', index, 1);
                    return;
                }

                if (file.file_type !== undefined && !file.display_name) {
                    let type = this._getFileType(file.file_type) || {};
                    file.type = type;
                    file.display_name = type.display_name;
                }
            });

            if (!this.multiple) {
                if (this.dataItems instanceof Array && this.dataItems.length > 1) {
                    this.set('dataItems', [this.dataItems[0]]);
                }
            }
        },

        _getFilenameFromUrl: function(url) {
            if (typeof url !== 'string' || url === '') {
                return;
            }

            return url.split('/').pop();
        },

        _getUploadedFile: function(fileModel) {
            return new Promise((resolve, reject) => {
                let reader = new FileReader();
                let uploadedFile = {
                    file_name: fileModel.file_name,
                    file_type: fileModel.file_type
                };

                try {
                    reader.readAsDataURL(fileModel.raw);
                } catch (error) {
                    reject(error);
                }

                reader.onload = function() {
                    uploadedFile.file = reader.result;
                    resolve(uploadedFile);
                };

                reader.onerror = function(error) {
                    reject(error);
                };
            });
        },

        getFiles: function() {
            return new Promise((resolve, reject) => {
                let files = [];
                let changedFiles = [];

                if (this.saveWithButton) {
                    files = this.dataItems || [];
                } else if (this.editedItem.file || this.editedItem.raw) {
                    files.push(this.editedItem);
                }

                let promises = files.map((fileModel) => {
                    if (fileModel && fileModel.raw) {
                        return this._getUploadedFile(fileModel);
                    } else if (!this.saveWithButton) {
                        changedFiles.push({
                            id: fileModel.id,
                            file_type: fileModel.file_type,
                            hyperlink: fileModel.file,
                            _delete: fileModel._delete
                        });
                    }
                });

                promises = promises.filter((promise) => {
                    return promise !== undefined;
                });

                Promise.all(promises)
                    .then((uploadedFiles) => {
                        uploadedFiles = uploadedFiles.concat(changedFiles);
                        if (!uploadedFiles.length) { uploadedFiles = null; }
                        resolve(uploadedFiles);
                    })
                    .catch((error) => {
                        reject(error);
                    });
            });
        },

        _checkAlreadySelected: function() {
            if (!this.dataItems) {return false;}

            let alreadySelectedIndex = this.dataItems.findIndex((file) => {
                return file.file_name === this.editedItem.file_name;
            });

            if (alreadySelectedIndex !== -1) {
                this.set('errors.file', 'File already selected');
                return true;
            }

            this.set('errors.file', '');
            return false;
        },

        validate: function() {
            let dropdown = Polymer.dom(this.root).querySelector('#fileType');
            let editedItem = this.editedItem;
            let valid = true;

            if (this.fileTypeRequired && (!this.fileTypes || !this.fileTypes.length)) {
                this.set('errors.file_type', 'File types are not defined');
                valid = false;
            } else {
                this.set('errors.file_type', '');
            }

            if (this.fileTypeRequired && !dropdown.validate()) {
                this.set('errors.file_type', 'This field is required');
                valid = false;
            }

            if (!this.canBeRemoved && this._checkAlreadySelected()) {
                valid = false;
            }

            if (!this.canBeRemoved && (!editedItem.file_name || !editedItem.raw)) {
                this.set('errors.file', 'File is not selected');
                valid = false;
            }

            return valid;
        },

        _errorHandler: function(errorData) {
            let mainProperty = this.mainProperty;
            this.requestInProcess = false;
            if (!errorData || !errorData[mainProperty]) { return; }
            let refactoredData = this.dialogOpened ? this.refactorErrorObject(errorData[mainProperty])[0] : this.refactorErrorObject(errorData[mainProperty]);
            if (typeof refactoredData === 'object') {
                this.set('errors', refactoredData);
            }
        },

        savingError: function(errorObj) {
            let mainProperty = this.mainProperty;
            if (this.requestInProcess) {
                this.requestInProcess = false;
                this.fire('toast', {text: 'Can not save data'});
            }
            if (!errorObj || !errorObj[mainProperty]) { return; }

            let nonField = this.checkNonField(errorObj[mainProperty]);
            if (typeof errorObj[mainProperty] === 'string') {
                this.fire('toast', {text: `Attachments: ${errorObj[mainProperty]}`});
            }
            if (nonField) {
                this.fire('toast', {text: `Attachments: ${nonField}`});
            }
        }
    });
})();
