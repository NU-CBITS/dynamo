// templates.js

// Consider this the 'production' version of templates.html
// every template has been minified into an individual javascript string.
// 
// Some of these templates may not be able to converted back into a block of html b/c of an encoding issue 
// present at some point in the pulled-from-the-templates-page.html->stored-in-local-storage->retrieved cycle.
// b/c we don't have time to fully solve this problem ATM, we instead them here as a single string.
// 
// Templates here must not-use or escape single-quotes in their body.
// - If you need to edit any of these templates:
//  - copy it into an empty editor ( I recommend sublime )
//  - pretty-html format it
//  - make your edits
//  - use "http://www.textfixer.com/tools/remove-line-breaks.php" or similar to remove them.
//  - enclose the string in single-quotes
//  - copy over the string here.
// 
// Instead of the procedure above, what should happen is we should have all of social networking in a
// pre-processor application, such as the ruby gem 'middleman', or the node equivalent.
// 
// Grumbles the clown,
// -gs 4/24/2013

DIT = {};
DIT["dynamo/core/choose_one_xelement"] 			= '<div class="widget"> <div class="widget-header widget-header-default"> <h3>(%= collection_name %)</h3> </div> <div class="widget-content"> (% if (canCreateNew) { %) <div> <button class="btn create_new btn-success" data-xelement_type="(%= xelement_type %)">Create (%= this.collection.prettyModelName() %)</button> </div> (% }; %) <div> <legend>Choose One:</legend> (% var timeSecondsForRadioGroup = new Date().getTime() %) (% _.each(elements, function(e) { %) <label class="radio"> <input type="radio" name="guide-radio-buttons-(%= timeSecondsForRadioGroup %)" class="choose_element" data-cid="(%= e.cid %)">(%= e.html %) </label> (% }); %) </div> </div> </div>';
DIT["dynamo/core/input_group"] 					= '<div id="(%= id %)" name="(%= name %)_field" class="(%= type %)_group"> (% if (type == "select") { %) (%= t.label(label) %) <select name="(%= name %)"> (% _.each(options, function(o, index) { html_atts = { value: o.value }; if (selected_value == o.value) { html_atts.selected = "selected" }; print( t.formInput("option", o.label, html_atts) ); }); %) </select> (% }; %) (% if (type == "radio" || type == "checkbox") { %) (% var numberOfOptions = 1 %) (% _.each(options, function(o, index) { var html_atts = { name: name, value: o.value, numberOfOptions: numberOfOptions}; if (selected_value == o.value) { html_atts.checked = "checked" }; print( t.formInput(type, o.label, html_atts) ); numberOfOptions++ }); %) (% }; %) </div>';
DIT["dynamo/core/manage_collection"]			= '<div class="collection_widget"> <div class="start"> (% start_content ? print(start_content) : null; %) </div> (% if (display.create) { %) <div class="btn-toolbar"> <div class="btn-group"> (% // first data collection index is "-1" // b/c later code increments the index so as to let it insert "after" this // index location. hence if you want to insert at the beginning, the index // is -1 so that you actually insert at 0. %) <button class="btn add-new-(%=element_code_name%)" data-collection-index="0"> Create (%= element_pretty_name %) </button> (% if (canAddExisting) { %) <button class="btn add-existing-(%=element_code_name%)" data-collection-index="0"> Add Existing (%= element_pretty_name %) </button> (% }; %) </div> </div> (% }; %) <div class="elements"> </div> <div class="end"> (% end_content ? print(end_content) : null; %) </div> </div>';
DIT["dynamo/core/manage_collection/element"] 	= '<div class="(%= element_code_name %) element" data-collection_index="(%= index %)"> (% if ( (typeof(display.del) !== "undefined") && display.del) { %) <div class="delete_container btn-toolbar" style="margin-top: 0px;"> <button class="btn btn-danger delete (%= element_code_name %)" data-collection_index="(%= index %)"> <!-- <i class="icon-trash"></i> --> <i class="icon-trash"> </i> Delete (%= element_pretty_name %) </button> </div> (% } %) (% if ((typeof(display.edit) !== "undefined") && display.edit) { print(t.form("", { class: "edit_container widget", style: "margin-bottom:10px;" })) } %) (% if (typeof(display.show) !== "undefined" && display.show) { print(t.div("", { class: "show_container widget" })) } %) </div> (% if ((typeof(display.create) !== "undefined") && display.create) { %) <div class="btn-toolbar"> <div class="btn-group"> <button class="btn add-new-(%= element_code_name %)" data-collection-index="(%= (index + 1) %)"> Create (%= element_pretty_name %) </button> (% if (typeof(canAddExisting) !== "undefined") { %) <button class="btn add-existing-(%= element_code_name %)" data-collection-index="(%= (index + 1) %)"> Add Existing (%= element_pretty_name %) </button> (% } %) </div> </div> (% } %)';
DIT["dynamo/users/show"] 						= '<div class="user" data-position="(%= position %)"> <span class="attribute username">(%= user.username %)</span> <span class="attribute guid">((%= user.guid %))</span> </div>';
DIT["dynamo/xelements/show"] 					= '<div class="attribute title"> (%= data.title %) </div> (% _.each(data, function(value, label) { %) <div> <span class="label">(%= label %)</span>: <span class="attribute (%= label %)">(%= value %)</span> </div> (% }); %)';
DIT["dynamo/guides/index_without_dropdowns"]    = '<div class="row-fluid"> <h3>Guides <small id="current-guide-title"></small></h3> <ul id="guide-select" class="accordion-header nav pull-right" style="margin: inherit 0"> <li class="caret-icons"> <a><i class="icon-caret-right"></i></a> </li> </ul> </div>';
DIT["dynamo/guides/index_in_navbar"]			= '<div class="row-fluid navbar"> <h1 class="text-prog-blue"> <i class="icon-lightbulb"></i> Learn <small class="text-prog-blue">Today&#39;s Lesson</small> </h1> <ul id="guide-select" class="accordion-header nav pull-right" style="margin: inherit 0"> <li class="dropdown"> <a href="#" class="dropdown-toggle" data-toggle="dropdown">Choose Guide <b class="caret"></b></a> <ul id="guides-list" class="dropdown-menu"> (% _.each(elements, function(e) { %) <li class="choose_element" data-cid="(%= e.id %)"><a>(%= e.html %)</a></li> (% }) %) </ul> </li> </ul> </div>';
DIT["dynamo/guides/edit"] 						= '<fieldset> <div id="guide_attributes"> <label class="text" for="guide_title">Title <input type="text" placeholder="Guide Title" id="guide_title" value="(%= guide.title %)" class="span6"> </label> <label class="text" for="guide_description">Description <input id="guide_description" class="span6" type="text" placeholder="Description" value="(%= guide.content_description %)"> </label> (%; console.log("guidedPageState: ", guidedPageState); %) (% if (!guide.guided_page_url) { %) <h3> Guided Page </h3> <div><p> Specify the current version of the page for which this guide is being developed. If you are only developing content and do not have a page that this guide is guiding, click "skip". If you <strong>do not know</strong> what page you are developing this guide for, you may have <strong>larger problems than I am able to help you with.</strong> </p></div> <label class="text" for="guided_page_url">URL <input id="guided_page_url" type="text" class="span12" placeholder="URL of the page this guide is for" value="(%= guide.guided_page_url %)"> </label> <div class="btn-toolbar"> <button class="load-guided-page btn btn-primary"><i class="icon-upload-alt"></i> Load Guided Page</button> <button class="skip-guided-page btn btn-primary"><i class="icon-upload-alt"></i> Skip </button> </div> (% } else if (guidedPageState !== "skip") { %) <label class="text" for="guided_page_url">URL <input id="guided_page_url" type="text" class="span12" placeholder="URL of the page this guide is for" value="(%= guide.guided_page_url %)" disabled="disabled"> </label> <div class="btn-toolbar"> <button class="load-guided-page btn"><i class="icon-repeat"></i> Reload</button> <button class="clear-guided-page btn btn-warning" title="Changing the page to which this guide refers to has a chance of screwing up any actions you&#39;ve configured. Make sure you <strong>know what you are doing.</strong>" >Clear Guided Page</button> </div> (% }; %) <div class="on-slide-edit" style="(% if (guidedPageState === "blank") { %) display:none; (%} else { %) display:block; (% }; %)"> <hr> <div id="slides"></div> </div> <hr> <div id="last-save"></div> <div class="label save_status"></div> <div class="btn-toolbar"> <button class="save btn btn-primary">Save Guide</button> <button class="delete btn btn-danger "><i class="icon-trash"></i> Delete</button> </div> </div> </fieldset>';
DIT["dynamo/guides/slides/edit"] 				= '<div style="display:block;clear:auto;"> <span class="pull-right"><button class="btn btn-danger delete-slide">Delete Slide</button></span> </div> <form> <div id="slide_attributes"> <div> <label for="(%= slide.cid %)-slide-title">Title</label> <input id="(%= slide.cid %)-slide-title" class="title input-large" type="text" placeholder="Slide Title" value="(%= slide.title %)"/> </div> <div> <div id="(%= slide.cid %)-wysihtml5-toolbar" class="toolbar" style="display: none;"> <a data-wysihtml5-command="bold" title="CTRL+B">bold</a> | <a data-wysihtml5-command="italic" title="CTRL+I">italic</a> | <a data-wysihtml5-command="createLink">insert link</a> | <a data-wysihtml5-command="insertImage">insert image</a> | <a data-wysihtml5-command="formatBlock" data-wysihtml5-command-value="h1">h1</a> | <a data-wysihtml5-command="formatBlock" data-wysihtml5-command-value="h2">h2</a> | <a data-wysihtml5-command="insertUnorderedList">insertUnorderedList</a> | <a data-wysihtml5-command="insertOrderedList">insertOrderedList</a> | <a data-wysihtml5-command="foreColor" data-wysihtml5-command-value="red">red</a> | <a data-wysihtml5-command="foreColor" data-wysihtml5-command-value="green">green</a> | <a data-wysihtml5-command="foreColor" data-wysihtml5-command-value="blue">blue</a> | <a data-wysihtml5-command="undo">undo</a> | <a data-wysihtml5-command="redo">redo</a> | <a data-wysihtml5-command="insertSpeech">speech</a> <a data-wysihtml5-action="change_view">switch to html view</a> <div data-wysihtml5-dialog="createLink" style="display: none;"> <label> Link: <input data-wysihtml5-dialog-field="href" value="http://"> </label> <a data-wysihtml5-dialog-action="save">OK</a>&nbsp;<a data-wysihtml5-dialog-action="cancel">Cancel</a> </div> <div data-wysihtml5-dialog="insertImage" style="display: none;"> <label> Image: <input data-wysihtml5-dialog-field="src" value="http://"> </label> <label> Align: <select data-wysihtml5-dialog-field="className"> <option value="">default</option> <option value="wysiwyg-float-left">left</option> <option value="wysiwyg-float-right">right</option> </select> </label> <a data-wysihtml5-dialog-action="save">OK</a>&nbsp;<a data-wysihtml5-dialog-action="cancel">Cancel</a> </div> </div> <textarea id="(%= slide.cid %)-slide-content" class="slide-content" style="width:95%;height:400px" placeholder="Enter content">(%= slide.content %)</textarea> <div class="btn-toolbar"> <!-- <br /> --> <input type="reset" class="btn btn-warning" value="Reset Form"> </div> </div> </div> </form> <div class="actions-container"> <div class="table" style="display:table; width:100%"> <div style="display:table-row;"> <span style="display:table-cell;"> Label </span> <span style="display:table-cell;"> Action </span> <span style="display:table-cell;"> Target </span> <span style="display:table-cell;"> Duration </span> <span style="display:table-cell;"> Additional </span> <span style="display:table-cell;"> Test </span> </div> </div> <div id="(%= slide.cid %)-slide-actions" class="slide-actions" style="width:100%"> </div> </div>';
DIT["dynamo/guides/slides/actions/edit"] 		= '<div class="action"> <span class="cell attribute"> (%= action.label %) </span> <span class="cell attribute effect"> <select name="effect" class="input-small"> (% var selected_clause; _.each(actionsAvailable, function(effect_name) { ; %) <option value="(%= effect_name %)" (% if (action.effect == effect_name) { %) selected="selected" (% } %)> (%= effect_name %) </option> (% }); %) </select> </span> <span class="cell attribute target"> <option (% if (!_.contains(actionTargets, action.target)) { %) selected="selected" (% }; %)> </option> <select name="target"> (% _.each(actionTargets, function(selector) { %) <option value="(%= selector %)" (% if (action.target == selector) { %) selected="selected" (% } %) > (%= selector %) </option> (% }); %) </select> </span> <span class="cell attribute duration"> <input class="input-small" type="text" name="duration" data-attribute-name="duration" value="(%= action.duration %)" /> ms </span> <span class="cell attribute action_attributes"> </span> <span class="cell test-action btn"> (%= action.label %) </span> </div>';
DIT["dynamo/question_groups/show"] 				= '<h1><span class="title">(%=title%)</span></h1> (% if (typeof(directions) !== "undefined") { %) <h2>Directions</h2> <div id="directions"> (%= directions %) </div> (% }; %) <div class="start">(%= start_content %)</div> <div id="current-question"> </div> (% if (!no_navigation) { %) <div class="assessment navigation"> <button class="btn previous">previous</button> <button class="btn next">next</button> </div> (% }; %) <div class="end">(%= end_content %)</div>';
DIT["dynamo/question_groups/edit"] 				= '<div><span class="pull-right label save_status (%= current_save_state %)">(%= current_save_text %)</span> </div> <div class="clearfix"></div> <h1> <label>Title</label> <input class="title editable" style="width:90%;" type="text" value="(%=title%)" placeholder="Type title of Assessment" /> </h1> <div class="metadata"></div> <h1>Questions</h1> <div id="questions"></div> <hr> <button class="btn save btn-primary">Save Now</button>';
DIT["dynamo/questions/show"] 					= '<div class="widget-header"> (% if (position) { print( t.h3(position+".", {class: "position"}) ); }; %) </div> <div class="widget-content"> <div class="instructions"></div> <div class="content"></div> <div class="responseGroup"></div> </div>';
DIT["dynamo/questions/edit"] 					= '<div class="widget-header navbar" style="margin-bottom: 0px;"> <h3>(% if (position) { print(position+".") } else { print("Question)") }; %)</h3> <ul class="nav pull-right accordion-header"> <li> <h3 class="pull-right label save_status (%= current_save_state %)">(%= current_save_text %)</h3> </li> <li class="caret-icons"> <!-- <a><i class="icon-caret-right"></i></a> --> </li> </ul> </div> <div class="widget-content"> <label>Name</label> <!-- upper most level of question name --> <input class="title editable" style="width:90%;" type="text" placeholder="Type how you will refer to this question here..."/> <div class="instructions"></div> <div class="content"></div> <h3>Responses:</h3> <div class="responseGroup"></div> </div>';
DIT["dynamo/questions/responses/edit"] 			= '<!-- type of question select --> <div class="responseType attribute edit"></div> <!-- Name --> <div class="name attribute edit"> <label class="name_value"></label> </div> <!-- Label --> <div class="typeSpecificAttributesContainer"></div> <!-- future fields based on what type of specific attr container --> <div class="responseValuesContainer"></div>';
DIT["dynamo/activity_tracker/edit_event"] 		= '<div id="edit-event-toggle-bar" class="widget-header orange navbar"> <h3> Event Editor </h3> <ul class="nav pull-right accordion-header"> <li class="caret-icons"> <a><i class="icon-caret-right"></i></a> </li> <ul> </div> <form id="edit-event" class="form-horizontal widget-content form-condensed accordion-body"> <div class="row-fluid"> <div id="edit-title-attribute-container" class="control-group span12"> <label id="title-attribute-label" class="control-label"> Title </label> <div class="controls"> <input id="title-attribute-input" type="text" placeholder="Description" class="input-xlarge" data-bind="value: title"> <div id="title-attribute-question-icon" style="font-size: 24.5px;" class="inline text-prog-gray"> <i class="icon-question-sign"> </i> </div> </div> </div> </div> <!-- Start and End Times --> <div id="edit-start-time-attribute-container" class="control-group"> <label id="start-time-attribute-label" class="control-label"> Starts </label> <div class="controls"> <select id="start-time-month" data-bind="value: start_month" class="input-mini"> <option value="0"> Jan </option> <option value="1"> Feb </option> <option value="2"> Mar </option> <option value="3"> Apr </option> <option value="4"> May </option> <option value="5"> June </option> <option value="6"> July </option> <option value="7"> Aug </option> <option value="8"> Sept </option> <option value="9"> Oct </option> <option value="10"> Nov </option> <option value="11"> Dec </option> </select> <input id="start-time-day" type="text" placeholder="dd" class="input-xmini" data-bind="value: start_date"> <input id="start-time-year" type="text" placeholder="yyyy" class="input-xmini" data-bind="value: start_year"> <select id="start-time-hour" data-bind="value: start_hour" class="input-small"> <option value="0"> 12 am </option> <option value="1"> 1 am </option> <option value="2"> 2 am </option> <option value="3"> 3 am </option> <option value="4"> 4 am </option> <option value="5"> 5 am </option> <option value="6"> 6 am </option> <option value="7"> 7 am </option> <option value="8"> 8 am </option> <option value="9"> 9 am </option> <option value="10"> 10 am </option> <option value="11"> 11 am </option> <option value="12"> 12 pm </option> <option value="13"> 1 pm </option> <option value="14"> 2 pm </option> <option value="15"> 3 pm </option> <option value="16"> 4 pm </option> <option value="17"> 5 pm </option> <option value="18"> 6 pm </option> <option value="19"> 7 pm </option> <option value="20"> 8 pm </option> <option value="21"> 9 pm </option> <option value="22"> 10 pm </option> <option value="23"> 11 pm </option> </select> <input id="start-time-minute" type="text" placeholder="min" class="input-xmini" data-bind="value: start_minute"> </div> </div> <div id="edit-end-time-attribute-container" class="control-group"> <label id="end-time-attribute-label" class="control-label"> Ends </label> <div id="end-time-month" class="controls"> <select data-bind="value: end_month" class="input-mini"> <option value="0"> Jan </option> <option value="1"> Feb </option> <option value="2"> Mar </option> <option value="3"> Apr </option> <option value="4"> May </option> <option value="5"> June </option> <option value="6"> July </option> <option value="7"> Aug </option> <option value="8"> Sept </option> <option value="9"> Oct </option> <option value="10"> Nov </option> <option value="11"> Dec </option> </select> <input id="end-time-day" type="text" placeholder="dd" class="input-xmini" data-bind="value: end_date"> <input id="end-time-year" type="text" placeholder="yyyy" class="input-xmini" data-bind="value: end_year"> <select id="end-time-hour" data-bind="value: end_hour" class="input-small"> <option value="0"> 12 am </option> <option value="1"> 1 am </option> <option value="2"> 2 am </option> <option value="3"> 3 am </option> <option value="4"> 4 am </option> <option value="5"> 5 am </option> <option value="6"> 6 am </option> <option value="7"> 7 am </option> <option value="8"> 8 am </option> <option value="9"> 9 am </option> <option value="10"> 10 am </option> <option value="11"> 11 am </option> <option value="12"> 12 pm </option> <option value="13"> 1 pm </option> <option value="14"> 2 pm </option> <option value="15"> 3 pm </option> <option value="16"> 4 pm </option> <option value="17"> 5 pm </option> <option value="18"> 6 pm </option> <option value="19"> 7 pm </option> <option value="20"> 8 pm </option> <option value="21"> 9 pm </option> <option value="22"> 10 pm </option> <option value="23"> 11 pm </option> </select> <input id="end-time-minute" type="text" placeholder="min" class="input-xmini" data-bind="value: end_minute"> </div> </div> <!-- TAGS --> <div id="edit-tags-attribute-container" class="control-group"> <label id="tags-attribute-label" class="control-label"> Tags (<span data-bind="text: tags().length"></span>) </label> <div class="controls"> <div data-bind="foreach: { data: tags }"> <div class="input-tag"> <input class="edit-tag-attribute" type="text" data-bind="value: $data.value, valueUpdate: \'afterkeydown\'" /> <button class="btn remove-tag-attribute" data-bind="click: $data.remove"> <i class="icon-remove"> Remove </i> </button> </div> </div> <button class="btn add-tag-attribute" data-bind="click: tags_addElement"> <i class="icon-plus"> </i> Add Tag </button> </div> </div> <!-- ACTIVITY COMPLETION --> <div id="edit-event-completed-attribute-container" class="control-group" data-bind="if: inReviewing"> <label class="pull-left" style="padding-right:10px;padding-top: 5px;text-align: right;margin-bottom: 5px;"> Completed This Activity </label> <div class="controls"> <label id="event-completed-no-label" class="radio inline"> <input type="radio" value="0" data-bind="checked: eventCompleted" /> No </label> <label id="event-completed-yes-label" class="radio inline"> <input type="radio" value="1" data-bind="checked: eventCompleted" /> Yes </label> </div> </div> <div id="pleasure-attributes-container" class="control-group"> <!-- PLEASURE - PREDICT --> <div id="edit-pleasure-predict-attribute-container" data-bind="if: inScheduling"> <div class="text-center" style="font-weight:bold;padding:5px 0px;"> Please rate your predicted PLEASURE during the event </div> <div class="row-fluid"> <div class="span11"> <div id="edit-pleasure-predict-slider" class="slider" style="margin-top: 3px;" data-bind="slider: predicted_pleasure, sliderOptions: {min: 0, max: 10, value: 5, range: \'min\', step: 1}"> </div> </div> <div class="span1"> <strong data-bind="text: predicted_pleasure, valueUpdate: \'afterkeydown\'" style="font-size:2em;"> </strong> </div> </div> </div> <!-- PLEASURE - ACTUAL --> <div id="edit-pleasure-actual-attribute-container" data-bind="ifnot: inScheduling"> <div class="text-center" style="font-weight:bold;padding:5px 0px;"> Please rate your actual PLEASURE during the event </div> <div class="row-fluid"> <div class="span11"> <div id="edit-pleasure-actual-slider" class="slider" style="margin-top: 3px;" data-bind="slider: actual_pleasure, sliderOptions: {min: 0, max: 10, value: 5, range: \'min\', step: 1}"> </div> </div> <div class="span1"> <strong data-bind="text: actual_pleasure, valueUpdate: \'afterkeydown\'" style="font-size:2em;"> </strong> </div> </div> </div> <!-- PLEASURE - PREVIOUSLY PREDICTED --> <div id="pleasure-previously-predicted-container" data-bind="if: inReviewing" class="row-fluid text-prof-blue"> <div class="span11"> <strong class="pull-right"> <i class="icon-lightbulb"> </i> Predicted Pleasure: </strong> </div> <div class="span1"> <strong data-bind="text: predicted_pleasure, valueUpdate: \'afterkeydown\'"> </strong> </div> </div> </div> <div id="accomplishment-attributes-container" class="row-fluid"> <!-- ACCOMPLISHMENT - PREDICT --> <div id="edit-accomplishment-predict-attribute-container" data-bind="if: inScheduling"> <div class="text-center" style="font-weight:bold;padding:5px 0px;"> Please rate your predicted ACCOMPLISHMENT during the event </div> <div class="row-fluid"> <div class="span11"> <div id="edit-accomplishment-predicted-slider" class="slider" style="margin-top: 3px;" data-bind="slider: predicted_accomplishment, sliderOptions: {min: 0, max: 10, value: 5, range: \'min\', step: 1}"> </div> </div> <div class="span1"> <strong data-bind="text: predicted_accomplishment, valueUpdate: \'afterkeydown\'" style="font-size:2em;"> </strong> </div> </div> </div> <!-- ACCOMPLISHMENT - ACTUAL --> <div id="edit-accomplishment-actual-attribute-container" data-bind="ifnot: inScheduling"> <div class="text-center" style="font-weight:bold;padding:5px 0px;"> Please rate your actual ACCOMPLISHMENT during the event </div> <div class="row-fluid"> <div class="span11"> <div id="edit-accomplishment-actual-slider" class="slider" style="margin-top: 3px;" data-bind="slider: actual_accomplishment, sliderOptions: {min: 0, max: 10, value: 5, range: \'min\', step: 1}"> </div> </div> <div class="span1"> <strong data-bind="text: actual_accomplishment, valueUpdate: \'afterkeydown\'" style="font-size:2em;"> </strong> </div> </div> </div> <!-- ACCOMPLISHMENT - PREVIOUSLY PREDICTED --> <div id="accomplishment-previously-predicted-container" data-bind="if: inReviewing" class="row-fluid text-prof-blue"> <div class="span11"> <strong class="pull-right"> <i class="icon-lightbulb"> </i> Predicted Accomplishment: </strong> </div> <div class="span1"> <strong data-bind="text: predicted_accomplishment, valueUpdate: \'afterkeydown\'"> </strong> </div> </div> </div> <div data-bind="ifnot: inScheduling"> <div id="edit-emotion-attribute-container" class="text-center" style="font-weight:bold;padding:5px 0px;"> Please rate your <select id="edit-emotion" class="input-small" data-bind="value: emotion"> <option value=""> None </option> <option value="sad"> Sad </option> <option value="happy"> Happy </option> <option value="angry"> Angry </option> <option value="anxious"> Anxious </option> </select> Intensity </div> <div id="edit-emotion-intensity-attribute-container" class="row-fluid"> <div class="span11"> <div id="edit-emotion-intensity-slider" class="slider" data-bind="slider: emotion_intensity, sliderOptions: {min: 0, max: 10, value: 0, step: 1}"> </div> </div> <div class="span1"> <strong data-bind="text: emotion_intensity, valueUpdate: \'afterkeydown\'" style="font-size:2em;"> </strong> </div> </div> <div id="edit-motivation-attribute-container" data-bind="if: inMonitoring"> <div class="row-fluid"> <div class="control-group"> <label class="control-label"> Motivation </label> <div class="controls"> <select id="edit-motivation" data-bind="value: motivation"> <option value=""> None </option> <option value="mood_directed"> Mood Directed </option> <option value="goal_directed"> Goal Directed </option> </select> </div> </div> </div> </div> </div> <div id="event-form-save-delete-buttons-container"> <div class="btn-toolbar pull-right"> <button id="event-save-button" class="save btn btn-primary" data-bind="click: save">Save Event</button> <button id="event-delete-button" class="del btn btn-danger" data-bind="click: destroy"><i class="icon-trash"></i> Delete Event</button> </div> <div class="clearfix"></div> </div> </form>';
DIT["dynamo/activity_tracker/show_event"] 		= '<div class="item" data-cid="<%= item.cid %>"> <div class="stream-icon orange"> <i class="icon-calendar"></i> </div> <p class="date">(%= (new Date(item.get_field_value("start"))).toString("h:mm tt on MMM d, yyyy") %)</p> <!-- <h4 id="show-event-title">(%= item.title %)</h4> --> <h4>(%= item.title %)</h4> <div class="row-fluid"> <p style="color:black;"> <div id="show-start-end-times-container"> From: <span id="show-event-start-time">(%= (new Date(item.get_field_value("start"))).toString("h:mm tt on MMM d, yyyy") %)</span> <div class="clearfix"></div> Until: <span id="show-event-end-time">(%= (new Date(item.get_field_value("end"))).toString("h:mm tt on MMM d, yyyy") %)</span> </div> </p> <p style="color:black;"> <div class="row-fluid"> <div class="span6"> Pleasure: <ul> <li id="show-predicted-pleasure">Predicted: (%= item.predicted_pleasure %)</li> <li id="show-predicted-pleasure">Actual: (%= item.actual_pleasure %)</li> </ul> </div> <div class="span6"> Accomplishment: <ul> <li id="show-predicted-accomplishment">Predicted: (%= item.predicted_accomplishment %)</li> <li id="show-predicted-accomplishment">Actual: (%= item.actual_accomplishment %)</li> </ul> </div> </div> Emotional Intensity: <span id="show-emotion">(%= item.emotion %)</span> <span id="show-emotion-intensity"> (%= item.emotion_intensity %)</span> </p> </div> </div>';
DIT["dynamo/guides/index"] 						= '<div class="row-fluid"> <h3>Guides <small id="current-guide-title"></small></h3> <ul id="guide-select" class="accordion-header nav pull-right" style="margin: inherit 0"> <li class="dropdown"> <a href="#" class="dropdown-toggle" data-toggle="dropdown">Choose Guide <b class="caret"></b></a> <ul id="guides-list" class="dropdown-menu"> (% _.each(elements, function(e) { %) <li class="choose_element" data-cid="(%= e.id %)"><a>(%= e.html %)</a></li> (% }) %) </ul> </li> <li class="caret-icons"> <a><i class="icon-caret-down"></i></a> </li> </ul> </div>';
DIT["dynamo/guides/show"] 						= '<div id="guides-selector-title-bar" class="widget-header orange navbar"> <div id="guide-select-nav"></div> </div> <div id="current-guide-slide-container" class="accordion-body widget-content"> <div style="padding: 20px 15px 15px;"> <div id="current-guide-slide-content"> <div style="margin:0 auto;" class="text-center"> <h3> Choose a Guide using the dropdown menu above</h3> </div> </div> <div id="current-guide-slide-actions"> </div> </div> <ul id="current-guide-navigation-buttons" class="pager"> <li><button class="previous">&larr; Previous</button></li> <li><button class="next">Next &rarr;</button></li> </ul> </div>';
DIT["dynamo/guides/show_no_index"] 				= '<div id="current-guide-slide-container" class="accordion-body widget-content"> <div style="padding: 20px 15px 15px;"> <div id="current-guide-slide-content"> <div style="margin:0 auto;" class="text-center"> <h3> Choose a Guide using the dropdown menu above</h3> </div> </div> <div id="current-guide-slide-actions"> </div> </div> <ul id="current-guide-navigation-buttons" class="pager"> <li><button class="previous">&larr; Previous</button></li> <li><button class="next">Next &rarr;</button></li> </ul> </div>';