# Clone Nequi - Proyecto Reestructurado

## 📋 Descripción

Este es un clon del sitio web de Nequi, completamente reestructurado para facilitar su despliegue en servicios de hosting estático. La nueva estructura elimina duplicaciones, centraliza recursos y organiza el código de manera más eficiente.

## 🏗️ Estructura del Proyecto

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

## ✨ Mejoras Implementadas

### 1. **Eliminación de Duplicados**
- ✅ Se eliminaron archivos CSS duplicados (`normalize.css`, `main.css`)
- ✅ Se consolidaron librerías JavaScript (`lodash.min.js`, `restangular.min.js`)
- ✅ Se unificaron fuentes e imágenes en una sola ubicación
- ✅ Se removió la estructura redundante `bdigital/bdigital/`

### 2. **Organización por Contexto**
- **Common**: Recursos compartidos entre público y privado
- **Public**: Recursos exclusivos para páginas públicas (login)
- **Private**: Recursos exclusivos para el área privada (dashboard)

### 3. **Rutas Actualizadas**
Todos los archivos HTML ahora usan rutas centralizadas:

**En `index.html` (público):**
```html
<link rel="stylesheet" href="assets/css/common/normalize.css">
<link rel="stylesheet" href="assets/css/public/nequi_one.webflow.css">
<script src="assets/js/libs/lodash.min.js"></script>
<script src="assets/js/public/scripts.js"></script>
```

**En `private/dashboard.html`:**
```html
<link rel="stylesheet" href="../assets/css/common/normalize.css">
<link rel="stylesheet" href="../assets/css/private/webflow.css">
<script src="../assets/js/libs/lodash.min.js"></script>
<script src="../assets/js/private/scripts.js"></script>
```

## 🚀 Despliegue

### Opción 1: Hosting Estático (Netlify, Vercel, GitHub Pages)

#### **Netlify**
1. Sube el proyecto completo a GitHub
2. Conecta tu repositorio a Netlify
3. Configura el deploy:
   - **Build command**: (dejar vacío)
   - **Publish directory**: `/`
4. Deploy automático

#### **Vercel**
1. Instala Vercel CLI: `npm i -g vercel`
2. Navega al directorio del proyecto
3. Ejecuta: `vercel`
4. Sigue las instrucciones

#### **GitHub Pages**
1. Sube el proyecto a GitHub
2. Ve a Settings > Pages
3. Selecciona la rama `main` y carpeta `/root`
4. Guarda y espera el despliegue

### Opción 2: Servidor Apache/Nginx

#### **Apache**
```apache
<VirtualHost *:80>
    ServerName tu-dominio.com
    DocumentRoot /var/www/clone-nequi
    
    <Directory /var/www/clone-nequi>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### **Nginx**
```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    root /var/www/clone-nequi;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

### Opción 3: Docker

Crea un `Dockerfile` en la raíz:
```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Construir y ejecutar:
```bash
docker build -t clone-nequi .
docker run -d -p 8080:80 clone-nequi
```

## 🔧 Configuración Adicional

### Variables de Entorno
Si necesitas configurar URLs de API, modifica los archivos:
- `assets/js/public/scripts.js`
- `assets/js/private/scripts.js`

### reCAPTCHA
El proyecto usa reCAPTCHA v2. Para actualizarlo:
1. Obtén tus claves en [Google reCAPTCHA](https://www.google.com/recaptcha/admin)
2. Reemplaza la clave en `index.html`:
   ```html
   key="'TU_SITE_KEY_AQUI'"
   data-sitekey="TU_SITE_KEY_AQUI"
   ```

## 📱 Testing Local

Puedes probar el sitio localmente con cualquier servidor HTTP:

**Python 3:**
```bash
python -m http.server 8000
```

**Node.js (http-server):**
```bash
npx http-server -p 8000
```

**PHP:**
```bash
php -S localhost:8000
```

Luego abre: `http://localhost:8000`

## 🔒 Seguridad

⚠️ **Importante**: Este es un clon frontend únicamente. Para producción:
- Implementa autenticación backend real
- No uses este sistema de login en producción sin un backend seguro
- Actualiza las claves de reCAPTCHA
- Configura HTTPS en tu servidor

## 📝 Notas Técnicas

- **Framework**: AngularJS 1.8.2
- **Librerías**: Lodash, Restangular, Angular reCAPTCHA
- **CSS Framework**: Webflow custom styles
- **Compatibilidad**: Navegadores modernos (Chrome, Firefox, Safari, Edge)

## 🤝 Contribuciones

Este proyecto es con fines educativos. Para contribuir:
1. Fork el repositorio
2. Crea una rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es solo para fines educativos y de demostración.

---

**Fecha de reestructuración**: Octubre 2025  
**Versión**: 2.0.0
