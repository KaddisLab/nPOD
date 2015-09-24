<P>
<div id='topLinks'></div>
</P>



<script type="text/javascript">

	//--------------------------------------
	// Top Links references

	// List ID for Sample Derivatives.  
	//   Needs to be updated per environment: Dev, Staging, or Prod

	document.getElementById("topLinks").innerHTML = 
		'<B>'
		+ '<a href="' 
		+ LABKEY.ActionURL.buildURL('wiki', 'page', LABKEY.ActionURL.getContainer(), {name: 'SpecimenDistributionsJSWebPart1', returnUrl: window.location})
		+ '" target="_self"' 
		+ '>Distribution Dashboard</a>' 
		+ '<P>'
		+ '<a href="' 
		+ LABKEY.ActionURL.buildURL('query', 'executeQuery', LABKEY.ActionURL.getContainer(), {schemaName: 'lists', queryName: 'Sample Derivatives Shipped' })
		+ '" target="_self"' 
		+ '>Sample Derivatives</a>' 
		+ '<P>' 
		+ '<a href="'                 
		+ LABKEY.ActionURL.buildURL('list', 'grid', LABKEY.ActionURL.getContainer(), {listId: "63"})
		+ '" target="_self"' 
		+ '>nPOD Projects</a>' 
		+ '<P>'; 
	
</script>