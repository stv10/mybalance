# Libreria IO Json Web Token

## Header
- Proporciona información sobre cómo se debe procesar el JWT. como metadata, tipo de token, algoritmo de encriptación, etc.
- La libreria los construye automáticamente, pero se pueden modificar si se desea.

## Payload
- Contiene la información que se quiere transmitir, como claims, roles, etc.
    - Content: si la información es un array de bytes, como imagenes o documentos
    - Claims: si la información es un objeto JSON,se guardan pares clave-valor

### Claims Standard
- Son claims predefinidos que se pueden utilizar en el payload
  - **issuer** (iss): entidad que emite el token
  - **subject** (sub): usuario del token
  - **audience** (aud): aplicacion o servicio a la cual esta destinado el token
  - **expiration** time (exp): Tiempo de expiración del token
  - **not before** (nbf): Tiempo en el que el token no debe ser aceptado antes de este tiempo
  - **issued at** (iat): Tiempo en el que el token fue emitido
  - **JWT ID** (jti): Identificador único del token

## Signature o Signed JWT

- Garantiza la integridad del token, ya que se firma con una clave secreta o privada.
- Se puede verificar si el token ha sido modificado o no.



