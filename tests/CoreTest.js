var USERS;

describe("Core", function() {
  var user;
  function n() { return Math.floor((Math.random()*10000)+1); };
  function TestUser() {
    return new Dynamo.User({ guid: n(), group_id: n() });
  }

  beforeEach(function() {
    user = TestUser();
  })

  describe("Dynamo", function() {
    describe(".CurrentUser", function() {
      afterEach(function() {
        localStorage.clear();
        Dynamo._CurrentUser = null;
      })

      it("By Default, should return a preassigned current user", function() {
        Dynamo._CurrentUser = user;
        assert.equal(user, Dynamo.CurrentUser());
      })

      it("with predefined testing guids, should return the user defined by those guids", function() {
        Dynamo.CURRENT_USER_ID = user.get("guid");
        Dynamo.CURRENT_GROUP_ID = user.get("group_id");
        assert.equal(user.get("guid"), Dynamo.CurrentUser().get("guid"));
        assert.equal(user.get("group_id"), Dynamo.CurrentUser().get("group_id"));
        Dynamo.CURRENT_USER_ID = Dynamo.CURRENT_GROUP_ID = null
      })

      describe("when there is a stored user", function() {
        describe("and there is not a user collection", function() {
          before(function() {
            localStorage.setItem("CurrentUser", JSON.stringify(user.toJSON()));
          })

          it("should return the reified stored serialized user", function() {
            assert.equal(user.guid, Dynamo.CurrentUser().guid);
          })
        })

        describe("and there is a global USERS collection of users", function() { //would consider eliminating this global.
          var otherUser = TestUser();

          before(function() {
            localStorage.setItem("CurrentUser", JSON.stringify(user.toJSON()));
            otherUser.set("guid", user.get("guid"));
            USERS = new Dynamo.UserCollection([otherUser]);
          })

          it("should return the user from the collection", function() {
            assert.equal(otherUser.guid, Dynamo.CurrentUser().guid);
          })
        })
      })

      describe("when a login is required", function() {
        before(function() {
          Dynamo.requireLogin();
          sinon.stub(Dynamo, "redirectTo");
        })

        after(function() {
          Dynamo.redirectTo.restore();
          Dynamo._loginRequired = false;
        })

        it("should redirect to the login page", function() {
          Dynamo.CurrentUser();
          assert.equal("login.html", Dynamo.redirectTo.getCall(0).args[0]);
        })
      })

      describe("when no login is required", function() {
        before(function() {
          this.server = sinon.fakeServer.create();
          this.server.respondWith("POST", /\/users/,
                                  [201, { "Content-Type": "application/json" }, '']);
        })

        beforeEach(function() {
          Dynamo.CurrentUser();
          this.server.respond();
        })

        after(function() {
          this.server.restore();
        })

        it("should construct a new user", function() {
          assert.isDefined(Dynamo._CurrentUser);
          assert.isNotNull(Dynamo._CurrentUser);
        })

        it("should save the new user in the store", function() {
          assert.isDefined(localStorage.getItem("CurrentUser"));
          assert.isNotNull(localStorage.getItem("CurrentUser"));
        })

        it("should save the new user to the server", function() {
          assert.isDefined(this.server.requests[0]);
          assert.isNotNull(this.server.requests[0]);
        })
      })
    })

    describe(".AuthenticatedSync", function() {
      before(function() {
        sinon.stub(Dynamo, "_previousSync");
        sinon.stub(Dynamo, "CurrentUser", function() { return user });
      })

      after(function() {
        Dynamo._previousSync.restore();
        Dynamo.CurrentUser.restore();
      })

      it("should add a transaction timestamp and session vars to syncs", function() {
        var options = {};
        Dynamo.AuthenticatedSync(null, null, options);
        var settings = { url: "foo", data: "{}" };
        options.beforeSend(null, settings);
        assert.equal("foo?user_id=" + user.id + "&session_id=YO-IMA-SESSION-ID", settings.url);
        assert.notEqual(-1, settings.data.indexOf("transmitted_at"));
      })
    })
  })

  describe(".addQueryVarToUrl", function() {
    it("should not add a duplicate parameter", function() {
      assert.equal("foo?a=b", addQueryVarToUrl("a", "b", "foo?a=b"));
    })

    it("should add a distinct parameter", function() {
      assert.equal("foo?abc=def&a=b", addQueryVarToUrl("a", "b", "foo?abc=def&a=b"));
    })

    it("should add a parameter that matches a substring of the URL", function() {
      assert.equal("foo?fo=bar", addQueryVarToUrl("fo", "bar", "foo"));
    })
  })

  describe(".addSessionVarsToUrl", function() {
      before(function() {
        sinon.stub(Dynamo, "CurrentUser", function() { return user });
      })

      after(function() {
        Dynamo.CurrentUser.restore();
      })

    it("should do what it says", function() {
      assert.equal("foo?user_id=" + user.id + "&session_id=YO-IMA-SESSION-ID", addSessionVarsToUrl("foo"));
    })
  })

  describe(".JSONparseNested", function() {
    // TODO
  })
})
