/*   Vidbytez
 *   (c) Trigex 2018
 *   Licensed under the MIT License
*/

// create a site cookie
function createCookie(key, value, date) {
    var expiration = new Date(date).toUTCString();
    var cookie = escape(key) + "=" + escape(value) + ";expires=" + expiration + ";";
    document.cookie = cookie;
    console.log(cookie);
    console.log("Creating new cookie with key: " + key + " value: " + value + " expiration: " + expiration);
}

// read a site cookie
function readCookie(name) {
    var key = name + "=";
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        while (cookie.charAt(0) === ' ') {
            cookie = cookie.substring(1, cookie.length);
        }
        if (cookie.indexOf(key) === 0) {
            return cookie.substring(key.length, cookie.length);
        }
    }
    return null;
}

// delete a site cookie
function deleteCookie(name) {
    createCookie(name, "", -1);
}

// sum up the contents of an array
function arraySum(arr) {
    return arr.reduce(function(a,b){
        return a+b;
    }, 0);
}

function isEmptyOrSpaces(str) {
    return str === null || str.match(/^ *$/) !== null
}

// self explanitory fucknut
function convertFormDataToJson(form) {
    return _.object($(form).serializeArray().map(function (v) {
        return [v.name, v.value];
    }));
}

// quick notification creator
function createNotification(content, type) {
    new Noty({
        text: content,
        type: "alert",
        theme: "nest",
        type: type
    }).show();
}

/* FORM EVENTS MOTHERFUCKER!!!! */

// on user login (/login)
$("#user_login").submit((event) => {
    event.preventDefault();

    var formJson = convertFormDataToJson("#user_login");
    ajaxRequest("/api/user/login", "POST", {
        username: formJson.username,
        password: formJson.password,
        create_session: true
    }, (response) => {
        if (response.error) {
            responseNotification(response);
        } else {
            // store authkey as a cookie
            createCookie("authKey", response.authKey, Date.UTC(2020, 1, 1));
            responseNotification(response);

            setTimeout(() => {
                window.location = "/home"
            }, 1000);
        }
    });
});

// on user register (/register)
$("#user_register").submit((event) => {
    event.preventDefault();

    var formJson = convertFormDataToJson("#user_register");
    ajaxRequest("/api/user/create", "POST", {
        username: formJson.username,
        password: formJson.password,
        email: formJson.email

    }, (response) => {
        if (response.error) {
            responseNotification(response)
        } else {
            responseNotification(response);

            setTimeout(() => {
                window.location = "/login"
            }, 2000)
        }
    });
});

// on comment submit (/video)
$("#comment_submit").click(() => {
    var videoID = $("#videoid").text();
    var content = $("#comment_textarea").val();
    ajaxRequest("/api/comment/create", "POST", {
        authKey: readCookie("authKey"),
        content: content,
        videoID: videoID
    });
});

// subscribe
$("#vid_sub_btn").click(() => {
    // check if logged in
    if(readCookie("authKey")===null) {
        createNotification("You must be logged in to subscribe!", "error");
    } else {
        var username = $("#username_4_sub").text();
        ajaxRequest("/api/user/subscribe", "POST", {
            authKey: readCookie("authKey"),
            username: username
        });
    }
});

// on logout (navbar)
$("#logout").click(() => {
    $.ajax({
        url: "/api/user/logout",
        type: "POST",
        data: {
            destroy_session: true
        },
        success: (serverResponse) => {
            var response = JSON.parse(serverResponse);
            if (response.error) {
                responseNotification(response);
            } else {
                deleteCookie("authKey");
                responseNotification(response);

                setTimeout(() => {
                    window.location = "/home"
                }, 1000)
            }
        }
    });
});

// on new upload from (/upload)
function new_upload() {
    // selects the video file
    var video = $("#selectedFile")[0].files[0];
    // get file type?
    var extension = video.name.lastIndexOf(".");
    var page_title = $("title").html();
    var video_title = video.name;
    var video_thumb = 0;
    if (extension != -1)
        video_title = video_title.substring(0, extension);
    if (video_title.length < 4)
        video_title = "Untitled";
    // set page values
    $("#video_title").val(video_title);
    $("#video_title_header").html(video_title);
    $("#custom_thumb_button").on("click mousedown", function () {
        if (!$(this).hasClass("loading")) {
            $("#custom_thumb_file").click();
            return !1
        }
    });
    $("#selectedFile").prop("disabled", !0);
    $("#uploader").animate({
        opacity: 0
    }, 500, function () {
        $("#old_upload_box").hide();
        $("#upload_select_box").show();
        $("#video_uploader").css("opacity", 0).animate({
            opacity: 1
        }, 500)
    });
    video_upload_check(video);
}

// inital video upload request, sends metadata and shitz
function video_upload_check(video) {
    ajaxRequest("/api/video/upload", "POST", {
        action: "check",
        filename: video.name,
        filesize: video.size,
        filetype: video.type,
        authKey: readCookie("authKey")
    }, (response) => {
        if (response.error) {
            responseNotification(response);
        } else {
            responseNotification(response);
            var videoID = response.videoID;
            // create hidden videoID element on page, used for updating metadata
            $("#video_progress").append("<p hidden id='videoid'>" + videoID + "</p>");
            // go on, upload it motherfucker!
            upload_video(video, videoID);
        }
    });
}

var _videoID; // gotta love globals ahahahah some browsers don't like additional params in event handlers I guess so store the id??

// actually upload video to the server
function upload_video(video, videoID) {
    // video upload ajax (harder to do through jQuery lol kill me)
    var formData = new FormData();
    formData.append("video_file", video);
    formData.append("action", "upload");
    formData.append("authKey", readCookie("authKey"));
    formData.append("videoID", videoID);
    var ajax = new XMLHttpRequest();
    ajax.upload.addEventListener("progress", videoProgressHandle, false);
    _videoID = videoID;
    ajax.addEventListener("load", videoCompleteHandle, false);
    ajax.addEventListener("error", videoErrorHandle, false);
    ajax.addEventListener("abort", videoAbortHandle, false);
    ajax.open("POST", "/api/video/upload");
    ajax.send(formData);
}

function videoProgressHandle(event) {
    if(!event) 
        event = window.event;
    
    var percent = (event.loaded / event.total) * 100;
    $("#video_progress").val(Math.round(percent));
    $("#video_progress_text").text(Math.round(percent) + "%");
}

function videoCompleteHandle(event) {
    if(!event) 
        event = window.event;

    createNotification("The video was uploaded!!! Now be patient, we gotta process it!", "success");
    $("#video_title_header").append("<p>Your video will be live <a href='/video/" + _videoID + "'>here</a></p>");
}

function videoErrorHandle(event) {
    createNotification("The upload failed!", "error");
}

function videoAbortHandle(event) {
    createNotification("The upload was aborted!", "error");
}

// save video metadata changes from uploader
function save_video_changes() {
    var description = $("#video_description").val();
    var tags = $("#video_tags").val();
    var title = $("#video_title").val();
    var videoID = $("#videoid").text();

    ajaxRequest("/api/video/update", "POST", {
        title: title,
        description: description,
        tags: tags,
        videoID: videoID,
        authKey: readCookie("authKey")
    });
}

// fucking nasty global to see if a video has been rated
var rated = false;
// star ratings
$(function () {
    // init
    if(window.location['pathname'].includes("video")) {
        initRateYo();
    }
});

function initRateYo() {
    $("#rateYo").rateYo({
        starWidth: "15px",
        ratedFill: "#E74C3C",
        maxValue: 5,
        fullStar: true,
        onSet: (rating, rateYoInstance) => {
            if(rated === true) {
                $("#rateYo").rateYo("option", "readOnly", true);
                sendRating(rating, $("#videoid").text());
            }
        },
        onChange: (rating, rateYoInstance) => {
            // basically checking to see if the user has actually interacted with rateYo,
            // needed because the onInit rating changing triggers onSet, which without checking for mouse input
            // would send a rating regardless if the user actually rated or not.
            // a bit of a bodge. Fuck this plugin.
            rated = true;
        },
        onInit: (rating, rateYoInstance) => {
            // disable rating if not logged in
            if(readCookie("authKey")===null) {
                $("#rateYo").rateYo("option", "readOnly", true);
            }

            // get video ratings
            ajaxRequest("/api/video/"+ $("#videoid").text() +"/ratings", "GET", {}, (ratings) => {
                if(ratings.ratings.length > 1) {
                    // wow, math, find the average!!
                    var sum = arraySum(ratings.ratings);
                    var average = sum / ratings.ratings.length;
                    $("#rateYo").rateYo("option", "rating", average);
                } else {
                    $("#rateYo").rateYo("option", "rating", ratings.ratings[0]);
                }
            });
        }
    });
}

// function to create notifications from standard ajax response
function responseNotification(response) {
    if(response.success) {
        createNotification(response.success, "success");
    } else if(response.error) {
        createNotification(response.error, "error");
    }
}

// send a rateyo rating
function sendRating(rating, videoID) {
    ajaxRequest("/api/video/rating", "POST", {
        rating: rating,
        videoID: videoID,
        authKey: readCookie("authKey")
    });
}

// wrapper around AJAX so I don't have to write the same boilerplate 10000000000 times
function ajaxRequest(url, type, data, success_cb) {
    $.ajax({
        url: url,
        type: type,
        data: data,
        success: function (serverResponse) {
            var response = JSON.parse(serverResponse);
            if (success_cb) {
                success_cb(response);
            } else {
                responseNotification(response);
            }
        },
        error: function (err) {
            createNotification(err, "error");
        }
    });
}