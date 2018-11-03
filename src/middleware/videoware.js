const mongoose = require('mongoose');
const videoModel = require('../models/video');
const shortid = require("shortid");

var videoware = module.exports = {
    /*  
     *   Check if the given video exists (by title)
     *   if it does, return true, else, false
     */
    videoExistsByTitle: async function(title) {
        try {
            var video = await videoModel.findOne({title: title});
            if(!video) {
                return false;
            } else {
                return true;
            }
        } catch(err) {
            console.log(err);
        }
    },

    /*  
     *   Check if the given video exists (by videoID)
     *   if it does, return true, else, false
     */
    videoExistsByID: async function(id) {
        try {
            var video = await videoModel.findOne({videoID: id});
            if(!video) {
                return false;
            } else {
                return true;
            }
        } catch(err) {
            console.log(err);
        }
    },

    getVideoByID: async function(videoID) {
        try {
            var video = await videoModel.findOne({videoID: videoID});
            if(!video) {
                return null;
            } else {
                return video;
            }
        } catch(err) {
            console.log(err);
        }
    },

    /*  
     *   It creates a video dumbass, return the videoID if it happened
     */
    createVideo: async function(title, postTime, author) {
        try {
            var videoID = shortid.generate();
            await videoModel.create({title: title, postTime: postTime, author: author, videoID: videoID, postTime: new Date(Date.now()).toLocaleString(), processing: true});
            
            var newVideo = await videoModel.find({videoID: videoID});

            if(newVideo === []) {
                return false;
            } else {
                return videoID;
            }
        } catch(err) {
            console.log(err);
        }
    },

    updateTitle: async function(videoID, title) {
        try {
            await videoModel.findOneAndUpdate({videoID: videoID}, {title: title});
        } catch(err) {
            console.log(err);
        }
    },

    updateDescription: async function(videoID, description) {
        try {
            await videoModel.findOneAndUpdate({videoID: videoID}, {description: description});
        } catch(err) {
            console.log(err);
        }
    },

    updateTags: async function(videoID, tags) {
        try {
            await videoModel.findOneAndUpdate({videoID: videoID}, {tags: tags});
        } catch(err) {
            console.log(err);
        }
    },

    updateVideoPath: async function(videoID, path) {
        try {
            await videoModel.findOneAndUpdate({videoID: videoID}, {videoPath: path});
        } catch(err) {
            console.log(err);
        }
    },

    disableProcessing: async function(videoID) {
        try {
            await videoModel.findOneAndUpdate({videoID: videoID}, {processing: false});
        } catch(err) {
            console.log(err);
        }
    },
    // return true if change happened, false if not
    addCommentToVideo: async function(videoID, comment) {
        try {
            var originalComments = await videoModel.findOne({videoID: videoID}); 
            console.log(originalComments.comments);
            console.log(comment);
            var newComments = await videoModel.findOneAndUpdate({videoID: videoID}, {$push: {comments: comment}});
            if(originalComments === newComments) {
                return false;
            } else {
                return true;
            }
        } catch(err) {
            console.log(err);
        }
    }
}