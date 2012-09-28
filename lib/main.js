var userStats = {};
var pollID = 0;
var api = "http://mcplots-dev.cern.ch/api.php?user=";
var url = "empty";
var n_errors = 0;

function hoursToMiliseconds(hours){
    if (hours > 1) {
        return (hours*60*60*1000);
    }
    else {
        return (60*60*1000);
    }
}

function getData() {
    var Request = require("request").Request;
    //console.log(url);
    var req = Request({
        url: url,
        overrideMimeType: 'application/json',
        onComplete: manageData,
    });
    if (url != "empty") {
        req.get();
    }
}

var notifications = require("notifications");
var self = require("self");
var t4tIconURL = self.data.url("icon.png");

var timers = require("timers");

// Preferences
prefs = require("simple-prefs").prefs;

if (prefs.BoincId == "empty") {
    notifications.notify({
      title: "Your Test4Theory BOINC ID is missing!",
      text: "Please, open the extensions preferences and add your T4T BOINC ID",
      iconURL: t4tIconURL,
    });
}
else {
    //console.log("Using BOINC ID: " + prefs.BoincId);
    var url = api + prefs.BoincId;
    PollingTime = hoursToMiliseconds(prefs.PollInterval);
    pollID = timers.setInterval(getData, PollingTime);
}

function onPrefChange(prefName) {
    //console.log("The " + prefName + " preference changed.");
    if (prefName == "BoincId") {
        //console.log("Requesting data for new BoincId");
        url = api + prefs.BoincId;
    }

    if (prefName == "PollInterval") {
        if (prefs.PollInterval > 0) {
            PollingTime = hoursToMiliseconds(prefs.PollInterval);
        }
        else {
            PollingTime = hoursToMiliseconds(1);
        }
        //console.log("Reset the timer to: " + PollingTime);
        timers.clearInterval(pollID);
        pollID = timers.setInterval(getData, PollingTime);
    }
}
require("simple-prefs").on("BoincId", onPrefChange);
require("simple-prefs").on("PollInterval", onPrefChange);

// Simple Storage
var ss = require("simple-storage");
if (!ss.storage.userStats) {
    ss.storage.userStats = { };
}
//else {
//    console.log(ss.storage.userStats.user_id);
//    console.log(prefs.BoincId);
//}
// For Billionares club!
if (!ss.storage.billionare) {
    ss.storage.billionare = 0;
}
//else {
//    console.log(ss.storage.billionare);
//}

// Requesting T4T data via the API
function manageData(response) {
    var sync = false;
    //console.log("User data received!");
    recentUserStats = response.json;
    // Check if the BOINC ID is correct
    if (!recentUserStats) {
        //console.log("Oops! User ID not found");
        notifications.notify({
            title: "Oops! User ID not found",
            text: "Please, check the BOINC User ID",
            iconURL: t4tIconURL,
        });
        return;
    }

    // Now compare with the previous request
    if (ss.storage.userStats.user_id != recentUserStats.user_id) {
        //console.log("New user ID");
        ss.storage.userStats = recentUserStats;
        return;
    }

    // Number of events
    if (ss.storage.userStats.n_events < recentUserStats.n_events) {
        //console.log("New events simulated!");
        sync = true;
        var n_events = recentUserStats.n_events - ss.storage.userStats.n_events;
        if (n_events == 1) {
          var msg = "Congratulations! You have simulated a new event";
        }
        else {
          var msg = "Congratulations! You have simulated: " + n_events + " new events";
        }
        notifications.notify({
          title: "New events simulated!",
          text: msg,
          iconURL: t4tIconURL,
        });

        // Check if the user has entered the T4T Billionares Club!
        if (ss.storage.billionare == 0) {
            if (recentUserStats.n_events >= 1000000000) {
                notifications.notify({
                  title: "Congratulations!!!!",
                  text: "You have simulated more than 1 Billion events!! Welcome to the T4T Billionares Club",
                  iconURL: t4tIconURL,
                });
            ss.storage.billionare = 1;
            }
        }
        //else {
        //    console.log("Sorry, you are already a member :-)");
        //}
    }

    // Number of jobs
    if (ss.storage.userStats.n_jobs < recentUserStats.n_jobs) {
        //console.log("New jobs completed!");
        sync = true;
        var n_jobs = recentUserStats.n_jobs - ss.storage.userStats.n_jobs;
        if (n_jobs == 1) {
          var msg = "Congratulations! You have completed a new job";
        }
        else {
          var msg = "Congratulations! You have completed: " + n_jobs + " new jobs";
        }
        notifications.notify({
          title: "New jobs completed!",
          text: msg,
          iconURL: t4tIconURL,
        });
    }

    // Number of hosts
    if (ss.storage.userStats.n_hosts < recentUserStats.n_hosts) {
        //console.log("New host added!");
        sync = true;
        var n_hosts = recentUserStats.n_hosts - ss.storage.userStats.n_hosts;
        if (n_hosts == 1) {
          var msg = "Thanks! You have added a new computer";
        }
        else {
          var msg = "Thanks a lot! You have added: " + n_hosts + " new computers";
        }
        notifications.notify({
          title: "New computers added!",
          text: msg,
          iconURL: t4tIconURL,
        });
    }

    if (sync) {
        ss.storage.userStats = recentUserStats;
    }
}
