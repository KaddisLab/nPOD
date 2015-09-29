##nPOD LabKey Study Module - version 14.3
###Functional Impacts Based on Changed Files

The LabKey Study module was modified to meet the nPOD project requirements.  Below are the file references for components built with the binaries releases.
 
1. BaseStudyTable.java  (LabKey base changes)

- dataSetVisibility.jsp (LabKey base changes)

- SpecimenManager.java
  - LabKey fixes for Request saves.
  - Max External ID - Used by SpecimenUpdateService
			
- SpecimenQueryView.java
  - Specimen Email 
			
- SpecimenRequestQueryView.java
  - Specimen Request List availability
    - Admins see all requests
    - Regular users see only their requests
				
- SpecimenUpdateService.java
  - LabKey fixes for Request saves.
			
- EditableSpecimenImporter.java
  - LabKey fixes for Request saves.
			
- SpecimenEvent.java
  - LabKey fixes for Request saves.
			
- manageRequest.jsp
  - Show Extended Request information for all users.
			
- requestSamples.jsp
  - Changed Requesting Location to Project Principle Investigator
			
- SpecimenController.java
  - Enforce Associated Specimens view.
			
- SpecimenUtils.java
  - Disable History link on specimen grid view
  - NPOD Create New Request customizations.
  - NPOD Add to Existing Request customizations
  - Add Request email address to notifications
			
