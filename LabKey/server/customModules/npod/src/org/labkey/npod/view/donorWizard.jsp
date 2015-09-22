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

<%@ page import="org.labkey.api.view.HttpView" %>
<%@ page import="org.labkey.api.view.template.ClientDependency" %>
<%@ page import="java.util.LinkedHashSet" %>
<%@ page import="org.labkey.api.view.JspView" %>
<%@ page import="org.labkey.api.util.UniqueID" %>
<%@ page import="org.labkey.npod.npodController" %>
<%@ page extends="org.labkey.api.jsp.JspBase" %>
<%@ taglib prefix="labkey" uri="http://www.labkey.org/taglib" %>
<%!
    public LinkedHashSet<ClientDependency> getClientDependencies()
    {
        LinkedHashSet<ClientDependency> resources = new LinkedHashSet<>();
        resources.add(ClientDependency.fromFilePath("Ext4"));
        resources.add(ClientDependency.fromFilePath("/survey/Survey.css"));
        resources.add(ClientDependency.fromFilePath("/survey/BaseSurveyPanel.js"));
        resources.add(ClientDependency.fromFilePath("/survey/UsersCombo.js"));
        resources.add(ClientDependency.fromFilePath("/npod/DonorWizard.js"));
        return resources;
    }
%>
<%
    JspView<npodController.DonorWizardForm> me = (JspView<npodController.DonorWizardForm>) HttpView.currentView();
    npodController.DonorWizardForm bean = me.getModelBean();

    // for the NWBT setup, we expect the survey designs to exist at the project level
    int designId = bean.getSurveyDesignId();
    String donorId = bean.getDonorId();

    String formRenderId = "request-form-panel-" + UniqueID.getRequestScopedUID(HttpView.currentRequest());
%>

<%
    if (getErrors("form").hasErrors())
    {
%><%=formatMissedErrors("form")%><%
    }
    else
    {
%>
<div id=<%=q(formRenderId)%>></div>
<script type="text/javascript">

    Ext4.onReady(function(){

        var panel = Ext4.create('LABKEY.ext4.npod.DonorWizard', {
            cls             : 'lk-survey-panel themed-panel',
            donorId         : <%=null != donorId%> ? '<%=h(donorId)%>' : null,
            subjectColumnName : '<%=h(bean.getSubjectColumnName())%>',
            isSubmitted     : false,
            canEdit         : true,
            canEditSubmitted : true,
            renderTo        : <%=q(formRenderId)%>,
            studyId         : 0,
            surveyDesignId  : <%=designId%>,
            studySurveyDesignId : 0,
            autosaveInterval: 60000
        });

    });

</script>
<%
    }
%>