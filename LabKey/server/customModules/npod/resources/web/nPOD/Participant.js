/*
 * Copyright (c) 2013 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
Ext4.define('Ext.npod.Participant', {

    extend : 'Ext.panel.Panel',

    border : false,
    frame  : false,
    manageHeight : false,

    cls : 'wrapper',

    showDemographics : true,
    showTissue : true,
    showInvestigators : true,
    showActive : true,
    showPathology : true,

    subjectID : null,

    initComponent : function() {

        if (!this.subjectID) {
            throw new Error("subjectID is required to initialize Ext.npod.Participant.");
        }

        var sql = 'SELECT A.nPODCaseID, D."DonorType", D.Age, D.Gender, D.Race, D.BMI, ' +
                'I.oppc_HbA1cR AS "HbA1cLevels", ' +
                'I.oppc_C_peptideR AS "CpeptideLevels", ' +
                'A.HiRes_HLA AS "HighResolutionHLA", ' +
                'I."DurationYears" ' +
                'FROM "HiRes HLA Post Receipt of Organ" AS "A" ' +
                'INNER JOIN ( ' +
                    'SELECT d.nPODCaseID, d.DonorType AS "DonorType", d.oppc_ageR AS Age, ' +
                    'd.oppc_Gender AS Gender, d.oppc_Ethnicity AS "Race", d.oppc_bmiR AS "BMI" ' +
                    'FROM "Demographics" as "d" ' +
                ') AS D ON A.nPODCaseID = D.nPODCaseID ' +
                'INNER JOIN ( ' +
                    'SELECT nPODCaseID, Diabetes_Duration_yrs AS "DurationYears", oppc_HbA1cR, oppc_C_peptideR ' +
                    'FROM "Diabetes Information"' +
                ') AS I ON A.nPODCaseID = I.nPODCaseID ' +
                'WHERE A.nPODCaseID=\'' + this.subjectID + '\'';

        this.items = [ this.initTabs() ];

        this.store = Ext4.create('LABKEY.ext4.data.Store', {
            schemaName : 'study',
            sql : sql,
            autoLoad : true,
            listeners : {
                load : function(s) {
                    this.updateSubject(s.getAt(0));
                },
                scope : this
            },
            scope : this
        });

        this.callParent();
    },

    initTabs : function() {

        var pageItems = [], subItems = [];

        var me = this;
        var check = function(items, cfg, flag) {
            if (flag) { items.push(cfg.call(me)); }
        };

        /* ITEMS ON LEFT */
        check(pageItems, this.getDemographicsCfg, this.showDemographics);
        check(pageItems, this.getInvestigatorCfg, this.showInvestigators);
        check(pageItems, this.getActiveProjectsCfg, this.showActive);

        /* ITEMS ON RIGHT */
        check(subItems, this.getTissueCfg, this.showTissue);
        check(subItems, this.getPathologyCfg, this.showPathology);

        this.tabs = Ext4.create('Ext.Container', {
            items : [{
                xtype : 'container',
                id : 'maininfo',
                items : pageItems
            },{
                xtype : 'container',
                id : 'subinfo',
                items : subItems
            }]
        });

        return this.tabs;
    },

    updateSubject : function(subject) {
        var c = Ext4.getCmp('demographics-' + this.subjectID);
        if (c) { c.update(subject.data); }
    },

    getActiveProjectsCfg : function() {
        var tpl = new Ext4.XTemplate(
            '<div id="activity">',
                '<h2>Active Projects</h2>',
                '<div id="activity-content" class="main-body">',
                    '<tpl if="emptydisplay">',
                        '<div>Activities not available.</div>',
                    '</tpl>',
                    '<div class="detail">',

                        /************  05/19/15 sfuertez - Disabled due to combined SQL in study.ActiveProjects query.
                        '<tpl for="rows">',
                            '<details>',
                            '<p><summary><a href="javascript:void(0)" target="_self">{Description}</a></summary></p>',
                            '<table class="detail">',
                                '<tr><td class="label"  width="80px">Investigator</td><td>{Investigator:this.renderNull}</td></tr>',
                                '<tpl if="Email">',
                                    '<tr><td class="label">Email</td><td>{Email:this.renderNull}</td></tr>',
                                '</tpl>',
                                '<tpl if="Phone">',
                                    '<tr><td class="label">Phone</td><td>{Phone:this.renderNull}</td></tr>',
                                '</tpl>',
                                '<tpl if="Category1">',
                                    '<tr><td class="label">Category</td><td>{Category1:this.renderNull}</td></tr>',
                                '</tpl>',
                            '</table>',
                            '</details>',
                        '</tpl>',

                        '<tpl for="rows2">',
                            '<details>',
                            '<tpl if="ProjectTitle">',
                                '<p><summary><a href="javascript:void(0)" target="_self">{ProjectTitle}</a></summary></p>',
                                '<table class="detail">',
                                    '<tr><td class="label"  width="80px">Investigator</td><td>{Salutation}{fullname:this.renderNull}</td></tr>',
                                    '<tr><td class="label">Email</td><td>{Email:this.renderNull}</td></tr>',
                                    '<tr><td class="label">Phone</td><td>{Office_Phone:this.renderNull}</td></tr>',
                                    '<tr><td class="label">Category</td><td>{Category1:this.renderNull}</td></tr>',
                                '</table>',
                            '</tpl>',
                            '</details>',
                        '</tpl>',
                        ************/

                        '<tpl for="categories">',
                            '<details>',
                                '<p><summary><B><a href="javascript:void(0)" target="_self">{name}</a></B></summary></p>',

                                '<tpl for="rows">',
                                    '<tpl if="ProjectTitle">',
                                    '<p><a href="javascript:void(0)" target="_self">{ProjectTitle}</a></p>',
                                    '<table class="detail">',
                                        '<tr><td class="label"  width="80px">Investigator</td><td>{Salutation}{fullname:this.renderNull}</td></tr>',
                                        '<tr><td class="label">Email</td><td>{Email:this.renderNull}</td></tr>',
                                        '<tr><td class="label">Phone</td><td>{Office_phone:this.renderNull}</td></tr>',
                                        '<tr><td class="label">Category</td><td>{Category1:this.renderNull}</td></tr>',
                                    '</table>',
                                '</tpl>',
                                '</tpl>',
                            '</details>',
                        '</tpl>',

                    '</div>',
                '</div>',
            '</div>',
            {
                renderNull : function(v) {
                    if (v == null) {
                        return '--';
                    }
                    return v;
                }
            }
        );

        // ---------------------------------------------------------------

        LABKEY.Query.getQueryDetails({
            schemaName : 'study',
            queryName  : 'StudyProperties',
            success    : function(details) {
                var colsByName = {};
                for (var d=0; d < details.columns.length; d++) {
                    colsByName[details.columns[d].name] = true;
                }

//                var sql = 'SELECT ' +
//                    'A.container, ' +
//                    'A.container.name AS "ContainerName", ' +
//                    '"SP".Description, ' +
//                    '"SP".Investigator, ' +
//                    (colsByName['Phone'] ? '"SP".Phone, ' : '') +
//                    (colsByName['Email'] ? '"SP".Email, ' : '') +
//                'FROM study.nPODCaseID AS A ' +
//                'INNER JOIN ( ' +
//                '	SELECT * FROM study.StudyProperties ' +
//                ') AS "SP" ON "SP".Container.Name = A.container.Name ' +
//                'WHERE nPODCaseID=\'' + this.subjectID + '\' AND A.container.Name != \'' + LABKEY.container.name + '\' ' +
//                'ORDER BY A.container.name LIMIT 10000'; // See #8451 for LIMIT requirement

                var dataCombined = null;


                /************ 05/19/15 sfuertez - Disabled due to combined SQL in study.ActiveProjects query.
                 var sql = 'SELECT project_titles as Description, Investigator, Office_phone, Email, Category1, Folder_name FROM lists.Studies WHERE record_id LIKE \'%' + this.subjectID + '%\'';

                LABKEY.Query.executeSql({
                    schemaName : 'study',
                    sql : sql,
                    sort : 'Category1',
                    containerFilter : LABKEY.Query.containerFilter.currentAndSubfolders,
                    apiVersion : 9.1,
                    success : function(d) {
                        var active = Ext4.getCmp('activity-' + this.subjectID);

                        // Save combined data.
                        if (d && dataCombined == null) {
                            dataCombined = d;
                        } else {
                            dataCombined.rows = d.rows;
                        }

                        if (active && d && d.rows.length > 0) {
                            active.update(dataCombined);
                        }
                    },
                    failure : function(response) {
                        if (response && response.exception) {
                            console.log('ACTIVE PROJECTS: ' + response.exception);
                        }
                    },
                    scope : this
                });
                **********************************/

                LABKEY.Query.selectRows({
                    schemaName : 'study',
                    queryName : 'ActiveProjects',
                    sort : 'Category1',
                    filterArray  : [
                                    LABKEY.Filter.create('nPODCaseID',this.subjectID,LABKEY.Filter.Types.CONTAINS )
                                   ],
                    apiVersion : 9.1,
                    success : function(d) {
                        var active = Ext4.getCmp('activity-' + this.subjectID);

                        // Save combined data.
                        //   Note - row2 array obsolete with ActiveProjects combined query - sfuertez 5/19/15
                        if (d && dataCombined == null) {
                            dataCombined = d;
                            dataCombined.rows2 = d.rows;
                        } else {
                            dataCombined.rows2 = d.rows;
                        }

                        // Group elements into Categories.
                        var projectSubArray = {};       // Project Subarray for current cateogry.
                        var startCatSubarray = 0;      // Start of category subarray.  Init to 0, first item.
                        var endCatSubarray = -1;        // End of category subarray.
                        var currentCategorySet = {categories : []};    // Cateogry object:  {CategoryName, ProjectSubArray}
                        var rowCategory = {};    // Data for template in category grouping format.

                        // Valid result set.
                        if (d) {

                            rowCategory = {name: d.rows[0].Category1 , rows: [] };    // Init to first Category.

                            // Create Category/Rowset objects.
                            var i = 0;
                            for(i=0;i< d.rows.length;i++) {

                                // Check for Category name change
                                if(d.rows[i].Category1 != rowCategory.name)
                                {
                                    // Prepare Category subarray
                                    endCatSubarray = i;
                                    rowCategory = {name: d.rows[i-1].Category1, rows: d.rows.slice(startCatSubarray,endCatSubarray)}

                                    // Add new category and row set.
                                    currentCategorySet.categories.push(rowCategory);

                                    // Reinitialize next Category.
                                    startCatSubarray = i;
                                    rowCategory = {name: d.rows[startCatSubarray].Category1 , rows: [] };

                                }

                            }

                            // Always add last Category
                            endCatSubarray = i;
                            rowCategory = {name: d.rows[i-1].Category1, rows: d.rows.slice(startCatSubarray,endCatSubarray)}

                            // Add last new category and row set.
                            currentCategorySet.categories.push(rowCategory);


                            // Set data to be rendered.
                            dataCombined = currentCategorySet;

                        }

                        if (active && d && dataCombined && d.rows.length > 0) {
                            active.update(dataCombined);
                        }
                    },
                    failure : function(response) {
                        if (response && response.exception) {
                            console.log('ACTIVE PROJECTS: ' + response.exception);
                        }
                    },
                    scope : this
                });

            },
            failure : function(response) {
                if (response && response.exception) {
                    console.log('STUDY PROP DETAILS: ' + response.exception);
                }
            },
            scope : this
        });

        // ---------------------------------------------------------------

        return {
            id : 'activity-' + this.subjectID,
            xtype : 'component',
            tpl : tpl,
            border : false, frame : false,
            cls : 'main',
            data : {emptydisplay: true}
        };
    },



    getDemographicsCfg : function() {

        var tpl = new Ext4.XTemplate(
            '<div id="demographics" class="main">',
                '<h2>Information</h2>',
                '<div id="demographics-content">',
                    '<h3 style="background: url(' + LABKEY.contextPath + '/nPOD/images/pie.png) no-repeat; background-size: 60px;">Demographics</h3>',
                    '<table class="detail" style="margin-left: 30px">',
                        '<tr><td class="label">Age/Gender</td><td>{Age:this.renderAge}{Gender:this.renderGender}</td></tr>',
                        '<tr><td class="label"  width="120px">Race</td><td>{Race}</td></tr>',
                        '<tr><td class="label">BMI</td><td>{BMI:this.renderBMI}</td></tr>',
                    '</table>',
                    '<h3 style="background:  url(' + LABKEY.contextPath + '/nPOD/images/diabetes_bc.svg) no-repeat; background-size: 35px; background-position: 12px 0; ">Diabetes</h3>',
                    '<table class="detail" style="margin-left: 30px">',
                        '<tr><td class="label">Donor Type</td><td>{DonorType}</td></tr>',
                        '<tr><td class="label" width="120px">High Resolution HLA</td><td>{HighResolutionHLA}</td></tr>',
                        '<tr><td class="label">C Peptide Levels</td><td>{CpeptideLevels:this.renderNull}</td></tr>',
                        '<tr><td class="label">Duration (Years)</td><td>{DurationYears:this.renderNull}</td></tr>',
                    '</table>',
                '</div>',
            '</div>',
                {
                    renderAge : function(age) {
                        if (null == age) {
                            return '-';
                        }
                        return Ext4.util.Format.round(age, 3) + ' year old ';
                    },
                    renderBMI : function(bmi) {
                        if (null == bmi) {
                            return this.renderNull(bmi);
                        }
                        return Ext4.util.Format.round(bmi, 2);
                    },
                    renderGender : function(v) {
                        if (null == v || v.length == 0) {
                            return '-';
                        }
                        if (v.toLowerCase() == 'm')
                            return 'Male';
                        if (v.toLowerCase() == 'f')
                            return 'Female';
                        return v;
                    },
                    renderNull : function(v) {
                        if (v == null) {
                            return '--';
                        }
                        return v;
                    }
                }
        );

        return {
            xtype : 'component',
            id : 'demographics-' + this.subjectID,
            tpl : tpl,
            border : false, frame : false,
            data : {}
        };
    },

    getDiabetesCfg : function() {

        var sql = 'SELECT A.nPODCaseID AS "Case ID", B.oppc_HbA1c AS "HbA1c Levels", ' +
                  'A.oppc_C_peptide AS "C_peptide Levels", ' +
                  'A.oppc_HLA_Transplant AS "High Resolution HLA", ' +
                  'B.diabetes_Duration_yrs AS "Duration Years" ' +
                  'FROM "HiRes HLA Post Receipt of Organ" AS "A" ' +
                  'LEFT JOIN "Diabetes Information" AS "B" ' +
                  'ON A.nPODCaseID = B.nPODCaseID ' +
                  'WHERE A.nPODCaseID = \'' + this.subjectID +'\'';

        var store = Ext4.create('LABKEY.ext4.data.Store', {
            schemaName : 'study',
            sql : sql,
            autoLoad : true
        });

        var _columns = [
            { text : 'Duration Years', dataIndex : 'Duration Years' },
            { text : 'HbA1c Levels', dataIndex : 'HbA1c Levels' },
            { text : 'C_peptide Levels', dataIndex : 'C_peptide Levels' },
            { text : 'High Resolution HLA', dataIndex : 'High Resolution HLA' }
        ];

        return {
            xtype : 'grid',
            title : 'Diabetes Information',
            store : store,
            columns : _columns
        }
    },

    getInvestigatorCfg : function() {

//        var tpl = new Ext4.XTemplate(
//            '<div id="investigator" class="main">',
//                '<h2>Investigator Reports</h2>',
//                '<div id="investigator-content" class="main-body">',
//                    '<tpl if="emptydisplay">',
//                        '<div>Investigator Reports not available.</div>',
//                    '</tpl>',
//                    '<div class="detail">',
//                    '<tpl for="rows">',
//                        '<div style="margin-bottom: 1.5em;">',
//                            '<p><a href="http://www.ncbi.nlm.nih.gov/pubmed/{PMID}" target="_blank">{Title}</a></p>',
//                            '<div><p>{Authors}</p></div>',
//                            '<div class="label">{Journal}, {Year}</div>',
//                            '<div class="label">PMID: {PMID}</div>',
//                        '</div>',
//                    '</tpl>',
//                    '</div>',
//                '</div>',
//            '</div>'
//        );

        var tpl = new Ext4.XTemplate(
            '<div id="investigator" class="main">',
                '<h2>Investigator Reports</h2>',
                '<div id="investigator-content" class="main-body">',
                    '<tpl if="emptydisplay">',
                        '<div>Investigator Reports not available.</div>',
                    '</tpl>',
                    '<div class="detail">',

                        '<tpl for="years">',
                            '<details>',
                            '<p><summary><B><a href="javascript:void(0)" target="_self">{year}</a></B></summary></p>',
                            '<tpl for="rows">',
                                '<div style="margin-bottom: 1.5em;">',
                                    '<p><a href="http://www.ncbi.nlm.nih.gov/pubmed/{PMID}" target="_blank">{Title}</a></p>',
                                    '<div><p>{Authors}</p></div>',
                                    '<div class="label">{Journal}, {Year}</div>',
                                    '<div class="label">PMID: {PMID}</div>',
                                    '<p><a href="{_labkeyurl_container}" target="_blank">Learn more...</a></p>',
                                '</div>',
                            '</tpl>',
                            '</details>',
                        '</tpl>',

                    '</div>',
                '</div>',
            '</div>'
        );


        // ---------------------------------------------------------------
//        var sql = 'SELECT PMID, Journal, Year, Authors, Title FROM lists.Publications WHERE CaseIds LIKE \'%' + this.subjectID + '%\'';
//
//        LABKEY.Query.executeSql({
//            schemaName : 'lists',
//            sql : sql,
//            apiVersion : 9.1,
//            success : function(d) {
//                var investigate = Ext4.getCmp('investigator-' + this.subjectID);
//                if (d.rows && d.rows.length > 0)
//                    investigate.update(d);
//            },
//            failure : function(response) {
//                if (response && response.exception) {
//                    console.log('INVESTIGATOR REPORTS: ' + response.exception);
//                }
//            },
//            scope : this
//        });
        // ---------------------------------------------------------------


        // ---------------------------------------------------------------

        LABKEY.Query.getQueryDetails({
            schemaName : 'study',
            queryName  : 'StudyProperties',
            success    : function(details) {
                var colsByName = {};
                for (var d=0; d < details.columns.length; d++) {
                    colsByName[details.columns[d].name] = true;
                }

                var sql = 'SELECT ' +
                    'A.container, ' +
                    'A.container.name AS "ContainerName", ' +
                    '"SP".Description, ' +
                    '"SP".Investigator, ' +
                    (colsByName['Phone'] ? '"SP".Phone, ' : '')  +
                    (colsByName['Email'] ? '"SP".Email, ' : '') +
                    (colsByName['PMID'] ? '"SP".PMID, ' : '') +
                    (colsByName['Journal'] ? '"SP".Journal, ' : '') +
                    (colsByName['Year'] ? '"SP".Year, ' : '') +
                    (colsByName['Authors'] ? '"SP".Authors, ' : '') +
                    (colsByName['Title'] ? '"SP".Title, ' : '') +
                    (colsByName['CaseIds'] ? '"SP".CaseIds, ' : '') +
                'FROM study.nPODCaseID AS A ' +
                'INNER JOIN ( ' +
                '	SELECT * FROM study.StudyProperties ' +
                ') AS "SP" ON "SP".Container.Name = A.container.Name ' +
                'WHERE nPODCaseID=\'' + this.subjectID + '\' AND A.container.Name != \'' + LABKEY.container.name + '\' ' +
                'ORDER BY A.container.name LIMIT 10000'; // See #8451 for LIMIT requirement

                var dataCombined = null;

                LABKEY.Query.executeSql({
                    schemaName : 'study',
                    sql : sql,
                    sort : 'Year',
                    containerFilter : LABKEY.Query.containerFilter.currentAndSubfolders,
                    apiVersion : 9.1,
                    success : function(d) {
                        var active = Ext4.getCmp('investigator-' + this.subjectID);

                        // Group elements into Year.
                        var projectSubArray = {};       // Project Subarray for current grouping.
                        var startSubarray = 0;      // Start of subarray.  Init to 0, first item.
                        var endSubarray = -1;        // End of subarray.
                        var currentSet = {years : []};    // Year object:  {year, ProjectSubArray}
                        var rowYear = {};    // Data for template in object grouping format.

                        // Valid result set.
                        if (d) {

                            rowYear = {year: d.rows[0].Year , rows: [] };    // Init to first object.

                            // Create Rowset objects.
                            var i = 0;
                            for(i=0;i< d.rows.length;i++) {

                                // Check for group name/identifier change
                                if(d.rows[i].Year != rowYear.year)
                                {
                                    // Prepare subarray
                                    endSubarray = i;
                                    rowYear = {year: d.rows[i-1].Year, rows: d.rows.slice(startSubarray,endSubarray)};

                                    // Add new row set.
                                    //   Check if year is blank.  If so, do not add  - 07/06/15 sfuertez
                                    if(rowYear.year != null) {
                                        currentSet.years.push(rowYear);
                                    }

                                    // Reinitialize next object.
                                    startSubarray = i;
                                    rowYear = {year: d.rows[startSubarray].Year , rows: [] };

                                }

                            }

                            // Always add last object
                            endSubarray = i;
                            rowYear = {year: d.rows[i-1].Year, rows: d.rows.slice(startSubarray,endSubarray)};

                            // Add last new object and row set.
                            //   Check if year is blank.  If so, do not add  - 07/06/15 sfuertez
                            if(rowYear.year != null) {
                                currentSet.years.push(rowYear);
                            }

                            // Set data to be rendered.
                            dataCombined = currentSet;

                        }

                        if (active && d && dataCombined && d.rows.length > 0) {
                            active.update(dataCombined);
                        }
                    },
                    failure : function(response) {
                        if (response && response.exception) {
                            console.log('INVESTIGATOR REPORTS: ' + response.exception);
                        }
                    },
                    scope : this
                });
            },
            failure : function(response) {
                if (response && response.exception) {
                    console.log('INVESTIGATOR REPORTS: ' + response.exception);
                }
            },
            scope : this
        });

        // ---------------------------------------------------------------

        return {
            xtype : 'component',
            id    : 'investigator-' + this.subjectID,
            tpl : tpl,
            data : {emptydisplay: true}
        };
    },

    getTissueCfg : function() {

        var me = this;
        var tpl = new Ext4.XTemplate(
            '<div id="tissue" class="main">',
                '<h2>Tissue Recovered</h2>',
                '<div id="tissue-content" class="main-body">',
                    '<table class="detail">',
                    '<tpl for="rows">',
                        '<tr><td><a href={[this.renderURL(values.Description)]} target="_blank">{Description}</a></td><td style="text-align: right; width: 150px;"></td></tr>',
                    '</tpl>',
                    '</table>',
                '</div>',
            '</div>',
            {
                renderURL : function(v) {
                    var params = {};
                    var caseIDfilter = LABKEY.Filter.create('SpecimenDetail.nPODCaseID', me.subjectID);  // 06/26/14 SF - Change to specimen detail instead of summary.
                    var ptFilter = LABKEY.Filter.create('SpecimenDetail.PrimaryType/Description', v);  // 06/26/14 SF - Change to specimen detail instead of summary.
                    params[caseIDfilter.getURLParameterName().replace('query.', '')] = caseIDfilter.getURLParameterValue();
                    params[ptFilter.getURLParameterName().replace('query.', '')] = ptFilter.getURLParameterValue();
                    params['showVials'] = true;   // 06/26/2014 SF - Default to Vials view instead of Groupd Vials (Specimen Summary)
                    return LABKEY.ActionURL.buildURL('study-samples', 'samples.view', null, params);
                }
            }
        );

        var sql = 'SELECT DISTINCT PrimaryType.Description, ' +
                  'COUNT(PrimaryType) AS "TypeCount" ' +
                  'FROM SimpleSpecimen AS SS ' +
                  'WHERE nPODCaseID=\'' + this.subjectID + '\' ' +
                  'GROUP BY PrimaryType.Description';

        LABKEY.Query.executeSql({
            schemaName : 'study',
            sql : sql,
            apiVersion : 9.1,
            success : function(d) {
                var tissues = Ext4.getCmp('tissue-' + this.subjectID);
                tissues.update(d);
            },
            failure : function(response) {
                if (response && response.exception) {
                    console.log('TISSUE INVENTORY: ' + response.exception);
                }
            },
            scope : this
        });

        return {
            id    : 'tissue-' + this.subjectID,
            xtype : 'component',
            tpl : tpl,
            data : {}
        };
    },

    getPathologyCfg : function() {

        var _id = 'pathology-content';
        var tpl = new Ext4.XTemplate(
             '<div id="pathology">',
                '<h2>Pathology Images</h2>',
                '<div id="' + _id + '" class="main-body">',
                    '<tpl if="emptydisplay">',
                        '<div>Pathology Images not available.</div>',
                    '</tpl>',
                '</div>',
            '</div>'
        );

        return {
            xtype : 'component',
            tpl : tpl,
            cls  : 'main',
            data : {emptydisplay: true},
            listeners : {
                afterrender : function() {

                    var supportedExtensions = {'jpg':true, 'jpeg':true, 'png':true, 'gif':true};
                    var path = LABKEY.contextPath + "/_webdav" + LABKEY.container.path + "/@files/pathology_images/" + this.subjectID;
                    var sql = 'SELECT * FROM ImageMetadata WHERE nPOD_caseID = \'' + this.subjectID + '\'';
                    var meta = {}, imgs = [],
                        metaReady = false,
                        imgReady = false;

                    var load = function() {
                        if (imgReady && metaReady) {

                            var fields = [], fieldSet = false;

                            // Merge metadata and image information
                            for (var i=0; i < imgs.length; i++) {
                                if (imgs[i].name && imgs[i].name.length > 0) {
                                    var name = imgs[i].name.split('.')[0].toLowerCase();
                                    if (meta[name]) {
                                        Ext4.applyIf(imgs[i], meta[name]);
                                        if (!fieldSet) {
                                            fieldSet = true;
                                            for (var p in imgs[i]) {
                                                if (imgs[i].hasOwnProperty(p)) {
                                                    fields.push(p);
                                                }
                                            }
                                        }
                                        // Title can specifically be overridden
                                        if (meta[name]['image_title'] && meta[name]['image_title'].length > 0) {
                                            imgs[i]['title'] = meta[name]['image_title'];
                                        }
                                    }
                                }
                            }

                            if (!fieldSet || fields.length == 0) {
                                fields = ['id', 'src', 'title'];
                            }

                            var store = Ext4.create('Ext.data.Store', {
                                fields : fields,
                                data : imgs
                            });

                            // Only display supported file types
                            store.filterBy(function(r) {
                                if (r.data.src && r.data.src.length > 0) {
                                    var p = r.data.src.split('.');
                                    var ext = p[p.length-1]; // get image extension
                                    if (supportedExtensions[ext]) {
                                        return true;
                                    }
                                }
                                return false;
                            }, this);

                            Ext4.get(_id).update('');
                            Ext4.create('LABKEY.ext4.ImageViewer', {
                                renderTo : _id,
                                store : store,
                                winTitle : 'Pathology Images'
                            });
                        }
                    };

                    var handleListing = function(response) {
                        var j = Ext4.decode(response.responseText);
                        var html = [], images = [];
                        var files, i, f, isImg, name;

                        // 17038 -- API's differ between versions
                        if (Ext4.isArray(j)) {
                            files = j;
                        }
                        else {
                            files = j.files;
                        }

                        for (i=0; i < files.length; i++) {
                            f = files[i], isImg = false;
                            name = f.id.substring(f.id.lastIndexOf('/')+1);

                            if (f.contenttype) {
                                isImg = f.contenttype && f.contenttype.match(/image\/.*/);
                            }
                            if (!isImg) {
                                continue;
                            }

                            html.push(name);
                            images.push({ id:f.href, src:f.href, title:name, name:name });
                        }
                        imgs = images;
                        imgReady = true;
                        load();
                    };

                    var handleMeta = function(data) {
                        var img;
                        for (var r=0; r < data.rows.length; r++) {
                            img = data.rows[r];
                            if (img['image_file_name']) {
                                meta[img['image_file_name'].toLowerCase()] = img;
                            }
                        }
                        metaReady = true;
                        load();
                    };

                    Ext4.Ajax.request({
                        url : path + '?method=json',
                        success : handleListing,
                        failure : function(response) {
                            if (response && response.exception) {
                                console.log('IMAGE REQUEST: ' + response.exception);
                            }
                        }
                    });

                    LABKEY.Query.executeSql({
                        schemaName : 'lists',
                        sql : sql,
                        success : handleMeta,
                        failure : function(response) {
                            metaReady = true;
                            if (response && response.exception) {
                                console.log('IMAGE METADATA: ' + response.exception);
                            }
                        }
                    });
                },
                scope : this
            }
        }
    }
});
