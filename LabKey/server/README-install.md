#nPOD LabKey Installation Version 14.3

	
1.  Install LabKey baseline configuration

    [https://www.labkey.org/wiki/home/Documentation/page.view?name=config]
  
2.  Install modules in LabKey installation folder
  - modules/ 
    - npod.module  (Source available)
    - study.module  (Source unavailable)
  - labkeywebapp/ - Customizations (non-JavaScript source unavailable)  
    - labkeyWebapp/clientapi/core/Filter.js
    - labkeyWebapp/clientapi/core/Filter.js.gz
    - labkeyWebapp/WEB-INF/lib/api.jar
    - labkeyWebapp/clientapi_core.min.js
    - labkeyWebapp/clientapi_core.min.js.gz
    - labkeyWebapp/WEB-INF/jsp/api_jsp.jar

3. Start Tomcat server and login

4. Create nPOD Study

5. Exit LabKey 

6. Shutdown Tomcat server

7. Update Schemas
  - Run Database SQL Scripts
  - Install nPOD Schema queries
    (Currently supporting only MS SQL Server.)
  - SQL
    - MS SQL Server
        - ./server/source/customModules/distributionDashboard/Specimen Distributions Module/sql_SpecimenRequest-IdentityReseed.txt
        - ./server/source/customModules/distributionDashboard/Extended Specimen Shipment Screen/sql_lists.ExtendedSpecimen-alter-STATE.txt
    - LabKey Schema SQL
        - ./server/source/customModules/distributionDashboard/NPOD Reports/sql_Donor_By_Group_Summary.txt

        - ./server/source/customModules/distributionDashboard/Extended Specimen Shipment Screen/metadata_query_study.PrintRequestSpecimens.txt
        - ./server/source/customModules/distributionDashboard/Extended Specimen Shipment Screen/query_study.PrintRequestSpecimens.txt

        - ./server/source/customModules/distributionDashboard/Participant Study References/query_study.ActiveProjects.sql.txt

        - ./server/source/customModules/distributionDashboard/Sample Derivatives/query_list.SampleDerivativesQuery.txt
        - ./server/source/customModules/distributionDashboard/Sample Derivatives/query_list.SampleDerivativesShipped.txt

        - ./server/source/customModules/distributionDashboard/Specimen Distributions Module/querymetadata_study.SpecimenDistributions.txt
        - ./server/source/customModules/distributionDashboard/Specimen Distributions Module/query_study.SpecimenDistributions.txt

        - ./server/source/customModules/distributionDashboard/Specimen Email/querymetadata_study.SpecimenEmail.txt
        - ./server/source/customModules/distributionDashboard/Specimen Email/query_study.SpecimenEmail.txt

        - ./server/source/customModules/distributionDashboard/Top 10 Lists/query_study.Top10AliquotTypes.txt
        - ./server/source/customModules/distributionDashboard/Top 10 Lists/query_study.Top10Cases.txt
        - ./server/source/customModules/distributionDashboard/Top 10 Lists/query_study.Top10SampleTypes.txt        

        - ./server/source/customModules/distributionDashboard/Donor Specimen Search/query_study.DonorSpecimenSearch.txt

8. Start Tomcat server and login

9. Install nPOD Wiki pages.
        - Specimen Distribution
	- Top 10 Charts
	- Files
        - (Under Review)
          - ./server/source/customModules/distributionDashboard/Custom Menus - Shopping Cart/webpart_ShoppingCartMenu.js.txt
          - ./server/source/customModules/distributionDashboard/Extended Specimen Shipment Screen/webpart_ExtendedSpecimenShipmentScreen.js.txt
          - ./server/source/customModules/distributionDashboard/Specimen Distributions Module/security_webpart_DistributionsManagementLinks.js
          - ./server/source/customModules/distributionDashboard/Specimen Distributions Module/view_webpart_SpecimenDistributions.txt
          - ./server/source/customModules/distributionDashboard/Specimen Distributions Module/webpart_DistributionsManagementLinks.js
          - ./server/source/customModules/distributionDashboard/Specimen Distributions Module/webpart_SpecimenDistributions.js
          - ./server/source/customModules/distributionDashboard/Specimen Distributions Module/webpart_Support-DistributionsTableManagement.js
