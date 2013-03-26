// Dynamo.Core.js

// Dynamo is a client-side Xelements framework
// built on top of Backbone.js
//
// Dynamo's Hard Dependencies are:
//
// Underscore.js
// jQuery.js
// Backbone.js
//
// Its purpose is to simplify the coding of client-side applications
// that adhere to the Trireme-expected schema of Xelements, Users, Groups, and Data.
//
// Dynamo is split up into core files and domain-specific files.
//
// The Core Specifies a set of Backbone-based Models, Views, and Collections
// for interaction with a Trireme-based Xelements-schema server endpoint as well as classes 
// that handle the core xelements-schema classes of xelements, users, groups, and data.
//
// Domain-specific files specify a set of additional Model, View and Collection Backbone-based classes for Xelements
// that provide differentiated functionality based upon an Xelement's xelement_type.
// (ITLR: Users, Groups, Data as well? for the moment, unlikely.)
//
// Separating Dynamo into these two sections is part of a design that allows selection of
// Dynamo 'core' attributes that can then later affect the definition of classes in the domain-specific files.  
//
// That is, the way that domain-specific classes operate can be altered based upon how Dynamo is configured after the
// inclusion of Dynamo Core files.
//
// Pragmatically, including Dynamo should be done in multiple steps:
//
// <script type="text/javascript" src="JS/Dynamo/Dynamo.Core.js "></script>
// <!-- Define The Location of Trireme -->
// <script>  Dynamo.TriremeURL = "https://[Fill in]";  </script>
// <script type="text/javascript" src="JS/Dynamo/Dynamo.Core.Models.js"></script>
// <script type="text/javascript" src="JS/Dynamo/Dynamo.Core.Collections.js"></script>
// <script type="text/javascript" src="JS/Dynamo/Dynamo.Core.Views.js"></script>
// <script>  
//    Dynamo.XelementClass = Dynamo.UnitaryXelement; // Define the Xelement Model Class to be used in the mantle classes.
// </script>
//
// Free to include additional domain-specific files, such as "Guides.Views"
//

// Due to the way that we initialize any Global Templates, 
// We change underscore Template Settings!
// We Define:
// - an interpolate regex to match expressions that should be interpolated verbatim, 
// - an escape regex to match expressions that should be inserted after being HTML escaped,
// - an evaluate regex to match expressions that should be evaluated without insertion into the resulting string.

_.templateSettings = {
  evaluate    : /\(%([\s\S]+?)%\)/g,
  interpolate : /\(%=([\s\S]+?)%\)/g,
  escape      : /\(%-([\s\S]+?)%\)/g
};


Dynamo = {};
_.bindAll(Dynamo);


Dynamo.initialize = function() {
  Dynamo.loadTemplates();
}

// A page using dynamo can require that a 
// user be logged in.
Dynamo._loginRequired = false
// require a log in by the user
Dynamo.requireLogin = function() {
  Dynamo._loginRequired = true;
};

//Check if Dynamo is currently requiring a log in by the user
Dynamo.loginRequired = function() {
  return Dynamo._loginRequired;
};

Dynamo.redirectTo = function(fileName, options) {
  var path = location.pathname.split("/")
  path[path.length - 1] = fileName;
  if (options && options.as && options.as == "link") {
    window.location.href = path.join("/")
  } else {
    window.location.replace(path.join("/"))  
  };
};

// Authenticating User
// In most circumstances, the Authenticating User will be the current user,
// but in circumstances where we would simply like to authenticate as the Application,
// we can override the Authenticating User and leave the CurrentUser as is.
Dynamo.AUTHENTICATING_USER_ID = function() { return Dynamo.CurrentUser().id };


// CurrentUser
// Function which returns the currently authenticated user,
// or redirects to the login page.
Dynamo.CurrentUser = function() {
  
  // If already defined.
  if (Dynamo._CurrentUser) {
    return Dynamo._CurrentUser;
  }

  // For testing, let some Dynamo params define the current user:
  if (Dynamo.CURRENT_USER_ID && Dynamo.CURRENT_GROUP_ID) {
    Dynamo._CurrentUser =  new User({
      guid: Dynamo.CURRENT_USER_ID,
      group_id: Dynamo.CURRENT_GROUP_ID
    });
    return Dynamo._CurrentUser;
  };

  // If there's a param in local storage
  if ( localStorage.getItem("CurrentUser") ) {
    var user_atts = JSON.parse(localStorage.getItem("CurrentUser"));
    Dynamo._CurrentUser = new User(user_atts);
    return Dynamo._CurrentUser;
  };

  if (Dynamo.loginRequired()) {
    Dynamo.redirectTo("login.html");
  }
  else {
    Dynamo._CurrentUser = new Dynamo.User({
      phone_guid: "DEFAULT-DYNAMO-USER_"+Dynamo.deviceID(),
      username: "DEFAULT-DYNAMO-USER_"+Dynamo.deviceID(),
      group_id: "DEFAULT-DYNAMO-USER-GROUP-1"
    });
    Dynamo._CurrentUser.dualstorage_id = "CURRENT-USER"
    localStorage.setItem("CurrentUser", JSON.stringify( Dynamo._CurrentUser.toJSON() ) );
    localStorage.setItem("CurrentUserSaved", "false");
    Dynamo._CurrentUser.save({
      success: function() {
        console.log("SUCCESS CB of Dynamo._CurrentUser.save!")
        localStorage.setItem("CurrentUserSaved", "true");
        localStorage.setItem("CurrentUser", JSON.stringify( Dynamo._CurrentUser.toJSON() ) );
      }
    });
    
    return Dynamo._CurrentUser;
  }


};

// For interaction with phonegap; will return the phone's ID if it has one.
Dynamo.deviceID = function() {

  if ( (typeof(device) != "undefined") && _.isObject(device) && device.uuid) { 
    return device.uuid;
  }
  else {
    return "NO-DEVICE-ID";
  };

};


// Deprecated at this point, but may come back into favor
// Returns true if the core is stable, false otherwise.
Dynamo.isCoreStable = function() {
  if ( typeof(this.XelementClass) == "undefined" ) { return false };
  return true;
};


//
// loadTemplates
// -------------
//
// If no templates exist, change to to templates.html
// in order to load them into local storage.
// upon completion, templates.html will return to this page, 
// and this method will again be called from the beginning
Dynamo.loadTemplates = function() {
  DIT = localStorage.getItem("DYNAMO_TEMPLATES");
  if (!DIT) {

    // If we are currently on:
    //   http://www.somedomain.com/index.html
    // templates.html is assumed to be at:
    //   http://www.somedomain.com/dynamo/templates.html
    var currentLocation = window.location.href;
    localStorage.setItem("DIT_AFTER_LOAD_URL", currentLocation);
    var pathComponents = window.location.href.split("/");
    pathComponents[pathComponents.length - 1] = "dynamo/templates.html";
    templatesLocation = pathComponents.join("/");
    window.location.href = templatesLocation;
  } else {
    $(window).unload(function() {
      localStorage.removeItem("DIT_AFTER_LOAD_URL");
      localStorage.removeItem("DYNAMO_TEMPLATES");
    });
    DIT = JSON.parse(DIT);
  };
};


// Underscore methods that we want to implement on a Model.
var methods = ['forEach', 'each', 'map', 'reduce', 'reduceRight','keys', 'values', 'pick', 'isEmpty', 'isEqual'];
// Mix in each Underscore method as a proxy to `Model#attributes`.
_.each(methods, function(method) {
  Backbone.Model.prototype[method] = function() {
    return _[method].apply(_, [this.attributes].concat(_.toArray(arguments)));
  };
});


//
//
// Override Backbone.sync
//

Dynamo._previousSync = Backbone.sync;

Dynamo.AuthenticatedSync = function (method, model, options) {

  // Default options, unless specified.
  options || (options = {});
  console.log("");
  console.log("In AuthenticatedSync: ", method, model, options);

  // Ensure appropriate session variables for authentication.
  options.beforeSend = function(jqXHR, settings) {
    console.log("In BeforeSend (jqXHR, settings):", jqXHR, settings);
    var new_data;
    if (!settings.url) {
      console.warn("No settings.url in beforeSend??");
    };
    settings.url = addSessionVarsToUrl(settings.url);
    console.log("final URL: ", settings.url);
    if (settings.data) {
      console.log("adding transmitted_at as data", settings.data);
      new_data = JSON.parse(settings.data);
      new_data.transmitted_at = (new Date()).toString();
      settings.data = JSON.stringify(new_data);
    };
    console.log("---------------");
  };

  return Dynamo._previousSync(method, model, options);
};

Backbone.sync = Dynamo.AuthenticatedSync

//
//
// Additional Sync Functions
//

ReadOnlySync = function (method, model, options) {
    console.log("Using ReadOnlySync", method, model, options);
    // Default options, unless specified.
    options || (options = {});
    switch(method) {
      case "create":
      case "update":
        throw new Error("ReadOnlySync prevents saving this model to the server.");
        break;
      case "read":
        return Backbone.sync("read", model, options);
        break;
      case "delete":
        throw new Error("ReadOnlySync prevents deleting this model from the server.");
        break;
      default:
        throw new Error("Unexpected value for argument, 'method': '"+method+"' passed to PsuedoSync");
    };
};

PseudoSync = function (method, model, options) {
    console.log("Using PsuedoSync; No actual save-to or read-from server.", method, model, options);
    // Default options, unless specified.
    options || (options = {});
    switch(method) {
      case "create":
      case "update":
        return {};
        break;
      case "read":
        alert('PseudoSync: read operation attempted');
        throw new Error("PsuedoSync mocks Backbone.sync's response from the server; it cannot read data");
        break;
      case "delete":
        console.warn("PsuedoSync: delete operation attempted; Not 100% what return value should be...")
        return {};
        break;
      default:
        throw new Error("PsuedoSync: Unexpected value for argument, 'method': '"+method+"'");
    };
}; 


// ************************************************
//
// Helper Vars and Functions
//
// ************************************************

addQueryVarToUrl = function(name, value, url) {
  var new_url;
  new_url = url;
  if (new_url.indexOf(name) === -1) {
    if (new_url.indexOf("?") === -1) {
      new_url = new_url + "?";
    } else {
      new_url = new_url + "&";
    }
    new_url = new_url + ("" + name + "=" + value);
  }
  return new_url;
};

//copied out of Backhand.js
addSessionVarsToUrl = function(url) {
  var new_url;
  new_url = addQueryVarToUrl("user_id", Dynamo.AUTHENTICATING_USER_ID(), url);
  new_url = addQueryVarToUrl("session_id", "YO-IMA-SESSION-ID", new_url);
  return new_url;
};

/**
 * convertFalses
 * A helper function that replaces
 * the string 'false' in an object with the value false
 * and returns the object. It doesn't create a copy; it changes the object itself.
 * the need for this function arises from needing to parse
 * objects contained within strings that Trireme may ship to the client.
 *
 * @param  {[object]} obj [any js object of any depth]
 * @return {[object]}     [the object with any strings 'false' replaced with the value false]
*/
convertFalses = function(str_obj_or_other) {
  if (str_obj_or_other === "false") { return false; };
  if ( _.isObject(str_obj_or_other) ) {
    _.each(str_obj_or_other, function(val, key) {
      str_obj_or_other[key] = convertFalses(val);
    });
  };
  return str_obj_or_other;
};

/**
 * JSONparseNested
 * A helper function that takes a string
 * which is presumably a JSON object that has then been
 * stringified an arbitrary number of times and then returns
 * the result of parsing the string until it is an object
 * @param  {[object]} stringified_json [a string which is, presumably at some level of escaping, a JSON object]
 * @return {[object]} [ the json object ]
*/
JSONparseNested = function(stringified_json) {

  //  undefined / null values become an empty object.
  if (stringified_json === null || typeof(stringified_json) === "undefined" ) { return {}; };

  var result = stringified_json;

  try {
    while ( _.isString(result) ) { result = JSON.parse(result); };
  }
  catch (e) {
    console.warn("JSONparseNested(): Error parsing string as possible_object: ")
    console.log(e);
    console.log("Instead, leaving string as is: ");
    console.log(result);
  };

  return result;

};


/**
 * stringToXelementType
 * A helper function that takes
 * a type and a string and attempts to convert it to a specified type
 * as is the case for XelementCMS content
 * i.e.
 *
 * @param  {string} type [a string of the type to convert]
 * @return {[object]}     [the object with any strings 'false' replaced with the value false]
*/
stringToXelementType = function(type, value) {
  try {
    switch(type) {
      case 'html':
      case 'string':
        if (value === null || typeof(value) === 'undefined') {
          return ""
        } else {
          return value;
        };
        break;
      case 'int':
        return parseInt(value);
        break;
      case 'Date':
        return new Date(value);
        break;
      case 'array':
      case 'xelementGuidArray':
      case 'json':
        try {
          return JSON.parse(value);
        }
        catch (error) {
           if (type == 'json') {
            return {}
           } else {
            return []
          };
        };
        break;
      case 'bool':
      case 'javascript':
        return eval(value);
        break;
      default:
        throw new Error("stringToXelementType(): unexpected type: '"+type+"' ");
    };
  }
  catch (error) {
    console.warn("error attempting to convert string '"+value+"' to type: '"+type+"'");
    console.warn(error);
    return null;
  };
}