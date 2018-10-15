var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  //update to handle username/password?
  tableName: 'users',
  hasTimestamps: false,
  
    //using bcrypt to create hashed password
});

module.exports = User;