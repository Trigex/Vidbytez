/*   Vidbytez
 *   (c) Trigex 2018
 *   Licensed under the MIT License
*/

var mongoose = require('mongoose');

var commentSchema = new mongoose.Schema({
    author: {type: mongoose.Schema.ObjectId, ref: 'User'}, // author of the comment
    content: String, // content of the comment
    timestamp: String, // timestamp of comment posting
    likes: Number, // total likes on the comment
    dislikes: Number, // total dislikes on the comment
    replies: [{type: mongoose.Schema.ObjectId, ref: 'Comment'}] // comments in reply
});

module.exports = mongoose.model("Comment", commentSchema);