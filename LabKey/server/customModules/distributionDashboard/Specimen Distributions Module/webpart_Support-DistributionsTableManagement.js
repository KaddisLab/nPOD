<div id='errorDiv' style='color:red; display: block'></div>
<div id='divQueryDistributions1'/>

<script type="text/javascript">

	// Support - Distributions Table Management
	//		-LabKey Administrative Fixes Wiki Page
	//		-Used for support fixes versus continued maintenance. 
	//			-"webpart_SpecimenDistributions.js" is used for continued maintenance.

	//------------------------------------------------------------
	// "Table: Distribtuions" - Query Web Part
	var qwp1 = new LABKEY.QueryWebPart({
		renderTo: 'divQueryDistributions1',
		title: 'Support - Distribution Table Administration',
		schemaName: 'lists',
		queryName: 'Table: Distributions',
		buttonBar: {
			includeStandardButtons: true,
			items:[
			  LABKEY.QueryWebPart.standardButtons.views,
			  {text: 'Distributions Support', items: [
				{text: 'Fix Tracking Number (URL Hash Marks)', handler: fixTrackingNumberEnclHashes},
			  ]},
			  LABKEY.QueryWebPart.standardButtons.exportRows
			]
		}
	});

	//------------------------------------------------------------
	// Fix Tracking Number with Enclosed Hash Sign (#) - 09/15/15 sfuertez
	function fixTrackingNumberEnclHashes(dataRegion)
	{
		//alert("fixTrackingNumberEnclHashes called!");

		LABKEY.Query.selectRows({
			schemaName: 'lists',
			queryName: 'Table: Distributions',
			success: fixTNHash,
			failure: errorRequestData,
			showRows: 'all',
			filterArray: [
				LABKEY.Filter.create('FedExTN', '#',LABKEY.Filter.Types.STARTS_WITH),
			],
		});
			
		return false;
	}

	function fixTNHash(data)
	{
		var rowsToUpdate = [];

		// Compose Rows to Update
		for (i = 0; i < data.rows.length; i++) {
			
			var fixedFedExTN = data.rows[i].FedExTN;
			
			// Remove first hash sign (#)
			fixedFedExTN = fixedFedExTN.trim();
			fixedFedExTN = fixedFedExTN.substring(1, fixedFedExTN.length);
			
			// Check for last hash sign (*#) and remove if present.
			if (fixedFedExTN.slice(-1) == '#') {
				fixedFedExTN = fixedFedExTN.slice(0,-1);
			}
			
			rowsToUpdate[i] = { "Dist_ID": data.rows[i].Dist_ID, "FedExTN": fixedFedExTN };
			//errorRequestData(JSON.stringify(data.rows[i].FedExTN) + '<br>');
		}
		
		// Perform Update
		var runUpdate = true;
		//errorRequestData(JSON.stringify(rowsToUpdate) + '<br>');
		
		if (runUpdate) {
			LABKEY.Query.updateRows({
				schemaName: 'lists',
				queryName: 'Table: Distributions',
				rows: rowsToUpdate,
				success: function(data){ alert("Update succesful to 'Table: Distributions'."); }, 
				failure: function(errorInfo, options, responseObj){  errorRequestData(errorInfo + '<br>'); }
			});  
		};
		
		return true;
	}
	// END - Fix Tracking Number with Enclosed Hash Sign (#)
	//------------------------------------------------------------

	function errorRequestData(errorInfo) {
		
		// Display error conditions

		document.getElementById('errorDiv').innerHTML += 
			'<P>' 
			+ '<strong>Specimen Request Error</strong><BR>'
			+ 'Specimen request lookup error. Please notify administrator.<BR><BR><BR>'
			+ '<strong>Error Info: </strong>' + JSON.stringify(errorInfo) + '<BR>'
			+ '<BR>'
			+ '<strong>Page URL: </strong><BR>' + window.location + '<BR>'
			+ '</P>';
	};
</script>