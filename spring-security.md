# Spring Security

- Si guardamos una sesión, en las siguientes requests el SecurityContextHolder intenta cargar los datos del usuario antes de realizar toda la cadena de filtros para autenticar
- Si se utiliza JWT, toda la info del usuario se almacena ahí, por lo tanto la sesión no se utiliza, ya que al utilizar JWT nuestra app es STATELESS
- El disable en el CSRF, se utiliza porque al crear una aplicacion REST, que no tiene ningun tipo de estado, la autenticacion se basa en la validacion del token JWT, y no recae en ningun tipo de cookies
- El cors() habilita CORS para las peticiones, por default habilita las peticiones desde cualquier sitio

