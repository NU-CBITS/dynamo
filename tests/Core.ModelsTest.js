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
      describe("#usableNumDaysIn", function() {
        var x = new UnitaryXelement({ guid: "childId" });
        var avail;

        beforeEach(function() {
          avail = {
                    parentId: {
                      self: null,
                      sub_elements: {
                        childId: {
                          self: null
                        }
                      }
                    }
                  };
        })

        it("should default to 1", function() {
          assert.equal(1, x.usableNumDaysIn(null, null));
          assert.equal(1, x.usableNumDaysIn(null, { parent: "parentId" }));
          assert.equal(1, x.usableNumDaysIn(avail, null));
          assert.equal(1, x.usableNumDaysIn(avail, { parent: "baz" }));
        })

        it("should return the parent value when larger", function() {
          avail.parentId.self = 6;
          avail.parentId.sub_elements.childId.self = 3;
          assert.equal(6, x.usableNumDaysIn(avail, { parent: "parentId" }));
        })

        it("should return the child value when larger", function() {
          avail.parentId.self = 4;
          avail.parentId.sub_elements.childId.self = 8;
          assert.equal(8, x.usableNumDaysIn(avail, { parent: "parentId" }));
        })

        it("should return the matching parent value when no parent option", function() {
          x.set("guid", "parentId");
          avail.parentId.self = 5;
          assert.equal(5, x.usableNumDaysIn(avail, { parent: null }));
          assert.equal(5, x.usableNumDaysIn(avail));
          x.set("guid", "childId");
        })
      })

      describe("#get_field_value", function() {
        var x = new UnitaryXelement({
          xel_data_types: {
            cats: "array",
            recipe: "json",
            hammerTime: "datetime",
            onceUponATime: "datetime",
            quotation: "speech"
          },
          xel_data_values: {
            cats: ["Fluffy"],
            recipe: { title: "souffle", isEasy: "false" },
            hammerTime: 1368024806488,
            onceUponATime: "Wed May 08 2013 09:56:28 GMT-0500 (CDT)",
            quotation: "the pen is mightier"
          }
        });

        it("should convert arrays to JSON", function() {
          assert.equal("Fluffy", x.get_field_value("cats")[0]);
        })

        it("should convert JSON to JSON with falsy conversion", function() {
          var val = x.get_field_value("recipe");
          assert.equal("souffle", val.title);
          assert.isFalse(val.isEasy);
        })

        it("should convert date representations to Date objects", function() {
          assert.equal(1368024806488, x.get_field_value("hammerTime").valueOf());
          assert.equal(1368024988000, x.get_field_value("onceUponATime").valueOf());
        })

        it("should default to the raw field value", function() {
          assert.equal("the pen is mightier", x.get_field_value("quotation"));
        })

        it("should fail", function() {
          assert.isTrue(false);
        })
      })
    })
  })
})