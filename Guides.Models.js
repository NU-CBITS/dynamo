// Guides.Models.js


//Class GoogleDoc
//Accepts an html string of a Published Google Document on instantiation
//and creates an object that extracts each page
function GoogleDoc(html_string) {
  _.bindAll(this);
  var self = this,
  metadata = {},
  _pages = [],
  orginal_string = html_string;

  // function init() {
  console.log('in call to GoogleDoc init');

  var $dom = $('<html>').html(html_string); //jquery ftw!

  //Find then remove the document name.
  var $header = $('body div#header', $dom);
  self.title = $header.text();
  $header.remove();

  //Reorganize the main content into individual pages,
  //using titles as page starts
  //and page breaks page ends
  var $contents = $('div#contents', $dom);
  var $titles = $('p.title', $contents);
  var start;
  $titles.each(function(i, title) {
    var slide_content = "", slide_nodes = $contents.find( $(title) ).nextUntil('hr').andSelf();
    slide_nodes.each(function(i, node) {
      slide_content = slide_content + $(node).html();
    });
    _pages.push({ title: $(title).text(), content: slide_content });
  });
  self.length = _pages.length;

    // //Remove unwanted stuff
    // $('script', $dom).remove();
    // $('body div#footer', $dom).remove();

  // };

  self.pages = function() {
    return _pages;
  }

  self.page = function(index) {  
    return _pages[index];
  };

  // init();

};

GoogleDocXel = Dynamo.GoogleDocXel = Backbone.Model.extend({

  defaults: {
    _private_url: null,
    gDriveKey: null,
    fetched_html: null,
    last_fetched_at: null,
    last_failed_fetch_at: null
  },

  initialize: function() {
    _.bindAll(this);
    // Representative Private Document URL from browser:
    // https://docs.google.com/document/d/16AD26pGzmjuzqkY_xkIhsA6SnCdoDHJlzHmPYr6XyUk/edit#heading=h.pz9u20ree1qf
    this.matchGDriveKey = /^https?:\/\/docs\.google\.com\/document\/d\/(\S*)\/.*$/;
  },

  updatePrivateURL: function(url) {
    this.set({_private_url: url});
    this._extractGDriveKey();
  },

  docObject: function() {
    if (this.get("fetched_html")) {
      return new GoogleDoc( this.get("fetched_html") )
    } else {
      return false;
    };
  },

  fetchDocument: function() {
    var self = this;
    var url = this._generatePublicURL();
    if (url) {
      console.log("fetching document...");
      self.trigger('fetch:start');
      var jqXHR = $.get(url);
      jqXHR.success(function(html) {
        console.log("fetch success...");
        self.set( 'fetched_html', html );
        self.set( 'last_fetched_at', (new Date()).toString() );
        self.trigger('fetch:success');
      });
      jqXHR.error(function(error) {
        console.log("fetch error...");
        console.log(error);
        self.set( 'last_failed_fetch_at', (new Date()).toString() );
        self.trigger('fetch:error');
      });
      jqXHR.complete(function() {
        console.log("fetch complete...");
        self.trigger('fetch:completed');
      });
    } else {
      console.warn("No public url");
      self.trigger('fetch:error');
    };
  },

  recommend: function() { 
    //build empty recommendations object.
    //Each relevant attribute => an array of strings.
    var recommendations = { 
      _private_url: [], 
      gDriveKey: []
    };
    if ( !this.get('_private_url') ) {
      recommendations._private_url.push("No URL has been supplied.");
    };
    if ( this.get('_private_url') && !this.matchGDriveKey.test(this.get('_private_url')) ) {
      recommendations._private_url.push("The supplied URL does not match the expected form of a Google Document.");
    };
    if (!this.get('gDriveKey')) { this._extractGDriveKey(); };
    if (!this.get('gDriveKey')) {
      recommendations.gDriveKey.push("No Google Drive Document Key");
    };
    return recommendations;
  },  

  _generatePublicURL: function() {
    var driveKey = this.get('gDriveKey')
    if (driveKey) {
      // https://docs.google.com/document/pub?id=16AD26pGzmjuzqkY_xkIhsA6SnCdoDHJlzHmPYr6XyUk
      return ("https://docs.google.com/document/pub?id=" + driveKey + '&callback=' ); //SUCK IT, CORS!      
    } else {
      console.warn("No GDrive Key!");
      return "";
    };
  },

  _extractGDriveKey: function() {

    if (this.get("_private_url")) {
      var matches = this.matchGDriveKey.exec(this.get("_private_url"));
      //matches[0] == all matched text
      //matches[1] should equal the captured document key.
      if (matches.length == 2) { 
        this.set('gDriveKey', matches[1]);
        return true;
      } 
      else {
        return false;
      };
    }
    else {
      return false;
    };

  } 

});

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
      this.saveSlides();
      if (this.slides.length == 0) {
        this.updateSelfAndSave();
      };
    };


    this.slides.on('sync', this.updateSelfAndSave);

    this.set_field_value("private_gdoc_url", "https://docs.google.com/document/d/1tPohGdGHQUejTfiuALqZtZclSF6BaH653uGmOfCiyds/edit");
    this.set_field_value("guided_page_url", "http://mohrlab.northwestern.edu/widgettester/activity_calendar/index11.html");
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

  importFromGDoc: function() {
    var self = this;
    self.gDocModel = null;
    self.gDocModel = new GoogleDocXel({});
    
    self.gDocModel.updatePrivateURL(this.get_field_value("private_gdoc_url"));

    self.gDocModel.on("fetch:success", function() {
      self.lastGDocFetched = self.gDocModel.docObject();
      self.set({ "title" : self.lastGDocFetched.title });
      self.slides.reset( 
        _.map(self.lastGDocFetched.pages(), function(page) {
          var s = new SlideModel();
          s.set_field_values({
            title : page.title,
            content : page.content
          });
          return s;
        })
      );
      self.trigger("import:success");
    });

    self.gDocModel.on("fetch:error", function() {
      self.lastGDocFetched = self.gDocModel.docObject();
      if (self.lastGDocFetched) {
        console.warn("There were errors: ", self.lastGDocFetched.recommend() );  
      }
      self.trigger("import:error");
    });

    self.trigger("import:start");
    self.gDocModel.fetchDocument();
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
    // this.updateMetadata();
    this.updateSlides();
    this.saveGuide();
  }, 500),

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
  "highlight" : {
    attributes: [],
    datatypes: [],
    units: []
  }
};

SlideActionModel = Dynamo.SlideActionModel = Backbone.Model.extend({
  defaults: {
    name: "highlight",
    target: "", //a css-style/jquery selector
    duration: 400,
    actionOptions: [],
    actionOptionValues: {}
  },
  effectOptions: function() {
    return {}
  }
});

SlideActionCollection = Dynamo.SlideActionCollection = Backbone.Collection.extend({
  codeModelName: function() { return "action" },
  prettyModelName: function() { return "Action" },
  model: Dynamo.SlideActionModel,
});