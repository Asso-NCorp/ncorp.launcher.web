# Configuration
$caPfx = "NCORP_ROOT_CA.pfx"
$caPassword = "F0ll0wM3%%%%%%%%!"
$domain = "launcher.n-lan.com"

# Extrait certificat et clé privée depuis ta Root CA .pfx
openssl pkcs12 -in $caPfx -nocerts -nodes -out ca.key -passin pass:$caPassword
openssl pkcs12 -in $caPfx -clcerts -nokeys -out ca.crt -passin pass:$caPassword

# Génère clé privée et CSR pour launcher.n-lan.com
openssl req -newkey rsa:4096 -sha256 -nodes `
    -keyout "${domain}.key" `
    -out "${domain}.csr" `
    -subj "/CN=${domain}"

# Fichier temporaire pour les extensions SAN
$sanExt = "subjectAltName=DNS:${domain},IP:127.0.0.1"
$tempExtFile = ".\san_ext.cnf"
Set-Content -Path $tempExtFile -Value $sanExt -Encoding ascii

# Signe le certificat avec ta CA extraite
openssl x509 -req `
    -in "${domain}.csr" `
    -CA ca.crt `
    -CAkey ca.key `
    -CAcreateserial `
    -days 825 `
    -sha256 `
    -extfile $tempExtFile `
    -out "${domain}.crt"

# Convertit en PEM et PFX sans mot de passe
openssl x509 -in "${domain}.crt" -out "${domain}.pem" -outform PEM
openssl pkcs12 -inkey "${domain}.key" -in "${domain}.crt" -export -out "${domain}.pfx" -passout pass:

# Netttoie les fichiers temporaires
Remove-Item $tempExtFile
Remove-Item ca.key
Remove-Item ca.crt
Remove-Item "${domain}.csr"


