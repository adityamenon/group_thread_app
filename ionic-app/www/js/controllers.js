var dsanon = new deepstream('127.0.0.1:6030').login();

angular.module('gta.controllers', []).controller('MainCtrl', function ($scope, LoginData, LoginPromise) {
  $scope.loginData = LoginData;

  LoginPromise.promise.then(function () {
    $scope.loginData = LoginData;
  });
}).controller('COECtrl', function ($scope, $state, $timeout, uiGmapGoogleMapApi, LoginData, LoginPromise) {
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
    zoom: 12
  };

  $scope.marker = {
    coords: {
      latitude: null,
      longitude: null
    },
    username: LoginData.user.username
  };

  $scope.friendPositions = [];

  if ($scope.loginData.status !== true) $state.go('tab.welcome');

  uiGmapGoogleMapApi.then(function (maps) {

    LoginPromise.promise.then(function () {
      $timeout(_ => {

        var friendPusher = () => {
          $scope.friendPositions = [];

          $scope.$apply(_ => {
            LoginData.user.friends.forEach(function (friend) {
                $scope.friendPositions.push({
                  coords: friend.coords,
                  icon: "http://avatar.3sd.me/size/"+friend.username,
                  id: friend.username
                });
            });

          })

          console.log($scope.friendPositions);
        }

        LoginData.dsRecord.subscribe('friends', () => {
          friendPusher();
        });

        friendPusher();
      });

      navigator.geolocation.watchPosition(
        function (p) {
          $timeout(_ => {
            $scope.map.center.latitude = p.coords.latitude;
            $scope.map.center.longitude = p.coords.longitude;

            $scope.marker.coords.latitude = p.coords.latitude;
            $scope.marker.coords.longitude = p.coords.longitude;

            $scope.marker.username = LoginData.user.username;

            LoginData.dsRecord.set('coords', {
              latitude: p.coords.latitude,
              longitude: p.coords.longitude
            });
          });
        },
        (e) => {
          console.log(e);
          $scope.gpsError = e;
        },
        geoOptions
      );
    });
  });
}).controller('WelcomeCtrl', function(
  $rootScope, $scope, $ionicModal, $http, $ionicPopup, $state, LoginData, LoginPromise
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

          LoginPromise.resolve();

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

          // targetRecord.subscribe('coords', (coords) => {
          // });

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
