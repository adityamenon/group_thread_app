/**
  * Alright, I'm seeing a lot of problems because of the way data is nested.
  * ✔ First off, let's get rid of Scope completely for things that are updating in real time.
  * ✔ Second, let's setup a new type of record called "coords/" which keeps track of all user's coords by Username
  * ✔ Setup subscriptions on THOSE records.
  * Let's see if that makes things any better.
*/

var dsanon = new deepstream('127.0.0.1:6030').login();

angular.module('gta.controllers', []).controller('MainCtrl', function ($scope, LoginData, LoginPromise) {
  $scope.loginData = LoginData;

  LoginPromise.promise.then(function () {
    $scope.loginData = LoginData;
  });
}).controller('WelcomeCtrl', function(
  $rootScope, $scope, $ionicModal, $http, $ionicPopup, $state, LoginData, LoginPromise, CurrentFriendSubs
) {
  if (LoginData.status === true) $state.go('tab.coe');

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
          password = $scope.loginForm.Password,
          loginRecord;

      loginRecord = dsanon.record.getRecord('user/'+username);

      loginRecord.whenReady(function () {
        if (loginRecord.get("password") === password) {
          LoginData.status = true;
          LoginData.user = loginRecord.get();
          LoginData.dsUser = loginRecord;
          LoginData.dsCoords = dsanon.record.getRecord('coords/'+username);

          LoginPromise.resolve();

          $ionicPopup.alert({
              "template": "You're now Logged In!"
          }).then(function () {
              // As data about the user changes, make sure Angular remains updated
              LoginData.dsUser.subscribe(function (newData) {
                LoginData.user = newData;
              });

              // ignoring existing subscriptions, subscribe to new coords as friends get added
              LoginData.dsUser.subscribe('friends', function (newFriends) {
                newFriends.forEach((newFriend) => {
                  if (CurrentFriendSubs.indexOf(newFriend) < 0) {
                    dsanon.record.getRecord('coords/'+newFriend).subscribe((newCoords) => {
                        LoginData.friendPositions.push({
                          coords: newCoords,
                          icon: "http://avatar.3sd.me/size/"+newFriend,
                          id: newFriend
                        });
                    });

                    CurrentFriendSubs.concat(newFriend);
                  }
                });
              }, true);

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

          loginRecord.discard();
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

      var newUserRecord = dsanon.record.getRecord("user/"+username)

      newUserRecord.whenReady(_ => {
        newUserRecord.set({
          fullName: fullName,
          username: username,
          password: password, // This is a PoC, there are a LOT of other security concerns as well - needs more architecting overall
          friends: []
        });

        newUserRecord.discard();

        var newCoordsRecord = dsanon.record.getRecord("coords/"+username);

        newCoordsRecord.whenReady(_ => {
          newCoordsRecord.set({
            latitude: null,
            longitude: null
          });

          newCoordsRecord.discard();

          $ionicPopup.alert({
              "template": "Registration completed! Please login now."
          }).then(function () {
              $scope.registerModal.hide();
              $scope.loginModal.show();
          });
        });
      });
  };
}).controller('COECtrl', function ($scope, $state, $timeout, uiGmapGoogleMapApi, LoginData, LoginPromise) {

  if (LoginData.status !== true) $state.go('tab.welcome');

  var geoOptions = {
    enableHighAccuracy: true,
    maximumAge: 6000,
    timeout: 5400
  };

  _.extend

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

  $scope.friendPositions = LoginData.friendPositions;

  uiGmapGoogleMapApi.then(function (maps) {

    LoginPromise.promise.then(function () {
      navigator.geolocation.watchPosition(
        function (p) {
          $timeout(_ => {
            $scope.map.center.latitude = p.coords.latitude;
            $scope.map.center.longitude = p.coords.longitude;

            $scope.marker.coords.latitude = p.coords.latitude;
            $scope.marker.coords.longitude = p.coords.longitude;

            LoginData.dsCoords.set({
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
}).controller('FriendsCtrl', function ($scope, $state, $ionicPopup, LoginData) {
  if (LoginData.status !== true) $state.go('tab.welcome');

  $scope.addFriends = {};

  $scope.addFriend = function () {
    var targetUName = $scope.addFriends.username;
    var targetRecord = dsanon.record.getRecord('user/'+targetUName);

    targetRecord.whenReady(function () {
      if(targetRecord.get('username') === targetUName) {
        LoginData.dsUser.set(
            'friends',
            LoginData.user.friends.concat(targetRecord.get('username'))
          );

          targetRecord.set('friends', targetRecord.get('friends').concat(LoginData.user.username));

          LoginData.user = LoginData.dsUser.get();

          targetRecord.discard();

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
