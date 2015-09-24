/*
 * Copyright (c) 2013 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */

Ext4.tip.QuickTipManager.init();

Ext4.define('LABKEY.ext4.npod.ManageDonorWizardPanel', {

    extend : 'Ext.form.Panel',
    layout : 'hbox',

    constructor : function(config) {

        Ext4.applyIf(config, {
            border  : false,
            frame   : false,
            autoScroll : true,
            cls     : 'iScroll', // webkit custom scroll bars
            buttonAlign : 'left',
            dateFormat  : 'Y-m-d',
            fieldDefaults  : {
                labelWidth : 100,
                width      : 420,
                style      : 'margin: 0px 0px 4px 0px',
                labelSeparator : ''
            }
        });

        this.callParent([config]);
    },

    initComponent : function() {

        var formItems = [];

        formItems.push({
            xtype   : 'displayfield',
            value   : Ext.DomHelper.markup({tag:'div', cls:'labkey-header-large', style: 'margin: 2px 2px 2px 6px',
                html: 'Select the primary dataset for the wizard.'})
        });

        var primaryDatasetCombo = Ext4.create('Ext.form.field.ComboBox', {
            fieldLabel: 'Primary Dataset',
            style: {
                margin: '2px 6px, 6px 6px'
            },
            name: 'primaryDataset',
            id: 'primaryDatasetCombo',
            forceSelection : true, // user must pick from list
            store       : this.getDatasetsStore(),
            displayField : 'Label',
            valueField : 'DataSetId'
        });

        formItems.push(primaryDatasetCombo);

        formItems.push({
            xtype   : 'displayfield',
            value   : Ext.DomHelper.markup({tag:'div', cls:'labkey-header-large', style: 'margin: 10px 2px 2px 6px',
                html: 'Select one or more datasets to include in the wizard. The primary dataset is automatically included.'})
        });

        formItems.push(this.getIncludedDatasetsGrid());

        var formItemsRight = [];
        formItemsRight.push({
            xtype   : 'displayfield',
            value   : Ext.DomHelper.markup({tag:'div', cls:'labkey-header-large', style: 'margin: 2px 2px 2px 6px',
                html: 'Select one or more priority sample types. These will be shown directly in the main Samples section. The others will be initially hidden.'})
        });

        formItemsRight.push(this.getPriorityTypesGrid());

        var leftPanel = Ext4.create('Ext.panel.Panel', {
            margin: '2 2 2 2',
            defaults  : {
                margin: '2 6 2 6',
                labelWidth : 100,
                width      : 470
            },
            items: formItems
        });

        var rightPanel = Ext4.create('Ext.panel.Panel', {
            margin: '2 2 2 2',
            defaults  : {
                margin: '2 6 2 6',
                labelWidth : 100,
                width      : 470
            },
            items: formItemsRight
        });

        this.items = [leftPanel, rightPanel];
        this.callParent([arguments]);
    },

    getIncludedDatasetsGrid : function() {

        var store = this.getDatasetsStore();

        var grid = Ext4.create('Ext.grid.Panel', {
            id       : 'includedDatasetsGrid',
            name     : 'includedDatasets',
            store    : store,
            border   : true, frame: false,
            scroll   : 'vertical',
            columns  : [{
                xtype    : 'templatecolumn',
                text     : 'Dataset',
                flex     : 1,
                sortable : true,
                dataIndex: 'Label',
                tpl      : '{Label:htmlEncode}'
            }],
            enableColumnHide: false,
            enableColumnMove: false,
            enableColumnResize: false,
            multiSelect : true,
            cls         : 'iScroll', // webkit custom scroll bars
            viewConfig : {
                stripRows : true
            },
            selType   : 'rowmodel',
            scope     : this
        });

        return grid;
    },

    getDatasetsStore: function() {
        // define data models
        if (!Ext4.ModelManager.isRegistered('LABKEY.data.Datasets')) {
            Ext4.define('LABKEY.data.Datasets', {
                extend : 'Ext.data.Model',
                fields : [
                    {name : 'DataSetId', type : 'int'},
                    {name : 'Label'                  }
                ]
            });
        }

        var config = {
            model   : 'LABKEY.data.Datasets',
            autoLoad: true,
            pageSize: 10000,
            proxy   : {
                type   : 'ajax',
                url : LABKEY.ActionURL.buildURL('query', 'selectRows.api'),
                extraParams : {
                    schemaName  : 'study',
                    queryName   : 'Datasets'
                },
                reader : {
                    type : 'json',
                    root : 'rows'
                }
            },
            listeners : {
                load : function(s, recs, success, operation, ops) {
                    s.sort('Label', 'ASC');

                    // Set selection according to current state
                    if (this.includedDatasets)
                    {
                        for (var dsIx = 0; dsIx < this.includedDatasets.length; dsIx += 1)
                        {
                            var datasetId = this.includedDatasets[dsIx];
                            var storeIx = s.find('DataSetId', datasetId);
                            if (-1 != storeIx)
                            {
                                var model = this.down('[id="includedDatasetsGrid"]').getSelectionModel();
                                if (model)
                                {
                                    var record = model.store.getAt(storeIx);
                                    if (record)
                                        model.select([record], true, true);
                                }
                            }
                        }
                    }
                    if (this.primaryDatasetId && -1 != this.primaryDatasetId)
                        this.down('[id="primaryDatasetCombo"]').setValue(this.primaryDatasetId);
                },
                scope : this
            }
        };

        return Ext4.create('Ext.data.Store', config);
    },

    getPriorityTypesGrid : function() {

        var store = this.getPrimaryTypesStore();

        var grid = Ext4.create('Ext.grid.Panel', {
            id       : 'priorityTypesGrid',
            name     : 'priorityTypes',
            store    : store,
            border   : true, frame: false,
            scroll   : 'vertical',
            columns  : [{
                xtype    : 'templatecolumn',
                text     : 'Sample Type',
                flex     : 1,
                sortable : true,
                dataIndex: 'Description',
                tpl      : '{Description:htmlEncode}',
                editor   : {
                    xtype:'textfield',
                    allowBlank:false
                }
            }],
            enableColumnHide: false,
            enableColumnMove: false,
            enableColumnResize: false,
            multiSelect : true,
            cls         : 'iScroll', // webkit custom scroll bars
            viewConfig : {
                stripRows : true
            },
            selType   : 'rowmodel',
            scope     : this
        });

        return grid;
    },

    getPrimaryTypesStore : function() {

        // define data models
        if (!Ext4.ModelManager.isRegistered('LABKEY.data.PrimaryTypes')) {
            Ext4.define('LABKEY.data.PrimaryTypes', {
                extend : 'Ext.data.Model',
                fields : [
                    {name : 'RowId',      type : 'int'},
                    {name : 'Description'             }
                ]
            });
        }

        var config = {
            model   : 'LABKEY.data.PrimaryTypes',
            autoLoad: true,
            pageSize: 10000,
            proxy   : {
                type   : 'ajax',
                url : LABKEY.ActionURL.buildURL('query', 'selectRows.api'),
                extraParams : {
                    schemaName  : 'study',
                    queryName   : 'SpecimenPrimaryType'
                },
                reader : {
                    type : 'json',
                    root : 'rows'
                }
            },
            listeners : {
                load : function(s, recs, success, operation, ops) {
                    s.sort('Description', 'ASC');

                    // Set selection according to current state
                    if (this.includedDatasets)
                    {
                        for (var dsIx = 0; dsIx < this.prioritySampleTypes.length; dsIx += 1)
                        {
                            var primaryTypeId = this.prioritySampleTypes[dsIx];
                            var storeIx = s.find('RowId', primaryTypeId);
                            if (-1 != storeIx)
                                this.down('[id="priorityTypesGrid"]').getSelectionModel().select(storeIx, true, true);
                        }
                    }
                },
                scope : this
            }
        };

        return Ext4.create('Ext.data.Store', config);
    },

    getSelectedIds: function(gridId, fieldName) {
        var ids = [];
        var records = this.down('[id="' + gridId + '"]').getSelectionModel().getSelection();
        for (var selIx = 0; selIx < records.length; selIx += 1)
        {
            ids.push(records[selIx].get(fieldName));
        }
        return ids;
    }
});
