<h1>nPOD LabKey Installation Version 14.3</h1>

	
  1.  Install LabKey baseline configuration
  https://www.labkey.org/wiki/home/Documentation/page.view?name=config
  Note unavailable source
    Study module	
	
  2.  Install modules
    npod.module
    study.module
    labkeywebapp - customizations
        labkeyWebapp/clientapi/core/Filter.js
        labkeyWebapp/clientapi/core/Filter.js.gz
        labkeyWebapp/WEB-INF/lib/api.jar
        labkeyWebapp/clientapi_core.min.js
        labkeyWebapp/clientapi_core.min.js.gz
        labkeyWebapp/WEB-INF/jsp/api_jsp.jar
        	
  3. Start Tomcat server and login

  4. Create nPOD Study

  5. Exit LabKey 

  6. Shutdown Tomcat server

  7. Update Schemas
    Run Database SQL Scripts
    Install nPOD Schema queries
    Currently supporting only MS SQL Server.
    Files
        Review
        ./server/source/customModules/distributionDashboard/Extended Specimen Shipment Screen/sql_lists.ExtendedSpecimen-alter-STATE.txt
        ./server/source/customModules/distributionDashboard/NPOD Reports/sql_Donor_By_Group_Summary.txt
        ./server/source/customModules/distributionDashboard/Participant Study References/query_study.ActiveProjects.sql.txt
        ./server/source/customModules/distributionDashboard/Specimen Distributions Module/sql_SpecimenRequest-IdentityReseed.txt
	

  8. Start Tomcat server and login

  9. Install nPOD Wiki pages.
	• Specimen Distribution
	• Top 10 Charts
	• Files
        ○ Review
        ./server/source/customModules/distributionDashboard/Custom Menus - Shopping Cart/webpart_ShoppingCartMenu.js.txt
        ./server/source/customModules/distributionDashboard/Extended Specimen Shipment Screen/webpart_ExtendedSpecimenShipmentScreen.js.txt
        ./server/source/customModules/distributionDashboard/Specimen Distributions Module/security_webpart_DistributionsManagementLinks.js
        ./server/source/customModules/distributionDashboard/Specimen Distributions Module/view_webpart_SpecimenDistributions.txt
        ./server/source/customModules/distributionDashboard/Specimen Distributions Module/webpart_DistributionsManagementLinks.js
        ./server/source/customModules/distributionDashboard/Specimen Distributions Module/webpart_SpecimenDistributions.js
        ./server/source/customModules/distributionDashboard/Specimen Distributions Module/webpart_Support-DistributionsTableManagement.js
        ./server/source/customModules/npod/resources/views/NPOD Donor Search.webpart.xml
        ./server/source/customModules/npod/resources/views/NPOD Specimen Search.webpart.xml
        ./server/source/customModules/npod/resources/views/NPOD Top 10.webpart.xml

