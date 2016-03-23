var dsanon = new deepstream('127.0.0.1:6030').login();

angular.module('gta.controllers', [])

.controller('MainCtrl', function ($scope, LoginData) {
  $scope.loginData = LoginData;
  $scope.$watch(
    function () {
      return LoginData;
    },
    function (newVal) {
      $scope.loginData = newVal;
    });
})

.controller('WelcomeCtrl', function(
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
        record.discard();

        if (record.get("password") === password) {
          LoginData.status = true;
          LoginData.user = record.get();

          $ionicPopup.alert({
              "template": "You're now Logged In!"
          }).then(function () {
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
        password: password // This is a PoC, there are a LOT of other security concerns as well - needs more architecting overall
      });

      $ionicPopup.alert({
          "template": "Registration completed! Please login now."
      }).then(function () {
          $scope.registerModal.hide();
          $scope.loginModal.show();
      });
  };
})

.controller('CheckOnEveryoneCtrl', function($scope, $state, $geolocation, LoginData) {
  if (LoginData.status !== true) {
    $state.go('tab.welcome');
  }

  $geolocation.watchPosition({
    timeout: 60000,
    maximumAge: 250,
    enableHighAccuracy: true
  });
  $scope.myCoords = $geolocation.position.coords; // this is regularly updated
  $scope.gpsError = $geolocation.position.error; // this becomes truthy, and has 'code' and 'message' if an error occurs
});
