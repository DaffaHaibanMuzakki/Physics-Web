const mongoose = require("mongoose"); 

const Account = new mongoose.Schema({
    email : {type : String},
    username : {type : String} ,
    password : {type : String},
    createdAt : {type: Date },
    profilePic : {type: String},
    bio : {type: String},
    role : {type: String}
});




module.exports = mongoose.model('Account', Account) ;