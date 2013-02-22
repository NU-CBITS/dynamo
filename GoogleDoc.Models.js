// GoogleDoc.Models.js

// Expirmentation from Guide Editor in turning google docs into presentation xelements.
// failed b/c translating the published google doc into a well-formed guide was too hacky.
// currently unused.


//Class GoogleDoc
//Accepts an html string of a Published Google Document on instantiation
//and creates an object that extracts each page
function GoogleDoc(html_string) {
  _.bindAll(this);
  var self = this,
      metadata = {},
      _pages = [],
      orginal_string = html_string;

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
  //  The c9 here is a hack based off of the published google doc  
  //  there are p.title nodes that are not the start of pages,
  //  but there does not seem to be p.c9.title nodes that are not the start of pages.
  //  not sure if this will work in all circumstances.
  var $titles = $('p.c9.title', $contents); 
  var start;
  $titles.each(function(i, title) {
    var slide_content = "", slide_nodes = $contents.find( $(title) ).nextUntil('hr').andSelf();
    slide_nodes.each(function(i, node) {
      slide_content = slide_content + $(node).html();
    });
    _pages.push({ title: $(title).text(), content: slide_content });
  });
  self.length = _pages.length;
  debugger; //check length of document here - it was not right before.
  self.pages = function() {
    return _pages;
  }

  self.page = function(index) {  
    return _pages[index];
  };

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


// Function that was part of the guide model to import the model content
// from a google doc:

importFromGDoc = function() {
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
}