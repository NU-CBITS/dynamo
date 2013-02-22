// Guides.Models.js

GuideModel = Dynamo.GuideModel = Dynamo.XelementClass.extend({

  // Values:
  codeName: "guide",
  prettyName: "Guide",

  // Functions:
  initialize: function () {
    _.bindAll(this);
    var slide_ids, 
        slide_models,
        self = this;

    this.initAsXelement();
    this.set_field_value('xelement_type', 'guide');

    //
    this.guided_page_url = this.getPageURL();

    // Create a collection of slides based on the array of guids a guide has in
    // 'required_xelement_ids.
    try {
      slide_ids =  JSON.parse( this.get_field_value("required_xelement_ids") )
    }
    catch (e) {
      slide_ids = this.get_field_value("required_xelement_ids");
    };
    
    slide_models = _.map( slide_ids, function(id) { return SLIDES.get(id) });

    this.slides = new SlideCollection(slide_models);
    this.slides.on('add',    this.setUnsavedChanges);
    this.slides.on('remove', this.setUnsavedChanges);

    //  Saving a slide group should save both the Guide and 
    //  All member slides; 
    //  Achieve this by...
    //  Storing original save function, then defining a new one.
    //  new save function saves composite slides; 
    //  On the sync of those slides w/ the server, 
    //  then save this slideGroup.
    //  WARNING - The format of this override breaks the ability to pass variables to save
    //  i.e., save is expected to be called without any arguments for Guides
    this.saveGuide = this.save;
    
    this.save = function() {
      if (this.slides.length == 0) {
        this.updateSelfAndSave();
      }
      else {
        this.saveSlides();
      }
    };


    this.slides.on('sync', this.updateSelfAndSave);

    // // If we add actions as metadata to the guide, 
    // // then we'll prolly need this:
    // this.metadata = new Backbone.Model(this.getMetadata());
    // this.metadata.on('all', this.setUnsavedChanges);
    
  },

  //defaultSelectNext
  //When progressing through a Guide it will be possible that a 
  //Guide specify some sort of algorithm
  //(probably as part of its metadata) to calculate what slide 
  //should be shown next.
  //
  //To allow for this, we define the following such method as a default and
  //possible first attempt at specifying the function signature 
  //for such methods in general.
  //In the general case, the selectNext method would expect:
  //
  //  1) a guide, 
  //  2) an array, listing (in-order) the ids of slides already visited up til now
  //  3) a DataModel object which stores a set of user-given answers to those answered slides.
  //  
  //It should return: 
  //  The id of the next slide that the user should be presented.
  //  
  //This default implementation simply selects the next slide (based upon index) 
  //in the array of a Guide's 'slides' attribute.
  defaultSelectNext: function(guide, visited_slide_ids, responseData) {
    console.log("In defaultSelectNext. (guide, visited_slide_ids, responseData):", guide, visited_slide_ids, responseData);
    if (guide.slides.length == 0) {
      alert("It seems that guide '"+guide.id+"' has no slides.");
      return 0;
    };
    var next_q = guide.slides.at(visited_slide_ids.length);
    return next_q.id;
  },

  defaults: function() { 
    return this.defaultsFor('guide');
  },

  getPageURL: function () {
    return this.metacontent().guided_page_url;
  },
  
  updatePageURL: function () {
    var mc = this.metacontent();
    mc.guided_page_url = this.guided_page_url;
    return this.set_field_value('metacontent_external', mc);
  },

  // Should not have to call directly; 
  // called when overridden save function is called.
  saveSlides: function (argument) {
    this.slides.invoke('save');
  },

  // getMetadata: function() {
  //   return this.metacontent().metadata
  // },
  // updateMetadata: function() {
  //   var mc = this.metacontent();
  //   mc.metadata = this.metadata.toJSON();
  //   return this.set_field_value('metacontent_external', mc);
  // },

  updateSlides: function() {
    this.set_field_value('required_xelement_ids', (_.compact(this.slides.pluck("guid"))) );
  },

  // Shouldn't have to call this method directly, 
  // Instead, called when the slides collection syncs.
  updateSelfAndSave: _.debounce(function() {
    this.updatePageURL();
    this.updateSlides();
    this.saveGuide();
  }, 1000),

  urlRoot: function() { return Dynamo.TriremeURL+'/xelements' },

  viewClass: function() { return showGuideView; },

  editViewClass: function() { return Dynamo.editGuideView; }

});

SlideModel = Dynamo.SlideModel = Dynamo.XelementClass.extend({
  //values:
  codeName: "slide",
  prettyName: "Slide",
  //functions:
  initialize: function () {

    _.bindAll(this);
    this.initAsXelement();
    this.set_field_value('xelement_type', 'static_html');
    
    this.contentModel = new Backbone.Model({ content: this.getContent() });
    this.contentModel.on('all', this.updateContent);

    this.actions = new Dynamo.SlideActionCollection(this.getActions());
    this.actions.on('all', this.updateActions);

  },

  defaults: function() { 
    return this.defaultsFor('static_html');
  },

  getContent: function () {
    return this.get_field_value('content');
  },

  updateContent: function(new_content) {
    return this.set_field_value('content', this.contentModel.get('content') );
  },
  
  getActions: function () {
    return this.metacontent().actions;
  },
  
  updateActions: function () {
    var mc = this.metacontent();
    mc.actions = this.actions.toJSON();
    return this.set_field_value('metacontent_external', mc);
  },

  urlRoot: function() { return Dynamo.TriremeURL+'/xelements' },

  viewClass: function() { return showSlideView; },

  editViewClass: function() { return editSlideView; }

});

ActionDictionary = {
  "blind" : {
    attributes: [],
    datatypes: [],
    units: []
  },
  "bounce" : {
    attributes: [],
    datatypes: [],
    units: []
  },
  "clip" : {
    attributes: [],
    datatypes: [],
    units: []
  },
  "drop" : {
    attributes: [],
    datatypes: [],
    units: []
  },
  "explode" : {
    attributes: [],
    datatypes: [],
    units: []
  },
  "fade" : {
    attributes: [],
    datatypes: [],
    units: []
  },
  "fold" : {
    attributes: [],
    datatypes: [],
    units: []
  },
  "highlight" : {
    attributes: [],
    datatypes: [],
    units: []
  },
  "puff" : {
    attributes: [],
    datatypes: [],
    units: []
  },
  "pulsate" : {
    attributes: [],
    datatypes: [],
    units: []
  },
  "scale" : {
    attributes: [],
    datatypes: [],
    units: []
  },
  "shake" : {
    attributes: [],
    datatypes: [],
    units: []
  },
  "size" : {
    attributes: [],
    datatypes: [],
    units: []
  },
  "slide" : {
    attributes: [],
    datatypes: [],
    units: []
  },
  "transfer" : {
    attributes: [],
    datatypes: [],
    units: []
  }  
};

SlideActionModel = Dynamo.SlideActionModel = Backbone.Model.extend({
  
  defaults: {
    label: "Test",
    effect: "pulsate",
    target: "", //a css-style/jquery selector
    duration: 400,
    actionOptions: [],
    actionOptionValues: {}
  },

  effectOptions: function() {
    return {}
  },

  execute: function(iframeSelector) {
    var self = this, 
        duration;

    try { 
      duration = parseInt(this.get("duration")) 
    } 
    catch (e) { 
      console.warn("Duration is not parse-able as a number!", this.get("duration"), "; instead, setting to 400ms");
      this.set({"duration": 400});
      duration = 400;
    }; 

    if (iframeSelector) {
      $(iframeSelector).contents().find(this.get("target")).each(function() {
        $(this).effect(self.get("effect"), self.effectOptions(), duration);
      });
    } else {
      $(this.get("target")).each(function() {
        $(this).effect(self.get("effect"), self.effectOptions(), duration);
      });
    };
    
  }

});

SlideActionCollection = Dynamo.SlideActionCollection = Backbone.Collection.extend({
  codeModelName: function() { return "action" },
  prettyModelName: function() { return "Action" },
  model: Dynamo.SlideActionModel,
});