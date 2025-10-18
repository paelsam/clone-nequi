# Clone Nequi 

Este es un clon del sitio web de Nequi, completamente reestructurado para facilitar su despliegue en servicios de hosting estático. La nueva estructura elimina duplicaciones, centraliza recursos y organiza el código de manera más eficiente.

## Estructura del Proyecto

```
clone-nequi/
├── index.html                          # Página principal (Login)
├── private/
│   └── dashboard.html                  # Dashboard del área privada
├── assets/
│   ├── css/
│   │   ├── common/                     # Estilos compartidos
│   │   │   ├── normalize.css
│   │   │   ├── main.css
│   │   │   └── floating-labels.css
│   │   ├── public/                     # Estilos para páginas públicas
│   │   │   ├── nequi_one.webflow.css
│   │   │   └── nequi_two.webflow.css
│   │   └── private/                    # Estilos para área privada
│   │       ├── webflow.css
│   │       ├── lukkaflow.css
│   │       ├── fonts.css
│   │       └── main-private.css
│   ├── js/
│   │   ├── libs/                       # Librerías JavaScript centralizadas
│   │   │   ├── lodash.min.js
│   │   │   ├── restangular.min.js
│   │   │   ├── angular-recaptcha.min.js
│   │   │   ├── angular-no-captcha.js
│   │   │   ├── angular-input-masks-standalone.min.js
│   │   │   ├── string-mask.js
│   │   │   └── crypto/
│   │   │       ├── aes.js
│   │   │       ├── AesUtil.js
│   │   │       ├── md5.js
│   │   │       └── pbkdf2.js
│   │   ├── public/                     # Scripts para páginas públicas
│   │   │   └── scripts.js
│   │   └── private/                    # Scripts para área privada
│   │       └── scripts.js
│   ├── fonts/                          # Fuentes unificadas
│   │   ├── ionicons.eot
│   │   ├── ionicons.svg
│   │   ├── ionicons.ttf
│   │   ├── ionicons.woff
│   │   └── sherpafont.eot
│   └── images/                         # Imágenes centralizadas
│       ├── favicon.ico
│       ├── dynamic-key.png
│       ├── flag_colombia.png
│       └── flag_panama.png
└── views/
    ├── public/                         # Vistas públicas (header, footer, etc.)
    │   ├── header.html
    │   ├── footer.html
    │   ├── popupDirective.html
    │   └── directiveSelectCountry.html
    └── private/                        # Vistas del área privada
        ├── header.html
        ├── footer.html
        ├── welcome.html
        ├── busyIndicator.html
        ├── popupDirective.html
        └── spinner.html
```
