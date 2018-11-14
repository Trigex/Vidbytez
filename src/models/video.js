/*   Vidbytez
 *   (c) Trigex 2018
 *   Licensed under the MIT License
*/

var mongoose = require('mongoose');

var videoSchema = new mongoose.Schema({
    videoPath: String, // video filename
    title: String, // title of the video
    views: Number, // total number of page loads
    ratings: [Number], // 1-5 rating scale, averaged on load 
    postTime: String, // timestamp of the post
    author: {type: mongoose.Schema.ObjectId, ref: 'User'}, // author object of the video
    comments: [{type: mongoose.Schema.ObjectId, ref: 'Comment'}], // root comments on the video
    videoID: String,
    description: String,
    tags: String,
    processing: Boolean, // is the video currently being proccessed/uploaded?
    thumbnailPath: String // thumbnail filename
});

module.exports = mongoose.model("Video", videoSchema);