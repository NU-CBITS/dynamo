window.TestFixtures = window.TestFixtures || {};

TestFixtures.UnitaryXelementAttributes = function() {
  return {
    xel_data_types: {
      title: "string",
      cats: "array",
      recipe: "json",
      hammerTime: "datetime",
      onceUponATime: "datetime",
      quotation: "speech"
    },
    xel_data_values: {
      title: "The Wheels on the Bus",
      cats: ["Fluffy"],
      recipe: { title: "souffle", isEasy: "false" },
      hammerTime: 1368024806488,
      onceUponATime: "Wed May 08 2013 09:56:28 GMT-0500 (CDT)",
      quotation: "the pen is mightier"
    }
  };
};