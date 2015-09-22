
//Ext4.namespace('LABKEY.ext4');

Ext4.require(['Ext.data.*']);

Ext.onReady(function() {

    window.generateData = function(n, floor){
        var data = [],
                p = (Math.random() *  11) + 1,
                i;

        floor = (!floor && floor !== 0)? 20 : floor;

        for (i = 0; i < (n || 12); i++) {
            data.push({
                name: Ext4.Date.monthNames[i % 12],
                data1: Math.floor(Math.max((Math.random() * 100), floor)),
                data2: Math.floor(Math.max((Math.random() * 100), floor)),
                data3: Math.floor(Math.max((Math.random() * 100), floor)),
                data4: Math.floor(Math.max((Math.random() * 100), floor)),
                data5: Math.floor(Math.max((Math.random() * 100), floor)),
                data6: Math.floor(Math.max((Math.random() * 100), floor)),
                data7: Math.floor(Math.max((Math.random() * 100), floor)),
                data8: Math.floor(Math.max((Math.random() * 100), floor)),
                data9: Math.floor(Math.max((Math.random() * 100), floor))
            });
        }
        return data;
    };

    window.generateDataNegative = function(n, floor){
        var data = [],
                p = (Math.random() *  11) + 1,
                i;

        floor = (!floor && floor !== 0)? 20 : floor;

        for (i = 0; i < (n || 12); i++) {
            data.push({
                name: Ext4.Date.monthNames[i % 12],
                data1: Math.floor(((Math.random() - 0.5) * 100), floor),
                data2: Math.floor(((Math.random() - 0.5) * 100), floor),
                data3: Math.floor(((Math.random() - 0.5) * 100), floor),
                data4: Math.floor(((Math.random() - 0.5) * 100), floor),
                data5: Math.floor(((Math.random() - 0.5) * 100), floor),
                data6: Math.floor(((Math.random() - 0.5) * 100), floor),
                data7: Math.floor(((Math.random() - 0.5) * 100), floor),
                data8: Math.floor(((Math.random() - 0.5) * 100), floor),
                data9: Math.floor(((Math.random() - 0.5) * 100), floor)
            });
        }
        return data;
    };

    window.store1 = Ext4.create('Ext.data.Store', {
        fields: ['name', 'data1', 'data2', 'data3', 'data4', 'data5', 'data6', 'data7', 'data9', 'data9'],
        data: generateData()
    });
    window.storeNegatives = Ext4.create('Ext.data.JsonStore', {
        fields: ['name', 'data1', 'data2', 'data3', 'data4', 'data5', 'data6', 'data7', 'data9', 'data9'],
        data: generateDataNegative()
    });
    window.store3 = Ext4.create('Ext.data.JsonStore', {
        fields: ['name', 'data1', 'data2', 'data3', 'data4', 'data5', 'data6', 'data7', 'data9', 'data9'],
        data: generateData()
    });
    window.store4 = Ext4.create('Ext.data.JsonStore', {
        fields: ['name', 'data1', 'data2', 'data3', 'data4', 'data5', 'data6', 'data7', 'data9', 'data9'],
        data: generateData()
    });
    window.store5 = Ext4.create('Ext.data.JsonStore', {
        fields: ['name', 'data1', 'data2', 'data3', 'data4', 'data5', 'data6', 'data7', 'data9', 'data9'],
        data: generateData()
    });

    window.loadTask = new Ext4.util.DelayedTask();
});