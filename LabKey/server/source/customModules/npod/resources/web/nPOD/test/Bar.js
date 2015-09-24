
Ext4.require([
    'Ext.chart.*',
    'Ext.Window',
    'Ext.fx.target.Sprite',
    'Ext.layout.container.Fit',
    'Ext.window.MessageBox'
]);

var topAliquotTypes = null;
var topSampleTypes = null;
var topCases = null;


Ext.onReady(function () {


    topAliquotTypes = Ext4.create('LABKEY.ext4.data.Store', {
        schemaName: 'study',
        queryName: 'Top10AliquotTypes',
        sort: '+DerivativeTypeCount',
        autoLoad: true
    });

    topSampleTypes = Ext4.create('LABKEY.ext4.data.Store', {
        schemaName: 'study',
        queryName: 'Top10SampleTypes',
        //sort: '+PrimaryTypeCount',
        autoLoad: true
    });

    topCases = Ext4.create('LABKEY.ext4.data.Store', {
        schemaName: 'study',
        queryName: 'Top10Cases',
        //sort: '+CaseCount',
        autoLoad: true
    });

    Ext4.define('Ext.chart.theme.CustomBlue', {
        extend: 'Ext.chart.theme.Base',

        constructor: function(config) {
            var titleLabel = {
                font: '18px Arial'
            }, axisLabel = {
                fill: 'rgb(8,69,148)',
                font: '12px Arial',
                spacing: 2,
                padding: 5
            };

            this.callParent([Ext.apply({
                axis: {
                    stroke: '#084594'
                },
                axisLabelLeft: axisLabel,
                axisLabelBottom: axisLabel,
                axisTitleLeft: titleLabel,
                axisTitleBottom: titleLabel
            }, config)]);
        }
    });

    var chartTopAliquotTypes = Ext4.create('Ext.chart.Chart', {
        xtype: 'chart',
        id: 'chartCmpTopAliquotTypes',
        animate: true,
        shadow: true,
        store: topAliquotTypes,
        axes: [
//            {
//            type: 'Numeric',
//            position: 'bottom',
//            fields: ['DerivativeTypeCount'],
//            label: {
//                renderer: Ext.util.Format.numberRenderer('0,0')
//            },
//            title: 'DerivativeTypeCount',
//            grid: false,
//            minimum: 0
//            },
            {
                type: 'Category',
                position: 'left',
                fields: ['Description'],
                title: ''
            }],

//        theme: 'Base:gradients',
        theme: 'CustomBlue',
//        background: {
//            gradient: {
//                id: 'backgroundGradient',
//                angle: 45,
//                stops: {
//                    0: {
//                        color: '#ffffff'
//                    },
//                    100: {
//                        color: '#eaf1f8'
//                    }
//                }
//            }
//        },
        series: [{
            type: 'bar',
            axis: 'bottom',
            highlight: true,
//            tips: {
//                trackMouse: true,
//                renderer: function(storeItem, item) {
//                    this.setTitle(storeItem.get('Description') + ': ' + storeItem.get('DerivativeTypeCount') + ' samples');
//                }
//            },
            label: {
                display: 'insideEnd',
                field: 'DerivativeTypeCount',
                renderer: Ext4.util.Format.numberRenderer('0'),
                orientation: 'horizontal',
                color: '#333',
                'text-anchor': 'middle'
            },
            xField: 'Description',
            yField: 'DerivativeTypeCount'
        }]
    });

    var chartTopSampleTypes = Ext4.create('Ext.chart.Chart', {
        xtype: 'chart',
        id: 'chartCmpTopSamplesTypes',
        animate: true,
        store: topSampleTypes,
        shadow: true,
//        legend: {
//            position: 'right'
//            },
        insetPadding: 20,
//        theme: 'Base:gradients',
        theme: 'CustomBlue',
        series: [
            {
                type: 'pie',
                field: 'PrimaryTypeCount',
                showInLegend: true,
                donut: false,
                tips: {
                    trackMouse: true,
                    width: 140,
                    height: 28,
                    renderer: function (storeItem, item)
                    {
//                        //calculate percentage.
//                        var total = 0;
//                        topSampleTypes.parent.each(function (rec)
//                        {
//                            total += rec.get('PrimaryTypeCount');
//                        });
//                        this.setTitle(storeItem.get('Description') + ': ' + Math.round(storeItem.get('PrimaryTypeCount') / total * 100) + '%');
                        this.setTitle(storeItem.get('Description') + ': ' + storeItem.get('PrimaryTypeCount') + ' samples');
                    }
                },
                highlight: {
                    segment: {
                        margin: 20
                    }
                },
                label: {
                    field: 'Description',
                    display: 'rotate',
                    contrast: true,
                    font: '12px Arial'
                }
            }
        ]
    });

    var chartTopCases = Ext4.create('Ext.chart.Chart', {
        xtype: 'chart',
        id: 'chartCmpTopCases',
        animate: true,
        store: topCases,
        shadow: true,
//        legend: {
//            position: 'right'
//        },
        insetPadding: 20,
//        theme: 'Base:gradients',
        theme: 'CustomBlue',
        series: [
            {
                type: 'pie',
                field: 'CaseCount',
                showInLegend: true,
                donut: 40,
                tips: {
                    trackMouse: true,
                    width: 140,
                    height: 28,
                    renderer: function (storeItem, item)
                    {
//                        //calculate percentage.
//                        var total = 0;
//                        topSampleTypes.parent.each(function (rec)
//                        {
//                            total += rec.get('PrimaryTypeCount');
//                        });
//                        this.setTitle(storeItem.get('Description') + ': ' + Math.round(storeItem.get('PrimaryTypeCount') / total * 100) + '%');
                        this.setTitle(storeItem.get('nPODCaseID') + ': ' + storeItem.get('CaseCount') + ' samples');
                    }
                },
                highlight: {
                    segment: {
                        margin: 20
                    }
                },
                label: {
                    field: 'nPODCaseID',
                    display: 'rotate',
                    contrast: true,
                    font: '12px Arial'
                }
            }
        ]
    });

    //var win = Ext4.create('Ext.window.Window', {
    Ext4.define('LABKEY.ext.NPODTop10AliquotTypes', {
        extend: 'Ext.form.Panel',
        width: 250,
        height: 300,
        minHeight: 100,
        minWidth: 150,
        hidden: false,
        maximizable: true,
        border: false,
        title: 'Aliquots',
        constrain: true,
        autoShow: true,
        layout: 'fit',
//        tbar: [{
//            text: 'Save Chart',
//            handler: function() {
//                Ext.MessageBox.confirm('Confirm Download', 'Would you like to download the chart as an image?', function(choice){
//                    if(choice == 'yes'){
//                        chart.save({
//                            type: 'image/png'
//                        });
//                    }
//                });
//            }
//        }, {
//            text: 'Reload Data',
//            handler: function() {
//                // Add a short delay to prevent fast sequential clicks
//                window.loadTask.delay(100, function() {
//                    // store1.loadData(generateData());
//                });
//            }
//        }],
        items: [chartTopAliquotTypes]
        //items: [chartTopSampleTypes]

    });

    //var win = Ext4.create('Ext.window.Window', {
    Ext4.define('LABKEY.ext.NPODTop10SampleTypes', {
        extend: 'Ext.form.Panel',
        width: 250,
        height: 300,
        minHeight: 100,
        minWidth: 150,
        hidden: false,
        maximizable: true,
        border: false,
        title: 'Samples',
        constrain: true,
        autoShow: true,
        layout: 'fit',
//        tbar: [{
//            text: 'Save Chart',
//            handler: function() {
//                Ext.MessageBox.confirm('Confirm Download', 'Would you like to download the chart as an image?', function(choice){
//                    if(choice == 'yes'){
//                        chart.save({
//                            type: 'image/png'
//                        });
//                    }
//                });
//            }
//        }, {
//            text: 'Reload Data',
//            handler: function() {
//                // Add a short delay to prevent fast sequential clicks
//                window.loadTask.delay(100, function() {
//                    // store1.loadData(generateData());
//                });
//            }
//        }],
        items: [chartTopSampleTypes]

    });

    //var win = Ext4.create('Ext.window.Window', {
    Ext4.define('LABKEY.ext.NPODTop10Cases', {
        extend: 'Ext.form.Panel',
        width: 250,
        height: 300,
        minHeight: 100,
        minWidth: 150,
        hidden: false,
        maximizable: true,
        border: false,
        title: 'Cases',
        constrain: true,
        autoShow: true,
        layout: 'fit',
//        tbar: [{
//            text: 'Save Chart',
//            handler: function() {
//                Ext.MessageBox.confirm('Confirm Download', 'Would you like to download the chart as an image?', function(choice){
//                    if(choice == 'yes'){
//                        chart.save({
//                            type: 'image/png'
//                        });
//                    }
//                });
//            }
//        }, {
//            text: 'Reload Data',
//            handler: function() {
//                // Add a short delay to prevent fast sequential clicks
//                window.loadTask.delay(100, function() {
//                    // store1.loadData(generateData());
//                });
//            }
//        }],
        items: [chartTopCases]

    });

});