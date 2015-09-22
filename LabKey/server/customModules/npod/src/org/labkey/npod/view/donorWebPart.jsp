<%
/*
 * Copyright (c) 2013 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
%>
<%@ page import="org.labkey.api.security.permissions.AdminPermission" %>
<%@ page import="org.labkey.api.util.UniqueID" %>
<%@ page import="org.labkey.api.view.HttpView" %>
<%@ page import="org.labkey.api.view.JspView" %>
<%@ page import="org.labkey.api.view.template.ClientDependency" %>
<%@ page import="org.labkey.npod.DonorToolsWebPartFactory" %>
<%@ page import="java.util.LinkedHashSet" %>
<%@ page extends="org.labkey.api.jsp.JspBase" %>
<%@ taglib prefix="labkey" uri="http://www.labkey.org/taglib" %>
<%!
    public LinkedHashSet<ClientDependency> getClientDependencies()
    {
        LinkedHashSet<ClientDependency> resources = new LinkedHashSet<>();
        resources.add(ClientDependency.fromFilePath("Ext4"));
        resources.add(ClientDependency.fromFilePath("/npod/ManageDonorWizard.js"));
        return resources;
    }
%>
<%
    JspView<DonorToolsWebPartFactory.DonorWebPartForm> me = (JspView<DonorToolsWebPartFactory.DonorWebPartForm>) HttpView.currentView();
    DonorToolsWebPartFactory.DonorWebPartForm bean = me.getModelBean();

    String subjectName = bean.getSubjectNoun();
    Integer primaryDatasetId = bean.getPrimaryDatasetId();
    String primaryDatasetFieldName = bean.getPrimaryDatasetFieldName();
    String includedDatasets = bean.getIncludedDatasets();       // JSON array
    String prioritySampleTypes = bean.getPrioritySampleTypes(); // JSON array

    int id = UniqueID.getRequestScopedUID(HttpView.currentRequest());
    String formRenderId = "donorwebpart-form-panel-" + id;
    String extraRenderId = "donorwebpartextra-form-panel-" + id;

    boolean isAdmin = (getContainer().hasPermission(getUser(), AdminPermission.class));
%>

<div id=<%=q(formRenderId)%>></div>
<div id=<%=q(extraRenderId)%>></div>
<script type="text/javascript">

    Ext4.onReady(function(){

        var panelItems = [];
        var newButtonName = 'New ' + '<%=h(subjectName)%>';
        var editButtonName = 'Edit ' + '<%=h(subjectName)%>';
        var newButton = Ext4.create('Ext.button.Button', {
            text: newButtonName,
            margin: '4 4 4 7',
            handler: function() {
                window.location = LABKEY.ActionURL.buildURL("npod", 'DonorWizard.view', null, null);
            },
            scope: this
        });

        var editDonorId = Ext4.create('Ext.form.field.Text', {
            text: '',
            margin: '2 2 2 2',
            scope: this
        });

        var editButton = Ext4.create('Ext.button.Button', {
            text: editButtonName,
            margin: '2 2 2 2',
            handler: function() {
                window.location = LABKEY.ActionURL.buildURL("npod", 'DonorWizard.view', null, {donorId : editDonorId.getValue()});
            },
            scope: this
        });

        panelItems.push(newButton);
        panelItems.push({
            xtype: 'panel',
            layout: {type: 'hbox', align: 'left'},
            margin: '4 4 4 4',
            items: [editButton, editDonorId]
        });

        if (<%=isAdmin%>)
        {
            var currentLocation = window.location;
            var formPanel = Ext4.create('LABKEY.ext4.npod.ManageDonorWizardPanel', {
                renderTo    : <%=q(extraRenderId)%>,
                hidden          : true,
                standardSubmit  : true,
                bodyStyle       :'background-color: transparent;',
                bodyPadding     : 10,
                border          : true,
                buttonAlign     : "left",
                width           : 1020,
                title           : 'Manage NPOD Case Wizard',
                header          : true,
                margin          : '4 0 4 0',

                primaryDatasetId: <%=primaryDatasetId%>,
                primaryDatasetFieldName: '<%=text(primaryDatasetFieldName)%>',
                includedDatasets: <%=text(includedDatasets)%>,
                prioritySampleTypes: <%=text(prioritySampleTypes)%>,

                dockedItems: [{
                    xtype: 'toolbar',
                    dock: 'top',
                    style: 'background-color: transparent;',
                    items: [{
                        text : 'Save',
                        handler : function(btn) {
                            var form = btn.up('form').getForm();
                            if (form.isValid())
                            {
                                var includedDatasets = formPanel.getSelectedIds('includedDatasetsGrid', 'DataSetId');
                                var priorityTypes = formPanel.getSelectedIds('priorityTypesGrid', 'RowId');
                                Ext4.Ajax.request({
                                    url: LABKEY.ActionURL.buildURL("npod", "manageDonorWizard.api", null),
                                    waitMsg:'Saving changes...',
                                    method: 'POST',
                                    jsonData : Ext4.encode({
                                        primaryDataset: form.getValues()['primaryDataset'],
                                        includedDatasets : includedDatasets,
                                        priorityTypes: priorityTypes
                                    }),
                                    success: function() {
                                        Ext.Msg.alert("Save Changes", "Changes saved successfully");
                                        formPanel.setVisible(false);
                                    },
                                    failure: function(form, action) {
                                        Ext.Msg.alert("Save Error", "An error occurred while saving the changes");
                                    }
                                });
                            }
                        },
                        scope   : this
                    },{
                        text: 'Cancel',
                        handler: function(){
                            if(LABKEY.ActionURL.getParameter('returnUrl')){
                                window.location = LABKEY.ActionURL.getParameter('returnUrl');
                            } else {
                                window.location = LABKEY.ActionURL.buildURL('project', 'begin');
                            }
                        }
                    }]
                }]
            });

            var manageButtonConfig = {
                xtype: 'button',
                text: Ext.DomHelper.markup({tag:'div', html: 'Manage Form', style: 'font-size: 6pt; font-style: italic'}),
                margin: '4 4 2 7',
                tooltip: 'Manage the datasets and sample types that appear in the wizard.',
                handler: function() {
                    formPanel.setVisible(!formPanel.isVisible());
                },
                scope: this
            };

            var manageSampleColumnsConfig = {
                xtype: 'button',
                text: Ext.DomHelper.markup({tag:'div', html: 'Manage Sample Columns', style: 'font-size: 6pt; font-style: italic'}),
                margin: '4 4 2 7',
                tooltip: 'Create or Customize DonorWizardView to control the columns in the Samples sections.',
                handler: function() {
                    window.location = LABKEY.ActionURL.buildURL("query", 'executeQuery.view', null, {
                        schemaName : 'study',
                        queryName: 'SpecimenDetail',
                        'query.viewName' : 'DonorWizardView'
                    });
                },
                scope: this
            };

            panelItems.push({
                xtype: 'panel',
                layout: {type: 'hbox', align: 'left'},
                margin: '4 4 4 4',
                items: [manageButtonConfig, manageSampleColumnsConfig]
            });

        }

        var panel = Ext4.create('Ext.panel.Panel', {
            cls         : 'themed-panel',
            layout: {type: 'vbox', align: 'top'},
            renderTo    : <%=q(formRenderId)%>,
            width       : 575,
            border      : false,
            items       : panelItems
        });

    });

</script>