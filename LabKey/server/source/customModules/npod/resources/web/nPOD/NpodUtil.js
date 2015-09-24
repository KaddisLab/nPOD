/**
 * NPOD Utility Functions
 *
 * Created by sfuertez on 8/15/2014.
 */

    //----------------------------------------------
    //  NPOD Shopping Cart support functions

    NpodUtil = new function() {}

    NpodUtil.npodInit = function ()
    {

        // Specimen Detail Grid Actions
        Ext.ComponentMgr.onAvailable('SpecimenDetail', function (dataregion) {

            //------------------------------------
            // Shopping Cart
            if(LABKEY.ActionURL.getParameter('npodShowSelected') && (dataregion.showRows != 'selected')) {

                // Show only selected
                dataregion.showSelected();

            } else if (LABKEY.ActionURL.getParameter('npodShowSelected') && (dataregion.showRows == 'selected')) {

                // Show empty shopping cart message if no items after data region rendered.
                if(dataregion.getSelectionCount() == 0) {
                    Ext4.MessageBox.alert('Shopping Cart','Shopping cart is empty.  Please select one or more vials.');
                }

            }

            //------------------------------------
            // Vial Inventory - Specimen Detail grid - "Request Options" menu highlight.
            var nodes = document.querySelectorAll('[class=labkey-menu-button]');

            for (var i = 0; i < nodes.length; i++) {

                if (nodes[i].text == 'Request Options')
                {
                    nodes[i].style.cssText += 'background:url(/labkey/_images/arrow_down.png) 100% 50% no-repeat, -webkit-gradient(linear, 0% 0%, 0% 100%, from(rgb(255, 255, 255)), to(rgb(248, 248, 248))) !important;';
                }
            }


        });

    }


    //----------------------------------------------
    // **These commands are always executed on source inclusion.

    NpodUtil.npodInit();

    //----------------------------------------------




