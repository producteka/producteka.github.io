angular.module("app").config(["$stateProvider",function(e){e.state("locationSelection",{redirectTo:"selectedLocation.home",url:"/"}).state("selectedLocation",{url:"/:ubicacion",templateUrl:"app/components/selected-location/selected-location-view.html",controller:"selectedLocationController",params:{ubicacion:"Rio Tercero"}}).state("selectedLocation.home",{url:"/home",templateUrl:"app/components/home/home-view.html",controller:"homeController"}).state("selectedLocation.resultados",{url:"/resultados",templateUrl:"app/components/results/results-view.html",controller:"resultsController"}).state("selectedLocation.sinResultados",{url:"/sin-resultados",templateUrl:"app/components/no-results/no-results-view.html",controller:"noResultsController"}).state("selectedLocation.products",{url:"/productos",templateUrl:"app/components/product-suggestions/product-suggestions-view.html"}).state("selectedLocation.stores",{url:"/cartas",templateUrl:"app/components/store-suggestions/store-suggestions-view.html"}).state("otherwise",{url:"*path",redirectTo:"locationSelection"})}]);