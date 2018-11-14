/*   Vidbytez
 *   (c) Trigex 2018
 *   Licensed under the MIT License
*/

/*
*   heh.... kid....... welcum to this little thing I call hell.................... can you handle it..... ??
*/
// fuck
const config = require('../../config.json');
const uriBase = "/api/";
// middleware
const userware = require("../middleware/userware");
const videoware = require("../middleware/videoware");
const commentware = require("../middleware/commentware");
// utils
const json = require("../utils/json");
const bcryptUtil = require("../utils/bcrypt_utils");
const validator = require("validator");
const session = require("../utils/session");
const hat = require("hat");
const ffmpeg = require("../utils/ffmpeg_utils");
const authkey = require("../utils/authkey");
//const fs = require("fs");

module.exports = function(app) {
    /* =======================
    *  | GET REQUESTS        |
    *  =======================*/

    /* =======================
    *  | META(GET)           |
    *  =======================*/ 
   app.get(uriBase + "version", function(req, res){
    res.send(JSON.stringify({version: config.app.build.version}));
   }),

    /* =======================
    *  | COMMENT(GET)        |
    *  =======================*/ 
   /*   GET
   *    /api/comments/video/:id
   *    Get all the comments of a given video
   */
   app.get(uriBase + "comments/video/:id/", async function(req, res){
        var videoID = req.params.id;
        var comments = await commentware.getCommentsByVideoID(videoID);
        if(comments===null) {
            res.send(json.error("That video doesn't exist!"));
            return;
        } else {
            res.send(JSON.stringify({comments: comments}));
            return;
        }
   });

    /* =======================
    *  | POST REQUESTS       |
    *  =======================*/

    /* =======================
    *  | USER(POST)          |
    *  =======================*/ 
    
    /*  POST
    *   /api/user/create
    *   Create a user given the following paramaters
    *   @param username
    *   @param email
    *   @param password
    */
    app.post(uriBase + "user/create", async function(req, res){
        var username = req.body.username;
        var email = req.body.email;
        var password = req.body.password;

        if(config.app.signup.disabled) {
            res.send(json.error("Sorry, sign up is disabled right now!"));
            return;
        }
        
        /* VALIDATION BLOCK HEHE */
        if(!validator.isEmail(email) || validator.isEmpty(email)) {
                res.send(json.error("The email is invalid!"));
                return;
        }

        if(!validator.isAlphanumeric(username) || validator.isEmpty(username)) {
                res.send(json.error("The username is invalid!"));
                return;
        }

        if(validator.isEmpty(password)) {
                res.send(json.error("The password is invalid!"));
                return;
        }

        if(await userware.emailExists(email)) {
            res.send(json.error("That email is already in use!"));
            return;
        }

        if(await userware.usernameExists(username)) {
            res.send(json.error("That username is already in use!"));
            return;
        }

        // hash password
        password = await bcryptUtil.hash(password);

        // insert user into database
        if(await userware.createUser(username, password, email) == true) {
            // create authKey
            var authKey = hat();
            console.log(authKey);
            // store authkey
            if(await !userware.insertAuthKey(username, authKey)) {
                res.send(json.error("The authkey failed to update!"));
                return;
            }
            res.send(json.success("The user was created! Please log in!"));
        } else {
            res.send(json.error("The user was unable to be created!"));
        }
    });

    /*  POST
    *   /api/user/login
    *   Login to an account with the given params, then return the user's authkey
    *   @param username username of the user to login
    *   @param password password of the user to login
    *   @param create_session boolean, generates a session with the authkey contained (used for the web front end session stuff), if it's not enabled this only sends back the authkey
    */
    app.post(uriBase + "user/login", async function(req, res){
        var username = req.body.username;
        var password = req.body.password;
        var create_session = req.body.create_session;

        var user = await userware.getUserByUsername(username);
        if(user === null) {
            res.send(json.error("That user doesn't exist!"));
            return;
        }

        if(await bcryptUtil.checkPassword(password, user.password)) {
            // get authkey
            var authKey = await userware.getAuthKeyByUsername(username);
            console.log(authKey);
            if(create_session) {
                session.createSession(req.session, username, authKey);
            }
            res.send(JSON.stringify({success: "You were logged in!", authKey: authKey}));
            return;
        } else {
            res.send(json.error("The password was incorrect!"));
            return;
        }
    });

    /*  POST
    *   Destroy session
    */
    app.post(uriBase + 'user/logout', async function(req, res) {
        var username = req.session.username;
        if(!username) {
            res.send(json.error("No session was found to end!"));
            return;
        } else {
            session.destroySession(req.session);
            res.send(json.success("You've logged out! Come back soon please~"));
        }
    });
    
    /* =======================
    *  | VIDEO(POST)         |
    *  =======================*/ 
    
    /*  POST
    *   /api/video/upload
    *   Upload a video! This shit is probably gonna be major fucking jank I have no idea what I'm doing
    *   @param action can be "check", or "upload", context sensitive bullshit
    *   @param filename name of the video file
    *   @param filesize size of the file
    *   @param filetype type of the file
    *   @param authKey authkey of the user uploading
    *   @param video_file the video file
    *   @param videoID the id of the video
    */
   app.post(uriBase + "video/upload", async function(req, res){
    var action = req.body.action;
    var authKey = req.body.authKey;

    if(await userware.authKeyExists(authKey) === false) {
        res.send(json.error("The authkey sent doesn't exist!"));
        return;
    }

    switch(action) {
        case "check":
            var filename = req.body.filename;
            var filesize = req.body.filesize;
            var filetype = req.body.filetype;
            console.log("Video requested for upload! action: " + action + ", filename: " + filename + ", filesize: " + filesize + ", filetype: " + filetype + " authKey: " + authKey);
            // filesize check
            if(filesize > config.app.videos.max_file_size) {
                res.send(json.error("The file is too big!"));
                return;
            }
            // get file type
            var extension = (/[.]/.exec(filename)) ? /[^.]+$/.exec(filename) : undefined;
            extension = extension[0];
            var typeFound = false;
            // loop through for every video type, check if it's supported
            config.app.videos.file_types.forEach(function(item){
                if(extension == item) {
                    typeFound = true;
                }
            });
            if(!typeFound) {
                res.send(json.error("That filetype is not supported! Sorry man!"));
                return;
            }
            // create video db object
            var user = await userware.getUserByAuthKey(authKey);
            var videoID = await videoware.createVideo(filename, Date.now(), user);
            res.send(JSON.stringify({success: "The video is now uploading!", videoID: videoID}));
            break;

        case "upload":
            var videoID = req.body.videoID;
            console.log("The video is now uploading!");
            // check if a file was given
            if(Object.keys(req.files).length == 0) {
                res.send(json.error("No file was uploaded"));
                return;
            }
            // grab the video file
            var file = req.files.video_file;
            console.log("File Uploaded!: " + file);
            // move file to static directory
            var path = __dirname + "/../static/videos/" + file.name + ".original"; 
            console.log(file);
            console.log(path);
            try {
                await file.mv(path);
            } catch(err) {
                console.log(err);
            }

            // reencode video
            res.send(json.success("The video was successfully uploaded! Please wait for processing to finish!"));
            // re-encode the video, then disable the "processing" flag on the video, and set the file url
            await ffmpeg.createThumbnail(path, (path) => {videoware.updateThumbnailPath(videoID, path)});
            await ffmpeg.encodeVideo(path, config.app.videos.qualities[0], (newPath) => {videoware.disableProcessing(videoID); videoware.updateVideoPath(videoID, newPath);});
            // delete the original file
            // breaks shit, not sure why
            //fs.unlink(path, (err) => {if(err) {console.log(err);}});
            break;

        default:
            res.send(json.error("Invalid operation!"));
            break;
    }
});

    /*  POST
    *   /api/video/update
    *   Update the metadata of a video!
    *   @param title the title for the view
    *   @param description the description of the video
    *   @param tags the tags of the video (seperated by commas)
    *   @param videoID the id of the video to be updated
    *   @param authKey authkey of the user updating
    */
    app.post(uriBase + "video/update", async function(req, res){
        var title = req.body.title;
        var description = req.body.description;
        var tags = req.body.tags;
        var authKey = req.body.authKey;
        var videoID = req.body.videoID;

        if(authkey.authKeyExists(authKey) === false) {
            res.send(json.error("The authkey sent doesn't exist!"));
            return;
        }

        // check if the video is owned by the user
        var video = await videoware.getVideoByID(videoID);
        if(video !== null) {
            // get the user whom owns the video
            var user = await userware.getUserByObjectID(video.author);
            // check if the user's authkey and the sent authkey match
            if(authKey = user.authKey) {
                // proceed
                // update title
                if(typeof title != "undefined") {
                    await videoware.updateTitle(videoID, title);
                }

                // update description
                if(typeof description != "undefined") {
                    await videoware.updateDescription(videoID, description);
                }
                // update tags
                if(typeof tags != "undefined") {
                    await videoware.updateTags(videoID, tags);
                }
            } else {
                res.send(json.error("You don't own this video!"));
            }
        } else {
            res.send(json.error("The video doesn't exist!"));
            return;
        }
        res.send(json.success("The video information was updated!"));
    });

    /*  GET
    *   /api/video/:videoID/ratings
    *   get an array of the ratings of a given video
    */
    app.get(uriBase + "video/:videoID/ratings", async function(req, res){
        var videoID = req.params.videoID;
        var ratings = await videoware.getRatingsByVideoID(videoID);
        if(ratings === null) {
            res.send(json.error("The video was not found!"));
            return;
        }
        res.send(JSON.stringify({ratings: ratings}));
        return;
    });

    /*  POST
    *   /api/video/rating
    *   Submit a rating!
    *   @param authKey authkey of the user sending
    *   @param videoID video to add rating to
    *   @param rating 1-5 rating
    */
    app.post(uriBase + "video/rating", async function(req, res){
        var authKey = req.body.authKey;
        var videoID = req.body.videoID;
        var rating = req.body.rating;

        if(await authkey.authKeyExists(authKey) === false) {
            res.send(json.error("The authkey doesn't exist!"));
            return;
        }

        if(await videoware.getVideoByID(videoID)===null) {
            res.send(json.error("That video doesn't exist!"));
            return;
        }
        var rated = await userware.getRatedVideosByAuthKey(authKey);
        if(rated.includes(videoID)) {
            res.send(json.error("You can only rate a video once!"));
            return;
        }

        if(validator.isEmpty(rating) || !validator.isInt(rating) || rating > 5 || rating < 1) {
            res.send(json.error("Send a real rating...!"));
            return;
        }

        var user = await userware.getUserByAuthKey(authKey);
        console.log(await videoware.addRating(videoID, user, rating));
        await userware.addRatedVideo(videoID, authKey);
        res.send(json.success("The video was rated!"));
        return;
    });

    /* =======================
    *  | COMMENT(POST)       |
    *  =======================*/ 

    /*  POST
    *   /api/comment/create
    *   Create a comment!
    *   @param authKey authkey of the user posting
    *   @param videoID video to post to
    *   @param content the contents of the comment
    */
    app.post(uriBase + "comment/create", async function(req, res) {
        var authKey = req.body.authKey;
        var content = req.body.content;
        var videoID = req.body.videoID;

        if(await authkey.authKeyExists(authKey) === false) {
            res.send(json.error("The authkey doesn't exist!"));
            return;
        }

        if(await videoware.getVideoByID(videoID)===null) {
            res.send(json.error("That video doesn't exist!"));
            return;
        }

        if(validator.isEmpty(content)) {
            res.send(json.error("Please put actual text in the comment silly!"));
            return;
        }

        // get user that's posting
        var user = await userware.getUserByAuthKey(authKey);
        if(!commentware.createComment(videoID, user, content)) {
            res.send(json.error("The comment failed to post!"));
            return;
        }

        res.send(json.success("The comment was posted!"));
        return;
    });
}