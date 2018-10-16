var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');


var User = db.Model.extend({
  //update to handle username/password?
  tableName: 'users',
  hasTimestamps: false,
  initialize: function() {
    //console.log(this);
    this.on('creating', function(model, attrs, options) {
      var hash = bcrypt.hashSync(this.attributes.password);
      model.attributes.password = hash;
      //console.log('password :', this.attributes.password);

    });
  }
});


module.exports = User;
/* Asynch :
bcrypt.hash(this.attributes.password, null, null, function(err, result) {
  return new Promise (function (resolve, reject) {
    reject = () => {
      console.log(err);
    };
    resolve = result;
    console.log('resolve: ', resolve);
    model.attributes.password = resolve;
  }).then(function(result) {
    console.log('result : ', result, 'pass: ', model.attributes.password);
    model.attributes.password = result;
  });
});  */