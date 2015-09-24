/*
 * Copyright (c) 2013 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */

LABKEY.requiresScript('vis/lib/raphael-2.1.0.js');

function npodBlockPopup(nPODCaseID, PrimaryType, ProtocolNumber, PrimaryDescription, DerivativeDescription, element){

    if(PrimaryDescription != 'PanHead' && PrimaryDescription != 'PanBody' && PrimaryDescription != 'PanTail')
        return;

    if(DerivativeDescription != 'Paraffin' && DerivativeDescription != 'OCT')
        return;

    if(isBlock(ProtocolNumber))
    {
        var block = ProtocolNumber.charAt(ProtocolNumber.length-1);
        ProtocolNumber = ProtocolNumber.substring(1, ProtocolNumber.length-1);
    }

    if(isNaN(ProtocolNumber))
        return;

    var popupId = 'popup'+ProtocolNumber+nPODCaseID+PrimaryType+DerivativeDescription;

    if(Ext4.getCmp(popupId))
    {
        var offset = getOffset(element);
        Ext4.getCmp(popupId).setPosition(offset.left, offset.top);
        Ext4.getCmp(popupId).show();
    }
    else
    {
        if(isNaN(ProtocolNumber))
            return;

        var dataStore;
        LABKEY.Query.selectRows({
            schemaName : 'study',
            queryName  : 'SpecimenDetail',
            maxRows    : -1,
            success    : function(d) {
                var protocolData = [];
                for(var i = 0; i < d.rows.length; i++)
                {
                    protocolData.push([d.rows[i].ProtocolNumber]);
                }
                dataStore = Ext4.create('Ext.data.ArrayStore', {
                    data :protocolData,
                    listeners : {
                        load : function(store){
                            afterDataLoad(store, ProtocolNumber, block);
                        }
                    },
                    fields: [
                        {name: 'ProtocolNumber', type: 'string'}
                    ],
                    autoLoad : true
                });
            },
            filterArray : [
                new LABKEY.Query.Filter('nPODCaseID', nPODCaseID),
                new LABKEY.Query.Filter('PrimaryType', PrimaryType)
            ]
        });

        var afterDataLoad = function(store, protoNum, block){
            var info = store.data.items;
            var maxBlocks = 0;
            var typeOffset = 14;
            var segmentWidth = 180;
            var blockType = '';
            var prefix;

            for(var i = 0; i < info.length; i++)
            {

                prefix = info[i].data.ProtocolNumber.substring(0, info[i].data.ProtocolNumber.length - 1);
                if(isBlock(info[i].data.ProtocolNumber) && !isNaN(prefix))
                {
                    if(blockType.localeCompare(info[i].data.ProtocolNumber.charAt(info[i].data.ProtocolNumber.length -1)) < 0)
                    {
                        blockType = info[i].data.ProtocolNumber.charAt(info[i].data.ProtocolNumber.length -1);
                    }
                    if(prefix > maxBlocks)
                    {
                        maxBlocks = prefix;
                    }
                }
                else if(info[i].data.ProtocolNumber > maxBlocks && !isNaN(info[i].data.ProtocolNumber))
                {
                    maxBlocks = info[i].data.ProtocolNumber;
                }
            }

            var offset = getOffset(element);

            if(PrimaryDescription.indexOf("Body") !== -1)
            {
                typeOffset = 205;
            }
            else if(PrimaryDescription.indexOf("Tail") !== -1)
            {
                typeOffset = 391;
                segmentWidth = 136;
            }

            var pancreasPopup = Ext4.create('Ext.Panel', {
                x : offset.left,
                y : offset.top,
                id : popupId,
                floating : true,
                height : 247,
                width: blockType === ''? 548 : 648
            });

            pancreasPopup.show();

            pancreasPopup.getEl().on('mouseout', function(){
                pancreasPopup.hide();
            });

            if(blockType != '' && (blockType === 'C' || blockType === 'D'))
            {
                blockType = 'Large_' + block;
            }
            else if(blockType != '')
            {
                blockType = 'Small_' + block;
            }

            maxBlocks *= 2;

            var increment = segmentWidth/maxBlocks;
            if(blockType != '')
            {
                var paper = new Raphael(popupId, 648 , 247);
                paper.add([{type : 'rect', x : 0, y : 0, width : 653, height : 250, fill : '#FFF'}]);
                paper.image(LABKEY.contextPath+'/nPOD/images/'+blockType+'.jpg', 548, 0, 100,100);
            }
            else
            {
                var paper = new Raphael(popupId, 548,247);
            }

            paper.image(LABKEY.contextPath+'/nPOD/images/Pancreas.png', 0, 0, 548,247);


            for(var i = 1; i < maxBlocks; i++)
            {
                paper.path("M"+(increment*i+typeOffset)+" 45L"+(increment*i+typeOffset)+" 241");
            }

            var OCToffset = DerivativeDescription === 'OCT' ? 1 : 2;
            paper.add([{type: 'rect', x : increment * ((protoNum * 2 ) - OCToffset) + typeOffset, y : 45, width : increment, height : 196, fill : '#D76100', 'fill-opacity':.3}]);
            paper.add({type: 'rect', x : 0, y : 0, width : 50, height : 50, fill : '#FFF'});
        }
    }
}

function getOffset(obj) {
    var left, top;
    left = top = 0;
    if (obj.offsetParent) {
        do {
            left += obj.offsetLeft;
            top  += obj.offsetTop;
        } while (obj = obj.offsetParent);
    }
    return {
        left : left,
        top : top
    };
}

function isBlock (protoNum)
{
    var lastChar = protoNum.substr(protoNum.length -1, 1);
    lastChar = lastChar.toUpperCase();
    return (lastChar === 'A' || lastChar === 'B' || lastChar ==='C' || lastChar === 'D');
}

function npodAliquotPopup(nPODCaseID, AliquotNumber, AliquotType, element){

    if(isNaN(AliquotNumber))
        return;

    var popupId = 'popup'+AliquotNumber+nPODCaseID+AliquotType;

    if(Ext4.getCmp(popupId))
    {
        var offset = getOffset(element);
        Ext4.getCmp(popupId).setPosition(offset.left + 20 , offset.top + 20);
        Ext4.getCmp(popupId).show();

        Ext4.getCmp(popupId).getEl().on('mouseout', function(){
            Ext4.getCmp(popupId).hide();
        });

    }
    else
    {

        if (isNaN(AliquotNumber))
            return;

        var dataStore;
        LABKEY.Query.selectRows({
            schemaName: 'lists',
            queryName: 'List: AliquotType',
            columns: 'AliqID,AliquotType,ContainerType,Comments',
            maxRows: -1,
            success: function (d)
            {
                var aliquotData = [];
                for (var i = 0; i < d.rows.length; i++)
                {
                    aliquotData.push([d.rows[i].AliqID,
                        d.rows[i].AliquotType,
                        d.rows[i].ContainerType,
                        d.rows[i].Comments]);
                }
                dataStore = Ext4.create('Ext.data.ArrayStore', {
                    data: aliquotData,
                    listeners: {
                        load: function (store)
                        {
                            afterDataLoad(store, AliquotType);
                        }
                    },
                    fields: [
                        {name: 'AliqID', type: 'string'},
                        {name: 'AliquotType', type: 'string'},
                        {name: 'ContainerType', type: 'string'},
                        {name: 'Comments', type: 'string'}
                    ],
                    autoLoad: true
                });
            },
            filterArray: [
                new LABKEY.Query.Filter('AliqID', AliquotNumber)
            ]
        });

        var afterDataLoad = function (store, AliquotType)
        {
            var info = store.data.items;
            var maxBlocks = 0;
            var typeOffset = 14;
            var segmentWidth = 180;
            var blockType = '';
            var prefix;

            var offset = getOffset(element);

            var aliquotPopup = Ext4.create('Ext.tip.ToolTip', {

                dismissDelay: 3500,
                showDelay: 0,
                height: 100,
                width: 250,
                layout: 'fit',
                items: [
                    {
                        name: 'aliquotTypeText',
                        html: '<span class="x-menu-item-text" style="font-size: 10pt;color:#126495">'
                                + '<B>' + info[0].data.AliquotType + '</B> - '
                                + info[0].data.Comments + '<BR><BR>'
                                + 'Container Type:  <B>' + info[0].data.ContainerType + '</B><BR>'
                                + '</span>'
                    }
                ]
            });


             aliquotPopup.showAt([offset.left + 20, offset.top + 20]);

             aliquotPopup.getEl().on('mouseout', function(){
                 aliquotPopup.hide();
             });


        }
    }
}

