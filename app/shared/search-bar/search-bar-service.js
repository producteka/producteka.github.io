angular.module("app").factory("searchBarService",["configurationService","closedSignService",function(e,n){var t=e.searchBarService,r=function(e,n){if(n)var r=t.suggestionsRelated;else var r=t.productsRelated;var o=e.split(" "),c="";return _.each(o,function(e){_.each(r,function(n){var t=!1;_.each(n,function(r){e===r&&(t=!0,_.each(n,function(e){c+=" "+e}))})})}),c},o=function(e){var n=function(e){return"s"===e.slice(-1)&&(e=e.slice(0,-1)),e};e=c(e);var r=e.split(" "),o=t.articles,i=[];return _.each(r,function(e){_.indexOf(o,e)<0&&(e=n(e),i.push(e))}),i},c=function(e){var n=e.toLowerCase(),n=_.deburr(n);return n},i=function(e,n){var t;return e===n&&(t=!0),t},a=function(e,n,t){var o=!0,i=c(e.producto);return void 0!=r(i,t)&&(i+=" "+r(i,t)),_.each(n,function(e){var n=new RegExp("\\b"+e,"i");-1==i.search(n)&&(o=!1)}),o},u=function(e,n,t){var r=_.find(t.allClients,["id",n.cliente[0].id]),o=[];return _.each(t.allHours,function(n){n.cliente[0]&&n.cliente[0].cliente===e&&o.push(n)}),{client:r,matchedProducts:[],hours:o}},s=function(e){var n=_.groupBy(e,function(e){return!0===e.openData.isOpen?"open":void 0!=e.openData.openTime?"openLater":"closed"});return n.open=_.shuffle(n.open),n.openLater=_.sortBy(n.openLater,[function(e){return e.openData.openTime}]),n},l={};return l.noResults=function(e){var n=void 0!=e.open&&e.open.length>0,t=void 0!=e.openLater&&e.openLater.length>0,r=void 0!=e.closed&&e.closed.length>0;return!(n||t||r)},l.getMatches=function(e,t,r){var c=o(t),l=[],f=[];_.each(e.allProducts,function(o){var s=o.cliente[0].cliente,l=a(o,c,r);if(void 0!=s){var d=i(s,t);(l||d)&&(s in f||(f[s]=u(s,o,e),f[s].openData=n.getData(f[s])),f[s].matchedProducts.push(o))}});for(client in f)f[client].matchedProducts=_.sortBy(f[client].matchedProducts,[function(e){return e.producto}]),l.push(f[client]);return s(l)},l}]);