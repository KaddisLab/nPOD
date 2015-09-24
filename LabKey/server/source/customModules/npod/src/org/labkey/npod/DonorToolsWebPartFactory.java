/*
 * Copyright (c) 2013-2014 LabKey Corporation
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
package org.labkey.npod;

import org.json.JSONArray;
import org.labkey.api.data.Container;
import org.labkey.api.data.TableSelector;
import org.labkey.api.query.QueryService;
import org.labkey.api.query.UserSchema;
import org.labkey.api.security.RequiresPermissionClass;
import org.labkey.api.security.User;
import org.labkey.api.security.permissions.EditSpecimenDataPermission;
import org.labkey.api.study.DataSet;
import org.labkey.api.study.Study;
import org.labkey.api.study.StudyService;
import org.labkey.api.view.BaseWebPartFactory;
import org.labkey.api.view.JspView;
import org.labkey.api.view.Portal;
import org.labkey.api.view.ViewContext;
import org.labkey.api.view.WebPartView;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * User: davebradlee
 * Date: 7/12/13
 */
@RequiresPermissionClass(EditSpecimenDataPermission.class)
public class DonorToolsWebPartFactory extends BaseWebPartFactory
{
    private static final String WEBPART_NAME = "NPOD Case Tools";
    public DonorToolsWebPartFactory()
    {
        super(WEBPART_NAME, null, false, false);
    }

    @Override
    public String getDisplayName(Container container, String location)
    {
        return WEBPART_NAME;

    }

    public WebPartView getWebPartView(ViewContext portalCtx, Portal.WebPart webPart) throws Exception
    {
        String subjectNoun = StudyService.get().getSubjectNounSingular(portalCtx.getContainer());
        DonorWebPartForm form = new DonorWebPartForm();
        form.setSubjectNoun(subjectNoun);

        DonorToolsSettings donorToolsSettings = DonorToolsSettings.getDonorToolsSettings(portalCtx.getContainer());
        Study study = StudyService.get().getStudy(portalCtx.getContainer());
        if (null != study)
            setDonorSettingsDefaults(donorToolsSettings, study, portalCtx.getUser());

        form.setPrimaryDatasetId(null != donorToolsSettings.getPrimaryDatasetId() ? donorToolsSettings.getPrimaryDatasetId() : -1);
        form.setPrimaryDatasetFieldName(donorToolsSettings.getPrimaryDatasetFieldName());
        form.setIncludedDatasets(new JSONArray(donorToolsSettings.getIncludedDatasetIds()).toString());
        form.setPrioritySampleTypes(new JSONArray(donorToolsSettings.getPrioritySampleTypes()).toString());
        WebPartView view = new JspView<>("/org/labkey/npod/view/donorWebPart.jsp", form);
        view.setFrame(WebPartView.FrameType.PORTAL);
        view.setTitle(subjectNoun + " Tools");
        return view;
    }

    public static class DonorWebPartForm
    {
        private String _subjectNoun;
        private int _primaryDatasetId;
        private String _primaryDatasetFieldName;
        private String _includedDatasets;       // JSON array
        private String _prioritySampleTypes;    // JSON array

        public String getSubjectNoun()
        {
            return _subjectNoun;
        }

        public void setSubjectNoun(String subjectNoun)
        {
            _subjectNoun = subjectNoun;
        }

        public int getPrimaryDatasetId()
        {
            return _primaryDatasetId;
        }

        public void setPrimaryDatasetId(int primaryDatasetId)
        {
            _primaryDatasetId = primaryDatasetId;
        }

        public String getPrimaryDatasetFieldName()
        {
            return _primaryDatasetFieldName;
        }

        public void setPrimaryDatasetFieldName(String primaryDatasetFieldName)
        {
            _primaryDatasetFieldName = primaryDatasetFieldName;
        }

        public String getIncludedDatasets()
        {
            return _includedDatasets;
        }

        public void setIncludedDatasets(String includedDatasets)
        {
            _includedDatasets = includedDatasets;
        }

        public String getPrioritySampleTypes()
        {
            return _prioritySampleTypes;
        }

        public void setPrioritySampleTypes(String prioritySampleTypes)
        {
            _prioritySampleTypes = prioritySampleTypes;
        }
    }

    public static void setDonorSettingsDefaults(DonorToolsSettings settings, Study study, User user)
    {
        if (null == settings.getPrimaryDatasetId() || -1 == settings.getPrimaryDatasetId())
        {
            DataSet dataSet = study.getDatasetByName("UNOS IDs");
            if (null != dataSet)
                settings.setPrimaryDatasetId(dataSet.getDatasetId());
        }

        if (null == settings.getPrimaryDatasetFieldName())
        {
            settings.setPrimaryDatasetFieldName("UNOS_ID");
        }

        if (settings.getIncludedDatasetIds().isEmpty())
        {
            List<Integer> includedDatasetIds = new ArrayList<>();
            DataSet dataSet = study.getDatasetByName("Demographics");
            if (null != dataSet)
                includedDatasetIds.add(dataSet.getDatasetId());
            dataSet = study.getDatasetByName("Lifestyle and Medical History");
            if (null != dataSet)
                includedDatasetIds.add(dataSet.getDatasetId());
            dataSet = study.getDatasetByName("Diabetes Information");
            if (null != dataSet)
                includedDatasetIds.add(dataSet.getDatasetId());
            settings.setIncludedDatasetIds(includedDatasetIds);
        }

        if (settings.getPrioritySampleTypes().isEmpty())
        {
            UserSchema userSchema = QueryService.get().getUserSchema(user, study.getContainer(), "study");
            Set<String> primaryTypeColumnNames = new HashSet<>();
            primaryTypeColumnNames.add("RowId");
            primaryTypeColumnNames.add("Description");
            Collection<Map<String, Object>> primaryTypeRows = new TableSelector(userSchema.getTable("SpecimenPrimaryType"), primaryTypeColumnNames).getMapCollection();
            Map<String, Integer> primaryTypeMap = new HashMap<>(primaryTypeRows.size());
            for (Map<String, Object> row : primaryTypeRows)
            {
                primaryTypeMap.put(((String)row.get("Description")).toLowerCase(), (Integer)row.get("RowId"));
            }

            List<Integer> prioritySampleTypeIds = new ArrayList<>();
            if (null != primaryTypeMap.get("panhead"))
                prioritySampleTypeIds.add(primaryTypeMap.get("panhead"));
            if (null != primaryTypeMap.get("pantail"))
                prioritySampleTypeIds.add(primaryTypeMap.get("pantail"));
            if (null != primaryTypeMap.get("panother"))
                prioritySampleTypeIds.add(primaryTypeMap.get("panother"));
            if (null != primaryTypeMap.get("spleen"))
                prioritySampleTypeIds.add(primaryTypeMap.get("spleen"));
            if (null != primaryTypeMap.get("duodenum"))
                prioritySampleTypeIds.add(primaryTypeMap.get("duodenum"));
            if (null != primaryTypeMap.get("pln"))
                prioritySampleTypeIds.add(primaryTypeMap.get("pln"));
            if (null != primaryTypeMap.get("nonpln"))
                prioritySampleTypeIds.add(primaryTypeMap.get("nonpln"));
            if (null != primaryTypeMap.get("whole blood"))
                prioritySampleTypeIds.add(primaryTypeMap.get("whole blood"));
            if (null != primaryTypeMap.get("serum"))
                prioritySampleTypeIds.add(primaryTypeMap.get("serum"));
            if (null != primaryTypeMap.get("thymus"))
                prioritySampleTypeIds.add(primaryTypeMap.get("thymus"));
            if (null != primaryTypeMap.get("bone marrow"))
                prioritySampleTypeIds.add(primaryTypeMap.get("bone marrow"));
            if (null != primaryTypeMap.get("iliac crest"))
                prioritySampleTypeIds.add(primaryTypeMap.get("iliac crest"));
            if (null != primaryTypeMap.get("skin"))
                prioritySampleTypeIds.add(primaryTypeMap.get("skin"));
            if (null != primaryTypeMap.get("dna"))
                prioritySampleTypeIds.add(primaryTypeMap.get("dna"));
            if (null != primaryTypeMap.get("rna"))
                prioritySampleTypeIds.add(primaryTypeMap.get("rna"));

            settings.setPrioritySampleTypes(prioritySampleTypeIds);
        }
    }
}
