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

    // Metacontent Attributes:
    this.guided_page_url = this.getPageURL();

    // Create a collection of slides based on the array of guids in 'required_xelement_ids'
    try {
      slide_ids =  JSON.parse( this.get_field_value("required_xelement_ids") )
    }
    catch (e) {
      slide_ids = this.get_field_value("required_xelement_ids");
    };
    slide_models = _.map( slide_ids, function(id) { return SLIDES.get(id) });
    this.slides = new SlideCollection(slide_models);
    

    // Let any change to slides reflect a change of save state in the guide:
    this.slideObserver = {};
    _.extend(this.slideObserver, Backbone.Events);
    this.initSlideObserver();


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
    
  },

  initSlideObserver: function() {
    var self = this;
    this.slideObserver.stopListening();
    this.slideObserver.listenTo(this.slides, "add", this.initSlideObserver);
    this.slideObserver.listenTo(this.slides, "remove", this.initSlideObserver);
    this.slides.each(function(slide) {
      self.slideObserver.listenTo(slide, "change", self.setUnsavedChanges)
    });
    this.setUnsavedChanges();
  },

  defaults: function() { 
    return this.defaultsFor('guide');
  },

  //  defaultSelectNext
  //  When progressing through a Guide it will be possible that a Guide specify some sort of algorithm
  //  (probably as part of its metadata) to calculate what slide should be shown next.
  //
  //  To allow for this, we define the following such method as a default and
  //  possible first attempt at specifying the function signature 
  //  for such methods in general.
  //  In the general case, the selectNext method would expect:
  //
  //  1) a guide, 
  //  2) an array, listing (in-order) the ids of slides already visited up til now
  //  3) a DataModel object which stores a set of user-given answers to those answered slides.
  //  
  //  It should return: The id of the next slide that the user should be presented.
  //  
  //  This default implementation simply selects the next slide (based upon index) 
  //  in the array of a Guide's 'slides' attribute.
  defaultSelectNext: function(guide, visited_slide_ids, responseData) {
    console.log("In defaultSelectNext. (guide, visited_slide_ids, responseData):", guide, visited_slide_ids, responseData);
    if (guide.slides.length == 0) {
      // alert("It seems that guide '"+guide.id+"' has no slides.");
      return 0;
    };
    var next_q = guide.slides.at(visited_slide_ids.length);
    return next_q.id;
  },

  getPageURL: function () {
    return this.metacontent().guided_page_url;
  },
  
  // Should not have to call directly; 
  // called when overridden save function is called.
  saveSlides: function (argument) {
    this.slides.invoke('save');
  },

  updatePageURL: function () {
    var mc = this.metacontent();
    mc.guided_page_url = this.guided_page_url;
    return this.set_field_value('metacontent_external', mc);
  },

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
    this.actionObserver = {};
    _.extend(this.actionObserver, Backbone.Events);
    this.initActionObserver();

  },

  defaults: function() { 
    var d = this.defaultsFor('static_html');
    d.title = d.xel_data_values.title = "Slide ";
    if (this.collection) { 
      d.title = d.xel_data_values.title = d.title + (this.collection.length() + 1);
    }
    return d;
  },
  
  getActions: function () {
    return this.metacontent().actions;
  },

  getContent: function () {
    return this.get_field_value('content');
  },

  updateActions: function () {
    var mc = this.metacontent();
    mc.actions = this.actions.toJSON();
    this.set_field_value('metacontent_external', mc);
    this.trigger('change');
    this.trigger('change:actions');
  },

  updateContent: function(new_content) {
    return this.set_field_value('content', this.contentModel.get('content') );
  },

  initActionObserver: function() {
    var self = this;
    this.actionObserver.stopListening();
    this.actionObserver.listenTo(this.actions, "add", this.initActionObserver);
    this.actionObserver.listenTo(this.actions, "remove", this.initActionObserver);
    this.actions.each(function(action) {
      self.actionObserver.listenTo(action, "change", self.updateActions)
    });
    this.updateActions();
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
    label: "ButtonText",
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

    var $targets = this.get("target");
    if ($targets == "") {
      alert("The action does not have a valid target; please try selecting a switching the target selected in the select box.");
      return false;
    }

    try { 
      duration = parseInt(this.get("duration")) 
    } 
    catch (e) { 
      console.warn("Duration is not parse-able as a number!", this.get("duration"), "; instead, setting to 400ms");
      this.set({"duration": 400});
      duration = 400;
    }



    if (iframeSelector) {
      $(iframeSelector).contents().find($targets).each(function() {
        // if target is not currently viewable, show it.
        if ( $(this).is(":hidden") )  {
          $(this).parents().andSelf().each(function() {
            $(this).show();
          })
        };

        $(this).effect(self.get("effect"), self.effectOptions(), duration);

      });
    } else {
    
      $targets.each(function() {
        if ( $(this).is(":hidden") )  {
          $(this).parents().andSelf().each(function() {
            $(this).show();
          });
        };
        $(this).effect(self.get("effect"), self.effectOptions(), duration);
      });

    }
    
  }

});

SlideActionCollection = Dynamo.SlideActionCollection = Backbone.Collection.extend({
  codeModelName: function() { return "action" },
  prettyModelName: function() { return "Action" },
  model: Dynamo.SlideActionModel,
});