// Guides.Views.js

// PlayGuideView = Dynamo.PlayGuideView = Dynamo.BaseUnitaryXelementView.extend({

//   events: function() {
//     return {
//       'click button.next-slide'         : "nextAndRender",
//       'click button.previous-slide'     : "previousAndRender",
//       'click button.jump-to-slide'      : "jumpAndRender",
//     };
//   },

//   render: function (argument) {

//     this.renderTemplate();
//     this.renderCurrentSlide();

//     return this;
//   }
// });

GuidePlayerView = Dynamo.GuidePlayerView = Dynamo.ChooseOneXelementFromCollectionView.extend({

  initialize: function() {
    this.guideData = this.options.guideData;
  },

  events: {
    "click .next" : "moveForward",
    "click .previous" : "moveBack",
    "click .do-action" : "performAction"
  },

  currentSlideIndex: function() {
    return this._currentSlideIndex;
  },

  moveBack: function() {
    try {
      this._currentSlideIndex = this._currentSlideIndex - 1;
      if (this._currentSlideIndex < 0) { this._currentSlideIndex = 0 };
      this.renderSlide();     
    } 
    catch (e) {
      console.warn("Error when clicking back: ", e);
    }
  },

  moveForward: function() {
    try {
      this._currentSlideIndex = this._currentSlideIndex + 1;
      if (this._currentSlideIndex > this.currentGuide.slides.length) { 
        this._currentSlideIndex = this.currentGuide.slides.length;
      };
      this.renderSlide();
    }
    catch (e) {
      console.warn("Error when clicking next: ", e);
    }
  },

  resetCurrentSlide: function() {
    this._currentSlideIndex = 0;
  },

  performAction: function(clickEvent) {
    var cid = $(clickEvent.currentTarget).data("cid");
    var action = this.currentSlide.actions.get(cid);
    action.execute();
  },

  render: function() {

    var self = this;

    this.$el.html( self._template({}) );

    self.guideSelect = new Dynamo.ChooseOneXelementFromCollectionView({
      template: DIT["dynamo/guides/index"],
      collection: self.collection
    });

    self.guideSelect.on("element:chosen", function() {
      
      self.currentGuide = self.guideSelect.chosen_element;
      self.currentGuideData = self.guideData.filter(function(guide) { return guide.xelement_id == self.currentGuide.id });
      self.resetCurrentSlide();
      self.renderSlide();
    });
    self.$el.find("div#guide-select-nav").prepend(self.guideSelect.render().$el);

    return this;

  },

  renderSlide: function() {
    var $slide_content = this.$el.find("div#current-guide-slide-content"),
        $actions = $("div#current-slide-actions");

    $slide_content.empty();
    $actions.empty();
    
    if (this.currentSlideIndex() === this.currentGuide.slides.length) {
      
      //We have reached the end of the guide.
      $slide_content.html(""+
        '<p><h3>You have reached the end of this guide, <br />"'+this.currentGuide.get_field_value("title")+'"</h3></p>'
      );
    
    } else {
      //render the current slide normally

      this.currentSlide = this.currentGuide.slides.at( this.currentSlideIndex() );  
      $slide_content.html( this.currentSlide.get_field_value("content") );
      this.currentSlide.actions.each(function(action) {
        $actions.append( 
          t.span({ style:"margin-right:10px;"},
            t.button(action.get("label"), { class: "cell do-action", "data-cid":action.cid })
          ) 
        );
      });
    
    }
  
    // $slide_content.prepend( t.tag("h3",this.currentGuide.get_field_value("title") ) );
    return this;
  }

});

// Depends on https://github.com/jakesgordon/javascript-state-machine
EditGuideView = Dynamo.EditGuideView = Dynamo.BaseUnitaryXelementView.extend({
  initialize: function (options) {

    this.guidedPageSM = StateMachine.create({
      initial: 'blank',
      events: [
        { name: 'skip',   from: ['blank', 'none', 'loaded'], to: 'none'   },
        { name: 'load',   from: ['blank', 'loaded'], to: 'loaded' },
        { name: 'clear',  from: ['blank', 'loaded'], to: 'blank'  }
      ]
    });

    this.slideEditing = StateMachine.create({
      initial: 'forbidden',
      events: [
        { name: 'allow', from: ['forbidden', 'allowed'], to: 'allowed' },
        { name: 'stop', from: ['forbidden', 'allowed'], to: 'forbidden' }
      ]
    });

    _.bindAll(this);
    this.initializeAsUnitaryXelement();
    this.model.on('change', this.render);
    this.model.on('sync', this.completeRender); //  completeRender = inherited method
    this.initializeAsSaveable(this.model);

    var self = this;

    //update view w/ most recent save-status information
    this.model.on('sync', function(model, response, options) {
      console.log("GUIDE SAVED:", model, response, options);
      self.$el.find("div#last-save").text( "Last Saved at: "+(new Date().toLocaleTimeString()) );
      // self.model.clearUnsavedChanges;
    })

    this.model.on('error', function(model, xhr, options) {
      console.warn("FAILED_GUIDE_SAVE:", model, xhr, options);
      self.$el.find("div#last-save").html(
        "<p style='color:red;'>Last Save FAILED at: "+(new Date().toLocaleTimeString())+"</p>"+
        "<p> You may want to try again or check the log.</p>" 
      );
    });
    this.model.on('save_status_change', this.renderSaveStatus);

    this._initializedIframeLoadFn = false;
    this._additionalRender = false;

  },

  attributes: function() {
    return {
      id: "guide-"+this.model.cid,
      class: "guide"
    }
  },

  events: function() {
    return {
      'keyup input#guide_title'         : "updateTitle",
      'keyup input#guide_description'   : "updateDescription",
      'click button.skip-guided-page'   : "skipGuidedPage",
      'click button.load-guided-page'   : "updateGuidedPage",
      'click button.clear-guided-page'  : "clearGuidedPage",  
      'click button.save'               : "saveGuide",
      'click button.delete'             : "destroyGuide"
    };
  },

  destroyGuide: function() {
    this.model.destroy();
    this.slidesView.remove();
    this.slidesView = null;
    this.$el.remove();
  },

  clearGuidedPage: function() {
    this.model.guided_page_url = "";
    this.slideEditing.stop();
    this.guidedPageSM.clear();
    this.clearInitialRender();
    this.render();
  },

  updateGuidedPage: function() {
    this.model.guided_page_url = $('input#guided_page_url').val();
    this.loadGuidedPage();
    this.guidedPageSM.load();
    this.initialRender(); 
    this.render();
  },

  skipGuidedPage: function() {
    this.model.guided_page_url = "[None]";
    this.guidedPageSM.skip();
    this.initialRender();
    this.render();
  },

  initializeOnIframeLoadFn: function() {
    var self = this;
    if (!this._initializedIframeLoadFn) {
      
      $(this.options.iframe_selector).load(function() {

        console.log("IFRAME LOADED", this.contentWindow.Backbone);

        this.contentWindow.Backbone.on("PageLoad:Complete", function() {

          window.console.log("In Page-Load Callback");

          // Once the iframe is loaded...
          self.usableElements = [];
          $(self.options.iframe_selector).contents().find("[id]").each(function() {
            self.usableElements.push({tagName: this.tagName.toLowerCase(), "idName": this.id, "className": this.className});
          });

          self.usableElements.sort(function(a,b) {
            // Put all elements w/ id's first
            if (a.idName && !b.idName) { return -1 }
            if (!a.idName && b.idName) { return 1  }

            // If they both have id's, sort by tag first
            if ( a.tagName < b.tagName ) {
              return -1
            }
            if ( a.tagName > b.tagName ) {
              return 1
            } 

            // Then by ID name
            if ( a.idName < b.idName ) {
              return -1
            }
            if ( a.idName > b.idName ) {
              return 1
            }

            // If we've gotten here, both id's were ""
            // if ( a.className < b.className ) {
            //   return -1
            // }
            // if ( a.className > b.className ) {
            //   return 1
            // }

            return 0;
          });// sort

        });

        console.log("Usable Elements in Guided Page", self.usableElements);
        $("#iframe-container").show();
        self.trigger("guided_page:loaded");

      }); //load


    }; // if
    this._initializedIframeLoadFn = true;
  },

  loadGuidedPage: function() {
    $(this.options.iframe_selector).prop("src", this.model.guided_page_url);
    this.initializeOnIframeLoadFn();
  },

  saveGuide: function() {
    var self = this;
    this.model.save();
  },

  _template: function(data, settings) {
    if (!this.compiled_template) {
      if (!this.template) {
        this.template = this.options.template || DIT["dynamo/guides/edit"];
      };
      this.compiled_template = _.template(this.template)
    };

    return this.compiled_template(data, settings);
  },

  updateTitle: function(clickEvent) {
    var self = this;
    var val = $(clickEvent.currentTarget).val();
    self.model.set({ 'title' : val });
    self.model.set_field_value('title', val );
  },

  updateDescription: function(clickEvent) {
    var self = this;
    var val = $(clickEvent.currentTarget).val();
    self.model.set_field_value('content_description', val );
  },  

  initialRender: function (argument) {
    //more of a 'state-based' render when it comes to guides...

    var atts;

    if (this.model.guided_page_url === "[None]") {
      this.guidedPageSM.skip();
    };


    atts = { 
      guide: this.model.get_fields_as_object(),
      guidedPageState: this.guidedPageSM.current
    };
    atts.guide.guided_page_url = this.model.guided_page_url;

    this.$el.html( this._template(atts) );

  },

  renderSlides: function() {
    var self = this,
        $slides_container = this.$el.find('div#slides');
    
    this.slidesView = new Dynamo.ChooseOneXelementFromCollectionView({
      collection: self.model.slides,
      canCreateNew: true,
      xelement_type: 'static_html'
    });

    this.model.slides.on("add", this.slidesView.render);
    this.model.slides.on("remove", this.slidesView.render);

    this.slidesView.on("element:chosen", function() {
      
      //Update Current Slide
      self.current_slide = null;
      self.current_slide = self.slidesView.chosen_element;

      //Add to collection once saved;
      if (  self.current_slide.isNew() && 
            !_.contains(self.model.slides, self.current_slide) ) {
        
        self.model.slides.add(self.current_slide);
        self.slidesView.render();
        
      };

      self.current_slide.on('change:title', self.slidesView.render);
      // Trigger Current Slide Change
      self.trigger("slide:chosen");

    });

    $slides_container.empty();
    $slides_container.append(this.slidesView.render().$el);
    this.slideEditing.allow();

  },

  render: function (argument) {

    if (!this.initiallyRendered()) { 
      this.initialRender(); 
      this.setInitialRender(); 
    };

    if ( this.guidedPageSM.is('blank') && this.model.guided_page_url ) {
      this.loadGuidedPage();
      this.guidedPageSM.load();
    };

    if (!this.guidedPageSM.is('blank') && this.slideEditing.is("allowed")) {
      var self = this;

      //refresh direct attributes (i.e., non-slides) with model values:
      _.each({ 
        title: 'input#guide_title',
        guided_page_url: "input#guided_page_url"
      }, function(value, key) {
        self.$el.children('div#guide_attributes').find(value).val( self.model.get_field_value(key) );  
      });  
    };

    this.renderSlides();
    this.renderSaveStatus();

    return this;
  }

});

editSlideView = Dynamo.EditSlideView = Dynamo.BaseUnitaryXelementView.extend({
  initialize: function (options) {
    var self = this;

    _.bindAll(this);
    this.initializeAsUnitaryXelement();
    this.model.on('change', this.render);
    this.model.on('sync', this.completeRender);
    this.initializeAsSaveable(this.model);

  },

  attributes: function() {
    return {
      id: "slide-"+this.model.cid,
      class: "slide"
    }
  },

  destroySlide: function() {
    delete this.editor;
    this.actionsView.remove();
    this.actionsView = null;
    this.model.destroy();
    this.clearInitialRender();
    this.$el.remove();   
  },

  events: function() {
    var e = {};
    change_title_key = "keyup input#"+this.model.cid+"-slide-title";
    change_content_key = "keyup textarea#"+this.model.cid+"-slide-content";
    e[change_title_key] = "updateTitle";
    e[change_content_key] = "updateContent";
    e["click button.delete-slide"] = "destroySlide";
    return e;
  },

  _template: function(data, settings) {
    if (!this.compiled_template) {
      if (!this.template) {
        this.template = this.options.template || DIT["dynamo/guides/slides/edit"];
      };
      this.compiled_template = _.template(this.template)
    };

    return this.compiled_template(data, settings);
  },

  updateTitle: function(clickEvent) {
    this.model.set_field_value('title', $(clickEvent.currentTarget).val() )
    this.model.trigger('change');
    this.model.trigger('change:title');
  },

  updateContent: function(newContent) {
    this.model.set_field_value('content', newContent );
    this.model.trigger('change');
    this.model.trigger('change:content');
  },

  initialRender: function (argument) {
    var atts,
        actionsView,
        self = this;

    console.log('INITIAL SLIDE RENDER');

    atts = {
      slide: self.model.get_fields_as_object()
    };
    self.$el.html( self._template( atts ) );

    self.editor = new wysihtml5.Editor(self.model.cid+"-slide-content", { 
      toolbar: self.model.cid+"-wysihtml5-toolbar", // id of toolbar element
      stylesheets: ["wysihtml5/website/css/stylesheet.css", "wysihtml5/website/css/editor.css"],
      parserRules:  wysihtml5ParserRules // defined in parser rules set 
    });

    self.editor.on("change", function() {
      self.updateContent( self.$el.find('textarea.slide-content:first').val() )
    });

    self.actionsView = new Dynamo.ManageCollectionView({
      collection: self.model.actions,
      display: { edit: true, show: false },
      guidedPageSelector: self.options.guidedPageSelector,
      enableAddExisting: false,
      editViewOpts: { 
        template: self.options.actionTemplate, 
        actionTargets: self.options.actionTargets,
        guidedPageSelector: self.options.guidedPageSelector,        
      },
      editViewClass: editActionView
    });
    
    this.$el.find('.slide-actions:first').html(self.actionsView.render().$el);


  },

  remove: function() {
    this.$el.remove();
  },

  render: function (argument) {
    this.renderSaveStatus();
    if (!this.initiallyRendered()) {
      this.initialRender();
      this.setInitialRender();
    } 
    return this;
  }

});


editActionView = Backbone.View.extend({
  initialize: function() {
    _.bindAll(this);
    this.allActions = _.keys(ActionDictionary);
  },

  events: {
    "keyup input[name='label']" : "updateLabel",
    "change select[name='effect']": "updateAction",
    "change select[name='target']" : "updateAttributes",
    "keydown input[name='action_attribute']" : "updateAttributes",
    "click button.test-action": "testAction"
  },

  _template: function(data, settings) {
    if (!this.compiled_template) {
      if (!this.template) {
        this.template = this.options.template || DIT["dynamo/guides/slides/actions/edit"];
      };
      this.compiled_template = _.template(this.template)
    };

    return this.compiled_template(data, settings);
  },

  updateAction: function(changeEvent) {
    this.model.set({ effect: $(changeEvent.currentTarget).val() });
    console.log("Action changed to: ", this.model.get('effect'));
  },

  updateAttributes: function(clickEvent) {
    var new_values = {
      label: this.$el.find("input[name='label']:first").val(), 
      effect: this.$el.find("select[name='effect']:first").val(),
      target: this.$el.find("select[name='target']:first").val(),
      duration: this.$el.find("input[name='duration']:first").val(),
      actionOptionsValues: {}
    };

    this.$el.find("input[name='action_attribute']").each(function(index, value) {
      new_values.actionOptionsValues( $(this).data('attribute-name') ) = $(this).val();
    });

    this.model.set(new_values);
  },

  updateLabel: function(changeEvent) {
    this.model.set({ label: $(changeEvent.currentTarget).val()})
    this.$el.find("button.test-action").text(this.model.get("label"));
  },

  testAction: function() {
    this.model.execute(this.options.guidedPageSelector);
  },

  render: function() {
    var viewAtts = {};
    viewAtts.actionsAvailable = this.allActions;
    viewAtts.actionTargets = this.options.actionTargets;
    viewAtts.action = this.model.toJSON();
    this.$el.html(this._template(viewAtts));
  }

});