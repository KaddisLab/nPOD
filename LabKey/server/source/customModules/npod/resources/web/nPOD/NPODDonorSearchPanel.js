/*
 nPOD Sample Search Panel

 Present user with Vial fields as search criteria for Study module sample search.
 Adapted from "study/SampleSearchPanel.js".

 TODO:  Perfrom code merge analysis as new versions of LabKey server are released.
 TODO:  First compare against baseline changes, then against nPOD changes.  (study/SampleSearchPanel.js)

 */

Ext4.define('LABKEY.ext.NPODDonorSearchPanel', {
    extend: 'Ext.form.Panel',
    LABEL_WIDTH: 150,
    MAX_COMBO_ITEMS: 200,
    HIDE_TEXT: 'Hide Additional Fields',
    SHOW_TEXT: 'Show Additional Fields',
    showExtraFields: false,
    initComponent: function(){
        Ext4.QuickTips.init();
        Ext4.apply(this, {
            border: false,
            bodyStyle: 'background-color: transparent;padding: 5px;',
            defaults: {
                bodyStyle: 'background-color: transparent;',
                border: false
            },
            items: [{
                xtype: 'radiogroup',
                width: 420,
                itemId: 'searchType',
                fieldLabel: 'Search Type',
                labelWidth: this.LABEL_WIDTH,
                labelStyle: 'font-weight: bold;',
                afterLabelTextTpl: '<a href="#" data-qtip="Vial group search returns a single row per subject, time point, and sample type.  These results may be easier to read and navigate, but lack vial-level detail"><span class="labkey-help-pop-up">?</span></a>',
                hidden: true,    // nPOD to show vial results, not grouped/summary results.
                items: [{
                    boxLabel: 'Individual Vials',
                    inputValue: 'individual',
                    name: 'groupType',
                    checked: true,
                    hidden: true    // nPOD to show vial results, not grouped/summary results.
                },{
                    boxLabel: 'Grouped Vials',
                    inputValue: 'grouped',
                    name: 'groupType',
                    checked: false,
                    hidden: true    // nPOD to show vial results, not grouped/summary results.
                }],
                listeners: {
                    buffer: 50,
                    change: function(rg, r){
                        var form = rg.up('form');
                        var panel = form.down('#searchFields');

                        var guidOp = panel.down('#guidOpField');
                        if(guidOp){
                            var guidField = panel.down('#guidField');
                            guidOp.setVisible(r.groupType != 'grouped');
                            if(r.groupType == 'grouped'){
                                guidOp.setVisible(false);
                                guidOp.reset();
                                guidField.reset();
                            }
                        }

                        form.toggleExtraFields(false);
                        form.down('#searchToggle').setText(form.SHOW_TEXT);
                    }
                }
            },{
                itemId: 'searchFields',
                bodyStyle: 'background-color: transparent;',
                width: 400,
                defaults: {
                    labelWidth: this.LABEL_WIDTH,
                    width: 400
                },
                items: [{
                    border: false,
                    bodyStyle: 'background-color: transparent;',
                    html: 'Loading...'
                }]
            },{
                xtype: 'container',
                style: 'padding-top: 15px;',
                items: [{
                    xtype: 'button',
                    itemId: 'searchToggle',
                    text: this.SHOW_TEXT,
                    handler: function(btn) {
                        var form = btn.up('form');
                        btn.setText(btn.getText() == form.HIDE_TEXT ? form.SHOW_TEXT : form.HIDE_TEXT);
                        form.toggleExtraFields(btn.getText() == form.HIDE_TEXT);
                    },
                    scope: this,
                    hidden: true    // nPOD to show primary criteria set.
                }
                ,{
                    xtype: 'container',
                    bodyStyle: 'background-color: transparent;',
                    itemId: 'extraFieldsPanel',
                    style: 'padding-top: 10px;',
                    border: false,
                    hidden: true    // nPOD to show primary criteria set.
                }
                ]
            }],
            buttonAlign: 'left',
            dockedItems: [{
                xtype: 'toolbar',
                dock: 'bottom',
                style: 'background-color: transparent;padding-top: 5px;',
                ui: 'footer',
                items: [{
                    text: 'Search',
                    handler: this.onSubmit
                }]
            }]
        });

        this.callParent(arguments);

        this.studyProps = LABKEY.getModuleContext('study');
        this.preloadStores();
    },

    preloadStores: function(){
        var toCreate = this.getGroupSearchItems();
        this.pendingStores = 0;
        Ext4.each(toCreate, function(args){
            var store = this.createStore.apply(this, args);
            this.pendingStores++;
            this.mon(store, 'load', this.onStoreLoad, this);
        }, this);

        this.pendingStores++;
        this.simpleSpecimenStore = Ext4.create('LABKEY.ext4.Store', {
            schemaName: 'study',
            queryName: 'SimpleSpecimen',
            maxRows: 0,
            autoLoad: true,
            listeners: {
                scope: this,
                load: function(store){
                    this.onStoreLoad();
                }
            }
        });

        this.pendingStores++;
        this.specimenSummaryStore = Ext4.create('LABKEY.ext4.Store', {
            schemaName: 'study',
            queryName: 'SpecimenSummary',
            maxRows: 0,
            autoLoad: true,
            listeners: {
                scope: this,
                load: function(store){
                    this.onStoreLoad();
                }
            }
        });
    },

    onStoreLoad: function(store){
        this.pendingStores--;

        if(this.pendingStores == 0){
            var val = this.down('#searchType').getValue().groupType;
            var panel = this.down('#searchFields');
            panel.removeAll();
            if(val == 'grouped'){
                panel.add(this.getGroupedSearchCfg());
            }
            else {
                panel.add(this.getIndividualSearchCfg());
            }

            var target = this.down('#extraFieldsPanel');
            target.removeAll();
            this.addClass('specimenSearchLoaded'); // marker class to know when search panel has loaded
        }
    },

    getIndividualSearchCfg: function(){

        var cfg = null;

        // Individual Search config
        cfg = [
            {
                xtype: 'labkey-operatorcombo',
                itemId: 'guidOpField',
                jsonType: 'string',
                mvEnabled: false,
                //emptyText: 'Any Global Unique ID',
                includeHasAnyValue: true,
                value: null,
                fieldLabel: 'Global Unique ID',
                listeners: {
                    scope: this,
                    change: function(field, val){
                        this.down('#guidField').setVisible(val);
                    }
                }
            },{
                xtype: 'textfield',
                itemId: 'guidField',
                filterParam: 'GlobalUniqueId',
                fieldLabel: '&nbsp;',
                labelSeparator: '',
                hidden: true
            }];


        // Append Group Search config

        // Changed to disable Individual Search Config, but specififcally to remove GlobalUniqueId string criteria.
        //cfg = cfg.concat(this.getGroupedSearchCfg());
        cfg = this.getGroupedSearchCfg();

        // Append Demographic Search config
        cfg = cfg.concat(this.getDemographicsSearchConfig());

        cfg = cfg.concat()

        return cfg;
    },

    getGroupedSearchCfg: function(){
        var cfg = [];
        Ext4.each(this.getGroupSearchItems(), function(item){
            cfg.push(this.getComboCfg.apply(this, item));
        }, this);

        return cfg;
    },

//      // (Original study module search criteria.)
//    getGroupSearchItems: function(){
//        return [
//            [this.studyProps.subject.nounSingular, 'study', this.studyProps.subject.tableName, this.studyProps.subject.columnName + "/" + this.studyProps.subject.columnName, this.studyProps.subject.columnName, this.studyProps.subject.columnName, 'Any ' + this.studyProps.subject.nounSingular, null],
//            ['Visit', 'study', 'Visit', 'Visit/SequenceNumMin', 'Label', 'SequenceNumMin', 'Any Visit', null, 'DisplayOrder,Label'],
//            ['Primary Type', 'study', 'SpecimenPrimaryType', 'PrimaryType/Description', 'Description', 'Description', 'Any Primary Type', null],
//            ['Derivative Type', 'study', 'SpecimenDerivative', 'DerivativeType/Description', 'Description', 'Description', 'Any Derivative Type', null],
//            ['Additive Type', 'study', 'SpecimenAdditive', 'AdditiveType/Description', 'Description', 'Description', 'Any Additive Type', null]
//        ]
//    },

//    getGroupSearchItems: function(){
//        return [
//            [this.studyProps.subject.nounSingular, 'study', this.studyProps.subject.tableName, this.studyProps.subject.columnName + "/" + this.studyProps.subject.columnName, this.studyProps.subject.columnName, this.studyProps.subject.columnName, 'Any ' + this.studyProps.subject.nounSingular, null],
//            ['Donor Type', 'lists', '\"List: DonorType\"', 'nPODCaseID/DataSet/Demographics/DonorType', 'DonorType', 'DonorType', 'Any Donor Type', null],
//            ['Sample Type', 'study', 'SpecimenPrimaryType', 'PrimaryType/Description', 'Description', 'Description', 'Any Primary Type', null],
//            ['Aliquot Type', 'study', 'SpecimenDerivative', 'DerivativeType/Description', 'Description', 'Description', 'Any Derivative Type', null],
//            ['Sex', 'lists', '\"List: Sex\"', 'nPODCaseID/DataSet/Demographics/oppc_Gender', 'oppc_Gender', 'oppc_Gender', 'Any Gender Type', null],
//            ['Race', 'lists', '\"List: Race\"', 'nPODCaseID/DataSet/Demographics/oppc_Ethnicity', 'oppc_Ethnicity', 'oppc_Ethnicity', 'Any Race Type', null]
//
//        ]
//    },

    getGroupSearchItems: function(){
        return [
            [this.studyProps.subject.nounSingular, 'study', this.studyProps.subject.tableName, this.studyProps.subject.columnName, this.studyProps.subject.columnName, this.studyProps.subject.columnName, 'Any ' + this.studyProps.subject.nounSingular, null],
            ['Donor Type', 'lists', '\"List: DonorType\"', 'DonorType', 'DonorType', 'DonorType', 'Any Donor Type', null],
            //['Sample Type', 'study', 'SpecimenPrimaryType', 'PrimaryType', 'Description', 'Description', 'Any Primary Type', null],
            //['Aliquot Type', 'study', 'SpecimenDerivative', 'DerivativeType', 'Description', 'Description', 'Any Derivative Type', null],
            ['Sex', 'lists', '\"List: Sex\"', 'oppc_Gender', 'oppc_Gender', 'oppc_Gender', 'Any Gender Type', null],
            ['Race', 'lists', '\"List: Race\"', 'oppc_Ethnicity', 'oppc_Ethnicity', 'oppc_Ethnicity', 'Any Race Type', null]

        ]
    },

    getComboCfg: function(label, schemaName, queryName, filterParam, displayColumn, valueColumn, defaultOptionText, defaultOptionValue, sort){
        var store = this.createStore.apply(this, arguments);
        if(store.getCount() != 0 && store.getCount() >= this.MAX_COMBO_ITEMS){
            return {
                xtype: 'textfield',
                itemId: queryName,
                fieldLabel: label,
                filterParam: filterParam,
                //emptyText: defaultOptionText,
                value: defaultOptionValue
            }
        }
        else {
            return {
                xtype: 'checkcombo',
                //editable: false,
                itemId: queryName,
                queryMode: 'local',
                //multiSelect: true,
                fieldLabel: label,
                filterParam: filterParam,
                displayField: 'displayValue',
                valueField: valueColumn,
                //emptyText: defaultOptionText,
                value: defaultOptionValue,
                store: store,
                addAllSelector: true,
                expandToFitContent: true
            }
        }
    },

    getDemographicsSearchConfig: function(){

        return [
            {
                xtype: 'labkey-operatorcombo',
                itemId: 'ageOpField',
                //jsonType: 'int_range',    // Disable int_range.  int type workaround.
                jsonType: 'int',
                mvEnabled: false,
                //emptyText: 'Any ID',
                includeHasAnyValue: true,
                value: null,
                fieldLabel: 'Age',
                listeners: {
                    scope: this,
                    change: function(field, val){
                        this.down('#ageFieldSet').setVisible(val);
                        this.down('#ageField').setVisible(val);

                        // Plus/Minus range value - TODO:  Reference type constant.
                        if (val == "plusminus"  ){
                            this.down('#ageFieldPlusMinusRange').setVisible(val);
                        } else {
                            this.down('#ageFieldPlusMinusRange').setVisible(false);
                            this.down('#ageFieldPlusMinusRange').setValue('');
                        }
                        //this.down('#ageField').setVisible(val);
                        //this.down('#ageFieldPlusMinusRange').setVisible(val);
                    }
                }
            },
            {
                xtype:'fieldcontainer',
                itemId: 'ageFieldSet',
                //filterParam: 'nPODCaseID/DataSet/Demographics/oppc_ageR',
                filterParam: 'oppc_ageR',
                title: '',
                collapsible: true,
                defaultType: 'textfield',
                layout: 'hbox',
                width: 400,
                hidden: true,

                items: [
                    {
                        xtype: 'textfield',
                        itemId: 'ageField',
                        fieldLabel: '&nbsp;',
                        labelSeparator: '',
                        width: 200,
                        labelWidth: 150,
                        hidden: true
                    },
                    {
                        xtype: 'textfield',
                        itemId: 'ageFieldPlusMinusRange',
                        filterParam: '',
                        fieldLabel: '+/-',
                        labelAlign: "right",
                        labelSeparator: '',
                        width: 75,
                        labelWidth: 25,
                        hidden: true
                    }
                ]
            },
            {
                xtype: 'labkey-operatorcombo',
                itemId: 'bmiOpField',
                //jsonType: 'int_range',    // Disable int_range.  int type workaround.
                jsonType: 'int',
                mvEnabled: false,
                //emptyText: 'Any ID',
                includeHasAnyValue: true,
                value: null,
                fieldLabel: 'BMI',
                listeners: {
                    scope: this,
                    change: function(field, val){
                        this.down('#bmiFieldSet').setVisible(val);
                        this.down('#bmiField').setVisible(val);

                        // Plus/Minus range value - TODO:  Reference type constant.
                        if (val == "plusminus"  ){
                            this.down('#bmiFieldPlusMinusRange').setVisible(val);
                        } else {
                            this.down('#bmiFieldPlusMinusRange').setVisible(false);
                            this.down('#bmiFieldPlusMinusRange').setValue('');
                        }
                    }
                }
            },
            {
                xtype:'fieldcontainer',
                itemId: 'bmiFieldSet',
                //filterParam: 'nPODCaseID/DataSet/Demographics/oppc_bmiR',
                filterParam: 'oppc_bmiR',
                title: '',
                collapsible: true,
                defaultType: 'textfield',
                layout: 'hbox',
                width: 400,
                hidden: true,

                items: [
                    {
                        xtype: 'textfield',
                        itemId: 'bmiField',
                        fieldLabel: '&nbsp;',
                        labelSeparator: '',
                        width: 200,
                        labelWidth: 150,
                        hidden: true
                    },
                    {
                        xtype: 'textfield',
                        itemId: 'bmiFieldPlusMinusRange',
                        filterParam: '',
                        fieldLabel: '+/-',
                        labelAlign: "right",
                        labelSeparator: '',
                        width: 75,
                        labelWidth: 25,
                        hidden: true
                    }
                ]
            }
        ];

        var store = this.createStore.apply(this, arguments);
        if(store.getCount() != 0 && store.getCount() >= this.MAX_COMBO_ITEMS){
            return {
                xtype: 'textfield',
                itemId: queryName,
                fieldLabel: label,
                filterParam: filterParam,
                //emptyText: defaultOptionText,
                value: defaultOptionValue
            }
        }
        else {
            return {
                xtype: 'checkcombo',
                //editable: false,
                itemId: queryName,
                queryMode: 'local',
                //multiSelect: true,
                fieldLabel: label,
                filterParam: filterParam,
                displayField: 'displayValue',
                valueField: valueColumn,
                //emptyText: defaultOptionText,
                value: defaultOptionValue,
                store: store,
                addAllSelector: true,
                expandToFitContent: true
            }
        }
    },

    createStore: function(label, schemaName, queryName, filterParam, displayColumn, valueColumn, defaultOptionText, defaultOptionValue, sort){
        //only create stores once
        var storeId = ['specimen-search', schemaName, queryName, displayColumn, valueColumn].join('||');
        var store = Ext4.StoreMgr.get(storeId);
        if(!store){
            var columns = displayColumn;
            if(valueColumn != displayColumn){
                columns += ','+valueColumn;
            }

            var storeCfg = {
                type: 'labkey-store',
                storeId: storeId,
                schemaName: schemaName,
                //queryName: queryName,
                sql: 'select distinct(' + displayColumn + ') as ' + displayColumn + (displayColumn == valueColumn ? '' : ', ' + valueColumn) + ' from ' + schemaName + '.' + queryName + ' WHERE ' + displayColumn + ' IS NOT NULL AND ' + displayColumn + ' != \'\'',
                columns: columns,
                sort: sort || displayColumn,
                autoLoad: true,
                maxRows: this.MAX_COMBO_ITEMS,
                metadata: {
                    displayValue: {
                        createIfDoesNotExist: true,
                        setValueOnLoad: true,
                        getInitialValue: function(val, rec, meta){
                            if(displayColumn == valueColumn)
                                return rec.get(displayColumn);
                            else {
                                return rec.get(displayColumn) + ' (' + rec.get(valueColumn) + ')';
                            }
                        }
                    }
                }
            };

            //special case participant
            if(LABKEY.demoMode && queryName == this.studyProps.subject.nounSingular){
                storeCfg.listeners = {
                    load: function(store){
                        store.each(function(rec){
                            rec.set(displayColumn, LABKEY.id(valueColumn))
                        }, this);
                    },
                    scope: this
                };
            }
            store = Ext4.create('LABKEY.ext4.Store', storeCfg);
        }

        return store;
    },

    onSubmit: function(btn){
        var form = btn.up('form')
        var panel = form.down('#searchFields');
        var vialSearch = form.down('#searchType').getValue().groupType != 'grouped';

        //var dataRegionName = vialSearch ? "SpecimenDetail" : "SpecimenSummary";
        //var dataRegionNameGenerated = "aqwp3";
        //var dataRegionName = "SpecimenDetail";
        var dataRegionName = "DonorSpecimenSearch";

        var params = {
            showVials: vialSearch
        };

        panel.items.each(function(item){
            var op, val;
            if(item.filterParam){
                //special case GUID:
                if(item.itemId == 'guidField'){
                    op = panel.down('#guidOpField').getValue();
                    val = item.getValue();
                } else if(item.itemId == 'ageFieldSet'){
                    op = panel.down('#ageOpField').getValue();

                    // Check for Range +-
                    // TODO:  Translate to BETWEEN when available.
                    if(op=='plusminus')
                        val = [
                                panel.down('#ageField').getValue(),
                                panel.down('#ageFieldPlusMinusRange').getValue()
                        ];
                    else
                        val = panel.down('#ageField').getValue();

                } else if(item.itemId == 'bmiFieldSet'){
                    op = panel.down('#bmiOpField').getValue();

                    // Check for Range +-
                    // TODO:  Translate to BETWEEN when available.
                    if(op=='plusminus')
                        val = [
                                panel.down('#bmiField').getValue(),
                                panel.down('#bmiFieldPlusMinusRange').getValue()
                        ];
                    else
                        val = panel.down('#bmiField').getValue();

                }
                else {
                    op = 'eq';
                    val = item.getValue();
                }

                if(Ext4.isArray(val)){

                    if(op != 'plusminus') {
                        // Do not optimize for 'plusminus' - sfuertez
                        // TODO:  Update when BETWEEN available.  (Remove 'plusminus' condition if not needed.)

                        if(val.length > 1)
                            op = 'in';

                        var optimized = form.optimizeFilter(op, val, item);
                        if(optimized){
                            op = optimized[0];
                            val = optimized[1];
                        }

                        val = val.join(';');
                    }
                }

                if (op){
                    var filterType = LABKEY.Filter.getFilterTypeForURLSuffix(op);
                    if(!Ext4.isEmpty(val) || (filterType && !filterType.isDataValueRequired())){

                        // Check for PLUSMINUS Filter criteria.
                        // TODO: Update design when BETWEEN operator is available. (Remove this non-standard section.)
                        if(op=='plusminus') {
                            // Change to range and use (2) value criteria.
                            params[dataRegionName + '.' + item.filterParam + '~' + 'gte'] = (parseFloat(val[0]) - parseFloat(val[1])).toString();
                            params[dataRegionName + '.' + item.filterParam + '~' + 'lte'] = (parseFloat(val[0]) + parseFloat(val[1])).toString();

                        } else {
                            // Standard Filter Types
                            params[dataRegionName + '.' + item.filterParam + '~' + op] = val;

                        }

                    }
                }
            }
        }, this);

        //then inspect the search panel
        if (form.down('#searchPanel'))
            Ext4.apply(params, form.down('#searchPanel').getFilterParams(dataRegionName));

        // Get search results
        form.getDonorSearchResults(dataRegionName, params);

        //Specimen Search Example
        //alert("Debug - Pause");
        //window.location = LABKEY.ActionURL.buildURL('study-samples', 'samples', null, params);
    },

    optimizeFilter: function(op, values, field){
        if(field && field.store){
            if(values.length > (field.getStore().getTotalCount() / 2)){
                op = LABKEY.Filter.getFilterTypeForURLSuffix(op).getOpposite().getURLSuffix();

                var newValues = [];
                field.store.each(function(rec){
                    var v = rec.get(field.displayField)
                    if(values.indexOf(v) == -1){
                        newValues.push(v);
                    }
                }, this);
                values = newValues;
            }
        }
        values = Ext4.unique(values);
        return [op, values];
    },

    toggleExtraFields: function(show){
        var target = this.down('#extraFieldsPanel');
        if(!show){
            target.removeAll();

        }
        else {
            var searchType = this.down('#searchType').getValue().groupType;
            var store;
            if (searchType == 'grouped')
                store = this.specimenSummaryStore;
            else
                store = this.simpleSpecimenStore;

            var metadata = {};
            Ext4.each(this.getExistingFieldNames(), function(col){
                metadata[col] = {hidden: true}
            }, this);
            target.add({
                xtype: 'labkey-searchpanel',
                itemId: 'searchPanel',
                bodyStyle: 'background-color: transparent;padding: 0px;',
                metadata: metadata,
                store: store,
                buttons: [],
                border: false,
                allowSelectView: false
            });
            this.showExtraFields = !this.showExtraFields;
        }
    },

    getExistingFieldNames: function(){
        var fields = [];
        this.down('#searchFields').items.each(function(item){
            if(item.filterParam){
                var param = item.filterParam.split('/');
                fields.push(param[0]);
            }
        }, this);
        return fields;
    },

    getDonorSearchResults: function(dataRegionName, params){

        var filterParamsConcat = 'init=0';

        // Generate concatenated string from URL formatted parameters.
        for (var i=0; i<Object.keys(params).length;i++) {
            var key = Object.keys(params)[i];
            filterParamsConcat += '&' + key + '=' + params[key];
        }

        // Get filters out of param string.
        var filtersFromParams = LABKEY.Filter.getFiltersFromUrl(filterParamsConcat,dataRegionName);;

        // Create query grid.
        var qwpDonorSearchResults = new LABKEY.QueryWebPart({
            renderTo: 'divNPODDonorSearchResultsWebPart',
            title: 'Donor Search Results',
            schemaName: 'study',
            queryName: 'DonorSpecimenSearch',
            dataRegionName: dataRegionName,
            filters: filtersFromParams,
            buttonBar: {
                includeStandardButtons: true,
                items:[
                    LABKEY.QueryWebPart.standardButtons.views,
                    // {text: 'Refresh', url: LABKEY.ActionURL.buildURL('wiki', 'page', LABKEY.ActionURL.getContainer(), {name: 'SpecimenDistributionsJSWebPart1'} )},
                    // {text: 'Initiate Inventory Free Distribution Record', url: LABKEY.ActionURL.buildURL('query', 'insertQueryRow', LABKEY.ActionURL.getContainer(), {schemaName: 'lists', 'query.queryName': 'Table: Distributions', returnUrl: window.location} )},

                    /* ---- Disable test menu scripts ----/
                     {text: 'Test Script', onClick: "alert('Hello World!'); return false;"},
                     {text: 'Test Handler', handler: onTestHandler},
                     {text: 'Test Menu', items: [
                     {text: 'Item 1', handler: onItem1Handler},
                     {text: 'Fly Out', items: [
                     {text: 'Sub Item 1', handler: onItem1Handler}
                     ]},
                     '-', //separator
                     {text: 'Item 2', handler: onItem2Handler}
                     ]},
                     /---- Disable test menu scripts ---- */


                    LABKEY.QueryWebPart.standardButtons.exportRows
                ]
            },

            ///////////////////////////////////
            // Does not seem to work for read-only/joined queries
            //
            // updateURL: '/query/updateQueryRow.view?schemaName=lists&query.queryName=Table%3A%20Distributions&Dist_ID=${Dist_ID}',
            // showUpdateColumn: true,
            // insertURL: '/query/insertQueryRow.view?schemaName=lists&query.queryName=Table%3A%20Distributions',
            // showInsertNewButton: true,
            //
            ///////////////////////////////////
            //showRecordSelectors: true,

            showBorders: true,
            showSurroundingBorder: true,
            linkTarget: '_self',
            aggregates: [
                // {column: 'Created', type: LABKEY.AggregateTypes.COUNT, label: 'Requests Created'},
                // {column: 'Dist_ID', type: LABKEY.AggregateTypes.COUNT, label: 'Distributions'}
            ]

        });
    }
});

