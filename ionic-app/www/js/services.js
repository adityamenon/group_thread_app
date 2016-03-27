angular.module('gta.services', []).factory('LoginData', function() {
  return {
    status: false,
    user: {
      username: "anonymous"
    },
    dsUser: null,
    dsCoords: null,
    friendPositions: []
  };
}).factory('LoginPromise', function ($q) {
  return $q.defer();
}).factory('CurrentFriendSubs', function () {
  return [];
});
