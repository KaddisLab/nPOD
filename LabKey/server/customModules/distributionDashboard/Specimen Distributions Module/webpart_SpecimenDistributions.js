<!--
///////////////////////////////////////////////////////////////////////

Specimen Distributions Management Screen / Query

	03/17/15 SF - Updated to use the "View Specimen Request" hidden 
					project page with wiki reference to 
					"SpecimenRequestViewer1".
					
	04/21/15 SF - Cancel abandoned requests function.
					
///////////////////////////////////////////////////////////////////////
-->


<!-- Disable top links
<P>
<div id='topLinks'></div>
</P>
-->


<div id='statusDiv' style='color: grey; display: block'></div>
<div id='errorDiv' style='color:red; display: block'></div>

<div id='divQuerySpecimenDistributions'></div>


<script type="text/javascript">

	//--------------------------------------
	// Top Links references

	/*----------------------- DISABLED  
	document.getElementById("topLinks").innerHTML = 
		'<B>'
		+ '<a href="' 
		+ LABKEY.ActionURL.buildURL('study-samples', 'viewRequests', LABKEY.ActionURL.getContainer(), {returnUrl: window.location})
		+ '" target="_blank"' 
		+ '>View Specimen Requests</a>' 
		+ '  |  '
		+ '<a href="' 
		+ LABKEY.ActionURL.buildURL('study-samples', 'showCreateSampleRequest', LABKEY.ActionURL.getContainer(), {returnUrl: window.location})
		+ '" target="_self"' 
		+ '>Create Specimen Request</a>'
		+ '<B>'; 
	----------------------- DISABLED  */
	
</script>


<script type="text/javascript">

	//--------------------------------------
	// Handlers

	window.onload = function(){
	    var hash = (window.location.hash).replace('#', '');

	    // Clear hash values	
	    history.pushState("", document.title, window.location.pathname + window.location.search);

	    // Evaluate hash on Window Load
	    if (hash.length == 0) {
		// alert('Window Load | No hash value -- ' + window.location.hash);		

	    }
	    else {
		// alert('Window Load | Hash value: ' + window.location.hash);

	    }
	}


	window.onhashchange = function() {

		//--------------------------------------
		// Redirect Handlers based on Query Row Item hash link reference.

		var returnURLLocation = window.location; 
		var hash = (window.location.hash).replace('#', '');
		var params = {};     // Parameter array
		var paramsHMap = {};  // Key Value pairs from parameters
		var action;
		var linkActionValue;
		var schema;
		var query;
		var id;
		var paramvars;  // Needed if working with hash map?

		// Debug
		// alert('Hash Change: ' + hash);

		//--------------------------------------
		// Clear hash values
		history.pushState("", document.title, window.location.pathname + window.location.search);


		// Tokenize parameters from hash
		params = hash.split('&');

		// Debug parameters
		//for (var i = 0; i < params.length; i++)
		//	alert(params[i]);		
		
		// Create hash map of parameters (key/value pairs)
		for (var i = 0; i < params.length; i++) {
			pair = params[i].split('=');
			paramsHMap[pair[0]] = pair[1];		
		}
		
		// Debug parameter hashmap
		//jsonStr = JSON.stringify(paramsHMap);
		//alert(jsonStr );

		// Evaluate Action part and invoke handlers.
		action = paramsHMap['action'];
		linkActionValue = paramsHMap['LinkActionValue'];

		// Debug action and sql link action
		//alert(action + unescape(linkActionValue));

		switch(action + unescape(linkActionValue)) {
		    case 'editSpecimenRequest[edit]':
		        handlerEditSpecimenRequest(paramsHMap);
		        break;

		    case 'editSpecimenRequest[print]':
		        handlerPrintSpecimenRequest(paramsHMap);
		        break;

		    case 'editList[edit]':
		        handlerEditList(paramsHMap);
		        break;

		    case 'editList[add]':
		        handlerInsertList(paramsHMap);
		        break;
		} 
		
	};

	function handlerEditSpecimenRequest(paramsHMap) {
		//alert('HandlerIL ' + paramsHMap['action']);
	
		// Build URL
		url = LABKEY.ActionURL.buildURL('study-samples', 'manageRequest', LABKEY.ActionURL.getContainer(), 
			{returnUrl: window.location,
			 id: paramsHMap['id'] } );
	
		//alert(url);

		// Redirect user to URL
		//window.location = url;

		// Redirect alternative, open popup to URL.
		window.open(url,'_blank','menubar=no, toolbar=no, top=0, left=0, location=no,resizable,scrollbars=yes ' 
			+ 'height=' + screen.height + ', width=' + screen.width );
	
		return true;
	};

	function handlerPrintSpecimenRequest(paramsHMap) {
		//alert('HandlerIL ' + paramsHMap['action']);
	
		// Build URL
		url = LABKEY.ActionURL.buildURL('project', 'begin', LABKEY.ActionURL.getContainer(), 
			{pageId: "View Specimen Request" , returnUrl: window.location,
			 id: paramsHMap['id'] } );
	
		//alert(url);

		// Redirect user to URL
		window.location = url;

		// Redirect alternative, open popup to URL.
		//window.open(url,'_blank','menubar=no, toolbar=no, top=0, left=0, location=no, ' 
		//	+ 'height=' + screen.height + ', width=' + screen.width );
	
		return true;
	};


	function handlerEditList(paramsHMap) {
		//alert('HandlerIL ' + paramsHMap['action']);
	
		// Build URL
		url = LABKEY.ActionURL.buildURL('query', 'updateQueryRow', LABKEY.ActionURL.getContainer(), 
			{schemaName: 'lists', 'query.queryName': 'Table: Distributions', returnUrl: window.location,
			 Dist_ID: paramsHMap['Dist_ID'] } );
	
		//alert(url);

		// Redirect user to URL
		window.location = url;
	
		return true;
	};


	function handlerInsertList(paramsHMap) {
		//alert('HandlerIL ' + paramsHMap['action']);
	
		// Build URL
		url = LABKEY.ActionURL.buildURL('query', 'insertQueryRow', LABKEY.ActionURL.getContainer(), 
			{schemaName: 'lists', 'query.queryName': 'Table: Distributions', returnUrl: window.location,
			 Dist_ID: paramsHMap['SpecimenRequestID'], SpecimenRequestID: paramsHMap['SpecimenRequestID'] } );
	
		//alert(url);

		// Redirect user to URL
		window.location = url;
	
		return true;
	};


	//--------------------------------------
	// Grid Display functions

	var qwp1 = new LABKEY.QueryWebPart({
		renderTo: 'divQuerySpecimenDistributions',
		title: 'Specimen Distributions',
                schemaName: 'study',
                queryName: 'SpecimenDistributions',
		buttonBar: {
			includeStandardButtons: true,
			items:[
			  LABKEY.QueryWebPart.standardButtons.views,
			  {text: 'Refresh', url: LABKEY.ActionURL.buildURL('wiki', 'page', LABKEY.ActionURL.getContainer(), {name: 'SpecimenDistributionsJSWebPart1'} )},
			  {text: 'Initiate Inventory Free Distribution Record', url: LABKEY.ActionURL.buildURL('query', 'insertQueryRow', LABKEY.ActionURL.getContainer(), {schemaName: 'lists', 'query.queryName': 'Table: Distributions', returnUrl: window.location} )},
			  {text: 'Clear out abandoned orders', handler: onCancelExpiredRequests},
			  
			  //{text: 'Test BASE URL', handler: function(){alert(LABKEY.ActionURL.getBaseURL(true));alert(LABKEY.ActionURL.getBaseURL(true).indexOf("http://localhost"));} },

			/* ---- Disable test menu scripts ----/
			  {text: 'Test Script', onClick: "alert('Hello World!'); return false;"},
			  {text: 'Test Handler', handler: onTestHandler},
			  {text: 'Test Menu', items: [
				{text: 'Item 1', handler: onItem1Handler},
				{text: 'Fly Out', items: [
				  {text: 'Sub Item 1', handler: onItem1Handler}
				]},
				'-', //separator
				{text: 'Item 2', handler: onItem2Handler}
			  ]},
			/---- Disable test menu scripts ---- */
	

			  LABKEY.QueryWebPart.standardButtons.exportRows
			]
		},

		///////////////////////////////////
		// Does not seem to work for read-only/joined queries
		//
		// updateURL: '/query/updateQueryRow.view?schemaName=lists&query.queryName=Table%3A%20Distributions&Dist_ID=${Dist_ID}',
		// showUpdateColumn: true,
		// insertURL: '/query/insertQueryRow.view?schemaName=lists&query.queryName=Table%3A%20Distributions',
		// showInsertNewButton: true,
		//
		///////////////////////////////////
		//showRecordSelectors: true,
		
		showBorders: true,
		showSurroundingBorder: true,
		linkTarget: '_self',
		aggregates: [
			{column: 'Created', type: LABKEY.AggregateTypes.COUNT, label: 'Requests Created'},
			{column: 'Dist_ID', type: LABKEY.AggregateTypes.COUNT, label: 'Distributions'}
			]

	});

	
	function onCancelExpiredRequests()
	{
		//alert("cancelExpiredRequests() called");
		
		var statusidNotYetSubmitted;		// RowID for Status = 'Not Yet Submitted' 
		var expirationDateRange = 14;			// (2) week / (14) day expiration date.
		var dateOffset = (24*60*60*1000) * expirationDateRange;
		
		// Determine correct Status ID based on URL location.
		//	Local development environment is different than deployed environments (18 versus 15)
		if (LABKEY.ActionURL.getBaseURL(true).indexOf("http://localhost") > -1)
			statusidNotYetSubmitted = 18;		// Localhost - Local Development
		else	
			statusidNotYetSubmitted = 15;		// Deployed environments
			
		//alert('Status to use:  ' + statusidNotYetSubmitted);
		
		// Set expiration time
		var expirationDate = new Date();
		expirationDate.setTime(expirationDate.getTime()-dateOffset);

		var expirationDateString = '';
		expirationDateString += (expirationDate.getMonth() + 1) + '/';	// Month (0-11)
		expirationDateString += expirationDate.getDate() + '/';
		expirationDateString += expirationDate.getFullYear() ;
		
		//alert('expirationDate:  ' + expirationDateString);
				
		// Query identified Specimen Request
		LABKEY.Query.selectRows({
			schemaName: 'study',
			queryName: 'SpecimenRequest',
			successCallback: cancelSpecimenRequests,
			failure: errorRequestData,
			showRows: 'all',
			filterArray: [
				LABKEY.Filter.create('status', statusidNotYetSubmitted),
				LABKEY.Filter.create('created', expirationDateString, LABKEY.Filter.Types.LESS_THAN),
				LABKEY.Filter.create('modified', expirationDateString, LABKEY.Filter.Types.LESS_THAN)
			]
		});
		
		return true;
	}

	function cancelSpecimenRequests(data)
	{
	
		// DEBUG
		//alert('data Selected:' + data.rowCount);
		//var debugRequestIds = '';
		
		// Available orders to cancel?
		if (data.rows.length <= 0) {
			// No, do not perform cancellation.
			LABKEY.Utils.alert('Cancel Abandoned Requests', 'No abandoned specimen requests found. ('
								+ data.rows.length + ' requests)');
								
		} else {
		
			// Yes, perform cancellation.			
			var operationIntervals = 1000;	// Number of milliseconds to space operations with JS timeout.
			var statusText = 'Abandoned specimen request cancellation started... ('
						+ data.rows.length + ' requests)';
						
			LABKEY.Utils.alert('Cancel Abandoned Requests', statusText);
			statusRequestData(statusText);
			
			for (i = 0; i < data.rows.length; i++) {
			
				var requestIdToCancel = data.rows[i].RequestId;
			
				// DEBUG
				//debugRequestIds += "<br>" + i + " : " + requestIdToCancel ;
				
				cancelRequestWithTimeout(requestIdToCancel,operationIntervals,i, (i==(data.rows.length-1)));	
				
			}
			
			//alert('request Ids cancelled:  ' + debugRequestIds);
			
		}
							
		return true;
	}


	function cancelRequestWithTimeout(requestIdToCancel, waitTimeMilli, waitMultiplier, bLastOperation) {

		setTimeout(
			function(){ 
		
				LABKEY.Specimen.cancelRequest( {
					requestId : requestIdToCancel,
					success : function (){
							//alert('Successfully cancelled Request ID: ' + requestIdToCancel );
							statusRequestData('Successfully cancelled Request ID: ' + requestIdToCancel );
							if (bLastOperation) {
								statusRequestData('Request cancellation operation complete.' );
								statusRequestData('-----' );
							}
						},
					failure : function(errorInfo, options, responseObj){
							//alert('Failed to cancel request! Request ID: ' + requestIdToCancel );
							statusRequestData('<strong>' + 'Failed to cancel Request ID: ' + requestIdToCancel + '</strong>');
							errorRequestData('Failed to cancel request! Request ID: ' + requestIdToCancel 
									+ '<BR>' + 'Error Info:  ' + errorInfo.exception
									+ '<BR>' + 'Error Status:  ' + responseObj.statusText
									);
							if (bLastOperation) {
								statusRequestData('Request cancellation operation complete.' );
								statusRequestData('-----' );
							}
						}
				});
				
				// alert(waitMultiplier + ': ' + requestIdToCancel);		
			}, 
			waitTimeMilli*waitMultiplier
		);		
	}

	function statusRequestData(statusInfo) {
		
		// Display status information

		document.getElementById('statusDiv').innerHTML += 
			'<P>' 
			+ statusInfo + '<BR>'
			+ '</P>';
	};
	
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
	
	
	function onTestHandler(dataRegion)
	{
		alert("onTestHandler called!");
		return false;
	}

	function onItem1Handler(dataRegion)
	{
		alert("onItem1Handler called!");
	}

	function onItem2Handler(dataRegion)
	{
		alert("onItem2Handler called!");
	}

	//--------------------------------------

</script>