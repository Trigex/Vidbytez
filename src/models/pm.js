var mongoose = require('mongoose');

var pmSchema = new mongoose.Schema({
    authorUserID: String, // author of the comment
    subject: String,
    content: String
});

module.exports = mongoose.model("PM", pmSchema);