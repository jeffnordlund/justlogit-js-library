"use strict";

(function () {

  var Logger = function() {

    var BASE_URL = 'https://addto.justlog.it/v1/log/',
      COOKIE_NAME = '__jlimarker',
      me = this;


    this.token = '';
    this.userid = null;
    this.dnt = false;
    this.handleGlobalErrors = false;
    this.generateRandomId = true;


    function calculateMilliseconds(start, end) {
      return end.getTime() - start.getTime();
    }

    function executePostRequest(url, object, callback) {

      var json = '';
      if (typeof object === 'object') {
        json = JSON.stringify(object);
      }
      else {
        json = object;
      }
      var xmlHttp = new XMLHttpRequest();
      xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && (xmlHttp.status == 200 || xmlHttp.status == 204))
          if (callback) callback(true);
          else if (xmlHttp.status >= 500) {
            if (callback) callback(false);
          }
      };

      xmlHttp.open("POST", url, true);
      xmlHttp.setRequestHeader('content-type', 'application/json');
      xmlHttp.send(json);
    }

    function dropPixel(url) {
      var img = document.createElement('IMG');
      img.src = url;
      img.style.width = 0;
      img.style.height = 0;
      img.style.display = 'none';
      document.body.appendChild(img);
    }

    function createUserMarker() {
      var date = new Date();
      return (date.getTime() % 10000) * parseInt(Math.random() * 1000, 10) + parseInt(Math.random() * 50, 10);
    }

    function getCurrentScript() {
      if (document.currentScript) return document.currentScript;

      var scriptBlocks = document.getElementsByTagName('SCRIPT');
      for (var i = 0, len = scriptBlocks.length; i < len; i++) {
        var script = scriptBlocks[i];
        if (script.src.indexOf('justlogit') > -1) {
          return script;
        }
      }
    }


    this.getUserMarker = function () {
      if (!this.userid) {
        this.userid = this.getMarkerFromCookie();
        if (!this.userid && this.generateRandomId) {
          this.userid = createUserMarker();
          this.setCookie(this.userid);
        }
      }
      if (this.userid === undefined || this.userid === null) return '';
      else return this.userid;
    }

    this.getMarkerFromCookie = function () {
      if (document.cookie.indexOf(COOKIE_NAME) === -1) return null;

      var cookies = document.cookie.split(';');
      for (var i = 0, len = cookies.length; i < len; i++) {
        if (cookies[i].indexOf(COOKIE_NAME) > -1) {
          return cookies[i].substr(cookies[i].indexOf('=') + 1);
        }
      }

      return null;
    }

    this.setCookie = function (value) {
      if (!this.dnt) return;

      // set the exp date to a month from now
      var date = new Date();
      date.setTime(date.getTime() + (30 * 24 * 60 * 60 * 1000));
      var expires = '; expires=' + date.toGMTString();
      document.cookie = COOKIE_NAME + '=' + value + expires + '; path=/';
    }

    this.init = function () {
      if (!this.token) {
        var script = getCurrentScript();
        if (script) {
          var token = script.attributes['token'];
          if (token) {
            this.token = token.value;
          }
        }
      }
    };


    this.logPerformance = function (start, end, method, additionalValues) {
      if (!this.token) return;

      var executionTime = calculateMilliseconds(start, end);
      var usermarker = this.getUserMarker();

      var url = BASE_URL + this.token + '/perf?m=' + encodeURIComponent(method) + '&t=' + executionTime;
      if (!this.dnt && usermarker) url += '&u=' + encodeURIComponent(usermarker);
      if (document.referrer) url += '&r=' + encodeURIComponent(document.referrer);

      if (additionalValues && typeof additionalValues === 'object') {
        for (var key in additionalValues) {
          url += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(additionalValues[key]);
        }
      }
      dropPixel(url);
    };


    this.logEvent = function(name, details, additionalValues) {
      if (!this.token) return;

      var usermarker = this.getUserMarker();
      var url = BASE_URL + this.token + '/event?n=' + encodeURIComponent(name);
      if (details) url += '&d=' + encodeURIComponent(details);
      if (!this.dnt && usermarker) url += '&u=' + encodeURIComponent(usermarker);
      if (document.referrer) url += '&r=' + encodeURIComponent(document.referrer);

      if (additionalValues && typeof additionalValues === 'object') {
        for (var key in additionalValues) {
          url += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(additionalValues[key]);
        }
      }
      dropPixel(url);
    };


    this.logError = function (err, details, additionalValues) {
      if (!this.token || !err) return;

      var obj = {};
      var usermarker = this.getUserMarker();

      if (typeof err !== 'object') {
        obj.message = err;
      }
      else {
        obj.message = err.message;
      }

      obj.stack = (err.stack || '');
      if (details) err.details = details;

      if (!this.dnt && usermarker) obj.user = usermarker;
      if (document.referrer) obj.referrer = document.referrer;

      if (additionalValues && typeof additionalValues === 'object') {
        for (var key in additionalValues) {
          obj[key] = additionalValues[key];
        }
      }

      var url = BASE_URL + this.token + '/error';
      executePostRequest(url, obj, null);
    };


    this.logInformation = function (method, details, additionalValues) {
      if (!this.token) return;

      var usermarker = this.getUserMarker();
      var url = BASE_URL + this.token + '/info?m=' + encodeURIComponent(method);
      if (details) url += '&d=' + encodeURIComponent(details);
      if (!this.dnt && usermarker) url += '&u=' + encodeURIComponent(usermarker);
      if (document.referrer) url += '&r=' + encodeURIComponent(document.referrer);

      if (additionalValues && typeof additionalValues === 'object') {
        for (var key in additionalValues) {
          url += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(additionalValues[key]);
        }
      }
      dropPixel(url);
    };


    this.setUserMarker = function(marker) {
      this.userid = marker;
      this.dnt = false;
      this.setCookie(userMarker);
    };


    this.enableUserTracking = function () {
      this.dnt = false;
    };


    this.doNotTrack = function(value) {
      this.dnt = value;
    };


    window.onerror = function (message, url, line, col, error) {
      if (me.handleGlobalErrors) {
        var fauxstack = url + ' line: ' + line;
        var err = error;

        if (!error) {
          // build the error
          err = {};
          err.message = message;
          err.stack = fauxstack;
        }
        else if (typeof error === 'string') {
          err = {};
          err.message = error;
          err.stack = fauxstack;
        }

        if (!err.stack) err.stack = fauxstack;

        me.logError(err, message, null);
      }

      return false;
    };

  };


  if (!window.justlogit) {
    window.justlogit = {};
    var logger = new Logger();
    logger.init();
    window.justlogit = logger;
  }
  else if (!window.justlogit.init) {
    var logger = new Logger();
    logger.init();

    // store any pre-initalized values
    if (window.justlogit.hasOwnProperty('token')) logger.token = window.justlogit.token;
    if (window.justlogit.hasOwnProperty('userid')) logger.userid = window.justlogit.userid;
    if (window.justlogit.hasOwnProperty('dnt')) logger.dnt = window.justlogit.dnt;
    if (window.justlogit.hasOwnProperty('handleGlobalErrors')) logger.handleGlobalErrors = window.justlogit.handleGlobalErrors;
    if (window.justlogit.hasOwnProperty('generateRandomId')) logger.generateRandomId = window.justlogit.generateRandomId;

    window.justlogit = logger;
  }
  
}());
