var dsanon = new deepstream('127.0.0.1:6030').login();

angular.module('gta.controllers', []).controller('MainCtrl', function ($scope, LoginData) {
  $scope.loginData = LoginData;
  $scope.$watch(
    function () {
      return LoginData;
    },
    function (newVal) {
      console.log(newVal);
      $scope.loginData = newVal;
    });
}).controller('WTFCtrl', function ($scope, $state, uiGmapGoogleMapApi) {
  var geoOptions = {
    enableHighAccuracy: true,
    maximumAge: 6000,
    timeout: 5400
  };

  $scope.map = {
    center: {
      latitude: null,
      longitude: null
    },
    zoom: 18
  };

  $scope.marker = {
    coords: {
      latitude: null,
      longitude: null
    }
  };

  if ($scope.loginData.status !== true) $state.go('tab.welcome');

  uiGmapGoogleMapApi.then(function (maps) {
    navigator.geolocation.watchPosition(
      function (p) {
        console.log(p);

        $scope.$apply(function () {
          $scope.map.center.latitude = p.coords.latitude;
          $scope.map.center.longitude = p.coords.longitude;

          $scope.marker.coords.latitude = p.coords.latitude;
          $scope.marker.coords.longitude = p.coords.longitude;

          dsanon.record.getRecord("user/"+$scope.loginData.user.username).set('coords.latitude', p.coords.latitude);
          dsanon.record.getRecord("user/"+$scope.loginData.user.username).set('coords.longitude', p.coords.longitude);
        });
      },
      function (e) {
        console.log(e);
        $scope.gpsError = e;
      },
      geoOptions
    );
  });
}).controller('WelcomeCtrl', function(
  $rootScope, $scope, $ionicModal, $http, $ionicPopup, $state, LoginData
) {
  if (LoginData.status === true) {
    $state.go('tab.coe');
  }

  $ionicModal.fromTemplateUrl('templates/modals/signup.html', {
      scope: $scope,
      animation: 'slide-in-up'
  }).then(function (modal) {
    $scope.registerModal = modal;
  });

  $ionicModal.fromTemplateUrl('templates/modals/login.html', {
      scope: $scope,
      animation: 'slide-in-up'
  }).then(function (modal) {
    $scope.loginModal = modal;
  });

  $scope.loginForm = {};
  $scope.signupForm = {};

  $scope.execLogin = function () {
      var username = $scope.loginForm.Username,
          password = $scope.loginForm.Password;

      record = dsanon.record.getRecord('user/'+username);

      record.whenReady(function () {
        if (record.get("password") === password) {
          LoginData.status = true;
          LoginData.user = record.get();
          LoginData.dsRecord = record;

          $ionicPopup.alert({
              "template": "You're now Logged In!"
          }).then(function () {
              record.subscribe(function (newData) {
                console.log("Subscription update", newData)
                LoginData.user = newData;
              });

              $scope.loginModal.hide();
              $state.go('tab.coe');
          });
        } else {
          $ionicPopup.alert({
              "template": "Login failed!"
          }).then(function () {
              $scope.loginModal.hide();
              $state.go('tab.welcome');
          });

          record.discard();
        }
      });
  };

  $scope.execSignup = function () {
      var fullName = $scope.signupForm.FullName,
          username = $scope.signupForm.Username,
          password = $scope.signupForm.Password;

      dsanon.on('error', function (err) {
        console.log("Anonymous Deepstream connection error: ", err);
      });

      dsanon.record.getRecord("user/"+username).set({
        fullName: fullName,
        username: username,
        password: password, // This is a PoC, there are a LOT of other security concerns as well - needs more architecting overall
        coords: {
          latitude: null,
          longitude: null
        },
        friends: []
      });

      $ionicPopup.alert({
          "template": "Registration completed! Please login now."
      }).then(function () {
          $scope.registerModal.hide();
          $scope.loginModal.show();
      });
  };
}).controller('FriendsCtrl', function ($scope, $state, $ionicPopup, LoginData) {
  if ($scope.loginData.status !== true) $state.go('tab.welcome');

  $scope.addFriends = {};

  $scope.addFriend = function () {
    var targetUName = $scope.addFriends.username;
    var targetRecord = dsanon.record.getRecord('user/'+targetUName);

    targetRecord.whenReady(function () {
      targetRecord.discard();

      if(targetRecord.get('username') === targetUName) {
        LoginData.dsRecord.set(
            'friends',
            LoginData.user.friends.concat(targetRecord.get())
          );

          targetRecord.set('friends', targetRecord.get('friends').concat(LoginData.user));

          LoginData.user = LoginData.dsRecord.get();

          $ionicPopup.alert({
            template: "We've added your friend!"
          });
      } else {
        $ionicPopup.alert({
          template: "Cannot find that user."
        });
      }
    });
  }
})
