'use strict';

Polymer({
    is: 'audit-report-page-main',
    properties: {
        engagement: {
            type: Object,
            notify: true
        }
    },
    validate: function() {
        let assignTabValid = Polymer.dom(this.root).querySelector('#assignEngagement').validate();

        return assignTabValid;
    },
    getAssignVisitData: function() {
        return this.$.assignEngagement.getAssignVisitData();
    },
    getFinancialFindingsData: function() {
        return this.$.financialFindings.getTabData();
    },
    getFindingsSummaryData: function() {
        return this.$.findingsSummary.getTabData();
    },
    getAssessmentOfControlsData: function() {
        return this.$.assessmentOfControls.getTabData();
    },
    getKeyInternalWeaknessData: function() {
        return this.$.keyInternalControlsWeaknesses.getKeyInternalWeaknessData();
    }
});
