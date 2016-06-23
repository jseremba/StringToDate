    /*global logger*/
/*
    StringToDate
    ========================

    @file      : StringToDate.js
    @version   : 1.0.0
    @author    : Adam Fothergill
    @date      : 4/4/2016
    @copyright : Mendix 2016
    @license   : Apache 2

    Documentation
    ========================
    Describe your widget here.
*/

// Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",
    "mxui/dom",
    "dojo/dom",
    "dojo/dom-prop",
    "dojo/dom-geometry",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/text",
    "dojo/html",
    "dojo/_base/event",
    "StringToDate/lib/jquery-1.11.2",
    "dojo/text!StringToDate/widget/template/StringToDate.html"
], function(declare, _WidgetBase, _TemplatedMixin, dom, dojoDom, dojoProp, dojoGeometry, dojoClass, dojoStyle, dojoConstruct, dojoArray, dojoLang, dojoText, dojoHtml, dojoEvent, _jQuery, widgetTemplate) {
    "use strict";

    var $ = _jQuery.noConflict(true);

    // Declare widget's prototype.
    return declare("StringToDate.widget.StringToDate", [ _WidgetBase, _TemplatedMixin ], {
        // _TemplatedMixin will create our dom node using this HTML template.
        templateString: widgetTemplate,


        dateInputNode: null,
        // Parameters configured in the Modeler.
        dateFormat: "",
        date: "",
        default2000: "",

        // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
        _handles: null,
        _contextObj: null,
        _alertDiv: null,
        mLoc: null,
        dLoc: null,
        yLoc: null,
        splitter: null,

        // dojo.declare.constructor is called to construct the widget instance. Implement to initialize non-primitive properties.
        constructor: function() {
            // Uncomment the following line to enable debug messages
            //logger.level(logger.DEBUG);
            logger.debug(this.id + ".constructor");
            this._handles = [];
        },

        // dijit._WidgetBase.postCreate is called after constructing the widget. Implement to do extra setup work.
        postCreate: function() {
            logger.debug(this.id + ".postCreate");
            this.splitter = this.dateFormat.match(/[^A-Za-z]/);
            var partsFormat = this.dateFormat.split(this.splitter);
            for (var i=0; i < partsFormat.length; i++){
                    var part = partsFormat[i];
                    if (part.indexOf("m")>-1 || part.indexOf("M")>-1){
                        this.mLoc = i;
                    } else if (part.indexOf("d")>-1 || part.indexOf("D")>-1){
                        this.dLoc = i;
                    } else if (part.indexOf("y")>-1 || part.indexOf("Y")>-1){
                        this.yLoc = i;
                    }
                 }
            this._updateRendering();
            this._setupEvents();

            
        },

        // mxui.widget._WidgetBase.update is called when context is changed or initialized. Implement to re-render and / or fetch data.
        update: function(obj, callback) {
            logger.debug(this.id + ".update");

            this._contextObj = obj;
            this._resetSubscriptions();
            this._updateRendering();

            callback();
        },


        // Attach events to HTML dom elements
        _setupEvents: function() {
            logger.debug(this.id + "._setupEvents");
            this.connect(this.dateInputNode, "change", function(e) {
                // Function from mendix object to set an attribute.
                var input = this.dateInputNode.value.trim();
                if (input===""){
                    myDate = new Date();
                    this._contextObj.set(this.date, myDate); //done to force refresh...there must be a better way
                    this._contextObj.set(this.date, "");
                } else {
                    var partsIn = input.split(this.splitter);

                    var year = partsIn[this.yLoc];
                    if (year.length===2){
                        if (this.default2000){
                            year = "20"+year;
                        }
                    } 
                    this._contextObj.set(this.date, myDate);
                    var myDate = new Date(year,partsIn[this.mLoc]-1,partsIn[this.dLoc]);
                    if (myDate.toString()==="Invalid Date") {
                        myDate = new Date();
                        this._contextObj.set(this.date, myDate); //done to force refresh...there must be a better way
                        this._contextObj.set(this.date, "");
                        this._addValidation("Expecting format "+this.dateFormat);
                    } else {
                        this._contextObj.set(this.date, myDate);
                    }
                }
            });
        },

        // Rerender the interface.
        _updateRendering: function() {
            logger.debug(this.id + "._updateRendering");
            this.dateInputNode.disabled = this.readOnly;

            if (this._contextObj !== null) {
                dojoStyle.set(this.domNode, "display", "block");

                var dateValue = this._contextObj.get(this.date);

                if (dateValue === ""){
                    this.dateInputNode.value = dateValue;
                } else {
                    this.dateInputNode.value = this._setDisplayDate();
                }

                dojoHtml.set(this.infoTextNode, this.messageString);
            } else {
                dojoStyle.set(this.domNode, "display", "none");
            }

            // Important to clear all validations!
            this._clearValidations();
        },

        _setDisplayDate: function(){
                    var dDate = new Date();
                    dDate.setTime(this._contextObj.get(this.date));
                    var month = dDate.getMonth()+1;
                    var date = dDate.getDate();
                    var year = dDate.getFullYear();
                    var dateString = "";
                        if (this.mLoc===0){
                            if (this.dLoc===1){
                                dateString= month+this.splitter+date+this.splitter+year;
                            } else {
                                dateString= month+this.splitter+year+this.splitter+date;
                            }
                        } else if (this.mLoc===1){
                            if (this.dLoc===0){
                                dateString= date+this.splitter+month+this.splitter+year;
                            } else {
                                dateString= year+this.splitter+month+this.splitter+date;
                            }
                        } else if (this.mLoc===2){
                            if (this.dLoc===0){
                                dateString= date+this.splitter+year+this.splitter+month;
                            } else {
                                dateString= year+this.splitter+date+this.splitter+month;
                            }
                        }
                        return dateString;
        },

        // Handle validations.
        _handleValidation: function(validations) {
            logger.debug(this.id + "._handleValidation");
            this._clearValidations();

            var validation = validations[0],
                message = validation.getReasonByAttribute(this.date);

            if (this.readOnly) {
                validation.removeAttribute(this.date);
            } else if (message) {
                this._addValidation(message);
                validation.removeAttribute(this.date);
            }
        },

        // Clear validations.
        _clearValidations: function() {
            logger.debug(this.id + "._clearValidations");
            dojoConstruct.destroy(this._alertDiv);
            this._alertDiv = null;
        },

        // Show an error message.
        _showError: function(message) {
            logger.debug(this.id + "._showError");
            if (this._alertDiv !== null) {
                dojoHtml.set(this._alertDiv, message);
                return true;
            }
            this._alertDiv = dojoConstruct.create("div", {
                "class": "alert alert-danger",
                "innerHTML": message
            }, this.domNode);
            //dojoConstruct.place(this.domNode, this._alertDiv);
        },

        // Add a validation.
        _addValidation: function(message) {
            logger.debug(this.id + "._addValidation");
            this._showError(message);
        },

        // Reset subscriptions.
        _resetSubscriptions: function() {
            logger.debug(this.id + "._resetSubscriptions");
            // Release handles on previous object, if any.
            if (this._handles) {
                dojoArray.forEach(this._handles, function (handle) {
                    mx.data.unsubscribe(handle);
                });
                this._handles = [];
            }

            // When a mendix object exists create subscribtions.
            if (this._contextObj) {
                var objectHandle = this.subscribe({
                    guid: this._contextObj.getGuid(),
                    callback: dojoLang.hitch(this, function(guid) {
                        this._updateRendering();
                    })
                });

                var attrHandle = this.subscribe({
                    guid: this._contextObj.getGuid(),
                    attr: this.date,
                    callback: dojoLang.hitch(this, function(guid, attr, attrValue) {
                        this._updateRendering();
                    })
                });

                var validationHandle = this.subscribe({
                    guid: this._contextObj.getGuid(),
                    val: true,
                    callback: dojoLang.hitch(this, this._handleValidation)
                });

                this._handles = [ objectHandle, attrHandle, validationHandle ];
            }
        }
    });
});

require(["StringToDate/widget/StringToDate"], function() {
    "use strict";
});
