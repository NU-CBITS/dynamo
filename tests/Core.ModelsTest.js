TestFixtures.XELEMENT_BASE();
var USER_GROUPS;

describe("Core.Models", function() {
  describe("Dynamo.User", function() {
    describe("#get_field_value", function() {
      it("should return the attribute", function() {
        var user = new Dynamo.User({ meter: "iambic pentameter" });
        assert.equal("iambic pentameter", user.get_field_value("meter"));
      })
    })
  })

  describe("Dynamo.Group", function() {
    function MockUser(id) {
      return new Backbone.Model({ id: id });
    }

    function MockUsersCollection() {
      var users = [MockUser(1), MockUser(2), MockUser(3)];
      this.filter = function(iter) { return _.filter(users, iter); };
    };

    var group;

    before(function() {
      USERS = new MockUsersCollection();
      group = new Dynamo.Group({
        users: [1, 2],
        start_date: 1368024806488,
        stuff: { foo: "bar" }
      });
    })

    after(function() {
      delete USERS;
    })

    it("should grab users from the global group based on id", function() {
      assert.equal(2, group.users.length);
    })

    describe("#formVal", function() {
      it("should return a formatted start_date", function() {
        assert.equal("2013-05-08", group.formVal("start_date"));
      })

      it("should return other attributes raw", function() {
        assert.equal("bar", group.formVal("stuff").foo);
      })
    })
  })

  describe("Dynamo.Data", function() {
    function modelAttrs() {
      return {
        created_at: 1368024806488,
        user_id: "Alf",
        names: ["color"],
        datatypes: ["string"],
        values: ["fuschia"]
      };
    }

    function createData(attrs) {
      return new Dynamo.Data(attrs || modelAttrs());
    }

    describe("#get_fields_as_object", function() {
      it("should return the fields", function() {
        var data = createData();
        var o = data.get_fields_as_object();
        assert.equal(1368024806488, o.created_at.valueOf());
        assert.equal("Alf", o.user_id);
      })
    })

    describe("#get_field", function() {
      describe("when the field name is not found", function() {
        it("should return an array of undefineds", function() {
          var data = createData();
          assert.isUndefined(data.get_field("baz")[0]);
        })
      })

      describe("when the field name is found", function() {
        it("should return an array with the type and value", function() {
          var data = createData();
          assert.deepEqual(["string", "fuschia"], data.get_field("color"));
        })
      })
    })

    describe("#get_field_value", function() {
      describe("when the field name is not found", function() {
        it("should return undefined", function() {
          var data = createData();
          assert.isUndefined(data.get_field_value("baz"));
        })
      })

      describe("when the field name is found", function() {
        it("should return the value", function() {
          var data = createData();
          assert.equal("fuschia", data.get_field_value("color"));
        })
      })
    })

    describe("#remove_field", function() {
      describe("when the field name is not found", function() {
        it("should return false", function() {
          var data = createData();
          assert.isFalse(data.remove_field("baz"));
        })
      })

      describe("when the field name is found", function() {
        it("should return the value removed", function() {
          var data = createData();
          assert.deepEqual([["color"], ["string"], ["fuschia"]], data.remove_field("color"));
        })
      })
    })

    describe("#set_field", function() {
      describe("when the field name is not found", function() {
        it("should add the field", function() {
          var data = createData();
          data.set_field("scent", "string", "geranium");
          assert.deepEqual(["color", "scent"], data.get("names"));
          assert.deepEqual(["string", "string"], data.get("datatypes"));
          assert.deepEqual(["fuschia", "geranium"], data.get("values"));
        })
      })

      describe("when the field name is found", function() {
        it("should update the field", function() {
          var data = createData();
          data.set_field("color", "array", ["blue", "green"]);
          assert.deepEqual(["color"], data.get("names"));
          assert.deepEqual(["array"], data.get("datatypes"));
          assert.deepEqual([["blue", "green"]], data.get("values"));
        })
      })

      describe("when the silent option is false", function(done) {
        it("should trigger a change event", function() {
          var data = createData();
          data.on("change:color", done);
          data.set_field("color", "string", "periwinkle", { silent: false });
        })
      })
    })
  })

  describe("Dynamo.GroupWideData", function() {
    function createData() {
      var users = new Backbone.Collection([{ id: 1 }]);
      var group = new Backbone.Model({ id: 456 });
      group.users = users;
      USER_GROUPS = new Backbone.Collection([group]);
      return new Dynamo.GroupWideData({
        xelement_id: 123,
        group_id: 456
      });
    }

    describe("#forUser", function() {
      it("should return a user's data collection when passed a user_id", function() {
        var data = createData();
        assert.equal(1, data.forUser(1).user_id());
      })
    })

    describe("#perUser", function() {
      it("should return a new Backbone Collection containing the results the mapped results across users", function() {
        var data = createData();
        function fn(userCollection) { return { id: "fn-" + userCollection.user_id() } }
        assert.isDefined(data.perUser(fn).get("fn-1"));
        assert.isNotNull(data.perUser(fn).get("fn-1"));
      })
    })
  })

  describe("Dynamo.XelementRoot", function() {
    var MyXelement = Backbone.Model.extend(_.extend({}, Dynamo.XelementRoot, {}));

    describe(".defaultsFor", function() {
      it("should return the defaults specified for the given xelement_type", function() {
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