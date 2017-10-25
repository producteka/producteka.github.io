var myApp = angular.module('myApp',[]);

myApp.controller('appController', ['$scope', function($scope) {
	$scope.isMobile = (window.innerWidth <= 600 || window.innerHeight <= 500) ? true : false;
	$scope.isSearchBoxFocused; // Gotten from #searchterm text field on the view, nt currently in use
	$scope.loadComplete = false;

	$scope.clientsShown;
	$scope.noResults;

	  $scope.callPerformed = function(clientName) {
	    _trackEvent('Llamadas', clientName, searchKeyWords);
	  }

	  $scope.locationConsulted = function(clientName) {
	    _trackEvent('Ubicaciones', clientName, searchKeyWords);
	  }

	$scope.search = function(filter) {
		var accentsTidyAndLowercase = function (text) {
			var r = text.toLowerCase();
			var r = _.deburr(r); // removing accents
			return r;
		};

		var getRelatedWordsFor = function (product) {
			var productWords = product.split(' ');
			var relatedWords = [
				['lomo','lomito'],
				['whiskey', 'whiski', 'wisky', 'whisky', 'wiskey', 'wiski'],
				['sandwich','sanguche','sanguich', 'baguette'],
				['cerveza', 'birra', 'cervesa'],
				['pizza', 'piza', 'pisa'],
				['muzzarella', 'muzarella', 'musarella', 'musarela']
			];
			var related = '';
			_.each(productWords, function (productWord) {
				_.each(relatedWords, function (relatedWordsGroup) {
					var matchWordInGroup = false;
					_.each(relatedWordsGroup, function (relatedWord) {
						if (productWord === relatedWord) {
							matchWordInGroup = true;
							_.each(relatedWordsGroup, function (wordToInclude) {
								related += (' '+wordToInclude);
							});
						}
					});
				});
			});
			return related;
		};

		var getWordsToSearch = function (searchedText) {
			var pluralToSingular = function(word) {
				if (word.slice(-1) === "s") {
					word = word.slice(0,-1);
				}
				return word;
			};

			searchedText = accentsTidyAndLowercase(searchedText);
			var searchedWords = searchedText.split(" ");
			var commonWords = ["de","la","que","el","en","y","a","los","del","las", "con"];

			var outputWords = [];
			_.each(searchedWords, function(searchedWord) {
				if (_.indexOf(commonWords, searchedWord) < 0) {
					searchedWord = pluralToSingular(searchedWord);
					outputWords.push(searchedWord);
				}
			});
			return outputWords;
		};

		var getMatches = function (searchedWords) {
			var matchesClient = function (cliente, searchedWords) {
				var clientWordsMatched = 0;
				var currentClient = accentsTidyAndLowercase(cliente);
				var currentClientNumberOfWords = getWordsToSearch(currentClient).length;

				_.each(searchedWords, function (searchedWord) {
					var searchQuery = new RegExp("\\b"+searchedWord, "i");
					if (currentClient.search(searchQuery) != -1)
					{
						clientWordsMatched++;
					}
				});

				return (clientWordsMatched === currentClientNumberOfWords);
			}

			var matchesProduct = function (product, searchedWords) {
				var matchesAllProductWords = true;
				var currentProduct = accentsTidyAndLowercase(product.producto);
				if (getRelatedWordsFor(currentProduct) != undefined) {
					currentProduct += ' ' + getRelatedWordsFor(currentProduct);
				}

				_.each(searchedWords, function (searchedWord) {
					var searchQuery = new RegExp("\\b"+searchedWord, "i");

					if (currentProduct.search(searchQuery) == -1) {
						matchesAllProductWords = false;
					}
				});

				return matchesAllProductWords;
			}

			var mergeClientData = function (cliente, product, allHours, allClients) {
				var currentClient = _.find(allClients, ['id', product.cliente[0].id]);
				var hours = [];
				// Agregamos las horas al correspondiente cliente
				_.each(allHours, function (currentHours) {
					if (currentHours.cliente[0] && currentHours.cliente[0].cliente === cliente) {
						hours.push(currentHours);
					}
				});

				return {client: currentClient, matchedProducts: [], hours: hours};
			};

			var splitOpenClosedMatches = function (matches) {
				var allMatchesSplitted = _.groupBy(matches,
					function (local) {
						if (local.openData.isOpen === true) {
							return "open";
						} else if (local.openData.openTime != undefined) {
							return "openLater";
						} else {
							return "closed";
						}
					}
				);

				// Aleatory sorting for open stores
				allMatchesSplitted.open = _.shuffle(allMatchesSplitted.open);

				allMatchesSplitted.openLater = _.sortBy(allMatchesSplitted.openLater, [
					function (local) {
						return local.openData.openTime;
					}
				]);
				return allMatchesSplitted;
			}

			var output = [];
			var clientList = [];

			_.each(allProducts, function (product) {
				var cliente = product.cliente[0].cliente;
				var productMatch = matchesProduct(product, searchedWords);
				if (cliente != undefined) {
					var clientMatch = matchesClient(cliente, searchedWords);

					if (productMatch || clientMatch) {
						// Si el cliente no existe todavía en la lista que estamos creando
						// Lo creamos y le asignamos sus productos (aquellos que matchean),
						// y le asignamos sus correspondientes horarios de apertura y cierre.
						if (!(cliente in clientList)) {
							clientList[cliente] = mergeClientData(cliente, product, allHours, allClients);
							getOpenData(clientList[cliente]);
						}
						clientList[cliente].matchedProducts.push(product);
					}
				}
			});

			for (client in clientList) {
				// We sort alphabetically the product names for each matched client
				clientList[client].matchedProducts = _.sortBy(clientList[client].matchedProducts, [
					function (product) {
						return product.producto;
					}
				]);

				output.push(clientList[client]);
			}

			return splitOpenClosedMatches(output);
		};

		// -----------------//

		document.getElementById('searchterm').blur();

		$scope.noResults = true;

		$scope.clientsShown = [];

		var searchedWords = getWordsToSearch(filter);

		$scope.clientsShown = getMatches(searchedWords);

		if (($scope.clientsShown.open != undefined && $scope.clientsShown.open.length > 0) 
			|| ($scope.clientsShown.openLater != undefined && $scope.clientsShown.openLater.length > 0) 
			|| ($scope.clientsShown.closed != undefined && $scope.clientsShown.closed.length > 0)) {
			$scope.noResults = false;
		}

		// Analytics
		if ($scope.noResults) {
			ga('send', 'pageview', 'search?searchText=' + filter.toLowerCase() + ' (Not Found)');
		} else {
			ga('send', 'pageview', 'search?searchText=' + filter.toLowerCase());
		}
	}

	$scope.logoPressed = function () {
		document.getElementById('searchterm').focus();
	}

	// ------------------ End $scope --------------------- //

	var allProducts; // Gotten from getProductsFromService();
	var allClients; // Gotten from getClientsFromService();
	var allHours;  // Gotten from getHoursFromService();

	function init () {
		fieldBookServiceRequest();
	};

	function fieldBookServiceRequest () {
		var productsLoaded = false;
		var clientsLoaded = false;
		var hoursLoaded = false;

		var allLoadsCompleteCheck = function () {
			if (productsLoaded === false || clientsLoaded === false || hoursLoaded === false) {
				return false;
			}
			return true;
		}
		
		var getProductsFromService = function () {
			$.ajax({
				url: 'https://api.fieldbook.com/v1/59ee6805a7ffd104007a635b/productos',
				headers: {
					'Accept': 'application/json',
					//'Authorization': 'Basic ' + btoa('key-password')
				},
				success: function (productsData) {
					$scope.$apply(function(){
						allProducts = productsData;
						productsLoaded = true;
						$scope.loadComplete = allLoadsCompleteCheck();
					});
				},
				error: function (error) {
					console.log('error', error);
				}
			});
		};

		var getClientsFromService = function () {
			$.ajax({
				url: 'https://api.fieldbook.com/v1/59ee6805a7ffd104007a635b/clientes',
				headers: {
					'Accept': 'application/json',
					//'Authorization': 'Basic ' + btoa('key-password')
				},
				success: function (clientsData) {
					$scope.$apply(function(){
						allClients = clientsData;
						clientsLoaded = true;
						$scope.loadComplete = allLoadsCompleteCheck();
					});
				},
				error: function (error) {
					console.log('error', error);
				}
			});
		};

		var getHoursFromService = function () {
			$.ajax({
				url: 'https://api.fieldbook.com/v1/59ee6805a7ffd104007a635b/horarios',
				headers: {
					'Accept': 'application/json',
					//'Authorization': 'Basic ' + btoa('key-password')
				},
				success: function (hoursData) {
					$scope.$apply(function(){
						allHours = hoursData;
						hoursLoaded = true;
						$scope.loadComplete = allLoadsCompleteCheck();
					});
				},
				error: function (error) {
					console.log('error', error);
				}
			});
		};

		// ---------------- //

		getProductsFromService();
		getClientsFromService();
		getHoursFromService();
	}

	function getOpenData (cliente) {
	    var getDayOfWeek = function () {
	      if (date.getDay() === 0) {
	        return "Domingo";
	      }
	      else if (date.getDay() === 1) {
	        return "Lunes";
	      }
	      else if (date.getDay() === 2) {
	        return "Martes";
	      }
	      else if (date.getDay() === 3) {
	        return "Miercoles";
	      }
	      else if (date.getDay() === 4) {
	        return "Jueves";
	      }
	      else if (date.getDay() === 5) {
	        return "Viernes";
	      }
	      else if (date.getDay() === 6) {
	        return "Sabado";
	      }
	    };

	    var checkTimeRange = function (startHour, startMinutes, endHour, endMinutes) {
	      var checkForMinutes = function() {
	        if (currentHour === startHour) {
	          if (currentMinutes >= startMinutes) {
	            return true;
	          }
	        } else if (currentHour === endHour) {
	          if (currentMinutes < endMinutes) {
	            return true;
	          }
	        } else {
	          return true;
	        }
	      }

	      if (startHour != null && endHour != null) { 
	        if (endHour === startHour) {
	          return true;
	        } else if (endHour < startHour) {
	          if (currentHour >= startHour || currentHour <= endHour)
	          {
	            if(checkForMinutes()) {
	              return true;
	            }
	          }
	        } else { // startHour < endHour
	          if (currentHour >= startHour && currentHour <= endHour) {
	            if(checkForMinutes()) {
	              return true;
	            }
	          }
	        }
	      }

	      return false;
	    };

	    var getNextOpenTime = function (open1, open2, currTime) {
	      if (open2 == undefined) {
	        return open1;
	      } else {
	        var biggestTime;
	        var smallestTime;
	        var biggestHour;
	        var smallestHour;
	        open1hour = Number(open1.split(":")[0]);
	        open2hour = Number(open2.split(":")[0]);

	        if (open1hour > open2hour) {
	          biggestHour = open1hour;
	          biggestTime = open1;
	          smallestHour = open2hour;
	          smallestTime = open2;
	        } else {
	          biggestHour = open2hour;
	          biggestTime = open2;
	          smallestHour = open1hour;
	          smallestTime = open1;
	        }

	        if (currTime < smallestHour)
	          return smallestTime;
	        if (currTime < biggestHour)
	          return biggestTime;
	        if (currTime > biggestHour)
	          return smallestTime;
	      }
	    };

	    //-------------- PRIVATE FUNCTIONS END ----------------//
	    var open = false;

	    var date = new Date();
	    var currentHour = date.getHours();
	    var currentMinutes = date.getMinutes();

	    var nextOpenTime;

	    for (var horario in cliente.hours) {
	      if (getDayOfWeek() === cliente.hours[horario].dia) {
	        if (cliente.hours[horario].abre != undefined && cliente.hours[horario].cierra != undefined) {
	          var openHour = Number(cliente.hours[horario].abre.split(":")[0]);
	          var openMinutes = Number(cliente.hours[horario].abre.split(":")[1]);
	          var closeHour = Number(cliente.hours[horario].cierra.split(":")[0]);
	          var closeMinutes = Number(cliente.hours[horario].cierra.split(":")[1]);

	          open = checkTimeRange(openHour, openMinutes, closeHour, closeMinutes);
	        }

	        if(cliente.hours[horario].vuelveabrir != undefined && cliente.hours[horario].vuelvecerrar != undefined) {
	          openHour = Number(cliente.hours[horario].vuelveabrir.split(":")[0]);
	          openMinutes = Number(cliente.hours[horario].vuelveabrir.split(":")[1]);
	          closeHour = Number(cliente.hours[horario].vuelvecerrar.split(":")[0]);
	          closeMinutes = Number(cliente.hours[horario].vuelvecerrar.split(":")[1]);
	          if (!open) { // If first openHours returned false for open
	            open = checkTimeRange(openHour, openMinutes, closeHour, closeMinutes);
	          }
	        }

	        nextOpenTime = getNextOpenTime(cliente.hours[horario].abre, cliente.hours[horario].vuelveabrir, currentHour);
	        nextOpenHour = nextOpenTime ? nextOpenTime.split(":")[0] : 0;
	      }
	    }

	    cliente.openData = {isOpen: open, openTime: nextOpenTime, openHour: nextOpenHour};
  	}

	init();
}]);