var assert = chai.assert;

// Some model classes extend Dynamo.XelementClass, which doesn't
// exist by default.
Dynamo = Dynamo || {};
Dynamo.XelementClass = Dynamo.UnitaryXelement;