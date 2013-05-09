TestFixtures.XELEMENT_BASE();

describe("Core.Models", function() {
  describe("Dynamo.XelementRoot", function() {
    var MyXelement = Backbone.Model.extend(_.extend({}, Dynamo.XelementRoot, {}));

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

  describe("Dynamo.UnitaryXelement", function() {
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

    describe("field value accessors", function() {
      var x = new UnitaryXelement(TestFixtures.UnitaryXelementAttributes());

      describe("#get_field_value", function() {
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
      })

      describe("#set_field_value", function() {
        it("should not convert strings", function() {
          x.set_field_value("cats", "foo bar");
          assert.equal("foo bar", x.get('xel_data_values').cats);
        })

        it("should convert arrays to JSON strings", function() {
          x.set_field_value("cats", ["Puffy"]);
          assert.equal("[\"Puffy\"]", x.get('xel_data_values').cats);
        })

        it("should convert objects to JSON strings", function() {
          x.set_field_value("recipe", { title: "pizza" });
          assert.equal("{\"title\":\"pizza\"}", x.get('xel_data_values').recipe);
        })

        it("should not convert other attributes", function() {
          x.set_field_value("quotation", "call me Ishmael");
          assert.equal("call me Ishmael", x.get('xel_data_values').quotation);
        })

        it("should broadcast change events", function(done) {
          x.on("change", done);
          x.set_field_value("cats", null, { silent: false });
          x.off("change");
        })

        it("should broadcast change:xel_data_values events", function(done) {
          x.on("change:xel_data_values", done);
          x.set_field_value("hammerTime", null, { silent: false });
          x.off("change:xel_data_values");
        })

        it("should broadcast change:xel_data_values:[attr] events", function(done) {
          x.on("change:xel_data_values:onceUponATime", done);
          x.set_field_value("onceUponATime", null, { silent: false });
          x.off("change:xel_data_values:onceUponATime");
        })
      })
    })
  })
})