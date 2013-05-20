window.TestFixtures = window.TestFixtures || {};

TestFixtures.XELEMENT_BASE = function() {
  return (XELEMENT_BASE = new Backbone.Model({
    "app": {
      "1": {
        content_types: {
          "snark": "array"
        },
        default_values: {
          "snark": 42
        }
      }
    },
    "question": {
      "1": {
        content_types: {
          "metacontent_external": "string"
        },
        default_values: {
          "metacontent_external": "abcde"
        }
      }
    }
  }))
}