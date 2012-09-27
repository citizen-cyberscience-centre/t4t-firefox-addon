var t4t = require("t4t");

exports["test hours to milliseconds"] = function(assert) {
    assert.ok(t4t.hoursToMiliseconds(1) == (1*60*60*1000), "test that hoursToMiliseconds works");
}
