describe("Core.Views", function() {
  beforeEach(function() {
    $("body").append("<div id='sandbox'>");
  })

  afterEach(function() {
    $("body > #sandbox").remove();
  })

  /*describe("Dynamo.ShowXelementSimpleView", function() {
    var attrs = window.dynamoTestFixtures.UnitaryXelementAttributes();
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
  })*/

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
})