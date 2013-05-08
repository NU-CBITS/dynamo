describe("Dynamo.ShowXelementSimpleView", function() {
  var attrs = window.dynamoTestFixtures.UnitaryXelementAttributes();
  var vals = attrs.xel_data_values;

  before(function() {
    $("body").append("<div id='sandbox'>");
  })

  after(function() {
    $("body > #sandbox").remove();
  })

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