/*
 * Copyright (c) 2013 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
Ext4.define('LABKEY.ext4.ImageViewer', {
    extend : 'Ext.container.Container',

    layout : 'fit',

    autoScroll : true,

    border : false, frame : false,

    showMetadata : true,

    winTitle : '',

    initComponent : function() {

        this.items = [this.getPreviewPanelCfg()];

        this.callParent();

        // bind key events
        this.on('afterrender', function() {

            var nav = new Ext4.util.KeyNav(Ext4.getBody(), {
                left  : function(e) {
                    if (this.imgWindow && this.imgWindow.isVisible()) {
                        if (this._activeIdx > 0) {
                            this.showImage(this._activeIdx-1)
                        }
                    }
                },
                right : function(e) {
                    if (this.imgWindow && this.imgWindow.isVisible()) {
                        if (this._activeIdx < this.store.getCount()-1) {
                            this.showImage(this._activeIdx+1)
                        }
                    }
                },
                scope : this
            });

        }, this, { single : true });
    },

    getPreviewPanelCfg : function() {

        var tpl = new Ext4.XTemplate(
            '<div class="image-preview vertical-preview">',
                '<tpl for=".">',
                    '<div class="thumb-wrap">',
                        '<img class="thumb-img" src="{src}" title="{title}" align="middle">',
                    '</div>',
                '</tpl>',
            '</div>'
        );

        return {
            xtype  : 'dataview',
            layout : 'fit',
            autoHeight : true,
            tpl    : tpl,
            store  : this.store,
            trackOver    : true,
            overItemCls  : 'x4-view-over',
            emptyText    : 'No images to display',
            itemSelector : '.thumb-wrap',
            singleSelect : true,
            listeners : {
                itemclick : this.onImageSelect,
                scope : this
            },
            scope : this
        };
    },

    getViewPanelCfg : function() {
        return {
            xtype : 'imgview',
            flex : 1
        };
    },

    getMetadataPanelCfg : function() {

        var metaTpl = new Ext4.XTemplate(
            '<table width="100%">',
                '<colgroup><col width="25%"><col width="25%"></colgroup>',
                '<tr>',
                    '<td class="label">Title</td><td><a href="{src}" target="_blank">{title}</a></td>',
                    '<td class="label">Type</td><td>{Image_type:this.renderNull}</td>',
                '</tr><tr>',
                    '<td class="label">Uploaded By</td><td>{uploader_name:this.renderNull}</td>',
                    '<td class="label">Tissue Stained</td><td>{tissue_being_stained:this.renderNull}</td>',
                '</tr><tr>',
                    '<td class="label">Marker</td><td>{Marker:this.renderNull}</td>',
                    '<td class="label">Color of Each Stain</td><td>{Color_of_each_stain:this.renderNull}</td>',
                '</tr><tr>',
                    '<td class="label">Image Magnification</td><td>{Image_Magnification:this.renderNull}</td>',
                    '<td class="label">Stains Used</td><td>{Stains_used:this.renderNull}</td>',
                '</tr><tr>',
                    '<td class="label">Block Number</td><td>{block_number:this.renderNull}</td>',
                    '<td class="label">Serial Slide Number</td><td>{serial_slide_number:this.renderNull}</td>',
                '</tr><tr>',
                    '<td class="label">Shared Protocol</td><td>{reference_to_shared_protocol:this.renderNull}</td>',
                '</tr><tr>',
                    '<td class="label">Notes</td><td colspan="3">{Descriptive_Notes:this.renderNull}</td>',
                '</tr>',
            '</table>',
                {
                    renderNull : function(v) { if (null == v || v.length == 0) { return '&nbsp;'; } return v; }
                }
        );

        return {
            itemId : 'metapanel',
            xtype : 'container',
            tpl : metaTpl,
            style : {
                padding: '10px',
                'overflow-y': 'auto'
            },
            height : 150
        };
    },

    getPreviewWindow : function() {
        if (this.imgWindow) {
            return this.imgWindow;
        }

        var items = [];
        if (this.showMetadata) {
            items.push(this.getMetadataPanelCfg());
        }
        items.push(this.getViewPanelCfg());

        this.imgWindow = Ext4.create('Ext.window.Window', {
            layout      : {
                type : 'vbox',
                pack : 'start',
                align : 'stretch'
            },
            title       : this.winTitle,
            closeAction : 'hide',
            width       : 820,   /* 80% of 1024 */
            height      : 615,   /* 80% of 768  */
            border      : false, frame : false,
            modal       : true,
            draggable   : false,
            resizable   : false,
            items : items
        });

        return this.imgWindow;
    },

    showImage : function(recOrIdx) {
        var win = this.getPreviewWindow();

        var rec;
        if (Ext4.isNumber(recOrIdx)) {
            rec = this.store.getAt(recOrIdx);
            this._activeIdx = recOrIdx;
        }
        else {
            // assume it is a record
            this._activeIdx = this.store.indexOf(recOrIdx);
            rec = recOrIdx;
        }

        win.show();
        win.down('imgview').showImage(rec);

        if (this.showMetadata) {
            var meta = win.getComponent('metapanel');
            if (meta) {
                meta.update(rec.data);
            }
        }

        win.center();
    },

    onImageSelect : function(v, rec) {
        this.showImage(rec);
    }
});

Ext4.define('LABKEY.ext4.ImageViewer.View', {
    extend : 'Ext.Panel',
    alias : 'widget.imgview',

    border : false, frame : false,

    initComponent : function() {

        var me = this;

        me.items = [{
            xtype : 'container',
            itemId : 'imgcontainer',
            flex : 1,
            style : {
                overflow : 'hidden',
                padding: '10px'
            },
            items : {
                xtype : 'image',
                mode : 'element',
                cls : 'thumb-img',
                src : Ext4.BLANK_IMAGE_URL
            },
            listeners : {
                afterrender : function(c) {
                    var img = c.down('image');
                    if (img) {
                        var el = img.getEl();
                        img.getEl().on('dblclick', function(evt) {
                            if (el.dom && el.dom.src) {
                                window.open(el.dom.src, '_blank');
                            }
                        });
                    }
                }
            }
        }];

        this.callParent();
    },

    showImage : function(rec) {
        var imageLoader = new Image();
        var me = this;
        imageLoader.onload = function() {
            me._showImage(rec, imageLoader);
        };
        imageLoader.src = rec.get('src');
    },

    _showImage : function(record, image) {

        var max = function(s1,s2)
        {
            return {width:Math.max(s1.width,s2.width), height:Math.max(s1.height,s2.height)};
        };

        // TODO change to setMaxImageSize(x,y) setMinImageSize(x,y), setAutoSize(true)
        var viewSize = this.getSize();

        // never auto-size greater than this
        var maxImageAreaSize = {width:viewSize.width-20, height:viewSize.height-20};
        // but don't let browser scrunch window smaller
        var minImageAreaSize = {width:viewSize.width-20, height:viewSize.height-20};
        // this is the image reserved for the image, whether the image is larger or smaller
        var imageAreaSize = maxImageAreaSize;

        // actual image dimensions
        var actualImgSize = {width:image.width, height:image.height};
        var scaledImgSize = actualImgSize;
        var fitToArea = true;
        if (fitToArea)
        {
            if (imageAreaSize.width < scaledImgSize.width) {
                scaledImgSize = {
                    width  : imageAreaSize.width,
                    height : (scaledImgSize.height*imageAreaSize.width/scaledImgSize.width)
                };
            }
            if (imageAreaSize.height < scaledImgSize.height) {
                scaledImgSize = {width:scaledImgSize.width*imageAreaSize.height/scaledImgSize.height, height:imageAreaSize.height};
            }
            imageAreaSize = max(minImageAreaSize, scaledImgSize);
        }

        var imageCmp = this.getImage();
        imageCmp.setSize(scaledImgSize);
        imageCmp.setSrc(image.src);
        imageCmp.focus();
    },

    getImageContainer : function() {
        return this.query('#imgcontainer')[0];
    },

    getImage : function() {
        return this.query('image')[0];
    }
});
