/*
 * Copyright (c) 2013-2014 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */

/*
 * This is the nPod override for the survey panel that is specific to the donor wizard.
 */
Ext4.define('LABKEY.ext4.npod.DonorWizard', {

    extend : 'LABKEY.ext4.BaseSurveyPanel',

    constructor : function(config){

        Ext4.QuickTips.init();
        Ext4.apply(Ext4.QuickTips.getQuickTip(), {
            dismissDelay: 30000,
            autoHide: false
        });

        Ext4.apply(config, {
            border: true,
            width: 870,
            minHeight: 25,
            layout: {
                type: 'hbox',
                pack: 'start',
                align: 'stretchmax'
            },
            trackResetOnLoad: true,
            items: [],
            itemId: 'SampleRequestFormPanel', // used by sidebar section click function and AssociatedStudyQuestion
            surveyLayout: 'card',
            metadata: null,
            sections: [],
            validStatus: {},
            changeHandlers: {},
            listeners: {
                scope: this,
                afterrender: function() {
                    if (this.sections && this.sections.length == 0)
                        this.setLoading(true);
                }
            },
            saveSubmitMode: 'save/cancel'
        });

        this.callParent([config]);

        if (this.canEdit)
        {
            // check dirty state on page navigation
            window.onbeforeunload = LABKEY.beforeunload(this.isSurveyDirty, this);
        }
    },

    initComponent : function() {

        this.getDonorData();

        this.callParent();
    },

    getDonorData : function() {
        this.sectionDataMap = {};           // Keep section specific data
        this.getWizardSections();
    },

    getWizardSections : function() {
        // using the survey.SurveyDesigns table to store the question metadata
        if (this.surveyDesignId)
        {
            Ext4.Ajax.request({
                url     : LABKEY.ActionURL.buildURL('survey', 'getSurveyTemplate.api'),
                method  : 'POST',
                jsonData: {rowId : this.surveyDesignId, stringifyMetadata : true},
                success : function(resp){
                    var o = Ext4.decode(resp.responseText);

                    if (o.success)
                    {
                        this.metadata = Ext4.JSON.decode(o.survey.metadata);
                        this.generateSurveySections(this.metadata);
                    }
                    else
                        this.onFailure(resp);
                },
                failure : this.onFailure,
                scope   : this
            });
        }
        else
        {
            this.onFailure({}, "Could not find a survey design with id: " + this.surveyDesignId + ". Please contact an administrator to get this resolved.", false);
        }
    },

    generateSurveySections : function(surveyConfig) {

        this.callParent([surveyConfig]);

        this.addSurveyEndPanel();

        this.configureSurveyLayout(this.metadata);

        this.configureFieldListeners();

        if (this.donorId)
        {
            for (var secIx = 0; secIx < surveyConfig.survey.sections.length; secIx += 1)
            {
                this.populateSurveySection(surveyConfig.survey.sections[secIx]);
            }
        }

        this.updateSaveInfo(this.donorSaveInfo);
        this.clearLoadingMask();
    },

    generateQuestion: function(question, title) {
        // we need full date/time
        if (question.extConfig && question.extConfig.xtype == 'datefield' && !question.format)
        {
            question.format = 'Y-m-d H:i';
            question.extConfig.altFormats = 'Y-m-d|Y-m-d G:i:s|Y-m-d G:i|Y-m-d H:i:s|Y-m-d H:i|';
        }

        // Add number of decimal for number field types.  05/27/15 sfuertez
        if (question.extConfig && question.extConfig.xtype == 'numberfield' && question.extConfig.decimalPrecision != 4)
        {
            question.extConfig.decimalPrecision = 4;
        }

        return this.callParent([question, title]);
    },

    populateSurveySection : function(section) {
        if (section.queryName)
        {
            this.sectionDataMap[this.makeSectionQueryKey(section)] = {};        // For section-specific data
            if (this.donorId)
            {
                // query the DB for the values for the given sample request RowId
                var columnNames = '';
                var sep = '';
                for (var quesIx = 0; quesIx < section.questions.length; quesIx += 1)
                {
                    var question = section.questions[quesIx];
                    columnNames = columnNames + sep + question.name;
                    sep = ",";

                    if (question.disableForEdit)
                    {
                        var element = this.findSurveyElement(question.extConfig.name);
                        element.disable();
                    }
                }
                for (var keyIx = 0; keyIx < section.primaryKeys.length; keyIx += 1)
                {
                    columnNames = columnNames + sep + section.primaryKeys[keyIx];
                    sep = ",";
                }

                var filters = [LABKEY.Filter.create(this.subjectColumnName, this.donorId)];
                if (section.filters)
                {
                    for (var filIx = 0; filIx < section.filters.length; filIx += 1)
                    {
                        var filter = section.filters[filIx];
                        filters[filIx + 1] = LABKEY.Filter.create(filter.fieldName, filter.fieldValue);
                    }
                }

                this.getEl().mask("Populating section...");

                // Configure view name based on query for SpecimenDetail - sfuertez
                var selectViewName = null;
               if(section.queryName === 'specimendetail'){
                   var selectViewName = 'DonorWizardView';
               }

                LABKEY.Query.selectRows({
                    schemaName: 'study',
                    queryName: section.queryName,
                    columns: columnNames,
                    filterArray: filters,
                    viewName: selectViewName,
                    // sort: 'RowId',          /* Remove query sort - sfuertez 5/6/15 */
                    success: function(data) {
                        var sectionData = this.sectionDataMap[this.makeSectionQueryKey(section)];
                        sectionData.primaryKeyValues = {};
                        var questionCount = section.layoutHorizontal ? section.numColumns : section.questions.length;
                        var questionOffset = section.hasHeadingRow ? section.numColumns : 0;
                        if (data.rows && data.rows.length > 0)
                        {
                            // Make a meatadata map
                            var metadataMap = {};
                            if (data.metaData && data.metaData.fields)
                            {
                                for (var metaIx = 0; metaIx < data.metaData.fields.length; metaIx += 1)
                                {
                                    metadataMap[data.metaData.fields[metaIx].name] = data.metaData.fields[metaIx];
                                }
                            }
                            var valuesToSet = {};
                            var sectionPanel = this.findSurveyElement(section.name);
                            if (section.numColumns)
                                section.numRows = data.rows.length;             // remember for Save, if we have columns
                            for (var rowIx = 0; rowIx < data.rows.length; rowIx += 1)
                            {
                                var suffix = this.getRowSuffix(rowIx);

                                // save the raw row and process the entries so we can initialize the form
                                var rowMap = data.rows[rowIx];
                                Ext4.Object.each(rowMap, function(key, value) {
                                    // make sure to parse dates accordingly, as they come in as strings but datefield.setValue doesn't like that
                                    var dateValue = this.getValueIfDate(value);
                                    if (dateValue)
                                        rowMap[key] = dateValue;
                                }, this);

                                if (rowIx > 0)
                                {
                                    sectionPanel.add(this.createDeleteCheckbox(section, rowIx));
                                }

                                for (var quesIx = 0; quesIx < questionCount; quesIx += 1)
                                {
                                    var question = section.questions[quesIx + questionOffset];
                                    if (!question.subSection)
                                    {
                                        if (rowIx > 0)
                                        {
                                            // add control
                                            var control = this.findSurveyElement(question.extConfig.name);
                                            var newControl = control.cloneConfig(
                                                    {name : question.extConfig.name + suffix,
                                                     itemId : this.makeItemId(question.extConfig.name + suffix)});

                                                sectionPanel.add(newControl);
                                        }
                                        else // rowIx == 0
                                        {
                                            var metadata = metadataMap[question.name];
                                            if (metadata)
                                            {
                                                var control = this.findSurveyElement(question.extConfig.name);
                                                // Update date format if it's a date
                                                if ("date" == metadata.jsonType && metadata.extFormat)
                                                    control.format = metadata.extFormat;
                                                // Update keyField if it's a lookup
                                                if (metadata.lookup && metadata.lookup.keyColumn)
                                                {
                                                    if (undefined !== control.keyField)
                                                        control.keyField = metadata.lookup.keyColumn;
                                                    if (undefined !== control.valueField)
                                                        control.valueField = metadata.lookup.keyColumn;
                                                    if (metadata.lookup.schemaName && control.store && control.store.proxy &&
                                                            control.store.proxy.extraParams && undefined !== control.store.proxy.extraParams.schemaName &&
                                                            control.store.proxy.extraParams.schemaName != metadata.lookup.schemaName)
                                                    {
                                                        control.store.proxy.extraParams.schemaName = metadata.lookup.schemaName;
                                                        control.store.load();
                                                    }
                                                }
                                            }

                                        }
                                        if (undefined === question.extConfig.submitValue || question.extConfig.submitValue)
                                            valuesToSet[question.extConfig.name + suffix] = rowMap[question.name];
                                    }
                                }

                                // Save primary key values
                                for (var keyIx = 0; keyIx < section.primaryKeys.length; keyIx += 1)
                                {
                                    sectionData.primaryKeyValues[section.primaryKeys[keyIx] + suffix] = rowMap[section.primaryKeys[keyIx]];
                                }
                            }
                            this.setValues(this.getForm(), valuesToSet);
                        }
                        else
                        {
                            this.hideSampleSeciton(section);
                        }
                        this.getEl().unmask();
                    },
                    failure : this.onFailure,
                    scope   : this
                });
            }
            else
            {
                this.hideSampleSeciton(section);
            }
        }

    },

    hideSampleSeciton: function(section)
    {
        // If this is a Sample section and there are no rows, hide the controls
        if (section.subSection && section.queryName == "specimendetail")
        {
            for (var quesIx = 0; quesIx < section.questions.length; quesIx += 1)
            {
                var question = section.questions[quesIx];
                if (!question.subSection)
                {
                    var control = this.findSurveyElement(question.extConfig.name);
                    control.setVisible(false);
                }
            }

            var sectionPanel = this.findSurveyElement(section.name);
            var msg = {xtype:'displayfield', value: Ext.DomHelper.markup({tag:'div', html: "There are no samples of this type."})};
            sectionPanel.add(msg);

            var deleteHeading = this.findSurveyElementByName(section.name + '-delete-heading0');
            if (deleteHeading)
                deleteHeading.setVisible(false);
            var deleteCheckbox = this.findSurveyElementByName(section.name + '-delete-checkbox1');
            if (deleteCheckbox)
                deleteCheckbox.setVisible(false);
        }
    },

    populateSubSection: function(subSectionPath) {
        var pathArray = subSectionPath.split('/');
        // First name in path must be a section title; subsequent ones are subSection names
        var sections = this.metadata.survey.sections;
        var section;
        for (var secIx = 0; secIx < sections.length; secIx += 1)
        {
            if (sections[secIx].title.toLowerCase() == pathArray[0].toLowerCase())
            {
                section = sections[secIx];
                break;
            }
        }

        if (section)
        {
            for (var pathIx = 1; pathIx < pathArray.length; pathIx += 1)
            {
                var questions = section.questions;
                for (var quesIx = 0; quesIx < questions.length; quesIx += 1)
                {
                    if (questions[quesIx].name && questions[quesIx].name.toLowerCase() == pathArray[pathIx].toLowerCase())
                    {
                        section = questions[quesIx];
                        break;
                    }
                }
            }

            // We may have found the main subSection, which contains the expanded subSection that needs to get directly populated
            if (section.queryName && !section.dontPopulate)
            {
                if (!section.populated)
                {
                    this.populateSurveySection(section);
                    section.populated = true;
                }
            }
            else
            {
                var mainSectionName = pathArray[pathArray.length - 1].toLowerCase();
                var splitName = mainSectionName.split('-', 1);
                var expandedSectionName;
                if (splitName.length > 0)
                {
                    expandedSectionName = splitName[0] + "-subsection";
                }

                var expandedSection = expandedSectionName ? this.findSubSection(section, expandedSectionName) : null;
                if (expandedSection)
                {
                    if (!expandedSection.populated)
                    {
                        this.populateSurveySection(expandedSection);
                        expandedSection.populated = true;
                    }
                }
            }
        }
    },

    addSurveyEndPanel : function() {
        this.donorSaveInfo = Ext4.create('Ext.container.Container', {
            hideLabel: true,
            width: 250,
            style: "text-align: center;"
        });

        this.callParent([this.donorSaveInfo]);

    },

    updateStep : function(step) {
        this.callParent([step]);
        this.updateSaveInfo(this.donorSaveInfo);
    },

    // override of BaseSurveyPanel
    saveSurvey : function(btn, evt, toSubmit, successUrl, idParamName) {

        // get the dirty form values which are also valid and to be submitted
        this.submitValues = this.getFormDirtyValues();

        // check to see if there is anything to be saved
        var submitValuesLength = 0;
        for (var key in this.submitValues)
            submitValuesLength += 1;
        if (!this.isSurveyDirty() || 0 == submitValuesLength)
        {
            this.leavePage();
            return;
        }

        // Propagate any changes that are field dependencies
        var fieldDependency = this.metadata.survey.fieldDependency;
        if (fieldDependency)
        {
            Ext4.Object.each(fieldDependency, function(key, dependents) {
                if (this.submitValues[key])
                {
                    for (var depIx = 0; depIx < dependents.length; depIx += 1)
                        this.submitValues[dependents[depIx]] = this.submitValues[key];
                }
            }, this);
        }

        this.getEl().mask("Saving donor information...");
        var saveConfig = {
            commands : [],
            success: function(data) {
                this.getEl().unmask();
                this.surveySaved = true;        // don't need to check for dirty fields when leaving
                this.leavePage();
            },
            failure : this.onFailure,
            scope   : this
        };

        var commandIndex = 0;
        for (var secIx = 0; secIx < this.metadata.survey.sections.length; secIx += 1)
        {
            commandIndex = this.addSaveSectionConfig(saveConfig, this.metadata.survey.sections[secIx], commandIndex);
        }

        LABKEY.Query.saveRows(saveConfig);

    },

    addSaveSectionConfig: function (saveConfig, section, commandIndex, sibling) {

        if (!section.questions || section.questions.length == 0)
            return;

        var rows = [];
        var command = section.saveAction ?
                section.saveAction :
                this.donorId ?
                        'update' :
                        'insert';

        // Go thru any questions that are subsections
        for (var quesIx = 0; quesIx < section.questions.length; quesIx += 1)
        {
            var question = section.questions[quesIx];
            if (question.subSection)
            {
                var sibling;
                if (question.siblingName)
                {
                    for (var sibIx = 0; sibIx < section.questions.length; sibIx += 1)
                        if (section.questions[sibIx].name == question.siblingName)
                        {
                            sibling = section.questions[sibIx];
                            break;
                        }
                }
                commandIndex = this.addSaveSectionConfig(saveConfig, question, commandIndex, sibling);
            }
        }

        if (undefined == section.numColumns)
        {
            // If there are no columns, everything is one row for SaveRows
            var row = null;
            for (var quesIx = 0; quesIx < section.questions.length; quesIx += 1)
            {
                var question = section.questions[quesIx];
                if (!question.subSection)
                {
                    row = this.updateRowIfNeeded(row, question, question.extConfig.name, section)
                }
            }
            if (row)
            {
                if ('update' == command)
                {
                    // Include all primary keys in values to submit for Edit case
                    this.setPrimaryKeyValues(section, row, rowIx);
                }
                rows[rows.length] = row;
            }
        }
        else
        {
            // For multiple rows, we have to consider the question controls as a 2-d array and make a row array for saving
            // There is only 1 row of section.questions (not counting header row), but we've added controls for each question for each row
            var numColumns = section.numColumns ? section.numColumns : 1;
            var offset = section.hasHeadingRow ? section.numColumns : 0;
            var numRows;
            if (section.numRows)
            {
                numRows = section.numRows;      // does not include header row
            }
            else
            {
                numRows = (section.questions.length / numColumns) - (section.hasHeadingRow ? 1 : 0);
            }
            for (var rowIx = 0; rowIx < numRows; rowIx += 1)
            {
                this.addSaveSectionConfigRow(saveConfig, section, command, numColumns, offset, rows, rowIx, commandIndex, sibling);
            }
        }

        if (rows.length > 0)
        {
            if ('insert' == command && 'specimendetail' == section.queryName)
            {
                this.fillRequiredSpecimenDetailFields(section, rows);
            }
            else if ('update' == command && 'specimendetail' == section.queryName)
            {
                this.fillInSequenceNumForUpdate(section, rows);
            }

            saveConfig.commands[commandIndex++] = {
                schemaName: 'study',
                queryName: section.queryName,
                command: command,
                rows: rows
            };
        }
        return commandIndex;
    },

    addSaveSectionConfigRow: function(saveConfig, section, command, numColumns, offset, rows, rowIx, commandIndex, sibling) {
        var row = null;
        for (var colIx = 0; colIx < numColumns; colIx += 1)
        {
            // There may be more rows in numRows than there are questions to match, because of adding rows from the data
            // We don't consider rowIx when looking at the questions, only for the data
            var question = section.questions[colIx + offset];
            if (!question.subSection)
            {
                var suffix = this.getRowSuffix(rowIx);
                row = this.updateRowIfNeeded(row, question, question.extConfig.name + suffix, section)
            }
        }
        if (row)
        {
            if ('update' == command)
            {
                // Include all primary keys in values to submit for Edit case
                this.setPrimaryKeyValues(section, row, rowIx);
                rows[rows.length] = row;
            }
            else    // insert
            {
                this.generateAdditionalRows(section, rows, row, sibling);
            }
        }
    },

    updateRowIfNeeded: function(row, question, controlName, section)
    {
        if (undefined !== this.submitValues[controlName])    // we want value or null
        {
            if (!row)
                row = {};
            var fieldName = question.name;
            if (section.queryName && section.queryName.toLowerCase() == "specimendetail")
                fieldName = this.mapFieldName(question.name);
            row[fieldName] = this.submitValues[controlName];
            if (question.extConfig.xtype == "checkbox" && null == row[fieldName])
                row[fieldName] = false;         // map null for checkbox to false
        }
        return row;
    },

    mapFieldName: function(name)
    {
        // TODO: this is hack so we don't have to change the server side (dave, 1/27/14)
        // Do the mapping that EditableSpecimenImporter will do to prevent duplicates the the resulting rowMap
        if (name.toLowerCase() == "participantid") name = "ptid";
        else if (name.toLowerCase() == "primarytype") name = "primarytypeid";
        else if (name.toLowerCase() == "additivetype") name = "additivetypeid";
        else if (name.toLowerCase() == "derivativetype") name = "derivativetypeid";
        else if (name.toLowerCase() == "derivativetype2") name = "derivativetypeid2";
        else if (name.toLowerCase() == "sequencenum") name = "visitvalue";
        else if (name.toLowerCase() == "sitename") name = "labid";
        else if (name.toLowerCase() == "clinic") name = "originatinglocationid";
        else if (name.toLowerCase() == "latestdeviationcode1") name = "deviationcode1";
        else if (name.toLowerCase() == "latestdeviationcode2") name = "deviationcode2";
        else if (name.toLowerCase() == "latestdeviationcode3") name = "deviationcode3";
        else if (name.toLowerCase() == "latestintegrity") name = "integrity";
        else if (name.toLowerCase() == "latestcomments") name = "comments";
        else if (name.toLowerCase() == "latestqualitycomments") name = "qualitycomments";
        else if (name.toLowerCase() == "latestyield") name = "yield";
        else if (name.toLowerCase() == "latestratio") name = "ratio";
        else if (name.toLowerCase() == "latestconcentration") name = "concentration";
        else if (name.toLowerCase() == "firstprocessedbyinitials") name = "processedbyinitials";
        return name;
    },

    setPrimaryKeyValues: function(section, row, rowIndex) {
        var suffix = this.getRowSuffix(rowIndex);
        for (var keyIx = 0; keyIx < section.primaryKeys.length; keyIx += 1)
        {
            var key = section.primaryKeys[keyIx];
            if (!row[key])
            {
                row[key] = this.sectionDataMap[this.makeSectionQueryKey(section)].primaryKeyValues[key + suffix];
            }
        }
    },

    getRowSuffix: function(rowIndex) {
        return (rowIndex > 0) ? "-" + rowIndex.toString() : "";
    },

    generateAdditionalRows: function(section, rows, row, sibling) {
        // Generate additional rows based on # Blocks column and Size column
        var sizeIndicator = 0;
        var numBlocks = 1;
        if (row['Size'])
        {
            // Size specified; should be 0, 1 or 2
            sizeIndicator = row['Size'];
            delete row['Size'];
        }

        var collapseName = this.metadata.survey.customInfo.collapseColumnName;
        if (row[collapseName])
        {
            numBlocks = (typeof row[collapseName] == 'string') ? parseInt(row[collapseName]) : row[collapseName];
            delete row[collapseName];
        }

        // Check existing samples for block numbers from sibling section
        var blockOffset = 0;
        if (sibling)
        {
            var collapseName = this.metadata.survey.customInfo.collapseColumnName.toLowerCase();
            var generatorDependentColumnNames = this.metadata.survey.customInfo.generatorDependents;      // could be empty
            var generatorDependents = {};
            var hasGeneratorDependents = generatorDependentColumnNames && generatorDependentColumnNames.length > 0;
            if (hasGeneratorDependents)
            {
                for (var depIx = 0; depIx < generatorDependentColumnNames.length; depIx += 1)
                    if (row[this.mapFieldName(generatorDependentColumnNames[depIx].toLowerCase())])
                        generatorDependents[generatorDependentColumnNames[depIx].toLowerCase()] = row[this.mapFieldName(generatorDependentColumnNames[depIx].toLowerCase())];
            }

            // Walk thru siblings rows, getting collapseColumn's value if generatorDependent column values match
            var numColumns = sibling.numColumns;
            var numRows = sibling.numRows ? sibling.numRows : ((sibling.questions.length / numColumns) - (sibling.hasHeadingRow ? 1 : 0));
            var offset = sibling.hasHeadingRow ? numColumns : 0;              // skip headings if present
            for (var rowIx = 0; rowIx < numRows; rowIx += 1)
            {
                var localValues = {};
                var suffix = this.getRowSuffix(rowIx);
                for (var colIx = 0; colIx < numColumns; colIx += 1)
                {
                    var question = sibling.questions[colIx + offset];
                    if (question.name)
                    {
                        if (question.name.toLowerCase() == collapseName)
                        {
                            var value = this.findSurveyElement(question.extConfig.name + suffix).getValue().match('[0-9]*');
                            if (null != value && value.length == 1)
                                localValues[collapseName] = value[0];
                        }
                        else if (hasGeneratorDependents)
                        {
                            if (generatorDependents[question.name.toLowerCase()])
                            {
                                localValues[question.name.toLowerCase()] = this.findSurveyElement(question.extConfig.name + suffix).getValue();
                            }
                        }
                    }
                }
                var allDependentsMatch = true;
                for (var depIx = 0; depIx < generatorDependentColumnNames.length; depIx += 1)
                {
                    if (localValues[generatorDependentColumnNames[depIx].toLowerCase()] && generatorDependents[generatorDependentColumnNames[depIx].toLowerCase()] &&
                            localValues[generatorDependentColumnNames[depIx].toLowerCase()] != generatorDependents[generatorDependentColumnNames[depIx].toLowerCase()])
                    {
                        allDependentsMatch = false;
                        break;
                    }
                }
                if (allDependentsMatch && localValues[collapseName])
                    blockOffset = Math.max(blockOffset, localValues[collapseName]);
            }
        }

        for (var blockInx = blockOffset; blockInx < numBlocks + blockOffset; blockInx += 1)
        {
            this.makeRows(rows, row, blockInx + 1, sizeIndicator);
        }
    },

    makeRows: function(rows, row, blockNum, sizeIndicator) {
        // sizeIndicator should be 0, 1 or 2
        var collapseName = this.metadata.survey.customInfo.collapseColumnName;
        if (0 == sizeIndicator)
        {
            var newRow = Ext4.clone(row);
            newRow[collapseName] = (blockNum < 10 ? '0' : '') + blockNum.toString();
            rows[rows.length] = newRow;
        }
        else if (1 == sizeIndicator)
        {
            var newRow = Ext4.clone(row);
            newRow[collapseName] = (blockNum < 10 ? '0' : '') + blockNum.toString() + "A";
            rows[rows.length] = newRow;
            newRow = Ext4.clone(row);
            newRow[collapseName] = (blockNum < 10 ? '0' : '') + blockNum.toString() + "B";
            rows[rows.length] = newRow;
        }
        else if (2 == sizeIndicator)
        {
            var newRow = Ext4.clone(row);
            newRow[collapseName] = (blockNum < 10 ? '0' : '') + blockNum.toString() + "A";
            rows[rows.length] = newRow;
            newRow = Ext4.clone(row);
            newRow[collapseName] = (blockNum < 10 ? '0' : '') + blockNum.toString() + "B";
            rows[rows.length] = newRow;
            newRow = Ext4.clone(row);
            newRow[collapseName] = (blockNum < 10 ? '0' : '') + blockNum.toString() + "C";
            rows[rows.length] = newRow;
            newRow = Ext4.clone(row);
            newRow[collapseName] = (blockNum < 10 ? '0' : '') + blockNum.toString() + "D";
            rows[rows.length] = newRow;
        }
    },

    fillRequiredSpecimenDetailFields: function(section, rows) {
        // Find values of required fields subject and date
        var required = {};
        var firstSection = this.metadata.survey.sections[0];
        var subjectName = this.metadata.survey.customInfo.subjectColumnName.toLowerCase();
        var sequenceName = this.metadata.survey.customInfo.sequenceNumColumnName.toLowerCase();
        for (var quesIx = 0; quesIx < firstSection.questions.length; quesIx += 1)
        {
            var question = firstSection.questions[quesIx];
            if (question.required)
            {
                if (question.name.toLowerCase() == subjectName)
                    required.subjectValue = this.findSurveyElement(question.extConfig.name).getValue();
                else if (question.name.toLowerCase() == sequenceName)
                {
                    var value = this.findSurveyElement(question.extConfig.name).getValue();
                    if ('datefield' == question.extConfig.xtype)
                        value = Ext4.Date.format(value, 'Ymd');
                    required.sequenceValue = value;
                }
            }
        }

        if (undefined == required.subjectValue || undefined == required.sequenceValue || undefined == section.filters)
            return;

        for (var rowIx = 0; rowIx < rows.length; rowIx += 1)
        {
            var row = rows[rowIx];
            if (!row[subjectName])
                row[subjectName] = required.subjectValue;
            if (!row[sequenceName])
                row['sequencenum'] = required.sequenceValue;
            for (var filterIx = 0; filterIx < section.filters.length; filterIx += 1)
            {
                var filter = section.filters[filterIx];
                row[filter.fieldName] = filter.fieldValue;
            }
        }
    },

    fillInSequenceNumForUpdate: function(section, rows)
    {
        for (var rowIx = 0; rowIx < rows.length; rowIx += 1)
        {
            var row = rows[rowIx];
            if (!row['sequencenum'])
                row['sequencenum'] = '20140101';
        }
    },

    buttonHandler: function(section, btn) {
        // handlerKey is a string, the name of the section in which the button lives
        var samplePanel = this.findSurveyElement(section.toolbarButtonHandlerKey);
        var numColumns = samplePanel.layout.columns;
        var startItem = samplePanel.hasHeadingRow ? numColumns : 0;

        if (btn.name == 'add')
        {
            // Add a sample row
            // Get the controls from the first non-header row and clone them, but with null values
            if (!samplePanel.countRows)
                samplePanel.countRows = 1;
            if (!section.numRows)
                section.numRows = 1;
            samplePanel.countRows += 1;
            section.numRows += 1;
            for (var colIx = startItem; colIx < startItem + numColumns; colIx += 1)
            {
                var suffix = this.getRowSuffix(samplePanel.countRows - 1);
                var resultsItem = samplePanel.getComponent(colIx);
                var item = resultsItem.cloneConfig({
                    name : resultsItem.name + suffix,
                    itemId : this.makeItemId(resultsItem.name + suffix)
                });
                if ((item.xtype != 'combobox' && item.xtype != 'combo') || item.emptyText)
                    item.value = null;
                samplePanel.add(item);
            }
        }
        else if (btn.name == 'delete')
        {
            var rows = [];
            var rowIx = 0;
            if (this.donorId)
            {
                for (var itemIx = startItem; itemIx < samplePanel.items.length; itemIx += numColumns)
                {
                    var checkbox = samplePanel.getComponent(itemIx);
                    if (checkbox.getValue())
                    {
                        var row = {}
                        this.setPrimaryKeyValues(section, row, rowIx);
                        rows[rows.length] = row;
                    }
                    rowIx += 1;
                }

                if (rows.length > 0)
                {
                    var msg = Ext4.Msg.show({
                        title : 'Delete Samples',
                        msg   : 'Are you sure you would like to delete ' + rows.length + ' samples now?',
                        buttons : Ext4.MessageBox.OKCANCEL,
                        icon    : Ext4.MessageBox.WARNING,
                        fn      : function(btn) {
                                    if (btn == 'ok')
                                    {
                                        this.getEl().mask("Deleting samples...");
                                        var saveConfig = {
                                            commands : [{
                                                command: 'delete',
                                                schemaName: 'study',
                                                queryName: section.queryName,
                                                rows: rows
                                            }],
                                            success: function(data) {
                                                this.getEl().unmask();
                                                this.repopulateSection(section, samplePanel);
                                            },
                                            failure : function() {
                                                this.getEl().unmask();
                                                Ext4.MessageBox.alert("Delete Samples", "FAILURE: no samples were deleted.");
                                            },
                                            scope   : this
                                        };

                                        LABKEY.Query.saveRows(saveConfig);
                                    }
                                },
                        scope  : this
                    });
                }
                else
                {
                    Ext4.MessageBox.alert("Delete Samples", "No samples are selected for delete.");
                }
            }
        }
    },

    repopulateSection: function(section, samplePanel) {
        // Remove all but first row and then populate
        var numColumns = samplePanel.layout.columns;
        var numKeepItems = numColumns + (samplePanel.hasHeadingRow ? numColumns : 0);
        var totalItems = samplePanel.items.length;
        for (var itemIx = totalItems; itemIx > numKeepItems ; itemIx -= 1)
        {
            var item = samplePanel.getComponent(itemIx - 1);
            samplePanel.remove(item);
        }
        this.populateSurveySection(section);
    },

    onFailure : function(resp, message, hidePanel) {
        if (this.getEl() && this.getEl().isMasked())
            this.getEl().unmask();

        this.callParent([resp, message, hidePanel]);
    },

    // Override
    clearFieldValue : function(field) {
        // only "reset" form fields that are not displayfields
        if (field && field.isFormField && field.getXType() != 'displayfield' && !field.dependentField && field.isDirty())
        {
            if (field.originalValue)
                field.setValue(field.originalValue);
            else
                this.callParent([field]);
        }
    },

    // Override
    isSurveyDirty : function() {
        if (this.surveySaved)
            return false;
        return this.callParent([]);
    },

    // Override
    clearHiddenFieldValues: function(cmp) {
        if (cmp.dontClearDirtyFieldWhenHiding)
            return;    // Don't clear anything is this subsection
        this.callParent([cmp]);
    },

    findSubSection : function(section, subSectionName) {
        // Recursively look for subSection
        var questions = section.questions;
        for (var quesIx = 0; quesIx < questions.length; quesIx += 1)
        {
            if (questions[quesIx].subSection)
            {
                if (questions[quesIx].name && questions[quesIx].name.toLowerCase() == subSectionName.toLowerCase())
                    return questions[quesIx];
                var subSection = this.findSubSection(questions[quesIx], subSectionName);
                if (subSection)
                    return subSection;
            }
        }
        return null;
    },

    findSurveyElementByName: function(name)
    {
        return this.down('[name="' + name + '"]');

    }
});