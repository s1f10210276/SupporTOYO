let BASE_URL = "https://edu-iot.iniad.org/api/v1";
let userid = sessionStorage.getItem("iniad-id") + "@iniad.org";
let userpw = sessionStorage.getItem("iniad-pw");

function updateClock() {
  document.getElementById("clock").innerHTML = new Date().toLocaleString(
    "ja-JP",
    {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}
updateClock();
setInterval(updateClock, 1000);

function makeBasicAuth(userid, userpw) {
  let token = userid + ':' + userpw;
  let hash = btoa(token);
  return "Basic " + hash;
}

function callLockerPositionAPI(url, method, userid, userpw, callback) {
  $.ajax({
    type: method,
    url: url,
    dataType: 'json',
    beforeSend: function (xhr) {
      xhr.setRequestHeader('Authorization', makeBasicAuth(userid, userpw));
    },
    success: function (data, status, xhr) {
      callback({
        status: 'success',
        description: 'ロッカーが開きました。',
        lockerAddress: data.name,
        lockerFloor: data.floor + '階'
      });
    },
    error: function (xhr, status, error) {
      if (xhr.status === 503) {
        callback({
          status: 'success',
          description: 'ロッカーを開くには、INIAD Wi-Fiを使用してください。',
          lockerAddress: "--",
          lockerFloor: "--"
        });
      } else {
        let err = JSON.parse(xhr.responseText);
        let errorMsg = '[' + err.status + '] ' + err.description;
        callback({
          status: 'fail',
          description: errorMsg,
          lockerAddress: null,
          lockerFloor: null
        });
      }
    }
  });
}

function getLockerPosition() {
  let url = BASE_URL + '/locker';
    callLockerPositionAPI(url, 'GET', userid, userpw, function(result) {
    document.getElementById('result').textContent = result.lockerFloor + result.lockerAddress + '番地のロッカー前で操作してください。';
  });
}
document.addEventListener('DOMContentLoaded', function() {
  getLockerPosition();
});

function lockerOpen() {
  let url = BASE_URL + '/locker/open';
  callLockerPositionAPI(url, 'POST', userid, userpw, function (result) {
    alert(
        result.description +
        "\nフロア: " +
        result.lockerFloor +
        "\n番地: " +
        result.lockerAddress
    );
  });
}

function callRoomStatusAPI(url, method, userid, userpw, callback) {
  let requestSensorType = [
    "temperature",
    "humidity",
    "illuminance",
    "airpressure",
  ];
  let requestUrl = url + "?sensor_type=";
  for (i = 0; i < requestSensorType.length; i++) {
    requestUrl += requestSensorType[i] + "+";
    if (i == requestSensorType.length - 1) {
      requestUrl += requestSensorType[i];
    }
  }
  $.ajax({
    type: method,
    url: requestUrl,
    dataType: "json",
    beforeSend: function (xhr) {
      xhr.setRequestHeader('Authorization', makeBasicAuth(userid, userpw))
    },
    success: function (data) {
      let retrievedSensors = {};
      let results = {};
      for (i = 0; i < data.length; i++) {
        retrievedSensors[data[i].sensor_type] = data[i].value;
      }
      requestSensorType.forEach(function (type) {
        if (retrievedSensors[type] == null) {
          results[type] = "none";
        } else {
          results[type] = retrievedSensors[type];
        }
      });
      callback({
        description: "教室の情報取得に成功しました。",
        illuminance: results.illuminance,
        humidity: results.humidity,
        airpressure: results.airpressure,
        temperature: results.temperature,
      });
    },
    error: function (xhr) {
      if (xhr.status === 503) {
        callback({
          description: "教室の情報取得には、INIAD Wi-Fiを使用してください。",
          illuminance: "--",
          humidity: "--",
          airpressure: "--",
          temperature: "--",
        });
      } else {
        let err = JSON.parse(xhr.responseText);
        callback({
          description: "教室: " + err.status + " " + err.description,
          illuminance: "--",
          humidity: "--",
          airpressure: "--",
          temperature: "--",
        });
      }
    },
  });
}

function getRoomStatus(roomNum) {
  let url = BASE_URL + "/sensors/" + roomNum;

  callRoomStatusAPI(url, "GET", userid, userpw, function (result) {
    alert(
      roomNum +
        result.description +
        "\n気温: " +
        result.temperature +
        " ℃\n湿度: " +
        result.humidity +
        " %\n気圧: " +
        result.airpressure +
        " hPa\n照度: " +
        result.illuminance +
        " lx"
    );
  });
}