// Guides.Views.js


// Depends on https://github.com/jakesgordon/javascript-state-machine
EditGuideView = Dynamo.EditGuideView = Dynamo.BaseUnitaryXelementView.extend({
  initialize: function (options) {

    this.guidedPageSM = StateMachine.create({
      initial: 'blank',
      events: [
        { name: 'load', from: ['blank', 'loaded'], to: 'loaded' },
        { name: 'clear', from: ['blank', 'loaded'], to: 'blank' }
      ]
    });

    this.gDocSM = StateMachine.create({
      initial: 'blank',
      events: [
        { name: 'load', from: ['blank', 'loaded'], to: 'loaded' },
        { name: 'clear', from: ['blank', 'loaded'], to: 'blank' }
      ]
    });

    this.slideEditing = StateMachine.create({
      initial: 'forbidden',
      events: [
        { name: 'allow', from: 'forbidden', to: 'allowed' },
        { name: 'stop', from: ['forbidden', 'allowed'], to: 'forbidden' }
      ]
    });

    _.bindAll(this);
    this.initializeAsUnitaryXelement();
    this.model.on('change', this.render);
    this.model.on('sync', this.completeRender); //  completeRender = inherited method
    this.initializeAsSaveable(this.model);

    // Set the Guide as having unsaved changes
    // when a question changes.
    // Currently, this makes sense b/c the view provides 1
    // save button to the user for saving the entire question group.
    // If any question is altered, then it qualifies as a save status
    // change event on the questionGroup even though
    // no data at the question-group level.
    // Perhaps something to optimize later.
    this.model.slides.on('change', this.setUnsavedChanges);

    this.model.on("import:success", this.completeRender); //  completeRender = inherited method

    this.model.on("import:error", function() {
      alert("There was an error importing the Google Doc, you can check the console for more information.");
    });

  },

  attributes: function() {
    return {
      id: "guide-"+this.model.cid,
      class: "guide"
    }
  },

  updateTitle: function(clickEvent) {
    var self = this;
    var val = $(clickEvent.currentTarget).val();
    self.model.set({ 'title' : val });
    self.model.set_field_value('title', val );
  },

  events: function() {
    return {
      'keyup input#guide_title'       : "updateTitle",
      'click button.load-guided-page' : "loadGuidedPage",
      'click button.import'           : "updateDocURLAndImport",
      'click button.save'             : "saveSaveableModel"
    };
  },

  updateDocURLAndImport: function() {
    this.current_gdoc = null;
    var gdoc_url = $('input#private_gdoc_url').val();
    this.model.set_field_value("private_gdoc_url", gdoc_url);
    this.importFromGDoc()
  },

  importFromGDoc: function() {
    this.model.importFromGDoc();
    this.gDocSM.load();
  },

  loadGuidedPage: function() {
    var self = this,
        src = $('input#guided_page_url').val();
    self.model.set_field_value("guided_page_url", src);
    self.usableElements = [];
    $(self.options.iframe_selector).prop("src", src);
    $(self.options.iframe_selector).load(function() {
      // once the iframe is loaded...
      $(self.options.iframe_selector).contents().find("div,span,p,a,button").each(function() { 
        if (this.id || this.className ) {
          self.usableElements.push({tagName: this.tagName.toLowerCase(), "idName": this.id, "className": this.className});
        };
      });
      self.usableElements.sort(function(a,b) {
        //put all elements w/ id's first
        if (a.idName && !b.idName) { return -1 }
        if (!a.idName && b.idName) { return 1  }

        //if they both have id's, sort by tag first
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

        //If we've gotten here, both id's were ""
        if ( a.className < b.className ) {
          return -1
        }
        if ( a.className > b.className ) {
          return 1
        }

        return 0;
      });
      console.log("Available Elements in Guided Page", self.usableElements);
      alert("iframe loaded!");
      $("#iframe-container").show();  
      self.trigger("guided_page:loaded");
    });
  },

  _template: function(data, settings) {
    if (!this.compiled_template) {
      if (!this.template) {
        this.template = templates.edit_guide;
      };
      this.compiled_template = _.template(this.template)
    };

    return this.compiled_template(data, settings);
  },

  initialRender: function (argument) {
    //more of a 'state-based' render when it comes to guides...

    if (this.slideEditing.is("allowed")) {
      var self = this;

      //refresh direct attributes (i.e., non-slides) with model values:
      _.each({ 
        title: 'input#guide_title',
        guided_page_url: "input#guided_page_url",
        private_gdoc_url: "input#private_gdoc_url"
      }, function(value, key) {
        self.$el.children('div#guide_attributes').find(value).val( self.model.get_field_value(key) );  
      });  
      
      return;
    };

    var atts;

    atts = { 
      guide: this.model.get_fields_as_object(),
      guidedPageState: this.guidedPageSM.current,
      gDocState: this.gDocSM.current
    };

    this.$el.html( this._template(atts) );

    if (this.guidedPageSM.is('blank') && this.model.get_field_value("guided_page_url")) {
      this.loadGuidedPage();
      this.guidedPageSM.load();
    };

    if ( this.model.get_field_value("private_gdoc_url")) {
      this.gDocSM.load();
    };

    atts = { 
      guide: this.model.get_fields_as_object(),
      guidedPageState: this.guidedPageSM.current,
      gDocState: this.gDocSM.current
    };
    this.$el.html( this._template(atts) );
    
    this.renderSlides(); 

  },

  renderSlides: function() {
    var self = this;

    
    this.slidesView = new Dynamo.ChooseOneXelementFromCollectionView({
      collection: self.model.slides,
      canCreateNew: true,
      xelement_type: 'static_html'
    });

    this.slidesView.on("element:chosen", function() {
      
      //Update Current Slide
      self.current_slide = self.slidesView.chosen_element;

      //Add to collection once saved;
      if (  self.current_slide.isNew() && 
            !_.contains(self.model.slides, self.current_slide) ) {
        
        self.current_slide.once("sync", function() {
          self.model.slides.add(self.current_slide);
        });
        
      };

      // Trigger Current Slide Change
      self.trigger("slide:chosen");

    });

    this.$el.find('div#slides').append(this.slidesView.render().$el);
    debugger;
    this.slideEditing.allow();
  },

  render: function (argument) {

    this.initialRender();

    // this.renderSaveStatus();

    return this;
  }

});

ShowSlideEditActionsView = Dynamo.ShowSlideEditActionsView = Dynamo.BaseUnitaryXelementView.extend({
  initialize: function (options) {

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

  events: function() {
    return {
      'click button.save': "saveSaveableModel"
    };
  },

  _template: function(data, settings) {
    if (!this.compiled_template) {
      if (!this.template) {
        this.template = templates.show_slide_edit_actions;
      };
      this.compiled_template = _.template(this.template)
    };

    return this.compiled_template(data, settings);
  },

  initialRender: function (argument) {
    var atts;
    
    atts = { 
      slide: this.model.get_fields_as_object() 
    };

    self.$el.html( self._template( atts ) );

    // actionsView = new Dynamo.ChooseOneXelementFromCollectionView({
    //   collection: self.model.slides,
    //   xelement_type: 'slide',
    //   canCreateNew: true
    // });

    // actionsView.on("element:chosen", function() {
      
    //   //Update Current Slide
    //   self.current_slide = actionsView.chosen_element;

    //   //Add to collection once saved;
    //   if (  self.current_slide.isNew() && 
    //         !_.contains(self.model.slides, self.current_slide) ) {
        
    //     self.current_slide.once("sync", function() {
    //       self.model.slides.add(self.current_slide);
    //     });
        
    //   };

    //   // Trigger Current Slide Change
    //   self.trigger("action:chosen");

    // });

    // this.$el.find('div#slides').append(actionsView.$el);
    // actionsView.render();

  },

  render: function (argument) {
    this.renderSaveStatus();
    if (!this.initiallyRendered()) {
      
      console.log('INITIAL SLIDE RENDER');
      this.initialRender();
      this.setInitialRender();

    } else {
      
      var self = this;

      console.log('SLIDE RE-RENDER');
      _.each({ 
        title: 'input#slide-title'
      }, function(value, key) {
        self.$el.children('div#slide-attributes').find(value).val( self.model.get_field_value(key) );  
      });

    };
    return this;
  }

});

editActionView = Backbone.View.extend({
  initialize: function() {
    _.bindAll(this);
    this.allActions = _.keys(ActionDictionary);
  },

  events: {
    "change select[name='name']": "changeAction",
    "change select[name='target']" : "updateAttributes",
    "keydown input[name='action_attribute']" : "updateAttributes",
  },

  _template: function(data, settings) {
    if (!this.compiled_template) {
      if (!this.template) {
        this.template = this.options.template || "NO EDIT-ACTION TEMPLATE";
      };
      this.compiled_template = _.template(this.template)
    };

    return this.compiled_template(data, settings);
  },

  changeAction: function(changeEvent) {
    this.model.set({ name: $(changeEvent.currentTarget).val()})
    console.log("Action changed to: ", this.model.get('name'));
  },

  updateAttributes: function(clickEvent) {
    var new_values = {
      name: this.$el.find("input[name='name']:first").val(),
      target: this.$el.find("select[name='target']:first").val(),
      duration: this.$el.find("input[name='duration']:first").val(),
      actionOptionsValues: {}
    };

    this.$el.find("input[name='action_attribute']").each(function(index, value) {
      new_values.actionOptionsValues( $(this).data('attribute-name') ) = $(this).val();
    });

    this.model.set(new_values);
  },

  render: function() {
    var viewAtts = {};
    viewAtts.actionsAvailable = this.allActions;
    viewAtts.actionTargets = this.options.actionTargets;
    viewAtts.action = this.model.toJSON();
    this.$el.html(this._template(viewAtts));
  }

});

EditSlideView = Dynamo.EditSlideView = Dynamo.BaseUnitaryXelementView.extend({
  initialize: function (options) {

    _.bindAll(this);
    this.initializeAsUnitaryXelement();
    this.model.on('change', this.render);
    this.model.on('sync', this.completeRender);
    this.initializeAsSaveable(this.model);

    // Set the Guide as having unsaved changes when a slide's actions change.
    // That is, if any slide action is altered, then it qualifies as a save-status change event
    // on the whole Guide even though no data at the Guide level has changed.
    
    // Currently, this makes sense b/c the view provides 
    // 1 save button to the user for saving the entire guide.
    // Perhaps something to optimize later, or is this implementation better for the user?
    // this.model.actions.on('change', this.setUnsavedChanges);

  },

  attributes: function() {
    return {
      id: "slide-"+this.model.cid,
      class: "slide"
    }
  },

  updateTitle: function(clickEvent) {
    this.model.set_field_value('title', $(clickEvent.currentTarget).val() )
  },

  updateContent: function(newContent) {
    this.model.set_field_value('content', newContent );
    debugger;
    return this;
  },

  events: function() {
    return {
      'keydown input#slide-title': "updateTitle",
      'click button.test-actions': "testActions"
    };
  },

  _template: function(data, settings) {
    if (!this.compiled_template) {
      if (!this.template) {
        this.template = this.options.template || templates.edit_slide;
      };
      this.compiled_template = _.template(this.template)
    };

    return this.compiled_template(data, settings);
  },

  initialRender: function (argument) {
    var atts,
        actionsView,
        self = this;

    var atts = {
      slide: self.model.get_fields_as_object()
    }
    self.$el.html( self._template( atts ) );

    self.editor = new wysihtml5.Editor(self.model.cid+"-slide-content", { 
      toolbar: self.model.cid+"-wysihtml5-toolbar", // id of toolbar element
      stylesheets: ["css/reset.css", "css/editor.css"],
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
        actionTargets: self.options.actionTargets 
      },
      editViewClass: editActionView
    });

    this.$el.find('.slide-actions:first').append(self.actionsView.render().$el);

  },

  testActions: function() {
    var self = this;

    self.model.actions.each(function(action) {
      
      var duration;

      try { 
        duration = parseInt(action.get("duration")) 
      } 
      catch (e) { 
        console.warn("Duration is not a parse-able number!", action.get("duration"), "; instead, setting to 400ms");
        action.set({"duration": 400});
        duration = 400;
      }; 

      $(self.options.guidedPageSelector).contents().find(action.get("target")).each(function() {
        $(this).effect(action.get("name"), action.effectOptions(), duration);
      });

    });

  },

  render: function (argument) {
    this.renderSaveStatus();
    if (!this.initiallyRendered()) {
      
      console.log('INITIAL SLIDE RENDER');
      this.initialRender();
      this.setInitialRender();

    } else {
      
      var self = this;

      console.log('SLIDE RE-RENDER');
      _.each({ 
        title: 'input#slide_title'
      }, function(value, key) {
        self.$el.children('div#slide_attributes').find(value).val( self.model.get_field_value(key) );  
      });

    };
    return this;
  }

});