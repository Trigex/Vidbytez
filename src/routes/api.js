const config = require('../../config.json');
const uriBase = "/api/";
const json = require("../utils/json");
const bcryptUtil = require("../utils/bcrypt_utils");
const userware = require("../middleware/userware");
const videoware = require("../middleware/videoware");
const validator = require("validator");
const session = require("../utils/session");
const hat = require("hat");
const ffmpeg = require("../utils/ffmpeg_utils");

module.exports = function(app) {
    app.get(uriBase + "version", function(req, res){
        res.send(JSON.stringify({version: config.app.build.version}));
    }),

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
            // create apikey
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

        var user = await userware.getUser(username);
        if(user === null) {
            res.send(json.error("That user doesn't exist!"));
            return;
        }

        if(await bcryptUtil.checkPassword(password, user.password)) {
            // get authkey
            var authKey = await userware.getAuthKey(username);
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
    *   @param destroy_session Boolean, should a session be destroyed too?
    */
    app.post(uriBase + 'user/logout', async function(req, res) {
        var username = req.session.username;
        var destroy_session = req.body.destroy_session;
        if(destroy_session) {
            if(!username) {
                res.send(json.error("No session was found to end!"));
                return;
            } else {
                session.destroySession(req.session);
                res.send(json.success("You've logged out! Come back soon please~"));
            }
        }
    });

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
                console.log(user);
                var videoID = await videoware.createVideo(filename, Date.now(), user);
                console.log(videoID);
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
                try {
                    await file.mv(path);
                } catch(err) {
                    console.log(err);
                }
                // reencode video
                res.send(json.success("The video was successfully uploaded! Please wait for processing to finish!"));
                // keep it at the lowest quality for now
                await ffmpeg.encodeVideo(path, config.app.videos.qualities[0], videoID);
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

        if(await userware.authKeyExists(authKey) === false) {
            res.send(json.error("The authkey sent doesn't exist!"));
            return;
        }

        // put ownership checking here later

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

        res.send(json.success("The video information was updated!"));
    });

    app.get("/test", async function(req, res){
        
    });
}