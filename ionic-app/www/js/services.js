angular.module('gta.services', [])

.factory('LoginData', function() {
  return {
    status: false,
    user: {
      username: "anonymous"
    },
    dsRecord: null
  };
})

.factory('LoginPromise', function ($q) {
  return $q.defer();
})
