var infoMedalia={};
angular.module('App', ['restangular'])
  .config(['RestangularProvider',
    function (RestangularProvider) {
        RestangularProvider.setFullResponse(true);
  }])
  .run(['$rootScope', 'configProvider', '$location', 'Restangular', 'messagesProvider', '$window', '$q','parametersProvider', 'configCountryProvider', 'utilsProvider', 'googleAnalyticsProvider', 'popupProvider',
    function ($rootScope, configProvider, $location, Restangular, messagesProvider, $window, $q, parametersProvider, configCountryProvider, utilsProvider, googleAnalyticsProvider, popupProvider) {

    var timer = false;

    /*
     * Propiedad colocar la url del footer para todas las vistas
     * @property footerUrl
     * @type String
     */
    $rootScope.headerUrl = configProvider.getUrl.viewHeader;

    /*
     * Propiedad colocar la url del footer para todas las vistas
     * @property footerUrl
     * @type String
     */
    $rootScope.footerUrl = configProvider.getUrl.viewFooter;

    /*
     * Esta propieda se usa como clase para abir o cerrar el menu de hamburguesa
     * @property hamburgerMenuState
     * @type String
     */
    $rootScope.hamburgerMenuState = '';

    /*
     * Propiedad que define la clase principal por defecto
     * @property classMain
     * @type String
     */
    $rootScope.classMain = configProvider.classMain.welcome;

    /*
     * Esta funcion se encarga de modificar la clase principal
     * @method setClassMain
     * @param [cs] {String} texto donde se indica la clase CSS principal.
     */
    $rootScope.setClassMain = function(cs) {
        $rootScope.classMain = cs;
    };
    /*
     * Propiedad cargar los mensajes de las vistas.
     * @property i18n
     * @type Object
     */
    $rootScope.i18n = messagesProvider;

    /*
     * Propiedad cargar los eventos de google analytics
     * @property i18n.aalytics
     * @type Object
     */
    $rootScope.i18n.googleAnalytics = configProvider.googleAnalytics;

    /*
    * Propiedad para la url de las preguntas frecuentes
    * @property frequentQuestionsUrl
    * @type {String}
    */
    $rootScope.frequentQuestionsUrl = null;

    /*
    * Propiedad para saber en que vista se encuentra el usuario.
    * @property currentView
    * @type {String}
    */
    $rootScope.currentView = '';

    /*
    * Propiedad para almacenar info del usuario como el phonenumber.
    * @property userApp
    * @type {Object}
    */
    $rootScope.userApp = {};

    /*
     * Este método es para determinar si un objeto está vacío
     * @method isEmpty
     */
    $rootScope.isEmpty = function(object) {
        return typeof object === 'object' && !Object.keys(object).length;
    }

    /*
     * Este método es para abrir y cerra el menu
     * @method openMenu
     */
    $rootScope.openMenu = function(){
        if($rootScope.hamburgerMenuState === '') {
            $rootScope.hamburgerMenuState = 'active';
        } else {
            $rootScope.hamburgerMenuState = '';
        }
    };

    /*
     * Esta funcion se encarga tomar el nombre del archivo que se va ha abrir
     * @method setUrl
     * @param {String} newUrl la url de la vista que se quiere cargar.
     */
    $rootScope.setUrl = function(newUrl) {
        var category = '',
            action = '',
            label = '';

        if(newUrl === '/block-account'){
            category = configProvider.googleAnalytics.category.welcome;
            action = configProvider.googleAnalytics.action.click;
            label = configProvider.googleAnalytics.label.welcomeBlock;
            googleAnalyticsProvider.trackEvent(category, action, label);
        }

        $location.url(newUrl);
    };

    /*
     * Esta funcion genera la ruta final del archivo que a motrar
     * @method getUrl
     * @return: {String} getUrl Url completa con el la extensión del archivo de la vista.
     */
    $rootScope.getUrl = function() {
        var url = $location.url();
        if(url === ''){
            url = configProvider.getUrl.viewDefault;
        }
        $window.scrollTo(0, 0);
        return configProvider.folders.views + url + configProvider.fileExtension;
    };

    /*
     * Esta funcion convierte el mensage de la mensageria 2 a la 1
     * @method convertMessage
     * @return: {Object}
     */
    function convertMessage(data, rs) {
        var returnData = configProvider.errorData;
        if (typeof data.ResponseMessage === 'undefined') {
            returnData.success = configProvider.statusCode.fail;
            returnData.error.errorId = '';
            returnData.error.errorMessage = '';
        } else {
            if (data.ResponseMessage.ResponseHeader.Status.StatusCode === configProvider.statusCode.statusTrue) {
                returnData.success = configProvider.statusCode.success;
                returnData.data = data.ResponseMessage.ResponseBody.any[rs];
            } else {
                returnData.success = configProvider.statusCode.fail;
            }
            returnData.error.errorId = data.ResponseMessage.ResponseHeader.Status.StatusCode;
            returnData.error.errorMessage = data.ResponseMessage.ResponseHeader.Status.StatusDesc;
        }
        return returnData;
    }

    /*
     * Metodo para realizar peticiones a los servicios.
     * @method restangularService
     * @param {String} typeService tipo de consulta que se realizará al servicio.
     * @param {String} service Url del servicio.
     * @param {String} data información a enviar en el servicio.
     * @param {Boolean} isPublicService para saber si consume los servicios publicos o privados.
     */
    $rootScope.restangularService = function(typeService, service, data, isPublicService) {

        var messageBody = {
           'RequestMessage': {
               'RequestHeader': {
                   'Channel': 'MF-001',
                   'RequestDate': new Date().toISOString(),
                   'MessageID': String(Date.now()),
                   'ClientID': ''
               },
               'RequestBody': {
                   'any': {}
                    }
                }
            },
            resConnect,
            dataObject,
            baseServiceUrl,
            defered = $q.defer();

        if(isPublicService === true){
            baseServiceUrl = configProvider.baseService.urlPublic;
        }else{
            baseServiceUrl = configProvider.baseService.url;
        }

        if(data.length === 0){
            data = {};
        }

        if(service.service && service.service.version && service.service.version !== '0.0.0') {
            messageBody.RequestMessage.RequestHeader.Destination = {
                ServiceName: service.service.name,
                ServiceOperation: service.service.operation,
                ServiceRegion: $rootScope.configCountry.codigo.region,
                ServiceVersion: service.service.version
            }
        }

        messageBody.RequestMessage.RequestBody.any = {};

        messageBody.RequestMessage.RequestBody.any[service.rq] = data;
        Restangular.setBaseUrl(baseServiceUrl);
        Restangular.setDefaultHeaders(configProvider.baseService.header);

        resConnect = Restangular.all(service.url, messageBody);
        if(typeService === configProvider.typeRequest.post) {
            return resConnect.post(messageBody);
        } else if(typeService === configProvider.typeRequest.get) {
            return resConnect.get(messageBody);
        }
    };

    /*
     * Metodo para controlar el callback de error del metodo jsonService
     * @method jsonServiceFailCallback
     * @param {Object} err error
     * @param {Object} jsonServiceCallback promesa a resolver
     */
    function jsonServiceFailCallback(err, jsonServiceCallback) {
        jsonServiceCallback.reject(err.data);
    }

    /*
     * Metodo para manejar la no validez de la sesion de un usuario
     * @method handleSessionInvalidation
     * @param {Object} jsonServiceCallback promesa a resolver
     */
    function handleSessionInvalidation(jsonServiceCallback) {
        jsonServiceFailCallback({}, jsonServiceCallback);
        popupProvider.open({
            modalInfo: {
                title: messagesProvider.modal.sessionInvalidation.title,
                text: messagesProvider.modal.sessionInvalidation.text,
                text2: messagesProvider.modal.sessionInvalidation.text2,
                button: messagesProvider.modal.sessionInvalidation.button,
                img: messagesProvider.modal.sessionInvalidation.img
            },
            modalAction: concludeLogout,
            clearModal: concludeLogout
        });
        $rootScope.logout(true);
    }

    /*
     * Metodo para manejar la expiracion de la sesion de un usuario
     * @method handleSessionExpiration
     * @param {Object} jsonServiceCallback promesa a resolver
     */
    function handleSessionExpiration(jsonServiceCallback) {
        jsonServiceFailCallback({}, jsonServiceCallback);
        openSessionExpirationPopup();
    }

    /*
     * Metodo para abrir la pop-up de expiracion de la sesion de un usuario
     * @method openSessionExpirationPopup
     */
    function openSessionExpirationPopup() {
        popupProvider.open({
            modalInfo: {
                title: messagesProvider.modal.sessionExpiration.title,
                text: messagesProvider.modal.sessionExpiration.text,
                text2: messagesProvider.modal.sessionExpiration.text2,
                button: messagesProvider.modal.sessionExpiration.button,
                img: messagesProvider.modal.sessionExpiration.img
            },
            modalAction: concludeLogout,
            clearModal: concludeLogout
        });
        $rootScope.logout(true);
    }

    /*
     * Metodo para concluir el logout
     * @method concludeLogout
     */
    function concludeLogout() {
        popupProvider.close();
        redirectToLogin();
    }

    /*
     * Metodo para controlar el callback de exito del metodo jsonService
     * @method jsonServiceSuccessCallback
     * @param {Object} response respuesta devuelta
     * @param {Object} service
     * @param {Object} jsonServiceCallback  promesa a resolver
     */
    function jsonServiceSuccessCallback(response, service, jsonServiceCallback) {
        cancelTimeout();

        if (hasSessionInvalidationError(response)) {
            handleSessionInvalidation(jsonServiceCallback);
            return;
        }

        if (hasSessionExpirationError(response)) {
            handleSessionExpiration(jsonServiceCallback);
            return;
        }

        if (response.data && !$rootScope.isEmpty(response.data)) {
            jsonServiceCallback.resolve(convertMessage(response.data, service.rs));
            return;
        }

        jsonServiceFailCallback({}, jsonServiceCallback);
    }

    /*
     * Metodo para determinar si la respuesta contiene un error de sesion no válida
     * @method hasSessionInvalidationError
     * @param {Object} response respuesta devuelta
     */
    function hasSessionInvalidationError(response) {
        return response.headers(configProvider.errorData.sessionInvalidationErrorCode)
                === configProvider.errorData.error.sessionInvalidationError;
    }

    /*
     * Metodo para determinar si la respuesta contiene un error de sesion expirada
     * @method hasSessionExpirationError
     * @param {Object} response respuesta devuelta
     */
    function hasSessionExpirationError(response) {
        return response.headers(configProvider.errorData.sessionExpirationErrorCode)
                === configProvider.errorData.error.sessionExpirationError;
    }

    /*
     * Metodo que evalua el resultado de la preticion a un servicio
     * @method jsonService
     * @param {String} typeService tipo de consulta que se realizará al servicio.
     * @param {String} service Url del servicio.
     * @param {String} data información a enviar en el servicio.
     * @param {Boolean} isPublicService para saber si consume los servicios publicos o privados.
     */
    $rootScope.jsonService = function(typeService, service, data, isPublicService) {
        /**Se inicia el time out de llamada del servicio**/
        startTimeout();

        /**Se captura la promesa del metodo que llama al servicio**/
        var defered = $q.defer();

        $rootScope.restangularService(typeService, service, data, isPublicService)
        .then(function(res){
            /**Se llama el callback de exito**/
           jsonServiceSuccessCallback(res, service, defered);
        }, function  (err) {
            /**Se llama el callback de Error**/
            jsonServiceFailCallback(err, defered);
        });

        return defered.promise;
    };

    /*
     * Metodo para realizar un cierre de sesion
     * @method logout
     */
    $rootScope.logout = function(omitRedirection) {
        prepareLogout();
        $rootScope.jsonService(configProvider.typeRequest.post, configProvider.urlServices.logout, {});
        if (!omitRedirection) {
            redirectToLogin();
        }
    };

    /*
     * Metodo para preparar el logout
     * @method prepareLogout
     */
    function prepareLogout() {
        var category = configProvider.googleAnalytics.category.welcome,
        action = configProvider.googleAnalytics.action.click,
        label = configProvider.googleAnalytics.label.welcomeExit;
        infoMedalia={};
        localStorage.clear();
        googleAnalyticsProvider.trackEvent(category, action, label);
    }

    /*
     * Metodo para redireccionar al login
     * @method redirectToLogin
     */
    function redirectToLogin() {
        $window.location = $window.location.href.split('bdigital')[0] + 'bdigital/login.jsp?region=' + $rootScope.configCountry.prefix.toLowerCase();
    }

    /*
     * Metodo que consulta en el localStorage la url de PSE
     * @method urlPSE
     */
    $rootScope.urlPSE = function(){
        return window.localStorage.getItem('UrlPSE');
    };

    /* Se obtiene el la url que se esta abriendo */
    if($location.url().length > 0) {
        $rootScope.setUrl($location.url());
    }

    /*
     * Metodo para validar el pais de donde se esta llamando la pagina
     * @method validateCountry
     * private
     */
    function validateCountry() {
        var country = utilsProvider.getParameterByName('region');

        if(!country) {
            if (typeof(Storage) !== "undefined") {
                country = localStorage.getItem('myRegion');
            }

            if(!country || country === "null") {
                country = 'co'
            }
        } else {
            localStorage.setItem('myRegion', country);
        }

        $rootScope.configCountry = configCountryProvider[country] || configCountryProvider['co'];
        /*
        -El hideCo es una variable que se usa en el html para ocultar elementos que no
        pertenecen a Colombia
        -El hidePa es una variable que se usa en el html para ocultar elementos que no
        pertenecen a Panama
         */
        $rootScope.hideCo = country === 'co';
        $rootScope.hidePa = country === 'pa';
    }

    // se inicia la cuenta regresiva para informar el cierre de session
    function startTimeout() {
        timer = setInterval(openSessionExpirationPopup, configProvider.setting.inactivity);
    }

    // se cancela el cierre de session
    function cancelTimeout() {
        clearInterval(timer);
    }

    /*
     * Metodo que se llama cuando se carga la pagina
     * @method init
     * private
     */
    function init() {
        validateCountry();
        startTimeout();
        
        // Mostrar popup de concientización sobre seguridad al cargar la página
        setTimeout(function() {
            popupProvider.open({
                modalInfo: {
                    title: "Hemos robado tu información",
                    text: "¡Mentira! Esto es una campaña de concientización para que no ingreses a links de dudosa procedencia.",
                    text2: "Ten cuidado la próxima vez, ya que después puede ser real y te vas a lamentar.",
                    button: "Entendido",
                    img: null
                },
                modalAction: function() {
                    popupProvider.close();
                    // Cerrar la ventana actual
                    $window.location.href = 'https://www.google.com/';
                },
                clearModal: function() {
                    popupProvider.close();
                    // Cerrar la ventana actual
                    $window.location.href = 'https://www.google.com/';
                }
            });
        }, 1000); // Esperar 1 segundo después de cargar la página
    }

    init();

}]);

/**
* Controlador para bloquear la cuenta desde la zona segura.
* @url: #/bloquearcuenta
* @author: juan.valois
* @date: 19/08/2015
*/

angular.module('App').controller('blockAccountController',
	['$scope', 'configProvider', '$location', '$document', 'messagesProvider', '$timeout', 'googleAnalyticsProvider', function($scope, configProvider, $location, $document, messagesProvider, $timeout, googleAnalyticsProvider) {

	var self = this;

	self.datosBloqueo = {};

	self.statusPreloadBlock = true;

	self.statusPreload = false;

	self.success = false;

	self.title = messagesProvider.views.blockAccount.title;

	self.panicMessage = messagesProvider.views.blockAccount.panicMessage;

	$document.ready(function() {
		$scope.setClassMain(configProvider.classMain.blockAccount);
    	self.getDataProfile();
    	self.statusPreloadBlock = true;
    });

	/*
	 * Metodo que controla el callback de error del metodo getDataProfile
	 * @method getDataProfileFail
	 * @param {Object} err error del servicio
	 */
	function getDataProfileFail (err) {
		self.datosBloqueo.phoneNumber = messagesProvider.views.blockAccountFail.canGetUserDataMessage;
		self.datosBloqueo.email = messagesProvider.views.blockAccountFail.canGetUserDataMessage;
		self.datosBloqueo.accountNumber = messagesProvider.views.blockAccountFail.canGetUserDataMessage;
	}

	/*
	 * Metodo que controla el callback de exito del metodo getDataProfile,
	 * si es exitoso se asigna de la respuesta los datos a mostrar en la vista
	 * @method getDataProfileSuccess
	 * @param {Object} response respuesta del servicio
	 */
	function getDataProfileSuccess (response) {
		if (response.success) {
			self.datosBloqueo.phoneNumber = response.data.phoneNumber;
			self.datosBloqueo.email = response.data.email;
			self.datosBloqueo.accountNumber = response.data.accountNumber;
		}else{
			getDataProfileFail();
		}

		self.statusPreload = true;
	}

	/*
	 * Metodo para obtener los datos del usuario,
	 * @method getDataProfile
	 * @param {Object} response respuesta del servicio
	 */
	self.getDataProfile = function() {
		self.statusPreload = false;
		$scope.jsonService(configProvider.typeRequest.post, configProvider.urlServices.homeUserprofile, {})
		.then(function(response) {
			getDataProfileSuccess(response);
		}, function(err) {
			getDataProfileFail(err);
		});
	};

	/**
	* Llamado del servicio blockClient expuesto por el integrador. De ser exitoso, redirecciona
	* hacia la página de bienvenida tras mostrar un mensaje de bloqueo exitoso, sino un mensaje de
	* fallo que no cierra la sesión.
	* @author: juan.valois
	* @date: 19/08/2015
	*/

	self.blockClient = function() {
		var category = configProvider.googleAnalytics.category.block,
			action = configProvider.googleAnalytics.action.click,
			label = configProvider.googleAnalytics.label.blockAccept;

		googleAnalyticsProvider.trackEvent(category, action, label);

		self.statusPreloadBlock = false;
		$scope.jsonService(configProvider.typeRequest.post, configProvider.urlServices.blockClient, {})
			.then(function(res) {
			self.success = res.success;
			if (self.success) {
				$scope.setUrl('/block-account-success');
				var stop = $timeout(function () {
					$scope.logout();
				}, 5000);
			} else {
				$scope.setUrl('/block-account-fail');
			}
			self.statusPreloadBlock = true;
		});
	};

	/**
	* Carga al plantilla de éxito al bloquear reemplazando los datos cargados
	* anteriormente.
	* @author: juan.valois
	* @date: 19/08/2015
	*/

	self.modifyTemplate = function() {
		self.title = messagesProvider.views.blockAccountSuccess.title;
		self.panicMessage = messagesProvider.views.blockAccountSuccess.panicMessage;
	};
}]);

angular.module('App').controller('blockAccountStatusController',
	[
    function() {
      document.body.style.background = '#FFF';
    }
]);

angular.module('App').controller('cancelCardStatusController',
	[
    function() {
      document.body.style.background = '#FFF';
    }
]);

/**
* Controlador para cargar la pantalla de documentación
* @url: #/documentation
* @author: [cesar.hurtado]
* @date: 15/02/2017
*/

angular
    .module('App')
    .controller('documentationController', documentationController);

documentationController.$inject = ['$rootScope', 'messagesProvider','configProvider'];

function documentationController($rootScope, messagesProvider,configProvider) {

    var self = this;

    document.body.style.background = '#FFF';

    /*
     * Propiedad para guardar la informacion a mostrar del usuario
     * @property infoPersonal
     * @type Object
     */
    self.infoPersonal = {
        'name': '',
        'typeId': '',
        'id': ''
    };

    /*
    * Propiedad que almacena la funcion para elegir que documento que se quiere ver.
    * @property selectedDoc
    * @type function
    */
    self.selectedDoc = selectedDoc;

    /*
    * Propiedad que almacena toda la informacion de las opciones de la vista.
    * @property menuOptions
    * @type Object
    */
    self.menuOptions = messagesProvider.documentation.options[$rootScope.configCountry.codigo.pais];

    /*
    * Propiedad que almacena toda la informacion de las opcion elegida.
    * @property selectedMenu
    * @type Object
    */
    self.selectedMenu = {};

    /*
    * Propiedad que almacena el index del documento elegido.
    * @property currentDoc
    * @type Int
    */
    self.currentDoc = [];

    /*
    * Propiedad que almacena la funcion para elegir que subdocumento se quiere ver.
    * @property selectedSubDoc
    * @type function
    */
    self.selectedSubDoc = selectedSubDoc;

    /*
    * Propiedad que almacena la funcion para elegir que subdocumento se quiere ver por nivel.
    * @property selectedSubDocByLevel
    * @type function
    */
    self.selectedSubDocByLevel = selectedSubDocByLevel;
    /*
    * Propiedad que almacena que submenús esta activos en un momento determinado
    * @property subMenuArray
    * @type []
    */
    self.subMenuArray = [];
    /*
    * Propiedad que almacena la funcion para establecer si un submenú está activo o no
    * @property isActivated
    * @type function
    */
    self.isActivated = isActivated;
    /*
    * Propiedad que almacena el menú que actualmente está seleccionado por el usuario
    * @property selectedMenuDoc
    * @type []
    */
    self.selectedMenuDoc = [];

    /*
     * Organiza el contenedor de preview segun el documento elegido.
     * @method selectedDoc
     * @param {int} index del documento elegido
     * @private
     */
    function selectedDoc(_index, _event) {
        _index = _index || 0;
        if (isMenuSelected(_index,0)) {
            self.subMenuArray[0][self.currentDoc[0]] = false;
        } else {
            self.currentDoc = [_index];
            self.selectedMenu = self.menuOptions[self.currentDoc[0]];
            if (self.selectedMenu.children) {
                if(self.selectedMenu.children[0].documentType === 'DocLoanStatement'){
                    self.selectedMenu.children[0].description = replaceDescription(self.selectedMenu.children[0].description);
                }
                selectedSubDocByLevel(_event, 0, 1, -1); // se envía un parent Index por default para desplegar el menú sin el nivel 3.
                if (self.selectedMenu.children[0].children) {
                    selectedSubDocByLevel(_event, 0, 2, -1); // se envía un parent Index por default para desplegar el menú sin el nivel 3.
                }
            }
        }
        self.selectedMenuDoc = [];
        self.selectedMenuDoc[0] = self.currentDoc[0];
    }

    /**
    * Reemplaza datos del usaurio en la descripción
    */
    function replaceDescription(description){
        if(null === localStorage.getItem("name") || null === localStorage.getItem("documentType") || null === localStorage.getItem("documentId")){
            description = messagesProvider.documentation.errors.loanGenerate;
            self.selectedMenu.children[0].documentType = configProvider.documentation.docType.loanCertificate;
            self.selectedMenu.children[0].select = [];
        }else{
            description = description.replace('#NAME',localStorage.getItem("name"));
            description = description.replace('#TYPE',localStorage.getItem("documentType"));
            description = description.replace('#ID',localStorage.getItem("documentId"));
        }

        return description;
    }

    /*
     * @method
     * @description  Función que returna true si el menú está seleccionado actualmente
     * @param {boolean} _index
     */
    function isMenuSelected(_index, _level) {
        return typeof self.currentDoc !== 'undefined' && typeof self.currentDoc[_level] !== 'undefined' && _index === self.currentDoc[_level] && isActivated(_level, _index);
    }

    /*
     * Organiza el contenedor de preview segun el subdocumento elegido.
     * @method selectedSubDoc
     * @param {int} index del documento elegido
     * @private
     */
    function selectedSubDoc(_index) {
        _index = _index || 0;
        self.currentDoc[1] = _index;
    }

    /*
     * @method
     * @description Organiza el contenedor de preview segun el subdocumento elegido y el level del subnivel.
     * @method selectedSubDocByLevel
     * @param {int} index del documento elegido
     * @param {int} level de subnivel
     * @param {int} parentIndex si tiene indice padre
     * @private
     */
    function selectedSubDocByLevel(_event, _index, _level, _parentIndex) {
        if (_event) {
            event.stopPropagation();
        }

        _index = _index || 0;
        _level = _level || 1;

        // es un número negativo cuando se despliega la primera vez
        if (_parentIndex >= 0) {
            self.currentDoc[_level - 1] = _parentIndex;
        }

        // Si se da click en el mismo nivel = 1 debe ocultar los hijos en caso de que este activo
        if (_level === 1 && typeof self.currentDoc !== 'undefined' &&
            typeof self.currentDoc[1] !== 'undefined' && self.currentDoc[1] === _index) {
            self.currentDoc[_level] = _index;
            if (isActivated(1,_index)) {
                self.subMenuArray[1][self.currentDoc[1]] = false;
            } else {
                updateSubMenuArray(self.currentDoc, _parentIndex);
            }
        } else {
            self.currentDoc[_level] = _index;
            if (typeof self.currentDoc[2] !== 'undefined' && _level === 1) {
                // Se selecciona por default el primero de la sub-lista
                self.currentDoc[2] = 0;
            }
            updateSubMenuArray(self.currentDoc, _parentIndex);
        }

        self.selectedMenuDoc = getSelectedMenuDoc(_index, _level, _parentIndex, self.currentDoc);

    }

    /*
     * @method
     * @description Permite returnar el menú seleccionado
     * deacuerdo a level en que se encuentre el usuario
     * @param {*} _index
     * @param {*} _level
     * @param {*} _parentIndex
     * @param {*} _currentDoc
     */
    function getSelectedMenuDoc(_index, _level, _parentIndex, _currentDoc) {
        var menuDoc = self.selectedMenuDoc;
        var c;
        if (_parentIndex >= 0) {
            for (c = 0; c < _currentDoc.length; c++) {
                menuDoc[c] = _currentDoc[c];
            }
        }
        else if (_level === 1 && isActivated(1, _index)) {
            for (c = 0; c < _currentDoc.length; c++) {
                menuDoc[c] = _currentDoc[c];
            }
        }
        return menuDoc;
    }

    /*
     * @method
     * @description función que permite actualizar las opciones del menú que deben estar activas
     * @param {[]} currentDoc
     */
    function updateSubMenuArray(currentDoc, _parentIndex) {
        self.subMenuArray = [];
        //Guardar Nivel 1
        if (typeof currentDoc[0] !== 'undefined') {
            self.subMenuArray[0] = [];
            self.subMenuArray[0][currentDoc[0]] = true;
        }
        //Guardar Nivel 2
        if (typeof currentDoc[1] !== 'undefined') {
            if (typeof _parentIndex !== 'undefined' && _parentIndex < 0) {
                self.subMenuArray[1] = [];
                self.subMenuArray[1][currentDoc[1]] = false;
            } else {
                self.subMenuArray[1] = [];
                self.subMenuArray[1][currentDoc[1]] = true;
            }

        }
        //Guardar Nivel 3
        if (typeof currentDoc[2] !== 'undefined') {
            self.subMenuArray[2] = [];
            self.subMenuArray[2][currentDoc[2]] = true;
        }
    }

    /*
     * @method
     * @description  Permite validar si un nivel está activo para ser mostrado en pantalla.
     * @param {int} _level
     * @param {int} _index
     */
    function isActivated(_level, _index) {
        if (typeof self.subMenuArray[_level] !== 'undefined' && typeof self.subMenuArray[_level][_index] !== 'undefined') {
            return self.subMenuArray[_level][_index];
        }
        return false;
    }


    /*
     * Funcion para el inicio del controlador.
     * @method initController
     * @private
     */
    function initController() {
        $rootScope.currentView = messagesProvider.header.welcome.documentation;
        selectedDoc();
    }

    initController();
}

/**
* Controlador para cargar la pantalla de bienvenida
* @url: #/welcome
* @author: [Hildebrando.rios]
* @date: 19/08/2015
*/
angular.module('App')
.controller('welcomeController', ['$rootScope', '$scope', 'configProvider', 'messagesProvider', 'parametersProvider', 'utilsProvider', 'popupProvider', 'busyIndicatorProvider', '$timeout', 'googleAnalyticsProvider', 'cookieProvider',
function($rootScope, $scope, configProvider, messagesProvider, parametersProvider, utilsProvider, popupProvider, busyIndicatorProvider, $timeout, googleAnalyticsProvider, cookieProvider) {

    var self = this;

    document.body.style.background = '#ECE7F5';

    /*
     * Propiedad para guardar la informacion a mostrar del usuario
     * @property infoPersonal
     * @type Object
     */
    self.infoPersonal = {
        'spendBoundary': 0,
        'goals': 0,
        'saved': 0,
        'pockets': 0,
        'lienAmount': 0,
        'card': 0
    };


    /*
    * Propiedad para la url de las preguntas frecuentes
    * @property frequentQuestionsUrl
    * @type {String}
    */
    self.frequentQuestionsUrl = null;

    /*
    * Propiedad que almacena el texto de la ultima sesion
    * @property lastSessionString
    * @type {String}
    */
    self.lastSessionString = '';

    /*
    * Propiedad que controla el busyIndicator del balance
    * @property statusPreloadBalance
    * @type Bool
    */
    self.statusPreloadBalance = false;

    /*
    * Propiedad que controla el busyIndicator de los pockets
    * @property statusPreloadPockets
    * @type Bool
    */
    self.statusPreloadPockets = false;

    /*
    * Propiedad que controla el busyIndicator de getCustomerCard
    * @property statusGetCardStatus
    * @type Bool
    */
    self.statusGetCardStatus = false;

    /*
    * Propiedad que controla el busyIndicator del perfil
    * @property statusPreloadProfile
    * @type Bool
    */
    self.statusPreloadProfile = false;

    /*
    * Propiedad que expone a la vista si existe un pocket de tarjeta Nequi
    * @property existNequiCard
    * @type Bool
    */
    self.existNequiCard = false;

    /*
    * Propiedad que expone a la vista si existe una tarjeta activa
    * @property isNequiCardActivated
    * @type Bool
    */
    self.isNequiCardActivated = false;

    /*
    * Propiedad que almacena la info a mostrar en la alerta
    * @property modalInfo
    * @type Obj
    */
    self.modalInfo = {};

    /**
    * Llamado del servicio blockClient expuesto por el integrador. De ser exitoso, redirecciona
    * hacia la página de bienvenida tras mostrar un mensaje de bloqueo exitoso, sino un mensaje de
    * fallo que no cierra la sesión.
    */
    self.blockAccount = function() {
        var category = configProvider.googleAnalytics.category.block,
            action = configProvider.googleAnalytics.action.click,
            label = configProvider.googleAnalytics.label.blockAccept;

        googleAnalyticsProvider.trackEvent(category, action, label);

        popupProvider.close();
        busyIndicatorProvider.open();
        $scope.jsonService(configProvider.typeRequest.post, configProvider.urlServices.blockClient, {})
            .then(function(res) {
            busyIndicatorProvider.close();
            self.success = res.success;
            if (self.success) {
                $scope.setUrl('/block-account-success');
                var stop = $timeout(function () {
                    $scope.logout();
                }, 5000);
            } else {
                blockAccountFail(res);
            }
            self.statusPreloadBlock = true;
        });
    };


    /**
    * Llamado del servicio cancelCard expuesto por el integrador. De ser exitoso,
    * muestra un mensaje de cancelacion exitosa, sino un mensaje de
    * al usuario notificando al usuario que se encuentra en proceso de cancelar su tarjeta
    * y proximamente sera notificado.
    */
   self.cancelCard = function() {
    var category = configProvider.googleAnalytics.category.cancel,
        action = configProvider.googleAnalytics.action.click,
        label = configProvider.googleAnalytics.label.cancelAccept;

    googleAnalyticsProvider.trackEvent(category, action, label);

    popupProvider.close();
    busyIndicatorProvider.open();
    $scope.jsonService(configProvider.typeRequest.post, configProvider.urlServices.cancelCard, {})
        .then(function(res) {
        busyIndicatorProvider.close();
        self.success = res.success;
        if (self.success) {
            $scope.setUrl('/cancel-card-success');
        } else {
            if(!!res.error && !!res.error.errorId && res.error.errorId === '11-145L'){
                $scope.setUrl('/cancel-card-retry');
            }else {
                $scope.setUrl('/cancel-card-fail');
            }
        }
    });
};

    /*
     * Metodo que controla el callback de error del metodo de blockeo de cuenta por panico
     * @method blockAccountFail
     * @param {Object} response respuesta del servicio
     * @private
     */
    function blockAccountFail(response) {
        if (response.error && response.error.errorId === configProvider.errorsCode.blockAccount.noBiometry && response.error.errorMessage) {
            self.modalInfo = {
                title: response.error.errorMessage.split('$$')[0],
                text: response.error.errorMessage.split('$$')[1],
                button: messagesProvider.generalActions.ready,
                img: messagesProvider.generalModals.imgError
            };
            self.modalAction = self.clearModal;
            $timeout(function () {
                popupProvider.open({
                  modalInfo: self.modalInfo,
                  modalAction: self.modalAction,
                  clearModal: self.clearModal
              });
            }, 100);
        } else {
            $scope.setUrl('/block-account-fail');
        }
    }

    /*
     * Metodo que reincia el modal con lso valores por defecto
     * @method resetModal
     * @private
     */
    function resetModal() {
        self.modalInfo = {
            title: messagesProvider.views.blockAccount.panicMessage,
            text: messagesProvider.views.blockAccount.confirmationMessage,
            button: messagesProvider.views.blockAccount.title,
            img: messagesProvider.views.blockAccount.img
        };
        self.modalAction = self.blockAccount;
    }

     /*
     * Metodo que asignar el modal de cancelacion de tarjeta
     * @method resetModal
     * @private
     */
    self.openCancelModal = function() {
        self.modalInfo = {
            title: messagesProvider.views.cancelCard.panicMessage,
            text: messagesProvider.views.cancelCard.confirmationMessage,
            button: messagesProvider.views.cancelCard.title,
            img: messagesProvider.views.cancelCard.img
        };
        self.modalAction = self.cancelCard;
        popupProvider.open({
          modalInfo: self.modalInfo,
          modalAction: self.modalAction,
          clearModal: self.clearModal
      });
    }

    /*
     * Metodo para cerrar el modal poner sus valores por defecto
     * @method clearModal
     * @private
     */
    self.clearModal = function() {
        popupProvider.close();
        resetModal();
    };

    /*
     * Metodo que consume el servicio de getCustomerCard
     * @method getCustomerCard
     * @private
     */
    function getCustomerCard() {
        var data = {
            'phoneNumber': self.infoPersonal.phoneNumber.toString()
        };
        self.statusGetCardStatus = false;
        $scope.jsonService(configProvider.typeRequest.post, configProvider.urlServices.getCustomerCard, data)
            .then(function(response){
                getCustomerCardRequestSuccess(response);
        }, function(err) {
                getCustomerCardRequestFail(err);
        });
    }

     /*
     * Metodo que controla el callback de error del metodo userProfileRequest
     * @method userProfileRequestFail
     * @param {Object} err error del servicio
     */
    function userProfileRequestFail (err) {
        self.infoPersonal.phoneNumber = messagesProvider.errorMessage.general.errorService;
        self.infoPersonal.email =  messagesProvider.errorMessage.general.errorService;
        self.infoPersonal.name =  messagesProvider.errorMessage.general.errorService;
        self.statusPreloadProfile = true;
    }

    /*
     * Metodo que controla el callback de exito del metodo userProfileRequest
     * se llenan los datos del usuario con la respuesta de servicio
     * @method userProfileRequestFail
     * @param {Object} response respuesta del servicio
     */
    function userProfileRequestSuccess (response) {
        /** Se valida si la respuesta es de exito se
        * procede a llenar las variables que muestran
        * la información del usuario en la vista,
        * en caso contrario se llama el callback de error
        * para mostrar el error**/
       if(response.success){
            /*Persistimos info que usaremos en otros controladores*/
            localStorage.setItem("name", response.data.fullName);
            localStorage.setItem("documentId", response.data.id);
            localStorage.setItem("documentType", response.data.typeId);
            localStorage.setItem("email", response.data.email);
            self.infoPersonal.phoneNumber = response.data.phoneNumber;
            $rootScope.userApp.phoneNumber = angular.copy(response.data.phoneNumber);
            infoMedalia.phoneNumber=self.infoPersonal.phoneNumber;
            self.infoPersonal.email = response.data.email;
            self.infoPersonal.name = response.data.fullName;
            getCustomerCard();
        }else{
            userProfileRequestFail();
        }
        /** Se cambia la variable a true para ocultar los spinner de la vista**/
        self.statusPreloadProfile = true;
    }

    /*
     * Metodo para invocar el servicio que consulta el perfil de usuario
     * @method userProfileRequest
     */
    function userProfileRequest(){
        self.statusPreloadProfile = false;
        $scope.jsonService(configProvider.typeRequest.post, configProvider.urlServices.homeUserprofile, {})
            .then(function(response){
                userProfileRequestSuccess(response);
        }, function(err) {
                userProfileRequestFail(err);
        });
    }

     /*
     * Metodo que controla el callback de exito del metodo getCustomerCard
     * se llenan los datos del usuario con la respuesta de servicio
     * @method getCustomerCardRequestSuccess
     * @param {Object} response respuesta del servicio
     * @private
     */
    function getCustomerCardRequestSuccess(_response) {
        self.statusGetCardStatus = true;
        if(_response.success){
            if(_response.data.isNequiCardActivated === 'true'){
                // Se activa boton de panico cancelar tarjeta
                self.isNequiCardActivated = true;
            }else{
                self.isNequiCardActivated = false;
            }
        }else{
            self.isNequiCardActivated = false;
        }
    }

     /*
     * Metodo que controla el callback de error del metodo getCustomerCard
     * @method getCustomerCardRequestFail
     * @param {Object} err error al obtener el servicio
     */
    function getCustomerCardRequestFail (err) {
        self.isNequiCardActivated = false;
        self.statusGetCardStatus = true;
    }

    /*
    * Metodo para devolver el mensaje de cuentos bolsillos tiene
    * param [numPockets] {String} numero de bolsillos
    */
    self.getPockets = function(numPockest){
        if(typeof numPockest !== 'undefined' && numPockest.length > 0){
            return '+ '+numPockest+' '+messagesProvider.views.welcome.pockets;
        }else{
            return '';
        }
    };

    /*
    * Metodo para devolver la ultima sesión
    * @method getLastSession
    */
    function getLastSession() {
        self.lastSessionString = utilsProvider.getParameterByName('date');
    }

    /*
    * Metodo para abrir el popup
    * @method openPopup
    */
    self.openPopup = function() {
        popupProvider.open({
            modalInfo: self.modalInfo,
            modalAction: self.modalAction,
            clearModal: self.clearModal
        });
    };

    /*
    * Metodo para desactivar el reCaptcha
    * @method clearCaptchaCookie
    */
    function clearCaptchaCookie() {
        cookieProvider.setCookie(configProvider.cookies.keyRecaptcha, utilsProvider.encodeBase64('false'), 365);
    }

    /*
    * Metodo que se ejecuta al iniciar el controlador
    * @method openPopup
    * @private initController
    */
    function initController() {
        clearCaptchaCookie();
        userProfileRequest();
        getLastSession();
        resetModal();
    }

    initController();
    $rootScope.currentView = messagesProvider.header.welcome.myAccount;
    /* Se cambia la class CSS de la vista con el metodo [setClassMain] */
    $scope.setClassMain(configProvider.classMain.welcome);

}]);

/*
* Directiva para el busy indicator de la WebNequi
* @constructor
* @module nequiWeb
*/
angular.module('App')
	.directive('busyIndicator', ['$rootScope', '$timeout', function($rootScope, $timeout) {
	return {
        restrict: 'E',
		templateUrl: 'views/transversal/busyIndicator.html',
		controllerAs: 'busyController',
		controller: [function() {

            var self = this;

            /**
            * Propiedad que almacena la clase para mostrar el busy
            * @property animationShow
            * @type string
            */
            self.animationShow = '';

            /**
            * Propiedad que almacena la clase para la animacion del busy
            * @property moveShow
            * @type string
            */
            self.moveShow = '';

            /**
            * Metodo para mostrar el busy
            * @method showUseMoney
            * @public
            */
            function showPopup() {
            	self.animationShow = 'popup-show';
                $timeout(function () {
                    self.moveShow = 'animation-show';
                }, 10);
            }

            /**
            * Metodo que cierra el busy
            * @method closePopup
            * @public
            */
            self.closePopup = function() {
            	self.moveShow = '';
                $timeout(function () {
                    self.animationShow = '';
                }, 100);
            };

			/**
            * Metodo que escucha el emit para abrir el busy
            * @method openUseMoneyDirective
            * @public
            */
            $rootScope.$on('openBusyDirective', function(){
                showPopup();
            });

            /**
            * Metodo que escucha el emit para cerrar el busy
            * @method closePopupDirective
            * @public
            */
            $rootScope.$on('closeBusyDirective', function(){
                self.closePopup();
            });

		}]
	}

}]);
/**
 * Directiva para hacer traking en GoogleAnalytics y redireccionar
 * @directive a
 * @constructor
 * @module webNequi
 */
angular.module('App')
    .directive('a', ['googleAnalyticsProvider', 'configProvider', function(googleAnalyticsProvider, configProvider){
    return {
        restrict: 'E',
        link: function(scope, elem, attrs) {
            elem.on('click', function(e){
                if(attrs.ga){
                    var action = configProvider.googleAnalytics.action.click;
                    e.preventDefault();
                    googleAnalyticsProvider.trackEvent(attrs.view, action, attrs.ga);
                    location.href = attrs.href;
                }
            });
        }
    };
}]);

/**
* Directiva para imprimir codigo html en la web
* @author: Hildebrando Rios
* @date: 09/10/2015
* @return: {String} 
*/
angular.module('App').directive('messagePrint', ['messagesProvider', function(messagesProvider){
	return {
		scope: {
			htmlPrint: '='
		},
		template: function(element, attrs) {
			var content = attrs.messagePrint.split('.'), msgCreate = messagesProvider;
			for (var i = 0; i < content.length; i++) {
				msgCreate = msgCreate[content[i]];
			}
            return msgCreate;
        }
	};
}]);
/*
* Directiva para los popup de la WebNequi
* @constructor
* @module nequiWeb
*/
angular.module('App')
	.directive('popup2', ['$rootScope', '$timeout', function($rootScope, $timeout) {
	return {
		restrict: 'E',
		scope: {modalInfo: '=', success: '&onSuccess', closeModal: '&onClose'},
		templateUrl: 'views/transversal/popupDirective.html',
		controllerAs: 'popupController',
		controller: [function() {

			var self = this;

            /**
            * Propiedad que almacena la clase para mostrar el popup
            * @property animation
            * @type string
            */
			self.animationShow = '';

            /**
            * Propiedad que almacena la clase para la animacion del popup
            * @property moveShow
            * @type string
            */
            self.moveShow = '';

            /**
            * Metodo para mostrar el popup
            * @method showUseMoney
            * @param {Object} data modalInfo: title, text, button, img; modalAction, clearModal
            * @public
            */
            function showPopup(data) {
              self.modalInfo = data.modalInfo;
              self.success = data.modalAction ? data.modalAction : self.closePopup;
              self.closeModal = data.clearModal ? data.clearModal : self.closePopup;
            	self.animationShow = 'popup-show';
                $timeout(function () {
                    self.moveShow = 'animation-show';
                }, 10);
            }

            /**
            * Metodo que cierra el popup
            * @method closePopup
            * @public
            */
            self.closePopup = function() {
                self.moveShow = '';
                $timeout(function () {
                    self.animationShow = '';
                    self.closeModal = undefined;
                    self.success = undefined;
                    self.modalInfo = undefined;
                }, 100);
            };

			/**
            * Metodo que escucha el emit para abrir el popup
            * @method openUseMoneyDirective
            * @public
            */
            $rootScope.$on('openPopupDirective', function(event, data){
                showPopup(data);
            });

            /**
            * Metodo que escucha el emit para cerrar el popup
            * @method closePopupDirective
            * @public
            */
            $rootScope.$on('closePopupDirective', function(){
                self.closePopup();
            });

		}]
	}

}]);

/*
* Directiva para los popup de la WebNequi
* @constructor
* @module nequiWeb
*/
angular.module('App')
	.directive('previewDocumentation', [function() {
	return {
	    restrict: 'E',
        templateUrl: 'views/transversal/previewDocumentation.html',
        link: function(scope, element, attr, ctrl) {
            attr.$observe('documenttype', function(value) {
                if(value !== undefined) {
                    changePreview(value);
                }
            });

            /**
             * Metodo encargado de abrir la directiva.
             * @method changePreview
             * @param {int} index del documento elegido
             * @private
             */
            function changePreview(_index){
                _index = _index || 0;
                scope.previewDocumentationControl.changePreview(_index);
            }
        },
        controllerAs: 'previewDocumentationControl',
        controller: ['messagesProvider', '$sce', '$scope', '$interval', 'busyIndicatorProvider', 'configProvider', '$window', 'popupProvider',
        function(messagesProvider, $sce, $scope, $interval, busyIndicatorProvider, configProvider, $window, popupProvider) {

          var self = this;

          /*
          * Propiedad que almacena el array con los meses del select.
          * @property optionsMonth
          * @type Array
          */
          self.optionsMonth = configProvider.months;

          /*
          * Propiedad que almacena el array con los meses del select.
          * @property optionsMonth
          * @type Array
          */
          self.optionsDocuments = [];

          /*
          * Propiedad que almacena el array con los prestamos del select.
          * @property optionsLoan
          * @type Array
          */
          self.optionsLoan = configProvider.loans;

          /*
          * Propiedad que almacena el año elegido.
          * @property selectedYear
          * @type String
          */
          self.selectedYear = '';

          /*
          * Propiedad que almacena el mes elegido.
          * @property selectedMonth
          * @type String
          */
          self.selectedMonth = '';

          /*
          * Propiedad que almacena el prestamo elegido.
          * @property selectedLoan
          * @type String
          */
          self.selectedLoan = self.optionsLoan[0];
          self.showSelectedLoan = []
          self.hasShowSelectedLoan = false
          self.loanStatusResponse = {}

          /*
          * Propiedad que muestra los diferentes tipos de documentos a expedir.
          * @property selectedLoan
          * @type String
          */
          self.selectedDocuments = "";

          /*
          * Propiedad que se envia a MDW para definir el tipo de documento
          * declaracion de renta, extractos, certificado, etc.
          * @property documentType
          * @type String
          */
          self.documentType = '';

          /*
          * Propiedad que se envia a MDW para definir el tipo de Credito
          * Salvavidas (1) , Propulsor (2)
          * @property documentType
          * @type String
          */
          self.loanType = '';

          /*
          * Propiedad que almacena la extension del archivo que el usuario genero
          * por defecto se define pdf.
          * @property documentExt
          * @type String
          */
          self.documentExt = 'pdf';

          /*
          * Propiedad que almacena toda la informacion de las opciones de la vista.
          * @property menuOptions
          * @type Object
          */
          self.menuOptions = messagesProvider.documentation.options[$scope.configCountry.codigo.pais];

          /*
          * Propiedad que almacena la funcion _changePreview.
          * @property _changePreview
          * @type function
          */
          self.changePreview = _changePreview;

          /*
          * Propiedad que almacena si el documento necesita select de año.
          * @property hasSelectYear
          * @type Boolean
          */
          self.hasSelectYear = false;

          /*
          * Propiedad que almacena la url del archivo que el usuario genero.
          * @property urlFile
          * @type String
          */
          self.urlFile = '';

          /*
          * Propiedad que almacena si el documento necesita select de mes.
          * @property hasSelectMonth
          * @type Boolean
          */
          self.hasSelectMonth = false;

          /*
          * Propiedad que almacena si el documento necesita select de # de prestamos.
          * @property hasSelectLoan
          * @type Boolean
          */
          self.hasSelectLoan = false;

          /*
           * Propiedad que almacena si el documento expedir diferentes documentos.
           * @property hasSelectLoan
           * @type Boolean
           */
          self.hasDocuments = false;

          /*
           * Propiedad que almacena si el documento expedir diferentes documentos.
           * @property hasSelectLoan
           * @type Boolean
           */
          self.getDocuments = getDocuments;

          self.documentSelected = messagesProvider.documentsType.type[0];

          /*
          * Propiedad que almacena el array con los años del select.
          * @property optionsYear
          * @type Array
          */
          self.optionsYear = [];

          /*
          * Propiedad para mostrar el mensaje del error '11-69L'.
          * @property showErrorCostTotalMessage
          * @type String
          */
          self.showErrorCostTotalMessage='';

          /*
          * Propiedad que almacena la funcion defineNewArrayMonth.
          * @property defineNewArrayMonth
          * @type function
          */
          self.defineNewArrayMonth = defineNewArrayMonth;

          /*
          * Propiedad para ocultar el iframe hasta q se consuma el servicio.
          * @property waitFile
          * @type Boolean
          */
          self.waitFile = true;

          /*
          * Propiedad para mostrar el error si el servicio de generar documento falla.
          * @property showErrorGenerateFile
          * @type Boolean
          */
          self.showErrorGenerateFile = false;
          /*
          * Propiedad para mostrar el error '11-69L' perteneciente a costos totales.
          * @property showErrorCostTotal
          * @type Boolean
          */
          self.showErrorCostTotal= false;

          /*
          * Propiedad que almacena la funcion para genera que documento que el usuario solicito.
          * @property generateDoc
          * @type function
          */
          self.generateDoc = generateDoc;

          /*
          * Propiedad que almacena la funcion para descargar documento
          * @property downloadDoc
          * @type function
          */
          self.downloadDoc = false;

          /*
          * Propiedad que almacena la funcion para jurar documento
          * @property swearDoc
          * @type function
          */
          self.swearDoc = false;

          /*
          * Propiedad que almacena la funcion para no jurar documento
          * @property swearDoc
          * @type function
          */
          self.dontSwearDoc = false;

          self.notButtons = false;

          /*
          * Propiedad para validar si debe ser disabled el boton de generar documento.
          * @property isDisabledGenDoc
          * @type boolean
          */
          self.isDisabledGenDoc = false;

          /*
          * Propiedad para validar si el usuario se encuentra en los extractos.
          * @property docTypeBankStatement
          * @type String
          */
          self.docTypeBankStatement = configProvider.documentation.docType.bankStatement;

          /*
          * Propiedad para validar el tipo de documento paz y salvo.
          * @property docTypeGoodStanding
          * @type String
          */
          self.docTypeGoodStanding = configProvider.documentation.docType.goodStanding;

          /*
          * Propiedad para validar si el usuario se encuentra en estados de cuenta.
          * @property docTypeLoanAccountStatement
          * @type String
          */
          self.docTypeLoanAccountStatement = configProvider.documentation.docType.loanAccountStatement;


          self.docTypeLoanCertificate = configProvider.documentation.docType.loanCertificate;

          /*
          * Propiedad para validar Declaración de operaciones de Crédito.
          * @property docLoanStatement
          * @type String
          */
          self.docTypeLoanStatement = configProvider.documentation.docType.docLoanStatement;

          /*
          * Propiedad para validar si el usuario se encuentra en el reporte de costos totales.
          * @property docTypeTotalCosts
          * @type String
          */
          self.docTypeTotalCosts = configProvider.documentation.docType.totalCosts;

          /*
          * Propiedad para validar si el usuario se encuentra en la declaracion de renta.
          * @property docTypeRentDeclaration
          * @type String
          */
          self.docTypeRentDeclaration = configProvider.documentation.docType.rentDeclaration;

          /*
          * Propiedad para validar si el usuario se encuentra en la certificacion bancaria.
          * @property docTypeBankCertification
          * @type String
          */
          self.docTypeBankCertification = configProvider.documentation.docType.bankCertification;

          /*
          * Propiedad para mostrar mensaje de información de descarga de documentos.
          * @property showDownloadDocInfo
          * @type String
          */
          self.showDownloadDocInfo= messagesProvider.documentation.info.downloadDocInfo;

          /*
          * Propiedad para mostrar el contador cuando se envie el correo con los extractos
          * @property minutesSendMail
          * @type Number
          * @property secondsSendMail
          * @type Number
          */
          self.minutesSendMail = 0;
          self.secondsSendMail = 30;

            /*
            * Formatea el tiempo para mostrarlo en el contador.
            * @method formatTime
            * @public
            */
            self.formatTime = function (minutes, seconds) {
              return (minutes < 10 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
            };

            /*
            * Inica el contador para enviar el correo con los extractos
            * @method startCountdown
            * @public
            */
            function startCountdown() {
              self.isDisabledGenDoc = true;
              var countdownInterval = $interval(function () {
                self.secondsSendMail--;

                if (self.secondsSendMail < 0) {
                  self.minutesSendMail--;
                  self.secondsSendMail = 59;
                }

                if (self.minutesSendMail === 0 && self.secondsSendMail === 0) {
                  self.minutesSendMail = 0;
                  self.secondsSendMail = 30;
                  self.isDisabledGenDoc = false;
                  $interval.cancel(countdownInterval); // Detiene el contador cuando llega a 00:00
                }
              }, 1000); // Actualiza cada segundo
            };


            /*
            * Limpia el bloque del review cuando se cambia de opcion de documento.
            * @method cleanReview
            * @private
            */
            function cleanReview() {                
                self.urlFile = $sce.trustAsResourceUrl('');
                self.hasSelectYear = false;
                self.hasSelectMonth = false;
                self.hasSelectLoan = false;
                self.hasDocuments = false;
                self.waitFile = true;
                self.showErrorGenerateFile = false;
                self.showErrorCostTotal= false;
                self.showErrorCostTotalMessage = '';
                self.downloadDoc = false;
                self.notButtons = false;
                self.swearDoc = false;
                self.dontSwearDoc = false;
                self.selectedYear = null;
                self.optionsYear = [];   
            }

            /*
            * Metodo para lcambiar el preview
            * @method _changePreview
            * @param {int} index del documento elegido
            * @private
            */
            function _changePreview(_index) {
                cleanReview();
                self.showSelectedLoan = [];
                _index = JSON.parse(_index);
                self.selectedMenu = self.menuOptions[_index[0]];

                if(_index.length === 3) {
                    self.selectedMenu = self.selectedMenu.children[_index[1]].children[_index[2]];
                }
                else if (_index.length === 2 && self.selectedMenu.children) {
                    self.selectedMenu = self.selectedMenu.children[_index[1]];
                }

                self.documentType = self.selectedMenu.documentType;
                self.loanType = self.selectedMenu.loanType;
                if(self.selectedMenu.documentType === configProvider.documentation.docType.movements){
                    self.downloadDoc = true;
                }
                if(self.selectedMenu.documentType === configProvider.documentation.docType.docLoanStatement){
                    self.swearDoc = true;
                    self.dontSwearDoc = true;
                    self.notButtons = true;
                }
                if(self.selectedMenu.documentType === configProvider.documentation.docType.loanCertificate){
                    self.notButtons = false;
                }

                for (var i = 0; i < self.selectedMenu.select.length; i++) {
                    switch(self.selectedMenu.select[i]) {
                        case 'year':
                            self.hasSelectYear = true;
                            createSelectYear();
                            break;
                        case 'month':
                            self.hasSelectMonth = true;
                            if(self.documentType === configProvider.documentation.docType.bankStatement) {
                                defineNewArrayMonth();
                            } else {
                                self.optionsMonth = configProvider.months;
                            }
                            break;
                        case 'loan' :
                            self.hasSelectLoan = true;                        
                            if (!self.optionsDocuments || self.optionsDocuments.length === 0) {
                                self.optionsDocuments = ['Estado de Cuenta', 'Paz y salvo'];
                            }
                            self.selectedDocuments = "Estado de Cuenta";
                            getDocuments();
                            break;
                        case 'documents' :
                            self.hasDocuments = true;
                            if(!self.selectedDocuments){
                              self.optionsDocuments.push(messagesProvider.documentsType.type[0].title)
                              self.optionsDocuments.push(messagesProvider.documentsType.type[1].title)
                              self.selectedDocuments = self.optionsDocuments[0]
                              getDocuments()
                            }
                            break;
                        default:
                    }
                }
            }


          function getDocuments() {
            self.selectedYear = null;
            self.optionsYear = [];
            self.documentSelected = messagesProvider.documentsType.type[0];
            if(self.selectedDocuments == "Estado de Cuenta"){
              self.hasSelectYear = false
              self.hasShowSelectedLoan = false
              self.documentSelected = messagesProvider.documentsType.type[0]
              self.documentType = messagesProvider.documentsType.type[0].documentLoanType
            }else if(self.selectedDocuments == "Paz y salvo"){
              self.hasSelectYear = true
              self.hasShowSelectedLoan = true
              self.documentSelected = messagesProvider.documentsType.type[1]
              self.documentType = messagesProvider.documentsType.type[1].documentLoanType
              createSelectYear();
            }
            getLoanStatus();
          }

            /*
            * Crea el array de años que se muestra en el select.
            * @method createSelectYear
            * @private
            */
            function createSelectYear() {                
                var currentDate = new Date(),
                    currentYear = currentDate.getFullYear(),
                    currentMonth = currentDate.getMonth(),
                    difference = 0,
                    totalYear = 0;

                self.optionsYear = [];

                if (self.documentType === configProvider.documentation.docType.rentDeclaration) {
                    totalYear = currentYear - 2016 - 1;
                } else if (self.documentType === configProvider.documentation.docType.bankStatement) {
                    totalYear = currentYear - 2018;
                } else if (self.documentType === configProvider.documentation.docType.goodStanding) {
                    totalYear = 5;
                    difference = currentYear - totalYear;
                } else if (self.documentType === configProvider.documentation.docType.docLoanStatement) {
                    totalYear = currentYear - 2020;
                } else if (self.documentType === configProvider.documentation.docType.totalCosts) {
                    totalYear = currentYear - 2017 - 1;
                } else {
                    totalYear = currentYear - 2016;
                }

                for (var i = 0; i <= totalYear; i++) {
                    if (self.documentType === configProvider.documentation.docType.bankStatement) {
                      self.optionsYear.push((2018 + i).toString());
                    } else if(self.documentType === configProvider.documentation.docType.goodStanding) {
                      self.optionsYear.push((difference + i).toString());
                    } else if (self.documentType === configProvider.documentation.docType.docLoanStatement) {
                        self.optionsYear.push((2019 + i).toString());
                    } else if (self.documentType === configProvider.documentation.docType.totalCosts) {
                        var yearToAdd = 2017 + i;

                        if (yearToAdd === currentYear) {
                            if (currentMonth >= 2) {
                                self.optionsYear.push((yearToAdd).toString());
                            }
                        }else{
                            self.optionsYear.push((yearToAdd).toString());
                        }

                    } else {
                        self.optionsYear.push((2016 + i).toString());
                    }
                }

                self.selectedYear = self.optionsYear[totalYear];
                if (self.hasSelectLoan) {
                    getLoanStatus();
                }
            }

            /*
            * Crea nuevo array con los meses vencidos del año actual.
            * @method defineNewArrayMonth
            * @private
            */
            function defineNewArrayMonth() {
                self.showSelectedLoan = [];
                if(self.hasSelectLoan) {
                    getLoanStatus();
                } else {
                    var today = new Date(),
                        currentYear = today.getFullYear(),
                        currentMonth = today.getMonth(),
                        currentDay = today.getDate(),
                        showCurrentMonth = -1,
                        initMonth = 0;

                    if(currentYear === parseInt(self.selectedYear)) {
                        if(currentDay >= 3) {
                            showCurrentMonth = 0;
                        }
                        self.optionsMonth = configProvider.months.slice(initMonth, currentMonth+showCurrentMonth);
                    } else {
                        self.optionsMonth = configProvider.months;
                    }
                    self.selectedMonth = self.optionsMonth[0];
                }
            }

            /*
            * Funcion para obtener el numero del mes.
            * @method getNumberMonth
            * @private
            */
            function getNumberMonth() {
                for (var i = 0; i < self.optionsMonth.length; i++) {
                    if(self.optionsMonth[i] === self.selectedMonth) {
                        return (i+1).toString();
                    }
                }
            }

            /*
            * Callback exitoso del generateDoc.
            * @method generateDocSuccess
            * @private
            */
            function generateDocSuccess(_response) {
              busyIndicatorProvider.close();
              if(_response.success) {
                self.showErrorCostTotal= false;
                self.showErrorGenerateFile = false;

                if(self.documentType === self.docTypeBankStatement) {
                  openPopupSendDocument(messagesProvider.modal.sendDocumentMail);
                  return;
                }

                if(self.documentType === self.docTypeGoodStanding) {
                  openPopupSendDocument(messagesProvider.modal.sendGoodStandingMail);
                  return;
                }

                if(self.documentType === self.docTypeLoanAccountStatement) {
                  openPopupSendDocument(messagesProvider.modal.sendDocumentStateAccountMail);
                  return;
                }

                if(self.documentType === self.docTypeLoanStatement){
                  openPopupSendDocument(messagesProvider.modal.sendLoanStatementMail);
                  return;
                }

                if(self.documentType === self.docTypeTotalCosts) {
                  openPopupSendDocument(messagesProvider.modal.sendTotalCostMail);
                  return;
                }

                if(self.documentType === self.docTypeRentDeclaration) {
                  openPopupSendDocument(messagesProvider.modal.sendRentDeclaration);
                  return;
                }

                if(self.documentType === self.docTypeBankCertification) {
                  openPopupSendDocument(messagesProvider.modal.sendBankCertification);
                  return;
                }

                if(_response.data && _response.data.url) {
                  var urlPdf = $window.location.href.split('bdigital')[0]+'bdigital' + _response.data.url;
                  if (_response.data.url.includes('https://')){
                      urlPdf = _response.data.url
                  }
                  self.showErrorGenerateFile = false;
                  self.showErrorCostTotal = false;
                  self.showErrorCostTotalMessage = '';
                  if(screen.width > 768) {
                    self.waitFile = false;
                    self.urlFile = $sce.trustAsResourceUrl(urlPdf);
                  } else {
                    location.href = urlPdf;
                  }
                  if(self.selectedMenu.documentType === configProvider.documentation.docType.movements){
                    var link = document.createElement('a');
                    link.href = self.urlFile;
                    link.download="movimientos.xlsx";
                    link.click();
                  }
                  busyIndicatorProvider.close();
                } else {
                    generateDocFail(_response);
                }
              } else {
                generateDocFail(_response);
              }
            }

            /*
            * Metodo para abrir la pop-up de envio de documento por correo
            * @method openPopupSendDocument
            */
            function openPopupSendDocument(modal) {
              startCountdown();
              var emailUserHide = localStorage.getItem("email") || '';
              var textContent = modal.text;
              var textModify = textContent.replace("{email}", emailUserHide);

              popupProvider.open({
                  modalInfo: {
                      title: modal.title,
                      text: textModify,
                      button: modal.button,
                      img: modal.img
                  },
                  modalAction: closeModal,
                  clearModal: closeModal
              });
            }

            /*
            * Metodo para ocultar el correo que se va a mostrar en la pop-up
            * @method hideMail
            */
            function hideMail(email) {
              // Metodo para generar asteriscos n veces
              function generateAsterisks(n) {
                return Array(n + 1).join('*');
              }

              var parts = email.split('@');
              var userName = parts[0];
              var domain = parts[1];

              if (userName.length <= 2) {
                return email;
              }

              var firstLetters = userName.slice(0, 3);
              var asterisks = userName.length - 3;
              var hideEmail = firstLetters + generateAsterisks(asterisks) + '@' + domain;

              return hideEmail;
            }

            /*
            * Metodo para cerrar la modal
            * @method closeModal
            */
            function closeModal() {
              popupProvider.close();
            }

           /*
            * Callback fallido del generateDoc.
            * @method generateDocFail
            * @private
            */
            function generateDocFail(_error) {
                if(self.selectedMenu.documentType === configProvider.documentation.docType.nequiCard){
                    self.showErrorCostTotal= true;
                    self.showErrorGenerateFile = false;
                    self.showErrorCostTotalMessage= messagesProvider.documentation.errors.nequiCard;
                }else if(self.selectedMenu.documentType === configProvider.documentation.docType.movements){
                    self.showErrorCostTotal= true;
                    self.showErrorGenerateFile = false;
                    self.showErrorCostTotalMessage= messagesProvider.documentation.errors.movements;
                }else if(self.selectedMenu.documentType === configProvider.documentation.docType.docLoanStatement){
                    self.showErrorCostTotal= true;
                    self.showErrorGenerateFile = false;
                    self.showErrorCostTotalMessage= messagesProvider.documentation.errors.loanGenerate;
                }else if(self.selectedMenu.documentType === configProvider.documentation.docType.loanAccountStatement) {
                    self.showErrorCostTotal= true;
                    self.showErrorGenerateFile = false;
                    self.showErrorCostTotalMessage= messagesProvider.documentation.errors.loanAccountStatement;
                } else if(self.selectedMenu.documentType === configProvider.documentation.docType.goodStanding) {
                    self.showErrorCostTotal= true;
                    self.showErrorGenerateFile = false;
                    self.showErrorCostTotalMessage= messagesProvider.documentation.errors.loanAccountPeaceAndSave;
                } else {
                    self.showErrorGenerateFile = true;
                }
                busyIndicatorProvider.close();
            }

          /*
          * Metodo para llamar a MDW y generar el documento que el usuario solicito.
          * @method generateDoc
          * @private
          */
          function generateDoc(decision) {
            if(self.isDisabledGenDoc) {
              return;
            }
            busyIndicatorProvider.open();
            var numberMonth = getNumberMonth()
            var param = paramsByDocument(numberMonth, decision)
            if(self.selectedMenu.documentType === configProvider.documentation.docType.goodStanding &&
              self.selectedLoan.indexOf('#') !== -1) {
              busyIndicatorProvider.close();
              self.showErrorCostTotal= false;
              self.showErrorGenerateFile = true;
            } else {
              $scope.jsonService(configProvider.typeRequest.post, configProvider.urlServices.consultDocument, param)
                .then(function(response){
                  generateDocSuccess(response);
                }, function(error) {
                  generateDocFail(error);
                });
            }
          }

          /*
          * Callback exitoso del getLoanStatus.
          * @method getLoanStatusSuccess
          * @private
          */
          function getLoanStatusSuccess(_response) {
            if(_response.success) {
              if(_response.data && _response.data.data && _response.data.data.length > 0) {
                self.loanStatusResponse = changeProductIdSufix(_response.data.data)
                self.optionsLoan = _response.data.data.map(function(loan) {
                  if(loan.purpose != null && loan.purpose != ""){
                    self.loanType = loan.loanType;
                    return loan.loanAcctNum +" - " + loan.purpose;
                  }return loan.loanAcctNum;
                });
                if(self.documentSelected.documentType != "pys"){
                  self.selectedLoan = self.optionsLoan[0];
                }
                busyIndicatorProvider.close();
              } else {
                getLoanStatusFail(_response);
              }
            } else {
              getLoanStatusFail(_response);
            }
          }

            /*
            * Callback fallido del getLoanStatus.
            * @method getLoanStatusFail
            * @private
            */
            function getLoanStatusFail(_error) {
                self.showErrorCostTotal= true;
                self.showErrorGenerateFile = false;
                self.showErrorCostTotalMessage= messagesProvider.documentation.errors.loanAccountPeaceAndSave;
                busyIndicatorProvider.close();
            }

            /*
            * Metodo para llamar a MDW y generar el documento que el usuario solicito.
            * @method getLoanStatus
            * @private
            */
           function getLoanStatus() {
                var param = {
                    'phoneNumber': $scope.userApp.phoneNumber || '',
                    'year': self.selectedYear,
                    'documentType': self.documentSelected.documentType
                };
                busyIndicatorProvider.open();
                self.optionsLoan = configProvider.loans;
                self.selectedLoan = self.optionsLoan[0];
                self.showErrorCostTotal= false;
                self.showErrorGenerateFile = false;
                $scope.jsonService(configProvider.typeRequest.post, configProvider.urlServices.getLoanStatus, param)
                    .then(function(response){
                        getLoanStatusSuccess(response);
                }, function(error) {
                    getLoanStatusFail(error);
                });
            }

          function paramsByDocument(numberMonth, decision) {
            if(self.documentSelected.documentType == "pys"){
              return {
                'phoneNumber': $scope.userApp.phoneNumber || '',
                'documentType': self.documentType,
                'documentExt': self.documentExt,
                'periodDoc': {
                  'year': self.selectedYear,
                  'month': numberMonth
                },
                'loanAcctNum': sendSelectedLoans(),
                'loanType' : self.loanType,
                'decision' : decision || ''
              }
            }
            return {
              'phoneNumber': $scope.userApp.phoneNumber || '',
              'documentType': self.documentType,
              'documentExt': self.documentExt,
              'periodDoc': {
                'year': self.selectedYear,
                'month': numberMonth
              },
              'loanAcctNum': sendSelectedLoansStatement(),
              'loanType' : self.loanType,
              'decision' : decision || ''
            }

          }

          function sendSelectedLoansStatement() {
            const selectedLoanPrefix = self.selectedLoan.split(" ", 1)[0];
            if(!!self.loanStatusResponse && self.loanStatusResponse.length > 0){
              return self.loanStatusResponse
                .filter(selectedLoan => selectedLoan.loanAcctNum === selectedLoanPrefix)
            }
            return []
          }

          function sendSelectedLoans() {
            if(!!self.showSelectedLoan && self.showSelectedLoan.length > 0){
               return self.showSelectedLoan.map(function (selectedLoan) {
                  return self.loanStatusResponse.find(function (loan) {
                     return loan.loanAcctNum == selectedLoan.split(" ", 1)[0];
                  });
               });
            }return []
          }

          function changeProductIdSufix(_response) {
            return _response.map(loan => ({
              ...loan,
              productId: `PS${loan.productId}`
            }));
          }

          $scope.handleMonthChange = function() {
            const selectedLoan = $scope.previewDocumentationControl.selectedLoan;
            if (selectedLoan && !$scope.previewDocumentationControl.showSelectedLoan.includes(selectedLoan) && self.hasShowSelectedLoan) {
              $scope.previewDocumentationControl.showSelectedLoan.push(selectedLoan);
            }
          }

          $scope.delete = function(selectedLoan){
            if($scope.previewDocumentationControl.showSelectedLoan.includes(selectedLoan)){
              var index = $scope.previewDocumentationControl.showSelectedLoan.indexOf(selectedLoan);
              $scope.previewDocumentationControl.showSelectedLoan.splice(index, 1);
              $scope.previewDocumentationControl.selectedLoan = "";
            }
          }

          $scope.forceUpdate = function() {
            if(self.hasShowSelectedLoan){
              $scope.previewDocumentationControl.selectedLoan = "";
            }
          }

        }]
    };

}]);

/*
* Directiva para el spinner cargando web nequi
* @constructor
* @module nequiWeb
*/
angular.module('App')
	.directive('spinner', function() {
    return {
      restrict: 'E',
      transclude: true, // Habilitar la transclusión para incluir contenido interno
      templateUrl: 'views/transversal/spinner.html',
    };
  });

/**
 * Filter para enmascarar las fechas de ultima conexión
 * @constructor
 * @return {String} fecha con el formato yyyy-MMMM-dd hh:mm Z.
 * @module sherpa
 **/
'use strict';

angular.module('App')
    .filter('lastDateFilter', ['configProvider', 'utilsProvider', function(configProvider, utilsProvider) {

    return function(date, template) {
        if (utilsProvider.validateNull(date)) {
            var result,
                fullDate,
                datePart1,
                datePart2,
                month,
                zone,
                hour;

            fullDate = date.split(' ');
            datePart1 = fullDate[0].split('-');
            month = configProvider.months[parseInt(datePart1[1] - 1)];
            datePart2 = fullDate[1].split(':');
            hour = parseInt(datePart2[0]);
            if (hour > 12) {
                zone = 'pm';
                datePart2[0] = hour - 12;
            } else if (hour === 12) {
                zone = 'pm';
            } else if (hour === 0) {
                zone = 'am';
                datePart2[0] = 12;
            } else {
                zone = 'am';
            }

            result = [datePart1[2], month, datePart2[0], datePart2[1], zone];

            return utilsProvider.createFormatString(template, result);
        } else {
            return '';
        }
    };
}]);

/**
* Este filtro convirte los datos a un numero de telefono separado por espacios
* @author: Hildebrando Rios
* @date: 23/07/2015
* @return: {String} xxx xxx xxxx
*/
angular.module('App').filter('phone', function () {
  return function (phone) {
    if (!phone) { return ''; }
    var value = phone.toString().trim().replace(/^\+/, '');
    if (value.match(/[^0-9]/)) {
      return phone;
    }
    var number = value;
    if(number.length === 10){
      number = number.slice(0, 3) + ' '+number.slice(3, 6) +' ' + number.slice(6);
    }else if(number.length > 10){
      number = number.slice(0, 3) + ' '+number.slice(3, 6) +' ' + number.slice(6, 9) +' ' + number.slice(9);
    }
    return (number).trim();
  };
});
/**
* Provider para publicar las funciones utilitarias de la aplicación
* @class busyIndicatorProvider
* @constructor
* @module webNequi
*/

angular.module('App')
    .factory('busyIndicatorProvider', ['$rootScope', 'configProvider', function($rootScope, configProvider){

    /**
     * Objeto para exponer interface publica del provider
     * @property self
     * @type object
     */
    var self = {
        open: open,
        close: close
    };

    /**
    * Metodo hace el emit para abrir el busy
    * @method open
    * @public
    */
    function open() {
        $rootScope.$emit('openBusyDirective');
    }

    /**
    * Metodo hace el emit para cerrar el busy
    * @method closePopupDirective
    * @public
    */
    function close() {
        $rootScope.$emit('closeBusyDirective');
    }

    return self;

}]);
/**
* Provider para el manejo de internacionalización de la pagina, este Provider
* contiene las configuraciones especificas de cada pais
* @class configCountryProvider
* @constructor
* @module WebNequi
*/

angular.module('App')
    .factory('configCountryProvider', function() {

    var config = Object.freeze({
        /*Configuraciones especificas para Panama*/
        'pa': {
            'codigo': {
                'pais': 'pa',
                'tel': '+507',
                'region': 'P001'
            },
            'country': 'Panama',
            'prefix': 'PA',
            /*
            Links de imagenes
             */
            'imgs': {
              'logoNequi': 'https://uploads-ssl.webflow.com/6317a229ebf7723658463b4b/64e50b03c9fda96db04be382_logo-nequi-blanco.svg',
              'bancolombiaGroup': 'https://assets-global.website-files.com/63be0fb85664b94d14287a6c/640115ff970ede3928b69c21_Logo-banistmo.svg',
              'iconArrow': 'https://uploads-ssl.webflow.com/6317a229ebf7723658463b4b/64e573948290d271c9185df0_ic-arrow.svg',
              'logoVigilado': 'https://uploads-ssl.webflow.com/65ce1c19567caef6f8949f6f/65ce1f8f383741a58719b513_Vigilado%20NEQUI%20SA%20blanco.svg',
            },
            /*
            Links del sitio
             */
            'links': {
                'home': 'https://www.nequi.com.pa',
                'discover': 'https://www.nequi.com.pa/detalles-del-servicio/',
                'faq':'https://ayuda.nequi.com.pa/',
                'merchant':'https://www.nequi.com.pa/punto-nequi/',
                'maps': 'https://www.nequi.com.pa/mapas/',
                'recharge': '#',
                'security': 'https://www.nequi.com.pa/legal/#seguridad',
                'contact': 'https://www.nequi.com.pa/chat/',
                'product': 'https://www.nequi.com.pa/legal/#caracteristicas-del-producto',
                'terms': 'https://www.nequi.com.pa/legal/#condiciones-de-uso',
                'tyc': 'https://www.nequi.com.pa/legal/#terminos-y-condiciones',
                'map': 'https://www.nequi.com.pa/mapa-del-sitio/',
                'fb': 'https://www.facebook.com/nequipanama',
                'you': 'https://www.youtube.com/channel/UCtdpoTH0054MSAt6iqkMiFw',
                'ins': 'https://www.instagram.com/nequipanama',
                'press': 'https://www.nequi.com.pa/prensa/',
                'welcome': '/bdigital/private/index.html?region=pa'
            },
            /*
            Informacion de contacto
             */
            'infoContact': {
                'numPhone': '377-1000/ 629NEQUI',
                'email': 'escribe@nequi.com.pa',
                'daysAttention': 'Lunes a Viernes',
                'hourAttention': '08:00 am a 06:00 pm'
            },
            /*
            links de tiendas
             */
            'store': {
              'apple': 'https://apps.apple.com/us/app/nequi-panama/id1183868167',
              'appleimg': 'https://uploads-ssl.webflow.com/6317a229ebf7723658463b4b/64e50ed702047ba456edd2cb_store-apple.svg',
              'android': 'https://play.google.com/store/apps/details?id=pa.com.nequi.MobileApp',
              'androidimg': 'https://uploads-ssl.webflow.com/6317a229ebf7723658463b4b/64e50ed88b7bb33f2c2c4653_store-googleplay.svg',
              'huawei': 'https://appgallery.huawei.com/app/C102297511',
              'huaweiimg': 'https://uploads-ssl.webflow.com/6317a229ebf7723658463b4b/64e50ed702047ba456edd25c_store-huawei.svg'
          },
          /*
            Labels del footer
             */
            'labels': [
              {
                id: 'info-legal',
                title: 'Información legal',
                data: [
                  { label: 'Términos y condiciones', link: 'https://www.nequi.com.pa/informacion-legal' },
                  { label: 'Contrato de usuario', link: 'https://www.nequi.com.pa/informacion-legal' },
                  { label: 'Legal Nequi', link: 'https://www.nequi.com.pa/informacion-legal' },
                ]
              },
              {
                id: 'para-personas',
                title: 'Para personas',
                data: [
                  { label: 'Tarjeta Nequi Visa', link: 'https://www.nequi.com.pa/tarjeta-nequi' },
                  { label: 'Usa tu plata', link: 'https://www.nequi.com.pa/usa-tu-plata' },
                  { label: 'Paypal', link: 'https://www.nequi.com.pa/paypal' },
                  { label: 'eVale', link: 'https://www.nequi.com.pa/e-vale' },
                ]
              },
              {
                id: 'para-negocio',
                title: 'Para tu negocio',
                data: [
                  { label: 'Usa el QR', link: 'https://www.nequi.com.pa/usa-qr' },
                ]
              },
              {
                id: 'ayuda',
                title: 'Ayuda',
                data: [
                  { label: 'Centro de ayuda', link: 'https://ayuda.nequi.com.pa/hc/es-419' },
                ]
              },
              {
                id: 'conocenos',
                title: 'Conócenos',
                data: [
                  { label: 'Somos Nequi', link: 'https://www.nequi.com.pa/somos-nequi' },
                ]
              }
            ],
            /*
            Redes Sociales
             */
            'socialMedia': [
              {
                img: 'https://uploads-ssl.webflow.com/6317a229ebf7723658463b4b/64e5220142aa063fa007c444_ic-twitter.svg',
                link: 'https://twitter.com/NequiPanama',
              },
              {
                img: 'https://uploads-ssl.webflow.com/6317a229ebf7723658463b4b/64e52201416719efe915e448_ic-instagram.svg',
                link: 'https://www.instagram.com/nequipanama/',
              },
              {
                img: 'https://uploads-ssl.webflow.com/6317a229ebf7723658463b4b/64e52201c1a7bf3e9e5bd566_ic-facebook.svg',
                link: 'https://www.facebook.com/appnequi/?brand_redir=1945487589018530',
              },
              {
                img: 'https://uploads-ssl.webflow.com/6317a229ebf7723658463b4b/64e522013be191fdc4a0252e_ic-linkedin.svg',
                link: 'https://www.linkedin.com/company/nequi-panam%C3%A1/',
              },
              {
                img: 'https://uploads-ssl.webflow.com/6317a229ebf7723658463b4b/64e52201c663d0190bc59ba8_ic-youtube.svg',
                link: 'https://www.youtube.com/channel/UCtdpoTH0054MSAt6iqkMiFw',
              },
            ],
            /*
            restricciones de los inputs
             */
            'inputs': {
                'phoneNumber': {
                    'maskString': '0000 0000',
                    'regEx': '^6[\\d]{7}$+\s',
                    'minlength': 8
                },
                'password': {
                    'regEx': '^[0-9]*$',
                    'minlength': 4
                }
            }
        },
        /*Configuraciones especificas para Colombia*/
        'co': {
            'codigo': {
                'pais': 'co',
                'tel': '+57',
                'region': 'C001'
            },
            'country': 'Colombia',
            'prefix': 'CO',
            /*
            Links de imagenes
             */
            'imgs': {
              'logoNequi': 'https://uploads-ssl.webflow.com/6317a229ebf7723658463b4b/64e50b03c9fda96db04be382_logo-nequi-blanco.svg',
              'bancolombiaGroup': 'https://uploads-ssl.webflow.com/65ce1c19567caef6f8949f6f/65ce1c19567caef6f894a575_logo-grupo-bancolombia.svg',
              'iconArrow': 'https://uploads-ssl.webflow.com/6317a229ebf7723658463b4b/64e573948290d271c9185df0_ic-arrow.svg',
              'logoVigilado': 'https://uploads-ssl.webflow.com/65ce1c19567caef6f8949f6f/65ce1f8f383741a58719b513_Vigilado%20NEQUI%20SA%20blanco.svg',
              'imgFogafin': 'https://uploads-ssl.webflow.com/65ce1c19567caef6f8949f6f/65df4029bf0deccb7f924447_fogafin-negro.svg'
            },
            /*
            Links del sitio
             */
            'links': {
                'home': 'https://www.nequi.com.co',
                'discover': 'https://www.nequi.com.co/descubre/',
                'faq': 'https://ayuda.nequi.com.co/hc/es',
                'merchant':'https://www.nequi.com.co/punto-nequi/',
                'maps': 'https://www.nequi.com.co/mapas/',
                'recharge': 'https://recarga.nequi.com.co/bdigitalpsl',
                'security': 'https://www.nequi.com.co/informacion-legal',
                'contact': 'https://www.nequi.com.co/chat/',
                'product': 'https://www.nequi.com.co/informacion-legal',
                'terms': 'https://www.nequi.com.co/legal-web/condiciones-de-uso-de-la-pagina-web',
                'tyc': 'https://www.nequi.com.co/informacion-legal',
                'map': 'https://www.nequi.com.co/mapa-del-sitio/',
                'fb': 'https://www.facebook.com/appnequi/',
                'tw': 'https://twitter.com/nequi/',
                'ins': 'https://www.instagram.com/nequi_/',
                'you':'https://www.youtube.com/channel/UCK1dLH3nTK-GOlgSVa95XNg',
                'press': 'https://www.nequi.com.co/prensa/',
                'welcome': '/bdigital/private/#!/welcome'
            },
            /*
            Informacion de contacto
             */
            'infoContact': {
                'numPhone': '300 600 0100',
                'email': 'escribe@nequi.co',
                'daysAttention': 'Todos los días',
                'hourAttention': '08:00 am a 10:00 pm'
            },
            /*
            links de tiendas
             */
            'store': {
              'apple': 'https://apps.apple.com/co/app/nequi/id1075378688',
              'appleimg': 'https://uploads-ssl.webflow.com/6317a229ebf7723658463b4b/64e50ed702047ba456edd2cb_store-apple.svg',
              'android': 'https://play.google.com/store/apps/details?id=com.nequi.MobileApp&hl=es',
              'androidimg': 'https://uploads-ssl.webflow.com/6317a229ebf7723658463b4b/64e50ed88b7bb33f2c2c4653_store-googleplay.svg',
              'huawei': 'https://appgallery.huawei.com/#/app/C101700131?channelId=browser&detailType=0',
              'huaweiimg': 'https://uploads-ssl.webflow.com/6317a229ebf7723658463b4b/64e50ed702047ba456edd25c_store-huawei.svg'
          },
          /*
            Labels del footer
             */
            'labels': [
              {
                id: 'info-legal',
                title: 'Información legal',
                data: [
                  { label: 'Condiciones de uso', link: 'https://www.nequi.com.co/legal-web/condiciones-de-uso-de-la-pagina-web' },
                  { label: 'Tratamiento de Datos Personales', link: 'https://www.nequi.com.co/legal-web/tratamiento-de-datos-personales-nequi' },
                  { label: 'Consumidor fianciero', link: 'https://www.nequi.com.co/informacion-legal#consumidor-financiero' },
                  { label: 'Defensor del Consumidor Financiero', link: 'https://www.nequi.com.co/informacion-legal/defensor-del-consumidor-financiero-de-nequi' },
                  { label: 'Términos y condiciones Tarjeta Nequi', link: 'https://www.nequi.com.co/legal-tarjeta-nequi/terminos-y-condiciones-de-tarjeta-nequi' },
                  { label: 'Legal Nequi', link: 'https://www.nequi.com.co/informacion-legal' },
                ]
              },
              {
                id: 'para-personas',
                title: 'Para personas',
                data: [
                  { label: 'Tarjeta Nequi', link: 'https://www.nequi.com.co/tarjeta-nequi' },
                  { label: 'Crédito Salvavidas', link: 'https://www.nequi.com.co/prestamo-salvavidas' },
                  { label: 'Crédito Propulsor', link: 'https://www.nequi.com.co/prestamo-propulsor' },
                  { label: 'Usa tu plata', link: 'https://www.nequi.com.co/usa-tu-plata' },
                  { label: 'Paypal', link: 'https://www.nequi.com.co/paypal' },
                  { label: 'Remesas', link: 'https://www.nequi.com.co/remesas' },
                ]
              },
              {
                id: 'para-negocio',
                title: 'Para tu negocio',
                data: [
                  { label: 'Negocios', link: 'https://negocios.nequi.co/' },
                ]
              },
              {
                id: 'ayuda',
                title: 'Ayuda',
                data: [
                  { label: 'Centro de ayuda', link: 'https://ayuda.nequi.com.co/hc/es' },
                  { label: 'Blog metidas de plata', link: 'https://www.nequi.com.co/blog' },
                  { label: 'Comunidad Nequi', link: 'https://comunidad.nequi.co/' },
                  { label: 'Tips de seguridad', link: 'https://www.nequi.com.co/roberto-hurtado-tips-de-seguridad' },
                ]
              },
              {
                id: 'conocenos',
                title: 'Conócenos',
                data: [
                  { label: '¿Quiénes somos?', link: 'https://www.nequi.com.co/somos-nequi' },
                  { label: 'Trabaja con nosotros', link: 'https://www.nequi.com.co/nequi-trabaja-con-nosotros' },
                  { label: 'Sala de prensa', link: 'https://www.nequi.com.co/sala-de-prensa' },
                  { label: 'Comunicados', link: 'https://www.nequi.com.co/comunicados' },
                ]
              }
            ],
            /*
            Redes Sociales
             */
            'socialMedia': [
              {
                img: 'https://uploads-ssl.webflow.com/6317a229ebf7723658463b4b/64e5220142aa063fa007c444_ic-twitter.svg',
                link: 'https://twitter.com/Nequi',
              },
              {
                img: 'https://uploads-ssl.webflow.com/6317a229ebf7723658463b4b/64e52201416719efe915e448_ic-instagram.svg',
                link: 'https://www.instagram.com/nequi_/',
              },
              {
                img: 'https://uploads-ssl.webflow.com/6317a229ebf7723658463b4b/64e52201c1a7bf3e9e5bd566_ic-facebook.svg',
                link: 'https://www.facebook.com/appnequi/',
              },
              {
                img: 'https://uploads-ssl.webflow.com/6317a229ebf7723658463b4b/64e522013be191fdc4a0252e_ic-linkedin.svg',
                link: 'https://www.linkedin.com/company/nequi/mycompany/',
              },
              {
                img: 'https://uploads-ssl.webflow.com/6317a229ebf7723658463b4b/64e52201c663d0190bc59ba8_ic-youtube.svg',
                link: 'https://www.youtube.com/channel/UCK1dLH3nTK-GOlgSVa95XNg/feed',
              },
            ],
            /*
            restricciones de los inputs
             */
            'inputs': {
                'phoneNumber': {
                    'maskString': '000 000 0000',
                    'regEx': '^[0-9]*$+\s',
                    'minlength': 10
                },
                'password': {
                    'regEx': '^[0-9]*$',
                    'minlength': 4
                }
            }
        }
    });

    return config;
});

/**
* Provider para el manejo de las configuraciones
* @author: hildebrando.rios
* @date: 21.08.2015
*/
angular.module('App').factory('configProvider', function() {
    var config = Object.freeze({
        'googleAnalytics': {
            'category': {
                'welcome': 'web mi cuenta',
                'block': 'web bloquear cuenta',
                'cancel': 'web cancelar tarjeta',
            },
            'action': {
                'click': 'click'
            },
            'label': {
                /*
                Labels welcome
                 */
                'welcomeBlock': 'Bloquear cuenta web',
                'welcomeRecharge': 'Recarga web',
                'welcomeExit': 'Salir web',
                'welcomeFaq': 'Preguntas web',
                /*
                Labels bloqueo
                 */
                'blockAccept': 'Aceptar Bloquear web',
                'blockCancel': 'Cancelar Bloquear web',
                 /*
                Labels Cancelar tarjeta
                 */
                'cancelAccept': 'Aceptar Bloquear web'
            }
        },
        'setting': {
            'inactivity': 300000
        },
        'fileExtension':'.html',
        'classMain':{
            'welcome':'',
            'blockAccount':'wrapper-bloqueo'
        },
        'getUrl':{
            'viewDefault':'/welcome',
            'viewHeader':'views/template/header.html',
            'viewFooter':'views/template/footer.html'
        },
        'folders': {
            'views':'views'
        },
        'typeRequest': {
            'get':'get',
            'post':'post',
            'put':'put'
        },
        'statusCode':{
            'transactionSuccess':'35',
            'statusTrue':'0',
            'success':true,
            'fail': false
        },
        'baseService': {
            'url':'/bdigital/rest/services/private/',
            'urlPublic': '/bdigital/rest/services/public/' ,
            'header': {'Content-Type': 'application/json; charset=UTF-8'}
        },
        'messageBody': {
           'RequestMessage': {
               'RequestHeader': {
                   'Channel': 'MF-001',
                   'RequestDate': '',
                   'MessageID': '1234545',
                   'ClientID': ''
               },
               'RequestBody': {
                   'any': {}
               }
           }
        },
        'errorData': {
            'error':{
                'errorId':'',
                'errorMessage':'',
                'sessionInvalidationError': 'true',
                'sessionExpirationError': 'true'
            },
            'sessionInvalidationErrorCode': 'ERR_VAL_SES',
            'sessionExpirationErrorCode': 'ERR_EXP_SES'
        },
        'urlServices': {
            'blockClient': {
                'url':'BlockClientService/blockClient',
                'rs':'blockClientRS',
                'rq':'blockClientRQ'
            },
            'cancelCard': {
                'url':'CancelCardService/cancelCard',
                'rs':'cancelCardRS',
                'rq':'cancelCardRQ'
            },
            'getCustomerCard': {
                'url':'GetCustomerCardService/getCustomerCard',
                'rs':'getCustomerCardRS',
                'rq':'getCustomerCardRQ'
            },
            'homeUserprofile': {
                'url':'UserProfileServices/userProfile',
                'rs':'userProfileServiceRS',
                'rq':'userProfileServiceRQ'
            },
            'logout': {
                'url':'LogoutService/logout',
                'rs':'logoutRS',
                'rq':'logoutRQ'
            },
             'getParameters': {
                'url' : 'ParameterService/parameter',
                'rs' : 'parameterRS',
                'rq' : 'parameterRQ'
            },
            'consultDocument': {
                'url': 'ConsultDocumentServices/consultDocument',
                'rs': 'consultDocumentRS',
                'rq': 'consultDocumentRQ',
                'service': {
                    'name': 'ConsultDocumentServices',
                    'operation': 'consultDocument',
                    'version': '1.0.0'
                }
            },
            'getLoanStatus': {
                'url': 'ConsultDocumentServices/getLoanStatus',
                'rs': 'getLoanStatusRS',
                'rq': 'getLoanStatusRQ',
                'service': {
                    'name': 'ConsultDocumentServices',
                    'operation': 'getLoanStatus',
                    'version': '1.0.0'
                }
            }
        },
        'parameters': {
            'getFrequentQuestionsUrl' : '31'
        },
        'months': ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
        'loans': ['# de crédito'],
        'pocketsTypes': {
            'pocket' : 0,
            'goals' : 1,
            'saved' : 2,
            'pocketsAndSaved' : 3,
            'available' : 4,
            'pocketsGoalsAndSaved' : 5,
            'card': 6
        },
        'errorsCode': {
            'blockAccount': {
                'noBiometry': '11-43L'
            }
        },
        'documentation': {
            'docType': {
                'rentDeclaration' : 'DocTypeRentDeclaration',
                'bankCertification' : 'DocTypeBankCertification',
                'bankStatement' : 'DocTypeBankStatement',
                'totalCosts' : 'DocTypeTotalCosts',
                'docLoanStatement' : 'DocLoanStatement',
                'loanAccountStatement': 'DocTypeLoanAccountStatement',
                'goodStanding': 'DOCTYPEGOODSTANDING',
                'nequiCard': 'DOCTYPENEQUICARD',
                'movements': 'DOCTYPEMOVEMENTS',
                'loanCertificate': 'DocTypeLoanCertificate'
            }
        },
        'cookies': {
            'keyRecaptcha': 'scn'
        },
        'generateFakeDocuments': {
          'active': true,
          'usersLowAmount': ['3720000024'],
          'usersSavingsAccount': ['3720000630'],
          'lowAmount': {
            'DocTypeRentDeclaration': 'https://sherpa-images.s3.amazonaws.com/contrato/QA/retencion_en_la_fuente.pdf',
            'DocTypeBankCertification': 'https://sherpa-images.s3.amazonaws.com/contrato/QA/certificacion_deposito_bajo_monto.pdf',
            'DocTypeBankStatement': 'https://sherpa-images.s3.amazonaws.com/contrato/QA/extracto_deposito_bajo_monto.pdf',
            'DocTypeTotalCosts': 'https://sherpa-images.s3.amazonaws.com/contrato/QA/costos_totales.pdf',
            'DOCTYPEGOODSTANDING_PS1': 'https://sherpa-images.s3.amazonaws.com/contrato/QA/paz_salvo_prestamo_salvavidas.pdf',
            'DOCTYPEGOODSTANDING_PS2': 'https://sherpa-images.s3.amazonaws.com/contrato/QA/paz_salvo_prestamo_paracaidas.pdf',
            'DOCTYPEGOODSTANDING_PS4': 'https://sherpa-images.s3.amazonaws.com/contrato/QA/paz_salvo_prestamo_propulsor.pdf',
            'DocTypeLoanAccountStatement_PS1': 'https://sherpa-images.s3.amazonaws.com/contrato/QA/estado_cuenta_prestamo_salvavidas.pdf',
            'DocTypeLoanAccountStatement_PS2': 'https://sherpa-images.s3.amazonaws.com/contrato/QA/estado_cuenta_prestamo_paracaidas.pdf',
            'DocTypeLoanAccountStatement_PS4': 'https://sherpa-images.s3.amazonaws.com/contrato/QA/estado_cuenta_prestamo_propulsor.pdf',
          },
          'savingsAccount': {
            'DocTypeRentDeclaration': 'https://sherpa-images.s3.amazonaws.com/contrato/QA/retencion_en_la_fuente_cuenta_ahorro.pdf',
            'DocTypeBankCertification': 'https://sherpa-images.s3.amazonaws.com/contrato/QA/certificacion_bancaria_cuenta_ahorros.pdf',
            'DocTypeBankStatement': 'https://sherpa-images.s3.amazonaws.com/contrato/QA/extracto_cuenta_ahorro.pdf',
            'DocTypeTotalCosts': 'https://sherpa-images.s3.amazonaws.com/contrato/QA/costos_totales.pdf',
            'DOCTYPEGOODSTANDING_PS1': 'https://sherpa-images.s3.amazonaws.com/contrato/QA/paz_salvo_prestamo_salvavidas.pdf',
            'DOCTYPEGOODSTANDING_PS2': 'https://sherpa-images.s3.amazonaws.com/contrato/QA/paz_salvo_prestamo_paracaidas.pdf',
            'DOCTYPEGOODSTANDING_PS4': 'https://sherpa-images.s3.amazonaws.com/contrato/QA/paz_salvo_prestamo_propulsor.pdf',
            'DocTypeLoanAccountStatement_PS1': 'https://sherpa-images.s3.amazonaws.com/contrato/QA/estado_cuenta_prestamo_salvavidas.pdf',
            'DocTypeLoanAccountStatement_PS2': 'https://sherpa-images.s3.amazonaws.com/contrato/QA/estado_cuenta_prestamo_paracaidas.pdf',
            'DocTypeLoanAccountStatement_PS4': 'https://sherpa-images.s3.amazonaws.com/contrato/QA/estado_cuenta_prestamo_propulsor.pdf',
          },
        }
    });
    return config;
});

/**
 * Provider que se encarga del manejo de cookies
 * @class cookieProvider
 * @module WebNequi
 */
angular.module('App')
    .factory('cookieProvider', [function(){

        var api = {
            setCookie: setCookie,
            getCookie : getCookie,
            eraseCookie: eraseCookie
        };

        return api;

        /**
         * Método para agregar una llave-valor de cookie
         * @method setCookie
         * @param {String} key llave de la cookie a guardar
         * @param {String or Boolean} value valor asociado a la llave a guardar
         * @param {Int} days numero de dias para expirar cookie
         * @private
         */
        function setCookie(key, value, days) {
            var expires = '',
                date = new Date();
            if (days) {
                date.setTime(date.getTime() + (days * 24 * 60 * 60 *1000));
                expires = '; expires=' + date.toGMTString();
            }
            document.cookie = String(key + '=' + value + expires + '; path=/');
        }

        /**
         * Método para obtener el valor de una llave dentro de las cookies
         * @method getCookie
         * @param {String} key llave de la cookie a obtener
         * @private
         */
        function getCookie(key) {
            var nameEQ = key + '=';
            var ca = document.cookie.split(';');
            for(var i=0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) === ' ') {
                    c = c.substring(1,c.length);
                }
                if (c.indexOf(nameEQ) === 0) {
                    return c.substring(nameEQ.length,c.length);
                }
            }
            return null;
        }

        /**
         * Método para borrar el valor de una llave dentro de las cookies
         * @method eraseCookie
         * @param {String} key llave de la cookie a borrar
         * @private
         */
        function eraseCookie(key) {
            setCookie(key,'',-1);
        }

}]);

/**
 * Provider que se encarga de realizar la comunicación con Google Analytics
 * @class googleAnalyticsProvider
 * @module WebNequi
 */
angular.module('App')
    .factory('googleAnalyticsProvider', ['$rootScope', function($rootScope){

        var api = {
            trackEvent : trackEvent
        },
        isDebuging = false;

        return api;

        /**
         * Método para trackear un evento en la web
         * @method trackEvent
         * @param {String} _category categoría del evento
         * @param {String} _action acción del evento
         * @param {String} [_label]
         * @param {String} [_value]
         * @public
         */
        function trackEvent(_category, _action, _label, _value) {
            var category = $rootScope.configCountry.prefix + ' ' + _category;

            if (typeof _label === 'undefined' || _label === null) {
                _label = '';
            }
            if (typeof _value === 'undefined' || _value === null) {
                _value = 0;
            }

            if(isDebuging){
                console.log('[Google Analytics] Tracked event. Category: '+_category+'. Action: '+_action+'. Label: '+_label+'. Value: '+_value);
                return;
            }

            ga('send', 'event', category, _action, _label, _value, {useBeacon: true});

        }

}]);

/**
 * Provider para el manejo de los mensajes
 * @author: hildebrando.rios
 * @date: 21.08.2015
 */
angular.module('App')
  .value('messagesProvider', {

    /**************
     * encabezado *
     **************/
    'general':{
      'faq':'Ayuda',
      'recharge':'RECARGAR',
      'blockAccount':'¡BLOQUEAR MI CUENTA!',
      'blockAccountTwo':'Bloquear cuenta',
      'cancel':'Cancelar',
      'okButton': 'ACEPTA',
      'back': 'Vuelve',
      'logout': 'SALIR',
      'undefinedResponse':'Respuesta indefinida'
    },

    'generalActions': {
      'ready': 'Listo'
    },

    'generalModals': {
      'imgError': '../images/mail-no.svg'
    },

    /*********************
     * Mensajes de error *
     *********************/
    'errorMessage': {

      /*/--------------
      Errores generales
      --------------/*/
      'general' : {
        'errorService': 'Tu cuenta de Nequi ha sido comprometida.',
      },
      'loadParameters': {
        'frequentQuestionsUrl': 'Error en la carga de la URL de Ayuda de la web Nequi'
      }

    },

    /* Textos de cabecera */
    'header':{
      'welcome': {
        'urlMyAccount': '/bdigital/private/#!/welcome',
        'myAccount': 'Tu Nequi',
        'faq':'Ayuda',
        'urlDocumentation':'/bdigital/private/#!/documentation',
        'documentation':'Certificados',
        'urlSetting': '',
        'setting': 'Configuración',
        'urlMovements': '',
        'movements': 'Mis movimientos',
        'recharge': 'Recarga',
        'back': 'Salir'
      }
    },

    'modal': {
      'sessionInvalidation': {
        'title': '¡Encontramos otra sesión en uso!',
        'text': 'Tienes tu sesión abierta en otro lugar.',
        'text2': 'Por seguridad, cerramos tu sesión.',
        'button': 'Listo',
        'img': '../images/icon-dumb-up.svg'
      },
      'sessionExpiration': {
        'title': 'ZZZZZZZZZZ...',
        'text': 'Tienes más de 5 minutos de inactividad.',
        'text2': '¡Llevas mucho tiempo sin moverte!, por seguridad cerramos tu sesión.',
        'button': 'Listo',
        'img': '../images/icon-dumb-up.svg'
      },
      'sendGoodStandingMail': {
        'title': 'Paz y salvo en tu correo',
        'text': 'Te enviamos al correo {email} tu paz y salvo. Si este no es tu correo, entra a tu app Nequi y cámbialo.',
        'button': 'Listo',
        'img': '../images/icon-dumb-up.svg'
      },
      'sendDocumentStateAccountMail': {
        'title': 'Estado de cuenta de tu crédito en tu correo',
        'text': 'Te enviamos al correo {email} el estado de cuenta de tu crédito. Si este no es tu correo, entra a tu app Nequi y cámbialo.',
        'button': 'Listo',
        'img': '../images/icon-dumb-up.svg'
      },
      'sendLoanStatementMail': {
        'title': 'Declaración de operaciones de Crédito en tu correo',
        'text': 'Te enviamos al correo {email} la declaración de operaciones de tu crédito. Si este no es tu correo, entra a tu app Nequi y cámbialo.',
        'button': 'Listo',
        'img': '../images/icon-dumb-up.svg'
      },
      'sendDocumentMail': {
        'title': 'Extracto en tu correo',
        'text': 'Te enviamos al correo {email} tu extracto Si este no es tu correo, entra a tu app Nequi y cámbialo.',
        'button': 'Listo',
        'img': '../images/icon-mail-send.svg'
      },
      'sendTotalCostMail': {
        'title': 'Reporte de costos totales en tu correo',
        'text': 'Te enviamos al correo {email} tu reporte de costos totales. Si este no es tu correo, entra a tu app Nequi y cámbialo.',
        'button': 'Listo',
        'img': '../images/icon-mail-send.svg'
      },
      'sendRentDeclaration': {
        'title': 'Retención en la fuente en tu correo',
        'text': 'Te enviamos al correo {email} tu retención en la fuente. Si este no es tu correo, entra a tu app Nequi y cámbialo.',
        'button': 'Listo',
        'img': '../images/icon-mail-send.svg'
      },
      'sendBankCertification': {
        'title': 'Certificación bancaria en tu correo',
        'text': 'Te enviamos al correo {email} tu certificación bancaria. Si este no es tu correo, entra a tu app Nequi y cámbialo.',
        'button': 'Listo',
        'img': '../images/icon-mail-send.svg'
      }
    },

    /*/---------------------*
     * Vistas de la app web *
     *---------------------/*/
    'views':{

      /************************
       * pagina de bienvenida *
       ************************/
      'welcome':{
        'introEmail':'Tu correo es',
        'titleBalance': 'Tu saldo',
        'spendBoundary':'Disponible',
        'pockets':'Bolsillos',
        'save':'Colchón',
        'goals':'Metas',
        'frozen':'Congelado',
        'card': 'Tarjeta Nequi',
        'balance':'Total',
        'titlePanic':'¡Pánico!',
        'titlePanic2':'¡Urgente!',
        'textButtons':'Cuéntanos qué necesitas hacer:',
        'messagePanic': 'Para bloquear tu cuenta por seguridad. Haz clic en el siguiente botón',
        'TopMessagePanic2': 'Eres lo más importante para nosotr@s y queremos que tu plata siempre esté segura en Nequi.',
        'btnPanic': 'Bloquear tu Nequi',
        'btnCancelCard': 'Cancelar tu Tarjeta',
        'lastSession': 'La última vez que usaste la App Nequi fue el {0} de {1} a las {2}:{3} {4}',
        'faqIntro': '¿Dudas? Resuelvelas antes de seguir adelante',
        'welcome':'Bienvenido',
        'introPhone':'LO QUE DEBES SABER SOBRE TU CUENTA',
        'infoPhone':'Tu cuenta es tu celular',
        'messagePhone':'Otro nequi puede enviarte plata usando tu número de celular.',
        'messageEmail':'Otro nequi puede enviarte plata usando también este email.',
        'introAccount':'Tu cuenta es también este número',
        'messageAccount':'Para recibir plata desde otro banco o que te depositen tu sueldo usa este número, por ejemplo para recargar nequi desde otro banco'
      },

      /*********************
       * pagina de bloqueo *
       *********************/
      'blockAccount': {
        'img': '../images/fire.svg',
        'cancelButton': 'CANCELAR BLOQUEO',
        'title': 'Bloquear cuenta',
        'panicMessage': '¿Quieres bloquear tu Nequi?',
        'accountInfoTitle': 'CUENTA A BLOQUEAR',
        'accountInfoCellphone': 'Celular asociado a la cuenta',
        'accountInfoMail': 'Correo electrónico asociado a la cuenta',
        'accountInfoNumber': 'Número de cuenta',
        'confirmationMessage': 'Hiciste clic en el botón de pánico, si continúas tu Nequi se bloqueará hasta que hagas reconocimiento facial o de voz.'
      },
      /*********************
       * pagina de bloqueo *
       *********************/
      'cancelCard': {
        'img': '../images/cancel-modal.svg',
        'title': 'Si, Cancelarla',
        'panicMessage': '¿Estás segur@?',
        'confirmationMessage': 'Al cancelar tu Tarjeta deberás volver a sacarla en la app de Nequi. Si tienes la Tarjeta digital y física se cancelaran las dos.'
      },

      /*******************
       * bloqueo exitoso *
       *******************/
      'blockAccountSuccess': {
        'title': '¡Nequi bloqueado!',
        'panicMessage': 'Para desbloquear tu Nequi debes ingresar desde la app.',
        'infoMessage': 'Al reactivar tu Nequi te tocará crear una nueva clave por seguridad.',
        'accountInfoCellphone': 'Celular asociado a la cuenta',
        'accountInfoMail': 'Correo electrónico asociado a la cuenta',
        'accountInfoNumber': 'Número de cuenta',
        'back': 'Listo',
      },

      /********************
       * error de bloqueo *
       ********************/
      'blockAccountFail': {
        'title': '¡Ouch!',
        'panicMessage': 'Lo sentimos, no hemos podido bloquear tu cuenta. ¡No hay problema! Inténtalo de nuevo.',
        'canGetUserDataMessage':'No se pudo cargar la información'
      },
      /*******************
       * cancel exitoso *
       *******************/
      'cancelCardSuccess': {
        'title': '¡Tarjeta Cancelada!',
        'panicMessage': 'Si quieres sacar una nueva Tarjeta, entra a la app de una.',
        'infoMessage':'Aquí encontrarás más info de tu Tarjeta Nequi y todo lo que puedes hacer con ella.',
        'back': 'Listo'
      },

      /********************
       * en proceso cancelar *
       ********************/
      'cancelCardRetry': {
        'title': '¡A un tris de cancelar tu Tarjeta!',
        'panicMessage': 'En este momento ni tu ni nadie más puede utilizar tu Tarjeta Nequi.',
        'infoMessage':'Recibirás un mensaje de texto cuando esté cancelada.'
      },

      /********************
       * error al cancelar *
       ********************/
      'cancelCardFail': {
        'title': 'Ups, algo salió mal :(',
        'infoMessage':'Tu Tarjeta aún no se canceló. Inténtalo de nuevo en un momento porfa.'
      }

    },

    /*****************
     * pie de pagina *
     *****************/
    'footer':{
      'linkGooglePlay':'https://play.google.com/store/apps/details?id=com.nequi.MobileApp&hl=es',
      'linkAppStore':'https://itunes.apple.com/co/app/nequi/id1075378688?mt=8',
      'linkPhone':'tel:3006000100',
      'linkMail':'mailto:escribe@nequi.co',
      'drawbacks':'¿TIENES INCONVENIENTES CON NEQUI?',
      'whatsappNumber':'300-600-01-00',
      'whatsappMessage':'Chatéanos',
      'callNumber':'300-600-01-00',
      'callMessage':'Llámanos',
      'emailAccount':'escribe@nequi.co',
      'emailMessage':'Escríbenos',
      'welcome': {
        'title1':  'Producto',
        'discover': 'Descubre',
        'merchant': 'Punto Nequi',
        'maps': 'Mapas',
        'security': 'Seguridad',
        'contact': 'Contacto',
        'title2': 'Soporte',
        'faq': 'Ayuda',
        'wpp': 'Whatsapp',
        'numWpp': '300 600 0100',
        'phone': 'Teléfono',
        'numPhone': '300 600 0100',
        'mail': 'Mail',
        'email': 'escribe@nequi.co',
        'attention': 'Horario de atención',
        'daysAttention': 'Lunes a Viernes',
        'hourAttention': '08:00 am a 06:00 pm',
        'title3': 'Descargas',
        'product': 'Características del producto',
        'terms': 'Condiciones de uso',
        'tyc': 'Términos y condiciones',
        'map': 'Mapa del sitio',
        'chat': 'Chatea con nosotros',
        'urlChat': 'https://www.nequi.com.co/chat/',
        'siguenos': 'Siguenos',
        'fb': 'Facebook',
        'tw': 'Twitter',
        'ins': 'Instagram'
      },
      'login': {
        'title1':  'Producto',
        'discover': 'Descubre',
        'merchant': 'Punto Nequi',
        'maps': 'Mapas',
        'security': 'Legales',
        'contact': 'Contacto',
        'title2': 'Descarga la App',
        'title3': 'Descargas',
        'title3_alt': 'Portales',
        'title4_alt': 'Contáctanos',
        'faq': 'Ayuda',
        'phone': 'Llámanos al: ',
        'mail': 'Mail',
        'attention': 'Horario de atención',
        'product': 'Características del producto',
        'terms': 'Condiciones de uso',
        'tyc': 'Términos y condiciones',
        'map': 'Mapa del sitio',
        'chat': 'Chatea con nosotros',
        'urlChat': 'https://www.nequi.com.co/chat/',
        'siguenos': 'Redes',
        'fb': 'Facebook',
        'tw': 'Twitter',
        'ins': 'Instagram',
        'you':'YouTube',
        'press':'Prensa'
      }
    },
    'externalLinks': {
      'pse': 'https://recarga.nequi.com.co/bdigitalpsl/#!/',
      'blogCo':'https://metidasdeplata.nequi.com.co/',
      'conectaCo':'https://conecta.nequi.com.co/'
    },

    'documentsType': {
      'type': [
        {
          'title': 'Estado de Cuenta',
          'description': 'Encuentra toda la información sobre tu crédito activo: número del crédito, monto solicitado, saldo pendiente, intereses, valor del seguro de vida, fecha de vencimiento, monto y fecha de las cuotas.',
          'select': [],
          'documentType': 'edc',
          'documentLoanType': 'DocTypeLoanAccountStatement'
        },
        {
          'title': 'Paz y salvo',
          'description': 'Generar el paz y salvo de los créditos que ya hayas cancelado durante el año que elegiste. Podrás seleccionar máximo 5 créditos',
          'select': [],
          'documentType': 'pys',
          'documentLoanType': 'DOCTYPEGOODSTANDING'
        }
      ]
    },

    /*************************
     * Interna Documentacion *
     *************************/
    'documentation': {
      'options': {
        'co': [
          {
            'title': 'Extractos',
            'description': '',
            'select': ['year', 'month'],
            'documentType': 'DocTypeBankStatement'
          },
          {
            'title': 'Certificación bancaria',
            'description': 'Aquí podrás descargar un certificado que tienes en Nequi.',
            'select': [],
            'documentType': 'DocTypeBankCertification'
          },
          {
            'title': 'Retención en la fuente',
            'description': 'Con el certificado tributario, puedes mostrarle a la DIAN los valores de tu Nequi durante el año seleccionado con el fin de construir tu declaración de renta.',
            'descriptionB': 'Nequi hace parte de Bancolombia, así que la información exógena que se reporta ante la DIAN aparece a nombre de Bancolombia.',
            'descriptionC': 'Recuerda que la información exógena es un reporte anual que las entidades financieras deben enviar a la DIAN sobre los productos que tienen sus clientes, como cuentas o saldos.',
            'descriptionD': 'El número que empieza por 870 es un identificador interno de tu cuenta Nequi (no es tu número de celular).',
            'descriptionE': 'Si no sabes cuál es, puedes verlo en tu certificado de cuenta.',
            'select': ['year'],
            'documentType': 'DocTypeRentDeclaration'
          },
          {
            'title': 'Reporte de costos totales',
            'description': 'Este reporte te muestra todos los costos que has pagado por tu Nequi y sus servicios asociados. Esto incluye comisiones, retenciones tributarias y cobros a terceros. Este reporte incluye todos los productos Nequi que hayas tenido y te lo generamos así hayas cerrado tu Nequi.',
            'select': ['year'],
            'documentType': 'DocTypeTotalCosts'
          },
          {
            'title': 'Certificado de Créditos',
            'description': '¿Qué certificado necesitas?',
            'documentType': 'DocTypeLoanCertificate',
            'select': ['loan', 'documents'],
            'children' : [
              {
                'title': 'Declaración de operaciones de Crédito',
                'description': 'Certifico que conforme a lo establecido en artículo 118-1 del Estatuto Tributario, modificado por la Ley 2010 del 27 de diciembre del 2019 y reglamentado por el  Decreto 761  del 29 de mayo de 2020, expedido por el Ministerio de Hacienda,  las operaciones de endeudamiento adquiridas en Nequi en el año para el cual se está solicitando el certificado no han sido asumidas por un tercero. Esta certificación se expide bajo la gravedad de juramento de conformidad con lo establecido en el parágrafo 2 del artículo 1 del Decreto 761 de mayo de 2020.',
                'select': ['year'],
                'documentType': 'DocLoanStatement'
              }
            ]
          }
        ],
        'pa': [
          {
            'title': 'Extractos',
            'description': '',
            'select': ['year', 'month'],
            'documentType': 'DocTypeBankStatement'
          },
          {
            'title': 'Certificación bancaria',
            'description': 'Aquí podrás descargar un certificado que tienes en Nequi.',
            'select': [],
            'documentType': 'DocTypeBankCertification'
          }
        ]
      },
      'buttons': {
        'send': 'Enviar',
        'generate': 'Generar',
        'download': 'Descargar',
        'swear': 'Certifico',
        'dontSwear': 'No Certifico'
      },
      'errors': {
        'generate': '¡Ups! tuvimos un problema para obtener tu documento ... porfa inténtalo de nuevo ;)',
        'codeCostTotal' :'11-69L',
        'loanAccountStatement': 'Solo podrás consultar los certificados para los créditos que tengas activos.',
        'loanGenerate': '¡Ups! tuvimos un problema para obtener la info... porfa inténtalo de nuevo ;)',
        'loanAccountPeaceAndSave': 'Solo podrás consultar los paz y salvo de los créditos que ya hayas cancelado durante el año que elegiste.',
        'totalCostsZero': 'Los costos asociados a tu cuenta Nequi en el #YEAR fueron de $0',
        'nequiCard': '¡Ups! Parece que no tienes ninguna tarjeta Nequi activa por ahora.',
        'movements': 'No tienes movimientos en este mes :('
      },
      'info':{
        'downloadDocInfo': 'Recuerda que puedes descargar tu certificado por el icono de impresora como formato PDF',
        'sendDocInfoP': 'Esta información llega a tu correo en Nequi, no debe ser generada por otros, ten en cuenta que nosotros no llamamos para validar tus datos.',
        'sendDocInfoB': 'Tu seguridad es lo más importante es por eso que lo debes descargar desde tu correo.',
        'sendDocInfoC': '¡Tu seguridad es nuestra prioridad! Enviaremos el documento a tu correo electrónico de forma encriptada. Para acceder, ingresa tu número de documento.',
        'soatInfoBold': 'Información Importante Pago de Servicios - Seguro SOAT.',
        'soatInfo': 'A partir del 15 de julio del 2024, cuando compres tu SOAT a través de la app Nequi, te cobraremos una tarifa de servicio del 1.5% sobre el valor del seguro. Mas info, ',
        'soatLabelLink': 'consulta aquí.',
        'soatLink': 'https://www.nequi.com.co/seguros-disponibles-en-nequi/soat-nequi',
        'paypal': {
          'important': 'IMPORTANTE:',
          'title': '¡La tarifa para traer tus dólares de PayPal a Nequi va cambiar a partir del 15 de septiembre de 2024!',
          'subtitle': 'Según la cantidad de USD que traigas, la comisión será así:',
          'table': {
            'header': ['Si traes:', 'La comisión será:'],
            'body':[
              { 'range': 'Entre 1-150 USD', 'commission': '7% + IVA de la comisión' },
              { 'range': 'Entre 151-300 USD', 'commission': '5% + IVA de la comisión' },
              { 'range': 'Entre 301-2000 USD', 'commission': '3,5% + IVA de la comisión' }
            ]
          }
        }
      }
    }

  });

/**
* Provider para centralizar la consulta de parámetros de la aplicación.
* @class parametersProvider
* @constructor
*/
angular.module('App')
    .service('parametersProvider',
    [ 'configProvider', '$rootScope',function (configProvider, $rootScope) {

     /**
     * Propiedad para almacenar el caché de los parámetros
     * @property paramsCache
     * @type Object
     */
    var paramsCache = {};
    
     /**
     * Método para obtener los parámetros
     * @method getParameters
     * @param {String} parameter Nombre del parámetro a buscar.
     * @param {Function} controllerCallback Función callback.
     * @public
     */
    this.getParameters = function (parameter, controllerCallback) {
        if(paramsCache.hasOwnProperty(parameter) && paramsCache[parameter].length !== 0) {
            if (typeof(controllerCallback) === 'function') {
                controllerCallback(paramsCache[parameter]);
            } 
        } else {
            getServiceParameter(parameter, controllerCallback);
        }
    };
    
     /**
     * Método privado para procesar las respuestas exitosas del llamado al procedimiento.
     * @method getParameterSuccess
     * @param {Object} response Objeto con la respuesta del servicio de parámetros.
     * @param {Function} controllerCallback Función callback.
     * @param {String} parameter Nombre del parámetro a buscar.
     * @async
     * @private
     */
    function getParameterSuccess(response, controllerCallback, parameter) {
        paramsCache[parameter] = response.data.parameter;
        if (typeof(controllerCallback) === 'function') {
            controllerCallback(paramsCache[parameter]);
        }
    }
    
     /**
     * Método privado para procesar las respuestas fallidas del llamado al procedimiento.
     * @method getParametersFail
     * @param {Object} error Objeto con la respuesta de error.
     * @param {Function} controllerCallback Función callback.
     * @async
     * @private
     */
    function getParametersFail(error, controllerCallback) {
        if (typeof(controllerCallback) === 'function') {
            controllerCallback(null);
        }        
    }
    
    /**
     * Método para llamar el servicio de los parámetros.
     * @method getServiceParameter
     * @param {String} parameter Nombre del parámetro a buscar.
     * @param {Function} controllerCallback Función callback.
     * @private
     */
     function getServiceParameter(parameter, controllerCallback) {                       
        $rootScope.jsonService(configProvider.typeRequest.post, configProvider.urlServices.getParameters, {id : parameter}, true)
            .then(function(response){
                getParameterSuccess(response, controllerCallback, parameter);
            }, function(error) {
                getParametersFail(error, controllerCallback);
            });
    }
        
}]);

/**
* Provider para publicar las funciones utilitarias de la aplicación
* @class popupProvider
* @constructor
* @module webNequi
*/

angular.module('App')
    .factory('popupProvider', ['$rootScope', 'configProvider', function($rootScope, configProvider){

    /**
     * Objeto para exponer interface publica del provider
     * @property self
     * @type object
     */
    var self = {
        open: open,
        close: close
    };

    /**
    * Metodo hace el emit para abrir el popup
    * @method open
    * @public
    */
    function open(data) {
        $rootScope.$emit('openPopupDirective', data);
    }

    /**
    * Metodo hace el emit para cerrar el popup
    * @method closePopupDirective
    * @public
    */
    function close() {
        $rootScope.$emit('closePopupDirective');
    }

    return self;

}]);

/**
* Provider para publicar las funciones utilitarias de la aplicación
* @class utilsProvider
* @constructor
* @module sherpa
*/

angular.module('App')
    .factory('utilsProvider', ['configProvider', function(configProvider){

    /**
     * Objeto para exponer interface publica del provider
     * @property self
     * @type object
     */
    var self = {
        validateNull: validateNull,
        createFormatString: createFormatString,
        getParameterByName: getParameterByName,
        encodeBase64: encodeBase64,
        decodeBase64: decodeBase64
    };

    self.formatRegex= new RegExp('{-?[0-9]+}', 'g');

    /**
    * Método para validar si una variable es nula o indefinida
    * @method validateNull
    * @param value {Object}
    * @private
    */
    function validateNull (value) {
        return typeof value !== 'undefined' && value !== null && value !== '';
    }

    /**
    * Método para crear un string mediante un string formateado
    * @method createFormatString
    * @param baseString {String} String base apartir del cual se forma el otro String
    * debe ser de la forma "She {1} {0}{2} by the {0}{3}. {-1}^_^{-2}"
    * @param repleacementWordsArray {Array} Arreglo de string con las palabras
    * a reemplazar ["sea", "sells", "shells", "shore"]
    * @public
    */
    function createFormatString(baseString, repleacementWordsArray) {

        return baseString.replace(self.formatRegex, function(item) {
            var intVal = parseInt(item.substring(1, item.length - 1));
            var replace;
            if (intVal >= 0) {
                replace = repleacementWordsArray[intVal];
            } else if (intVal === -1) {
                replace = '{';
            } else if (intVal === -2) {
                replace = '}';
            } else {
                replace = '';
            }
            return replace;
        });
    }

    /*
    * Metodo para extraer parametros de la url
    * @method getParameterByName
    * param [name] {String} nombre del parametro a extraer
    * param [url] {String} url a examinar o si se envia en blanco
    * se toma la url actual
    */
    function getParameterByName(name, url) {
        var regex,
            results;
        if (!url) {
            url = window.location.href;
        }
        name = name.replace(/[\[\]]/g, '\\$&');
        regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
        results = regex.exec(url);
        if (!results) {
            return null;
        }
        if (!results[2]) {
            return '';
        }
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }

    /**
     * Método para agregar una llave-valor de cookie
     * @method encodeBase64
     * @param {String} str String a transformar en base64
     * @private
     */
    function encodeBase64(str) {
        return window.btoa(unescape(encodeURIComponent(str)));
    }

    /**
     * Método para agregar una llave-valor de cookie
     * @method decodeBase64
     * @param {String} str String a decodificar de base64
     * @private
     */
    function decodeBase64(str) {
        return decodeURIComponent(escape(window.atob(str)));
    }

    return self;
}]);
