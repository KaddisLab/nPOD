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

import org.apache.commons.lang3.text.StrBuilder;
import org.apache.commons.lang3.text.StrTokenizer;
import org.jetbrains.annotations.NotNull;
import org.labkey.api.data.Container;
import org.labkey.api.data.PropertyManager;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * User: davebradlee
 * Date: 8/26/13
 * Time: 9:32 AM
 */
public class DonorToolsSettings
{
    private static final String KEY_PRIMARYDATASETID = "PrimaryDatasetId";
    private static final String KEY_PRIMARYDATASETFIELDNAME = "PrimaryDatasetFieldName";
    private static final String KEY_INCLUDEDDATASETIDS = "IncludedDatasetIds";
    private static final String KEY_PRIORITYSAMPLETYPEIDS = "PrioritySampleTypeIds";

    private Integer _primaryDatasetId;
    private String _primaryDatasetFieldName;
    private List<Integer> _includedDatasetIds;
    private List<Integer> _prioritySampleTypeIds;

    public DonorToolsSettings()
    {
    }

    public DonorToolsSettings(Map<String, String> map)
    {
        _primaryDatasetId = (null != map.get(KEY_PRIMARYDATASETID) ? Integer.valueOf(map.get(KEY_PRIMARYDATASETID)): null);
        _primaryDatasetFieldName = map.get(KEY_PRIMARYDATASETFIELDNAME);
        setIncludedDatasetNames(map.get(KEY_INCLUDEDDATASETIDS));
        setPrioritySampleTypes(map.get(KEY_PRIORITYSAMPLETYPEIDS));
    }

    public Integer getPrimaryDatasetId()
    {
        return _primaryDatasetId;
    }

    public void setPrimaryDatasetId(Integer primaryDatasetId)
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

    public List<Integer> getIncludedDatasetIds()
    {
        return _includedDatasetIds;
    }

    public void setIncludedDatasetIds(@NotNull List<Integer> includedDatasetIds)
    {
        _includedDatasetIds = includedDatasetIds;
    }

    public void setIncludedDatasetNames(String includedDatasetIds)
    {
        if (null != includedDatasetIds)
        {
            _includedDatasetIds = new ArrayList<>();
            StrTokenizer tokenizer = StrTokenizer.getCSVInstance(includedDatasetIds);
            while (tokenizer.hasNext())
            {
                _includedDatasetIds.add(Integer.valueOf(tokenizer.next()));
            }
        }
        else
        {
            _includedDatasetIds = new ArrayList<>();
        }
    }

    public List<Integer> getPrioritySampleTypes()
    {
        return _prioritySampleTypeIds;
    }

    public void setPrioritySampleTypes(@NotNull List<Integer> prioritySampleTypes)
    {
        _prioritySampleTypeIds = prioritySampleTypes;
    }

    public void setPrioritySampleTypes(String prioritySampleTypes)
    {
        if (null == prioritySampleTypes)
        {
            _prioritySampleTypeIds = new ArrayList<>();
        }
        else
        {
            _prioritySampleTypeIds = new ArrayList<>();
            StrTokenizer tokenizer = StrTokenizer.getCSVInstance(prioritySampleTypes);
            while (tokenizer.hasNext())
            {
                _prioritySampleTypeIds.add(Integer.valueOf(tokenizer.next()));
            }
        }
    }


    private String makeCSV(List<Integer> ids)
    {
        StrBuilder csv = new StrBuilder();
        csv.appendWithSeparators(ids, ",");
        return csv.toString();
    }

    private String getIncludedDatasetNamesCSV()
    {
        return makeCSV(_includedDatasetIds);
    }

    private String getPrioritySampleTypesCSV()
    {
        return makeCSV(_prioritySampleTypeIds);
    }

    private void populateMap(Map<String, String> map)
    {
        map.put(KEY_PRIMARYDATASETID, _primaryDatasetId.toString());
        map.put(KEY_PRIMARYDATASETFIELDNAME, _primaryDatasetFieldName);
        map.put(KEY_INCLUDEDDATASETIDS, getIncludedDatasetNamesCSV());
        map.put(KEY_PRIORITYSAMPLETYPEIDS, getPrioritySampleTypesCSV());
    }


    private static final String NPOD_DONORWIZARD_PROPS = "NpodDonorWizardProps";

    public static DonorToolsSettings getDonorToolsSettings(Container container)
    {
        Map<String, String> settingsMap = PropertyManager.getProperties(container, NPOD_DONORWIZARD_PROPS);
        return new DonorToolsSettings(settingsMap);
    }

    public static void saveDonorToolsSettings(Container container, DonorToolsSettings settings)
    {
        Map<String, String> settingsMap = PropertyManager.getWritableProperties(container, NPOD_DONORWIZARD_PROPS, true);
        settings.populateMap(settingsMap);
        PropertyManager.saveProperties(settingsMap);
    }
}
