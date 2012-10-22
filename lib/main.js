var userStats = {};
var pollID = 0;
var api = "http://mcplots-dev.cern.ch/api.php?user=";
var url = "empty";
var n_errors = 0;


function siprefix(value) {
    var k = 1000;
    var m = 1000000;
    var g = 1000000000;
    if (value >= g) {
        value = (value/g).toFixed(2);
        console.log(value + "G");
        return (value + "G");
    }
    if (value >= m) {
        value = (value/m).toFixed(2);
        console.log(value + "M");
        return (value + "M");
    }

    if (value >= k) {
        value = (value/k).toFixed(2);
        console.log(value + "K");
        return (value + "K");
    }

    return(value);
}

function minutesToMiliseconds(minutes){
    if (minutes >= 1) {
        return (minutes*60*1000);
    }
    else {
        return (5*60*1000);
    }
}

function getData() {
    var Request = require("request").Request;
    console.log(url);
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
    console.log("Using BOINC ID: " + prefs.BoincId);
    var url = api + prefs.BoincId;
    console.log("Using " + url);
}

if (prefs.PollInterval <= 0) {
    prefs.PollInterval=1;
}

PollingTime = minutesToMiliseconds(prefs.PollInterval);
pollID = timers.setInterval(getData, PollingTime);

function onPrefChange(prefName) {
    console.log("The " + prefName + " preference changed.");
    if (prefName == "BoincId") {
        console.log("Boinc ID changed");
        url = api + prefs.BoincId;
    }

    if (prefName == "PollInterval") {
        if (prefs.PollInterval > 0) {
            PollingTime = minutesToMiliseconds(prefs.PollInterval);
        }
        else {
            PollingTime = minutesToMiliseconds(1);
        }
        console.log("Reset the timer to: " + PollingTime);
        timers.clearInterval(pollID);
        pollID = timers.setInterval(getData, PollingTime);
    }
}
require("simple-prefs").on("BoincId", onPrefChange);
require("simple-prefs").on("PollInterval", onPrefChange);

// Simple Storage
var ss = require("simple-storage");
if (!ss.storage.userStats) {
    ss.storage.userStats = { 
        user_id: 0,
        n_events: 0,
        n_jobs: 0,
        n_hosts: 0
    };
}
// For Billionares club!
if (!ss.storage.billionare) {
    ss.storage.billionare = 0;
}

// Requesting T4T data via the API
function manageData(response) {
    var sync = false;
    console.log("User data received!");
    recentUserStats = response.json;
    // Check if the BOINC ID is correct
    if (!recentUserStats) {
        console.log("Oops! User ID not found");
        notifications.notify({
            title: "Oops! User ID not found",
            text: "Please, check the BOINC User ID",
            iconURL: t4tIconURL,
        });
        return;
    }

    // Now compare with the previous request
    if (ss.storage.userStats.user_id != recentUserStats.user_id) {
        console.log("New user ID");
        ss.storage.userStats.user_id = recentUserStats.user_id;
        // Reset counters in case the user change its BOINC ID to a new one
        ss.storage.userStats.n_jobs = 0;
        ss.storage.userStats.n_events = 0;
        ss.storage.userStats.n_hosts = 0;
        sync = true;
    }

    // Number of events
    if (ss.storage.userStats.n_events < recentUserStats.n_events) {
        console.log("New events simulated!");
        sync = true;
        if (ss.storage.userStats.n_events != 0) {
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
        }
        else {
            var msg = "You have simulated up to now: " + siprefix(recentUserStats.n_events) + " events";
            notifications.notify({
              title: "Simulated events",
              text: msg,
              iconURL: t4tIconURL,
            });
        }

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
    }

    // Number of jobs
    if (ss.storage.userStats.n_jobs < recentUserStats.n_jobs) {
        console.log("New jobs completed!");
        sync = true;
        if (ss.storage.userStats.n_jobs != 0) {
            var n_jobs = recentUserStats.n_jobs - ss.storage.userStats.n_jobs;
            var title = "New jobs completed!";
            if (n_jobs == 1) {
              var msg = "Congratulations! You have completed a new job";
            }
            else {
              var msg = "Congratulations! You have completed: " + n_jobs + " new jobs";
            }
        }
        else {
            var title = "Completed jobs";
            var msg = "You have completed up to now: " + siprefix(recentUserStats.n_jobs) + " jobs";
            }

        notifications.notify({
          title: title,
          text: msg,
          iconURL: t4tIconURL,
        });
    }

    // Number of hosts
    if (ss.storage.userStats.n_hosts < recentUserStats.n_hosts) {
        console.log("New host added!");
        sync = true;
        if (ss.storage.userStats.n_hosts != 0) {
            var n_hosts = recentUserStats.n_hosts - ss.storage.userStats.n_hosts;
            var title = "New computers added!";
            if (n_hosts == 1) {
              var msg = "Thanks! You have added a new computer";
            }
            else {
              var msg = "Thanks a lot! You have added: " + n_hosts + " new computers";
            }
        }
        else {
            var title = "Computers";
            var msg = "You have: " + siprefix( recentUserStats.n_hosts ) + " computers attached";
        }
        notifications.notify({
          title: title,
          text: msg,
          iconURL: t4tIconURL,
        });
    }

    if (sync) {
        ss.storage.userStats = recentUserStats;
    }
}
