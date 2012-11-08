// Generated by CoffeeScript 1.3.1
var DataArray, Listeners, commander;

Listeners = (function() {

  Listeners.name = 'Listeners';

  function Listeners() {
    this.objects = [];
  }

  Listeners.prototype.add = function(listener) {
    if (this.find(listener) === -1) {
      return this.objects.push(listener);
    }
  };

  Listeners.prototype.remove = function(listener) {
    var index;
    index = this.find(listener);
    if (n !== -1) {
      return this.objects.splice(n, 1);
    }
  };

  Listeners.prototype.find = function(listener) {
    var i, o, _i, _len, _ref;
    _ref = this.objects;
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      o = _ref[i];
      if (o === listener) {
        return i;
      }
    }
    return -1;
  };

  Listeners.prototype.clear = function() {
    return this.objects = [];
  };

  Listeners.prototype.length = function() {
    return this.objects.length;
  };

  Listeners.prototype.notify = function() {
    var o, _i, _len, _ref;
    _ref = this.objects;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      o = _ref[_i];
      o();
    }
  };

  return Listeners;

})();

DataArray = (function() {

  DataArray.name = 'DataArray';

  DataArray.prototype.max = 50;

  DataArray.prototype.index = {
    jobId: 0,
    jobName: 1,
    elapsedTime: 2,
    status: 3,
    outcome: 4,
    owner: 5,
    abortStatus: 6,
    errorCode: 7
  };

  function DataArray() {
    this.objects = [];
  }

  DataArray.prototype.get = function(rowNo, index) {
    if (this.objects[rowNo] != null) {
      if ((index != null) && (this.objects[rowNo][index] != null)) {
        return this.objects[rowNo][index];
      } else {
        return this.objects[rowNo];
      }
    } else {
      return null;
    }
  };

  DataArray.prototype.length = function() {
    return this.objects.length;
  };

  DataArray.prototype.clear = function() {
    return this.objects = [];
  };

  DataArray.prototype.add = function(element, prepend) {
    if (this.length() < DataArray.prototype.max) {
      if (prepend) {
        return this.objects.unshift(element);
      } else {
        return this.objects.push(element);
      }
    }
  };

  return DataArray;

})();

commander = {
  username: "guest",
  password: "guest",
  hostname: "chronic2",
  url: "http://chronic2:8000",
  jobName: "ecloud-%",
  numOfJobs: 20,
  interval: 15000,
  sessionId: null,
  hadError: false,
  retrievalDate: null,
  retrievalInterval: 30 * 1000,
  data: new Listeners,
  messages: new Listeners,
  dataArray: new DataArray,
  run: function() {
    jQuery.support.cors = true;
    return commander.login();
  },
  login: function() {
    return $.ajax({
      type: "POST",
      cache: false,
      url: commander.url,
      contentType: "text/xml",
      dataType: "xml",
      data: "<requests xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:noNamespaceSchemaLocation=\"accelerator.xsd\" version=\"2.0\" sessionId=\"\">\n  <request requestId=\"1\">\n    <login>\n      <password>" + commander.password + "</password>\n      <userName>" + commander.username + "</userName>\n    </login>\n  </request>\n</requests>",
      success: function(data, textStatus, request) {
        commander.sessionId = $(data).find("sessionId").text();
        if (commander.sessionId != null) {
          commander.info("login successful");
          if (commander.hadError) {
            return location.reload();
          } else {
            return commander.retrieve();
          }
        } else {
          return commander.error("login failed");
        }
      },
      error: function(request, status, error) {
        return commander.error("login " + status + ": " + error + " (" + request.status + ")");
      }
    });
  },
  retrieve: function() {
    commander.info("retrieve jobs status");
    return $.ajax({
      type: "POST",
      cache: false,
      url: commander.url,
      contentType: "text/xml",
      dataType: "xml",
      data: "<requests xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:noNamespaceSchemaLocation=\"accelerator.xsd\" version=\"2.0\" sessionId=\"" + commander.sessionId + "\">\n  <request requestId=\"0\">\n    <findObjects>\n      <objectType>job</objectType>\n      <filter>\n        <propertyName>jobName</propertyName>\n        <operand1>" + commander.jobName + "</operand1>\n        <operator>like</operator>\n      </filter>\n      <sort>\n        <propertyName>createTime</propertyName>\n        <order>descending</order>\n      </sort>\n      <numObjects>" + commander.numOfJobs + "</numObjects>\n      <maxIds>" + commander.numOfJobs + "</maxIds>\n    </findObjects>\n  </request>\n</requests>",
      success: function(data, textStatus, request) {
        if ($(data).find("job").text().length > 0) {
          commander.retrievalDate = new Date().getTime();
          commander.dataArray.clear();
          $(data).find('job').each(function() {
            return commander.dataArray.add([$(this).find("jobId").text(), $(this).find("jobName").text(), $(this).find("elapsedTime").text(), $(this).find("status").text(), $(this).find("outcome") != null ? $(this).find("outcome").text() : null, $(this).find("owner:first").text(), $(this).find("abortStatus") != null ? $(this).find("abortStatus").text() : null, $(this).find("errorCode") != null ? $(this).find("errorCode").text() : null]);
          });
          commander.info("jobs status updated");
          commander.data.notify();
          return window.setTimeout(commander.retrieve, commander.retrievalInterval);
        } else {
          return commander.error("retrieve failed: " + ($(data).find('code').text()));
        }
      },
      error: function(request, status, error) {
        return commander.error("retrieve " + status + ": " + error + " (" + request.status + ")");
      }
    });
  },
  info: function(message) {
    return commander.boardcast(message);
  },
  error: function(message) {
    commander.boardcast(message);
    commander.hadError = true;
    return window.setTimeout(commander.login, commander.interval);
  },
  boardcast: function(message) {
    var date, msg, o, _i, _len, _ref;
    date = new Date();
    msg = "(" + (commander.pad(date.getHours())) + ":" + (commander.pad(date.getMinutes())) + ":" + (commander.pad(date.getSeconds())) + "): " + message;
    _ref = commander.messages.objects;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      o = _ref[_i];
      o(msg);
    }
  },
  pad: function(str) {
    str = String(str);
    if (str.length < 2) {
      return "0" + str;
    } else {
      return str;
    }
  }
};

