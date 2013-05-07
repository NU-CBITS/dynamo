describe("Core.Models", function() {
  XELEMENT_BASE = new Backbone.Model({
    "app": {
      "1": {
        content_types: {
          "snark": "array"
        },
        default_values: {
          "snark": 42
        }
      }
    }
  });

  describe("Dynamo", function() {
    describe("XelementRoot", function() {
      var MyXelement = Backbone.Model.extend(_.extend({}, Dynamo.XelementRoot, {
      }));

      describe(".defaultsFor", function() {
        it("should return defaults", function() {
          var d = (new MyXelement()).defaultsFor("app");
          assert.equal("new app", d.title);
          assert.equal("app", d.xelement_type);
          assert.equal("array", d.xel_data_types.snark);
          assert.equal(42, d.xel_data_values.snark);
        })
      })

      describe(".get_fields_as_object", function() {
        it("should return fields as object", function() {
          var d = (new MyXelement({ guid: 314 })).get_fields_as_object();
          assert.equal(314, d.id);
        })
      })
    })

    describe("UnitaryXelement", function() {
    })
  })
})