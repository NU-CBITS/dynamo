// this somehow solves a global leak issue triggered when running
// ChooseOneXelementFromCollectionView tests...would like to get to the bottom of it!
// <hack>
var content, atts;
// </hack>

TestFixtures.XELEMENT_BASE();

describe("Core.Views", function() {
  beforeEach(function() {
    $("body").append("<div id='sandbox'>");
  })

  afterEach(function() {
    $("body > #sandbox").remove();
  })

  describe("Dynamo.ShowXelementSimpleView", function() {
    var attrs = TestFixtures.UnitaryXelementAttributes();
    var vals = attrs.xel_data_values;

    it("should render only the title and specified attrs", function() {
      var model = new Dynamo.UnitaryXelement(attrs);
      var view = new Dynamo.ShowXelementSimpleView({
        model: model,
        el: "#sandbox",
        atts_to_display: ["cats", "recipe", "hammerTime", "quotation"]
      });
      view.render();
      assert.equal(vals.title, $.trim($(".attribute.title").html()));
      assert.equal(JSON.stringify(vals.cats), $(".attribute.cats").html());
      assert.equal(JSON.stringify(vals.recipe), $(".attribute.recipe").html());
      assert.equal(JSON.stringify(new Date(vals.hammerTime)), $(".attribute.hammerTime").html());
      assert.equal(JSON.stringify(vals.quotation), $(".attribute.quotation").html());
      assert.equal(0, $(".attribute.onceUponATime").length);
    })
  })

  describe("Dynamo.ShowArrayView", function() {
    var view;

    beforeEach(function() {
      $("#sandbox").append("<div class='array-view'></div>");
      view = new Dynamo.ShowArrayView({
        container: "#sandbox",
        elementTemplate: "<div class='item'>(%= item %)</div>",
        contentWhenEmpty: "The dark side"
      });
    })

    it("should render each item", function() {
      view.getArrayFn = function() { return ["Han Solo"] };
      view.render();
      assert.equal("Han Solo", $(".array-view:first").text());
    })

    it("should render the default when the array is empty", function() {
      view.getArrayFn = function() { return [] };
      view.render();
      assert.equal("The dark side", $(".array-view:first").text());
    })

    it("should add the onElementClick listener to each el with class item", function(done) {
      // wrapping done in anon fn b/c it doesn't like being called w/ non-err args
      view.onElementClick = function() { done() };
      view.getArrayFn = function() { return ["Han Solo"] };
      view.render();
      $(".array-view > .item").trigger("click");
    })
  })

  describe("Dynamo.InputSliderView", function() {
    beforeEach(function() {
      var view = new Dynamo.InputSliderView({
        el: "#sandbox",
        low_end_text: "low",
        high_end_text: "high",
        initial_value: 2,
        min_value: -1,
        max_value: 5,
        step: 1
      });
      view.render();
    })

    it("works", function() {
      assert.equal(1, $("#sandbox .ui-slider").length)
    })
  })

  describe("Dynamo.ChooseOneXelementFromCollectionView", function() {
    var view;
    var viewOptions;

    beforeEach(function() {
      var tywin = { xel_data_types: { title: "string"}, xel_data_values: { title: "Tywin" } };
      var cersei = { xel_data_types: { title: "string"}, xel_data_values: { title: "Cercei" } };
      var collection = new Backbone.Collection([
        new Dynamo.UnitaryXelement(tywin),
        new Dynamo.UnitaryXelement(cersei)
      ]);
      collection.prettyModelName = function() { return "Family Member"; };
      viewOptions = {
        el: "#sandbox",
        collection: collection,
        collection_name: "The Lannisters"
      }
    })

    function renderView(options) {
      view = new Dynamo.ChooseOneXelementFromCollectionView(options || viewOptions);
      view.render();
    }

    it("should render radio buttons", function() {
      renderView();
      assert.equal("Tywin", $("label.radio:first > span").text());
      assert.equal("Cercei", $("label.radio:last > span").text());
    })

    it("should trigger an event by default when a button is selected", function(done) {
      renderView();
      view.on("element:chosen", done);
      $("label.radio:first input").trigger("click");
      view.off("element:chosen");
    })

    it("should call onChoose when defined and a button is selected", function(done) {
      viewOptions.onChoose = function() { done() };
      renderView(viewOptions);
      $("label.radio:first input").trigger("click");
    })

    it("should allow adding new options when canCreateNew is true", function(done) {
      viewOptions.canCreateNew = true;
      viewOptions.xelement_type = "question";
      renderView(viewOptions);
      view.on("element:chosen", done);
      $(".widget-content button.create_new").trigger("click");
      view.off("element:chosen");
    })
  })

  describe("Dynamo.ShowUserView", function() {
    beforeEach(function() {
      var view = new Dynamo.ShowUserView({
        el: "#sandbox",
        model: new Backbone.Model({ username: "lola", guid: 123 })
      });
      view.render();
    })

    it("should render the username and guid", function() {
      assert.equal("lola", $(".attribute.username").text());
      assert.equal("(123)", $(".attribute.guid").text());
    })
  })
})