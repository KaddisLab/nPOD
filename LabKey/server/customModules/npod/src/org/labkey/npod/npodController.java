/*
 * Copyright (c) 2012-2014 LabKey Corporation
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

import org.apache.commons.lang3.StringUtils;
import org.jetbrains.annotations.Nullable;
import org.json.JSONObject;
import org.labkey.api.action.ApiAction;
import org.labkey.api.action.ApiResponse;
import org.labkey.api.action.ApiSimpleResponse;
import org.labkey.api.action.RedirectAction;
import org.labkey.api.action.SimpleViewAction;
import org.labkey.api.action.SpringActionController;
import org.labkey.api.data.ColumnInfo;
import org.labkey.api.data.Container;
import org.labkey.api.data.TableInfo;
import org.labkey.api.data.TableSelector;
import org.labkey.api.query.CustomView;
import org.labkey.api.query.FieldKey;
import org.labkey.api.query.QueryService;
import org.labkey.api.query.UserSchema;
import org.labkey.api.security.RequiresPermissionClass;
import org.labkey.api.security.permissions.AdminPermission;
import org.labkey.api.security.permissions.EditSpecimenDataPermission;
import org.labkey.api.security.permissions.ReadPermission;
import org.labkey.api.study.DataSet;
import org.labkey.api.study.Study;
import org.labkey.api.study.StudyService;
import org.labkey.api.survey.SurveyService;
import org.labkey.api.survey.model.SurveyDesign;
import org.labkey.api.survey.model.SurveyMetadataBuilder;
import org.labkey.api.util.URLHelper;
import org.labkey.api.view.JspView;
import org.labkey.api.view.NavTree;
import org.springframework.validation.BindException;
import org.springframework.validation.Errors;
import org.springframework.web.servlet.ModelAndView;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class npodController extends SpringActionController
{
    private static final DefaultActionResolver _actionResolver = new DefaultActionResolver(npodController.class);

    public npodController()
    {
        setActionResolver(_actionResolver);
    }

    @RequiresPermissionClass(ReadPermission.class)
    public class BeginAction extends RedirectAction
    {
        @Override
        public URLHelper getSuccessURL(Object o)
        {
            return getContainer().getStartURL(getUser());
        }

        @Override
        public boolean doAction(Object o, BindException errors) throws Exception
        {
            return true;
        }

        @Override
        public void validateCommand(Object target, Errors errors)
        {
        }
    }

    @RequiresPermissionClass(EditSpecimenDataPermission.class)
    public class DonorWizardAction extends SimpleViewAction<DonorWizardForm>
    {
        private String _title = "Add New Donor Information";

        @Override
        public ModelAndView getView(DonorWizardForm form, BindException errors) throws Exception
        {
            Container container = getContainer();
            Study study = StudyService.get().getStudy(container);
            if (null == study)
                throw new IllegalStateException("No study found.");

            DonorToolsSettings donorToolsSettings = DonorToolsSettings.getDonorToolsSettings(container);
            DonorToolsWebPartFactory.setDonorSettingsDefaults(donorToolsSettings, study, getUser());

            Integer primaryDatasetId = donorToolsSettings.getPrimaryDatasetId();
            if (null == primaryDatasetId || -1 == primaryDatasetId)
            {
                errors.reject(ERROR_MSG, "A primary dataset for the wizard must be specified.");
            }
            else
            {
                boolean isUpdateMode = false;
                if (!StringUtils.isEmpty(form.getDonorId()))
                {
                    _title = "Edit Donor Information";
                    isUpdateMode = true;
                }

                // Create it
                SurveyDesign surveyDesign = new SurveyDesign();
                surveyDesign.setLabel("Donor Wizard");

                int mainPanelQuestionWidth = 900;
                int mainPanelLabelWidth = 160;
                SurveyMetadataBuilder metadataBuilder = new SurveyMetadataBuilder(container, getUser(), isUpdateMode);
                metadataBuilder.setLayout("card");
                metadataBuilder.setWidths(mainPanelQuestionWidth + 70, 160);

                Set<String> disableForEdit = new HashSet<>();
                Set<String> propagateColumnNames = new HashSet<>();         // Propogate column to subsequent sections (always at the top)
                String primaryDatasetFieldName = donorToolsSettings.getPrimaryDatasetFieldName();
                if (!StringUtils.isEmpty(primaryDatasetFieldName))
                {
                    metadataBuilder.addFieldsToShareBetweenDatasets(StudyService.get().getSubjectColumnName(container), "Date", primaryDatasetFieldName);
                    disableForEdit.add(primaryDatasetFieldName);
                    propagateColumnNames.add(primaryDatasetFieldName);
                }
                else
                {
                    metadataBuilder.addFieldsToShareBetweenDatasets(StudyService.get().getSubjectColumnName(container), "Date");
                }

                disableForEdit.add(StudyService.get().getSubjectColumnName(container));

                Map<String, Object> customInfo = new HashMap<>();
                customInfo.put("subjectColumnName", StudyService.get().getSubjectColumnName(container).toLowerCase());
                customInfo.put("sequenceNumColumnName", "date");
                customInfo.put("collapseColumnName", "ProtocolNumber");
                List<String> generatorDependentColumnNames = new ArrayList<>(1);
                generatorDependentColumnNames.add("DerivativeType");
                customInfo.put("generatorDependents", generatorDependentColumnNames);
                metadataBuilder.addCustomInfo(customInfo);

                DataSet primaryDataset = study.getDataset(primaryDatasetId);
                addSectionFromDataset(metadataBuilder, primaryDataset, null,
                        "Edit donor and sample information. You must Save to effect any changes.",
                        disableForEdit, propagateColumnNames, mainPanelQuestionWidth, mainPanelLabelWidth);

                List<Integer> datasetIds = donorToolsSettings.getIncludedDatasetIds();
                for (Integer datasetId : datasetIds)
                {
                    if (null != datasetId && -1 != datasetId)
                    {
                        DataSet dataset = study.getDataset(datasetId);
                        if (null != dataset)
                        {
                            String title = null;
//                        if (dataset.getName().equalsIgnoreCase("Demographics"))
//                            title = "Donor Information";
                            addSectionFromDataset(metadataBuilder, dataset, title, null, null, propagateColumnNames, mainPanelQuestionWidth, mainPanelLabelWidth);
                        }
                    }
                }

                // Get which columns should appear in Sample section; try DonorWizardView first; otherwise get default visible columns
                List<FieldKey> columnKeys = null;
                UserSchema userSchema = QueryService.get().getUserSchema(getUser(), container, "study");
                TableInfo tableInfo = userSchema.getTable("SpecimenDetail", true, true);
                CustomView donorWizardView = QueryService.get().getCustomView(getUser(), container, null, "study", "SpecimenDetail", "DonorWizardView");
                if (null != donorWizardView)
                {
                    columnKeys = donorWizardView.getColumns();
                }
                else
                {
                    // TODO: use default view
                    columnKeys = new ArrayList<>();
                    columnKeys.add(FieldKey.fromString("DerivativeType"));
                    columnKeys.add(FieldKey.fromString("VolumeUnits"));
                    columnKeys.add(FieldKey.fromString("ProtocolNumber"));
                    columnKeys.add(FieldKey.fromString("LatestComments"));
                    columnKeys.add(FieldKey.fromString("Requestable"));
                }

                List<ColumnInfo> columns = new ArrayList<>();
                for (FieldKey key : columnKeys)
                {
                    if (!key.getName().equalsIgnoreCase(StudyService.get().getSubjectColumnName(container)) && !key.getName().equalsIgnoreCase("PrimaryType"))
                    {
                        // Leave out ParticipantID and PrimaryType because we'll group by those and don't need for individual queries
                        ColumnInfo column = tableInfo.getColumn(key);
                        if (null != column)
                        {
                            column.setNullable(true);
                            columns.add(column);
                        }
                    }
                }

                // Get all "primary types" to generate check box sections
                Set<String> primaryTypeColumnNames = new HashSet<>();
                primaryTypeColumnNames.add("RowId");
                primaryTypeColumnNames.add("Description");
                TableSelector selector = new TableSelector(userSchema.getTable("SpecimenPrimaryType"), primaryTypeColumnNames);
                String checkboxColumnLabel = tableInfo.getColumn("PrimaryType").getLabel();

                List<Integer> prioritySampleTypeIds = donorToolsSettings.getPrioritySampleTypes();
                List<String> sizeColumnChoices = getSizeColumnChoices();
                String sectionTitle = "Samples";
                String subSectionTitle = "More " + checkboxColumnLabel + "s";
                String subSectionPath = sectionTitle + "/" + subSectionTitle;

                // Do lesser types in an expandable subSection
                JSONObject otherTypesSubSection = metadataBuilder.makeCollapsibleSubSection(subSectionTitle);
                ArrayList<Map<String, Object>> allPrimaryTypes = new ArrayList<>(selector.getMapCollection());
                Collections.sort(allPrimaryTypes, new Comparator<Map<String, Object>>()
                {
                    @Override
                    public int compare(Map<String, Object> row1, Map<String, Object> row2)
                    {
                        String description1 = (String) row1.get("Description");
                        String description2 = (String) row2.get("Description");
                        return description1.compareToIgnoreCase(description2);
                    }
                });

                for (Map<String, Object> row : allPrimaryTypes)
                {
                    Integer rowId = (Integer) row.get("RowId");
                    if (!prioritySampleTypeIds.contains(rowId))
                        metadataBuilder.addCheckboxedSubSection(subSectionPath, checkboxColumnLabel + ": " + row.get("Description"), tableInfo, columns,
                                "PrimaryType", row.get("RowId"), "ProtocolNumber", "# Aliquots", sizeColumnChoices, true, true, true);
                }
                metadataBuilder.completeSubSection(otherTypesSubSection);

                JSONObject section = metadataBuilder.makeCustomSection(sectionTitle,
                        "View, edit, add and delete samples. To change columns in the view, customize DonorWizardView (or the default view) on the SpecimenDetail table. " +
                                "Samples are deleted immediately but all other changes require Save to take effect.",
                        mainPanelQuestionWidth, mainPanelLabelWidth, 4
                );
                metadataBuilder.addDependentDisplayField(tableInfo.getColumn("ParticipantId"), "SpecimenDetail", 300, 150);

                // Do priority types
                for (Map<String, Object> row : allPrimaryTypes)
                {
                    Integer rowId = (Integer) row.get("RowId");
                    if (prioritySampleTypeIds.contains(rowId))
                        metadataBuilder.addCheckboxedSubSection((String) section.get("title"), checkboxColumnLabel + ": " + row.get("Description"), tableInfo, columns,
                                "PrimaryType", row.get("RowId"), "ProtocolNumber", "# Aliquots", sizeColumnChoices, true, true, true);
                }

                metadataBuilder.addQuestion(otherTypesSubSection);
                metadataBuilder.addSection(section);
                surveyDesign.setMetadata(metadataBuilder.getSurveyDesign().toString());
                surveyDesign = SurveyService.get().saveSurveyDesign(container, getUser(), surveyDesign);
                int surveyDesignId = surveyDesign.getRowId();

                form.setSurveyDesignId(surveyDesignId);
                form.setSubjectColumnName(StudyService.get().getSubjectColumnName(container));
            }
            JspView view = new JspView<>("/org/labkey/npod/view/donorWizard.jsp", form, errors);
            return view;
        }

        @Override
        public NavTree appendNavTrail(NavTree root)
        {
            return root.addChild(_title);
        }

        private List<String> getSizeColumnChoices()
        {
            List<String> choices = new ArrayList<>();
            choices.add("Normal");
            choices.add("Large(AB)");
            choices.add("Huge(ABCD)");
            return choices;
        }

        private void addSectionFromDataset(SurveyMetadataBuilder metadataBuilder, DataSet dataset, @Nullable String sectionTitle, @Nullable String sectionSubTitle,
                                          Set<String> disableFieldsForEdit, Set<String> propagateColumnNames, int width, int labelWidth)
        {
            if (null == dataset)
                throw new IllegalStateException("Dataset not found.");

            String sectionName = null != sectionTitle ? sectionTitle : dataset.getLabel();
            TableInfo tableInfo = dataset.getTableInfo(getUser());
            metadataBuilder.addSectionFromTable(tableInfo, sectionName, sectionSubTitle, disableFieldsForEdit, propagateColumnNames, width, labelWidth);
        }

    }

    public static class DonorWizardForm
    {
        private String _donorId;
        private int _surveyDesignId;
        private String _subjectColumnName;

        public String getDonorId()
        {
            return _donorId;
        }

        public void setDonorId(String donorId)
        {
            _donorId = donorId;
        }

        public int getSurveyDesignId()
        {
            return _surveyDesignId;
        }

        public void setSurveyDesignId(int surveyDesignId)
        {
            _surveyDesignId = surveyDesignId;
        }

        public String getSubjectColumnName()
        {
            return _subjectColumnName;
        }

        public void setSubjectColumnName(String subjectColumnName)
        {
            _subjectColumnName = subjectColumnName;
        }
    }

    @RequiresPermissionClass(AdminPermission.class)
    public class ManageDonorWizardAction extends ApiAction<ManageDonorWizard>
    {
        private Map<String, Object> _propertiesMap;

        @Override
        public void validateForm(ManageDonorWizard form, Errors errors)
        {
            Study study = StudyService.get().getStudy(getContainer());
            if (null == study)
            {
                errors.reject("No study found.");
            }
            else
            {
                if (form.getPrimaryDataset() < 0 || null == study.getDataset(form.getPrimaryDataset()))
                {
                    errors.reject("Primary dataset is invalid.");
                }
            }
        }

        @Override
        public ApiResponse execute(ManageDonorWizard form, BindException errors) throws Exception
        {
            DonorToolsSettings settings = DonorToolsSettings.getDonorToolsSettings(getContainer());
            settings.setPrimaryDatasetId(form.getPrimaryDataset());
            settings.setIncludedDatasetIds(form.getIncludedDatasets());
            settings.setPrioritySampleTypes(form.getPriorityTypes());
            DonorToolsSettings.saveDonorToolsSettings(getContainer(), settings);

            return new ApiSimpleResponse("success", true);
        }
    }

    static class ManageDonorWizard
    {
        private int _primaryDataset;
        private List<Integer> _priorityTypes;
        private List<Integer> _includedDatasets;


        public int getPrimaryDataset()
        {
            return _primaryDataset;
        }

        public void setPrimaryDataset(int primaryDataset)
        {
            _primaryDataset = primaryDataset;
        }

        public List<Integer> getPriorityTypes()
        {
            return _priorityTypes;
        }

        public void setPriorityTypes(List<Integer> priorityTypes)
        {
            _priorityTypes = priorityTypes;
        }

        public List<Integer> getIncludedDatasets()
        {
            return _includedDatasets;
        }

        public void setIncludedDatasets(List<Integer> includedDatasets)
        {
            _includedDatasets = includedDatasets;
        }
    }
}
