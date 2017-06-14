'use strict';

Polymer({
    is: 'primary-risk-element',
    behaviors: [
        APBehaviors.StaticDataController,
        APBehaviors.PermissionController,
        APBehaviors.ErrorHandlerBehavior
    ],
    properties: {
        primaryArea: {
            type: Object,
            value: function() {
                return {};
            }
        }
    },
    observers: [
        '_setValues(riskData, riskOptions)',
        'updateStyles(basePermissionPath)',
        '_errorHandler(errorObject.test_subject_areas)'
    ],
    ready: function() {
        this.riskOptions = this.getData('riskOptions');
    },
    _resetFieldError: function(event) {
        event.target.invalid = false;
    },

    _setValues: function(data) {
        if (!data) {
            return;
        }
        this.originalData = _.cloneDeep(data);

        if (!this.riskData.blueprints[0].value) {
            return;
        }

        let extra = {comments: ''};
        if (_.isJSONObj(this.riskData.blueprints[0].extra)) {
            extra = JSON.parse(this.riskData.blueprints[0].extra);
        }

        this.set('primaryArea.value', this.riskOptions[this.riskData.blueprints[0].value]);
        this.set('primaryArea.extra', extra);
    },
    validate: function(forSave) {
        if (this.primaryArea.extra && !this.primaryArea.value) {
            this.set('errors', {children: [{blueprints: [{value: 'Please, select Risk Assessment'}]}]});
            return false;
        }
        if (!this.basePermissionPath || forSave) { return true; }
        let required = this.isRequired(`${this.basePermissionPath}.test_subject_areas`);
        if (!required) { return true; }

        let riskValid = this.$.riskAssessmentInput.validate(),
            commentsValid = this.$.briefJustification.validate();

        let errors = {
            children: [{
                blueprints: [{
                    value: !riskValid ? 'Please, select Risk Assessment' : false,
                    extra: !commentsValid ? 'Please, enter Brief Justification' : false
                }]
            }]
        };
        this.set('errors', errors);

        return riskValid && commentsValid;
    },
    getRiskData: function() {
        if (!this.primaryArea.value) {
            return null;
        }
        if (this.primaryArea.value.value === this.originalData.blueprints[0].value &&
            JSON.stringify(this.primaryArea.extra) === this.originalData.blueprints[0].extra) {
            return null;
        }

        let blueprint = {
            id: this.riskData.blueprints[0].id,
            value: this.primaryArea.value.value,
            extra: JSON.stringify(this.primaryArea.extra || '')
        };

        return {
            id: this.riskData.id,
            blueprints: [blueprint]
        };
    },
    isReadOnly: function(path) {
        if (!path) {
            return true;
        }

        let readOnly = this.isReadonly(`${path}.test_subject_areas`);
        if (readOnly === null) {
            readOnly = true;
        }

        return readOnly;
    },
    _errorHandler: function(errorData) {
        if (!errorData || this.dialogOpened) { return; }
        this.set('errors', this.refactorErrorObject(errorData));
    }
});
