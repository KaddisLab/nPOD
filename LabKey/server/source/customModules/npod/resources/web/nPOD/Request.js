/*
 * Copyright (c) 2013-2014 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * This file defines the following classes:
 * Ext.npod.Block
 * Ext.npod.Tissue
 * Ext.npod.SamplePanel
 */

Ext4.define('Ext.npod.SamplePanel', {

    extend : 'Ext.form.Panel',

    border : false, frame : false,

    defaults : {
        labelWidth : 150,
        labelSeparator : ''
    },

    samples : [],

    registry : {},

    initComponent : function() {

        this.callParent();

        this.on('afterrender', this.onRenderComplete, this, {single: true});
    },

    onRenderComplete : function() {
        this.addSampleConfiguration(this.samples);
    },

    addSampleConfiguration : function(sampleData) { /* Abstract Method */ },

    /**
     * config.specificColumns {Array}
     * @param config
     * @returns {string} Ext.XTemplate ready string configuration
     */
    getDefaultTpl : function(config) {

        // build template
        var tpl = '<table class="blockview">';

        // compose headers
        tpl += '<thead><tr>' +
                '<th>Case ID</th>' +
                '<th>Sample Type</th>' +
                '<th>Aliquot Type</th>';

        if (config.specificColumns) {
            for (var s=0; s < config.specificColumns.length; s++) {
                tpl += '<th>' + config.specificColumns[s] +'</th>';
            }

        }

        tpl += '</tr></thead>';

        tpl += '<tbody><tpl for="."><tr>' +
                '<td>{nPODCaseID.value}</td>' +
                '<td>{PrimaryType.displayValue}</td>' +
                '<td>{DerivativeType.displayValue}</td>';

        if (config.specificColumns && config.specificColumns.length > 0) {
            tpl += '<td colspan="' + config.specificColumns.length +'"><div class="rendertarget"></div></td>';
        }

        tpl += '</tr></tpl></tbody></table>';

        return tpl;
    }
});

Ext4.define('Ext.npod.Block', {

    extend : 'Ext.npod.SamplePanel',

    alias : 'widget.npodblock',

    addSampleConfiguration : function(data) {
        this.registry = {};
        var _me = this;

        var registerFormProvider = function(component) {
            _me.registry[component.dataIndex] = component;
        };

        var sampleCfgs = [{
            xtype : 'box',
            tpl   : this.getDefaultTpl({
                specificColumns : ['Block', '# of Slides']
            }),
            data : data,
            width : 615,

            /* Mimic a FormField */
            isFormField : true,
            isValid : function() {},
            getSubmitData : function() {
                var vals = {};
                for (var r in _me.registry) {
                    if (_me.registry.hasOwnProperty(r)) {
                        var fullData = {}, idx = _me.registry[r].dataIndex;
                        Ext4.merge(fullData, data[idx], _me.registry[r].getValues());
                        vals[idx] = fullData;
                    }
                }
                return vals;
            }
        }];


        var subjectCol = LABKEY.moduleContext.study.subject.columnName;

        var columnCfg = {
            xtype : 'container',
            border : false, frame : false,
            layout : 'vbox',
            padding : '10 0 0 0',
            items : sampleCfgs,
            listeners : {
                afterrender : function(cont) {
                    var block = this;
                    Ext4.defer(function() {
                        var targets = Ext4.DomQuery.select('div.rendertarget', this.getEl().id);
                        var me = this;

                        var  getBlockItemFromCaseId = function(key) {
                            // key should be rowId
                            for (var item in block.state) {
                                if (block.state.hasOwnProperty(item) && key == block.state[item].RowId.value)
                                    return block.state[item];
                            }
                            return null;
                        };

                        var getStateValue = function(param, idx, _default, offset) {
                            if (block.state && block.samples[idx]) {
                                var blockItem = getBlockItemFromCaseId(block.samples[idx].RowId.value);
                                if (blockItem) {
                                    var val = blockItem[param];
	                                if (val) {
	                                    if (Ext4.isArray(val) && Ext4.isNumber(offset)) {
	                                        return val[offset];
	                                    }
	                                    return val;
	                                }
                            	}
                            }
                            return _default;
                        };

                        var getItemsCfg = function(idx, includeRemove, includeTopPadding) {

                            var numItems = getStateValue('block', idx, 'Any'), items = [], cfg, i=0;
                            numItems = (Ext4.isArray(numItems) ? numItems.length : 1);

                            for (; i < numItems; i++) {

                                cfg = [{
                                    xtype : 'combo',
                                    emptyText : 'Block',
                                    margin : includeTopPadding ? '4 0 0 0' : '0 0 0 0',
                                    store : {
                                        xtype  : 'store',
                                        fields : ['block'],
                                        data   : [{block: 'Any'}]
                                    },
                                    readOnly : true,
									name : 'block',
                                    triggerAction : 'all',
                                    queryMode : 'local',
                                    displayField : 'block',
                                    valueField   : 'block',
                                    columnWidth  : 0.4,
                                    value : getStateValue('block', idx, 'Any', i),
                                    allowBlank : false,
                                    ptidData : data[idx],
                                    listeners : {
                                        afterrender: function(cb) {
                                            if (cb.store && cb.ptidData) {
                                                LABKEY.Query.selectDistinctRows({
                                                    schemaName: 'study',
                                                    queryName: 'SpecimenDetail',
                                                    column: 'ProtocolNumber',
                                                    filterArray: [
                                                        LABKEY.Filter.create(subjectCol, cb.ptidData[subjectCol].value),
                                                        LABKEY.Filter.create('DerivativeType', cb.ptidData['DerivativeType'].value),
                                                        LABKEY.Filter.create('PrimaryType', cb.ptidData['PrimaryType'].value)
                                                    ],
                                                    success : function(_data) {
                                                        var recs = [], j=0;
                                                        for (; j < _data.values.length; j++) {
                                                            recs.push({block: _data.values[j]});
                                                        }
                                                        cb.store.add(recs);
                                                        if (cb.ptidData.ProtocolNumber && cb.ptidData.ProtocolNumber.value)
                                                            cb.setValue(cb.ptidData.ProtocolNumber.value);
                                                    },
                                                    failure : function() {
                                                        Ext4.Msg.alert('Block Identification Failed', 'Failed to locate blocks for \'' + cb.ptidData[subjectCol].value + '\'');
                                                    }
                                                });
                                            }
                                        }
                                    }
                                },{
                                    xtype : 'numberfield',
                                    emptyText : 'Slides',
                                    name   : 'slides',
                                    margin : includeTopPadding ? '4 0 0 8' : '0 0 0 8',
                                    columnWidth : 0.4,
                                    value : getStateValue('slides', idx, undefined, i),
                                    allowBlank : false
                                }];

                                if (includeRemove || i > 0) {
                                    cfg.push({
                                        xtype : 'button',
                                        margin : includeTopPadding ? '4 0 0 8' : '0 0 0 8',
                                        text  : null,
                                        iconCls : 'trash',
                                        columnWidth : 0.13,
                                        handler : function(b) {
                                            var p = b.up('panel');
                                            if (p) {
                                                p.remove(b.prev());
                                                p.remove(b.prev());
                                                p.remove(b);
                                            }
                                            me.doLayout();
                                        }
                                    });
                                }

                                for (var c=0; c < cfg.length; c++) {
                                    items.push(cfg[c]);
                                }
                            }

                            return items;
                        };

                        var p;
                        for (var t=0; t < targets.length; t++) {
                            p = Ext4.create('Ext.form.Panel', {
                                renderTo : Ext4.get(targets[t]),
                                width : 250,
                                layout : 'column',
                                border : false, frame : false,
                                padding: '5 5 5 0',
                                items : getItemsCfg(t),

                                dataIndex : t
/*
////////////////////////////
                                dataIndex : t,

                                buttons : [{
                                    text  : 'Add',
                                    iconCls : 'addicon',
                                    width : 50,
                                    handler : function(b) {
                                        var p = b.up('panel');
                                        if (p) {
                                            p.add(getItemsCfg(-1, true, true));
                                            me.doLayout();
                                         }
                                    }
                                }]
////////////////////////////
*/

                            });
                            registerFormProvider(p);
                        }
                        me.doLayout();
                    }, 200, cont);
                },
                scope : this
            }
        };

        this.add(columnCfg);
    }
});

Ext4.define('Ext.npod.Tissue', {

    extend : 'Ext.npod.SamplePanel',

    alias : 'widget.npodtissue',

    addSampleConfiguration : function(sampleData) {

        this.registry = {};
        var _me = this;

        var registerFormProvider = function(component) {
            _me.registry[component.dataIndex] = component;
        };

        var sampleCfgs = [{
            xtype : 'box',
            tpl   : this.getDefaultTpl({
                specificColumns : ['# of Vials']
            }),
            data : sampleData,
            width : 615,

            /* Mimic a FormField */
            isFormField : true,
            isValid : function() {},
            getSubmitData : function() {
                var vals = {};
                for (var r in _me.registry) {
                    if (_me.registry.hasOwnProperty(r)) {
                        var fullData = {}, idx = _me.registry[r].dataIndex;
                        Ext4.merge(fullData, sampleData[idx], _me.registry[r].getValues());
                        vals[idx] = fullData;
                    }
                }
                return vals;
            }
        }];

        var columnCfg = {
            xtype : 'container',
            border : false, frame : false,
            layout : 'vbox',
            padding : '10 0 0 0',
            items : sampleCfgs,
            listeners : {
                afterrender : function(c) {

                    Ext4.defer(function() {
                        var targets = Ext4.DomQuery.select('div.rendertarget', this.getEl().id);

                        var getValue = function(idx) {
                            if (_me.state && _me.state[idx]) {
                                if (_me.state[idx].numvials) {
                                    return _me.state[idx].numvials;
                                }
                            }
                            return 1; // default
                        };

                        var p;
                        for (var t=0; t < targets.length; t++) {
                            p = Ext4.create('Ext.form.Panel', {
                                renderTo : Ext4.get(targets[t]),
                                width : 250,
                                layout : 'column',
                                border : false, frame : false,
                                padding: '5 5 5 0',
                                items : [{
                                    xtype : 'numberfield',
                                    name : 'numvials',
                                    value : getValue(t),
                                    hideTrigger : true,
									readOnly : true
                                }],
                                dataIndex : t
                            });
                            registerFormProvider(p);
                        }
                        this.doLayout();
                    }, 200, c);
                }
            },
            scope : this
        };

        this.add(columnCfg);
    }
});

Ext4.define('Ext.npod.Cell', {

    extend : 'Ext.npod.SamplePanel',

    alias : 'widget.npodcell',

    addSampleConfiguration : function(sampleData) {

        this.registry = {};
        var _me = this;

        var registerFormProvider = function(component) {
            _me.registry[component.dataIndex] = component;
        };

        var sampleCfgs = [{
            xtype : 'box',
            tpl   : this.getDefaultTpl({
                specificColumns : ['# of Tubes']
            }),
            data : sampleData,
            width : 615,

            /* Mimic a FormField */
            isFormField : true,
            isValid : function() {},
            getSubmitData : function() {
                var vals = {};
                for (var r in _me.registry) {
                    if (_me.registry.hasOwnProperty(r)) {
                        var fullData = {}, idx = _me.registry[r].dataIndex;
                        Ext4.merge(fullData, sampleData[idx], _me.registry[r].getValues());
                        vals[idx] = fullData;
                    }
                }
                return vals;
            }
        }];

        var columnCfg = {
            xtype : 'container',
            border : false, frame : false,
            layout : 'vbox',
            padding : '10 0 0 0',
            items : sampleCfgs,
            listeners : {
                afterrender : function(c) {

                    Ext4.defer(function() {
                        var targets = Ext4.DomQuery.select('div.rendertarget', this.getEl().id);

                        var getValue = function(idx) {
                            if (_me.state && _me.state[idx]) {
                                if (_me.state[idx].numcells) {
                                    return _me.state[idx].numcells;
                                }
                            }
                            return 1; // default
                        };

                        var p;
                        for (var t=0; t < targets.length; t++) {
                            p = Ext4.create('Ext.form.Panel', {
                                renderTo : Ext4.get(targets[t]),
                                width : 250,
                                layout : 'column',
                                border : false, frame : false,
                                padding: '5 5 5 0',
                                items : [{
                                    xtype : 'numberfield',
                                    name : 'numcells',
                                    value : getValue(t),
                                    hideTrigger : true,
									readOnly : true
                                }],
                                dataIndex : t
                            });
                            registerFormProvider(p);
                        }
                        this.doLayout();
                    }, 200, c);
                }
            },
            scope : this
        };

        this.add(columnCfg);
    }
});