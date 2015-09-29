##nPOD LabKey Study Module - version 14.3
###Functional Impacts Based on Changed Files

The LabKey Study module was modified to meet the nPOD project requirements.  Below are the file references for components built with the binaries releases.
 
1. BaseStudyTable.java  (LabKey base changes)

2. dataSetVisibility.jsp (LabKey base changes)

3. SpecimenManager.java
  - LabKey fixes for Request saves.
  - Max External ID - Used by SpecimenUpdateService
			
4. SpecimenQueryView.java
  - Specimen Email 
			
5. SpecimenRequestQueryView.java
  - Specimen Request List availability
    - Admins see all requests
    - Regular users see only their requests
				
6. SpecimenUpdateService.java
  - LabKey fixes for Request saves.
			
7. EditableSpecimenImporter.java
  - LabKey fixes for Request saves.
			
8. SpecimenEvent.java
  - LabKey fixes for Request saves.
			
9. manageRequest.jsp
  - Show Extended Request information for all users.
			
10. requestSamples.jsp
  - Changed Requesting Location to Project Principle Investigator
			
11. SpecimenController.java
  - Enforce Associated Specimens view.
			
12. SpecimenUtils.java
  - Disable History link on specimen grid view
  - NPOD Create New Request customizations.
  - NPOD Add to Existing Request customizations
  - Add Request email address to notifications
			
